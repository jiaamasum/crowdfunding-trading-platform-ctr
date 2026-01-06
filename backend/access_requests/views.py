from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone

from .models import AccessRequest
from config.permissions import IsAdminRole
from audit.models import AuditLog
from notifications.models import Notification
from django.contrib.auth import get_user_model
from .serializers import AccessRequestSerializer, AccessRequestCreateSerializer


class AccessRequestListCreateView(generics.ListCreateAPIView):
    """List or create access requests."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        is_admin = (
            getattr(user, 'role', None) == 'ADMIN'
            or getattr(user, 'is_staff', False)
            or getattr(user, 'is_superuser', False)
        )
        if is_admin:
            status_filter = self.request.query_params.get('status')
            queryset = AccessRequest.objects.all()
            if status_filter:
                queryset = queryset.filter(status=status_filter)
            return queryset
        return AccessRequest.objects.filter(investor=user)
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AccessRequestCreateSerializer
        return AccessRequestSerializer

    def perform_create(self, serializer):
        access_request = serializer.save(investor=self.request.user)
        User = get_user_model()
        admins = User.objects.filter(role='ADMIN') | User.objects.filter(is_staff=True) | User.objects.filter(is_superuser=True)
        project_title = access_request.project.title
        for admin in admins.distinct():
            Notification.objects.create(
                user=admin,
                type='NEW_ACCESS_REQUEST',
                title='New access request',
                message=f"{access_request.investor.name} requested access to {project_title}.",
                related_id=str(access_request.id),
                related_type='access_request',
            )
        return access_request


class AccessRequestDetailView(generics.RetrieveAPIView):
    """Get access request details."""
    serializer_class = AccessRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        is_admin = (
            getattr(user, 'role', None) == 'ADMIN'
            or getattr(user, 'is_staff', False)
            or getattr(user, 'is_superuser', False)
        )
        if is_admin:
            return AccessRequest.objects.all()
        return AccessRequest.objects.filter(investor=user)


class AccessRequestDecideView(APIView):
    """Admin decide on access request (approve/reject/revoke)."""
    permission_classes = [IsAdminRole]
    
    def post(self, request, pk):
        try:
            access_request = AccessRequest.objects.get(pk=pk)
        except AccessRequest.DoesNotExist:
            return Response({'error': 'Access request not found'}, status=status.HTTP_404_NOT_FOUND)
        
        action = request.data.get('action')  # approve, reject, revoke
        admin_note = request.data.get('admin_note', '')
        
        if action == 'approve':
            access_request.status = 'APPROVED'
        elif action == 'reject':
            access_request.status = 'REJECTED'
        elif action == 'revoke':
            access_request.status = 'REVOKED'
        else:
            return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
        
        access_request.admin_note = admin_note
        access_request.decided_at = timezone.now()
        access_request.decided_by = request.user
        access_request.save()

        action_type = {
            'APPROVED': AuditLog.ActionType.ACCESS_REQUEST_APPROVED,
            'REJECTED': AuditLog.ActionType.ACCESS_REQUEST_REJECTED,
            'REVOKED': AuditLog.ActionType.ACCESS_REQUEST_REVOKED,
        }[access_request.status]
        AuditLog.objects.create(
            action_type=action_type,
            actor=request.user,
            target_type=AuditLog.TargetType.ACCESS_REQUEST,
            target_id=str(access_request.id),
            metadata={'status': access_request.status, 'admin_note': admin_note},
        )

        decision_title = {
            'APPROVED': 'Access approved',
            'REJECTED': 'Access rejected',
            'REVOKED': 'Access revoked',
        }[access_request.status]
        Notification.objects.create(
            user=access_request.investor,
            type=f"ACCESS_{access_request.status}",
            title=decision_title,
            message=f"Your access request for {access_request.project.title} was {access_request.status.lower()}.",
            related_id=str(access_request.project.id),
            related_type='project',
        )
        
        return Response(AccessRequestSerializer(access_request).data)

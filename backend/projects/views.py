from rest_framework import generics, permissions, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Q, F, FloatField, ExpressionWrapper, Case, When

from .models import Project, Favorite, Compare
from config.permissions import IsAdminRole
from audit.models import AuditLog
from notifications.models import Notification
from django.contrib.auth import get_user_model
from .serializers import (
    ProjectListSerializer, ProjectDetailSerializer, 
    ProjectCreateSerializer, FavoriteSerializer, FavoriteCreateSerializer,
    CompareSerializer, CompareCreateSerializer
)


class IsOwnerOrReadOnly(permissions.BasePermission):
    """Permission to only allow owners of an object to edit it."""
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.developer == request.user


class ProjectListCreateView(generics.ListCreateAPIView):
    """List all approved projects or create a new project."""
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'status']
    search_fields = ['title', 'short_description', 'description']
    ordering_fields = ['created_at', 'total_value', 'per_share_price_value', 'funding_progress_value', 'end_date']
    ordering = ['-created_at']
    
    def get_queryset(self):
        def is_admin(user):
            return user.is_authenticated and (
                getattr(user, 'role', None) == 'ADMIN'
                or getattr(user, 'is_staff', False)
                or getattr(user, 'is_superuser', False)
            )

        queryset = Project.objects.all().annotate(
            per_share_price_value=Case(
                When(total_shares__gt=0, then=ExpressionWrapper(F('total_value') / F('total_shares'), output_field=FloatField())),
                default=0,
                output_field=FloatField(),
            ),
            funding_progress_value=Case(
                When(total_shares__gt=0, then=ExpressionWrapper(F('shares_sold') * 100.0 / F('total_shares'), output_field=FloatField())),
                default=0,
                output_field=FloatField(),
            ),
        )
        user = self.request.user
        
        # Filter based on user role
        if not user.is_authenticated:
            queryset = queryset.filter(status='APPROVED')
        elif is_admin(user):
            queryset = queryset
        elif user.role == 'DEVELOPER':
            queryset = queryset.filter(Q(status='APPROVED') | Q(developer=user))
        else:  # INVESTOR
            queryset = queryset.filter(status='APPROVED')

        def parse_float(value):
            try:
                return float(value)
            except (TypeError, ValueError):
                return None

        def parse_int(value):
            try:
                return int(value)
            except (TypeError, ValueError):
                return None

        min_progress = parse_float(self.request.query_params.get('min_progress'))
        max_progress = parse_float(self.request.query_params.get('max_progress'))
        min_share_price = parse_float(self.request.query_params.get('min_share_price'))
        max_share_price = parse_float(self.request.query_params.get('max_share_price'))
        min_duration = parse_int(self.request.query_params.get('min_duration'))
        max_duration = parse_int(self.request.query_params.get('max_duration'))

        if min_progress is not None:
            queryset = queryset.filter(funding_progress_value__gte=min_progress)
        if max_progress is not None:
            queryset = queryset.filter(funding_progress_value__lte=max_progress)
        if min_share_price is not None:
            queryset = queryset.filter(per_share_price_value__gte=min_share_price)
        if max_share_price is not None:
            queryset = queryset.filter(per_share_price_value__lte=max_share_price)
        if min_duration is not None:
            queryset = queryset.filter(duration_days__gte=min_duration)
        if max_duration is not None:
            queryset = queryset.filter(duration_days__lte=max_duration)

        ordering = self.request.query_params.get('ordering')
        if ordering:
            ordering_map = {
                'per_share_price': 'per_share_price_value',
                '-per_share_price': '-per_share_price_value',
                'funding_progress': 'funding_progress_value',
                '-funding_progress': '-funding_progress_value',
            }
            queryset = queryset.order_by(ordering_map.get(ordering, ordering))

        return queryset
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ProjectCreateSerializer
        return ProjectListSerializer
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]
    
    def perform_create(self, serializer):
        serializer.save(developer=self.request.user)


class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a project."""
    queryset = Project.objects.all()
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return ProjectCreateSerializer
        return ProjectDetailSerializer


class ProjectSubmitView(APIView):
    """Submit a project for review."""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, pk):
        try:
            project = Project.objects.get(pk=pk, developer=request.user)
        except Project.DoesNotExist:
            return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if project.status not in ['DRAFT', 'NEEDS_CHANGES']:
            return Response(
                {'error': 'Project cannot be submitted in its current state'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        project.status = 'PENDING_REVIEW'
        project.submitted_at = timezone.now()
        project.save()

        User = get_user_model()
        admins = User.objects.filter(role='ADMIN') | User.objects.filter(is_staff=True) | User.objects.filter(is_superuser=True)
        for admin in admins.distinct():
            Notification.objects.create(
                user=admin,
                type=Notification.Type.PROJECT_SUBMITTED,
                title='Project submitted',
                message=f"{project.title} has been submitted for review.",
                related_id=str(project.id),
                related_type=Notification.RelatedType.PROJECT,
            )

        AuditLog.objects.create(
            action_type=AuditLog.ActionType.PROJECT_SUBMITTED,
            actor=request.user,
            target_type=AuditLog.TargetType.PROJECT,
            target_id=str(project.id),
            metadata={'status': project.status},
        )
        
        return Response(ProjectDetailSerializer(project, context={'request': request}).data)


class ProjectReviewView(APIView):
    """Admin review of a project."""
    permission_classes = [IsAdminRole]
    
    def post(self, request, pk):
        try:
            project = Project.objects.get(pk=pk)
        except Project.DoesNotExist:
            return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)
        
        action = request.data.get('action')  # approve, reject, request_changes
        review_note = request.data.get('review_note', '')
        
        if action == 'approve':
            project.status = 'APPROVED'
            project.start_date = timezone.now()
        elif action == 'reject':
            project.status = 'REJECTED'
        elif action == 'request_changes':
            project.status = 'NEEDS_CHANGES'
        else:
            return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
        
        project.reviewed_at = timezone.now()
        project.review_note = review_note
        project.save()

        action_type = {
            'approve': AuditLog.ActionType.PROJECT_APPROVED,
            'reject': AuditLog.ActionType.PROJECT_REJECTED,
            'request_changes': AuditLog.ActionType.PROJECT_UPDATED,
        }[action]
        AuditLog.objects.create(
            action_type=action_type,
            actor=request.user,
            target_type=AuditLog.TargetType.PROJECT,
            target_id=str(project.id),
            metadata={'status': project.status, 'review_note': review_note},
        )
        
        return Response(ProjectDetailSerializer(project, context={'request': request}).data)


class DeveloperProjectsView(generics.ListAPIView):
    """List projects for the authenticated developer."""
    serializer_class = ProjectListSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Project.objects.filter(developer=self.request.user)


class FavoriteListCreateView(generics.ListCreateAPIView):
    """List or add favorites."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return FavoriteCreateSerializer
        return FavoriteSerializer
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class FavoriteDeleteView(generics.DestroyAPIView):
    """Remove a favorite."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user)
    
    def delete(self, request, project_id):
        try:
            favorite = Favorite.objects.get(user=request.user, project_id=project_id)
            favorite.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Favorite.DoesNotExist:
            return Response({'error': 'Favorite not found'}, status=status.HTTP_404_NOT_FOUND)


class CompareListCreateView(generics.ListCreateAPIView):
    """List or add compare items."""
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Compare.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CompareCreateSerializer
        return CompareSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class CompareDeleteView(generics.DestroyAPIView):
    """Remove a compare item."""
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Compare.objects.filter(user=self.request.user)

    def delete(self, request, project_id):
        try:
            compare_item = Compare.objects.get(user=request.user, project_id=project_id)
            compare_item.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Compare.DoesNotExist:
            return Response({'error': 'Compare item not found'}, status=status.HTTP_404_NOT_FOUND)

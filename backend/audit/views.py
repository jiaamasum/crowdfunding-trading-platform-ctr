from rest_framework import generics, permissions
from django_filters.rest_framework import DjangoFilterBackend

from .models import AuditLog
from config.permissions import IsAdminRole
from .serializers import AuditLogSerializer


class AuditLogListView(generics.ListAPIView):
    """List audit logs (admin only)."""
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminRole]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['action_type', 'target_type', 'actor']

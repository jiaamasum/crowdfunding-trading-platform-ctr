from rest_framework import generics, permissions
from django_filters.rest_framework import DjangoFilterBackend

from .models import AuditLog, ProjectLedgerEntry
from config.permissions import IsAdminRole
from .serializers import AuditLogSerializer, ProjectLedgerSerializer


class AuditLogListView(generics.ListAPIView):
    """List audit logs (admin only)."""
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminRole]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['action_type', 'target_type', 'actor']


class ProjectLedgerListView(generics.ListAPIView):
    """List project ledger entries (admin only)."""
    queryset = ProjectLedgerEntry.objects.select_related('project', 'actor')
    serializer_class = ProjectLedgerSerializer
    permission_classes = [IsAdminRole]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['entry_type', 'project', 'actor']

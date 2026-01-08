from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import AuditLog, ProjectLedgerEntry

User = get_user_model()


class AuditLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source='actor.name', read_only=True)
    actor_role = serializers.CharField(source='actor.role', read_only=True)
    target_name = serializers.SerializerMethodField()
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'action_type', 'actor', 'actor_name', 'actor_role',
            'target_type', 'target_id', 'target_name', 'metadata', 'created_at'
        ]

    def get_target_name(self, obj):
        metadata = obj.metadata or {}
        return metadata.get('project_name') or metadata.get('target_name')


class ProjectLedgerSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source='actor.name', read_only=True)
    project_name = serializers.CharField(source='project.title', read_only=True)

    class Meta:
        model = ProjectLedgerEntry
        fields = [
            'id', 'entry_type', 'project', 'project_name',
            'actor', 'actor_name', 'metadata', 'created_at'
        ]

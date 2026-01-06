from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import AuditLog

User = get_user_model()


class AuditLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source='actor.name', read_only=True)
    actor_role = serializers.CharField(source='actor.role', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'action_type', 'actor', 'actor_name', 'actor_role',
            'target_type', 'target_id', 'metadata', 'created_at'
        ]

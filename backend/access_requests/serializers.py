from rest_framework import serializers
from django.db import IntegrityError
from django.contrib.auth import get_user_model
from .models import AccessRequest

User = get_user_model()


class AccessRequestSerializer(serializers.ModelSerializer):
    investor_name = serializers.CharField(source='investor.name', read_only=True)
    investor_email = serializers.CharField(source='investor.email', read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)
    decided_by_name = serializers.CharField(source='decided_by.name', read_only=True)
    
    class Meta:
        model = AccessRequest
        fields = [
            'id', 'investor', 'investor_name', 'investor_email',
            'project', 'project_title', 'status', 'message', 'admin_note',
            'created_at', 'updated_at', 'decided_at', 'decided_by', 'decided_by_name'
        ]
        read_only_fields = ['id', 'investor', 'status', 'admin_note', 'created_at', 'updated_at', 'decided_at', 'decided_by']


class AccessRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccessRequest
        fields = ['project', 'message']
    
    def validate_project(self, value):
        if not value.has_restricted_fields:
            raise serializers.ValidationError('Project has no restricted content')
        return value

    def validate(self, attrs):
        request = self.context.get('request')
        if not request or not request.user:
            return attrs

        if request.user.role != 'INVESTOR':
            raise serializers.ValidationError('Only investors can request access')

        project = attrs.get('project')
        if project and AccessRequest.objects.filter(investor=request.user, project=project).exists():
            raise serializers.ValidationError('Access request already exists')

        return attrs
    
    def create(self, validated_data):
        try:
            return AccessRequest.objects.create(**validated_data)
        except IntegrityError:
            raise serializers.ValidationError('Access request already exists')

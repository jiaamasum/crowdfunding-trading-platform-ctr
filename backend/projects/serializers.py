from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Project, ProjectImage, Favorite, Compare, ProjectEditRequest
from investments.models import Investment

User = get_user_model()


class ProjectImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectImage
        fields = ['id', 'image_url', 'order']


class ProjectListSerializer(serializers.ModelSerializer):
    """Serializer for project list view."""
    developer_id = serializers.IntegerField(source='developer.id', read_only=True)
    developer_name = serializers.CharField(source='developer.name', read_only=True)
    per_share_price = serializers.FloatField(read_only=True)
    remaining_shares = serializers.IntegerField(read_only=True)
    funding_progress = serializers.FloatField(read_only=True)
    thumbnail_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = [
            'id', 'title', 'short_description', 'category', 'status',
            'developer_id', 'developer_name', 'total_value', 'total_shares', 'shares_sold',
            'per_share_price', 'remaining_shares', 'funding_progress',
            'duration_days', 'start_date', 'end_date', 'thumbnail_url',
            'has_3d_model', 'is_3d_public', 'created_at'
        ]

    def get_thumbnail_url(self, obj):
        if obj.thumbnail_url:
            return obj.thumbnail_url
        first_image = obj.images.order_by('order').first()
        return first_image.image_url if first_image else None


class ProjectDetailSerializer(serializers.ModelSerializer):
    """Serializer for project detail view."""
    developer_id = serializers.IntegerField(source='developer.id', read_only=True)
    developer_name = serializers.CharField(source='developer.name', read_only=True)
    per_share_price = serializers.FloatField(read_only=True)
    remaining_shares = serializers.IntegerField(read_only=True)
    funding_progress = serializers.FloatField(read_only=True)
    images = ProjectImageSerializer(many=True, read_only=True)
    
    # Restricted fields - conditionally shown
    restricted_fields = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = [
            'id', 'title', 'description', 'short_description', 'category', 'status',
            'developer_id', 'developer_name',
            'total_value', 'total_shares', 'shares_sold',
            'per_share_price', 'remaining_shares', 'funding_progress',
            'duration_days', 'start_date', 'end_date',
            'thumbnail_url', 'images', 'has_3d_model', 'model_3d_url', 'is_3d_public',
            'has_restricted_fields', 'restricted_fields',
            'created_at', 'updated_at', 'submitted_at', 'reviewed_at', 'review_note'
        ]
    
    def get_restricted_fields(self, obj):
        if not obj.has_restricted_fields:
            return None
        
        # Check if user has access
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        
        user = request.user
        # Developer owner, admin, or approved access request
        if user == obj.developer or user.role == 'ADMIN' or getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False):
            return {
                'financial_projections': obj.financial_projections,
                'business_plan': obj.business_plan,
                'team_details': obj.team_details,
                'legal_documents': obj.legal_documents,
                'risk_assessment': obj.risk_assessment,
            }
        
        # Allow investors with completed/processing investments to view restricted data
        has_investment_access = Investment.objects.filter(
            investor=user,
            project=obj,
            status__in=[Investment.Status.PROCESSING, Investment.Status.COMPLETED],
        ).exists()

        if has_investment_access:
            return {
                'financial_projections': obj.financial_projections,
                'business_plan': obj.business_plan,
                'team_details': obj.team_details,
                'legal_documents': obj.legal_documents,
                'risk_assessment': obj.risk_assessment,
            }

        # Check for approved access request
        has_access = obj.access_requests.filter(
            investor=user, status='APPROVED'
        ).exists()
        
        if has_access:
            return {
                'financial_projections': obj.financial_projections,
                'business_plan': obj.business_plan,
                'team_details': obj.team_details,
                'legal_documents': obj.legal_documents,
                'risk_assessment': obj.risk_assessment,
            }
        
        return None


class ProjectCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a project."""
    images = serializers.ListField(
        child=serializers.URLField(),
        required=False,
        write_only=True
    )
    
    class Meta:
        model = Project
        fields = [
            'id',
            'title', 'description', 'short_description', 'category',
            'total_value', 'total_shares', 'duration_days',
            'thumbnail_url', 'images', 'has_3d_model', 'model_3d_url', 'is_3d_public',
            'has_restricted_fields', 'financial_projections', 'business_plan',
            'team_details', 'legal_documents', 'risk_assessment',
            'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'status', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        images = validated_data.pop('images', [])
        if images and not validated_data.get('thumbnail_url'):
            validated_data['thumbnail_url'] = images[0]
        project = Project.objects.create(**validated_data)
        
        for order, image_url in enumerate(images):
            ProjectImage.objects.create(
                project=project,
                image_url=image_url,
                order=order
            )
        
        return project

    def update(self, instance, validated_data):
        images = validated_data.pop('images', None)

        if images is not None and images and not validated_data.get('thumbnail_url'):
            validated_data['thumbnail_url'] = images[0]

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if images is not None:
            instance.images.all().delete()
            for order, image_url in enumerate(images):
                ProjectImage.objects.create(
                    project=instance,
                    image_url=image_url,
                    order=order
                )

        return instance


class FavoriteSerializer(serializers.ModelSerializer):
    project = ProjectListSerializer(read_only=True)
    
    class Meta:
        model = Favorite
        fields = ['id', 'project', 'created_at']


class FavoriteCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Favorite
        fields = ['project']


class CompareSerializer(serializers.ModelSerializer):
    project = ProjectListSerializer(read_only=True)

    class Meta:
        model = Compare
        fields = ['id', 'project', 'created_at']


class CompareCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Compare
        fields = ['project']


class ProjectEditRequestSerializer(serializers.ModelSerializer):
    project_title = serializers.CharField(source='project.title', read_only=True)
    requested_by_name = serializers.CharField(source='requested_by.name', read_only=True)

    class Meta:
        model = ProjectEditRequest
        fields = [
            'id', 'project', 'project_title', 'requested_by', 'requested_by_name',
            'changes', 'status', 'review_note', 'created_at', 'reviewed_at', 'reviewed_by',
        ]
        read_only_fields = ['id', 'status', 'created_at', 'reviewed_at', 'reviewed_by']

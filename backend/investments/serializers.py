from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Investment, Payment

User = get_user_model()


class InvestmentSerializer(serializers.ModelSerializer):
    investor_name = serializers.CharField(source='investor.name', read_only=True)
    investor_email = serializers.CharField(source='investor.email', read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)
    
    class Meta:
        model = Investment
        fields = [
            'id', 'investor', 'investor_name', 'investor_email',
            'project', 'project_title', 'shares', 'price_per_share',
            'total_amount', 'status', 'created_at', 'completed_at'
        ]
        read_only_fields = ['id', 'investor', 'price_per_share', 'total_amount', 'status', 'created_at', 'completed_at']


class InvestmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Investment
        fields = ['id', 'project', 'shares', 'price_per_share', 'total_amount', 'status', 'created_at']
        read_only_fields = ['id', 'price_per_share', 'total_amount', 'status', 'created_at']
    
    def validate(self, attrs):
        project = attrs['project']
        shares = attrs['shares']
        
        if project.status != 'APPROVED':
            raise serializers.ValidationError({'project': 'Cannot invest in unapproved project'})
        
        if shares > project.remaining_shares:
            raise serializers.ValidationError({'shares': f'Only {project.remaining_shares} shares available'})
        
        if shares <= 0:
            raise serializers.ValidationError({'shares': 'Must purchase at least 1 share'})
        
        return attrs
    
    def create(self, validated_data):
        project = validated_data['project']
        shares = validated_data['shares']
        
        investment = Investment.objects.create(
            investor=self.context['request'].user,
            project=project,
            shares=shares,
            price_per_share=project.per_share_price,
            total_amount=shares * project.per_share_price,
            status='PENDING'
        )
        
        return investment


class PaymentSerializer(serializers.ModelSerializer):
    investor_name = serializers.CharField(source='investor.name', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'transaction_id', 'investor', 'investor_name',
            'investment', 'amount', 'status', 'payment_method',
            'created_at', 'processed_at'
        ]
        read_only_fields = ['id', 'transaction_id', 'investor', 'created_at', 'processed_at']

from rest_framework import serializers
from django.contrib.auth import get_user_model

from .validators import validate_supabase_password

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user data."""
    name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'name', 'first_name', 'last_name',
            'role', 'is_verified', 'avatar_url', 'date_joined'
        ]
        read_only_fields = ['id', 'date_joined', 'is_verified']
    
    def get_name(self, obj):
        return obj.name


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)
    name = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = ['email', 'password', 'password_confirm', 'name', 'role']
    
    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password_confirm'):
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match'})
        return attrs

    def validate_password(self, value):
        validate_supabase_password(value)
        return value
    
    def create(self, validated_data):
        name = validated_data.pop('name', '')
        name_parts = name.split(' ', 1)
        first_name = name_parts[0] if name_parts else ''
        last_name = name_parts[1] if len(name_parts) > 1 else ''
        
        user = User.objects.create_user(
            email=validated_data['email'],
            username=validated_data['email'],  # Use email as username
            password=validated_data['password'],
            role=validated_data.get('role', User.Role.INVESTOR),
            first_name=first_name,
            last_name=last_name,
        )
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile."""
    name = serializers.CharField(required=False)
    
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'name', 'avatar_url']
    
    def update(self, instance, validated_data):
        name = validated_data.pop('name', None)
        if name:
            name_parts = name.split(' ', 1)
            validated_data['first_name'] = name_parts[0]
            validated_data['last_name'] = name_parts[1] if len(name_parts) > 1 else ''
        return super().update(instance, validated_data)


class LoginRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class TokenPairSerializer(serializers.Serializer):
    access = serializers.CharField()
    refresh = serializers.CharField()


class SupabaseTokenPairSerializer(serializers.Serializer):
    access_token = serializers.CharField()
    refresh_token = serializers.CharField()


class LoginResponseSerializer(serializers.Serializer):
    detail = serializers.CharField()
    user = UserSerializer()
    tokens = TokenPairSerializer()
    supabase = SupabaseTokenPairSerializer()


class RegisterRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)
    name = serializers.CharField(required=False)
    role = serializers.CharField(required=False)
    redirect_to = serializers.URLField(required=False)


class RegisterResponseSerializer(serializers.Serializer):
    detail = serializers.CharField()
    user = UserSerializer(allow_null=True)
    tokens = TokenPairSerializer(required=False)
    supabase = SupabaseTokenPairSerializer(required=False)
    requires_verification = serializers.BooleanField()


class SupabaseExchangeRequestSerializer(serializers.Serializer):
    access_token = serializers.CharField()
    refresh_token = serializers.CharField(required=False, allow_null=True, allow_blank=True)


class SupabaseExchangeResponseSerializer(serializers.Serializer):
    detail = serializers.CharField()
    user = UserSerializer()
    tokens = TokenPairSerializer()
    supabase = SupabaseTokenPairSerializer()


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()
    redirect_to = serializers.URLField(required=False)


class PasswordUpdateRequestSerializer(serializers.Serializer):
    access_token = serializers.CharField()
    password = serializers.CharField(write_only=True)


class ResendConfirmationRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()
    redirect_to = serializers.URLField(required=False)

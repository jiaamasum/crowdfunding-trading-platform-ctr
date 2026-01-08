import json
import logging
from rest_framework import generics, permissions, status, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.conf import settings
from django.utils import timezone

from drf_spectacular.utils import extend_schema, OpenApiResponse
from .serializers import (
    LoginRequestSerializer,
    LoginResponseSerializer,
    PasswordResetRequestSerializer,
    PasswordUpdateRequestSerializer,
    RegisterRequestSerializer,
    RegisterResponseSerializer,
    ResendConfirmationRequestSerializer,
    SupabaseExchangeRequestSerializer,
    SupabaseExchangeResponseSerializer,
    UserSerializer,
    UserRegistrationSerializer,
    UserUpdateSerializer,
    WalletSerializer,
)
from .supabase_service import (
    SupabaseAuthError,
    build_oauth_url,
    get_user as supabase_get_user,
    recover_password,
    resend_signup,
    sign_in_with_password,
    sign_up,
    update_user_metadata,
    update_password,
)
from .validators import validate_supabase_password
from config.permissions import IsAdminRole
from investments.models import Investment
from investments.utils import apply_investment_action, get_or_create_wallet
from audit.models import AuditLog
from notifications.models import Notification

User = get_user_model()
logger = logging.getLogger(__name__)


def _parse_supabase_error(error_text: str) -> str:
    try:
        payload = json.loads(error_text)
    except json.JSONDecodeError:
        return error_text

    if isinstance(payload, dict):
        return payload.get('msg') or payload.get('error_description') or payload.get('error') or error_text
    return error_text


def _sync_user_from_supabase(user_payload: dict) -> User:
    email = user_payload.get('email')
    if not email:
        raise ValueError('Supabase user payload missing email')

    user_metadata = user_payload.get('user_metadata') or {}
    app_metadata = user_payload.get('app_metadata') or {}
    name = user_metadata.get('name') or user_metadata.get('full_name') or ''
    name_parts = name.split(' ', 1)
    first_name = name_parts[0] if name_parts else ''
    last_name = name_parts[1] if len(name_parts) > 1 else ''
    role = user_metadata.get('role') or app_metadata.get('role') or User.Role.INVESTOR
    is_verified = bool(user_payload.get('email_confirmed_at') or user_payload.get('confirmed_at'))
    avatar_url = user_metadata.get('avatar_url')

    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            'username': email,
            'first_name': first_name,
            'last_name': last_name,
            'role': role,
            'is_verified': is_verified,
            'avatar_url': avatar_url,
        },
    )

    if created:
        user.set_unusable_password()
        user.save(update_fields=['password'])
        return user

    updated = False
    if user.first_name != first_name:
        user.first_name = first_name
        updated = True
    if user.last_name != last_name:
        user.last_name = last_name
        updated = True
    if role and user.role != role:
        user.role = role
        updated = True
    if avatar_url and user.avatar_url != avatar_url:
        user.avatar_url = avatar_url
        updated = True
    if is_verified and not user.is_verified:
        user.is_verified = True
        updated = True

    if updated:
        user.save()
    return user


class RegisterView(generics.CreateAPIView):
    """User registration endpoint (Supabase-backed)."""
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        request=RegisterRequestSerializer,
        responses={201: RegisterResponseSerializer, 400: OpenApiResponse(description='Bad request')},
    )
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        redirect_to = request.data.get('redirect_to') or f"{settings.FRONTEND_URL}/auth/callback"

        try:
            response = sign_up({
                'email': data['email'],
                'password': data['password'],
                'data': {
                    'name': data.get('name') or '',
                    'full_name': data.get('name') or '',
                    'role': data.get('role', User.Role.INVESTOR),
                },
                'redirect_to': redirect_to,
            })
        except SupabaseAuthError as exc:
            return Response({'detail': _parse_supabase_error(str(exc))}, status=status.HTTP_400_BAD_REQUEST)

        supabase_user = response.get('user')
        user = _sync_user_from_supabase(supabase_user) if supabase_user else None
        session = response.get('session') or {}
        access_token = session.get('access_token') or response.get('access_token')
        refresh_token = session.get('refresh_token') or response.get('refresh_token')

        if access_token and refresh_token and user:
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'detail': 'Registration successful',
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                },
                'requires_verification': False,
            }, status=status.HTTP_201_CREATED)

        return Response({
            'user': UserSerializer(user).data if user else None,
            'detail': 'Verification email sent',
            'requires_verification': True,
        }, status=status.HTTP_201_CREATED)


class SupabaseLoginView(APIView):
    """Supabase-backed login endpoint."""
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        request=LoginRequestSerializer,
        responses={200: LoginResponseSerializer, 400: OpenApiResponse(description='Invalid credentials')},
    )
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response({'detail': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            response = sign_in_with_password(email=email, password=password)
        except SupabaseAuthError as exc:
            return Response({'detail': _parse_supabase_error(str(exc))}, status=status.HTTP_400_BAD_REQUEST)

        supabase_user = response.get('user')
        user = _sync_user_from_supabase(supabase_user) if supabase_user else None
        if not user:
            return Response({'detail': 'Unable to sync user'}, status=status.HTTP_400_BAD_REQUEST)

        refresh = RefreshToken.for_user(user)
        return Response({
            'detail': 'Login successful',
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
        }, status=status.HTTP_200_OK)


class SupabaseOAuthUrlView(APIView):
    """Return Supabase OAuth URL for a provider."""
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        responses={200: OpenApiResponse(description='OAuth URL returned')},
    )
    def get(self, request, provider):
        redirect_to = request.query_params.get('redirect_to') or f"{settings.FRONTEND_URL}/auth/callback"
        url = build_oauth_url(provider, redirect_to)
        return Response({'auth_url': url}, status=status.HTTP_200_OK)


class SupabaseExchangeView(APIView):
    """Exchange Supabase session tokens for local tokens."""
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        request=SupabaseExchangeRequestSerializer,
        responses={200: SupabaseExchangeResponseSerializer, 400: OpenApiResponse(description='Invalid tokens')},
    )
    def post(self, request):
        access_token = request.data.get('access_token')
        refresh_token = request.data.get('refresh_token')

        if not access_token:
            return Response({'detail': 'access_token is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            supabase_user = supabase_get_user(access_token)
        except SupabaseAuthError as exc:
            return Response({'detail': _parse_supabase_error(str(exc))}, status=status.HTTP_400_BAD_REQUEST)

        user = _sync_user_from_supabase(supabase_user)
        refresh = RefreshToken.for_user(user)

        return Response({
            'user': UserSerializer(user).data,
            'detail': 'Session exchange successful',
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
        }, status=status.HTTP_200_OK)


class SupabasePasswordResetView(APIView):
    """Trigger Supabase password reset email."""
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        request=PasswordResetRequestSerializer,
        responses={200: OpenApiResponse(description='Password reset email sent'), 400: OpenApiResponse(description='Invalid email')},
    )
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'detail': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

        redirect_to = request.data.get('redirect_to') or f"{settings.FRONTEND_URL}/auth/reset-password"

        try:
            recover_password(email, redirect_to)
        except SupabaseAuthError as exc:
            return Response({'detail': _parse_supabase_error(str(exc))}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'detail': 'Password reset email sent'}, status=status.HTTP_200_OK)


class SupabasePasswordUpdateView(APIView):
    """Update password using Supabase recovery token."""
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        request=PasswordUpdateRequestSerializer,
        responses={200: OpenApiResponse(description='Password updated'), 400: OpenApiResponse(description='Invalid token or password')},
    )
    def post(self, request):
        access_token = request.data.get('access_token')
        password = request.data.get('password')
        if not access_token or not password:
            return Response({'detail': 'access_token and password are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            validate_supabase_password(password)
        except serializers.ValidationError as exc:
            return Response({'password': exc.detail}, status=status.HTTP_400_BAD_REQUEST)

        try:
            update_password(access_token, password)
        except SupabaseAuthError as exc:
            return Response({'detail': _parse_supabase_error(str(exc))}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'detail': 'Password updated'}, status=status.HTTP_200_OK)


class SupabaseResendConfirmationView(APIView):
    """Resend Supabase confirmation email."""
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        request=ResendConfirmationRequestSerializer,
        responses={200: OpenApiResponse(description='Confirmation email sent'), 400: OpenApiResponse(description='Invalid email')},
    )
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'detail': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

        redirect_to = request.data.get('redirect_to') or f"{settings.FRONTEND_URL}/auth/callback"

        try:
            resend_signup(email, redirect_to)
        except SupabaseAuthError as exc:
            return Response({'detail': _parse_supabase_error(str(exc))}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'detail': 'Confirmation email sent'}, status=status.HTTP_200_OK)


class MeView(generics.RetrieveUpdateAPIView):
    """Get or update current user profile."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return UserSerializer
        return UserUpdateSerializer
    
    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        partial = kwargs.get('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        supabase_token = request.data.get('supabase_access_token') or request.headers.get('X-Supabase-Access-Token')
        if supabase_token:
            try:
                update_user_metadata(
                    supabase_token,
                    {
                        'name': instance.name,
                        'full_name': instance.name,
                        'avatar_url': instance.avatar_url,
                    },
                )
            except SupabaseAuthError:
                logger.exception('Failed to sync user metadata to Supabase for user %s', instance.id)

        return Response(serializer.data)


class WalletDetailView(generics.RetrieveAPIView):
    """Get current user wallet and transactions."""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = WalletSerializer

    def get_object(self):
        return get_or_create_wallet(self.request.user)


class LogoutView(APIView):
    """Logout and blacklist refresh token."""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({'detail': 'Successfully logged out'}, status=status.HTTP_200_OK)
        except Exception:
            return Response({'detail': 'Logout successful'}, status=status.HTTP_200_OK)


class UserListView(generics.ListAPIView):
    """List all users (admin only)."""
    serializer_class = UserSerializer
    permission_classes = [IsAdminRole]
    pagination_class = None
    
    def get_queryset(self):
        queryset = User.objects.all()
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
        return queryset


class UserDetailView(generics.RetrieveUpdateAPIView):
    """Get or update a specific user (admin only)."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminRole]


class BanUserView(APIView):
    """Ban a user and optionally resolve investments."""
    permission_classes = [IsAdminRole]

    def post(self, request, pk):
        try:
            target_user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        resolution = request.data.get('resolution')  # refund, withdraw, reverse
        investments = Investment.objects.filter(investor=target_user).exclude(
            status__in=[
                Investment.Status.CANCELLED,
                Investment.Status.REFUNDED,
                Investment.Status.WITHDRAWN,
                Investment.Status.REVERSED,
                Investment.Status.REJECTED,
                Investment.Status.EXPIRED,
            ]
        )

        if investments.exists() and resolution not in ['refund', 'withdraw', 'reverse']:
            return Response(
                {'detail': 'Resolve investments before banning', 'required_resolution': True},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if resolution in ['refund', 'withdraw', 'reverse']:
            for investment in investments:
                apply_investment_action(investment, resolution, actor=request.user)

        remaining = Investment.objects.filter(investor=target_user).exclude(
            status__in=[
                Investment.Status.CANCELLED,
                Investment.Status.REFUNDED,
                Investment.Status.WITHDRAWN,
                Investment.Status.REVERSED,
                Investment.Status.REJECTED,
                Investment.Status.EXPIRED,
            ]
        )
        if remaining.exists():
            return Response(
                {'detail': 'User still has active investments; cannot ban'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        target_user.is_banned = True
        target_user.banned_at = timezone.now()
        target_user.save(update_fields=['is_banned', 'banned_at'])

        AuditLog.objects.create(
            action_type=AuditLog.ActionType.USER_BANNED,
            actor=request.user,
            target_type=AuditLog.TargetType.USER,
            target_id=str(target_user.id),
            metadata={'email': target_user.email, 'target_name': target_user.name},
        )
        Notification.objects.create(
            user=target_user,
            type='USER_BANNED',
            title='Account restricted',
            message='Your account has been restricted from investing actions.',
            related_id=str(target_user.id),
            related_type='user',
        )

        return Response(UserSerializer(target_user).data, status=status.HTTP_200_OK)


class UnbanUserView(APIView):
    """Unban a user."""
    permission_classes = [IsAdminRole]

    def post(self, request, pk):
        try:
            target_user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        target_user.is_banned = False
        target_user.banned_at = None
        target_user.save(update_fields=['is_banned', 'banned_at'])

        AuditLog.objects.create(
            action_type=AuditLog.ActionType.USER_UNBANNED,
            actor=request.user,
            target_type=AuditLog.TargetType.USER,
            target_id=str(target_user.id),
            metadata={'email': target_user.email, 'target_name': target_user.name},
        )

        return Response(UserSerializer(target_user).data, status=status.HTTP_200_OK)

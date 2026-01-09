"""
URL configuration for config project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.db import models
from django.db.models import Sum

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from projects.models import Project
from investments.models import Investment, Payment
from access_requests.models import AccessRequest
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

User = get_user_model()


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Health check endpoint for Docker/Kubernetes probes."""
    return Response({
        'status': 'healthy',
        'service': 'cfp-backend',
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def debug_jwt(request):
    """Debug JWT verification - REMOVE IN PRODUCTION."""
    import jwt
    from jwt import PyJWKClient
    from django.conf import settings
    
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    if not auth_header.startswith('Bearer '):
        return Response({'error': 'No Bearer token'}, status=400)
    
    token = auth_header.split(' ')[1]
    result = {'token_preview': token[:50] + '...'}
    
    try:
        # Get unverified header
        header = jwt.get_unverified_header(token)
        result['header'] = header
        
        # Get unverified payload
        unverified = jwt.decode(token, options={"verify_signature": False})
        result['unverified_payload'] = {k: v for k, v in unverified.items() if k not in ['email']}
        
        # Try JWKS verification
        supabase_url = settings.SUPABASE_URL.rstrip('/')
        jwks_url = f"{supabase_url}/auth/v1/.well-known/jwks.json"
        result['jwks_url'] = jwks_url
        
        jwks_client = PyJWKClient(jwks_url)
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        result['signing_key_found'] = True
        result['key_id'] = signing_key.key_id if hasattr(signing_key, 'key_id') else 'N/A'
        
        expected_issuer = f"{supabase_url}/auth/v1"
        result['expected_issuer'] = expected_issuer
        result['token_issuer'] = unverified.get('iss')
        
        # Verify
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=['ES256', 'RS256'],
            options={"verify_aud": False}
        )
        result['verification'] = 'SUCCESS'
        result['verified_role'] = payload.get('role')
        
    except Exception as e:
        result['error'] = f"{type(e).__name__}: {str(e)}"
    
    return Response(result)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """Get dashboard stats based on user role."""
    user = request.user

    invested_statuses = [
        Investment.Status.COMPLETED,
        Investment.Status.WITHDRAWN,
        Investment.Status.REFUNDED,
        Investment.Status.REVERSED,
    ]
    returned_statuses = [
        Investment.Status.WITHDRAWN,
        Investment.Status.REFUNDED,
        Investment.Status.REVERSED,
    ]

    def sum_field(queryset, field):
        return queryset.aggregate(total=Sum(field)).get('total') or 0

    if user.role == 'ADMIN':
        investments = Investment.objects.filter(status__in=invested_statuses)
        active_investments = investments.filter(status=Investment.Status.COMPLETED)
        returned_investments = investments.filter(status__in=returned_statuses)
        return Response({
            'pending_review_count': Project.objects.filter(status='PENDING_REVIEW').count(),
            'pending_access_requests': AccessRequest.objects.filter(status='PENDING').count(),
            'total_users': User.objects.count(),
            'total_investments': investments.count(),
            'active_investments': active_investments.count(),
            'withdrawn_investments': returned_investments.count(),
            'total_invested_amount': sum_field(investments, 'total_amount'),
            'active_invested_amount': sum_field(active_investments, 'total_amount'),
            'withdrawn_invested_amount': sum_field(returned_investments, 'total_amount'),
            'total_shares': sum_field(investments, 'shares'),
            'active_shares': sum_field(active_investments, 'shares'),
            'withdrawn_shares': sum_field(returned_investments, 'shares'),
            'total_payments': Payment.objects.filter(status='SUCCESS').count(),
        })
    elif user.role == 'DEVELOPER':
        my_projects = Project.objects.filter(developer=user)
        return Response({
            'total_projects': my_projects.count(),
            'active_projects': my_projects.filter(status='APPROVED').count(),
            'completed_projects': my_projects.filter(shares_sold=models.F('total_shares')).count(),
            'archived_projects': my_projects.filter(status='ARCHIVED').count(),
            'total_funds_secured': sum(p.shares_sold * p.per_share_price for p in my_projects),
            'total_investors': Investment.objects.filter(project__developer=user, status='COMPLETED').values('investor').distinct().count(),
            'total_shares_sold': sum(p.shares_sold for p in my_projects),
        })
    else:  # INVESTOR
        investments = Investment.objects.filter(investor=user, status__in=invested_statuses)
        active_investments = investments.filter(status=Investment.Status.COMPLETED)
        returned_investments = investments.filter(status__in=returned_statuses)
        return Response({
            'total_invested_projects': investments.values('project').distinct().count(),
            'active_invested_projects': active_investments.values('project').distinct().count(),
            'total_invested_amount': sum_field(investments, 'total_amount'),
            'active_invested_amount': sum_field(active_investments, 'total_amount'),
            'withdrawn_invested_amount': sum_field(returned_investments, 'total_amount'),
            'total_shares_owned': sum_field(investments, 'shares'),
            'active_shares_owned': sum_field(active_investments, 'shares'),
            'withdrawn_shares_owned': sum_field(returned_investments, 'shares'),
            'active_investments': active_investments.count(),
            'withdrawn_investments': returned_investments.count(),
            'portfolio_value': sum(i.shares * i.project.per_share_price for i in active_investments),
        })


urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Health check for Docker/Kubernetes
    path('api/health/', health_check, name='health-check'),
    path('api/debug-jwt/', debug_jwt, name='debug-jwt'),  # TEMP - remove after debugging
    
    # API routes
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    path('api/', include('users.urls')),
    path('api/projects/', include('projects.urls')),
    path('api/investments/', include('investments.urls')),
    path('api/access-requests/', include('access_requests.urls')),
    path('api/media/', include('media.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/audit-logs/', include('audit.urls')),
    path('api/stats/', dashboard_stats, name='dashboard-stats'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

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
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from projects.models import Project
from investments.models import Investment, Payment
from access_requests.models import AccessRequest
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

User = get_user_model()


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

"""
URL configuration for config project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.db import models

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
    
    if user.role == 'ADMIN':
        return Response({
            'pending_review_count': Project.objects.filter(status='PENDING_REVIEW').count(),
            'pending_access_requests': AccessRequest.objects.filter(status='PENDING').count(),
            'total_users': User.objects.count(),
            'total_investments': Investment.objects.filter(status='COMPLETED').count(),
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
        my_investments = Investment.objects.filter(investor=user, status='COMPLETED')
        return Response({
            'total_invested_projects': my_investments.values('project').distinct().count(),
            'total_invested_amount': sum(i.total_amount for i in my_investments),
            'total_shares_owned': sum(i.shares for i in my_investments),
            'portfolio_value': sum(i.shares * i.project.per_share_price for i in my_investments),
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

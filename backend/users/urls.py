from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

urlpatterns = [
    # Auth endpoints
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/login/', views.SupabaseLoginView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/logout/', views.LogoutView.as_view(), name='logout'),
    path('auth/me/', views.MeView.as_view(), name='me'),
    path('auth/supabase/exchange/', views.SupabaseExchangeView.as_view(), name='supabase-exchange'),
    path('auth/oauth/<str:provider>/', views.SupabaseOAuthUrlView.as_view(), name='supabase-oauth'),
    path('auth/password-reset/', views.SupabasePasswordResetView.as_view(), name='password-reset'),
    path('auth/password-update/', views.SupabasePasswordUpdateView.as_view(), name='password-update'),
    path('auth/resend-confirmation/', views.SupabaseResendConfirmationView.as_view(), name='resend-confirmation'),
    path('auth/wallet/', views.WalletDetailView.as_view(), name='wallet-detail'),
    
    # User management (admin)
    path('users/', views.UserListView.as_view(), name='user-list'),
    path('users/<int:pk>/', views.UserDetailView.as_view(), name='user-detail'),
    path('users/<int:pk>/ban/', views.BanUserView.as_view(), name='user-ban'),
    path('users/<int:pk>/unban/', views.UnbanUserView.as_view(), name='user-unban'),
]

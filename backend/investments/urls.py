from django.urls import path
from . import views

urlpatterns = [
    path('', views.InvestmentListCreateView.as_view(), name='investment-list'),
    path('<int:pk>/', views.InvestmentDetailView.as_view(), name='investment-detail'),
    path('<int:investment_id>/pay/', views.ProcessPaymentView.as_view(), name='process-payment'),
    path('<int:investment_id>/revoke/', views.InvestmentRevokeView.as_view(), name='investment-revoke'),
    path('<int:investment_id>/review/', views.InvestmentReviewView.as_view(), name='investment-review'),
    path('<int:investment_id>/complete/', views.InvestmentCompleteView.as_view(), name='investment-complete'),
    path('<int:investment_id>/action/', views.InvestmentAdminActionView.as_view(), name='investment-admin-action'),
    path('payments/', views.PaymentListView.as_view(), name='payment-list'),
]

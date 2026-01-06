from django.urls import path
from . import views

urlpatterns = [
    path('', views.InvestmentListCreateView.as_view(), name='investment-list'),
    path('<int:pk>/', views.InvestmentDetailView.as_view(), name='investment-detail'),
    path('<int:investment_id>/pay/', views.ProcessPaymentView.as_view(), name='process-payment'),
    path('payments/', views.PaymentListView.as_view(), name='payment-list'),
]

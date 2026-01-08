from django.urls import path
from . import views

urlpatterns = [
    path('', views.AuditLogListView.as_view(), name='audit-log-list'),
    path('ledger/', views.ProjectLedgerListView.as_view(), name='project-ledger-list'),
]

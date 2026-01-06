from django.urls import path
from . import views

urlpatterns = [
    path('', views.AccessRequestListCreateView.as_view(), name='access-request-list'),
    path('<int:pk>/', views.AccessRequestDetailView.as_view(), name='access-request-detail'),
    path('<int:pk>/decide/', views.AccessRequestDecideView.as_view(), name='access-request-decide'),
]

from django.urls import path
from . import views

urlpatterns = [
    # Projects
    path('', views.ProjectListCreateView.as_view(), name='project-list'),
    path('<int:pk>/', views.ProjectDetailView.as_view(), name='project-detail'),
    path('<int:pk>/submit/', views.ProjectSubmitView.as_view(), name='project-submit'),
    path('<int:pk>/review/', views.ProjectReviewView.as_view(), name='project-review'),
    
    # Developer's projects
    path('my/', views.DeveloperProjectsView.as_view(), name='my-projects'),
    
    # Favorites
    path('favorites/', views.FavoriteListCreateView.as_view(), name='favorites'),
    path('favorites/<int:project_id>/', views.FavoriteDeleteView.as_view(), name='favorite-delete'),

    # Compare
    path('compare/', views.CompareListCreateView.as_view(), name='compare'),
    path('compare/<int:project_id>/', views.CompareDeleteView.as_view(), name='compare-delete'),
]

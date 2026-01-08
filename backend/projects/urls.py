from django.urls import path
from . import views

urlpatterns = [
    # Projects
    path('', views.ProjectListCreateView.as_view(), name='project-list'),
    path('<int:pk>/', views.ProjectDetailView.as_view(), name='project-detail'),
    path('<int:pk>/submit/', views.ProjectSubmitView.as_view(), name='project-submit'),
    path('<int:pk>/review/', views.ProjectReviewView.as_view(), name='project-review'),
    path('<int:pk>/archive/', views.ProjectArchiveView.as_view(), name='project-archive'),
    
    # Developer's projects
    path('my/', views.DeveloperProjectsView.as_view(), name='my-projects'),
    
    # Favorites
    path('favorites/', views.FavoriteListCreateView.as_view(), name='favorites'),
    path('favorites/<int:project_id>/', views.FavoriteDeleteView.as_view(), name='favorite-delete'),

    # Compare
    path('compare/', views.CompareListCreateView.as_view(), name='compare'),
    path('compare/<int:project_id>/', views.CompareDeleteView.as_view(), name='compare-delete'),

    # Project edit requests
    path('edit-requests/', views.ProjectEditRequestListCreateView.as_view(), name='project-edit-requests'),
    path('edit-requests/<int:pk>/', views.ProjectEditRequestDetailView.as_view(), name='project-edit-request-detail'),
    path('edit-requests/<int:edit_request_id>/review/', views.ProjectEditRequestReviewView.as_view(), name='project-edit-review'),

    # Project archive requests
    path('archive-requests/', views.ProjectArchiveRequestListCreateView.as_view(), name='project-archive-requests'),
    path('archive-requests/<int:archive_request_id>/review/', views.ProjectArchiveRequestReviewView.as_view(), name='project-archive-review'),

    # Comparator
    path('comparator/', views.ProjectComparatorView.as_view(), name='project-comparator'),
]

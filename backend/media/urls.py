from django.urls import path

from . import views

urlpatterns = [
    path('upload/', views.MediaUploadView.as_view(), name='media-upload'),
    path('signed-url/', views.MediaSignedUrlView.as_view(), name='media-signed-url'),
    path('resolve/', views.MediaResolveView.as_view(), name='media-resolve'),
]

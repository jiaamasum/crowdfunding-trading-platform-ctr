from django.db import models
from django.conf import settings


class Notification(models.Model):
    """Notification model for user notifications."""
    
    class Type(models.TextChoices):
        PROJECT_SUBMITTED = 'PROJECT_SUBMITTED', 'Project Submitted'
        PROJECT_APPROVED = 'PROJECT_APPROVED', 'Project Approved'
        PROJECT_REJECTED = 'PROJECT_REJECTED', 'Project Rejected'
        PROJECT_NEEDS_CHANGES = 'PROJECT_NEEDS_CHANGES', 'Project Needs Changes'
        ACCESS_REQUESTED = 'ACCESS_REQUESTED', 'Access Requested'
        ACCESS_APPROVED = 'ACCESS_APPROVED', 'Access Approved'
        ACCESS_REJECTED = 'ACCESS_REJECTED', 'Access Rejected'
        ACCESS_REVOKED = 'ACCESS_REVOKED', 'Access Revoked'
        INVESTMENT_SUCCESS = 'INVESTMENT_SUCCESS', 'Investment Success'
        INVESTMENT_FAILED = 'INVESTMENT_FAILED', 'Investment Failed'
        PAYMENT_SUCCESS = 'PAYMENT_SUCCESS', 'Payment Success'
        PAYMENT_FAILED = 'PAYMENT_FAILED', 'Payment Failed'
        NEW_ACCESS_REQUEST = 'NEW_ACCESS_REQUEST', 'New Access Request'
    
    class RelatedType(models.TextChoices):
        PROJECT = 'project', 'Project'
        ACCESS_REQUEST = 'access_request', 'Access Request'
        INVESTMENT = 'investment', 'Investment'
        PAYMENT = 'payment', 'Payment'
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    type = models.CharField(max_length=50, choices=Type.choices)
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    related_id = models.CharField(max_length=255, null=True, blank=True)
    related_type = models.CharField(max_length=50, choices=RelatedType.choices, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.type}: {self.title}"

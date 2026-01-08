from django.db import models
from django.conf import settings


class Notification(models.Model):
    """Notification model for user notifications."""
    
    class Type(models.TextChoices):
        PROJECT_SUBMITTED = 'PROJECT_SUBMITTED', 'Project Submitted'
        PROJECT_APPROVED = 'PROJECT_APPROVED', 'Project Approved'
        PROJECT_REJECTED = 'PROJECT_REJECTED', 'Project Rejected'
        PROJECT_NEEDS_CHANGES = 'PROJECT_NEEDS_CHANGES', 'Project Needs Changes'
        PROJECT_EDIT_REQUESTED = 'PROJECT_EDIT_REQUESTED', 'Project Edit Requested'
        PROJECT_EDIT_APPROVED = 'PROJECT_EDIT_APPROVED', 'Project Edit Approved'
        PROJECT_EDIT_REJECTED = 'PROJECT_EDIT_REJECTED', 'Project Edit Rejected'
        ACCESS_REQUESTED = 'ACCESS_REQUESTED', 'Access Requested'
        ACCESS_APPROVED = 'ACCESS_APPROVED', 'Access Approved'
        ACCESS_REJECTED = 'ACCESS_REJECTED', 'Access Rejected'
        ACCESS_REVOKED = 'ACCESS_REVOKED', 'Access Revoked'
        INVESTMENT_REQUESTED = 'INVESTMENT_REQUESTED', 'Investment Requested'
        INVESTMENT_APPROVED = 'INVESTMENT_APPROVED', 'Investment Approved'
        INVESTMENT_REJECTED = 'INVESTMENT_REJECTED', 'Investment Rejected'
        INVESTMENT_EXPIRED = 'INVESTMENT_EXPIRED', 'Investment Expired'
        INVESTMENT_PROCESSING = 'INVESTMENT_PROCESSING', 'Investment Processing'
        INVESTMENT_COMPLETED = 'INVESTMENT_COMPLETED', 'Investment Completed'
        INVESTMENT_REFUNDED = 'INVESTMENT_REFUNDED', 'Investment Refunded'
        INVESTMENT_WITHDRAWN = 'INVESTMENT_WITHDRAWN', 'Investment Withdrawn'
        INVESTMENT_REVERSED = 'INVESTMENT_REVERSED', 'Investment Reversed'
        PAYMENT_SUCCESS = 'PAYMENT_SUCCESS', 'Payment Success'
        PAYMENT_FAILED = 'PAYMENT_FAILED', 'Payment Failed'
        NEW_ACCESS_REQUEST = 'NEW_ACCESS_REQUEST', 'New Access Request'
        USER_BANNED = 'USER_BANNED', 'User Banned'
    
    class RelatedType(models.TextChoices):
        PROJECT = 'project', 'Project'
        ACCESS_REQUEST = 'access_request', 'Access Request'
        INVESTMENT = 'investment', 'Investment'
        PAYMENT = 'payment', 'Payment'
        PROJECT_EDIT_REQUEST = 'project_edit_request', 'Project Edit Request'
        USER = 'user', 'User'
    
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

from django.db import models
from django.conf import settings


class AuditLog(models.Model):
    """Audit log for tracking actions in the system."""
    
    class ActionType(models.TextChoices):
        PROJECT_CREATED = 'PROJECT_CREATED', 'Project Created'
        PROJECT_UPDATED = 'PROJECT_UPDATED', 'Project Updated'
        PROJECT_SUBMITTED = 'PROJECT_SUBMITTED', 'Project Submitted'
        PROJECT_APPROVED = 'PROJECT_APPROVED', 'Project Approved'
        PROJECT_REJECTED = 'PROJECT_REJECTED', 'Project Rejected'
        PROJECT_ARCHIVED = 'PROJECT_ARCHIVED', 'Project Archived'
        ACCESS_REQUEST_CREATED = 'ACCESS_REQUEST_CREATED', 'Access Request Created'
        ACCESS_REQUEST_APPROVED = 'ACCESS_REQUEST_APPROVED', 'Access Request Approved'
        ACCESS_REQUEST_REJECTED = 'ACCESS_REQUEST_REJECTED', 'Access Request Rejected'
        ACCESS_REQUEST_REVOKED = 'ACCESS_REQUEST_REVOKED', 'Access Request Revoked'
        INVESTMENT_CREATED = 'INVESTMENT_CREATED', 'Investment Created'
        PAYMENT_PROCESSED = 'PAYMENT_PROCESSED', 'Payment Processed'
        USER_CREATED = 'USER_CREATED', 'User Created'
        USER_UPDATED = 'USER_UPDATED', 'User Updated'
        USER_DISABLED = 'USER_DISABLED', 'User Disabled'
    
    class TargetType(models.TextChoices):
        PROJECT = 'project', 'Project'
        USER = 'user', 'User'
        ACCESS_REQUEST = 'access_request', 'Access Request'
        INVESTMENT = 'investment', 'Investment'
        PAYMENT = 'payment', 'Payment'
    
    action_type = models.CharField(max_length=50, choices=ActionType.choices)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='audit_logs'
    )
    target_type = models.CharField(max_length=50, choices=TargetType.choices)
    target_id = models.CharField(max_length=255)
    metadata = models.JSONField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'audit_logs'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.action_type}: {self.actor.email} -> {self.target_type}:{self.target_id}"

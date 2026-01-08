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
        PROJECT_EDIT_REQUESTED = 'PROJECT_EDIT_REQUESTED', 'Project Edit Requested'
        PROJECT_EDIT_APPROVED = 'PROJECT_EDIT_APPROVED', 'Project Edit Approved'
        PROJECT_EDIT_REJECTED = 'PROJECT_EDIT_REJECTED', 'Project Edit Rejected'
        ACCESS_REQUEST_CREATED = 'ACCESS_REQUEST_CREATED', 'Access Request Created'
        ACCESS_REQUEST_APPROVED = 'ACCESS_REQUEST_APPROVED', 'Access Request Approved'
        ACCESS_REQUEST_REJECTED = 'ACCESS_REQUEST_REJECTED', 'Access Request Rejected'
        ACCESS_REQUEST_REVOKED = 'ACCESS_REQUEST_REVOKED', 'Access Request Revoked'
        INVESTMENT_REQUESTED = 'INVESTMENT_REQUESTED', 'Investment Requested'
        INVESTMENT_APPROVED = 'INVESTMENT_APPROVED', 'Investment Approved'
        INVESTMENT_REJECTED = 'INVESTMENT_REJECTED', 'Investment Rejected'
        INVESTMENT_PROCESSING = 'INVESTMENT_PROCESSING', 'Investment Processing'
        INVESTMENT_COMPLETED = 'INVESTMENT_COMPLETED', 'Investment Completed'
        INVESTMENT_REFUNDED = 'INVESTMENT_REFUNDED', 'Investment Refunded'
        INVESTMENT_WITHDRAWN = 'INVESTMENT_WITHDRAWN', 'Investment Withdrawn'
        INVESTMENT_REVERSED = 'INVESTMENT_REVERSED', 'Investment Reversed'
        INVESTMENT_EXPIRED = 'INVESTMENT_EXPIRED', 'Investment Expired'
        INVESTMENT_CANCELLED = 'INVESTMENT_CANCELLED', 'Investment Cancelled'
        PAYMENT_PROCESSED = 'PAYMENT_PROCESSED', 'Payment Processed'
        PAYMENT_REFUNDED = 'PAYMENT_REFUNDED', 'Payment Refunded'
        PAYMENT_WITHDRAWN = 'PAYMENT_WITHDRAWN', 'Payment Withdrawn'
        PAYMENT_REVERSED = 'PAYMENT_REVERSED', 'Payment Reversed'
        USER_CREATED = 'USER_CREATED', 'User Created'
        USER_UPDATED = 'USER_UPDATED', 'User Updated'
        USER_DISABLED = 'USER_DISABLED', 'User Disabled'
        USER_BANNED = 'USER_BANNED', 'User Banned'
        USER_UNBANNED = 'USER_UNBANNED', 'User Unbanned'
    
    class TargetType(models.TextChoices):
        PROJECT = 'project', 'Project'
        USER = 'user', 'User'
        ACCESS_REQUEST = 'access_request', 'Access Request'
        INVESTMENT = 'investment', 'Investment'
        PAYMENT = 'payment', 'Payment'
        PROJECT_EDIT_REQUEST = 'project_edit_request', 'Project Edit Request'
    
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


class ProjectLedgerEntry(models.Model):
    """Project-specific ledger history."""

    class EntryType(models.TextChoices):
        PROJECT_CREATED = 'PROJECT_CREATED', 'Project Created'
        PROJECT_UPDATED = 'PROJECT_UPDATED', 'Project Updated'
        PROJECT_SUBMITTED = 'PROJECT_SUBMITTED', 'Project Submitted'
        PROJECT_APPROVED = 'PROJECT_APPROVED', 'Project Approved'
        PROJECT_REJECTED = 'PROJECT_REJECTED', 'Project Rejected'
        PROJECT_ARCHIVED = 'PROJECT_ARCHIVED', 'Project Archived'
        PROJECT_EDIT_REQUESTED = 'PROJECT_EDIT_REQUESTED', 'Project Edit Requested'
        PROJECT_EDIT_APPROVED = 'PROJECT_EDIT_APPROVED', 'Project Edit Approved'
        PROJECT_EDIT_REJECTED = 'PROJECT_EDIT_REJECTED', 'Project Edit Rejected'
        ACCESS_REQUEST_CREATED = 'ACCESS_REQUEST_CREATED', 'Access Request Created'
        ACCESS_REQUEST_APPROVED = 'ACCESS_REQUEST_APPROVED', 'Access Request Approved'
        ACCESS_REQUEST_REJECTED = 'ACCESS_REQUEST_REJECTED', 'Access Request Rejected'
        ACCESS_REQUEST_REVOKED = 'ACCESS_REQUEST_REVOKED', 'Access Request Revoked'
        INVESTMENT_REQUESTED = 'INVESTMENT_REQUESTED', 'Investment Requested'
        INVESTMENT_APPROVED = 'INVESTMENT_APPROVED', 'Investment Approved'
        INVESTMENT_REJECTED = 'INVESTMENT_REJECTED', 'Investment Rejected'
        INVESTMENT_PROCESSING = 'INVESTMENT_PROCESSING', 'Investment Processing'
        INVESTMENT_COMPLETED = 'INVESTMENT_COMPLETED', 'Investment Completed'
        INVESTMENT_REFUNDED = 'INVESTMENT_REFUNDED', 'Investment Refunded'
        INVESTMENT_WITHDRAWN = 'INVESTMENT_WITHDRAWN', 'Investment Withdrawn'
        INVESTMENT_REVERSED = 'INVESTMENT_REVERSED', 'Investment Reversed'
        INVESTMENT_EXPIRED = 'INVESTMENT_EXPIRED', 'Investment Expired'
        INVESTMENT_CANCELLED = 'INVESTMENT_CANCELLED', 'Investment Cancelled'
        PAYMENT_PROCESSED = 'PAYMENT_PROCESSED', 'Payment Processed'
        PAYMENT_REFUNDED = 'PAYMENT_REFUNDED', 'Payment Refunded'
        PAYMENT_WITHDRAWN = 'PAYMENT_WITHDRAWN', 'Payment Withdrawn'
        PAYMENT_REVERSED = 'PAYMENT_REVERSED', 'Payment Reversed'
        USER_BANNED = 'USER_BANNED', 'User Banned'

    project = models.ForeignKey('projects.Project', on_delete=models.CASCADE, related_name='ledger_entries')
    entry_type = models.CharField(max_length=50, choices=EntryType.choices)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='project_ledger_entries'
    )
    metadata = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'project_ledger_entries'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.entry_type} - {self.project.title}"

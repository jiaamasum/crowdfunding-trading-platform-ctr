from django.db import models
from django.conf import settings
from projects.models import Project


class Investment(models.Model):
    """Investment model for tracking investments in projects."""
    
    class Status(models.TextChoices):
        REQUESTED = 'REQUESTED', 'Requested'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'
        EXPIRED = 'EXPIRED', 'Expired'
        PROCESSING = 'PROCESSING', 'Processing'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'
        REFUNDED = 'REFUNDED', 'Refunded'
        WITHDRAWN = 'WITHDRAWN', 'Withdrawn'
        REVERSED = 'REVERSED', 'Reversed'
    
    investor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='investments'
    )
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='investments'
    )
    shares = models.PositiveIntegerField()
    price_per_share = models.DecimalField(max_digits=15, decimal_places=2)
    total_amount = models.DecimalField(max_digits=15, decimal_places=2)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.REQUESTED)
    request_note = models.TextField(blank=True, null=True)
    admin_note = models.TextField(blank=True, null=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='investment_reviews'
    )
    approval_expires_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'investments'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.investor.email} - {self.shares} shares in {self.project.title}"


class Payment(models.Model):
    """Payment model for tracking investment payments."""
    
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        SUCCESS = 'SUCCESS', 'Success'
        FAILED = 'FAILED', 'Failed'
        REFUNDED = 'REFUNDED', 'Refunded'
        WITHDRAWN = 'WITHDRAWN', 'Withdrawn'
        REVERSED = 'REVERSED', 'Reversed'
    
    transaction_id = models.CharField(max_length=255, unique=True)
    investor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='payments'
    )
    investment = models.ForeignKey(
        Investment,
        on_delete=models.CASCADE,
        related_name='payments'
    )
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    payment_method = models.CharField(max_length=50, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'payments'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Payment {self.transaction_id} - {self.status}"

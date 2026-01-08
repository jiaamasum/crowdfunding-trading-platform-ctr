from django.db import models
from django.conf import settings
from projects.models import Project


class AccessRequest(models.Model):
    """Access Request model for restricted project content."""
    
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'
        REVOKED = 'REVOKED', 'Revoked'
    
    investor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='access_requests'
    )
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='access_requests'
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    message = models.TextField(blank=True, null=True)
    admin_note = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    decided_at = models.DateTimeField(null=True, blank=True)
    decided_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='access_decisions'
    )
    
    class Meta:
        db_table = 'access_requests'
        ordering = ['-created_at']
        unique_together = ['investor', 'project']
    
    def __str__(self):
        return f"Access request: {self.investor.email} -> {self.project.title}"

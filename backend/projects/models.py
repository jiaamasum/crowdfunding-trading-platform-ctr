from django.db import models
from django.conf import settings


class Project(models.Model):
    """Project model for crowdfunding projects."""
    
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        PENDING_REVIEW = 'PENDING_REVIEW', 'Pending Review'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'
        NEEDS_CHANGES = 'NEEDS_CHANGES', 'Needs Changes'
        ARCHIVED = 'ARCHIVED', 'Archived'
    
    class Category(models.TextChoices):
        TECHNOLOGY = 'TECHNOLOGY', 'Technology'
        REAL_ESTATE = 'REAL_ESTATE', 'Real Estate'
        ENERGY = 'ENERGY', 'Energy'
        HEALTHCARE = 'HEALTHCARE', 'Healthcare'
        AGRICULTURE = 'AGRICULTURE', 'Agriculture'
        MANUFACTURING = 'MANUFACTURING', 'Manufacturing'
        RETAIL = 'RETAIL', 'Retail'
        SERVICES = 'SERVICES', 'Services'
        OTHER = 'OTHER', 'Other'
    
    # Basic Info
    title = models.CharField(max_length=255)
    description = models.TextField()
    short_description = models.CharField(max_length=500)
    category = models.CharField(max_length=50, choices=Category.choices, default=Category.OTHER)
    status = models.CharField(max_length=50, choices=Status.choices, default=Status.DRAFT)
    
    # Developer
    developer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='projects'
    )
    
    # Financial
    total_value = models.DecimalField(max_digits=15, decimal_places=2)
    total_shares = models.PositiveIntegerField()
    shares_sold = models.PositiveIntegerField(default=0)
    
    # Duration
    duration_days = models.PositiveIntegerField()
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    
    # Media
    thumbnail_url = models.URLField(blank=True, null=True)
    has_3d_model = models.BooleanField(default=False)
    model_3d_url = models.URLField(blank=True, null=True)
    is_3d_public = models.BooleanField(default=False)
    
    # Restricted Fields
    has_restricted_fields = models.BooleanField(default=False)
    financial_projections = models.TextField(blank=True, null=True)
    business_plan = models.TextField(blank=True, null=True)
    team_details = models.TextField(blank=True, null=True)
    legal_documents = models.TextField(blank=True, null=True)
    risk_assessment = models.TextField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_note = models.TextField(blank=True, null=True)
    
    class Meta:
        db_table = 'projects'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title
    
    @property
    def per_share_price(self):
        """Calculate price per share."""
        if self.total_shares > 0:
            return float(self.total_value) / self.total_shares
        return 0
    
    @property
    def remaining_shares(self):
        """Calculate remaining shares."""
        return self.total_shares - self.shares_sold
    
    @property
    def funding_progress(self):
        """Calculate funding progress percentage."""
        if self.total_shares > 0:
            return (self.shares_sold / self.total_shares) * 100
        return 0


class ProjectImage(models.Model):
    """Images for a project."""
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='images')
    image_url = models.URLField()
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'project_images'
        ordering = ['order']


class Favorite(models.Model):
    """User favorites for projects."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='favorites'
    )
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'favorites'
        unique_together = ['user', 'project']


class Compare(models.Model):
    """User compare list for projects."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='compare_items'
    )
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='compared_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'compare_items'
        unique_together = ['user', 'project']


class ProjectEditRequest(models.Model):
    """Edit requests for published projects."""

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='edit_requests')
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='project_edit_requests'
    )
    changes = models.JSONField(default=dict)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    review_note = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='project_edit_reviews'
    )

    class Meta:
        db_table = 'project_edit_requests'
        ordering = ['-created_at']

    def __str__(self):
        return f"Edit request for {self.project.title} by {self.requested_by.email}"


class ProjectArchiveRequest(models.Model):
    """Archive requests for projects."""

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='archive_requests')
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='project_archive_requests'
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    review_note = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='project_archive_reviews'
    )

    class Meta:
        db_table = 'project_archive_requests'
        ordering = ['-created_at']

    def __str__(self):
        return f"Archive request for {self.project.title} by {self.requested_by.email}"

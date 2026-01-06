from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom User model with role-based access."""
    
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', 'Admin'
        DEVELOPER = 'DEVELOPER', 'Developer'
        INVESTOR = 'INVESTOR', 'Investor'
    
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.INVESTOR,
    )
    is_verified = models.BooleanField(default=False)
    avatar_url = models.URLField(blank=True, null=True)
    
    # Use email as the username field
    email = models.EmailField(unique=True)
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']
    
    class Meta:
        db_table = 'users'
        ordering = ['-date_joined']
    
    def __str__(self):
        return f"{self.email} ({self.role})"
    
    @property
    def name(self):
        """Return full name or email if name not set."""
        full_name = f"{self.first_name} {self.last_name}".strip()
        return full_name if full_name else self.email.split('@')[0]

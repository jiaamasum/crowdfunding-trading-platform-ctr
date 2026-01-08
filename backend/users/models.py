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
    is_banned = models.BooleanField(default=False)
    banned_at = models.DateTimeField(null=True, blank=True)
    
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


class Wallet(models.Model):
    """Wallet for tracking user refunds/withdrawals."""

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='wallet')
    balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'wallets'

    def __str__(self):
        return f"Wallet({self.user.email})"


class WalletTransaction(models.Model):
    """Wallet transaction history."""

    class Type(models.TextChoices):
        REFUND = 'REFUND', 'Refund'
        WITHDRAW = 'WITHDRAW', 'Withdraw'
        REVERSE = 'REVERSE', 'Reverse'
        ADJUSTMENT = 'ADJUSTMENT', 'Adjustment'

    wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name='transactions')
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    type = models.CharField(max_length=20, choices=Type.choices)
    reference = models.CharField(max_length=255, blank=True, null=True)
    project_id = models.CharField(max_length=255, blank=True, null=True)
    project_name = models.CharField(max_length=255, blank=True, null=True)
    investment_id = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'wallet_transactions'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.type} {self.amount} for {self.wallet.user.email}"

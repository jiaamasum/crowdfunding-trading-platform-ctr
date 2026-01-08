import pytest
from django.contrib.auth import get_user_model
from users.models import Wallet, WalletTransaction

User = get_user_model()

@pytest.mark.django_db
class TestUserModel:
    def test_create_user(self):
        user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='password123',
            first_name='Test',
            last_name='User'
        )
        assert user.email == 'test@example.com'
        assert user.check_password('password123')
        assert user.role == User.Role.INVESTOR  # Default role
        assert str(user) == 'test@example.com (INVESTOR)'
        assert user.name == 'Test User'

    def test_create_superuser(self):
        admin = User.objects.create_superuser(
            email='admin@example.com',
            username='admin',
            password='password123'
        )
        assert admin.is_superuser
        assert admin.is_staff

    def test_user_name_property_fallback(self):
        user = User.objects.create_user(
            email='fallback@example.com',
            username='fallback',
            password='password123',
            first_name='',
            last_name=''
        )
        assert user.name == 'fallback'

@pytest.mark.django_db
class TestWalletModel:
    def test_wallet_creation(self):
        user = User.objects.create_user(
            email='wallet@example.com',
            username='walletuser',
            password='password123'
        )
        wallet = Wallet.objects.create(user=user, balance=100.00)
        assert wallet.user == user
        assert wallet.balance == 100.00
        assert str(wallet) == f"Wallet({user.email})"

@pytest.mark.django_db
class TestWalletTransactionModel:
    def test_transaction_creation(self):
        user = User.objects.create_user(
            email='trans@example.com',
            username='transuser',
            password='password123'
        )
        wallet = Wallet.objects.create(user=user)
        transaction = WalletTransaction.objects.create(
            wallet=wallet,
            amount=50.00,
            type=WalletTransaction.Type.REFUND
        )
        assert transaction.wallet == wallet
        assert transaction.amount == 50.00
        assert transaction.type == WalletTransaction.Type.REFUND
        assert str(transaction) == f"REFUND 50.00 for {user.email}"

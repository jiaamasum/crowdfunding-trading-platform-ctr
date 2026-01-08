import pytest
from django.contrib.auth import get_user_model
from users.serializers import UserRegistrationSerializer, UserUpdateSerializer, UserSerializer

User = get_user_model()

@pytest.mark.django_db
class TestUserRegistrationSerializer:
    def test_valid_registration(self):
        data = {
            'email': 'newuser@example.com',
            'password': 'Password123!',
            'password_confirm': 'Password123!',
            'name': 'New User',
            'role': 'INVESTOR'
        }
        serializer = UserRegistrationSerializer(data=data)
        assert serializer.is_valid()
        user = serializer.save()
        assert user.email == 'newuser@example.com'
        assert user.first_name == 'New'
        assert user.last_name == 'User'
        assert user.check_password('Password123!')

    def test_password_mismatch(self):
        data = {
            'email': 'mismatch@example.com',
            'password': 'Password123!',
            'password_confirm': 'Mismatch123!',
            'name': 'Mismatch User'
        }
        serializer = UserRegistrationSerializer(data=data)
        assert not serializer.is_valid()
        assert 'password_confirm' in serializer.errors

    def test_weak_password(self):
        data = {
            'email': 'weak@example.com',
            'password': 'weak',
            'password_confirm': 'weak',
            'name': 'Weak User'
        }
        serializer = UserRegistrationSerializer(data=data)
        assert not serializer.is_valid()
        assert 'password' in serializer.errors

@pytest.mark.django_db
class TestUserUpdateSerializer:
    def test_update_name_split(self):
        user = User.objects.create_user(
            email='update@example.com',
            password='Password123!',
            first_name='Old',
            last_name='Name'
        )
        data = {'name': 'Updated Name'}
        serializer = UserUpdateSerializer(instance=user, data=data, partial=True)
        assert serializer.is_valid()
        updated_user = serializer.save()
        assert updated_user.first_name == 'Updated'
        assert updated_user.last_name == 'Name'

    def test_update_single_name(self):
        user = User.objects.create_user(
            email='single@example.com', 
            password='Password123!'
        )
        data = {'name': 'Single'}
        serializer = UserUpdateSerializer(instance=user, data=data, partial=True)
        assert serializer.is_valid()
        updated_user = serializer.save()
        assert updated_user.first_name == 'Single'
        assert updated_user.last_name == ''

@pytest.mark.django_db
class TestUserSerializer:
    def test_serialization(self):
        user = User.objects.create_user(
            email='serial@example.com',
            password='Password123!',
            first_name='Serial',
            last_name='User'
        )
        # Create wallet for balance check
        from users.models import Wallet
        Wallet.objects.create(user=user, balance=500.00)
        
        serializer = UserSerializer(user)
        data = serializer.data
        assert data['email'] == 'serial@example.com'
        assert data['name'] == 'Serial User'
        assert data['wallet_balance'] == 500.00

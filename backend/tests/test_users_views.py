import pytest
from unittest.mock import patch
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def user(db):
    return User.objects.create_user(
        email='testuser@example.com',
        username='testuser', 
        password='Password123!',
        first_name='Test',
        last_name='User',
        role=User.Role.INVESTOR
    )

@pytest.fixture
def admin_user(db):
    return User.objects.create_superuser(
        email='admin@example.com',
        username='admin',
        password='Password123!',
        role=User.Role.ADMIN
    )

@pytest.mark.django_db
class TestRegisterView:
    def test_register_success(self, api_client):
        url = reverse('register')
        data = {
            'email': 'new@example.com',
            'password': 'Password123!',
            'password_confirm': 'Password123!',
            'name': 'New User'
        }
        
        with patch('users.views.sign_up') as mock_sign_up:
            mock_sign_up.return_value = {
                'user': {'email': 'new@example.com', 'user_metadata': {'name': 'New User'}},
                'session': {'access_token': 'fake-token', 'refresh_token': 'fake-refresh'}
            }
            response = api_client.post(url, data)
            
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['user']['email'] == 'new@example.com'
        assert response.data['tokens']['access'] == 'fake-token'

@pytest.mark.django_db
class TestLoginView:
    def test_login_success(self, api_client):
        url = reverse('login')
        data = {'email': 'test@example.com', 'password': 'Password123!'}
        
        with patch('users.views.sign_in_with_password') as mock_signin:
            mock_signin.return_value = {
                'user': {'email': 'test@example.com', 'user_metadata': {}},
                'session': {'access_token': 'fake-token', 'refresh_token': 'fake-refresh'}
            }
            response = api_client.post(url, data)
            
        assert response.status_code == status.HTTP_200_OK
        assert response.data['tokens']['access'] == 'fake-token'

@pytest.mark.django_db
class TestMeView:
    def test_get_me_unauthenticated(self, api_client):
        url = reverse('me')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_me_authenticated(self, api_client, user):
        api_client.force_authenticate(user=user)
        url = reverse('me')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == user.email

    def test_update_me(self, api_client, user):
        api_client.force_authenticate(user=user)
        url = reverse('me')
        data = {'name': 'Updated Name'}
        
        with patch('users.views.update_user_metadata') as mock_update:
            response = api_client.patch(url, data)
            
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == 'Updated Name'
        user.refresh_from_db()
        assert user.first_name == 'Updated'

@pytest.mark.django_db
class TestUserListView:
    def test_list_users_as_admin(self, api_client, admin_user):
        api_client.force_authenticate(user=admin_user)
        url = reverse('user-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        
    def test_list_users_as_investor_forbidden(self, api_client, user):
        api_client.force_authenticate(user=user)
        url = reverse('user-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

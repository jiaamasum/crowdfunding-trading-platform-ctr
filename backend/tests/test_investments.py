import pytest
from rest_framework.test import APIClient
from rest_framework import status
from django.urls import reverse
from users.models import User
from projects.models import Project
from investments.models import Investment, Payment
from django.utils import timezone

@pytest.mark.django_db
class TestInvestmentFlow:
    def setup_method(self):
        self.client = APIClient()
        
        # Create Users
        self.admin = User.objects.create_user(
            username='admin', email='admin@example.com', password='password123', role='ADMIN'
        )
        self.developer = User.objects.create_user(
            username='developer', email='dev@example.com', password='password123', role='DEVELOPER'
        )
        self.investor = User.objects.create_user(
            username='investor', email='investor@example.com', password='password123', role='INVESTOR'
        )
        
        # Create Project
        self.project = Project.objects.create(
            developer=self.developer,
            title="Tech Startup",
            description="Innovative Tech",
            short_description="Tech",
            total_value=100000,
            total_shares=1000,
            duration_days=60,
            status='APPROVED'
        )
        
        self.list_url = reverse('investment-list')

    def test_investment_lifecycle(self):
        # 1. Investor requests investment
        self.client.force_authenticate(user=self.investor)
        data = {
            'project': self.project.id,
            'shares': 10,
            'request_note': 'Interested in investing.'
        }
        # Assuming serializer handles calculation or we need to provide field?
        # Initial check suggests we might need to provide fields if read_only=False?
        # Checking serializer would be good, but assuming standard flow:
        # User provides project_id and shares. View/Serializer should handle pricing.
        # But wait, create payload usually needs what serializer expects.
        # Let's try minimal payload first.
        
        response = self.client.post(self.list_url, data)
        assert response.status_code == status.HTTP_201_CREATED
        investment_id = response.data['id']
        assert response.data['status'] == 'REQUESTED'
        
        # 2. Admin approves investment
        self.client.force_authenticate(user=self.admin)
        review_url = reverse('investment-review', args=[investment_id])
        response = self.client.post(review_url, {'action': 'approve', 'admin_note': 'Approved!'})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'APPROVED'
        
        # 3. Investor makes payment
        self.client.force_authenticate(user=self.investor)
        payment_url = reverse('process-payment', args=[investment_id])
        response = self.client.post(payment_url, {'payment_method': 'credit_card'})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['investment']['status'] == 'PROCESSING'
        assert response.data['payment']['status'] == 'SUCCESS'
        
        # 4. Admin completes investment
        self.client.force_authenticate(user=self.admin)
        complete_url = reverse('investment-complete', args=[investment_id])
        response = self.client.post(complete_url, {'admin_note': 'Completion verified.'})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'COMPLETED'
        
        # Verify shares sold updated
        self.project.refresh_from_db()
        assert self.project.shares_sold == 10

    def test_revoke_investment(self):
        # Create request first
        self.client.force_authenticate(user=self.investor)
        inv = Investment.objects.create(
            investor=self.investor,
            project=self.project,
            shares=5,
            price_per_share=self.project.per_share_price,
            total_amount=5 * self.project.per_share_price,
            status='REQUESTED'
        )
        
        revoke_url = reverse('investment-revoke', args=[inv.id])
        response = self.client.post(revoke_url)
        assert response.status_code == status.HTTP_200_OK
        inv.refresh_from_db()
        assert inv.status == 'CANCELLED'

    def test_list_investments(self):
        # Create investments
        Investment.objects.create(
            investor=self.investor,
            project=self.project,
            shares=5,
            price_per_share=100,
            total_amount=500,
            status='COMPLETED'
        )
        
        self.client.force_authenticate(user=self.investor)
        response = self.client.get(self.list_url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1

    def test_admin_reject_investment(self):
        self.client.force_authenticate(user=self.admin)
        inv = Investment.objects.create(
            investor=self.investor,
            project=self.project,
            shares=5,
            price_per_share=100,
            total_amount=500,
            status='REQUESTED'
        )
        review_url = reverse('investment-review', args=[inv.id])
        response = self.client.post(review_url, {'action': 'reject', 'admin_note': 'Bad fit'})
        assert response.status_code == status.HTTP_200_OK
        inv.refresh_from_db()
        assert inv.status == 'REJECTED'

import pytest
from django.contrib.auth import get_user_model
from projects.models import Project, ProjectEditRequest

User = get_user_model()

@pytest.fixture
def developer(db):
    return User.objects.create_user(
        email='dev@example.com',
        username='devuser',
        password='Password123!',
        role=User.Role.DEVELOPER
    )

@pytest.mark.django_db
class TestProjectModel:
    def test_project_properties(self, developer):
        project = Project.objects.create(
            developer=developer,
            title='Test Project',
            description='Description',
            total_value=100000.00,
            total_shares=1000,
            shares_sold=250,
            duration_days=30
        )
        assert project.per_share_price == 100.00
        assert project.remaining_shares == 750
        assert project.funding_progress == 25.0
        assert str(project) == 'Test Project'

    def test_project_zero_shares(self, developer):
        project = Project.objects.create(
            developer=developer,
            title='Zero Shares',
            description='Description',
            total_value=1000.00,
            total_shares=0,
            shares_sold=0,
            duration_days=30
        )
        assert project.per_share_price == 0
        assert project.funding_progress == 0

@pytest.mark.django_db
class TestProjectEditRequest:
    def test_create_edit_request(self, developer):
        project = Project.objects.create(
            developer=developer,
            title='Edit Me',
            description='Original',
            total_value=1000.00,
            total_shares=100,
            duration_days=30
        )
        request = ProjectEditRequest.objects.create(
            project=project,
            requested_by=developer,
            changes={'description': 'Updated'}
        )
        assert request.status == ProjectEditRequest.Status.PENDING
        assert request.changes['description'] == 'Updated'
        assert str(request) == f"Edit request for Edit Me by {developer.email}"

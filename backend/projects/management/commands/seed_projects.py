import json
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.conf import settings
from pathlib import Path
from django.utils import timezone
from django.utils.dateparse import parse_date, parse_datetime

from django.contrib.auth import get_user_model
from projects.models import Project, ProjectImage

User = get_user_model()


def parse_datetime_value(value):
    if not value:
        return None
    if isinstance(value, str):
        dt = parse_datetime(value)
        if dt is None:
            date_value = parse_date(value)
            if date_value is None:
                return None
            dt = timezone.datetime.combine(date_value, timezone.datetime.min.time())
        if timezone.is_naive(dt):
            return timezone.make_aware(dt)
        return dt
    return None


class Command(BaseCommand):
    help = 'Seed projects from frontend mock data JSON'

    def add_arguments(self, parser):
        parser.add_argument(
            '--path',
            default='seed/projects.json',
            help='Path to projects JSON file (relative to backend/)',
        )

    def handle(self, *args, **options):
        path = options['path']
        file_path = Path(settings.BASE_DIR) / path
        try:
            with open(file_path, 'r', encoding='utf-8') as handle:
                data = json.load(handle)
        except FileNotFoundError:
            self.stderr.write(self.style.ERROR(f'File not found: {file_path}'))
            return

        if not isinstance(data, list):
            self.stderr.write(self.style.ERROR('Invalid JSON: expected a list of projects'))
            return

        created_count = 0
        updated_count = 0

        for item in data:
            developer_key = item.get('developerId') or item.get('developerName') or 'developer'
            developer_name = item.get('developerName') or 'Developer'
            developer_email = f"{developer_key}@seed.local"

            developer, _ = User.objects.get_or_create(
                email=developer_email,
                defaults={
                    'username': developer_email,
                    'first_name': developer_name.split(' ')[0],
                    'last_name': ' '.join(developer_name.split(' ')[1:]),
                    'role': 'DEVELOPER',
                    'is_verified': True,
                },
            )

            defaults = {
                'description': item.get('description') or '',
                'short_description': item.get('shortDescription') or '',
                'category': item.get('category') or Project.Category.OTHER,
                'status': item.get('status') or Project.Status.DRAFT,
                'total_value': Decimal(str(item.get('totalValue') or 0)),
                'total_shares': int(item.get('totalShares') or 0),
                'shares_sold': int(item.get('sharesSold') or 0),
                'duration_days': int(item.get('durationDays') or 0),
                'start_date': parse_datetime_value(item.get('startDate')),
                'end_date': parse_datetime_value(item.get('endDate')),
                'thumbnail_url': item.get('thumbnailUrl'),
                'has_3d_model': bool(item.get('has3DModel')),
                'model_3d_url': item.get('model3DUrl'),
                'is_3d_public': bool(item.get('is3DPublic')),
                'has_restricted_fields': bool(item.get('hasRestrictedFields')),
                'financial_projections': (item.get('restrictedFields') or {}).get('financialProjections'),
                'business_plan': (item.get('restrictedFields') or {}).get('businessPlan'),
                'team_details': (item.get('restrictedFields') or {}).get('teamDetails'),
                'legal_documents': (item.get('restrictedFields') or {}).get('legalDocuments'),
                'risk_assessment': (item.get('restrictedFields') or {}).get('riskAssessment'),
                'submitted_at': parse_datetime_value(item.get('submittedAt')),
                'reviewed_at': parse_datetime_value(item.get('reviewedAt')),
                'review_note': item.get('reviewNote'),
            }

            project, created = Project.objects.update_or_create(
                title=item.get('title') or 'Untitled Project',
                developer=developer,
                defaults=defaults,
            )

            ProjectImage.objects.filter(project=project).delete()
            images = item.get('images') or []
            for order, image_url in enumerate(images):
                if image_url:
                    ProjectImage.objects.create(
                        project=project,
                        image_url=image_url,
                        order=order,
                    )

            if created:
                created_count += 1
            else:
                updated_count += 1

        self.stdout.write(self.style.SUCCESS(
            f'Seed complete. Created: {created_count}, Updated: {updated_count}'
        ))

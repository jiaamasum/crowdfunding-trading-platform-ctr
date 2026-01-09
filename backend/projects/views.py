from rest_framework import generics, permissions, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import timedelta
from django.db.models import Q, F, FloatField, ExpressionWrapper, Case, When
from django.core.serializers.json import DjangoJSONEncoder
import json

from .models import Project, Favorite, Compare, ProjectEditRequest, ProjectArchiveRequest
from investments.models import Investment
from investments.utils import apply_investment_action
from config.permissions import IsAdminRole
from audit.models import AuditLog, ProjectLedgerEntry
from notifications.models import Notification
from django.contrib.auth import get_user_model
from .serializers import (
    ProjectListSerializer, ProjectDetailSerializer, 
    ProjectCreateSerializer, FavoriteSerializer, FavoriteCreateSerializer,
    CompareSerializer, CompareCreateSerializer, ProjectEditRequestSerializer, ProjectArchiveRequestSerializer
)

def to_json_safe(data):
    return json.loads(json.dumps(data, cls=DjangoJSONEncoder))

def is_admin_user(user):
    return (
        getattr(user, 'role', None) == 'ADMIN'
        or getattr(user, 'is_staff', False)
        or getattr(user, 'is_superuser', False)
    )

def archive_project_with_withdrawals(project, actor, note=None):
    if project.status == Project.Status.ARCHIVED:
        return project

    project.status = Project.Status.ARCHIVED
    project.save(update_fields=['status'])

    unresolved_statuses = [
        Investment.Status.CANCELLED,
        Investment.Status.REFUNDED,
        Investment.Status.WITHDRAWN,
        Investment.Status.REVERSED,
        Investment.Status.REJECTED,
        Investment.Status.EXPIRED,
    ]
    investments = Investment.objects.filter(project=project).exclude(status__in=unresolved_statuses)
    for investment in investments:
        apply_investment_action(
            investment,
            'withdraw',
            actor=actor,
            admin_note=note or 'Project archived',
        )

    AuditLog.objects.create(
        action_type=AuditLog.ActionType.PROJECT_ARCHIVED,
        actor=actor,
        target_type=AuditLog.TargetType.PROJECT,
        target_id=str(project.id),
        metadata=to_json_safe({
            'project_id': str(project.id),
            'project_name': project.title,
            'status': project.status,
            'note': note,
        }),
    )
    ProjectLedgerEntry.objects.create(
        project=project,
        entry_type=ProjectLedgerEntry.EntryType.PROJECT_ARCHIVED,
        actor=actor,
        metadata=to_json_safe({
            'project_id': str(project.id),
            'project_name': project.title,
            'status': project.status,
            'note': note,
        }),
    )

    return project


class IsOwnerOrReadOnly(permissions.BasePermission):
    """Permission to only allow owners of an object to edit it."""
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.developer == request.user


class ProjectListCreateView(generics.ListCreateAPIView):
    """
    API View to list projects and create new ones.
    
    Features:
    - Lists all 'APPROVED' projects for public/investor users.
    - Lists all projects (including drafts) for ADMIN users.
    - Lists own projects (mixed status) + all 'APPROVED' projects for DEVELOPER users.
    - Supports advanced filtering by:
        - Category and Status (exact match)
        - Search (title, description)
        - Numeric ranges (funding progress, share price, total value, duration)
    - Supports sorting by calculated fields (funding_progress, per_share_price).
    """
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'status']
    search_fields = ['title', 'short_description', 'description']
    ordering_fields = ['created_at', 'total_value', 'per_share_price_value', 'funding_progress_value', 'end_date']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """
        Build the queryset with dynamic annotations and role-based filtering.
        
        Annotations are used to calculate fields on the fly at the database level for efficient sorting/filtering:
        - per_share_price_value: Calculated as total_value / total_shares (handles division by zero).
        - funding_progress_value: Calculated as (shares_sold / total_shares) * 100.
        """
        def is_admin(user):
            return user.is_authenticated and (
                getattr(user, 'role', None) == 'ADMIN'
                or getattr(user, 'is_staff', False)
                or getattr(user, 'is_superuser', False)
            )

        # Base queryset with calculated fields for sorting/filtering
        queryset = Project.objects.all().annotate(
            per_share_price_value=Case(
                When(total_shares__gt=0, then=ExpressionWrapper(F('total_value') / F('total_shares'), output_field=FloatField())),
                default=0,
                output_field=FloatField(),
            ),
            funding_progress_value=Case(
                When(total_shares__gt=0, then=ExpressionWrapper(F('shares_sold') * 100.0 / F('total_shares'), output_field=FloatField())),
                default=0,
                output_field=FloatField(),
            ),
        )
        user = self.request.user
        
        # --- Role-Based Filtering ---
        if not user.is_authenticated:
            # Guests see only approved projects
            queryset = queryset.filter(status='APPROVED')
        elif is_admin(user):
            # Admins see everything
            queryset = queryset
        elif user.role == 'DEVELOPER':
            # Developers see approved projects AND their own projects (even if draft/pending)
            queryset = queryset.filter(Q(status='APPROVED') | Q(developer=user))
        else:  # INVESTOR
            # Investors see only approved projects
            queryset = queryset.filter(status='APPROVED')

        # --- numeric Filters Helper Functions ---
        def parse_float(value):
            try:
                return float(value)
            except (TypeError, ValueError):
                return None

        def parse_int(value):
            try:
                return int(value)
            except (TypeError, ValueError):
                return None

        # --- Extract Query Parameters ---
        min_progress = parse_float(self.request.query_params.get('min_progress'))
        max_progress = parse_float(self.request.query_params.get('max_progress'))
        min_share_price = parse_float(self.request.query_params.get('min_share_price'))
        max_share_price = parse_float(self.request.query_params.get('max_share_price'))
        min_total_value = parse_float(self.request.query_params.get('min_total_value'))
        max_total_value = parse_float(self.request.query_params.get('max_total_value'))
        min_duration = parse_int(self.request.query_params.get('min_duration'))
        max_duration = parse_int(self.request.query_params.get('max_duration'))

        # --- Apply Filters ---
        if min_progress is not None:
            queryset = queryset.filter(funding_progress_value__gte=min_progress)
        if max_progress is not None:
            queryset = queryset.filter(funding_progress_value__lte=max_progress)
        if min_share_price is not None:
            queryset = queryset.filter(per_share_price_value__gte=min_share_price)
        if max_share_price is not None:
            queryset = queryset.filter(per_share_price_value__lte=max_share_price)
        if min_total_value is not None:
            queryset = queryset.filter(total_value__gte=min_total_value)
        if max_total_value is not None:
            queryset = queryset.filter(total_value__lte=max_total_value)
        if min_duration is not None:
            queryset = queryset.filter(duration_days__gte=min_duration)
        if max_duration is not None:
            queryset = queryset.filter(duration_days__lte=max_duration)

        # --- Apply Custom Ordering ---
        # Map frontend sort keys to our annotated database fields
        ordering = self.request.query_params.get('ordering')
        if ordering:
            ordering_map = {
                'per_share_price': 'per_share_price_value',
                '-per_share_price': '-per_share_price_value',
                'funding_progress': 'funding_progress_value',
                '-funding_progress': '-funding_progress_value',
            }
            queryset = queryset.order_by(ordering_map.get(ordering, ordering))

        return queryset
    
    def get_serializer_class(self):
        """Use different serializers for reading (List) vs writing (Create)."""
        if self.request.method == 'POST':
            return ProjectCreateSerializer
        return ProjectListSerializer
    
    def get_permissions(self):
        """Allow public read access, but require authentication to create."""
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]
    
    def perform_create(self, serializer):
        """
        Save the new project and capture audit logs.
        
        Steps:
        1. Save project with the current user as the developer.
        2. Create an initial AuditLog entry for creation.
        3. Create an initial Ledger entry for the project history.
        """
        project = serializer.save(developer=self.request.user)
        project_snapshot = {
            'project_id': str(project.id),
            'project_name': project.title,
            'status': project.status,
            'category': project.category,
            'total_value': project.total_value,
            'total_shares': project.total_shares,
            'per_share_price': project.per_share_price,
            'duration_days': project.duration_days,
            'developer_id': str(project.developer_id),
            'developer_name': getattr(project.developer, 'name', ''),
        }
        AuditLog.objects.create(
            action_type=AuditLog.ActionType.PROJECT_CREATED,
            actor=self.request.user,
            target_type=AuditLog.TargetType.PROJECT,
            target_id=str(project.id),
            metadata=to_json_safe(project_snapshot),
        )
        ProjectLedgerEntry.objects.create(
            project=project,
            entry_type=ProjectLedgerEntry.EntryType.PROJECT_CREATED,
            actor=self.request.user,
            metadata=to_json_safe(project_snapshot),
        )


class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a project."""
    queryset = Project.objects.all()
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return ProjectCreateSerializer
        return ProjectDetailSerializer

    def update(self, request, *args, **kwargs):
        project = self.get_object()
        if project.status == Project.Status.APPROVED and request.user == project.developer and request.user.role == 'DEVELOPER':
            return Response(
                {'detail': 'Approved projects require an edit request.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        def serialize_change_value(value):
            if hasattr(value, 'all'):
                try:
                    return list(value.values_list('image_url', flat=True))
                except Exception:
                    return list(value.all())
            if hasattr(value, 'isoformat'):
                return value.isoformat()
            if hasattr(value, 'pk'):
                return str(value.pk)
            return value

        partial = kwargs.get('partial', False)
        serializer = self.get_serializer(project, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        changes = {}
        for field, new_value in serializer.validated_data.items():
            old_value = getattr(project, field, None)
            if old_value != new_value:
                changes[field] = {
                    'from': serialize_change_value(old_value),
                    'to': serialize_change_value(new_value),
                }

        response = super().update(request, *args, **kwargs)
        metadata = {
            'project_id': str(project.id),
            'project_name': project.title,
            'status': project.status,
        }
        if changes:
            metadata['changes'] = to_json_safe(changes)
        AuditLog.objects.create(
            action_type=AuditLog.ActionType.PROJECT_UPDATED,
            actor=request.user,
            target_type=AuditLog.TargetType.PROJECT,
            target_id=str(project.id),
            metadata=to_json_safe(metadata),
        )
        ProjectLedgerEntry.objects.create(
            project=project,
            entry_type=ProjectLedgerEntry.EntryType.PROJECT_UPDATED,
            actor=request.user,
            metadata=to_json_safe(metadata),
        )
        return response


class ProjectSubmitView(APIView):
    """Submit a project for review."""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, pk):
        try:
            project = Project.objects.get(pk=pk, developer=request.user)
        except Project.DoesNotExist:
            return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if project.status not in ['DRAFT', 'NEEDS_CHANGES']:
            return Response(
                {'error': 'Project cannot be submitted in its current state'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        project.status = 'PENDING_REVIEW'
        project.submitted_at = timezone.now()
        project.save()

        User = get_user_model()
        admins = User.objects.filter(role='ADMIN') | User.objects.filter(is_staff=True) | User.objects.filter(is_superuser=True)
        for admin in admins.distinct():
            Notification.objects.create(
                user=admin,
                type=Notification.Type.PROJECT_SUBMITTED,
                title='Project submitted',
                message=f"{project.title} has been submitted for review.",
                related_id=str(project.id),
                related_type=Notification.RelatedType.PROJECT,
            )

        AuditLog.objects.create(
            action_type=AuditLog.ActionType.PROJECT_SUBMITTED,
            actor=request.user,
            target_type=AuditLog.TargetType.PROJECT,
            target_id=str(project.id),
            metadata=to_json_safe({
                'project_id': str(project.id),
                'project_name': project.title,
                'status': project.status,
                'submitted_at': project.submitted_at,
            }),
        )
        ProjectLedgerEntry.objects.create(
            project=project,
            entry_type=ProjectLedgerEntry.EntryType.PROJECT_SUBMITTED,
            actor=request.user,
            metadata=to_json_safe({
                'project_id': str(project.id),
                'project_name': project.title,
                'status': project.status,
                'submitted_at': project.submitted_at,
            }),
        )
        
        return Response(ProjectDetailSerializer(project, context={'request': request}).data)


class ProjectReviewView(APIView):
    """Admin review of a project."""
    permission_classes = [IsAdminRole]
    
    def post(self, request, pk):
        try:
            project = Project.objects.get(pk=pk)
        except Project.DoesNotExist:
            return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)
        
        action = request.data.get('action')  # approve, reject, request_changes
        review_note = request.data.get('review_note', '')
        
        if action == 'approve':
            project.status = 'APPROVED'
            project.start_date = timezone.now()
            if project.duration_days and not project.end_date:
                project.end_date = project.start_date + timedelta(days=project.duration_days)
        elif action == 'reject':
            project.status = 'REJECTED'
        elif action == 'request_changes':
            project.status = 'NEEDS_CHANGES'
        else:
            return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
        
        project.reviewed_at = timezone.now()
        project.review_note = review_note
        project.save()

        action_type = {
            'approve': AuditLog.ActionType.PROJECT_APPROVED,
            'reject': AuditLog.ActionType.PROJECT_REJECTED,
            'request_changes': AuditLog.ActionType.PROJECT_UPDATED,
        }[action]
        AuditLog.objects.create(
            action_type=action_type,
            actor=request.user,
            target_type=AuditLog.TargetType.PROJECT,
            target_id=str(project.id),
            metadata=to_json_safe({
                'project_id': str(project.id),
                'project_name': project.title,
                'status': project.status,
                'review_note': review_note,
                'action': action,
            }),
        )
        ProjectLedgerEntry.objects.create(
            project=project,
            entry_type={
                'approve': ProjectLedgerEntry.EntryType.PROJECT_APPROVED,
                'reject': ProjectLedgerEntry.EntryType.PROJECT_REJECTED,
                'request_changes': ProjectLedgerEntry.EntryType.PROJECT_UPDATED,
            }[action],
            actor=request.user,
            metadata=to_json_safe({
                'project_id': str(project.id),
                'project_name': project.title,
                'status': project.status,
                'review_note': review_note,
                'action': action,
            }),
        )

        notification_type = {
            'approve': Notification.Type.PROJECT_APPROVED,
            'reject': Notification.Type.PROJECT_REJECTED,
            'request_changes': Notification.Type.PROJECT_NEEDS_CHANGES,
        }[action]
        Notification.objects.create(
            user=project.developer,
            type=notification_type,
            title=f"Project {project.status.lower()}",
            message=f"Your project {project.title} was {project.status.lower().replace('_', ' ')}.",
            related_id=str(project.id),
            related_type=Notification.RelatedType.PROJECT,
        )
        
        return Response(ProjectDetailSerializer(project, context={'request': request}).data)


class ProjectArchiveView(APIView):
    """Archive a project (developer or admin)."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            project = Project.objects.get(pk=pk)
        except Project.DoesNotExist:
            return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        is_admin = is_admin_user(user)
        if project.developer != user and not is_admin:
            return Response({'error': 'Not authorized to archive this project'}, status=status.HTTP_403_FORBIDDEN)

        if project.status == Project.Status.ARCHIVED:
            return Response({'error': 'Project is already archived'}, status=status.HTTP_400_BAD_REQUEST)

        if not is_admin:
            if ProjectArchiveRequest.objects.filter(project=project, status=ProjectArchiveRequest.Status.PENDING).exists():
                return Response({'error': 'Archive request already pending'}, status=status.HTTP_400_BAD_REQUEST)

            archive_request = ProjectArchiveRequest.objects.create(
                project=project,
                requested_by=request.user,
            )

            User = get_user_model()
            admins = User.objects.filter(role='ADMIN') | User.objects.filter(is_staff=True) | User.objects.filter(is_superuser=True)
            for admin in admins.distinct():
                Notification.objects.create(
                    user=admin,
                    type=Notification.Type.PROJECT_ARCHIVE_REQUESTED,
                    title='Project archive request',
                    message=f"{project.title} has a pending archive request.",
                    related_id=str(archive_request.id),
                    related_type=Notification.RelatedType.PROJECT_ARCHIVE_REQUEST,
                )

            AuditLog.objects.create(
                action_type=AuditLog.ActionType.PROJECT_ARCHIVE_REQUESTED,
                actor=request.user,
                target_type=AuditLog.TargetType.PROJECT,
                target_id=str(project.id),
                metadata=to_json_safe({
                    'project_id': str(project.id),
                    'project_name': project.title,
                    'archive_request_id': str(archive_request.id),
                }),
            )
            ProjectLedgerEntry.objects.create(
                project=project,
                entry_type=ProjectLedgerEntry.EntryType.PROJECT_ARCHIVE_REQUESTED,
                actor=request.user,
                metadata=to_json_safe({
                    'archive_request_id': str(archive_request.id),
                }),
            )

            return Response(ProjectArchiveRequestSerializer(archive_request).data, status=status.HTTP_202_ACCEPTED)

        archived = archive_project_with_withdrawals(project, actor=user)
        return Response(ProjectDetailSerializer(archived, context={'request': request}).data)


class DeveloperProjectsView(generics.ListAPIView):
    """List projects for the authenticated developer."""
    serializer_class = ProjectListSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Project.objects.filter(developer=self.request.user)


class FavoriteListCreateView(generics.ListCreateAPIView):
    """List or add favorites."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return FavoriteCreateSerializer
        return FavoriteSerializer
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class FavoriteDeleteView(generics.DestroyAPIView):
    """Remove a favorite."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user)
    
    def delete(self, request, project_id):
        try:
            favorite = Favorite.objects.get(user=request.user, project_id=project_id)
            favorite.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Favorite.DoesNotExist:
            return Response({'error': 'Favorite not found'}, status=status.HTTP_404_NOT_FOUND)


class CompareListCreateView(generics.ListCreateAPIView):
    """List or add compare items."""
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Compare.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CompareCreateSerializer
        return CompareSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class CompareDeleteView(generics.DestroyAPIView):
    """Remove a compare item."""
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Compare.objects.filter(user=self.request.user)

    def delete(self, request, project_id):
        try:
            compare_item = Compare.objects.get(user=request.user, project_id=project_id)
            compare_item.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Compare.DoesNotExist:
            return Response({'error': 'Compare item not found'}, status=status.HTTP_404_NOT_FOUND)


class ProjectEditRequestListCreateView(generics.ListCreateAPIView):
    """List or create project edit requests."""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ProjectEditRequestSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN' or getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False):
            status_filter = self.request.query_params.get('status')
            queryset = ProjectEditRequest.objects.all()
            if status_filter:
                queryset = queryset.filter(status=status_filter)
            return queryset
        return ProjectEditRequest.objects.filter(requested_by=user)

    def create(self, request, *args, **kwargs):
        project_id = request.data.get('project')
        try:
            project = Project.objects.get(pk=project_id, developer=request.user)
        except Project.DoesNotExist:
            return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)

        if project.status != Project.Status.APPROVED:
            return Response({'error': 'Only approved projects require edit requests'}, status=status.HTTP_400_BAD_REQUEST)

        if ProjectEditRequest.objects.filter(project=project, status=ProjectEditRequest.Status.PENDING).exists():
            return Response({'error': 'Project already has a pending edit request'}, status=status.HTTP_400_BAD_REQUEST)

        allowed_fields = {
            'title', 'description', 'short_description', 'category',
            'total_value', 'total_shares', 'duration_days',
            'thumbnail_url', 'images', 'has_3d_model', 'model_3d_url', 'is_3d_public',
            'has_restricted_fields', 'financial_projections', 'business_plan',
            'team_details', 'legal_documents', 'risk_assessment',
        }
        payload = {key: value for key, value in request.data.items() if key in allowed_fields}
        serializer = ProjectCreateSerializer(project, data=payload, partial=True)
        serializer.is_valid(raise_exception=True)
        changes = serializer.validated_data
        if not changes:
            return Response({'error': 'No changes provided'}, status=status.HTTP_400_BAD_REQUEST)

        json_safe_changes = json.loads(json.dumps(serializer.validated_data, cls=DjangoJSONEncoder))

        edit_request = ProjectEditRequest.objects.create(
            project=project,
            requested_by=request.user,
            changes=json_safe_changes,
        )

        User = get_user_model()
        admins = User.objects.filter(role='ADMIN') | User.objects.filter(is_staff=True) | User.objects.filter(is_superuser=True)
        for admin in admins.distinct():
            Notification.objects.create(
                user=admin,
                type=Notification.Type.PROJECT_EDIT_REQUESTED,
                title='Project edit request',
                message=f"{project.title} has a pending edit request.",
                related_id=str(edit_request.id),
                related_type=Notification.RelatedType.PROJECT_EDIT_REQUEST,
            )

        AuditLog.objects.create(
            action_type=AuditLog.ActionType.PROJECT_EDIT_REQUESTED,
            actor=request.user,
            target_type=AuditLog.TargetType.PROJECT_EDIT_REQUEST,
            target_id=str(edit_request.id),
            metadata=to_json_safe({
                'project_id': str(project.id),
                'project_name': project.title,
                'edit_request_id': str(edit_request.id),
                'changes': edit_request.changes,
            }),
        )
        ProjectLedgerEntry.objects.create(
            project=project,
            entry_type=ProjectLedgerEntry.EntryType.PROJECT_EDIT_REQUESTED,
            actor=request.user,
            metadata=to_json_safe({
                'edit_request_id': str(edit_request.id),
                'changes': edit_request.changes,
            }),
        )

        return Response(ProjectEditRequestSerializer(edit_request).data, status=status.HTTP_201_CREATED)


class ProjectEditRequestDetailView(generics.RetrieveAPIView):
    """Retrieve a project edit request."""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ProjectEditRequestSerializer

    def get_queryset(self):
        user = self.request.user
        is_admin = (
            getattr(user, 'role', None) == 'ADMIN'
            or getattr(user, 'is_staff', False)
            or getattr(user, 'is_superuser', False)
        )
        if is_admin:
            return ProjectEditRequest.objects.all()
        return ProjectEditRequest.objects.filter(requested_by=user)


class ProjectEditRequestReviewView(APIView):
    """Admin approve or reject project edit requests."""
    permission_classes = [IsAdminRole]

    def post(self, request, edit_request_id):
        try:
            edit_request = ProjectEditRequest.objects.get(pk=edit_request_id)
        except ProjectEditRequest.DoesNotExist:
            return Response({'error': 'Edit request not found'}, status=status.HTTP_404_NOT_FOUND)

        if edit_request.status != ProjectEditRequest.Status.PENDING:
            return Response({'error': 'Edit request already reviewed'}, status=status.HTTP_400_BAD_REQUEST)

        action = request.data.get('action')
        review_note = request.data.get('review_note')
        if action not in ['approve', 'reject']:
            return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)

        edit_request.reviewed_at = timezone.now()
        edit_request.reviewed_by = request.user
        edit_request.review_note = review_note

        if action == 'approve':
            serializer = ProjectCreateSerializer(edit_request.project, data=edit_request.changes, partial=True)
            serializer.is_valid(raise_exception=True)
            saved_project = serializer.save()
            if saved_project.start_date and saved_project.duration_days:
                if 'duration_days' in edit_request.changes or not saved_project.end_date:
                    saved_project.end_date = saved_project.start_date + timedelta(days=saved_project.duration_days)
                    saved_project.save(update_fields=['end_date'])
            edit_request.status = ProjectEditRequest.Status.APPROVED
            notification_type = Notification.Type.PROJECT_EDIT_APPROVED
            audit_action = AuditLog.ActionType.PROJECT_EDIT_APPROVED
            ledger_type = ProjectLedgerEntry.EntryType.PROJECT_EDIT_APPROVED
        else:
            edit_request.status = ProjectEditRequest.Status.REJECTED
            notification_type = Notification.Type.PROJECT_EDIT_REJECTED
            audit_action = AuditLog.ActionType.PROJECT_EDIT_REJECTED
            ledger_type = ProjectLedgerEntry.EntryType.PROJECT_EDIT_REJECTED

        edit_request.save()

        Notification.objects.create(
            user=edit_request.requested_by,
            type=notification_type,
            title=f"Project edit {edit_request.status.lower()}",
            message=f"Your edit request for {edit_request.project.title} was {edit_request.status.lower()}.",
            related_id=str(edit_request.project.id),
            related_type=Notification.RelatedType.PROJECT,
        )

        AuditLog.objects.create(
            action_type=audit_action,
            actor=request.user,
            target_type=AuditLog.TargetType.PROJECT_EDIT_REQUEST,
            target_id=str(edit_request.id),
            metadata=to_json_safe({
                'project_id': str(edit_request.project.id),
                'project_name': edit_request.project.title,
                'edit_request_id': str(edit_request.id),
                'status': edit_request.status,
                'review_note': review_note,
                'changes': edit_request.changes,
            }),
        )
        ProjectLedgerEntry.objects.create(
            project=edit_request.project,
            entry_type=ledger_type,
            actor=request.user,
            metadata=to_json_safe({
                'edit_request_id': str(edit_request.id),
                'status': edit_request.status,
                'review_note': review_note,
                'changes': edit_request.changes,
            }),
        )

        return Response(ProjectEditRequestSerializer(edit_request).data)


class ProjectArchiveRequestListCreateView(generics.ListCreateAPIView):
    """List or create project archive requests."""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ProjectArchiveRequestSerializer

    def get_queryset(self):
        user = self.request.user
        if is_admin_user(user):
            status_filter = self.request.query_params.get('status')
            queryset = ProjectArchiveRequest.objects.all()
            if status_filter:
                queryset = queryset.filter(status=status_filter)
            return queryset
        return ProjectArchiveRequest.objects.filter(requested_by=user)

    def create(self, request, *args, **kwargs):
        project_id = request.data.get('project')
        if not project_id:
            return Response({'error': 'Project is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            project = Project.objects.get(pk=project_id, developer=request.user)
        except Project.DoesNotExist:
            return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)

        if project.status == Project.Status.ARCHIVED:
            return Response({'error': 'Project is already archived'}, status=status.HTTP_400_BAD_REQUEST)

        if ProjectArchiveRequest.objects.filter(project=project, status=ProjectArchiveRequest.Status.PENDING).exists():
            return Response({'error': 'Archive request already pending'}, status=status.HTTP_400_BAD_REQUEST)

        archive_request = ProjectArchiveRequest.objects.create(
            project=project,
            requested_by=request.user,
        )

        User = get_user_model()
        admins = User.objects.filter(role='ADMIN') | User.objects.filter(is_staff=True) | User.objects.filter(is_superuser=True)
        for admin in admins.distinct():
            Notification.objects.create(
                user=admin,
                type=Notification.Type.PROJECT_ARCHIVE_REQUESTED,
                title='Project archive request',
                message=f"{project.title} has a pending archive request.",
                related_id=str(archive_request.id),
                related_type=Notification.RelatedType.PROJECT_ARCHIVE_REQUEST,
            )

        AuditLog.objects.create(
            action_type=AuditLog.ActionType.PROJECT_ARCHIVE_REQUESTED,
            actor=request.user,
            target_type=AuditLog.TargetType.PROJECT,
            target_id=str(project.id),
            metadata=to_json_safe({
                'project_id': str(project.id),
                'project_name': project.title,
                'archive_request_id': str(archive_request.id),
            }),
        )
        ProjectLedgerEntry.objects.create(
            project=project,
            entry_type=ProjectLedgerEntry.EntryType.PROJECT_ARCHIVE_REQUESTED,
            actor=request.user,
            metadata=to_json_safe({
                'archive_request_id': str(archive_request.id),
            }),
        )

        return Response(ProjectArchiveRequestSerializer(archive_request).data, status=status.HTTP_201_CREATED)


class ProjectArchiveRequestReviewView(APIView):
    """Admin approve or reject project archive requests."""
    permission_classes = [IsAdminRole]

    def post(self, request, archive_request_id):
        try:
            archive_request = ProjectArchiveRequest.objects.get(pk=archive_request_id)
        except ProjectArchiveRequest.DoesNotExist:
            return Response({'error': 'Archive request not found'}, status=status.HTTP_404_NOT_FOUND)

        if archive_request.status != ProjectArchiveRequest.Status.PENDING:
            return Response({'error': 'Archive request already reviewed'}, status=status.HTTP_400_BAD_REQUEST)

        action = request.data.get('action')
        review_note = request.data.get('review_note')
        if action not in ['approve', 'reject']:
            return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)

        archive_request.reviewed_at = timezone.now()
        archive_request.reviewed_by = request.user
        archive_request.review_note = review_note

        if action == 'approve':
            archive_project_with_withdrawals(archive_request.project, actor=request.user, note=review_note)
            archive_request.status = ProjectArchiveRequest.Status.APPROVED
            notification_type = Notification.Type.PROJECT_ARCHIVE_APPROVED
            audit_action = AuditLog.ActionType.PROJECT_ARCHIVE_APPROVED
            ledger_type = ProjectLedgerEntry.EntryType.PROJECT_ARCHIVE_APPROVED
        else:
            archive_request.status = ProjectArchiveRequest.Status.REJECTED
            notification_type = Notification.Type.PROJECT_ARCHIVE_REJECTED
            audit_action = AuditLog.ActionType.PROJECT_ARCHIVE_REJECTED
            ledger_type = ProjectLedgerEntry.EntryType.PROJECT_ARCHIVE_REJECTED

        archive_request.save()

        Notification.objects.create(
            user=archive_request.requested_by,
            type=notification_type,
            title=f"Project archive {archive_request.status.lower()}",
            message=f"Your archive request for {archive_request.project.title} was {archive_request.status.lower()}.",
            related_id=str(archive_request.project.id),
            related_type=Notification.RelatedType.PROJECT,
        )

        AuditLog.objects.create(
            action_type=audit_action,
            actor=request.user,
            target_type=AuditLog.TargetType.PROJECT,
            target_id=str(archive_request.project.id),
            metadata=to_json_safe({
                'project_id': str(archive_request.project.id),
                'project_name': archive_request.project.title,
                'archive_request_id': str(archive_request.id),
                'status': archive_request.status,
                'review_note': review_note,
            }),
        )
        ProjectLedgerEntry.objects.create(
            project=archive_request.project,
            entry_type=ledger_type,
            actor=request.user,
            metadata=to_json_safe({
                'archive_request_id': str(archive_request.id),
                'status': archive_request.status,
                'review_note': review_note,
            }),
        )

        return Response(ProjectArchiveRequestSerializer(archive_request).data)


class ProjectComparatorView(APIView):
    """Return normalized comparison data for projects."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        project_ids = request.data.get('project_ids') or []
        if not isinstance(project_ids, list) or not project_ids:
            return Response({'error': 'project_ids list is required'}, status=status.HTTP_400_BAD_REQUEST)

        projects = Project.objects.filter(id__in=project_ids)
        if not projects.exists():
            return Response({'error': 'No projects found'}, status=status.HTTP_404_NOT_FOUND)

        def metric_values(attr):
            return [float(getattr(project, attr)) for project in projects]

        per_share_values = [project.per_share_price for project in projects]
        funding_values = [project.funding_progress for project in projects]
        total_values = metric_values('total_value')

        def normalize(value, min_val, max_val):
            if max_val == min_val:
                return 1
            return (value - min_val) / (max_val - min_val)

        min_per_share, max_per_share = min(per_share_values), max(per_share_values)
        min_funding, max_funding = min(funding_values), max(funding_values)
        min_total, max_total = min(total_values), max(total_values)

        data = []
        for project in projects:
            data.append({
                'id': project.id,
                'title': project.title,
                'category': project.category,
                'status': project.status,
                'total_value': float(project.total_value),
                'total_shares': project.total_shares,
                'shares_sold': project.shares_sold,
                'per_share_price': project.per_share_price,
                'funding_progress': project.funding_progress,
                'normalized': {
                    'per_share_price': normalize(project.per_share_price, min_per_share, max_per_share),
                    'funding_progress': normalize(project.funding_progress, min_funding, max_funding),
                    'total_value': normalize(float(project.total_value), min_total, max_total),
                },
            })

        return Response({
            'projects': data,
            'metrics': {
                'per_share_price': {'min': min_per_share, 'max': max_per_share},
                'funding_progress': {'min': min_funding, 'max': max_funding},
                'total_value': {'min': min_total, 'max': max_total},
            },
        })

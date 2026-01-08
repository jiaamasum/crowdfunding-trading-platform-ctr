from datetime import timedelta

import logging
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
import uuid

from .models import Investment, Payment
from notifications.models import Notification
from .serializers import InvestmentSerializer, InvestmentCreateSerializer, PaymentSerializer
from projects.models import Project
from audit.models import AuditLog, ProjectLedgerEntry
from config.permissions import IsAdminRole
from django.contrib.auth import get_user_model
from .utils import apply_investment_action, expire_investment_request

logger = logging.getLogger(__name__)

class InvestmentListCreateView(generics.ListCreateAPIView):
    """List or create investments."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        def is_admin(target):
            return target.is_authenticated and (
                getattr(target, 'role', None) == 'ADMIN'
                or getattr(target, 'is_staff', False)
                or getattr(target, 'is_superuser', False)
            )
        expired = Investment.objects.filter(
            status=Investment.Status.APPROVED,
            approval_expires_at__lt=timezone.now(),
        )
        for investment in expired:
            expire_investment_request(investment)
        status_filter = self.request.query_params.get('status')
        if is_admin(user):
            queryset = Investment.objects.all()
        elif user.role == 'DEVELOPER':
            queryset = Investment.objects.filter(project__developer=user)
        else:  # INVESTOR
            queryset = Investment.objects.filter(investor=user)

        if status_filter:
            queryset = queryset.filter(status=status_filter)
        project_id = self.request.query_params.get('project')
        investor_id = self.request.query_params.get('investor')
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        if investor_id:
            queryset = queryset.filter(investor_id=investor_id)
        return queryset
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return InvestmentCreateSerializer
        return InvestmentSerializer

    def perform_create(self, serializer):
        investment = serializer.save()
        User = get_user_model()
        admins = User.objects.filter(role='ADMIN') | User.objects.filter(is_staff=True) | User.objects.filter(is_superuser=True)
        project_title = investment.project.title
        for admin in admins.distinct():
            Notification.objects.create(
                user=admin,
                type='INVESTMENT_REQUESTED',
                title='New investment request',
                message=f"{investment.investor.name} requested to invest in {project_title}.",
                related_id=str(investment.id),
                related_type='investment',
            )
        AuditLog.objects.create(
            action_type=AuditLog.ActionType.INVESTMENT_REQUESTED,
            actor=self.request.user,
            target_type=AuditLog.TargetType.INVESTMENT,
            target_id=str(investment.id),
            metadata={
                'project_id': str(investment.project.id),
                'project_name': investment.project.title,
                'status': investment.status,
                'investor_id': str(investment.investor_id),
                'investor_name': investment.investor.name,
                'investor_email': investment.investor.email,
                'shares': investment.shares,
                'price_per_share': str(investment.price_per_share),
                'amount': str(investment.total_amount),
                'request_note': investment.request_note,
            },
        )
        ProjectLedgerEntry.objects.create(
            project=investment.project,
            entry_type=ProjectLedgerEntry.EntryType.INVESTMENT_REQUESTED,
            actor=self.request.user,
            metadata={
                'investment_id': str(investment.id),
                'investor_id': str(investment.investor_id),
                'investor_name': investment.investor.name,
                'investor_email': investment.investor.email,
                'shares': investment.shares,
                'price_per_share': str(investment.price_per_share),
                'amount': str(investment.total_amount),
                'request_note': investment.request_note,
            },
        )


class InvestmentDetailView(generics.RetrieveAPIView):
    """Get investment details."""
    serializer_class = InvestmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        is_admin = (
            getattr(user, 'role', None) == 'ADMIN'
            or getattr(user, 'is_staff', False)
            or getattr(user, 'is_superuser', False)
        )
        if is_admin:
            return Investment.objects.all()
        elif user.role == 'DEVELOPER':
            return Investment.objects.filter(project__developer=user)
        else:
            return Investment.objects.filter(investor=user)


class ProcessPaymentView(APIView):
    """Process payment for an investment (mock implementation)."""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, investment_id):
        try:
            investment = Investment.objects.get(pk=investment_id, investor=request.user)
        except Investment.DoesNotExist:
            return Response({'error': 'Investment not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if investment.status != Investment.Status.APPROVED:
            return Response({'error': 'Investment is not approved for payment'}, status=status.HTTP_400_BAD_REQUEST)

        if getattr(request.user, 'is_banned', False):
            return Response({'error': 'Banned users cannot invest'}, status=status.HTTP_403_FORBIDDEN)

        if investment.approval_expires_at and investment.approval_expires_at < timezone.now():
            expire_investment_request(investment, actor=request.user)
            return Response({'error': 'Investment request expired'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Mock payment processing
        payment_method = request.data.get('payment_method', 'card')
        
        pending_payment = investment.payments.filter(status=Payment.Status.PENDING).order_by('-created_at').first()
        if pending_payment:
            pending_payment.transaction_id = f"TXN-{uuid.uuid4().hex[:12].upper()}"
            pending_payment.status = Payment.Status.SUCCESS
            pending_payment.payment_method = payment_method
            pending_payment.amount = investment.total_amount
            pending_payment.processed_at = timezone.now()
            pending_payment.save(update_fields=['transaction_id', 'status', 'payment_method', 'amount', 'processed_at'])
            payment = pending_payment
        else:
            payment = Payment.objects.create(
                transaction_id=f"TXN-{uuid.uuid4().hex[:12].upper()}",
                investor=request.user,
                investment=investment,
                amount=investment.total_amount,
                status=Payment.Status.SUCCESS,
                payment_method=payment_method,
                processed_at=timezone.now()
            )

        AuditLog.objects.create(
            action_type=AuditLog.ActionType.PAYMENT_PROCESSED,
            actor=request.user,
            target_type=AuditLog.TargetType.PAYMENT,
            target_id=str(payment.id),
            metadata={
                'investment_id': str(investment.id),
                'project_id': str(investment.project.id),
                'project_name': investment.project.title,
                'status': payment.status,
                'transaction_id': payment.transaction_id,
                'payment_method': payment.payment_method,
                'amount': str(payment.amount),
            },
        )
        ProjectLedgerEntry.objects.create(
            project=investment.project,
            entry_type=ProjectLedgerEntry.EntryType.PAYMENT_PROCESSED,
            actor=request.user,
            metadata={
                'payment_id': str(payment.id),
                'investment_id': str(investment.id),
                'project_id': str(investment.project.id),
                'project_name': investment.project.title,
                'status': payment.status,
                'transaction_id': payment.transaction_id,
                'payment_method': payment.payment_method,
                'amount': str(payment.amount),
            },
        )
        
        investment.status = Investment.Status.PROCESSING
        investment.save(update_fields=['status'])

        project = investment.project
        Notification.objects.create(
            user=request.user,
            type='PAYMENT_SUCCESS',
            title='Payment received',
            message=f"Your payment for {project.title} has been received and is processing.",
            related_id=str(project.id),
            related_type='project',
        )

        User = get_user_model()
        admins = User.objects.filter(role='ADMIN') | User.objects.filter(is_staff=True) | User.objects.filter(is_superuser=True)
        for admin in admins.distinct():
            Notification.objects.create(
                user=admin,
                type='INVESTMENT_PROCESSING',
                title='Investment ready for review',
                message=f"Payment received for {project.title}. Review to complete the investment.",
                related_id=str(investment.id),
                related_type='investment',
            )

        AuditLog.objects.create(
            action_type=AuditLog.ActionType.INVESTMENT_PROCESSING,
            actor=request.user,
            target_type=AuditLog.TargetType.INVESTMENT,
            target_id=str(investment.id),
            metadata={
                'project_id': str(project.id),
                'project_name': project.title,
                'status': investment.status,
                'investor_id': str(investment.investor_id),
                'investor_name': investment.investor.name,
                'investor_email': investment.investor.email,
                'amount': str(investment.total_amount),
            },
        )
        ProjectLedgerEntry.objects.create(
            project=project,
            entry_type=ProjectLedgerEntry.EntryType.INVESTMENT_PROCESSING,
            actor=request.user,
            metadata={
                'investment_id': str(investment.id),
                'investor_id': str(investment.investor_id),
                'investor_name': investment.investor.name,
                'investor_email': investment.investor.email,
                'payment_id': str(payment.id),
                'transaction_id': payment.transaction_id,
                'payment_method': payment.payment_method,
                'amount': str(investment.total_amount),
            },
        )
        
        return Response({
            'investment': InvestmentSerializer(investment).data,
            'payment': PaymentSerializer(payment).data
        })


class PaymentListView(generics.ListAPIView):
    """List payments."""
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        is_admin = (
            getattr(user, 'role', None) == 'ADMIN'
            or getattr(user, 'is_staff', False)
            or getattr(user, 'is_superuser', False)
        )
        if is_admin:
            return Payment.objects.all()
        return Payment.objects.filter(investor=user)


class InvestmentRevokeView(APIView):
    """Investor revokes an investment request."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, investment_id):
        try:
            investment = Investment.objects.get(pk=investment_id, investor=request.user)
        except Investment.DoesNotExist:
            return Response({'error': 'Investment not found'}, status=status.HTTP_404_NOT_FOUND)

        if investment.status not in [Investment.Status.REQUESTED, Investment.Status.APPROVED]:
            return Response({'error': 'Investment cannot be revoked'}, status=status.HTTP_400_BAD_REQUEST)

        if investment.status == Investment.Status.APPROVED:
            if expire_investment_request(investment, actor=request.user):
                return Response(InvestmentSerializer(investment).data)

        investment.status = Investment.Status.CANCELLED
        investment.approval_expires_at = None
        investment.save(update_fields=['status', 'approval_expires_at'])

        pending_payment = investment.payments.filter(status=Payment.Status.PENDING).order_by('-created_at').first()
        if pending_payment:
            pending_payment.status = Payment.Status.FAILED
            pending_payment.processed_at = timezone.now()
            pending_payment.save(update_fields=['status', 'processed_at'])

        project = investment.project
        AuditLog.objects.create(
            action_type=AuditLog.ActionType.INVESTMENT_CANCELLED,
            actor=request.user,
            target_type=AuditLog.TargetType.INVESTMENT,
            target_id=str(investment.id),
            metadata={
                'project_id': str(project.id),
                'project_name': project.title,
                'status': investment.status,
                'investor_id': str(investment.investor_id),
                'investor_name': investment.investor.name,
                'investor_email': investment.investor.email,
                'shares': investment.shares,
                'price_per_share': str(investment.price_per_share),
                'amount': str(investment.total_amount),
            },
        )
        ProjectLedgerEntry.objects.create(
            project=project,
            entry_type=ProjectLedgerEntry.EntryType.INVESTMENT_CANCELLED,
            actor=request.user,
            metadata={
                'investment_id': str(investment.id),
                'investor_id': str(investment.investor_id),
                'investor_name': investment.investor.name,
                'investor_email': investment.investor.email,
                'shares': investment.shares,
                'price_per_share': str(investment.price_per_share),
                'amount': str(investment.total_amount),
            },
        )

        return Response(InvestmentSerializer(investment).data)


class InvestmentReviewView(APIView):
    """Admin approve or reject an investment request."""
    permission_classes = [IsAdminRole]

    def post(self, request, investment_id):
        try:
            investment = Investment.objects.get(pk=investment_id)
        except Investment.DoesNotExist:
            return Response({'error': 'Investment not found'}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action')
        admin_note = request.data.get('admin_note')
        expires_in_days = request.data.get('expires_in_days', 7)

        if action not in ['approve', 'reject']:
            return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)

        is_requested = investment.status == Investment.Status.REQUESTED
        is_approved = investment.status == Investment.Status.APPROVED
        if not is_requested and not (is_approved and action == 'approve'):
            return Response({'error': 'Investment is not awaiting review'}, status=status.HTTP_400_BAD_REQUEST)

        investment.reviewed_at = timezone.now()
        investment.reviewed_by = request.user
        investment.admin_note = admin_note or investment.admin_note

        if action == 'approve':
            try:
                expires_in_days = int(expires_in_days)
            except (TypeError, ValueError):
                expires_in_days = 7
            investment.status = Investment.Status.APPROVED
            investment.approval_expires_at = timezone.now() + timedelta(days=max(1, expires_in_days))
            notification_type = 'INVESTMENT_APPROVED'
            ledger_type = ProjectLedgerEntry.EntryType.INVESTMENT_APPROVED
            audit_action = AuditLog.ActionType.INVESTMENT_APPROVED
        else:
            investment.status = Investment.Status.REJECTED
            investment.approval_expires_at = None
            notification_type = 'INVESTMENT_REJECTED'
            ledger_type = ProjectLedgerEntry.EntryType.INVESTMENT_REJECTED
            audit_action = AuditLog.ActionType.INVESTMENT_REJECTED

        investment.save()

        if action == 'approve':
            try:
                existing_payment = investment.payments.filter(
                    status__in=[Payment.Status.PENDING, Payment.Status.SUCCESS]
                ).first()
                if not existing_payment:
                    Payment.objects.create(
                        transaction_id=f"PENDING-{uuid.uuid4().hex[:12].upper()}",
                        investor=investment.investor,
                        investment=investment,
                        amount=investment.total_amount,
                        status=Payment.Status.PENDING,
                    )
            except Exception:
                logger.exception('Failed to create pending payment for investment %s', investment.id)

        try:
            Notification.objects.create(
                user=investment.investor,
                type=notification_type,
                title=f"Investment {investment.status.lower()}",
                message=f"Your investment request for {investment.project.title} was {investment.status.lower()}.",
                related_id=str(investment.project.id),
                related_type='project',
            )
        except Exception:
            logger.exception('Failed to create notification for investment %s', investment.id)

        try:
            AuditLog.objects.create(
                action_type=audit_action,
                actor=request.user,
                target_type=AuditLog.TargetType.INVESTMENT,
                target_id=str(investment.id),
                metadata={
                    'project_id': str(investment.project.id),
                    'project_name': investment.project.title,
                    'status': investment.status,
                    'investor_id': str(investment.investor_id),
                    'investor_name': investment.investor.name,
                    'investor_email': investment.investor.email,
                    'shares': investment.shares,
                    'price_per_share': str(investment.price_per_share),
                    'amount': str(investment.total_amount),
                    'admin_note': admin_note,
                    'expires_at': investment.approval_expires_at,
                },
            )
        except Exception:
            logger.exception('Failed to create audit log for investment %s', investment.id)

        try:
            ProjectLedgerEntry.objects.create(
                project=investment.project,
                entry_type=ledger_type,
                actor=request.user,
                metadata={
                    'investment_id': str(investment.id),
                    'investor_id': str(investment.investor_id),
                    'investor_name': investment.investor.name,
                    'investor_email': investment.investor.email,
                    'shares': investment.shares,
                    'price_per_share': str(investment.price_per_share),
                    'amount': str(investment.total_amount),
                    'admin_note': admin_note,
                    'expires_at': investment.approval_expires_at,
                },
            )
        except Exception:
            logger.exception('Failed to create project ledger entry for investment %s', investment.id)

        return Response(InvestmentSerializer(investment).data)


class InvestmentCompleteView(APIView):
    """Admin completes processing investments."""
    permission_classes = [IsAdminRole]

    def post(self, request, investment_id):
        try:
            investment = Investment.objects.get(pk=investment_id)
        except Investment.DoesNotExist:
            return Response({'error': 'Investment not found'}, status=status.HTTP_404_NOT_FOUND)

        if investment.status != Investment.Status.PROCESSING:
            return Response({'error': 'Investment is not processing'}, status=status.HTTP_400_BAD_REQUEST)

        admin_note = request.data.get('admin_note')

        investment.status = Investment.Status.COMPLETED
        investment.completed_at = timezone.now()
        if admin_note:
            investment.admin_note = admin_note
            investment.save(update_fields=['status', 'completed_at', 'admin_note'])
        else:
            investment.save(update_fields=['status', 'completed_at'])

        project = investment.project
        project.shares_sold += investment.shares
        project.save(update_fields=['shares_sold'])

        Notification.objects.create(
            user=investment.investor,
            type='INVESTMENT_COMPLETED',
            title='Investment completed',
            message=f"Your investment in {project.title} has been completed.",
            related_id=str(project.id),
            related_type='project',
        )

        AuditLog.objects.create(
            action_type=AuditLog.ActionType.INVESTMENT_COMPLETED,
            actor=request.user,
            target_type=AuditLog.TargetType.INVESTMENT,
            target_id=str(investment.id),
            metadata={
                'project_id': str(project.id),
                'project_name': project.title,
                'status': investment.status,
                'admin_note': admin_note,
                'investor_id': str(investment.investor_id),
                'investor_name': investment.investor.name,
                'investor_email': investment.investor.email,
                'shares': investment.shares,
                'amount': str(investment.total_amount),
            },
        )
        ProjectLedgerEntry.objects.create(
            project=project,
            entry_type=ProjectLedgerEntry.EntryType.INVESTMENT_COMPLETED,
            actor=request.user,
            metadata={
                'investment_id': str(investment.id),
                'investor_id': str(investment.investor_id),
                'investor_name': investment.investor.name,
                'investor_email': investment.investor.email,
                'shares': investment.shares,
                'amount': str(investment.total_amount),
                'admin_note': admin_note,
            },
        )

        return Response(InvestmentSerializer(investment).data)


class InvestmentAdminActionView(APIView):
    """Admin refund/withdraw/reverse an investment."""
    permission_classes = [IsAdminRole]

    def post(self, request, investment_id):
        try:
            investment = Investment.objects.get(pk=investment_id)
        except Investment.DoesNotExist:
            return Response({'error': 'Investment not found'}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action')
        admin_note = request.data.get('admin_note')
        if action not in ['refund', 'withdraw', 'reverse']:
            return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)

        payment = investment.payments.order_by('-created_at').first()
        if action == 'refund' and payment:
            payment.status = Payment.Status.REFUNDED
            payment.processed_at = timezone.now()
            payment.save(update_fields=['status', 'processed_at'])
            AuditLog.objects.create(
                action_type=AuditLog.ActionType.PAYMENT_REFUNDED,
                actor=request.user,
                target_type=AuditLog.TargetType.PAYMENT,
                target_id=str(payment.id),
                metadata={
                    'investment_id': str(investment.id),
                    'project_id': str(investment.project.id),
                    'project_name': investment.project.title,
                    'status': payment.status,
                    'transaction_id': payment.transaction_id,
                    'amount': str(payment.amount),
                },
            )
            ProjectLedgerEntry.objects.create(
                project=investment.project,
                entry_type=ProjectLedgerEntry.EntryType.PAYMENT_REFUNDED,
                actor=request.user,
                metadata={
                    'payment_id': str(payment.id),
                    'investment_id': str(investment.id),
                    'project_id': str(investment.project.id),
                    'project_name': investment.project.title,
                    'status': payment.status,
                    'transaction_id': payment.transaction_id,
                    'amount': str(payment.amount),
                },
            )
        elif action == 'withdraw' and payment:
            payment.status = Payment.Status.WITHDRAWN
            payment.processed_at = timezone.now()
            payment.save(update_fields=['status', 'processed_at'])
            AuditLog.objects.create(
                action_type=AuditLog.ActionType.PAYMENT_WITHDRAWN,
                actor=request.user,
                target_type=AuditLog.TargetType.PAYMENT,
                target_id=str(payment.id),
                metadata={
                    'investment_id': str(investment.id),
                    'project_id': str(investment.project.id),
                    'project_name': investment.project.title,
                    'status': payment.status,
                    'transaction_id': payment.transaction_id,
                    'amount': str(payment.amount),
                },
            )
            ProjectLedgerEntry.objects.create(
                project=investment.project,
                entry_type=ProjectLedgerEntry.EntryType.PAYMENT_WITHDRAWN,
                actor=request.user,
                metadata={
                    'payment_id': str(payment.id),
                    'investment_id': str(investment.id),
                    'project_id': str(investment.project.id),
                    'project_name': investment.project.title,
                    'status': payment.status,
                    'transaction_id': payment.transaction_id,
                    'amount': str(payment.amount),
                },
            )
        elif action == 'reverse' and payment:
            payment.status = Payment.Status.REVERSED
            payment.processed_at = timezone.now()
            payment.save(update_fields=['status', 'processed_at'])
            AuditLog.objects.create(
                action_type=AuditLog.ActionType.PAYMENT_REVERSED,
                actor=request.user,
                target_type=AuditLog.TargetType.PAYMENT,
                target_id=str(payment.id),
                metadata={
                    'investment_id': str(investment.id),
                    'project_id': str(investment.project.id),
                    'project_name': investment.project.title,
                    'status': payment.status,
                    'transaction_id': payment.transaction_id,
                    'amount': str(payment.amount),
                },
            )
            ProjectLedgerEntry.objects.create(
                project=investment.project,
                entry_type=ProjectLedgerEntry.EntryType.PAYMENT_REVERSED,
                actor=request.user,
                metadata={
                    'payment_id': str(payment.id),
                    'investment_id': str(investment.id),
                    'project_id': str(investment.project.id),
                    'project_name': investment.project.title,
                    'status': payment.status,
                    'transaction_id': payment.transaction_id,
                    'amount': str(payment.amount),
                },
            )

        apply_investment_action(investment, action, actor=request.user, admin_note=admin_note)
        return Response(InvestmentSerializer(investment).data)

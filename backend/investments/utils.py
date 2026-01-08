from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from audit.models import AuditLog, ProjectLedgerEntry
from .models import Payment
from notifications.models import Notification
from users.models import Wallet, WalletTransaction


def get_or_create_wallet(user):
    wallet, _ = Wallet.objects.get_or_create(user=user, defaults={'balance': 0})
    return wallet


def credit_wallet(user, amount, tx_type, project=None, investment=None, reference=None):
    wallet = get_or_create_wallet(user)
    wallet.balance = wallet.balance + Decimal(amount)
    wallet.save(update_fields=['balance', 'updated_at'])
    WalletTransaction.objects.create(
        wallet=wallet,
        amount=Decimal(amount),
        type=tx_type,
        reference=reference,
        project_id=str(project.id) if project else None,
        project_name=project.title if project else None,
        investment_id=str(investment.id) if investment else None,
    )


def release_project_shares(project, shares):
    project.shares_sold = max(0, project.shares_sold - shares)
    project.save(update_fields=['shares_sold'])


@transaction.atomic
def apply_investment_action(investment, action, actor=None, admin_note=None):
    project = investment.project
    now = timezone.now()
    status_map = {
        'refund': investment.Status.REFUNDED,
        'withdraw': investment.Status.WITHDRAWN,
        'reverse': investment.Status.REVERSED,
    }
    if action not in status_map:
        raise ValueError('Invalid investment action')

    if investment.status == investment.Status.COMPLETED:
        release_project_shares(project, investment.shares)

    investment.status = status_map[action]
    investment.admin_note = admin_note or investment.admin_note
    investment.withdrawn_at = now
    investment.save(update_fields=['status', 'admin_note', 'withdrawn_at'])

    credit_wallet(
        investment.investor,
        investment.total_amount,
        {
            'refund': WalletTransaction.Type.REFUND,
            'withdraw': WalletTransaction.Type.WITHDRAW,
            'reverse': WalletTransaction.Type.REVERSE,
        }[action],
        project=project,
        investment=investment,
        reference=f"{action.upper()}-{investment.id}",
    )

    ledger_type = {
        'refund': ProjectLedgerEntry.EntryType.INVESTMENT_REFUNDED,
        'withdraw': ProjectLedgerEntry.EntryType.INVESTMENT_WITHDRAWN,
        'reverse': ProjectLedgerEntry.EntryType.INVESTMENT_REVERSED,
    }[action]
    ProjectLedgerEntry.objects.create(
        project=project,
        entry_type=ledger_type,
        actor=actor,
        metadata={
            'investment_id': str(investment.id),
            'investor_id': str(investment.investor_id),
            'investor_name': investment.investor.name,
            'investor_email': investment.investor.email,
            'amount': str(investment.total_amount),
            'shares': investment.shares,
            'price_per_share': str(investment.price_per_share),
            'admin_note': admin_note,
        },
    )

    action_type = {
        'refund': AuditLog.ActionType.INVESTMENT_REFUNDED,
        'withdraw': AuditLog.ActionType.INVESTMENT_WITHDRAWN,
        'reverse': AuditLog.ActionType.INVESTMENT_REVERSED,
    }[action]
    AuditLog.objects.create(
        action_type=action_type,
        actor=actor or investment.investor,
        target_type=AuditLog.TargetType.INVESTMENT,
        target_id=str(investment.id),
        metadata={
            'status': investment.status,
            'project_id': str(project.id),
            'project_name': project.title,
            'action': action,
            'investor_id': str(investment.investor_id),
            'investor_name': investment.investor.name,
            'investor_email': investment.investor.email,
            'amount': str(investment.total_amount),
            'shares': investment.shares,
            'price_per_share': str(investment.price_per_share),
            'admin_note': admin_note,
        },
    )

    notification_type = {
        'refund': 'INVESTMENT_REFUNDED',
        'withdraw': 'INVESTMENT_WITHDRAWN',
        'reverse': 'INVESTMENT_REVERSED',
    }[action]
    action_label = {
        'refund': 'refunded',
        'withdraw': 'withdrawn',
        'reverse': 'reversed',
    }[action]
    Notification.objects.create(
        user=investment.investor,
        type=notification_type,
        title=f"Investment {action_label}",
        message=f"Your investment in {project.title} was {action_label}.",
        related_id=str(project.id),
        related_type='project',
    )


def expire_investment_request(investment, actor=None):
    if investment.status != investment.Status.APPROVED:
        return False
    if not investment.approval_expires_at or investment.approval_expires_at >= timezone.now():
        return False

    investment.status = investment.Status.EXPIRED
    investment.save(update_fields=['status'])

    pending_payment = investment.payments.filter(status=Payment.Status.PENDING).order_by('-created_at').first()
    if pending_payment:
        pending_payment.status = Payment.Status.FAILED
        pending_payment.processed_at = timezone.now()
        pending_payment.save(update_fields=['status', 'processed_at'])

    actor = actor or investment.investor
    project = investment.project

    Notification.objects.create(
        user=investment.investor,
        type='INVESTMENT_EXPIRED',
        title='Investment request expired',
        message=f"Your investment request for {project.title} has expired.",
        related_id=str(project.id),
        related_type='project',
    )
    AuditLog.objects.create(
        action_type=AuditLog.ActionType.INVESTMENT_EXPIRED,
        actor=actor,
        target_type=AuditLog.TargetType.INVESTMENT,
        target_id=str(investment.id),
        metadata={
            'status': investment.status,
            'project_id': str(project.id),
            'project_name': project.title,
            'investor_id': str(investment.investor_id),
            'investor_name': investment.investor.name,
            'investor_email': investment.investor.email,
            'shares': investment.shares,
            'amount': str(investment.total_amount),
            'expires_at': investment.approval_expires_at,
        },
    )
    ProjectLedgerEntry.objects.create(
        project=project,
        entry_type=ProjectLedgerEntry.EntryType.INVESTMENT_EXPIRED,
        actor=actor,
        metadata={
            'investment_id': str(investment.id),
            'investor_id': str(investment.investor_id),
            'investor_name': investment.investor.name,
            'investor_email': investment.investor.email,
            'shares': investment.shares,
            'amount': str(investment.total_amount),
            'expires_at': investment.approval_expires_at,
        },
    )
    return True

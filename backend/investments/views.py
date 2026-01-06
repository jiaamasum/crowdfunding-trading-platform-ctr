from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
import uuid

from .models import Investment, Payment
from notifications.models import Notification
from .serializers import InvestmentSerializer, InvestmentCreateSerializer, PaymentSerializer
from projects.models import Project


class InvestmentListCreateView(generics.ListCreateAPIView):
    """List or create investments."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return Investment.objects.all()
        elif user.role == 'DEVELOPER':
            return Investment.objects.filter(project__developer=user)
        else:  # INVESTOR
            return Investment.objects.filter(investor=user)
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return InvestmentCreateSerializer
        return InvestmentSerializer


class InvestmentDetailView(generics.RetrieveAPIView):
    """Get investment details."""
    serializer_class = InvestmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
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
        
        if investment.status != 'PENDING':
            return Response({'error': 'Investment already processed'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Mock payment processing
        payment_method = request.data.get('payment_method', 'card')
        
        # Create payment record
        payment = Payment.objects.create(
            transaction_id=f"TXN-{uuid.uuid4().hex[:12].upper()}",
            investor=request.user,
            investment=investment,
            amount=investment.total_amount,
            status='SUCCESS',
            payment_method=payment_method,
            processed_at=timezone.now()
        )
        
        # Update investment status
        investment.status = 'COMPLETED'
        investment.completed_at = timezone.now()
        investment.save()
        
        # Update project shares sold
        project = investment.project
        project.shares_sold += investment.shares
        project.save()

        Notification.objects.create(
            user=request.user,
            type='INVESTMENT_SUCCESS',
            title='Investment completed',
            message=f"Your investment in {project.title} has been completed successfully.",
            related_id=str(project.id),
            related_type='project',
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
        if user.role == 'ADMIN':
            return Payment.objects.all()
        return Payment.objects.filter(investor=user)

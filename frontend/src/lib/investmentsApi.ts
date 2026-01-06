import apiClient from '@/lib/apiClient';
import type { Investment, Payment } from '@/types';

const mapInvestment = (item: any): Investment => ({
  id: String(item.id),
  investorId: String(item.investor),
  investorName: item.investor_name || '',
  investorEmail: item.investor_email || '',
  projectId: String(item.project),
  projectTitle: item.project_title || '',
  shares: Number(item.shares || 0),
  pricePerShare: Number(item.price_per_share || 0),
  totalAmount: Number(item.total_amount || 0),
  status: item.status,
  createdAt: item.created_at || new Date().toISOString(),
  completedAt: item.completed_at || undefined,
});

const mapPayment = (item: any): Payment => ({
  id: String(item.id),
  transactionId: item.transaction_id || '',
  investorId: String(item.investor),
  investorName: item.investor_name || '',
  investmentId: String(item.investment),
  amount: Number(item.amount || 0),
  status: item.status,
  paymentMethod: item.payment_method || '',
  createdAt: item.created_at || new Date().toISOString(),
  processedAt: item.processed_at || undefined,
});

export const investmentsApi = {
  async list(): Promise<Investment[]> {
    const response = await apiClient.get('/investments/');
    const results = Array.isArray(response.data.results) ? response.data.results : response.data;
    return results.map(mapInvestment);
  },
};

export const paymentsApi = {
  async list(): Promise<Payment[]> {
    const response = await apiClient.get('/investments/payments/');
    const results = Array.isArray(response.data.results) ? response.data.results : response.data;
    return results.map(mapPayment);
  },
};

import apiClient from '@/lib/apiClient';
import type { Investment, Payment } from '@/types';

const mapInvestment = (item: any): Investment => {
  const isActive = item.is_active ?? item.status === 'COMPLETED';
  return {
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
    requestNote: item.request_note || undefined,
    adminNote: item.admin_note || undefined,
    reviewedAt: item.reviewed_at || undefined,
    reviewedBy: item.reviewed_by ? String(item.reviewed_by) : undefined,
    reviewedByName: item.reviewed_by_name || undefined,
    approvalExpiresAt: item.approval_expires_at || undefined,
    createdAt: item.created_at || new Date().toISOString(),
    completedAt: item.completed_at || undefined,
    withdrawnAt: item.withdrawn_at || undefined,
    isActive,
    activityStatus: item.activity_status || (isActive ? 'ACTIVE' : 'INACTIVE'),
  };
};

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
  async list(params?: { status?: string; project?: string; investor?: string }): Promise<Investment[]> {
    const response = await apiClient.get('/investments/', { params });
    const results = Array.isArray(response.data.results) ? response.data.results : response.data;
    return results.map(mapInvestment);
  },

  async requestInvestment(projectId: string, shares: number, requestNote?: string): Promise<Investment> {
    const response = await apiClient.post('/investments/', {
      project: Number(projectId),
      shares,
      request_note: requestNote,
    });
    return mapInvestment(response.data);
  },

  async pay(investmentId: string, paymentMethod: string): Promise<void> {
    await apiClient.post(`/investments/${investmentId}/pay/`, { payment_method: paymentMethod });
  },

  async review(investmentId: string, action: 'approve' | 'reject', expiresInDays?: number, adminNote?: string): Promise<Investment> {
    const response = await apiClient.post(`/investments/${investmentId}/review/`, {
      action,
      expires_in_days: expiresInDays,
      admin_note: adminNote,
    });
    return mapInvestment(response.data);
  },

  async revoke(investmentId: string): Promise<Investment> {
    const response = await apiClient.post(`/investments/${investmentId}/revoke/`);
    return mapInvestment(response.data);
  },

  async complete(investmentId: string, adminNote?: string): Promise<Investment> {
    const response = await apiClient.post(`/investments/${investmentId}/complete/`, {
      admin_note: adminNote,
    });
    return mapInvestment(response.data);
  },

  async adminAction(investmentId: string, action: 'refund' | 'withdraw' | 'reverse', adminNote?: string): Promise<Investment> {
    const response = await apiClient.post(`/investments/${investmentId}/action/`, { action, admin_note: adminNote });
    return mapInvestment(response.data);
  },
};

export const paymentsApi = {
  async list(): Promise<Payment[]> {
    const response = await apiClient.get('/investments/payments/');
    const results = Array.isArray(response.data.results) ? response.data.results : response.data;
    return results.map(mapPayment);
  },
};

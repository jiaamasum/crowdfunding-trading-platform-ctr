import apiClient from '@/lib/apiClient';

export type AccessRequest = {
  id: string;
  investor?: string;
  project: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED';
  message?: string;
  admin_note?: string | null;
  investor_name?: string;
  investor_email?: string;
  project_title?: string;
  created_at?: string;
  decided_at?: string | null;
};

export const accessRequestsApi = {
  async listMine(): Promise<AccessRequest[]> {
    const response = await apiClient.get('/access-requests/');
    const results = Array.isArray(response.data.results) ? response.data.results : response.data;
    return results.map((item: any) => ({
      id: String(item.id),
      project: String(item.project),
      status: item.status,
      message: item.message,
      admin_note: item.admin_note,
      project_title: item.project_title,
      created_at: item.created_at,
      decided_at: item.decided_at,
    }));
  },

  async listAll(status?: AccessRequest['status']): Promise<AccessRequest[]> {
    const response = await apiClient.get('/access-requests/', {
      params: { status },
    });
    const results = Array.isArray(response.data.results) ? response.data.results : response.data;
    return results.map((item: any) => ({
      id: String(item.id),
      investor: item.investor ? String(item.investor) : undefined,
      project: String(item.project),
      status: item.status,
      message: item.message,
      admin_note: item.admin_note,
      investor_name: item.investor_name,
      investor_email: item.investor_email,
      project_title: item.project_title,
      created_at: item.created_at,
      decided_at: item.decided_at,
    })) as any;
  },

  async create(projectId: string, message?: string): Promise<AccessRequest> {
    const response = await apiClient.post('/access-requests/', {
      project: Number(projectId),
      message,
    });
    return {
      id: String(response.data.id),
      project: String(response.data.project),
      status: response.data.status,
      message: response.data.message,
      admin_note: response.data.admin_note,
    };
  },

  async decide(id: string, action: 'approve' | 'reject' | 'revoke', adminNote: string): Promise<void> {
    await apiClient.post(`/access-requests/${id}/decide/`, {
      action,
      admin_note: adminNote,
    });
  },

  async revoke(id: string): Promise<AccessRequest> {
    const response = await apiClient.post(`/access-requests/${id}/revoke/`);
    return {
      id: String(response.data.id),
      project: String(response.data.project),
      status: response.data.status,
      message: response.data.message,
      admin_note: response.data.admin_note,
      project_title: response.data.project_title,
      created_at: response.data.created_at,
      decided_at: response.data.decided_at,
    };
  },
};

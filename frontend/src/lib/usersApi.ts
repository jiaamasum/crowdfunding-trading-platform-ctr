import apiClient from '@/lib/apiClient';
import { normalizeMediaUrl } from '@/lib/media';
import type { User, Wallet } from '@/types';

const mapUser = (item: any): User => ({
  id: String(item.id),
  email: item.email || '',
  name: item.name || '',
  role: item.role,
  isVerified: Boolean(item.is_verified),
  isBanned: Boolean(item.is_banned),
  avatarUrl: normalizeMediaUrl(item.avatar_url, 'users-profile-image'),
  walletBalance: item.wallet_balance !== undefined ? Number(item.wallet_balance) : undefined,
  createdAt: item.date_joined || new Date().toISOString(),
  updatedAt: item.updated_at || item.date_joined || new Date().toISOString(),
});

export const usersApi = {
  async list(role?: string): Promise<User[]> {
    const response = await apiClient.get('/users/', {
      params: role ? { role } : undefined,
    });
    const results = Array.isArray(response.data.results) ? response.data.results : response.data;
    return results.map(mapUser);
  },

  async getById(id: string): Promise<User | null> {
    try {
      const response = await apiClient.get(`/users/${id}/`);
      return mapUser(response.data);
    } catch {
      return null;
    }
  },

  async ban(id: string, resolution?: 'refund' | 'withdraw' | 'reverse'): Promise<User> {
    const response = await apiClient.post(`/users/${id}/ban/`, { resolution });
    return mapUser(response.data);
  },

  async unban(id: string): Promise<User> {
    const response = await apiClient.post(`/users/${id}/unban/`);
    return mapUser(response.data);
  },

  async getWallet(): Promise<Wallet> {
    const response = await apiClient.get('/auth/wallet/');
    return response.data;
  },
};

import apiClient from '@/lib/apiClient';
import type { User } from '@/types';

const mapUser = (item: any): User => ({
  id: String(item.id),
  email: item.email || '',
  name: item.name || '',
  role: item.role,
  isVerified: Boolean(item.is_verified),
  avatarUrl: item.avatar_url || undefined,
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
};

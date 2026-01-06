import apiClient from '@/lib/apiClient';
import type { Notification } from '@/types';

const mapNotification = (item: any): Notification => ({
  id: String(item.id),
  userId: String(item.user),
  type: item.type,
  title: item.title,
  message: item.message,
  isRead: item.is_read,
  relatedId: item.related_id || undefined,
  relatedType: item.related_type || undefined,
  createdAt: item.created_at,
});

export const notificationsApi = {
  async list(): Promise<Notification[]> {
    const response = await apiClient.get('/notifications/');
    const results = Array.isArray(response.data.results) ? response.data.results : response.data;
    return results.map(mapNotification);
  },

  async markRead(id: string): Promise<void> {
    await apiClient.patch(`/notifications/${id}/read/`);
  },

  async markAllRead(): Promise<void> {
    await apiClient.post('/notifications/read-all/');
  },

  async unreadCount(): Promise<number> {
    const response = await apiClient.get('/notifications/unread-count/');
    return response.data.unread_count || 0;
  },
};

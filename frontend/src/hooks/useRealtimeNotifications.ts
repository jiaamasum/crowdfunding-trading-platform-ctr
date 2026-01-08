import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { notificationsApi } from '@/lib/notificationsApi';
import { useToast } from '@/hooks/use-toast';
import { getAccessToken } from '@/lib/apiClient';
import { getApiBaseUrl } from '@/lib/env';
import type { Notification } from '@/types';

const API_BASE_URL = getApiBaseUrl();

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

export function useRealtimeNotifications() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const seenIds = useRef(new Set<string>());

  const applyNotificationUpdate = useCallback((updater: (items: Notification[]) => Notification[]) => {
    setNotifications((prev) => {
      const updated = updater(prev);
      setUnreadCount(updated.filter((item) => !item.isRead).length);
      return updated;
    });
  }, []);

  const broadcastUpdate = useCallback((detail: { type: 'markAllRead' } | { type: 'markRead'; id: string }) => {
    window.dispatchEvent(new CustomEvent('notifications:update', { detail }));
  }, []);

  // Load initial notifications
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);

    notificationsApi.list()
      .then((items) => {
        setNotifications(items);
        setUnreadCount(items.filter(n => !n.isRead).length);
        seenIds.current = new Set(items.map((n) => n.id));
      })
      .catch((error) => {
        console.error('Failed to load notifications', error);
      })
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (!detail || !detail.type) return;
      if (detail.type === 'markAllRead') {
        applyNotificationUpdate((prev) => prev.map((n) => ({ ...n, isRead: true })));
        return;
      }
      if (detail.type === 'markRead' && detail.id) {
        applyNotificationUpdate((prev) =>
          prev.map((n) => (n.id === detail.id ? { ...n, isRead: true } : n))
        );
      }
    };

    window.addEventListener('notifications:update', handler as EventListener);
    return () => window.removeEventListener('notifications:update', handler as EventListener);
  }, [applyNotificationUpdate]);

  // Real-time notifications via SSE
  useEffect(() => {
    if (!user) return;
    const token = getAccessToken();
    if (!token) return;

    const source = new EventSource(`${API_BASE_URL}/notifications/stream/?token=${encodeURIComponent(token)}`);

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const notification = mapNotification(payload);
        if (seenIds.current.has(notification.id)) return;
        seenIds.current.add(notification.id);
        setNotifications((prev) => [notification, ...prev]);
        if (!notification.isRead) {
          setUnreadCount((prev) => prev + 1);
        }
        toast({
          title: notification.title,
          description: notification.message,
        });
      } catch (error) {
        console.error('Failed to parse notification event', error);
      }
    };

    source.onerror = (error) => {
      console.error('Notification stream error', error);
    };

    return () => source.close();
  }, [user, toast]);

  const markAsRead = useCallback(async (notificationId: string) => {
    // Optimistic update
    applyNotificationUpdate((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
    broadcastUpdate({ type: 'markRead', id: notificationId });

    await notificationsApi.markRead(notificationId);
    
    console.log('[Notifications] Marked as read:', notificationId);
  }, [applyNotificationUpdate, broadcastUpdate]);

  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    applyNotificationUpdate((prev) => prev.map((n) => ({ ...n, isRead: true })));
    broadcastUpdate({ type: 'markAllRead' });

    await notificationsApi.markAllRead();

    console.log('[Notifications] Marked all as read');
  }, [applyNotificationUpdate, broadcastUpdate]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  };
}

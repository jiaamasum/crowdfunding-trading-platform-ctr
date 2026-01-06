import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { notificationsApi } from '@/lib/notificationsApi';
import { useToast } from '@/hooks/use-toast';
import type { Notification } from '@/types';

export function useRealtimeNotifications() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const seenIds = useRef(new Set<string>());

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

  // Poll for new notifications
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      try {
        const items = await notificationsApi.list();
        setNotifications(items);
        setUnreadCount(items.filter(n => !n.isRead).length);
        const newItems = items.filter((n) => !seenIds.current.has(n.id));
        newItems.forEach((notification) => {
          toast({
            title: notification.title,
            description: notification.message,
          });
          seenIds.current.add(notification.id);
        });
      } catch (error) {
        console.error('Failed to refresh notifications', error);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [user, toast]);

  const markAsRead = useCallback(async (notificationId: string) => {
    // Optimistic update
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    await notificationsApi.markRead(notificationId);
    
    console.log('[Notifications] Marked as read:', notificationId);
  }, []);

  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);

    await notificationsApi.markAllRead();

    console.log('[Notifications] Marked all as read');
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  };
}

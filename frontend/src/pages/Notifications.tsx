import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  BellOff,
  Check,
  CheckCheck,
  ShieldCheck,
  FileCheck,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { notificationsApi } from '@/lib/notificationsApi';
import type { Notification } from '@/types';
import { cn } from '@/lib/utils';

const notificationIcons: Record<string, typeof Bell> = {
  'INVESTMENT_REQUESTED': DollarSign,
  'INVESTMENT_APPROVED': DollarSign,
  'INVESTMENT_REJECTED': AlertCircle,
  'INVESTMENT_EXPIRED': AlertCircle,
  'INVESTMENT_PROCESSING': DollarSign,
  'INVESTMENT_COMPLETED': DollarSign,
  'INVESTMENT_REFUNDED': AlertCircle,
  'INVESTMENT_WITHDRAWN': AlertCircle,
  'INVESTMENT_REVERSED': AlertCircle,
  'PAYMENT_SUCCESS': DollarSign,
  'PAYMENT_FAILED': AlertCircle,
  'PROJECT_EDIT_REQUESTED': FileCheck,
  'PROJECT_EDIT_APPROVED': FileCheck,
  'PROJECT_EDIT_REJECTED': AlertCircle,
  'ACCESS_APPROVED': ShieldCheck,
  'ACCESS_REJECTED': ShieldCheck,
  'ACCESS_REVOKED': ShieldCheck,
  'PROJECT_APPROVED': FileCheck,
  'PROJECT_REJECTED': FileCheck,
  'PROJECT_NEEDS_CHANGES': FileCheck,
  'PROJECT_SUBMITTED': FileCheck,
  'NEW_ACCESS_REQUEST': ShieldCheck,
  'USER_BANNED': AlertCircle,
};

const notificationColors: Record<string, string> = {
  'INVESTMENT_REQUESTED': 'text-primary bg-primary/10',
  'INVESTMENT_APPROVED': 'text-success bg-success/10',
  'INVESTMENT_REJECTED': 'text-destructive bg-destructive/10',
  'INVESTMENT_EXPIRED': 'text-warning bg-warning/10',
  'INVESTMENT_PROCESSING': 'text-warning bg-warning/10',
  'INVESTMENT_COMPLETED': 'text-success bg-success/10',
  'INVESTMENT_REFUNDED': 'text-destructive bg-destructive/10',
  'INVESTMENT_WITHDRAWN': 'text-warning bg-warning/10',
  'INVESTMENT_REVERSED': 'text-destructive bg-destructive/10',
  'PAYMENT_SUCCESS': 'text-success bg-success/10',
  'PAYMENT_FAILED': 'text-destructive bg-destructive/10',
  'PROJECT_EDIT_REQUESTED': 'text-primary bg-primary/10',
  'PROJECT_EDIT_APPROVED': 'text-success bg-success/10',
  'PROJECT_EDIT_REJECTED': 'text-destructive bg-destructive/10',
  'ACCESS_APPROVED': 'text-success bg-success/10',
  'ACCESS_REJECTED': 'text-destructive bg-destructive/10',
  'ACCESS_REVOKED': 'text-warning bg-warning/10',
  'PROJECT_APPROVED': 'text-success bg-success/10',
  'PROJECT_REJECTED': 'text-destructive bg-destructive/10',
  'PROJECT_NEEDS_CHANGES': 'text-warning bg-warning/10',
  'PROJECT_SUBMITTED': 'text-primary bg-primary/10',
  'NEW_ACCESS_REQUEST': 'text-primary bg-primary/10',
  'USER_BANNED': 'text-destructive bg-destructive/10',
};

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const dispatchNotificationUpdate = (detail: { type: 'markAllRead' } | { type: 'markRead'; id: string }) => {
    window.dispatchEvent(new CustomEvent('notifications:update', { detail }));
  };

  useEffect(() => {
    setLoading(true);
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    notificationsApi.list()
      .then((items) => setNotifications(items))
      .finally(() => setLoading(false));
  }, [user]);

  const unreadNotifications = notifications.filter(n => !n.isRead);
  const readNotifications = notifications.filter(n => n.isRead);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    dispatchNotificationUpdate({ type: 'markRead', id });
    notificationsApi.markRead(id).catch(() => {});
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    dispatchNotificationUpdate({ type: 'markAllRead' });
    notificationsApi.markAllRead().catch(() => {});
  };

  const getNotificationLink = (notification: Notification) => {
    switch (notification.type) {
      case 'INVESTMENT_REQUESTED':
      case 'INVESTMENT_APPROVED':
      case 'INVESTMENT_REJECTED':
      case 'INVESTMENT_EXPIRED':
      case 'INVESTMENT_PROCESSING':
      case 'INVESTMENT_COMPLETED':
      case 'INVESTMENT_REFUNDED':
      case 'INVESTMENT_WITHDRAWN':
      case 'INVESTMENT_REVERSED':
      case 'PAYMENT_SUCCESS':
      case 'PAYMENT_FAILED':
        // Link to the project they invested in
        if (user?.role === 'ADMIN' && notification.type === 'INVESTMENT_REQUESTED') {
          return '/app/admin/investments/requests';
        }
        if (user?.role === 'ADMIN' && notification.type === 'INVESTMENT_PROCESSING') {
          return '/app/admin/investments/processing';
        }
        if (user?.role === 'ADMIN') return '/app/admin/investments';
        return notification.relatedId ? `/projects/${notification.relatedId}` : '/app/investor/investments';
      case 'ACCESS_APPROVED':
        // Link to project's restricted section
        return notification.relatedId ? `/projects/${notification.relatedId}?section=restricted` : undefined;
      case 'ACCESS_REJECTED':
      case 'ACCESS_REVOKED':
        return notification.relatedId ? `/projects/${notification.relatedId}` : undefined;
      case 'PROJECT_EDIT_REQUESTED':
        return user?.role === 'ADMIN' ? '/app/admin/projects/review-queue' : undefined;
      case 'PROJECT_EDIT_APPROVED':
      case 'PROJECT_EDIT_REJECTED':
        return notification.relatedId && user?.role === 'DEVELOPER'
          ? `/app/developer/projects/${notification.relatedId}`
          : undefined;
      case 'PROJECT_APPROVED':
      case 'PROJECT_REJECTED':
      case 'PROJECT_NEEDS_CHANGES':
      case 'PROJECT_SUBMITTED':
        return user?.role === 'DEVELOPER' 
          ? `/app/developer/projects/${notification.relatedId}` 
          : `/projects/${notification.relatedId}`;
      case 'NEW_ACCESS_REQUEST':
        return user?.role === 'ADMIN' ? '/app/admin/access-requests' : undefined;
      default:
        if (notification.relatedType === 'project' && notification.relatedId) {
          return `/projects/${notification.relatedId}`;
        }
        return undefined;
    }
  };

  const renderNotification = (notification: Notification) => {
    const Icon = notificationIcons[notification.type] || Bell;
    const colorClass = notificationColors[notification.type] || 'text-muted-foreground bg-muted';
    const link = getNotificationLink(notification);

    const content = (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex gap-4 p-4 rounded-lg border transition-colors",
          !notification.isRead && "bg-primary/5 border-primary/20",
          link && "hover:bg-muted cursor-pointer"
        )}
        onClick={() => {
          if (!notification.isRead) markAsRead(notification.id);
        }}
      >
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", colorClass)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={cn("font-medium", !notification.isRead && "text-foreground")}>
              {notification.title}
            </p>
            {!notification.isRead && (
              <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {new Date(notification.createdAt).toLocaleString()}
          </p>
        </div>
      </motion.div>
    );

    if (link) {
      return (
        <Link key={notification.id} to={link} className="block">
          {content}
        </Link>
      );
    }

    return (
      <div key={notification.id} className="block">
        {content}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6 flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-1/3" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-1">Stay updated on your activity</p>
        </div>
        {unreadNotifications.length > 0 && (
          <Button variant="outline" onClick={markAllAsRead} className="gap-2">
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            <Bell className="h-4 w-4" /> All ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread" className="gap-2">
            <BellOff className="h-4 w-4" /> Unread ({unreadNotifications.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {notifications.length === 0 ? (
            <EmptyState
              icon={<Bell className="h-12 w-12" />}
              title="No notifications"
              description="You're all caught up! Check back later for updates."
            />
          ) : (
            <div className="space-y-4">
              {notifications.map(renderNotification)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="unread" className="mt-6">
          {unreadNotifications.length === 0 ? (
            <EmptyState
              icon={<Check className="h-12 w-12" />}
              title="All caught up!"
              description="You have no unread notifications."
            />
          ) : (
            <div className="space-y-4">
              {unreadNotifications.map(renderNotification)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

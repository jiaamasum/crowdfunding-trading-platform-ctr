import { Link, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  FileCheck, 
  ShieldCheck,
  Users,
  TrendingUp,
  CreditCard,
  ScrollText,
  Bell, 
  LogOut,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { useSidebarShortcut } from '@/hooks/useSidebarShortcut';
import { useAuthStore } from '@/store/authStore';
import { projectsApi } from '@/lib/projectsApi';
import { accessRequestsApi } from '@/lib/accessRequestsApi';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/app/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { path: '/app/admin/projects/review-queue', icon: FileCheck, label: 'Review Queue', badge: 'review' },
  { path: '/app/admin/access-requests', icon: ShieldCheck, label: 'Access Requests', badge: 'access' },
  { path: '/app/admin/users', icon: Users, label: 'Users' },
  { path: '/app/admin/investments', icon: TrendingUp, label: 'Investments' },
  { path: '/app/admin/payments', icon: CreditCard, label: 'Payments' },
  { path: '/app/admin/audit-logs', icon: ScrollText, label: 'Audit Logs' },
  { path: '/app/admin/notifications', icon: Bell, label: 'Notifications' },
];

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);
  const [pendingAccessCount, setPendingAccessCount] = useState(0);
  const { unreadCount: notificationUnreadCount } = useRealtimeNotifications();

  const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);
  useSidebarShortcut(toggleSidebar);

  useEffect(() => {
    let isMounted = true;

    const loadCounts = async () => {
      try {
        const [projects, accessRequests] = await Promise.all([
          projectsApi.getAll(),
          accessRequestsApi.listAll('PENDING'),
        ]);
        if (!isMounted) return;
        setPendingReviewCount(projects.filter(p => p.status === 'PENDING_REVIEW').length);
        setPendingAccessCount(accessRequests.length);
      } catch (error) {
        console.error('Failed to load admin counts', error);
      }
    };

    loadCounts();
    const interval = setInterval(loadCounts, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const getBadgeCount = (badge?: string) => {
    if (badge === 'review') return pendingReviewCount;
    if (badge === 'access') return pendingAccessCount;
    return 0;
  };

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Fixed */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-screen bg-card border-r border-border transition-all duration-300 flex flex-col",
        sidebarOpen ? "w-64" : "w-20",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-destructive to-destructive/70 flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            {sidebarOpen && <span className="font-display font-bold">Admin Panel</span>}
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            className="hidden lg:flex"
            onClick={toggleSidebar}
          >
            <ChevronRight className={cn("h-4 w-4 transition-transform", !sidebarOpen && "rotate-180")} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const badgeCount = getBadgeCount(item.badge);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                  isActive(item.path, item.exact)
                    ? "bg-primary text-primary-foreground shadow-soft-md"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {sidebarOpen && (
                  <span className="flex-1">{item.label}</span>
                )}
                {badgeCount > 0 && sidebarOpen && (
                  <Badge variant="destructive" className="h-5 px-1.5 text-xs animate-pulse">
                    {badgeCount}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Theme Toggle */}
        <div className={cn("px-4 pb-2", !sidebarOpen && "flex justify-center")}>
          <ThemeToggle />
        </div>

        {/* User section */}
        <div className="p-4 border-t border-border">
          <div className={cn(
            "flex items-center gap-3",
            !sidebarOpen && "justify-center"
          )}>
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-destructive/10 text-destructive font-semibold">
                {user?.name?.charAt(0) || 'A'}
              </AvatarFallback>
            </Avatar>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground">Administrator</p>
              </div>
            )}
            {sidebarOpen && (
              <Button variant="ghost" size="icon" onClick={logout}>
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </aside>

      {/* Main content - offset for fixed sidebar */}
      <main className={cn(
        "flex-1 flex flex-col min-h-screen transition-all duration-300",
        sidebarOpen ? "lg:ml-64" : "lg:ml-20"
      )}>
        {/* Top bar */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-30 flex items-center px-4 lg:px-6 gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          <Link to="/app/admin/notifications" className="relative">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
              {notificationUnreadCount > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"
                />
              )}
            </Button>
          </Link>
        </header>

        {/* Page content */}
        <motion.div 
          className="flex-1 p-4 lg:p-6 lg:p-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </motion.div>
      </main>
    </div>
  );
}

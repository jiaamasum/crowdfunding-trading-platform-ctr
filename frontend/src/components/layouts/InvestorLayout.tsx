import { useState, useCallback } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { useSidebarShortcut } from '@/hooks/useSidebarShortcut';
import { cn } from '@/lib/utils';
import {
  TrendingUp, LayoutDashboard, FolderOpen, Heart, GitCompare, Receipt,
  Bell, LogOut, Menu, X, ChevronRight
} from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/app/investor', exact: true },
  { icon: FolderOpen, label: 'Browse Projects', path: '/app/investor/projects' },
  { icon: Heart, label: 'Favorites', path: '/app/investor/favorites' },
  { icon: GitCompare, label: 'Compare', path: '/app/investor/compare' },
  { icon: Receipt, label: 'Investments', path: '/app/investor/investments' },
  { icon: Bell, label: 'Notifications', path: '/app/investor/notifications' },
];

export default function InvestorLayout() {
  const { user, logout } = useAuthStore();
  const { compareList, favorites } = useAppStore();
  const { unreadCount } = useRealtimeNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);
  useSidebarShortcut(toggleSidebar);

  const handleLogout = () => {
    logout();
    navigate('/');
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
            <TrendingUp className="h-7 w-7 text-primary" />
            {sidebarOpen && <span className="font-display font-bold">CrowdFund</span>}
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
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
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
              {item.label === 'Notifications' && unreadCount > 0 && sidebarOpen && (
                <Badge variant="destructive" className="h-5 px-1.5 text-xs animate-pulse">
                  {unreadCount}
                </Badge>
              )}
              {item.label === 'Favorites' && favorites.length > 0 && sidebarOpen && (
                <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                  {favorites.length}
                </Badge>
              )}
              {item.label === 'Compare' && compareList.length > 0 && sidebarOpen && (
                <Badge className="h-5 px-1.5 text-xs bg-accent text-accent-foreground">
                  {compareList.length}
                </Badge>
              )}
            </Link>
          ))}
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
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {user?.name?.charAt(0) || 'I'}
              </AvatarFallback>
            </Avatar>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            )}
            {sidebarOpen && (
              <Button variant="ghost" size="icon" onClick={handleLogout}>
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
          {!user?.isVerified && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning/10 text-warning text-sm">
              <span>Verify your email to invest</span>
            </div>
          )}
          <Link to="/app/investor/notifications" className="relative">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
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
import { useState, useCallback } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { useSidebarShortcut } from '@/hooks/useSidebarShortcut';
import { cn } from '@/lib/utils';
import {
  TrendingUp, LayoutDashboard, FolderOpen, Heart, GitCompare, Receipt, Wallet,
  FileText, LogOut, X, ChevronRight
} from 'lucide-react';
import DashboardHeader from '@/components/common/DashboardHeader';

const navItems = [
  { icon: LayoutDashboard, label: 'Investor Dashboard', path: '/app/investor', exact: true },
  { icon: FolderOpen, label: 'Browse Projects', path: '/app/investor/projects' },
  { icon: Heart, label: 'Favorites', path: '/app/investor/favorites' },
  { icon: GitCompare, label: 'Compare', path: '/app/investor/compare' },
  { icon: Receipt, label: 'Investments', path: '/app/investor/investments' },
  { icon: FileText, label: 'Requests', path: '/app/investor/requests' },
  { icon: Wallet, label: 'Wallet', path: '/app/investor/wallet' },
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
        "fixed top-0 left-0 z-50 h-screen bg-card border-r border-border transition-all duration-300 flex flex-col overflow-x-hidden",
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
        <nav className="flex-1 p-4 space-y-2 overflow-x-hidden">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all min-w-0",
                isActive(item.path, item.exact)
                  ? "bg-primary text-primary-foreground shadow-soft-md"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {sidebarOpen && (
                <span className="flex-1 truncate">{item.label}</span>
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
        <DashboardHeader onMenuClick={() => setMobileOpen(true)} unreadCount={unreadCount} showThemeToggle />
        {!user?.isVerified && (
          <div className="px-4 lg:px-6 mt-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning/10 text-warning text-sm">
              <span>Verify your email to invest</span>
            </div>
          </div>
        )}

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

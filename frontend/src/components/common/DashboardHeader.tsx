import { useMemo, useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Menu, TrendingUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useAuthStore } from '@/store/authStore';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { cn } from '@/lib/utils';
import { MediaImage } from '@/components/common/MediaImage';

type DashboardHeaderProps = {
  onMenuClick?: () => void;
  unreadCount?: number;
  links?: Array<{ label: string; to: string; external?: boolean }>;
  showBrand?: boolean;
  useContainer?: boolean;
  position?: 'sticky' | 'fixed';
  showThemeToggle?: boolean;
};

const roleDashPaths: Record<string, string> = {
  ADMIN: '/app/admin',
  DEVELOPER: '/app/developer',
  INVESTOR: '/app/investor',
};

const roleDashLabels: Record<string, string> = {
  ADMIN: 'Admin Dashboard',
  DEVELOPER: 'Developer Dashboard',
  INVESTOR: 'Investor Dashboard',
};

export default function DashboardHeader({
  onMenuClick,
  unreadCount = 0,
  links = [],
  showBrand = false,
  useContainer = false,
  position = 'sticky',
  showThemeToggle = false,
}: DashboardHeaderProps) {
  const { user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const navigate = useNavigate();

  const dashboardPath = useMemo(() => roleDashPaths[user?.role || 'INVESTOR'] || '/app', [user?.role]);
  const dashboardLabel = useMemo(
    () => roleDashLabels[user?.role || 'INVESTOR'] || 'Dashboard',
    [user?.role]
  );

  const profilePath = `${dashboardPath}/profile`;

  const handleMenuEnter = () => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setMenuOpen(true);
  };

  const handleMenuLeave = () => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
    }
    closeTimer.current = window.setTimeout(() => {
      setMenuOpen(false);
      closeTimer.current = null;
    }, 120);
  };

  useEffect(() => {
    return () => {
      if (closeTimer.current) {
        window.clearTimeout(closeTimer.current);
      }
    };
  }, []);

  return (
    <header
      className={cn(
        "h-16 border-b border-border bg-card/50 backdrop-blur-sm z-30 flex items-center",
        position === 'fixed' ? "fixed top-0 left-0 right-0" : "sticky top-0"
      )}
    >
      <div className={cn("flex items-center gap-4 w-full min-w-0", useContainer ? "container mx-auto px-4" : "px-4 lg:px-6")}>
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        {showBrand && (
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-accent to-primary flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold hidden sm:inline">CrowdFund</span>
          </Link>
        )}
        
        {links.length > 0 && (
          <nav className="hidden md:flex items-center gap-8">
            {links.map((link) => (
              link.external || link.to.startsWith('/#') ? (
                <a
                  key={link.label}
                  href={link.to}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  to={link.to}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              )
            ))}
          </nav>
        )}
        <div className="flex-1" />
        {user ? (
          <>
            <Link to={`${dashboardPath}/notifications`} className="relative">
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" aria-label="Notifications">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 min-w-4 sm:h-5 sm:min-w-5 px-0.5 sm:px-1 text-[9px] sm:text-[10px]">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </Link>
            {showThemeToggle && <ThemeToggle />}
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="gap-1 sm:gap-2 px-1 sm:px-2"
                  onMouseEnter={handleMenuEnter}
                  onMouseLeave={handleMenuLeave}
                >
                  <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                    {user?.avatarUrl && (
                      <MediaImage
                        src={user.avatarUrl}
                        alt={user.name}
                        className="aspect-square h-full w-full"
                        bucket="users-profile-image"
                        loading="eager"
                      />
                    )}
                    <AvatarFallback className="bg-primary/10 text-primary text-xs sm:text-sm font-semibold">
                      {user?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-medium">{user?.name || 'Account'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-40"
                onMouseEnter={handleMenuEnter}
                onMouseLeave={handleMenuLeave}
              >
                <DropdownMenuItem onClick={() => navigate(dashboardPath)}>
                  {dashboardLabel}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(profilePath)}>
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <div className="flex items-center gap-1.5 sm:gap-3">
            {showThemeToggle && <ThemeToggle />}
            <Link to="/auth/login" className="hidden sm:inline-flex">
              <Button variant="ghost" size="sm" className="px-2 sm:px-3 text-xs sm:text-sm">Sign In</Button>
            </Link>
            <Link to="/auth/register" className="hidden sm:inline-flex">
              <Button variant="highlight" size="sm" className="px-2 sm:px-3 text-xs sm:text-sm whitespace-nowrap">Get Started</Button>
            </Link>
          </div>
        )}
        
        {/* Mobile Menu Button - Right side, after all buttons */}
        {links.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden shrink-0"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
      </div>
      
      {/* Mobile Navigation Sheet - Right side */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="right" className="w-[280px] sm:w-[320px]">
          <SheetHeader className="text-left">
            <SheetTitle>
              <Link to="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-lg font-display font-bold">CrowdFund</span>
              </Link>
            </SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-2 mt-6">
            {links.map((link) => (
              link.external || link.to.startsWith('/#') ? (
                <a
                  key={link.label}
                  href={link.to}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  to={link.to}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              )
            ))}
          </nav>
          {user && (
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center gap-3 px-3 mb-4">
                <Avatar className="h-10 w-10">
                  {user?.avatarUrl && (
                    <MediaImage
                      src={user.avatarUrl}
                      alt={user.name}
                      className="aspect-square h-full w-full"
                      bucket="users-profile-image"
                      loading="eager"
                    />
                  )}
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                    {user?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <Link
                to={dashboardPath}
                className="flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {dashboardLabel}
              </Link>
              <Link
                to={profilePath}
                className="flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Profile
              </Link>
              <button
                className="flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium text-destructive hover:bg-destructive/10 transition-colors w-full text-left"
                onClick={() => {
                  logout();
                  navigate('/');
                  setMobileMenuOpen(false);
                }}
              >
                Logout
              </button>
            </div>
          )}
          {!user && (
            <div className="mt-6 pt-6 border-t flex flex-col gap-3">
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/auth/login');
                }}
              >
                Sign In
              </Button>
              <Button 
                variant="highlight" 
                className="w-full" 
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/auth/register');
                }}
              >
                Get Started
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </header>
  );
}

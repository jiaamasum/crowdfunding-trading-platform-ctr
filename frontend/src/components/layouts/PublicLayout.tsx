import { Link, Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { TrendingUp } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import Footer from '@/components/common/Footer';

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <nav className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-accent to-primary flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold">CrowdFund</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/projects" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Projects</Link>
            <Link to="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
            <Link to="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">About</Link>
            <Link to="/faq" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">FAQ</Link>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/auth/login"><Button variant="ghost" size="sm">Sign In</Button></Link>
            <Link to="/auth/register"><Button variant="highlight" size="sm">Get Started</Button></Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>



      {/* Footer */}
      <Footer />
    </div>
  );
}

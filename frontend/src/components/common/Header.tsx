import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { TrendingUp } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function Header() {
    const { user } = useAuthStore();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <span className="text-xl font-display font-bold">CrowdFund</span>
                </Link>
                <div className="hidden md:flex items-center gap-8">
                    <Link to="/projects" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Projects</Link>
                    <a href="/#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
                    <a href="/#categories" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Categories</a>
                    <a href="/#testimonials" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
                </div>
                <div className="flex items-center gap-3">
                    {user ? (
                        <Link to="/app"><Button variant="highlight" size="sm">Dashboard</Button></Link>
                    ) : (
                        <>
                            <Link to="/auth/login"><Button variant="ghost" size="sm">Sign In</Button></Link>
                            <Link to="/auth/register"><Button variant="highlight" size="sm">Get Started</Button></Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}

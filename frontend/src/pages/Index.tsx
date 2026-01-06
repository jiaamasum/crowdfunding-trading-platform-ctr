import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  TrendingUp, Users, Shield, BarChart3, ChevronRight, Star, Zap, Lock,
  ArrowRight, CheckCircle2, Globe, Wallet, PieChart, LineChart, Target,
  Award, Sparkles, Play, Quote, Building2, Leaf, Heart, Lightbulb,
  Rocket, Clock, DollarSign, TrendingDown, ShieldCheck, Eye, X, GitCompare
} from 'lucide-react';
import { projectsApi } from '@/lib/projectsApi';
import { Money, SharesProgress } from '@/components/ui/money';
import { StatusBadge } from '@/components/ui/status-badge';
import { cn } from '@/lib/utils';
import type { Project } from '@/types';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';

const stats = [
  { value: '$48M+', label: 'Total Invested', icon: DollarSign },
  { value: '150+', label: 'Active Projects', icon: Rocket },
  { value: '12,000+', label: 'Happy Investors', icon: Users },
  { value: '94%', label: 'Success Rate', icon: Target },
];

const features = [
  {
    icon: Users,
    title: 'For Investors',
    description: 'Discover vetted opportunities, invest in fractional shares, and build a diversified portfolio with projects you believe in.',
    color: 'from-blue-500/20 to-cyan-500/20',
    iconColor: 'text-blue-500'
  },
  {
    icon: Zap,
    title: 'For Developers',
    description: 'Showcase your vision, raise capital from a global investor base, and maintain control while growing your project.',
    color: 'from-amber-500/20 to-orange-500/20',
    iconColor: 'text-amber-500'
  },
  {
    icon: Shield,
    title: 'For Everyone',
    description: 'Transparent governance, secure transactions, and admin oversight ensure fair and trustworthy operations.',
    color: 'from-emerald-500/20 to-green-500/20',
    iconColor: 'text-emerald-500'
  },
];

const howItWorks = [
  { step: '01', title: 'Browse Projects', description: 'Explore carefully curated investment opportunities across multiple sectors.', icon: Eye },
  { step: '02', title: 'Research & Compare', description: 'Access detailed information, compare metrics, and make informed decisions.', icon: BarChart3 },
  { step: '03', title: 'Invest Securely', description: 'Purchase shares with our secure payment system. Start with any amount.', icon: Wallet },
  { step: '04', title: 'Track & Grow', description: 'Monitor your portfolio, receive updates, and watch your investments flourish.', icon: LineChart },
];

const categories = [
  { name: 'Technology', icon: Lightbulb, count: 8, color: 'bg-violet-500/10 text-violet-500' },
  { name: 'Healthcare', icon: Heart, count: 5, color: 'bg-rose-500/10 text-rose-500' },
  { name: 'Real Estate', icon: Building2, count: 4, color: 'bg-blue-500/10 text-blue-500' },
  { name: 'Energy', icon: Zap, count: 4, color: 'bg-amber-500/10 text-amber-500' },
  { name: 'Agriculture', icon: Leaf, count: 3, color: 'bg-emerald-500/10 text-emerald-500' },
  { name: 'Manufacturing', icon: Building2, count: 4, color: 'bg-slate-500/10 text-slate-500' },
];

const testimonials = [
  {
    quote: "CrowdFund completely transformed how I approach investing. The transparency and ease of use is unmatched.",
    author: "Michael Chen",
    role: "Angel Investor",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    investment: "$125,000 invested"
  },
  {
    quote: "As a developer, finding the right investors was always challenging. This platform connected me with believers in my vision.",
    author: "Sarah Martinez",
    role: "Tech Entrepreneur",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    investment: "$2.5M raised"
  },
  {
    quote: "The fractional ownership model makes high-quality investments accessible. I started with just $500.",
    author: "David Park",
    role: "Retail Investor",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    investment: "$8,500 invested"
  },
];

const benefits = [
  { icon: ShieldCheck, title: 'Vetted Projects', description: 'Every project undergoes thorough review' },
  { icon: DollarSign, title: 'Low Minimums', description: 'Start investing from just $50' },
  { icon: PieChart, title: 'Diversification', description: 'Spread risk across multiple projects' },
  { icon: Clock, title: 'Real-time Updates', description: 'Track progress as it happens' },
  { icon: Lock, title: 'Secure Platform', description: 'Bank-level security for all transactions' },
  { icon: Globe, title: 'Global Access', description: 'Invest in projects worldwide' },
];

const partners = [
  'TechCrunch', 'Forbes', 'Bloomberg', 'Reuters', 'CNBC', 'WSJ'
];

import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';

export default function LandingPage() {
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([]);
  const { favorites, addFavoriteRemote, removeFavoriteRemote, isInCompare, addToCompareRemote, removeFromCompareRemote, canAddToCompare, isFavorite } = useAppStore();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const heroRef = useRef(null);
  const [showDemo, setShowDemo] = useState(false);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

  const sortedFeaturedProjects = useMemo(() => {
    return [...featuredProjects].sort((a, b) => {
      const aFav = favorites.includes(a.id) ? 0 : 1;
      const bFav = favorites.includes(b.id) ? 0 : 1;
      return aFav - bFav;
    });
  }, [featuredProjects, favorites]);

  const handleFavoriteToggle = (projectId: string) => {
    if (!user) {
      toast({ title: 'Please sign in to favorite projects', variant: 'destructive' });
      return;
    }
    if (isFavorite(projectId)) {
      removeFavoriteRemote(projectId).catch((error) =>
        toast({
          title: 'Favorite update failed',
          description: error instanceof Error ? error.message : 'Please try again.',
          variant: 'destructive',
        })
      );
    } else {
      addFavoriteRemote(projectId).catch((error) =>
        toast({
          title: 'Favorite update failed',
          description: error instanceof Error ? error.message : 'Please try again.',
          variant: 'destructive',
        })
      );
    }
  };

  const handleCompareToggle = (projectId: string) => {
    if (!user) {
      toast({ title: 'Please sign in to compare projects', variant: 'destructive' });
      return;
    }
    if (isInCompare(projectId)) {
      removeFromCompareRemote(projectId).catch((error) =>
        toast({
          title: 'Compare update failed',
          description: error instanceof Error ? error.message : 'Please try again.',
          variant: 'destructive',
        })
      );
      return;
    }
    if (!canAddToCompare()) {
      toast({ title: 'Compare list is full', description: 'Maximum 4 projects allowed', variant: 'destructive' });
      return;
    }
    addToCompareRemote(projectId).catch((error) =>
      toast({
        title: 'Compare update failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
    );
  };

  const loadFeatured = useCallback(async () => {
    try {
      const response = await projectsApi.list(undefined, 'newest', 1, 6);
      setFeaturedProjects(response.data.filter(p => p.status === 'APPROVED').slice(0, 6));
    } catch (error) {
      console.error('Failed to load featured projects', error);
      setFeaturedProjects([]);
    }
  }, []);

  useEffect(() => {
    loadFeatured();
  }, [loadFeatured]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadFeatured();
    }, 60000);
    return () => clearInterval(interval);
  }, [loadFeatured]);

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Demo Video Dialog */}
      <Dialog open={showDemo} onOpenChange={setShowDemo}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black">
          <div className="relative aspect-video">
            <iframe
              src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
              title="CrowdFund Demo Video"
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </DialogContent>
      </Dialog>

      <Header />

      {/* Section 2: Hero */}
      <section ref={heroRef} className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-accent/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-accent/10 to-primary/10 rounded-full blur-3xl" />
        </div>

        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="container mx-auto px-4 relative z-10"
        >
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6"
            >
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-accent">$48M+ invested across 150+ projects</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-5xl md:text-7xl font-display font-bold mb-6 leading-tight"
            >
              Invest in the{' '}
              <span className="bg-gradient-to-r from-accent via-primary to-accent bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                Future
              </span>
              <br />You Believe In
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
            >
              Join thousands of investors building wealth through fractional ownership in vetted,
              high-potential projects. Start with as little as $50.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link to="/projects">
                <Button variant="highlight" size="xl" className="gap-2 group">
                  Explore Projects
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button variant="outline" size="xl" className="gap-2" onClick={() => setShowDemo(true)}>
                <Play className="h-5 w-5" />
                Watch Demo
              </Button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-12 flex flex-wrap items-center justify-center gap-6 text-muted-foreground"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
                <span className="text-sm">Bank-level Security</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-500" />
                <span className="text-sm">Vetted Projects</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-500" />
                <span className="text-sm">Global Access</span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-2">
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-accent"
            />
          </div>
        </motion.div>
      </section>

      {/* Section 3: Stats */}
      <section className="py-16 bg-muted/30 border-y">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 mb-3">
                  <stat.icon className="h-6 w-6 text-accent" />
                </div>
                <div className="text-3xl md:text-4xl font-display font-bold text-foreground">{stat.value}</div>
                <div className="text-muted-foreground text-sm mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: Features / Who It's For */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Built for Everyone</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Whether you are looking to invest or raise capital, our platform provides the tools you need to succeed.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full border-0 shadow-soft-lg hover:shadow-soft-xl transition-all duration-300 overflow-hidden group">
                  <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50", feature.color)} />
                  <CardContent className="relative pt-8 pb-8">
                    <div className={cn("h-14 w-14 rounded-2xl bg-background shadow-soft flex items-center justify-center mb-6", feature.iconColor)}>
                      <feature.icon className="h-7 w-7" />
                    </div>
                    <h3 className="text-xl font-display font-bold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5: How It Works */}
      <section id="how-it-works" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Start investing in minutes with our simple four-step process
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6">
            {howItWorks.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                {i < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-accent/50 to-transparent" />
                )}
                <Card className="text-center h-full">
                  <CardContent className="pt-8">
                    <div className="text-5xl font-display font-bold text-accent/20 mb-4">{item.step}</div>
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent/10 mb-4">
                      <item.icon className="h-7 w-7 text-accent" />
                    </div>
                    <h3 className="text-lg font-display font-bold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground text-sm">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 6: Featured Projects */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4"
          >
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-2">Featured Projects</h2>
              <p className="text-muted-foreground">Hand-picked opportunities ready for investment</p>
            </div>
            <Link to="/projects">
              <Button variant="outline" className="gap-2 group">
                View All Projects
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedFeaturedProjects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="overflow-hidden hover:shadow-soft-lg transition-all hover:scale-[1.02] group">
                  <Link to={`/projects/${project.id}`}>
                    <div className="aspect-video bg-muted relative overflow-hidden">
                      {project.thumbnailUrl && (
                        <img
                          src={project.thumbnailUrl}
                          alt={project.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )}
                      <div className="absolute top-3 left-3">
                        <StatusBadge status={project.status} />
                      </div>
                      {project.has3DModel && (
                        <div className="absolute top-3 right-3 bg-primary/80 text-primary-foreground text-xs px-2 py-1 rounded">
                          3D
                        </div>
                      )}
                    </div>
                  </Link>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Link to={`/projects/${project.id}`}>
                        <h3 className="font-display font-semibold line-clamp-1 hover:text-accent transition-colors">
                          {project.title}
                        </h3>
                      </Link>
                      {user?.role === 'INVESTOR' && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleFavoriteToggle(project.id)}
                          >
                            <Heart className={cn("h-4 w-4", isFavorite(project.id) && "fill-destructive text-destructive")} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleCompareToggle(project.id)}
                            disabled={!canAddToCompare() && !isInCompare(project.id)}
                          >
                            <GitCompare className={cn("h-4 w-4", isInCompare(project.id) && "text-accent")} />
                          </Button>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{project.shortDescription}</p>
                    <div className="flex justify-between text-sm mb-3">
                      <span className="text-muted-foreground">Per share</span>
                      <Money amount={project.perSharePrice} className="font-bold" />
                    </div>
                    <SharesProgress sold={project.sharesSold} total={project.totalShares} size="sm" showLabels={false} />
                    <div className="flex justify-between items-center mt-3 text-xs text-muted-foreground">
                      <span className="font-medium text-accent">{project.fundingProgress.toFixed(0)}% funded</span>
                      <span>{project.daysRemaining} days left</span>
                    </div>
                    {user?.role === 'INVESTOR' && (
                      <Link to={`/app/investor/projects/${project.id}/invest`} className="block mt-3">
                        <Button variant="accent" size="sm" className="w-full gap-2">
                          <DollarSign className="h-4 w-4" />
                          Invest Now
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 7: Categories */}
      <section id="categories" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Investment Categories</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Diversify your portfolio across multiple sectors</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link to={`/projects?category=${cat.name.toUpperCase().replace(' ', '_')}`}>
                  <Card className="text-center hover:shadow-soft-lg transition-all hover:-translate-y-1 cursor-pointer">
                    <CardContent className="pt-6 pb-6">
                      <div className={cn("inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3", cat.color)}>
                        <cat.icon className="h-6 w-6" />
                      </div>
                      <h3 className="font-semibold text-sm mb-1">{cat.name}</h3>
                      <p className="text-xs text-muted-foreground">{cat.count} projects</p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 8: Share Model Explainer */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Simple Share-Based Model</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">Transparent pricing with no hidden fees</p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                <Card className="text-center h-full border-2 border-dashed">
                  <CardContent className="pt-8 pb-8">
                    <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                      <DollarSign className="h-8 w-8 text-accent" />
                    </div>
                    <h3 className="text-lg font-display font-bold mb-2">Total Project Value</h3>
                    <p className="text-muted-foreground text-sm mb-4">Each project has a defined funding goal</p>
                    <div className="text-2xl font-bold text-accent">$2,500,000</div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <Card className="text-center h-full border-2 border-dashed">
                  <CardContent className="pt-8 pb-8">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <PieChart className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-display font-bold mb-2">Fixed Share Count</h3>
                    <p className="text-muted-foreground text-sm mb-4">Divided into purchasable shares</p>
                    <div className="text-2xl font-bold text-primary">10,000 shares</div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                <Card className="text-center h-full bg-gradient-to-br from-accent/10 to-primary/10 border-accent/30">
                  <CardContent className="pt-8 pb-8">
                    <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center mx-auto mb-4 shadow-soft">
                      <Target className="h-8 w-8 text-accent" />
                    </div>
                    <h3 className="text-lg font-display font-bold mb-2">Per Share Price</h3>
                    <p className="text-muted-foreground text-sm mb-4">Simple math, clear value</p>
                    <div className="text-2xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">$250/share</div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 9: Benefits Grid */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Why Choose CrowdFund</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Built with investors and developers in mind</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {benefits.map((benefit, i) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-4 p-6 rounded-xl bg-background border hover:shadow-soft-lg transition-shadow"
              >
                <div className="shrink-0 w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <benefit.icon className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 10: Testimonials */}
      <section id="testimonials" className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Trusted by Thousands</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Hear from our community of investors and developers</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={testimonial.author}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full">
                  <CardContent className="pt-8">
                    <Quote className="h-8 w-8 text-accent/30 mb-4" />
                    <p className="text-foreground mb-6 leading-relaxed">&ldquo;{testimonial.quote}&rdquo;</p>
                    <div className="flex items-center gap-4">
                      <img
                        src={testimonial.avatar}
                        alt={testimonial.author}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <div className="font-semibold">{testimonial.author}</div>
                        <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                        <div className="text-xs text-accent font-medium mt-1">{testimonial.investment}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 11: Press / Partners */}
      <section className="py-16 border-y">
        <div className="container mx-auto px-4">
          <p className="text-center text-muted-foreground text-sm mb-8">Featured in leading publications</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            {partners.map((partner) => (
              <motion.div
                key={partner}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-2xl font-display font-bold text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-pointer"
              >
                {partner}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 12: CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-primary" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptMCAwdi02aC02djZoNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="container mx-auto px-4 text-center relative z-10"
        >
          <h2 className="text-3xl md:text-5xl font-display font-bold text-primary-foreground mb-6">
            Ready to Start Your Investment Journey?
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join 12,000+ investors already building their future with CrowdFund
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth/register">
              <Button variant="hero" size="xl" className="gap-2">
                Create Free Account
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/projects">
              <Button variant="hero-outline" size="xl">
                Browse Projects
              </Button>
            </Link>
          </div>
          <p className="text-primary-foreground/60 text-sm mt-6">
            No credit card required • Free to join • Start investing in minutes
          </p>
        </motion.div>
      </section>

      {/* Section 13: Footer */}
      <footer className="bg-background border-t py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <Link to="/" className="flex items-center gap-2 mb-4">
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-display font-bold">CrowdFund</span>
              </Link>
              <p className="text-muted-foreground text-sm">
                Democratizing investment opportunities for everyone.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/projects" className="hover:text-foreground transition-colors">Browse Projects</Link></li>
                <li><a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a></li>
                <li><Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link to="/faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/about" className="hover:text-foreground transition-colors">About Us</Link></li>
                <li><Link to="/careers" className="hover:text-foreground transition-colors">Careers</Link></li>
                <li><Link to="/press" className="hover:text-foreground transition-colors">Press</Link></li>
                <li><Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
                <li><Link to="/cookies" className="hover:text-foreground transition-colors">Cookie Policy</Link></li>
                <li><Link to="/risk-disclosure" className="hover:text-foreground transition-colors">Risk Disclosure</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">© 2025 CrowdFund. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" /></svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

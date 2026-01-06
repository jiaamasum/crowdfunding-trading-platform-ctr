import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchBar } from '@/components/ui/search-bar';
import { StatusBadge } from '@/components/ui/status-badge';
import { Money, SharesProgress } from '@/components/ui/money';
import { EmptySearch } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Grid3X3, List, Heart, GitCompare, Filter, ChevronRight, DollarSign } from 'lucide-react';
import { PROJECT_CATEGORIES, type ProjectCategory, type ProjectSortOption, type Project } from '@/types';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import Footer from '@/components/common/Footer';
import { projectsApi } from '@/lib/projectsApi';
import { useToast } from '@/hooks/use-toast';

import Header from '@/components/common/Header';

// ... existing imports ...

export default function ProjectsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [sort, setSort] = useState<ProjectSortOption>('newest');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [totalProjects, setTotalProjects] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const { user } = useAuthStore();
  const {
    favorites,
    addFavoriteRemote,
    removeFavoriteRemote,
    isFavorite,
    addToCompareRemote,
    isInCompare,
    canAddToCompare,
    removeFromCompareRemote,
  } = useAppStore();
  const { toast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category, sort]);

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      const response = await projectsApi.list(
        {
          search: debouncedSearch || undefined,
          category: category !== 'all' ? (category as ProjectCategory) : undefined,
          status: 'APPROVED',
        },
        sort,
        page,
        pageSize
      );
      setAllProjects(response.data);
      setTotalProjects(response.total);
    } catch (error) {
      toast({
        title: 'Failed to load projects',
        description: error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, category, sort, page, pageSize, toast]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadProjects();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadProjects]);

  // ... existing filter logic ...

  // Filter and sort projects
  const projects = useMemo(() => {
    const filtered = allProjects.filter(p => p.status === 'APPROVED');
    filtered.sort((a, b) => {
      const aFav = favorites.includes(a.id) ? 0 : 1;
      const bFav = favorites.includes(b.id) ? 0 : 1;
      return aFav - bFav;
    });
    return filtered;
  }, [favorites, allProjects]);

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

  return (
    <div className="min-h-screen bg-background pt-16">
      <Header />


      {/* Header */}
      <div className="bg-muted/30 border-b py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-display font-bold mb-2">Browse Projects</h1>
          <p className="text-muted-foreground">Discover innovative projects and invest in the future</p>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-16 z-40 bg-background border-b py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-1 gap-4 w-full lg:w-auto">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search projects..."
                className="flex-1 max-w-md"
              />
              <Button
                variant="outline"
                className="lg:hidden"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>

            <div className={cn(
              "flex flex-wrap gap-4 items-center w-full lg:w-auto",
              !showFilters && "hidden lg:flex"
            )}>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {PROJECT_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sort} onValueChange={(v) => setSort(v as ProjectSortOption)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="most_funded">Most Funded</SelectItem>
                  <SelectItem value="lowest_price">Lowest Price</SelectItem>
                  <SelectItem value="highest_price">Highest Price</SelectItem>
                  <SelectItem value="ending_soon">Ending Soon</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex border rounded-lg">
                <Button
                  variant={view === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setView('grid')}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={view === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setView('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground">
            {totalProjects} project{totalProjects !== 1 ? 's' : ''} found
          </p>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-80 w-full rounded-xl" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <EmptySearch query={search} />
        ) : view === 'grid' ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
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
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {project.shortDescription}
                    </p>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Per share</span>
                      <Money amount={project.perSharePrice} className="font-semibold" />
                    </div>
                    <SharesProgress sold={project.sharesSold} total={project.totalShares} size="sm" showLabels={false} />
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-xs text-muted-foreground">{project.fundingProgress.toFixed(0)}% funded</span>
                      <span className="text-xs text-muted-foreground">{project.daysRemaining} days left</span>
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
        ) : (
          <div className="space-y-4">
            {projects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="overflow-hidden hover:shadow-soft-lg transition-all">
                  <div className="flex flex-col md:flex-row">
                    <Link to={`/projects/${project.id}`} className="md:w-64 flex-shrink-0">
                      <div className="aspect-video md:aspect-[4/3] bg-muted relative">
                        {project.thumbnailUrl && (
                          <img
                            src={project.thumbnailUrl}
                            alt={project.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute top-2 left-2">
                          <StatusBadge status={project.status} />
                        </div>
                      </div>
                    </Link>
                    <CardContent className="flex-1 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <Link to={`/projects/${project.id}`}>
                            <h3 className="font-display font-semibold text-lg hover:text-accent transition-colors">
                              {project.title}
                            </h3>
                          </Link>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {project.shortDescription}
                          </p>
                        </div>
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
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Per Share</p>
                          <Money amount={project.perSharePrice} className="font-semibold" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total Value</p>
                          <Money amount={project.totalValue} compact className="font-semibold" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Progress</p>
                          <p className="font-semibold text-accent">{project.fundingProgress.toFixed(0)}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Days Left</p>
                          <p className="font-semibold">{project.daysRemaining}</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <SharesProgress sold={project.sharesSold} total={project.totalShares} size="sm" showLabels={false} />
                      </div>
                      {user?.role === 'INVESTOR' && (
                        <div className="mt-4">
                          <Link to={`/app/investor/projects/${project.id}/invest`}>
                            <Button variant="accent" size="sm" className="gap-2">
                              <DollarSign className="h-4 w-4" />
                              Invest Now
                            </Button>
                          </Link>
                        </div>
                      )}
                    </CardContent>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && totalProjects > pageSize && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <Button
              variant="outline"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {Math.ceil(totalProjects / pageSize)}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage((prev) => prev + 1)}
              disabled={page >= Math.ceil(totalProjects / pageSize)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

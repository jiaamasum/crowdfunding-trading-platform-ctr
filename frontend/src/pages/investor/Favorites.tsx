import { useMemo, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Money, SharesProgress } from '@/components/ui/money';
import { EmptyFavorites } from '@/components/ui/empty-state';
import { PageContainer } from '@/components/ui/page-container';
import { Heart, ExternalLink } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { projectsApi } from '@/lib/projectsApi';
import { investmentsApi } from '@/lib/investmentsApi';
import { MediaImage } from '@/components/common/MediaImage';
import type { Project } from '@/types';
import { useAuthStore } from '@/store/authStore';

export default function FavoritesPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { favorites, removeFavoriteRemote } = useAppStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [investedProjectIds, setInvestedProjectIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await projectsApi.getAll();
        setProjects(data);
      } catch (error) {
        console.error('Failed to load projects', error);
      }
    };

    loadProjects();
  }, []);

  useEffect(() => {
    const loadInvestedProjects = async () => {
      if (!user || user.role !== 'INVESTOR') {
        setInvestedProjectIds(new Set());
        return;
      }
      try {
        const investedStatuses = new Set(['COMPLETED', 'WITHDRAWN', 'REFUNDED', 'REVERSED', 'PROCESSING']);
        const investments = await investmentsApi.list();
        const investedIds = investments
          .filter((inv) => investedStatuses.has(inv.status))
          .map((inv) => inv.projectId);
        setInvestedProjectIds(new Set(investedIds));
      } catch (error) {
        console.error('Failed to load investments', error);
      }
    };

    loadInvestedProjects();
  }, [user]);

  const favoriteProjects = useMemo(() => {
    return projects.filter(p => favorites.includes(p.id));
  }, [favorites, projects]);

  if (favoriteProjects.length === 0) {
    return (
      <PageContainer title="Favorites" description="Projects you've saved for later">
        <EmptyFavorites onBrowse={() => navigate('/app/investor/projects')} />
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Favorites" description={`${favoriteProjects.length} project${favoriteProjects.length !== 1 ? 's' : ''} saved`}>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {favoriteProjects.map((project, i) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="overflow-hidden hover:shadow-soft-lg transition-all group">
              <Link to={`/projects/${project.id}`}>
                <div className="aspect-video bg-muted relative overflow-hidden">
                  {project.thumbnailUrl && (
                    <MediaImage src={project.thumbnailUrl} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  )}
                  <div className="absolute top-3 left-3"><StatusBadge status={project.status} /></div>
                </div>
              </Link>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Link to={`/projects/${project.id}`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display font-semibold line-clamp-1 hover:text-accent transition-colors">
                        {project.title}
                      </h3>
                      {investedProjectIds.has(project.id) && (
                        <Badge variant="outline" className="bg-success text-success-foreground border-success/60 shadow-soft-sm">
                          Invested
                        </Badge>
                      )}
                    </div>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => removeFavoriteRemote(project.id)}
                  >
                    <Heart className="h-4 w-4 fill-destructive" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{project.shortDescription}</p>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Per share</span>
                  <Money amount={project.perSharePrice} className="font-semibold" />
                </div>
                <SharesProgress sold={project.sharesSold} total={project.totalShares} size="sm" showLabels={false} />
                <div className="flex justify-between items-center mt-3">
                  <span className="text-xs text-muted-foreground">{project.fundingProgress.toFixed(0)}% funded</span>
                  <Link to={`/projects/${project.id}`}>
                    <Button variant="ghost" size="sm" className="gap-1">
                      View <ExternalLink className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </PageContainer>
  );
}

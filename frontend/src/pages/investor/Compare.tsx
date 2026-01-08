import { useMemo, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Money, SharesProgress } from '@/components/ui/money';
import { EmptyCompare } from '@/components/ui/empty-state';
import { PageContainer } from '@/components/ui/page-container';
import { Separator } from '@/components/ui/separator';
import { X, Plus, TrendingUp, Layers, Clock, DollarSign, Eye, Box, Lock, Check, Minus, ExternalLink } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { hasProjectAccess } from '@/lib/mockData';
import { projectsApi } from '@/lib/projectsApi';
import { comparatorApi, type ComparatorResponse } from '@/lib/comparatorApi';
import type { Project } from '@/types';
import { cn } from '@/lib/utils';
import { MediaImage } from '@/components/common/MediaImage';

export default function ComparePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { compareList, removeFromCompareRemote, clearCompare } = useAppStore();
  const [compareItems, setCompareItems] = useState<Array<{ id: string; project: Project }>>([]);
  const [comparison, setComparison] = useState<ComparatorResponse | null>(null);

  useEffect(() => {
    if (compareList.length === 0) {
      setCompareItems([]);
      setComparison(null);
      return;
    }
    projectsApi.getCompare()
      .then(setCompareItems)
      .catch((error) => console.error('Failed to load compare list', error));
  }, [compareList]);

  const compareProjectIds = useMemo(() => compareItems.map((item) => item.project.id), [compareItems]);

  useEffect(() => {
    if (compareProjectIds.length === 0) {
      setComparison(null);
      return;
    }
    comparatorApi.compare(compareProjectIds)
      .then(setComparison)
      .catch((error) => console.error('Failed to load comparison data', error));
  }, [compareProjectIds]);

  const compareProjects = useMemo(() => {
    return compareItems.map((item) => item.project);
  }, [compareItems]);

  if (compareProjects.length === 0) {
    return (
      <PageContainer title="Compare Projects" description="Add 2-4 projects to compare them side by side">
        <EmptyCompare onBrowse={() => navigate('/app/investor/projects')} />
      </PageContainer>
    );
  }

  // Find best values for highlighting
  const bestPerShare = Math.min(...compareProjects.map(p => p.perSharePrice));
  const bestProgress = Math.max(...compareProjects.map(p => p.fundingProgress));
  const bestDaysLeft = Math.max(...compareProjects.map(p => p.daysRemaining || 0));
  const getNormalizedScore = (projectId: string) => {
    const entry = comparison?.projects.find((item) => String(item.id) === String(projectId));
    if (!entry?.normalized) return null;
    const values = Object.values(entry.normalized) as number[];
    if (!values.length) return null;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  };

  return (
    <PageContainer 
      title="Compare Projects" 
      description={`Comparing ${compareProjects.length} project${compareProjects.length !== 1 ? 's' : ''} side by side`}
      actions={
        <div className="flex gap-2">
          <Link to="/app/investor/projects">
            <Button variant="outline" size="sm" disabled={compareList.length >= 4}>
              <Plus className="h-4 w-4 mr-1" /> Add More
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              try {
                await Promise.all(compareList.map((id) => removeFromCompareRemote(id)));
                clearCompare();
              } catch (error) {
                console.error('Failed to clear compare list', error);
              }
            }}
          >
            Clear All
          </Button>
        </div>
      }
    >
      {compareProjects.length < 2 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-gradient-to-r from-warning/10 to-warning/5 border border-warning/20 text-warning text-sm mb-6 flex items-center gap-3"
        >
          <div className="p-2 rounded-lg bg-warning/20">
            <Plus className="h-4 w-4" />
          </div>
          <span>Add at least 2 projects to compare them effectively.</span>
        </motion.div>
      )}

      {/* Project Cards Grid */}
      <div className={cn(
        "grid gap-6 mb-8",
        compareProjects.length === 2 && "md:grid-cols-2",
        compareProjects.length === 3 && "md:grid-cols-3",
        compareProjects.length >= 4 && "md:grid-cols-2 lg:grid-cols-4"
      )}>
        {compareProjects.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="relative overflow-hidden group hover:shadow-lg transition-all">
              {/* Remove Button */}
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-3 right-3 z-10 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeFromCompareRemote(project.id)}
              >
                <X className="h-4 w-4" />
              </Button>

              {/* Thumbnail */}
              <div className="aspect-video bg-muted relative overflow-hidden">
                {project.thumbnailUrl && (
                  <MediaImage 
                    src={project.thumbnailUrl} 
                    alt={project.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                )}
                <div className="absolute top-3 left-3">
                  <StatusBadge status={project.status} />
                </div>
                {project.has3DModel && (
                  <div className="absolute bottom-3 right-3 bg-primary/90 text-primary-foreground text-xs px-2 py-1 rounded flex items-center gap-1">
                    <Box className="h-3 w-3" /> 3D
                  </div>
                )}
              </div>

              <CardContent className="pt-4">
                <Link to={`/projects/${project.id}`}>
                  <h3 className="font-display font-semibold text-lg line-clamp-1 hover:text-accent transition-colors mb-1">
                    {project.title}
                  </h3>
                </Link>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {project.shortDescription}
                </p>

                {/* Key Stats */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <DollarSign className="h-4 w-4" /> Per Share
                    </span>
                    <div className="flex items-center gap-2">
                      <Money 
                        amount={project.perSharePrice} 
                        className={cn(
                          "font-semibold",
                          project.perSharePrice === bestPerShare && "text-accent"
                        )}
                      />
                      {project.perSharePrice === bestPerShare && compareProjects.length > 1 && (
                        <Badge variant="outline" className="text-xs border-accent text-accent">Best</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" /> Progress
                    </span>
                    <span className={cn(
                      "font-semibold",
                      project.fundingProgress === bestProgress && "text-accent"
                    )}>
                      {project.fundingProgress.toFixed(1)}%
                    </span>
                  </div>

                  <SharesProgress sold={project.sharesSold} total={project.totalShares} size="sm" showLabels={false} />

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" /> Days Left
                    </span>
                    <span className={cn(
                      "font-semibold",
                      project.daysRemaining === bestDaysLeft && "text-accent"
                    )}>
                      {project.daysRemaining || 'N/A'}
                    </span>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Actions */}
                <div className="flex gap-2">
                  <Link to={`/projects/${project.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      <Eye className="h-4 w-4" /> View
                    </Button>
                  </Link>
                  <Link to={`/projects/${project.id}`} className="flex-1">
                    <Button variant="accent" size="sm" className="w-full gap-2">
                      <DollarSign className="h-4 w-4" /> Request to Invest
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Detailed Comparison Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader className="pb-4">
            <h2 className="text-xl font-display font-semibold">Detailed Comparison</h2>
            <p className="text-sm text-muted-foreground">Compare key metrics across all selected projects</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Financial Details */}
              <div className="rounded-xl bg-muted/50 p-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">Financial Details</h3>
                <div className="grid gap-4">
                  <ComparisonRow
                    label="Total Value"
                    values={compareProjects.map(p => (
                      <Money key={p.id} amount={p.totalValue} compact className="font-semibold" />
                    ))}
                    projectNames={compareProjects.map(p => p.title)}
                  />
                  <ComparisonRow
                    label="Total Shares"
                    values={compareProjects.map(p => (
                      <span key={p.id} className="font-semibold">{p.totalShares.toLocaleString()}</span>
                    ))}
                    projectNames={compareProjects.map(p => p.title)}
                  />
                  <ComparisonRow
                    label="Shares Sold"
                    values={compareProjects.map(p => (
                      <span key={p.id} className="font-semibold">{p.sharesSold.toLocaleString()}</span>
                    ))}
                    projectNames={compareProjects.map(p => p.title)}
                  />
                  <ComparisonRow
                    label="Remaining Shares"
                    values={compareProjects.map(p => (
                      <span key={p.id} className="font-semibold text-accent">{p.remainingShares.toLocaleString()}</span>
                    ))}
                    projectNames={compareProjects.map(p => p.title)}
                  />
                  <ComparisonRow
                    label="Normalized Score"
                    values={compareProjects.map(p => {
                      const score = getNormalizedScore(p.id);
                      return (
                        <span key={p.id} className="font-semibold">
                          {score !== null ? `${(score * 100).toFixed(0)}%` : '—'}
                        </span>
                      );
                    })}
                    projectNames={compareProjects.map(p => p.title)}
                  />
                </div>
              </div>

              {/* Project Features */}
              <div className="rounded-xl bg-muted/50 p-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">Features</h3>
                <div className="grid gap-4">
                  <ComparisonRow
                    label="Category"
                    values={compareProjects.map(p => (
                      <StatusBadge key={p.id} status={p.category} showDot={false} />
                    ))}
                    projectNames={compareProjects.map(p => p.title)}
                  />
                  <ComparisonRow
                    label="3D Model"
                    values={compareProjects.map(p => (
                      <span key={p.id} className="flex items-center gap-2">
                        {p.has3DModel ? (
                          <><Check className="h-4 w-4 text-accent" /> Available</>
                        ) : (
                          <><Minus className="h-4 w-4 text-muted-foreground" /> —</>
                        )}
                      </span>
                    ))}
                    projectNames={compareProjects.map(p => p.title)}
                  />
                  <ComparisonRow
                    label="Duration"
                    values={compareProjects.map(p => (
                      <span key={p.id} className="font-medium">{p.durationDays} days</span>
                    ))}
                    projectNames={compareProjects.map(p => p.title)}
                  />
                </div>
              </div>

              {/* Restricted Information */}
              <div className="rounded-xl bg-warning/5 border border-warning/20 p-4">
                <h3 className="font-semibold text-sm text-warning uppercase tracking-wide mb-4 flex items-center gap-2">
                  <Lock className="h-4 w-4" /> Restricted Information
                </h3>
                <div className="grid gap-4">
                  <ComparisonRow
                    label="Financial Projections"
                    values={compareProjects.map(p => {
                      if (!p.hasRestrictedFields) return <Minus key={p.id} className="h-4 w-4 text-muted-foreground" />;
                      const hasAccess = user ? hasProjectAccess(user.id, p.id) : false;
                      if (hasAccess && p.restrictedFields?.financialProjections) {
                        return <span key={p.id} className="text-xs text-muted-foreground">{p.restrictedFields.financialProjections.slice(0, 60)}...</span>;
                      }
                      return (
                        <span key={p.id} className="text-xs text-warning flex items-center gap-1">
                          <Lock className="h-3 w-3" /> Restricted
                        </span>
                      );
                    })}
                    projectNames={compareProjects.map(p => p.title)}
                  />
                  <ComparisonRow
                    label="Business Plan"
                    values={compareProjects.map(p => {
                      if (!p.hasRestrictedFields) return <Minus key={p.id} className="h-4 w-4 text-muted-foreground" />;
                      const hasAccess = user ? hasProjectAccess(user.id, p.id) : false;
                      if (hasAccess && p.restrictedFields?.businessPlan) {
                        return <span key={p.id} className="text-xs text-muted-foreground">{p.restrictedFields.businessPlan.slice(0, 60)}...</span>;
                      }
                      return (
                        <span key={p.id} className="text-xs text-warning flex items-center gap-1">
                          <Lock className="h-3 w-3" /> Restricted
                        </span>
                      );
                    })}
                    projectNames={compareProjects.map(p => p.title)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </PageContainer>
  );
}

// Helper component for comparison rows
function ComparisonRow({ 
  label, 
  values, 
  projectNames 
}: { 
  label: string; 
  values: React.ReactNode[]; 
  projectNames: string[];
}) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: `140px repeat(${values.length}, 1fr)` }}>
      <div className="text-sm text-muted-foreground font-medium">{label}</div>
      {values.map((value, i) => (
        <div key={i} className="text-sm">
          <span className="text-xs text-muted-foreground block mb-1 lg:hidden">{projectNames[i]}</span>
          {value}
        </div>
      ))}
    </div>
  );
}

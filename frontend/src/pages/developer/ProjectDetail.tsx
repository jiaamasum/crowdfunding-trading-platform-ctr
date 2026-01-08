import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/ui/status-badge';
import { Money } from '@/components/ui/money';
import { SharesProgress } from '@/components/ui/shares-progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Lightbox, useLightbox } from '@/components/ui/lightbox';
import { MediaImage } from '@/components/common/MediaImage';
import { 
  ArrowLeft, 
  Edit, 
  Upload, 
  Send, 
  Calendar,
  DollarSign,
  Users,
  Layers,
  TrendingUp,
  Clock,
  AlertCircle,
  Maximize2
} from 'lucide-react';
import { investmentsApi } from '@/lib/investmentsApi';
import { useAuthStore } from '@/store/authStore';
import { projectsApi } from '@/lib/projectsApi';
import type { Project, Investment } from '@/types';

export default function DeveloperProjectDetail() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const lightbox = useLightbox();
  const [project, setProject] = useState<Project | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);

  useEffect(() => {
    const loadProject = async () => {
      if (!id) return;
      const data = await projectsApi.getById(id);
      setProject(data);
    };

    loadProject();
  }, [id]);
  useEffect(() => {
    const loadInvestments = async () => {
      if (!id) return;
      try {
        const data = await investmentsApi.list();
        setInvestments(data.filter(inv => inv.projectId === String(id)));
      } catch (error) {
        console.error('Failed to load investments', error);
      }
    };

    loadInvestments();
  }, [id]);
  
  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    );
  }

  const fundsSecured = project.sharesSold * project.perSharePrice;
  const canEdit = ['DRAFT', 'NEEDS_CHANGES', 'REJECTED', 'APPROVED'].includes(project.status);
  const canSubmit = ['DRAFT', 'NEEDS_CHANGES'].includes(project.status);
  const isApproved = project.status === 'APPROVED';

  const stats = [
    { label: 'Total Value', value: project.totalValue, icon: DollarSign, isMoney: true },
    { label: 'Per Share', value: project.perSharePrice, icon: Layers, isMoney: true },
    { label: 'Shares Sold', value: project.sharesSold, subValue: project.totalShares, icon: TrendingUp, isShares: true },
    { label: 'Investors', value: investments.length, icon: Users },
    { label: 'Days Remaining', value: project.daysRemaining || 'N/A', icon: Clock },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link to="/app/developer/projects">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-display font-bold">{project.title}</h1>
              <StatusBadge status={project.status} />
            </div>
            <p className="text-muted-foreground">{project.shortDescription}</p>
          </div>
        </div>
        <div className="flex gap-2 ml-12 lg:ml-0">
          {canEdit && (
            <>
              <Link to={`/app/developer/projects/${id}/edit`}>
                <Button variant="outline" className="gap-2">
                  <Edit className="h-4 w-4" /> {isApproved ? 'Request Edit' : 'Edit'}
                </Button>
              </Link>
              <Link to={`/app/developer/projects/${id}/media`}>
                <Button variant="outline" className="gap-2">
                  <Upload className="h-4 w-4" /> {isApproved ? 'Request Media Update' : 'Media'}
                </Button>
              </Link>
            </>
          )}
          {canSubmit && (
            <Link to={`/app/developer/projects/${id}/submit`}>
              <Button className="gap-2">
                <Send className="h-4 w-4" /> Submit for Review
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Admin Notes (if any) */}
      {project.status === 'NEEDS_CHANGES' && (
        <Card className="border-warning bg-warning/5">
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-warning">Changes Requested</p>
              <p className="text-sm text-muted-foreground mt-1">
                The admin has requested changes to your project. Please review the feedback and make necessary updates.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex-shrink-0 flex items-center justify-center">
                    <stat.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    {stat.isMoney ? (
                      <Money amount={stat.value as number} className="text-lg font-bold" />
                    ) : stat.isShares ? (
                      <p className="text-lg font-bold whitespace-nowrap">
                        {(stat.value as number).toLocaleString()}
                        <span className="text-sm font-normal text-muted-foreground">/{stat.subValue?.toLocaleString()}</span>
                      </p>
                    ) : (
                      <p className="text-lg font-bold">{stat.value}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Funding Progress</p>
              <div className="flex items-baseline gap-2">
                <Money amount={fundsSecured} className="text-2xl font-bold text-accent" />
                <span className="text-muted-foreground">of</span>
                <Money amount={project.totalValue} className="text-lg" />
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{project.fundingProgress}%</p>
              <p className="text-sm text-muted-foreground">Complete</p>
            </div>
          </div>
          <SharesProgress sold={project.sharesSold} total={project.totalShares} showLabel={false} />
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="investors">Investors ({investments.length})</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">{project.description}</p>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <span className="font-medium">{project.category.replace('_', ' ')}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">{project.durationDays} days</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Start Date</span>
                  <span className="font-medium">{project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not started'}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span className="font-medium">{new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Restricted Data</CardTitle>
              </CardHeader>
              <CardContent>
                {!project.hasRestrictedFields ? (
                  <p className="text-sm text-muted-foreground">
                    No restricted fields configured for this project.
                  </p>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Only approved investors can view this data. As the owner, you can see your restricted data below.
                    </p>
                    {project.restrictedFields?.financialProjections && (
                      <div className="p-4 rounded-lg bg-muted/50 border">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Financial Projections</p>
                        <p className="text-sm">{project.restrictedFields.financialProjections}</p>
                      </div>
                    )}
                    {project.restrictedFields?.businessPlan && (
                      <div className="p-4 rounded-lg bg-muted/50 border">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Business Plan</p>
                        <p className="text-sm">{project.restrictedFields.businessPlan}</p>
                      </div>
                    )}
                    {project.restrictedFields?.teamDetails && (
                      <div className="p-4 rounded-lg bg-muted/50 border">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Team Details</p>
                        <p className="text-sm">{project.restrictedFields.teamDetails}</p>
                      </div>
                    )}
                    {project.restrictedFields?.riskAssessment && (
                      <div className="p-4 rounded-lg bg-muted/50 border">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Risk Assessment</p>
                        <p className="text-sm">{project.restrictedFields.riskAssessment}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="investors" className="mt-6">
          <Card>
            {investments.length === 0 ? (
              <CardContent className="py-12 text-center text-muted-foreground">
                No investments yet
              </CardContent>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Investor</TableHead>
                    <TableHead>Shares</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {investments.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{inv.investorName}</p>
                          <p className="text-xs text-muted-foreground">{inv.investorEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>{inv.shares.toLocaleString()}</TableCell>
                      <TableCell><Money amount={inv.totalAmount} /></TableCell>
                      <TableCell className="text-muted-foreground">{new Date(inv.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell><StatusBadge status={inv.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="media" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Project Media</CardTitle>
              {canEdit && (
                <Link to={`/app/developer/projects/${id}/media`}>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Upload className="h-4 w-4" /> Manage Media
                  </Button>
                </Link>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {project.images?.map((img, index) => (
                  <button 
                    key={index} 
                    onClick={() => lightbox.openLightbox(project.images || [], index)}
                    className="aspect-video rounded-lg overflow-hidden bg-muted group relative"
                  >
                    <MediaImage src={img} alt={`Project image ${index + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm rounded-full p-2">
                        <Maximize2 className="h-4 w-4" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              {project.has3DModel && (
                <div className="mt-4 p-4 rounded-lg border border-dashed">
                  <p className="text-sm text-muted-foreground">
                    3D Model: {project.is3DPublic ? 'Public' : 'Restricted'} 
                    {project.model3DUrl && ` (${project.model3DUrl})`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Lightbox for viewing images */}
      <Lightbox
        images={lightbox.images}
        initialIndex={lightbox.index}
        open={lightbox.open}
        onOpenChange={lightbox.setOpen}
      />
    </div>
  );
}

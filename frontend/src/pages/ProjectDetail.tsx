import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { Money, SharesProgress, LockedField } from '@/components/ui/money';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ImageCarousel } from '@/components/ui/image-carousel';
import { Lightbox, useLightbox } from '@/components/ui/lightbox';
import { MediaImage } from '@/components/common/MediaImage';
import {
  Heart, GitCompare, ChevronLeft, Calendar, Clock, Users,
  DollarSign, PieChart, Lock, FileText, Shield, AlertTriangle, Play,
  RotateCcw, ZoomIn, ZoomOut, Maximize2, Image as ImageIcon
} from 'lucide-react';
import Header from '@/components/common/Header';
import { accessRequestsApi } from '@/lib/accessRequestsApi';
import { projectsApi } from '@/lib/projectsApi';
import { investmentsApi } from '@/lib/investmentsApi';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Project, AccessRequestStatus, Investment } from '@/types';

const getRequestErrorMessage = (error: unknown, fallback: string) => {
  if (!axios.isAxiosError(error)) {
    return (error as { message?: string })?.message || fallback;
  }

  const data = error.response?.data;
  if (typeof data === 'string') return data;
  if (data?.detail) return data.detail;
  if (data?.error) return data.error;

  const firstKey = data ? Object.keys(data)[0] : null;
  const firstValue = firstKey ? data[firstKey] : null;
  if (Array.isArray(firstValue) && firstValue.length > 0) {
    return firstValue[0] || fallback;
  }
  if (typeof firstValue === 'string') {
    return firstValue;
  }
  return error.message || fallback;
};

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const {
    isFavorite,
    addFavoriteRemote,
    removeFavoriteRemote,
    isInCompare,
    addToCompareRemote,
    removeFromCompareRemote,
    canAddToCompare,
  } = useAppStore();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAccessDialog, setShowAccessDialog] = useState(false);
  const [accessMessage, setAccessMessage] = useState('');
  const [accessConfirmed, setAccessConfirmed] = useState(false);
  const [submittingAccess, setSubmittingAccess] = useState(false);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [requestingInvestment, setRequestingInvestment] = useState(false);
  const [investmentNote, setInvestmentNote] = useState('');
  const [investmentShares, setInvestmentShares] = useState(1);
  const [investmentConfirmed, setInvestmentConfirmed] = useState(false);

  // Lightbox for image viewing
  const lightbox = useLightbox();

  // Access request status for this project
  const [accessStatus, setAccessStatus] = useState<AccessRequestStatus | null>(null);
  const [accessNote, setAccessNote] = useState<string | undefined>();
  const [showInvestDialog, setShowInvestDialog] = useState(false);

  // Check for section query param to auto-navigate to restricted tab
  useEffect(() => {
    const section = searchParams.get('section');
    if (section === 'restricted') {
      setActiveTab('restricted');
    }
  }, [searchParams]);

  useEffect(() => {
    const loadProject = async () => {
      setLoading(true);
      const found = id ? await projectsApi.getById(id) : null;
      setProject(found || null);

      setLoading(false);
    };
    loadProject();
  }, [id, user]);

  useEffect(() => {
    setInvestmentShares(1);
  }, [project?.id]);

  useEffect(() => {
    const loadInvestmentRequest = async () => {
      if (!user || user.role !== 'INVESTOR' || !id) {
        setInvestments([]);
        return;
      }
      try {
        const items = await investmentsApi.list({ project: id });
        const sorted = [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setInvestments(sorted);
      } catch (error) {
        console.error('Failed to load investment request', error);
      }
    };
    loadInvestmentRequest();
  }, [id, user]);

  useEffect(() => {
    const loadAccessStatus = async () => {
      if (!user || !project) return;
      try {
        const requests = await accessRequestsApi.listMine();
        const request = requests.find((item) => item.project === String(project.id));
        if (request) {
          setAccessStatus(request.status);
          setAccessNote(request.admin_note || undefined);
        } else {
          setAccessStatus(null);
          setAccessNote(undefined);
        }
      } catch (error) {
        console.error('Failed to load access requests', error);
      }
    };

    loadAccessStatus();
    const interval = setInterval(loadAccessStatus, 15000);
    return () => clearInterval(interval);
  }, [user, project]);

  useEffect(() => {
    const refreshProject = async () => {
      if (!project) return;
      const updated = await projectsApi.getById(project.id);
      if (updated) setProject(updated);
    };
    if (accessStatus === 'APPROVED') {
      refreshProject();
    }
  }, [accessStatus, project?.id]);

  const handleFavoriteToggle = () => {
    if (!project) return;
    if (!user) {
      toast({ title: 'Please sign in to favorite projects', variant: 'destructive' });
      return;
    }
    if (isFavorite(project.id)) {
      removeFavoriteRemote(project.id)
        .then(() => toast({ title: 'Removed from favorites' }))
        .catch((error) =>
          toast({
            title: 'Favorite update failed',
            description: error instanceof Error ? error.message : 'Please try again.',
            variant: 'destructive',
          })
        );
    } else {
      addFavoriteRemote(project.id)
        .then(() => toast({ title: 'Added to favorites' }))
        .catch((error) =>
          toast({
            title: 'Favorite update failed',
            description: error instanceof Error ? error.message : 'Please try again.',
            variant: 'destructive',
          })
        );
    }
  };

  const handleCompareToggle = () => {
    if (!project) return;
    if (!user) {
      toast({ title: 'Please sign in to compare projects', variant: 'destructive' });
      return;
    }
    if (isInCompare(project.id)) {
      removeFromCompareRemote(project.id)
        .then(() => toast({ title: 'Removed from compare list' }))
        .catch((error) =>
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
    addToCompareRemote(project.id)
      .then(() => toast({ title: 'Added to compare list' }))
      .catch((error) =>
        toast({
          title: 'Compare update failed',
          description: error instanceof Error ? error.message : 'Please try again.',
          variant: 'destructive',
        })
      );
  };

  const handleRequestAccess = async () => {
    if (!accessConfirmed) {
      toast({ title: 'Please confirm the checkbox', variant: 'destructive' });
      return;
    }

    setSubmittingAccess(true);
    try {
      if (!project) return;
      const request = await accessRequestsApi.create(project.id, accessMessage);
      setAccessStatus(request.status);
      setShowAccessDialog(false);
      toast({ title: 'Access request submitted', description: 'You will be notified when the admin reviews your request.' });
    } catch (error) {
      toast({
        title: 'Request failed',
        description: getRequestErrorMessage(error, 'Please try again.'),
        variant: 'destructive',
      });
    } finally {
      setSubmittingAccess(false);
    }
  };

  const handleRequestInvestment = async () => {
    if (!project) return;
    if (!investmentConfirmed) {
      toast({
        title: 'Confirmation required',
        description: 'Please acknowledge the investment request terms to continue.',
        variant: 'destructive',
      });
      return;
    }
    const maxShares = Number(project.remainingShares) || 0;
    if (!Number.isFinite(investmentShares) || !Number.isInteger(investmentShares) || investmentShares < 1 || investmentShares > maxShares) {
      toast({ title: 'Invalid share amount', variant: 'destructive' });
      return;
    }
    setRequestingInvestment(true);
    try {
      const request = await investmentsApi.requestInvestment(project.id, investmentShares, investmentNote);
      setInvestments((prev) => [request, ...prev]);
      setShowInvestDialog(false);
      toast({
        title: 'Investment request submitted',
        description: 'An admin will review your request.',
      });
      setInvestmentNote('');
    } catch (error) {
      toast({
        title: 'Request failed',
        description: getRequestErrorMessage(error, 'Please try again.'),
        variant: 'destructive',
      });
    } finally {
      setRequestingInvestment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-8 w-48 mb-8" />
          <Skeleton className="h-80 w-full rounded-xl mb-6" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Project not found</h1>
          <p className="text-muted-foreground mb-4">The project you're looking for doesn't exist.</p>
          <Link to="/projects"><Button>Back to Projects</Button></Link>
        </div>
      </div>
    );
  }

  const isInvestor = user?.role === 'INVESTOR';
  const isBanned = Boolean(user?.isBanned);
  const isAdmin = user?.role === 'ADMIN';
  const latestInvestment = investments[0] || null;
  const activeInvestmentStatuses = new Set(['REQUESTED', 'APPROVED', 'PROCESSING']);
  const activeInvestment = investments.find((inv) => activeInvestmentStatuses.has(inv.status)) || null;
  const isExpiredApproval = Boolean(
    activeInvestment?.status === 'APPROVED'
    && activeInvestment?.approvalExpiresAt
    && new Date(activeInvestment.approvalExpiresAt) < new Date()
  );
  const hasActiveInvestment = Boolean(activeInvestment) && !isExpiredApproval;
  const investmentStatus = isExpiredApproval ? 'EXPIRED' : activeInvestment?.status ?? latestInvestment?.status;
  const hasInvestmentAccess = investments.some((inv) => ['PROCESSING', 'COMPLETED'].includes(inv.status));
  const investedStatuses = new Set(['COMPLETED', 'WITHDRAWN', 'REFUNDED', 'REVERSED', 'PROCESSING']);
  const hasInvested = investments.some((inv) => investedStatuses.has(inv.status));
  const hasAccess = accessStatus === 'APPROVED' || isAdmin || hasInvestmentAccess;
  const canRequestAccess = user?.isVerified && isInvestor && project.hasRestrictedFields && !accessStatus && !hasInvestmentAccess && !isBanned;
  const canRequestInvestment = user?.isVerified && isInvestor && project.status === 'APPROVED' && project.remainingShares > 0 && !hasActiveInvestment && !isBanned;
  const canPayInvestment = activeInvestment?.status === 'APPROVED' && !isExpiredApproval && !isBanned;
  const canReRequestInvestment = canRequestInvestment && ['EXPIRED', 'REJECTED', 'REFUNDED', 'WITHDRAWN', 'REVERSED', 'CANCELLED'].includes(investmentStatus || '');
  const requestCtaLabel = canReRequestInvestment ? 'Request Again' : (hasInvested ? 'Invest Again' : 'Request to Invest');

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Back Button */}
      <div className="container mx-auto px-4 py-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6 min-w-0">
            {/* Hero Image Carousel */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="relative">
                {project.images.length > 0 ? (
                  <ImageCarousel
                    images={project.images}
                    onImageClick={(index) => lightbox.openLightbox(project.images, index)}
                  />
                ) : project.thumbnailUrl ? (
                  <div
                    className="aspect-video rounded-xl overflow-hidden bg-muted cursor-pointer group"
                    onClick={() => lightbox.openLightbox([project.thumbnailUrl!], 0)}
                  >
                    <MediaImage src={project.thumbnailUrl} alt={project.title} className="w-full h-full object-cover transition-transform group-hover:scale-[1.02]" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm rounded-full p-2">
                        <Maximize2 className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video rounded-xl overflow-hidden bg-muted flex items-center justify-center text-muted-foreground">
                    <ImageIcon className="h-16 w-16" />
                  </div>
                )}
                <div className="absolute top-4 left-4 z-10"><StatusBadge status={project.status} /></div>
                {project.has3DModel && (
                  <div className="absolute top-4 right-4 z-10 bg-primary text-primary-foreground px-3 py-1 rounded-lg text-sm font-medium">
                    3D Model Available
                  </div>
                )}
              </div>
            </motion.div>

            {/* Title & Actions */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h1 className="text-3xl font-display font-bold break-words">{project.title}</h1>
                    {isInvestor && hasInvested && (
                      <Badge variant="outline" className="bg-success text-success-foreground border-success/60 shadow-soft-sm">
                        Invested
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground break-words">by {project.developerName}</p>
                </div>
                {user?.role === 'INVESTOR' && (
                  <div className="flex gap-2 sm:shrink-0">
                    <Button variant="outline" size="icon" onClick={handleFavoriteToggle}>
                      <Heart className={cn("h-5 w-5", isFavorite(project.id) && "fill-destructive text-destructive")} />
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleCompareToggle}>
                      <GitCompare className={cn("h-5 w-5", isInCompare(project.id) && "text-accent")} />
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Tabs */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full justify-start overflow-x-auto flex flex-nowrap overflow-y-hidden [&::-webkit-scrollbar]:hidden">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="financials">Financials</TabsTrigger>
                  <TabsTrigger value="progress">Progress</TabsTrigger>
                  <TabsTrigger value="media">Media</TabsTrigger>
                  {project.has3DModel && <TabsTrigger value="3d">3D Viewer</TabsTrigger>}
                  {project.hasRestrictedFields && <TabsTrigger value="restricted">Restricted</TabsTrigger>}
                </TabsList>

                <TabsContent value="overview" className="mt-6 space-y-6">
                  <Card>
                    <CardHeader><CardTitle>About This Project</CardTitle></CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed break-words">{project.description}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle>Category</CardTitle></CardHeader>
                    <CardContent>
                      <StatusBadge status={project.category} showDot={false} />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="financials" className="mt-6 space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Project Value</CardTitle></CardHeader>
                      <CardContent><Money amount={project.totalValue} className="text-2xl font-bold" /></CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Per Share Price</CardTitle></CardHeader>
                      <CardContent><Money amount={project.perSharePrice} className="text-2xl font-bold text-accent" /></CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Shares</CardTitle></CardHeader>
                      <CardContent><p className="text-2xl font-bold">{project.totalShares.toLocaleString()}</p></CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Shares Sold</CardTitle></CardHeader>
                      <CardContent><p className="text-2xl font-bold">{project.sharesSold.toLocaleString()}</p></CardContent>
                    </Card>
                  </div>
                  <Card>
                    <CardHeader><CardTitle>Funding Progress</CardTitle></CardHeader>
                    <CardContent>
                      <SharesProgress sold={project.sharesSold} total={project.totalShares} />
                      <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        <span>Funds raised: <Money amount={project.sharesSold * project.perSharePrice} className="font-semibold text-foreground" /></span>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="progress" className="mt-6 space-y-6">
                  <div className="grid sm:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4" /> Duration</CardTitle></CardHeader>
                      <CardContent><p className="text-2xl font-bold">{project.durationDays} days</p></CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><Clock className="h-4 w-4" /> Days Remaining</CardTitle></CardHeader>
                      <CardContent><p className="text-2xl font-bold text-warning">{project.daysRemaining || 'N/A'}</p></CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><PieChart className="h-4 w-4" /> Funded</CardTitle></CardHeader>
                      <CardContent><p className="text-2xl font-bold text-accent">{project.fundingProgress.toFixed(1)}%</p></CardContent>
                    </Card>
                  </div>
                  {project.startDate && (
                    <Card>
                      <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
                      <CardContent>
                        <div className="flex flex-col sm:flex-row items-center justify-between text-sm gap-4 sm:gap-0">
                          <div className="w-full sm:w-auto text-left">
                            <p className="text-muted-foreground">Start Date</p>
                            <p className="font-medium">{new Date(project.startDate).toLocaleDateString()}</p>
                          </div>
                          <div className="flex-1 w-full sm:w-auto h-2 rounded-full bg-muted overflow-hidden my-2 sm:my-0 sm:mx-8">
                            <div className="h-full bg-accent" style={{ width: `${100 - ((project.daysRemaining || 0) / project.durationDays * 100)}%` }} />
                          </div>
                          <div className="w-full sm:w-auto text-right">
                            <p className="text-muted-foreground">End Date</p>
                            <p className="font-medium">{project.endDate ? new Date(project.endDate).toLocaleDateString() : 'TBD'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="media" className="mt-6">
                  <Card>
                    <CardHeader><CardTitle>Project Gallery</CardTitle></CardHeader>
                    <CardContent>
                      {project.images.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          {project.images.map((img, i) => (
                            <button
                              key={i}
                              onClick={() => lightbox.openLightbox(project.images, i)}
                              className="aspect-video rounded-lg overflow-hidden hover:opacity-90 transition-opacity group relative"
                            >
                              <MediaImage src={img} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm rounded-full p-2">
                                  <Maximize2 className="h-4 w-4" />
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-8">No images available</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {project.has3DModel && (
                  <TabsContent value="3d" className="mt-6">
                    <Card>
                      <CardHeader><CardTitle>3D Model Viewer</CardTitle></CardHeader>
                      <CardContent>
                        {project.is3DPublic || hasAccess ? (
                          <div className="aspect-video rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center relative">
                            <div className="text-center">
                              <div className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4 animate-float">
                                <Play className="h-10 w-10 text-accent" />
                              </div>
                              <p className="text-lg font-medium mb-2">3D Model Viewer</p>
                              <p className="text-sm text-muted-foreground">Interactive 3D model coming soon</p>
                            </div>
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-wrap justify-center gap-2 w-[90%]">
                              <Button variant="outline" size="sm"><RotateCcw className="h-4 w-4 mr-1" /> Reset</Button>
                              <Button variant="outline" size="sm"><ZoomIn className="h-4 w-4 mr-1" /> Zoom In</Button>
                              <Button variant="outline" size="sm"><ZoomOut className="h-4 w-4 mr-1" /> Zoom Out</Button>
                              <Button variant="outline" size="sm"><Maximize2 className="h-4 w-4 mr-1" /> Fullscreen</Button>
                            </div>
                          </div>
                        ) : (
                          <LockedField label="3D Model" status={accessStatus ? accessStatus.toLowerCase() as any : 'not_requested'} reason={accessNote} />
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}

                {project.hasRestrictedFields && (
                  <TabsContent value="restricted" className="mt-6 space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="h-5 w-5" /> Restricted Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {hasAccess ? (
                          <>
                            {project.restrictedFields?.financialProjections && (
                              <div className="p-4 rounded-lg bg-muted/50">
                                <h4 className="font-semibold mb-2 flex items-center gap-2"><FileText className="h-4 w-4" /> Financial Projections</h4>
                                <p className="text-sm text-muted-foreground break-words">{project.restrictedFields.financialProjections}</p>
                              </div>
                            )}
                            {project.restrictedFields?.businessPlan && (
                              <div className="p-4 rounded-lg bg-muted/50">
                                <h4 className="font-semibold mb-2 flex items-center gap-2"><FileText className="h-4 w-4" /> Business Plan</h4>
                                <p className="text-sm text-muted-foreground break-words">{project.restrictedFields.businessPlan}</p>
                              </div>
                            )}
                            {project.restrictedFields?.riskAssessment && (
                              <div className="p-4 rounded-lg bg-muted/50">
                                <h4 className="font-semibold mb-2 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Risk Assessment</h4>
                                <p className="text-sm text-muted-foreground break-words">{project.restrictedFields.riskAssessment}</p>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="space-y-3">
                            <LockedField label="Financial Projections" status={accessStatus ? accessStatus.toLowerCase() as any : 'not_requested'} reason={accessNote} />
                            <LockedField label="Business Plan" status={accessStatus ? accessStatus.toLowerCase() as any : 'not_requested'} reason={accessNote} />
                            <LockedField label="Risk Assessment" status={accessStatus ? accessStatus.toLowerCase() as any : 'not_requested'} reason={accessNote} />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}
              </Tabs>
            </motion.div>
          </div>

          {/* Right Column - Investment Card */}
          <div className="lg:col-span-1 min-w-0">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="lg:sticky lg:top-24">
              <Card className="shadow-soft-lg">
                <CardHeader>
                  <CardTitle>Investment Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Per Share Price</span>
                    <Money amount={project.perSharePrice} className="font-bold text-lg" />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Remaining Shares</span>
                    <span className="font-bold">{project.remainingShares.toLocaleString()}</span>
                  </div>
                  <SharesProgress sold={project.sharesSold} total={project.totalShares} />

                  {!user ? (
                    <div className="space-y-3 pt-4">
                      <p className="text-sm text-center text-muted-foreground">Sign in to invest in this project</p>
                      <Link to="/auth/login" className="block"><Button variant="highlight" className="w-full">Sign In to Invest</Button></Link>
                    </div>
                  ) : !user.isVerified ? (
                    <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                      <p className="text-sm text-warning flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Verify your email to invest
                      </p>
                    </div>
                  ) : user.role !== 'INVESTOR' ? (
                    <p className="text-sm text-center text-muted-foreground pt-4">Only investors can invest in projects</p>
                  ) : isBanned ? (
                    <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-center">
                      <p className="text-sm text-destructive">Your account is restricted from investing actions.</p>
                    </div>
                  ) : project.remainingShares === 0 ? (
                    <div className="p-4 rounded-lg bg-muted text-center">
                      <p className="font-semibold">Fully Funded!</p>
                      <p className="text-sm text-muted-foreground">This project has reached its goal</p>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-4">
                      {canRequestInvestment && (
                        <Button variant="highlight" className="w-full" size="lg" onClick={() => setShowInvestDialog(true)}>
                          {requestCtaLabel}
                        </Button>
                      )}
                      {canPayInvestment && (
                        <Link to={`/app/investor/projects/${project.id}/invest`}>
                          <Button variant="highlight" className="w-full" size="lg">
                            Pay to Invest
                          </Button>
                        </Link>
                      )}
                      {investmentStatus === 'APPROVED' && activeInvestment?.approvalExpiresAt && (
                        <p className="text-xs text-center text-muted-foreground">
                          Approval expires on {new Date(activeInvestment.approvalExpiresAt).toLocaleDateString()}
                        </p>
                      )}
                      {investmentStatus === 'REQUESTED' && (
                        <p className="text-sm text-center text-warning">Investment request pending review</p>
                      )}
                      {investmentStatus === 'PROCESSING' && (
                        <p className="text-sm text-center text-muted-foreground">Payment received. Awaiting admin approval.</p>
                      )}
                      {investmentStatus === 'EXPIRED' && (
                        <p className="text-sm text-center text-warning">Investment approval expired. Request again.</p>
                      )}
                      {investmentStatus === 'COMPLETED' && (
                        <p className="text-sm text-center text-success">Investment completed</p>
                      )}
                      {canRequestAccess && (
                        <Button variant="outline" className="w-full" onClick={() => setShowAccessDialog(true)}>
                          <Lock className="h-4 w-4 mr-2" /> Request Restricted Access
                        </Button>
                      )}
                      {accessStatus === 'PENDING' && (
                        <p className="text-sm text-center text-warning">Access request pending review</p>
                      )}
                      {accessStatus === 'REJECTED' && (
                        <p className="text-sm text-center text-destructive">Access request was denied</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Access Request Dialog */}
      <Dialog open={showAccessDialog} onOpenChange={setShowAccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Restricted Access</DialogTitle>
            <DialogDescription>
              Request access to view confidential information about this project including financial projections, business plans, and risk assessments.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Message (Optional)</Label>
              <Textarea
                placeholder="Explain why you'd like access to restricted information..."
                value={accessMessage}
                onChange={(e) => setAccessMessage(e.target.value)}
              />
            </div>
            <div className="flex items-start gap-2">
              <Checkbox id="confirm" checked={accessConfirmed} onCheckedChange={(c) => setAccessConfirmed(!!c)} />
              <label htmlFor="confirm" className="text-sm text-muted-foreground">
                I understand that this request will be reviewed by an administrator and I agree to handle any confidential information responsibly.
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAccessDialog(false)}>Cancel</Button>
            <Button variant="highlight" onClick={handleRequestAccess} disabled={submittingAccess}>
              {submittingAccess ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showInvestDialog}
        onOpenChange={(open) => {
          setShowInvestDialog(open);
          if (!open) {
            setInvestmentConfirmed(false);
            setInvestmentNote('');
            setInvestmentShares(1);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request to Invest</DialogTitle>
            <DialogDescription>
              Submit your request to invest. An admin will review and approve it before payment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="shares">Shares Requested</Label>
              <Input
                id="shares"
                type="number"
                min={1}
                max={project.remainingShares}
                step={1}
                inputMode="numeric"
                value={investmentShares}
                onChange={(e) => {
                  const nextValue = Number(e.target.value);
                  setInvestmentShares(Number.isFinite(nextValue) ? nextValue : 0);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Message (Optional)</Label>
              <Textarea
                placeholder="Add a note for the admin..."
                value={investmentNote}
                onChange={(e) => setInvestmentNote(e.target.value)}
              />
            </div>
            <div className="flex items-start gap-2">
              <Checkbox
                id="invest-confirm"
                checked={investmentConfirmed}
                onCheckedChange={(value) => setInvestmentConfirmed(!!value)}
              />
              <label htmlFor="invest-confirm" className="text-sm text-muted-foreground">
                I understand this is only a request. I can pay after admin approval and my request may be declined or expire.
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvestDialog(false)}>Cancel</Button>
            <Button variant="highlight" onClick={handleRequestInvestment} disabled={requestingInvestment || !investmentConfirmed}>
              {requestingInvestment ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/ui/status-badge';
import { Money, SharesProgress, LockedField } from '@/components/ui/money';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ImageCarousel } from '@/components/ui/image-carousel';
import { Lightbox, useLightbox } from '@/components/ui/lightbox';
import { 
  TrendingUp, Heart, GitCompare, ChevronLeft, Calendar, Clock, Users, 
  DollarSign, PieChart, Lock, FileText, Shield, AlertTriangle, Play,
  RotateCcw, ZoomIn, ZoomOut, Maximize2, Image as ImageIcon
} from 'lucide-react';
import { accessRequestsApi } from '@/lib/accessRequestsApi';
import { projectsApi } from '@/lib/projectsApi';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Project, AccessRequestStatus } from '@/types';

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

  // Lightbox for image viewing
  const lightbox = useLightbox();

  // Access request status for this project
  const [accessStatus, setAccessStatus] = useState<AccessRequestStatus | null>(null);
  const [accessNote, setAccessNote] = useState<string | undefined>();

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
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmittingAccess(false);
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

  const canInvest = user?.isVerified && user?.role === 'INVESTOR' && project.status === 'APPROVED' && project.remainingShares > 0;
  const canRequestAccess = user?.isVerified && user?.role === 'INVESTOR' && project.hasRestrictedFields && !accessStatus;
  const isAdmin = user?.role === 'ADMIN';
  const hasAccess = accessStatus === 'APPROVED' || isAdmin;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <TrendingUp className="h-7 w-7 text-accent" />
            <span className="text-xl font-display font-bold">CrowdFund</span>
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <Link to="/app"><Button variant="outline">Dashboard</Button></Link>
            ) : (
              <>
                <Link to="/auth/login"><Button variant="outline">Sign In</Button></Link>
                <Link to="/auth/register"><Button variant="highlight">Get Started</Button></Link>
              </>
            )}
          </div>
        </div>
      </nav>

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
          <div className="lg:col-span-2 space-y-6">
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
                    <img src={project.thumbnailUrl} alt={project.title} className="w-full h-full object-cover transition-transform group-hover:scale-[1.02]" />
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
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-display font-bold mb-2">{project.title}</h1>
                  <p className="text-muted-foreground">by {project.developerName}</p>
                </div>
                {user?.role === 'INVESTOR' && (
                  <div className="flex gap-2">
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
                <TabsList className="w-full justify-start overflow-x-auto">
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
                      <p className="text-muted-foreground leading-relaxed">{project.description}</p>
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
                        <div className="flex items-center justify-between text-sm">
                          <div>
                            <p className="text-muted-foreground">Start Date</p>
                            <p className="font-medium">{new Date(project.startDate).toLocaleDateString()}</p>
                          </div>
                          <div className="flex-1 mx-8 h-2 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-accent" style={{ width: `${100 - ((project.daysRemaining || 0) / project.durationDays * 100)}%` }} />
                          </div>
                          <div className="text-right">
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
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {project.images.map((img, i) => (
                            <button 
                              key={i} 
                              onClick={() => lightbox.openLightbox(project.images, i)} 
                              className="aspect-video rounded-lg overflow-hidden hover:opacity-90 transition-opacity group relative"
                            >
                              <img src={img} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
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
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
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
                                <p className="text-sm text-muted-foreground">{project.restrictedFields.financialProjections}</p>
                              </div>
                            )}
                            {project.restrictedFields?.businessPlan && (
                              <div className="p-4 rounded-lg bg-muted/50">
                                <h4 className="font-semibold mb-2 flex items-center gap-2"><FileText className="h-4 w-4" /> Business Plan</h4>
                                <p className="text-sm text-muted-foreground">{project.restrictedFields.businessPlan}</p>
                              </div>
                            )}
                            {project.restrictedFields?.riskAssessment && (
                              <div className="p-4 rounded-lg bg-muted/50">
                                <h4 className="font-semibold mb-2 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Risk Assessment</h4>
                                <p className="text-sm text-muted-foreground">{project.restrictedFields.riskAssessment}</p>
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
          <div className="lg:col-span-1">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="sticky top-24">
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
                  ) : project.remainingShares === 0 ? (
                    <div className="p-4 rounded-lg bg-muted text-center">
                      <p className="font-semibold">Fully Funded!</p>
                      <p className="text-sm text-muted-foreground">This project has reached its goal</p>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-4">
                      <Link to={`/app/investor/projects/${project.id}/invest`}>
                        <Button variant="highlight" className="w-full" size="lg">
                          Invest Now
                        </Button>
                      </Link>
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

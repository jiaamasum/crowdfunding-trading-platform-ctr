import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Money, SharesProgress } from '@/components/ui/money';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ChevronLeft, CheckCircle, XCircle, AlertCircle, Calendar, Clock, 
  DollarSign, Users, FileText, Lock, Image as ImageIcon, Building2
} from 'lucide-react';
import { projectsApi } from '@/lib/projectsApi';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import type { Project } from '@/types';

type DecisionType = 'approve' | 'reject' | 'needs_changes';

export default function ProjectReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [decisionType, setDecisionType] = useState<DecisionType | null>(null);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadProject = async () => {
      setLoading(true);
      const found = id ? await projectsApi.getById(id) : null;
      setProject(found || null);
      setLoading(false);
    };
    loadProject();
  }, [id]);

  const handleDecision = async () => {
    if (!project || !decisionType || !note.trim()) {
      toast({ title: 'Please add a note', variant: 'destructive' });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const action = decisionType === 'approve' ? 'approve' : decisionType === 'reject' ? 'reject' : 'request_changes';
      await apiClient.post(`/projects/${project.id}/review/`, {
        action,
        review_note: note,
      });
    } catch (error) {
      toast({
        title: 'Review failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }
    
    toast({
      title: `Project ${decisionType === 'approve' ? 'Approved' : decisionType === 'reject' ? 'Rejected' : 'Sent for Changes'}`,
      description: `${project.title} has been ${decisionType === 'approve' ? 'approved and is now live' : decisionType === 'reject' ? 'rejected' : 'sent back for changes'}.`,
    });
    
    setIsSubmitting(false);
    navigate('/app/admin/projects/review-queue');
  };

  const getDecisionConfig = (type: DecisionType) => {
    switch (type) {
      case 'approve':
        return { title: 'Approve', icon: CheckCircle, color: 'text-success', bgColor: 'bg-success hover:bg-success/90' };
      case 'reject':
        return { title: 'Reject', icon: XCircle, color: 'text-destructive', bgColor: 'bg-destructive hover:bg-destructive/90' };
      case 'needs_changes':
        return { title: 'Request Changes', icon: AlertCircle, color: 'text-warning', bgColor: 'bg-warning hover:bg-warning/90' };
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="h-96 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Project not found</p>
        <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-display font-bold">Review Project</h1>
          <p className="text-muted-foreground mt-1">Review submission details and make a decision</p>
        </div>
        <StatusBadge status={project.status} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Overview */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <div className="aspect-video rounded-t-lg overflow-hidden bg-muted">
                {project.thumbnailUrl ? (
                  <img src={project.thumbnailUrl} alt={project.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <h2 className="text-2xl font-bold">{project.title}</h2>
                  <p className="text-muted-foreground">by {project.developerName}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge>{project.category}</Badge>
                  {project.hasRestrictedFields && (
                    <Badge variant="outline" className="gap-1">
                      <Lock className="h-3 w-3" /> Has Restricted Data
                    </Badge>
                  )}
                  {project.has3DModel && (
                    <Badge variant="outline">3D Model</Badge>
                  )}
                </div>
                <p className="text-muted-foreground">{project.description}</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Tabs */}
          <Tabs defaultValue="financials">
            <TabsList>
              <TabsTrigger value="financials">Financials</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              {project.hasRestrictedFields && (
                <TabsTrigger value="restricted">Restricted Data</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="financials" className="mt-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                      <DollarSign className="h-4 w-4" /> Total Value
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Money amount={project.totalValue} className="text-2xl font-bold" />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Per Share Price</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Money amount={project.perSharePrice} className="text-2xl font-bold text-accent" />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Total Shares</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{project.totalShares.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                      <Users className="h-4 w-4" /> Min Share Purchase
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">1 share</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="mt-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" /> Duration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{project.durationDays} days</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" /> Submitted
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-medium">
                      {project.submittedAt ? new Date(project.submittedAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="media" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Project Images</CardTitle>
                </CardHeader>
                <CardContent>
                  {project.images.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {project.images.map((img, i) => (
                        <div key={i} className="aspect-video rounded-lg overflow-hidden">
                          <img src={img} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No additional images</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {project.hasRestrictedFields && (
              <TabsContent value="restricted" className="mt-6 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="h-5 w-5" /> Restricted Information
                    </CardTitle>
                    <CardDescription>Only visible to approved investors</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {project.restrictedFields?.financialProjections && (
                      <div>
                        <Label className="text-muted-foreground">Financial Projections</Label>
                        <p className="mt-1">{project.restrictedFields.financialProjections}</p>
                      </div>
                    )}
                    {project.restrictedFields?.businessPlan && (
                      <div>
                        <Label className="text-muted-foreground">Business Plan</Label>
                        <p className="mt-1">{project.restrictedFields.businessPlan}</p>
                      </div>
                    )}
                    {project.restrictedFields?.teamDetails && (
                      <div>
                        <Label className="text-muted-foreground">Team Details</Label>
                        <p className="mt-1">{project.restrictedFields.teamDetails}</p>
                      </div>
                    )}
                    {project.restrictedFields?.riskAssessment && (
                      <div>
                        <Label className="text-muted-foreground">Risk Assessment</Label>
                        <p className="mt-1">{project.restrictedFields.riskAssessment}</p>
                      </div>
                    )}
                    {!project.restrictedFields && (
                      <p className="text-muted-foreground text-center py-4">No restricted data provided</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* Decision Sidebar */}
        <div className="space-y-6">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Make Decision</CardTitle>
              <CardDescription>Review the project and make your decision</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Decision Buttons */}
              <div className="space-y-2">
                <Button 
                  variant={decisionType === 'approve' ? 'default' : 'outline'} 
                  className={`w-full justify-start gap-2 ${decisionType === 'approve' ? 'bg-success hover:bg-success/90' : ''}`}
                  onClick={() => setDecisionType('approve')}
                >
                  <CheckCircle className="h-4 w-4" /> Approve Project
                </Button>
                <Button 
                  variant={decisionType === 'needs_changes' ? 'default' : 'outline'} 
                  className={`w-full justify-start gap-2 ${decisionType === 'needs_changes' ? 'bg-warning hover:bg-warning/90' : ''}`}
                  onClick={() => setDecisionType('needs_changes')}
                >
                  <AlertCircle className="h-4 w-4" /> Request Changes
                </Button>
                <Button 
                  variant={decisionType === 'reject' ? 'default' : 'outline'} 
                  className={`w-full justify-start gap-2 ${decisionType === 'reject' ? 'bg-destructive hover:bg-destructive/90' : ''}`}
                  onClick={() => setDecisionType('reject')}
                >
                  <XCircle className="h-4 w-4" /> Reject Project
                </Button>
              </div>

              {decisionType && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label>
                      {decisionType === 'approve' && 'Approval Note'}
                      {decisionType === 'needs_changes' && 'Required Changes'}
                      {decisionType === 'reject' && 'Rejection Reason'}
                    </Label>
                    <Textarea 
                      placeholder={
                        decisionType === 'approve' ? 'Add any notes about the approval...'
                        : decisionType === 'needs_changes' ? 'Describe what changes are needed...'
                        : 'Explain why this project is being rejected...'
                      }
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="min-h-[120px]"
                    />
                  </div>
                  <Button 
                    onClick={handleDecision} 
                    disabled={!note.trim() || isSubmitting}
                    className={`w-full ${getDecisionConfig(decisionType).bgColor}`}
                  >
                    {isSubmitting ? 'Submitting...' : `Confirm ${getDecisionConfig(decisionType).title}`}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

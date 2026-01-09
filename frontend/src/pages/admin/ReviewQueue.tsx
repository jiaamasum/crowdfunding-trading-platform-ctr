import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Money } from '@/components/ui/money';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileCheck,
  Clock
} from 'lucide-react';
import { projectsApi } from '@/lib/projectsApi';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import type { Project, ProjectEditRequest, ProjectArchiveRequest } from '@/types';
import { MediaImage } from '@/components/common/MediaImage';

type DecisionType = 'approve' | 'reject' | 'needs_changes';

export default function ReviewQueue() {
  const { toast } = useToast();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [decisionType, setDecisionType] = useState<DecisionType | null>(null);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [editRequests, setEditRequests] = useState<ProjectEditRequest[]>([]);
  const [archiveRequests, setArchiveRequests] = useState<ProjectArchiveRequest[]>([]);
  const [selectedArchiveRequest, setSelectedArchiveRequest] = useState<ProjectArchiveRequest | null>(null);
  const [archiveDecisionType, setArchiveDecisionType] = useState<'approve' | 'reject' | null>(null);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const [data, editData] = await Promise.all([
          projectsApi.getAll(),
          projectsApi.listEditRequests(),
        ]);
        setProjects(data);
        setEditRequests(editData.map((item) => ({
          id: String(item.id),
          projectId: String(item.project),
          projectTitle: item.project_title || '',
          requestedBy: String(item.requested_by),
          requestedByName: item.requested_by_name || '',
          changes: item.changes || {},
          status: item.status,
          reviewNote: item.review_note || undefined,
          createdAt: item.created_at || new Date().toISOString(),
          reviewedAt: item.reviewed_at || undefined,
          reviewedBy: item.reviewed_by ? String(item.reviewed_by) : undefined,
        })));
        const archiveData = await projectsApi.listArchiveRequests();
        setArchiveRequests(archiveData);
      } catch (error) {
        toast({
          title: 'Failed to load projects',
          description: error instanceof Error ? error.message : 'Please try again.',
          variant: 'destructive',
        });
      }
    };

    loadProjects();
  }, [toast]);

  const pendingProjects = projects.filter(p => p.status === 'PENDING_REVIEW');
  const reviewedProjects = projects.filter(p => ['APPROVED', 'REJECTED', 'NEEDS_CHANGES'].includes(p.status));
  const pendingEditRequests = editRequests.filter(req => req.status === 'PENDING');
  const reviewedEditRequests = editRequests.filter(req => req.status !== 'PENDING');
  const pendingArchiveRequests = archiveRequests.filter(req => req.status === 'PENDING');
  const reviewedArchiveRequests = archiveRequests.filter(req => req.status !== 'PENDING');

  const getPreviewImage = (project: Project) =>
    project.thumbnailUrl || project.images?.[0] || '';

  const handleDecision = async () => {
    if (!selectedProject || !decisionType || !note.trim()) return;

    setIsSubmitting(true);
    try {
      const action = decisionType === 'approve' ? 'approve' : decisionType === 'reject' ? 'reject' : 'request_changes';
      const response = await apiClient.post(`/projects/${selectedProject.id}/review/`, {
        action,
        review_note: note,
      });

      const updated = response.data;
      setProjects((prev) => prev.map((p) => (String(p.id) === String(updated.id) ? { ...p, status: updated.status, reviewNote: updated.review_note, reviewedAt: updated.reviewed_at } : p)));
    } catch (error) {
      toast({
        title: 'Review failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(false);

    toast({
      title: `Project ${decisionType === 'approve' ? 'Approved' : decisionType === 'reject' ? 'Rejected' : 'Sent for Changes'}`,
      description: `${selectedProject.title} has been ${decisionType === 'approve' ? 'approved and is now live' : decisionType === 'reject' ? 'rejected' : 'sent back for changes'}.`,
    });

    setSelectedProject(null);
    setDecisionType(null);
    setNote('');
  };

  const handleArchiveDecision = async (request: ProjectArchiveRequest, action: 'approve' | 'reject') => {
    try {
      const updated = await projectsApi.reviewArchiveRequest(request.id, action);
      setArchiveRequests((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      toast({
        title: `Archive request ${action === 'approve' ? 'approved' : 'rejected'}`,
        description: `${request.projectTitle} was ${action === 'approve' ? 'archived' : 'left active'}.`,
      });
    } catch (error) {
      toast({
        title: 'Archive review failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getDecisionConfig = (type: DecisionType) => {
    switch (type) {
      case 'approve':
        return { title: 'Approve Project', icon: CheckCircle, color: 'text-success', btnColor: 'bg-success hover:bg-success/90' };
      case 'reject':
        return { title: 'Reject Project', icon: XCircle, color: 'text-destructive', btnColor: 'bg-destructive hover:bg-destructive/90' };
      case 'needs_changes':
        return { title: 'Request Changes', icon: AlertCircle, color: 'text-warning', btnColor: 'bg-warning hover:bg-warning/90' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold">Project Requests</h1>
        <p className="text-muted-foreground mt-1">Review project submissions and edit requests</p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" /> Pending ({pendingProjects.length + pendingEditRequests.length + pendingArchiveRequests.length})
          </TabsTrigger>
          <TabsTrigger value="reviewed" className="gap-2">
            <FileCheck className="h-4 w-4" /> Reviewed ({reviewedProjects.length + reviewedEditRequests.length + reviewedArchiveRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <div className="space-y-6">
            {pendingProjects.length === 0 ? (
              <EmptyState
                icon={<FileCheck className="h-12 w-12" />}
                title="No pending project submissions"
                description="All project submissions have been reviewed"
              />
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Developer</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Shares</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingProjects.map((project, index) => (
                      <motion.tr
                        key={project.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {getPreviewImage(project) ? (
                              <MediaImage
                                src={getPreviewImage(project)}
                                alt={project.title}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">
                                No image
                              </div>
                            )}
                            <div>
                              <p className="font-medium line-clamp-1">{project.title}</p>
                              <p className="text-xs text-muted-foreground">{project.category}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{project.developerName}</TableCell>
                        <TableCell><Money amount={project.totalValue} /></TableCell>
                        <TableCell>{project.totalShares.toLocaleString()}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {project.submittedAt ? new Date(project.submittedAt).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Link to={`/app/admin/projects/${project.id}/review`}>
                              <Button variant="outline" size="sm" className="gap-1">
                                <Eye className="h-4 w-4" /> Review
                              </Button>
                            </Link>
                            <Button
                              variant="default"
                              size="sm"
                              className="gap-1 bg-success hover:bg-success/90"
                              onClick={() => { setSelectedProject(project); setDecisionType('approve'); }}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 text-warning border-warning hover:bg-warning/10"
                              onClick={() => { setSelectedProject(project); setDecisionType('needs_changes'); }}
                            >
                              <AlertCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 text-destructive border-destructive hover:bg-destructive/10"
                              onClick={() => { setSelectedProject(project); setDecisionType('reject'); }}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}

            {pendingEditRequests.length === 0 ? (
              <EmptyState
                icon={<FileCheck className="h-12 w-12" />}
                title="No pending edit requests"
                description="All project edit requests have been reviewed"
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Pending Edit Requests</CardTitle>
                </CardHeader>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Developer</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingEditRequests.map((req) => (
                      <TableRow key={req.id}>
                        <TableCell>{req.projectTitle}</TableCell>
                        <TableCell>{req.requestedByName}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Link to={`/app/admin/projects/edit-requests/${req.id}`}>
                            <Button variant="outline" size="sm" className="gap-1">
                              <Eye className="h-4 w-4" /> Review
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}

            {pendingArchiveRequests.length === 0 ? (
              <EmptyState
                icon={<FileCheck className="h-12 w-12" />}
                title="No pending archive requests"
                description="All project archive requests have been reviewed"
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Pending Archive Requests</CardTitle>
                </CardHeader>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Developer</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingArchiveRequests.map((req) => (
                      <TableRow key={req.id}>
                        <TableCell>{req.projectTitle}</TableCell>
                        <TableCell>{req.requestedByName}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              className="gap-1 bg-success hover:bg-success/90"
                              onClick={() => { setSelectedArchiveRequest(req); setArchiveDecisionType('approve'); }}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 text-destructive border-destructive hover:bg-destructive/10"
                              onClick={() => { setSelectedArchiveRequest(req); setArchiveDecisionType('reject'); }}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="reviewed" className="mt-6">
          <div className="space-y-6">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Developer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reviewed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviewedProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {getPreviewImage(project) ? (
                            <MediaImage
                              src={getPreviewImage(project)}
                              alt={project.title}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-[10px] text-muted-foreground">
                              No image
                            </div>
                          )}
                          <span className="font-medium">{project.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>{project.developerName}</TableCell>
                      <TableCell><StatusBadge status={project.status} /></TableCell>
                      <TableCell className="text-muted-foreground">
                        {project.reviewedAt ? new Date(project.reviewedAt).toLocaleDateString() : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reviewed Edit Requests</CardTitle>
              </CardHeader>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Developer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reviewed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviewedEditRequests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell>{req.projectTitle}</TableCell>
                      <TableCell>{req.requestedByName}</TableCell>
                      <TableCell><StatusBadge status={req.status} /></TableCell>
                      <TableCell className="text-muted-foreground">
                        {req.reviewedAt ? new Date(req.reviewedAt).toLocaleDateString() : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reviewed Archive Requests</CardTitle>
              </CardHeader>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Developer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reviewed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviewedArchiveRequests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell>{req.projectTitle}</TableCell>
                      <TableCell>{req.requestedByName}</TableCell>
                      <TableCell><StatusBadge status={req.status} /></TableCell>
                      <TableCell className="text-muted-foreground">
                        {req.reviewedAt ? new Date(req.reviewedAt).toLocaleDateString() : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Decision Dialog */}
      <Dialog open={!!selectedProject && !!decisionType} onOpenChange={() => { setSelectedProject(null); setDecisionType(null); setNote(''); }}>
        <DialogContent>
          {selectedProject && decisionType && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {(() => {
                    const config = getDecisionConfig(decisionType);
                    return (
                      <>
                        <config.icon className={`h-5 w-5 ${config.color}`} />
                        {config.title}
                      </>
                    );
                  })()}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                  {getPreviewImage(selectedProject) ? (
                    <MediaImage
                      src={getPreviewImage(selectedProject)}
                      alt={selectedProject.title}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-background flex items-center justify-center text-xs text-muted-foreground">
                      No image
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{selectedProject.title}</p>
                    <p className="text-sm text-muted-foreground">{selectedProject.developerName}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Decision Note (Required)</Label>
                  <Textarea
                    placeholder={decisionType === 'approve'
                      ? 'Add any notes about the approval...'
                      : decisionType === 'reject'
                        ? 'Explain why this project is being rejected...'
                        : 'Describe what changes are needed...'}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setSelectedProject(null); setDecisionType(null); setNote(''); }}>
                  Cancel
                </Button>
                <Button
                  onClick={handleDecision}
                  disabled={!note.trim() || isSubmitting}
                  className={getDecisionConfig(decisionType).btnColor}
                >
                  {isSubmitting ? 'Submitting...' : 'Confirm Decision'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Archive Decision Dialog */}
      <Dialog open={!!selectedArchiveRequest && !!archiveDecisionType} onOpenChange={() => { setSelectedArchiveRequest(null); setArchiveDecisionType(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              Are you sure?
            </DialogTitle>
          </DialogHeader>

          <div className="py-6">
            {archiveDecisionType === 'approve' && (
              <div className="p-4 rounded-lg bg-warning/10 border border-warning/20 mb-4">
                <p className="text-sm font-medium text-black flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  Wait! This action has financial implications.
                </p>
              </div>
            )}

            <p className="text-muted-foreground mb-4">
              You are about to <span className="font-medium text-foreground">{archiveDecisionType === 'approve' ? 'approve' : 'reject'}</span> the archive request for <span className="font-medium text-foreground">{selectedArchiveRequest?.projectTitle}</span>.
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <div className="h-1.5 w-1.5 rounded-full bg-foreground mt-2 shrink-0" />
                <p>{archiveDecisionType === 'approve' ? 'The project status will be updated immediately.' : 'The project will remain active.'}</p>
              </div>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <div className="h-1.5 w-1.5 rounded-full bg-foreground mt-2 shrink-0" />
                <p>Investors will be notified of the decision.</p>
              </div>
              {archiveDecisionType === 'approve' && (
                <div className="flex items-start gap-2 text-sm font-medium text-destructive">
                  <div className="h-1.5 w-1.5 rounded-full bg-current mt-2 shrink-0" />
                  <p>IMPORTANT: Any held funds will be automatically refunded to investors.</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setSelectedArchiveRequest(null); setArchiveDecisionType(null); }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedArchiveRequest && archiveDecisionType) {
                  handleArchiveDecision(selectedArchiveRequest, archiveDecisionType);
                  setSelectedArchiveRequest(null);
                  setArchiveDecisionType(null);
                }
              }}
              className={archiveDecisionType === 'approve' ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary hover:bg-primary/90'}
            >
              {archiveDecisionType === 'approve' ? 'Yes, Archive & Refund' : 'Yes, Reject Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Money } from '@/components/ui/money';
import { StatusBadge } from '@/components/ui/status-badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft } from 'lucide-react';
import { projectsApi } from '@/lib/projectsApi';
import { useToast } from '@/hooks/use-toast';
import { MediaImage } from '@/components/common/MediaImage';
import type { Project, ProjectEditRequest } from '@/types';

type ChangeMap = Record<string, unknown>;

const formatBoolean = (value: unknown) => (value ? 'Yes' : 'No');

const getChangeValue = (changes: ChangeMap, key: string) =>
  Object.prototype.hasOwnProperty.call(changes, key) ? changes[key] : undefined;

const isChanged = (changes: ChangeMap, key: string) =>
  Object.prototype.hasOwnProperty.call(changes, key);

const normalizeNumber = (value: unknown) => {
  if (value === null || value === undefined || value === '') return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const renderText = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
};

const renderImageList = (images?: string[]) => {
  if (!images || images.length === 0) return <span className="text-muted-foreground text-sm">No images</span>;
  return (
    <div className="flex flex-wrap gap-2">
      {images.map((src, index) => (
        <MediaImage
          key={`${src}-${index}`}
          src={src}
          alt={`Project image ${index + 1}`}
          className="h-16 w-20 rounded-md object-cover border"
        />
      ))}
    </div>
  );
};

export default function ProjectEditRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [editRequest, setEditRequest] = useState<ProjectEditRequest | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadRequest = async () => {
      if (!id) return;
      try {
        const data = await projectsApi.getEditRequest(id);
        const mapped: ProjectEditRequest = {
          id: String(data.id),
          projectId: String(data.project),
          projectTitle: data.project_title || '',
          requestedBy: String(data.requested_by),
          requestedByName: data.requested_by_name || '',
          changes: data.changes || {},
          status: data.status,
          reviewNote: data.review_note || undefined,
          createdAt: data.created_at || new Date().toISOString(),
          reviewedAt: data.reviewed_at || undefined,
          reviewedBy: data.reviewed_by ? String(data.reviewed_by) : undefined,
        };
        setEditRequest(mapped);
        const projectData = await projectsApi.getById(mapped.projectId);
        setProject(projectData);
      } catch (error) {
        toast({
          title: 'Failed to load edit request',
          description: error instanceof Error ? error.message : 'Please try again.',
          variant: 'destructive',
        });
      }
    };

    loadRequest();
  }, [id, toast]);

  const changes = editRequest?.changes || {};

  const fieldGroups = useMemo(() => ([
    {
      title: 'Basic Information',
      keys: ['title', 'short_description', 'description', 'category'],
    },
    {
      title: 'Financial Details',
      keys: ['total_value', 'total_shares', 'duration_days'],
    },
    {
      title: 'Media',
      keys: ['thumbnail_url', 'images', 'has_3d_model', 'model_3d_url', 'is_3d_public'],
    },
    {
      title: 'Restricted Fields',
      keys: ['has_restricted_fields', 'financial_projections', 'business_plan', 'team_details', 'legal_documents', 'risk_assessment'],
    },
  ]), []);

  const currentValueFor = (key: string) => {
    if (!project) return undefined;
    switch (key) {
      case 'title':
        return project.title;
      case 'short_description':
        return project.shortDescription;
      case 'description':
        return project.description;
      case 'category':
        return project.category;
      case 'total_value':
        return project.totalValue;
      case 'total_shares':
        return project.totalShares;
      case 'duration_days':
        return project.durationDays;
      case 'thumbnail_url':
        return project.thumbnailUrl;
      case 'images':
        return project.images;
      case 'has_3d_model':
        return project.has3DModel;
      case 'model_3d_url':
        return project.model3DUrl;
      case 'is_3d_public':
        return project.is3DPublic;
      case 'has_restricted_fields':
        return project.hasRestrictedFields;
      case 'financial_projections':
        return project.restrictedFields?.financialProjections;
      case 'business_plan':
        return project.restrictedFields?.businessPlan;
      case 'team_details':
        return project.restrictedFields?.teamDetails;
      case 'legal_documents':
        return project.restrictedFields?.legalDocuments;
      case 'risk_assessment':
        return project.restrictedFields?.riskAssessment;
      default:
        return undefined;
    }
  };

  const formatValue = (key: string, value: unknown) => {
    if (key === 'total_value') {
      const amount = normalizeNumber(value);
      return amount !== undefined ? <Money amount={amount} className="font-semibold" /> : '—';
    }
    if (key === 'total_shares' || key === 'duration_days') {
      const amount = normalizeNumber(value);
      return amount !== undefined ? amount.toLocaleString() : '—';
    }
    if (key === 'has_3d_model' || key === 'is_3d_public' || key === 'has_restricted_fields') {
      return formatBoolean(value);
    }
    if (key === 'thumbnail_url') {
      return value ? (
        <MediaImage src={String(value)} alt="Thumbnail" className="h-16 w-24 rounded-md object-cover border" />
      ) : (
        <span className="text-muted-foreground text-sm">No thumbnail</span>
      );
    }
    if (key === 'images') {
      return renderImageList(Array.isArray(value) ? (value as string[]) : []);
    }
    return renderText(value);
  };

  const handleDecision = async (action: 'approve' | 'reject') => {
    if (!editRequest) return;
    setIsSubmitting(true);
    try {
      await projectsApi.reviewEditRequest(editRequest.id, action, reviewNote || undefined);
      toast({
        title: `Edit request ${action === 'approve' ? 'approved' : 'rejected'}`,
        description: `${editRequest.projectTitle} update has been ${action}d.`,
      });
      navigate('/app/admin/projects/review-queue');
    } catch (error) {
      toast({
        title: 'Review failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!editRequest || !project) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading edit request...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-display font-bold">Edit Request Review</h1>
          <p className="text-muted-foreground mt-1">Review changes for {editRequest.projectTitle}</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Request Summary</CardTitle>
          <Badge variant={editRequest.status === 'PENDING' ? 'secondary' : 'outline'}>
            {editRequest.status}
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Developer</p>
            <p className="font-medium">{editRequest.requestedByName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Submitted</p>
            <p className="font-medium">{new Date(editRequest.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Current Status</p>
            <StatusBadge status={project.status} />
          </div>
        </CardContent>
      </Card>

      {fieldGroups.map((group) => (
        <Card key={group.title}>
          <CardHeader>
            <CardTitle>{group.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48">Field</TableHead>
                  <TableHead>Current</TableHead>
                  <TableHead>Proposed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.keys.map((key) => {
                  const current = currentValueFor(key);
                  const proposedRaw = getChangeValue(changes, key);
                  const proposed = isChanged(changes, key) ? proposedRaw : current;
                  const changed = isChanged(changes, key);
                  return (
                    <TableRow key={key} className={changed ? 'bg-accent/10' : undefined}>
                      <TableCell className="font-medium">{key.replace(/_/g, ' ')}</TableCell>
                      <TableCell>{formatValue(key, current)}</TableCell>
                      <TableCell>{formatValue(key, proposed)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Review Decision</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Admin note (optional)</p>
            <Textarea value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => handleDecision('approve')} disabled={isSubmitting}>
              Approve Changes
            </Button>
            <Button variant="outline" onClick={() => handleDecision('reject')} disabled={isSubmitting}>
              Reject Changes
            </Button>
            <Link to="/app/admin/projects/review-queue">
              <Button variant="ghost" type="button">Back to Requests</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

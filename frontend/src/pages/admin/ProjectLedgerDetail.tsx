import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Money } from '@/components/ui/money';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft } from 'lucide-react';
import { auditLogsApi } from '@/lib/auditLogsApi';
import { projectsApi } from '@/lib/projectsApi';
import { useToast } from '@/hooks/use-toast';
import { Lightbox, useLightbox } from '@/components/ui/lightbox';
import { MediaImage } from '@/components/common/MediaImage';
import type { Project, ProjectLedgerEntry } from '@/types';

const entryLabels: Record<string, string> = {
  PROJECT_CREATED: 'Project created',
  PROJECT_UPDATED: 'Project updated',
  PROJECT_SUBMITTED: 'Project submitted',
  PROJECT_APPROVED: 'Project approved',
  PROJECT_REJECTED: 'Project rejected',
  PROJECT_ARCHIVED: 'Project archived',
  PROJECT_EDIT_REQUESTED: 'Edit request submitted',
  PROJECT_EDIT_APPROVED: 'Edit request approved',
  PROJECT_EDIT_REJECTED: 'Edit request rejected',
  ACCESS_REQUEST_CREATED: 'Access requested',
  ACCESS_REQUEST_APPROVED: 'Access approved',
  ACCESS_REQUEST_REJECTED: 'Access rejected',
  ACCESS_REQUEST_REVOKED: 'Access revoked',
  INVESTMENT_REQUESTED: 'Investment requested',
  INVESTMENT_APPROVED: 'Investment approved',
  INVESTMENT_REJECTED: 'Investment rejected',
  INVESTMENT_PROCESSING: 'Payment received',
  INVESTMENT_COMPLETED: 'Investment completed',
  INVESTMENT_REFUNDED: 'Investment refunded',
  INVESTMENT_WITHDRAWN: 'Investment withdrawn',
  INVESTMENT_REVERSED: 'Investment reversed',
  INVESTMENT_EXPIRED: 'Investment expired',
  INVESTMENT_CANCELLED: 'Investment cancelled',
  PAYMENT_PROCESSED: 'Payment processed',
  PAYMENT_REFUNDED: 'Payment refunded',
  PAYMENT_WITHDRAWN: 'Payment withdrawn',
  PAYMENT_REVERSED: 'Payment reversed',
  USER_BANNED: 'User banned',
};

const entryColors: Record<string, string> = {
  PROJECT_APPROVED: 'bg-success/15 text-success',
  INVESTMENT_COMPLETED: 'bg-success/15 text-success',
  INVESTMENT_REFUNDED: 'bg-destructive/10 text-destructive',
  INVESTMENT_REVERSED: 'bg-destructive/10 text-destructive',
  PROJECT_REJECTED: 'bg-destructive/10 text-destructive',
  ACCESS_REQUEST_REJECTED: 'bg-destructive/10 text-destructive',
  ACCESS_REQUEST_REVOKED: 'bg-warning/10 text-warning',
  INVESTMENT_EXPIRED: 'bg-warning/10 text-warning',
  INVESTMENT_CANCELLED: 'bg-muted text-muted-foreground',
};

const formatScalar = (value: unknown) => {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') return value.toLocaleString();
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const formatMetadataValue = (key: string, value: unknown) => {
  if (value === null || value === undefined) return '—';
  if (key === 'changes' && typeof value === 'object' && !Array.isArray(value)) {
    const changes = Object.entries(value as Record<string, any>);
    if (changes.length === 0) return '—';
    return (
      <div className="space-y-2">
        {changes.map(([field, change]) => {
          const changeObj = typeof change === 'object' && change !== null && !Array.isArray(change)
            ? change as Record<string, unknown>
            : null;
          const fromValue = changeObj ? changeObj.from : undefined;
          const toValue = changeObj ? changeObj.to : undefined;
          const displayValue = changeObj ? `${formatScalar(fromValue)} -> ${formatScalar(toValue)}` : formatScalar(change);
          return (
            <div key={field} className="text-sm">
              <span className="font-medium">{field.replace(/_/g, ' ')}</span>
              <span className="text-muted-foreground">: {displayValue}</span>
            </div>
          );
        })}
      </div>
    );
  }
  if (key.includes('amount')) {
    const amount = Number(value);
    if (!Number.isNaN(amount)) {
      return <Money amount={amount} className="font-semibold" />;
    }
  }
  if ((key.includes('date') || key.endsWith('_at')) && typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleString();
    }
  }
  return formatScalar(value);
};

export default function ProjectLedgerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const lightbox = useLightbox();
  const [project, setProject] = useState<Project | null>(null);
  const [entries, setEntries] = useState<ProjectLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editRequestChanges, setEditRequestChanges] = useState<Record<string, Record<string, unknown>>>({});

  useEffect(() => {
    const loadLedger = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [projectData, ledgerData] = await Promise.all([
          projectsApi.getById(id),
          auditLogsApi.listLedger({ project: id }),
        ]);
        setProject(projectData);
        const sorted = [...ledgerData].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        setEntries(sorted);
      } catch (error) {
        toast({
          title: 'Failed to load project ledger',
          description: error instanceof Error ? error.message : 'Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadLedger();
  }, [id, toast]);

  useEffect(() => {
    const missingEditRequests = entries
      .map((entry) => entry.metadata?.edit_request_id)
      .filter((value): value is string => Boolean(value))
      .filter((editRequestId) => !editRequestChanges[String(editRequestId)]);

    if (missingEditRequests.length === 0) return;

    const loadEditRequests = async () => {
      try {
        const uniqueIds = Array.from(new Set(missingEditRequests.map((id) => String(id))));
        const results = await Promise.all(uniqueIds.map((editRequestId) => projectsApi.getEditRequest(editRequestId)));
        const changesMap: Record<string, Record<string, unknown>> = {};
        results.forEach((item) => {
          if (item?.id && item?.changes && typeof item.changes === 'object') {
            changesMap[String(item.id)] = item.changes as Record<string, unknown>;
          }
        });
        setEditRequestChanges((prev) => ({ ...prev, ...changesMap }));
      } catch (error) {
        console.error('Failed to load edit request details', error);
      }
    };

    loadEditRequests();
  }, [entries, editRequestChanges]);

  const renderChangeValue = (field: string, value: unknown) => {
    if (value === null || value === undefined) return '—';
    const changeObj = typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
    const resolvedValue = changeObj && 'to' in changeObj ? changeObj.to : value;

    if (field === 'images' && Array.isArray(resolvedValue)) {
      const images = resolvedValue
        .map((item) => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object' && 'image_url' in item) {
            return String((item as { image_url?: string }).image_url || '');
          }
          return String(item);
        })
        .filter(Boolean);
      if (images.length === 0) return 'No images';
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {images.map((imageUrl, index) => (
            <button
              key={`${field}-${index}`}
              type="button"
              onClick={() => lightbox.openLightbox(images, index)}
              className="rounded-md overflow-hidden border border-border/60 bg-muted"
            >
              <MediaImage src={String(imageUrl)} alt="Updated image" className="h-16 w-full object-cover" />
            </button>
          ))}
        </div>
      );
    }
    if (field === 'thumbnail_url' && typeof resolvedValue === 'string') {
      return (
        <button
          type="button"
          onClick={() => lightbox.openLightbox([resolvedValue], 0)}
          className="rounded-md overflow-hidden border border-border/60 bg-muted"
        >
          <MediaImage src={resolvedValue} alt="Updated thumbnail" className="h-20 w-full object-cover" />
        </button>
      );
    }
    if (changeObj) {
      if ('from' in changeObj || 'to' in changeObj) {
        const fromValue = formatScalar(changeObj.from);
        const toValue = formatScalar(changeObj.to);
        return `${fromValue} -> ${toValue}`;
      }
    }
    return formatScalar(resolvedValue);
  };

  const timeline = useMemo(() => entries.map((entry) => {
    const label = entryLabels[entry.entryType] || entry.entryType.replace(/_/g, ' ');
    const badgeClass = entryColors[entry.entryType] || 'bg-muted text-muted-foreground';
    const metadataEntries = Object.entries(entry.metadata || {}).filter(([key]) => key !== 'changes');
    const editRequestId = entry.metadata?.edit_request_id ? String(entry.metadata.edit_request_id) : undefined;
    const changes = (entry.metadata?.changes as Record<string, unknown>) || (editRequestId ? editRequestChanges[editRequestId] : undefined);
    return { entry, label, badgeClass, metadataEntries, changes };
  }), [entries, editRequestChanges]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading project ledger...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Project not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/app/admin/projects/ledger')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-display font-bold">Project Timeline</h1>
          <p className="text-muted-foreground mt-1">{project.title}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <StatusBadge status={project.status} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Developer</p>
            <p className="font-medium">{project.developerName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Value</p>
            <Money amount={project.totalValue} className="text-lg font-semibold" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {timeline.length === 0 ? (
            <div className="text-muted-foreground text-sm">No ledger activity available for this project.</div>
          ) : (
            <div className="relative pl-6">
              <div className="absolute left-2 top-0 bottom-0 w-px bg-border" />
              <div className="space-y-6">
                {timeline.map(({ entry, label, badgeClass, metadataEntries, changes }) => (
                  <div key={entry.id} className="relative">
                    <div className="absolute left-0 top-3 h-3 w-3 rounded-full bg-accent ring-2 ring-background" />
                    <div className="rounded-lg border bg-card p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className={badgeClass}>{label}</Badge>
                            {entry.actorName && (
                              <span className="text-xs text-muted-foreground">by {entry.actorName}</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(entry.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">{entry.entryType}</span>
                      </div>

                      {(metadataEntries.length > 0 || changes) && (
                        <>
                          <Separator className="my-3" />
                          <div className="space-y-4">
                            {metadataEntries.length > 0 && (
                              <div className="grid gap-2 sm:grid-cols-2">
                                {metadataEntries.map(([key, value]) => (
                                  <div key={key} className="text-xs text-muted-foreground">
                                    <span className="uppercase tracking-wide text-[10px] text-muted-foreground/70">
                                      {key.replace(/_/g, ' ')}
                                    </span>
                                    <div className="text-sm text-foreground">
                                      {formatMetadataValue(key, value)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            {changes && (
                              <div className="space-y-3">
                                <div className="text-[10px] uppercase tracking-wide text-muted-foreground/70">Changes</div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                  {Object.entries(changes).map(([field, value]) => (
                                    <div key={field} className="text-xs text-muted-foreground">
                                      <span className="uppercase tracking-wide text-[10px] text-muted-foreground/70">
                                        {field.replace(/_/g, ' ')}
                                      </span>
                                      <div className="text-sm text-foreground">
                                        {renderChangeValue(field, value)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Lightbox
        images={lightbox.images}
        initialIndex={lightbox.index}
        open={lightbox.open}
        onOpenChange={lightbox.setOpen}
      />
    </div>
  );
}

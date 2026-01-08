import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { PageContainer } from '@/components/ui/page-container';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Money } from '@/components/ui/money';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/hooks/use-toast';
import { investmentsApi } from '@/lib/investmentsApi';
import { accessRequestsApi, type AccessRequest as ApiAccessRequest } from '@/lib/accessRequestsApi';
import type { Investment, InvestmentStatus } from '@/types';
import { FileText, ShieldCheck } from 'lucide-react';

const REQUEST_STATUSES: InvestmentStatus[] = [
  'REQUESTED',
  'APPROVED',
  'REJECTED',
  'EXPIRED',
  'CANCELLED',
  'PROCESSING',
];

export default function InvestorRequestsPage() {
  const { toast } = useToast();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [accessRequests, setAccessRequests] = useState<ApiAccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokeTarget, setRevokeTarget] = useState<Investment | null>(null);
  const [revokeAccessTarget, setRevokeAccessTarget] = useState<ApiAccessRequest | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  useEffect(() => {
    const loadRequests = async () => {
      setLoading(true);
      try {
        const [investmentData, accessData] = await Promise.all([
          investmentsApi.list(),
          accessRequestsApi.listMine(),
        ]);
        setInvestments(investmentData);
        setAccessRequests(accessData);
      } catch (error) {
        toast({
          title: 'Failed to load requests',
          description: error instanceof Error ? error.message : 'Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, [toast]);

  const investmentRequests = useMemo(() => (
    investments
      .filter((inv) => REQUEST_STATUSES.includes(inv.status))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  ), [investments]);

  const sortedAccessRequests = useMemo(() => (
    [...accessRequests].sort((a, b) => {
      const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bDate - aDate;
    })
  ), [accessRequests]);

  const handleRevokeInvestment = async () => {
    if (!revokeTarget) return;
    setIsRevoking(true);
    try {
      const updated = await investmentsApi.revoke(revokeTarget.id);
      setInvestments((prev) => prev.map((inv) => inv.id === updated.id ? updated : inv));
      toast({
        title: 'Request revoked',
        description: `Your request for ${updated.projectTitle} was cancelled.`,
      });
      setRevokeTarget(null);
    } catch (error) {
      toast({
        title: 'Failed to revoke request',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRevoking(false);
    }
  };

  const handleRevokeAccess = async () => {
    if (!revokeAccessTarget) return;
    setIsRevoking(true);
    try {
      const updated = await accessRequestsApi.revoke(revokeAccessTarget.id);
      setAccessRequests((prev) => prev.map((req) => req.id === updated.id ? updated : req));
      toast({
        title: 'Access request revoked',
        description: `Your access request for ${updated.project_title || 'this project'} was revoked.`,
      });
      setRevokeAccessTarget(null);
    } catch (error) {
      toast({
        title: 'Failed to revoke access request',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <PageContainer title="Requests" description="Track and manage your investment and access requests">
      <Tabs defaultValue="investments">
        <TabsList>
          <TabsTrigger value="investments">Investment Requests</TabsTrigger>
          <TabsTrigger value="access">Access Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="investments" className="mt-6">
          {loading ? (
            <Card className="p-8 text-muted-foreground">Loading requests...</Card>
          ) : investmentRequests.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-12 w-12" />}
              title="No investment requests"
              description="Your investment requests will appear here."
            />
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Shares</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {investmentRequests.map((inv, index) => {
                    const canRevoke = inv.status === 'REQUESTED' || inv.status === 'APPROVED';
                    const expiresAt = inv.approvalExpiresAt ? new Date(inv.approvalExpiresAt).toLocaleDateString() : '—';
                    return (
                      <motion.tr
                        key={inv.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b"
                      >
                        <TableCell className="font-medium">{inv.projectTitle}</TableCell>
                        <TableCell>{inv.shares.toLocaleString()}</TableCell>
                        <TableCell><Money amount={inv.totalAmount} className="font-semibold" /></TableCell>
                        <TableCell><StatusBadge status={inv.status} /></TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(inv.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {inv.status === 'APPROVED' ? expiresAt : '—'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[240px] break-words">
                          <div className="space-y-1">
                            <p>{inv.requestNote || 'No request note'}</p>
                            {inv.adminNote && (
                              <p className="text-foreground/80">Admin: {inv.adminNote}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setRevokeTarget(inv)}
                            disabled={!canRevoke || isRevoking}
                            className={canRevoke ? 'text-destructive' : ''}
                          >
                            Revoke
                          </Button>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="access" className="mt-6">
          {loading ? (
            <Card className="p-8 text-muted-foreground">Loading requests...</Card>
          ) : sortedAccessRequests.length === 0 ? (
            <EmptyState
              icon={<ShieldCheck className="h-12 w-12" />}
              title="No access requests"
              description="Your access requests will appear here."
            />
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAccessRequests.map((req, index) => {
                    const canRevoke = req.status === 'PENDING';
                    return (
                      <motion.tr
                        key={req.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b"
                      >
                        <TableCell className="font-medium">{req.project_title || '—'}</TableCell>
                        <TableCell><StatusBadge status={req.status} /></TableCell>
                        <TableCell className="text-muted-foreground">
                          {req.created_at ? new Date(req.created_at).toLocaleDateString() : '—'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[240px] break-words">
                          <div className="space-y-1">
                            <p>{req.message || 'No request note'}</p>
                            {req.admin_note && (
                              <p className="text-foreground/80">Admin: {req.admin_note}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {canRevoke ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setRevokeAccessTarget(req)}
                              disabled={isRevoking}
                              className="text-destructive"
                            >
                              Revoke
                            </Button>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={!!revokeTarget}
        onOpenChange={(open) => !open && setRevokeTarget(null)}
        title="Revoke investment request?"
        description={`This will cancel your request for ${revokeTarget?.projectTitle || 'this project'}.`}
        confirmLabel="Revoke"
        variant="destructive"
        onConfirm={handleRevokeInvestment}
        isLoading={isRevoking}
      />

      <ConfirmDialog
        open={!!revokeAccessTarget}
        onOpenChange={(open) => !open && setRevokeAccessTarget(null)}
        title="Revoke access request?"
        description={`This will revoke your access request for ${revokeAccessTarget?.project_title || 'this project'}.`}
        confirmLabel="Revoke"
        variant="destructive"
        onConfirm={handleRevokeAccess}
        isLoading={isRevoking}
      />
    </PageContainer>
  );
}

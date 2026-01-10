import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { Money } from '@/components/ui/money';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { investmentsApi } from '@/lib/investmentsApi';
import { projectsApi } from '@/lib/projectsApi';
import type { Investment, Project } from '@/types';
import { ArrowLeft } from 'lucide-react';

export default function InvestmentProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activityFilter, setActivityFilter] = useState('all');
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [approvalTarget, setApprovalTarget] = useState<Investment | null>(null);
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [adminNote, setAdminNote] = useState('');
  const [approvalAck, setApprovalAck] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<Investment | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [rejectAck, setRejectAck] = useState(false);
  const [processingOpen, setProcessingOpen] = useState(false);
  const [processingTarget, setProcessingTarget] = useState<Investment | null>(null);
  const [processingAction, setProcessingAction] = useState<'complete' | 'refund' | null>(null);
  const [processingNote, setProcessingNote] = useState('');
  const [processingAck, setProcessingAck] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);
  const [actionTarget, setActionTarget] = useState<Investment | null>(null);
  const [actionType, setActionType] = useState<'refund' | 'withdraw' | null>(null);
  const [actionNote, setActionNote] = useState('');
  const [actionAck, setActionAck] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      try {
        const [projectData, investmentData] = await Promise.all([
          projectsApi.getById(id),
          investmentsApi.list({ project: id }),
        ]);
        setProject(projectData);
        setInvestments(investmentData);
      } catch (error) {
        console.error('Failed to load project investments', error);
      }
    };
    loadData();
  }, [id]);

  const withdrawnStatuses = new Set(['WITHDRAWN', 'REFUNDED', 'REVERSED']);
  const investedStatuses = new Set(['COMPLETED', 'WITHDRAWN', 'REFUNDED', 'REVERSED']);
  const activeInvestments = investments.filter((inv) => inv.isActive ?? inv.status === 'COMPLETED');
  const withdrawnInvestments = investments.filter((inv) => withdrawnStatuses.has(inv.status));
  const investedInvestments = investments.filter((inv) => investedStatuses.has(inv.status));

  const filteredInvestments = useMemo(() => {
    return investments.filter((inv) => {
      const matchesSearch = inv.investorName.toLowerCase().includes(search.toLowerCase())
        || inv.investorEmail.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
      const isActive = inv.isActive ?? inv.status === 'COMPLETED';
      const matchesActivity = activityFilter === 'all'
        || (activityFilter === 'active' ? isActive : !isActive);
      return matchesSearch && matchesStatus && matchesActivity;
    });
  }, [investments, search, statusFilter, activityFilter]);

  const totalAmount = investedInvestments.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalShares = investedInvestments.reduce((sum, inv) => sum + inv.shares, 0);
  const activeAmount = activeInvestments.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const activeShares = activeInvestments.reduce((sum, inv) => sum + inv.shares, 0);
  const withdrawnAmount = withdrawnInvestments.reduce((sum, inv) => sum + inv.totalAmount, 0);

  const handleApprove = (investment: Investment) => {
    setApprovalTarget(investment);
    setExpiresInDays(7);
    setAdminNote('');
    setApprovalAck(false);
    setApprovalOpen(true);
  };

  const handleApproveSubmit = async () => {
    if (!approvalTarget) return;
    setIsSubmitting(true);
    try {
      const normalizedDays = Math.max(1, expiresInDays || 1);
      const updated = await investmentsApi.review(
        approvalTarget.id,
        'approve',
        normalizedDays,
        adminNote || undefined
      );
      setInvestments((prev) => prev.map((inv) => (inv.id === updated.id ? updated : inv)));
      setApprovalOpen(false);
      setApprovalTarget(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = (investment: Investment) => {
    setRejectTarget(investment);
    setRejectNote('');
    setRejectAck(false);
    setRejectOpen(true);
  };

  const handleRejectSubmit = async () => {
    if (!rejectTarget) return;
    setIsSubmitting(true);
    try {
      const updated = await investmentsApi.review(rejectTarget.id, 'reject', undefined, rejectNote || undefined);
      setInvestments((prev) => prev.map((inv) => (inv.id === updated.id ? updated : inv)));
      setRejectOpen(false);
      setRejectTarget(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProcessingOpen = (investment: Investment, action: 'complete' | 'refund') => {
    setProcessingTarget(investment);
    setProcessingAction(action);
    setProcessingNote('');
    setProcessingAck(false);
    setProcessingOpen(true);
  };

  const handleProcessingSubmit = async () => {
    if (!processingTarget || !processingAction) return;
    setIsSubmitting(true);
    try {
      const updated = processingAction === 'complete'
        ? await investmentsApi.complete(processingTarget.id, processingNote || undefined)
        : await investmentsApi.adminAction(processingTarget.id, 'refund', processingNote || undefined);
      setInvestments((prev) => prev.map((inv) => (inv.id === updated.id ? updated : inv)));
      setProcessingOpen(false);
      setProcessingTarget(null);
      setProcessingAction(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openActionDialog = (investment: Investment, action: 'refund' | 'withdraw') => {
    setActionTarget(investment);
    setActionType(action);
    setActionNote('');
    setActionAck(false);
    setActionOpen(true);
  };

  const handleActionSubmit = async () => {
    if (!actionTarget || !actionType) return;
    setIsSubmitting(true);
    try {
      const updated = await investmentsApi.adminAction(actionTarget.id, actionType, actionNote || undefined);
      setInvestments((prev) => prev.map((inv) => (inv.id === updated.id ? updated : inv)));
      setActionOpen(false);
      setActionTarget(null);
      setActionType(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/app/admin/investments')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-display font-bold">Project Investments</h1>
          <p className="text-muted-foreground mt-1">Detailed investments for this project</p>
        </div>
      </div>

      {project && (
        <Card>
          <CardHeader>
            <CardTitle>{project.title}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            <div>
              <p className="text-sm text-muted-foreground">Total Invested</p>
              <Money amount={totalAmount} className="text-xl font-bold" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Invested</p>
              <Money amount={activeAmount} className="text-xl font-bold" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Withdrawn/Refunded</p>
              <Money amount={withdrawnAmount} className="text-xl font-bold" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Shares</p>
              <p className="text-xl font-bold">{totalShares.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Shares</p>
              <p className="text-xl font-bold">{activeShares.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <StatusBadge status={project.status} />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search investors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="REQUESTED">Requested</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
                <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
                <SelectItem value="REVERSED">Reversed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={activityFilter} onValueChange={setActivityFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Activity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activity</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Investor</TableHead>
                <TableHead>Shares</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvestments.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{inv.investorName}</p>
                      <p className="text-xs text-muted-foreground">{inv.investorEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell>{inv.shares.toLocaleString()}</TableCell>
                  <TableCell><Money amount={inv.totalAmount} className="font-semibold" /></TableCell>
                  <TableCell><StatusBadge status={inv.status} /></TableCell>
                  <TableCell><StatusBadge status={inv.activityStatus || ((inv.isActive ?? inv.status === 'COMPLETED') ? 'ACTIVE' : 'INACTIVE')} /></TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(inv.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                      {inv.status === 'REQUESTED' && (
                        <>
                          <Button size="sm" className="w-full sm:w-auto" onClick={() => handleApprove(inv)}>Approve</Button>
                          <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => handleReject(inv)}>Reject</Button>
                        </>
                      )}
                      {inv.status === 'PROCESSING' && (
                        <>
                          <Button size="sm" className="w-full sm:w-auto" onClick={() => handleProcessingOpen(inv, 'complete')}>Complete</Button>
                          <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => handleProcessingOpen(inv, 'refund')}>Refund</Button>
                        </>
                      )}
                      {inv.status === 'COMPLETED' && (
                        <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => openActionDialog(inv, 'withdraw')}>Withdraw</Button>
                      )}
                      {inv.status === 'APPROVED' && (
                        <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => openActionDialog(inv, 'refund')}>Refund</Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={approvalOpen} onOpenChange={setApprovalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Investment Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="expires">Expires in (days)</Label>
              <Input
                id="expires"
                type="number"
                min={1}
                value={expiresInDays}
                onChange={(event) => setExpiresInDays(Number(event.target.value) || 1)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminNote">Admin note (optional)</Label>
              <Textarea
                id="adminNote"
                value={adminNote}
                onChange={(event) => setAdminNote(event.target.value)}
              />
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-border/60 p-3">
              <Checkbox
                id="approveAck"
                checked={approvalAck}
                onCheckedChange={(checked) => setApprovalAck(checked === true)}
              />
              <Label htmlFor="approveAck" className="text-sm leading-relaxed">
                I have reviewed the investment request and approve this action.
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalOpen(false)}>Cancel</Button>
            <Button onClick={handleApproveSubmit} disabled={!approvalAck || isSubmitting}>
              {isSubmitting ? 'Approving...' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Investment Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejectNote">Description (optional)</Label>
              <Textarea
                id="rejectNote"
                value={rejectNote}
                onChange={(event) => setRejectNote(event.target.value)}
              />
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-border/60 p-3">
              <Checkbox
                id="rejectAck"
                checked={rejectAck}
                onCheckedChange={(checked) => setRejectAck(checked === true)}
              />
              <Label htmlFor="rejectAck" className="text-sm leading-relaxed">
                I have reviewed the investment request and confirm rejection.
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectSubmit} disabled={isSubmitting || !rejectAck}>
              {isSubmitting ? 'Rejecting...' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={processingOpen} onOpenChange={setProcessingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {processingAction === 'refund' ? 'Reject Payment & Refund' : 'Approve Payment'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="processingNote">Description (optional)</Label>
              <Textarea
                id="processingNote"
                value={processingNote}
                onChange={(event) => setProcessingNote(event.target.value)}
              />
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-border/60 p-3">
              <Checkbox
                id="processingAck"
                checked={processingAck}
                onCheckedChange={(checked) => setProcessingAck(checked === true)}
              />
              <Label htmlFor="processingAck" className="text-sm leading-relaxed">
                {processingAction === 'refund'
                  ? 'I understand this will refund the payment back to the investor.'
                  : 'I have reviewed this payment and approve completing the investment.'}
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProcessingOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant={processingAction === 'refund' ? 'destructive' : 'default'}
              onClick={handleProcessingSubmit}
              disabled={isSubmitting || !processingAck}
            >
              {isSubmitting ? 'Submitting...' : processingAction === 'refund' ? 'Reject & Refund' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={actionOpen} onOpenChange={setActionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'refund' ? 'Refund investment' : 'Withdraw investment'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="actionNote">Description (optional)</Label>
              <Textarea
                id="actionNote"
                value={actionNote}
                onChange={(event) => setActionNote(event.target.value)}
              />
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-border/60 p-3">
              <Checkbox
                id="actionAck"
                checked={actionAck}
                onCheckedChange={(checked) => setActionAck(checked === true)}
              />
              <Label htmlFor="actionAck" className="text-sm leading-relaxed">
                {actionType === 'refund'
                  ? 'I understand this will refund the investment back to the investor.'
                  : 'I understand this will withdraw the investment funds to the investor wallet.'}
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant={actionType === 'refund' ? 'destructive' : 'default'}
              onClick={handleActionSubmit}
              disabled={!actionAck || isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : actionType === 'refund' ? 'Refund' : 'Withdraw'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

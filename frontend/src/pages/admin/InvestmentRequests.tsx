import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Money } from '@/components/ui/money';
import { EmptyState } from '@/components/ui/empty-state';
import { Checkbox } from '@/components/ui/checkbox';
import { Search } from 'lucide-react';
import { investmentsApi } from '@/lib/investmentsApi';
import { useToast } from '@/hooks/use-toast';
import type { Investment } from '@/types';
import axios from 'axios';

export default function AdminInvestmentRequests() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [requests, setRequests] = useState<Investment[]>([]);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [approvalTarget, setApprovalTarget] = useState<Investment | null>(null);
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [adminNote, setAdminNote] = useState('');
  const [approvalAck, setApprovalAck] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<Investment | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [rejectAck, setRejectAck] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadRequests = async () => {
      try {
        const data = await investmentsApi.list({ status: 'REQUESTED' });
        setRequests(data);
      } catch (error) {
        toast({
          title: 'Failed to load investment requests',
          description: error instanceof Error ? error.message : 'Please try again.',
          variant: 'destructive',
        });
      }
    };

    loadRequests();
  }, [toast]);

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return requests;
    return requests.filter((inv) =>
      inv.investorName.toLowerCase().includes(query)
      || inv.investorEmail.toLowerCase().includes(query)
      || inv.projectTitle.toLowerCase().includes(query)
    );
  }, [requests, search]);

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
      setRequests((prev) => prev.filter((inv) => inv.id !== updated.id));
      toast({
        title: 'Investment approved',
        description: `${updated.investorName} can now pay for ${updated.projectTitle}.`,
      });
      setApprovalOpen(false);
      setApprovalTarget(null);
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.error || error.response?.data?.detail || error.message)
        : (error instanceof Error ? error.message : 'Please try again.');
      toast({
        title: 'Approval failed',
        description: message,
        variant: 'destructive',
      });
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
      setRequests((prev) => prev.filter((inv) => inv.id !== updated.id));
      toast({
        title: 'Investment rejected',
        description: `${rejectTarget.investorName}'s request was rejected.`,
      });
      setRejectOpen(false);
      setRejectTarget(null);
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.error || error.response?.data?.detail || error.message)
        : (error instanceof Error ? error.message : 'Please try again.');
      toast({
        title: 'Rejection failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">Investment Requests</h1>
        <p className="text-muted-foreground mt-1">Review pending investor requests before payment</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by investor or project..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {filteredRequests.length === 0 ? (
        <EmptyState
          title="No pending requests"
          description="Investment requests will appear here when investors submit them."
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Investor</TableHead>
                <TableHead>Shares</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((inv, index) => (
                <motion.tr
                  key={inv.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="border-b"
                >
                  <TableCell className="font-medium">{inv.projectTitle}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{inv.investorName}</p>
                      <p className="text-xs text-muted-foreground">{inv.investorEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell>{inv.shares.toLocaleString()}</TableCell>
                  <TableCell><Money amount={inv.totalAmount} className="font-semibold" /></TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(inv.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs max-w-[220px] break-words line-clamp-2">
                    {inv.requestNote || '—'}
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Button size="sm" onClick={() => handleApprove(inv)} disabled={isSubmitting}>
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(inv)}
                      disabled={isSubmitting}
                    >
                      Reject
                    </Button>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

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
            <Button variant="outline" onClick={() => setApprovalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleApproveSubmit} disabled={isSubmitting || !approvalAck}>
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
    </div>
  );
}

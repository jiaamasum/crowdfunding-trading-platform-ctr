import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Money } from '@/components/ui/money';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Search } from 'lucide-react';
import { investmentsApi, paymentsApi } from '@/lib/investmentsApi';
import { useToast } from '@/hooks/use-toast';
import type { Investment, Payment } from '@/types';

export default function AdminInvestmentApprovals() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [approveOpen, setApproveOpen] = useState(false);
  const [approveTarget, setApproveTarget] = useState<Investment | null>(null);
  const [approveAck, setApproveAck] = useState(false);
  const [approveNote, setApproveNote] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<Investment | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [rejectAck, setRejectAck] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadProcessing = async () => {
      try {
        const [investmentData, paymentData] = await Promise.all([
          investmentsApi.list({ status: 'PROCESSING' }),
          paymentsApi.list(),
        ]);
        setInvestments(investmentData);
        setPayments(paymentData);
      } catch (error) {
        toast({
          title: 'Failed to load payment approvals',
          description: error instanceof Error ? error.message : 'Please try again.',
          variant: 'destructive',
        });
      }
    };

    loadProcessing();
  }, [toast]);

  const paymentLookup = useMemo(() => {
    const sorted = [...payments].sort((a, b) => {
      const aDate = new Date(a.processedAt || a.createdAt).getTime();
      const bDate = new Date(b.processedAt || b.createdAt).getTime();
      return bDate - aDate;
    });
    const map = new Map<string, Payment>();
    sorted.forEach((payment) => {
      if (!map.has(payment.investmentId)) {
        map.set(payment.investmentId, payment);
      }
    });
    return map;
  }, [payments]);

  const filteredInvestments = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return investments;
    return investments.filter((inv) =>
      inv.investorName.toLowerCase().includes(query)
      || inv.investorEmail.toLowerCase().includes(query)
      || inv.projectTitle.toLowerCase().includes(query)
    );
  }, [investments, search]);

  const handleApprove = (investment: Investment) => {
    setApproveTarget(investment);
    setApproveAck(false);
    setApproveNote('');
    setApproveOpen(true);
  };

  const handleRejectOpen = (investment: Investment) => {
    setRejectTarget(investment);
    setAdminNote('');
    setRejectAck(false);
    setRejectOpen(true);
  };

  const handleApproveSubmit = async () => {
    if (!approveTarget) return;
    setIsSubmitting(true);
    try {
      const updated = await investmentsApi.complete(approveTarget.id, approveNote || undefined);
      setInvestments((prev) => prev.filter((inv) => inv.id !== updated.id));
      toast({
        title: 'Investment approved',
        description: `${approveTarget.investorName}'s payment was approved.`,
      });
      setApproveOpen(false);
      setApproveTarget(null);
    } catch (error) {
      toast({
        title: 'Approval failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectTarget) return;
    setIsSubmitting(true);
    try {
      const updated = await investmentsApi.adminAction(rejectTarget.id, 'refund', adminNote || undefined);
      setInvestments((prev) => prev.filter((inv) => inv.id !== updated.id));
      toast({
        title: 'Payment rejected',
        description: `${rejectTarget.investorName}'s payment was refunded.`,
      });
      setRejectOpen(false);
      setRejectTarget(null);
    } catch (error) {
      toast({
        title: 'Rejection failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">Investment Approvals</h1>
        <p className="text-muted-foreground mt-1">Approve or reject payments that are ready to be completed</p>
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

      {filteredInvestments.length === 0 ? (
        <EmptyState
          title="No payments waiting"
          description="Payments ready for approval will appear here."
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Investor</TableHead>
                  <TableHead>Shares</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Paid At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvestments.map((inv, index) => {
                  const payment = paymentLookup.get(inv.id);
                  return (
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
                      <TableCell>
                        {payment ? (
                          <div>
                            <p className="text-sm font-medium">{payment.paymentMethod || 'card'}</p>
                            <p className="text-xs text-muted-foreground">{payment.transactionId}</p>
                            <p className="text-xs text-muted-foreground">{payment.status}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {payment?.processedAt || payment?.createdAt
                          ? new Date(payment.processedAt || payment.createdAt).toLocaleDateString()
                          : '—'}
                      </TableCell>
                      <TableCell><StatusBadge status={inv.status} /></TableCell>
                      <TableCell>
                        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
                          <Button size="sm" className="w-full sm:w-auto" onClick={() => handleApprove(inv)} disabled={isSubmitting}>
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full sm:w-auto"
                            onClick={() => handleRejectOpen(inv)}
                            disabled={isSubmitting}
                          >
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject payment and refund</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Textarea
                placeholder="Reason for rejection (optional)"
                value={adminNote}
                onChange={(event) => setAdminNote(event.target.value)}
              />
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-border/60 p-3">
              <Checkbox
                id="rejectPaymentAck"
                checked={rejectAck}
                onCheckedChange={(checked) => setRejectAck(checked === true)}
              />
              <label htmlFor="rejectPaymentAck" className="text-sm leading-relaxed">
                I understand this will refund the payment back to the investor.
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectSubmit} disabled={isSubmitting || !rejectAck}>
              {isSubmitting ? 'Rejecting...' : 'Reject & Refund'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve payment and complete investment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Textarea
                placeholder="Description (optional)"
                value={approveNote}
                onChange={(event) => setApproveNote(event.target.value)}
              />
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-border/60 p-3">
              <Checkbox
                id="approvePaymentAck"
                checked={approveAck}
                onCheckedChange={(checked) => setApproveAck(checked === true)}
              />
              <label htmlFor="approvePaymentAck" className="text-sm leading-relaxed">
                I have reviewed this payment and approve completing the investment.
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleApproveSubmit} disabled={isSubmitting || !approveAck}>
              {isSubmitting ? 'Approving...' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

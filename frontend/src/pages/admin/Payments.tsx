import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';
import { Money } from '@/components/ui/money';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search,
  CreditCard,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { investmentsApi, paymentsApi } from '@/lib/investmentsApi';
import type { Payment } from '@/types';

export default function AdminPayments() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [actionOpen, setActionOpen] = useState(false);
  const [actionTarget, setActionTarget] = useState<Payment | null>(null);
  const [actionType, setActionType] = useState<'refund' | 'withdraw' | null>(null);
  const [actionNote, setActionNote] = useState('');
  const [actionAck, setActionAck] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadPayments = async () => {
      try {
        const data = await paymentsApi.list();
        setPayments(data);
      } catch (error) {
        console.error('Failed to load payments', error);
      }
    };

    loadPayments();
  }, []);

  const refreshPayments = async () => {
    const data = await paymentsApi.list();
    setPayments(data);
  };

  const openActionDialog = (payment: Payment, action: 'refund' | 'withdraw') => {
    setActionTarget(payment);
    setActionType(action);
    setActionNote('');
    setActionAck(false);
    setActionOpen(true);
  };

  const handleActionSubmit = async () => {
    if (!actionTarget || !actionType) return;
    setIsSubmitting(true);
    try {
      await investmentsApi.adminAction(actionTarget.investmentId, actionType, actionNote || undefined);
      await refreshPayments();
      setActionOpen(false);
      setActionTarget(null);
      setActionType(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.investorName.toLowerCase().includes(search.toLowerCase()) ||
      payment.transactionId.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const successPayments = payments.filter(p => p.status === 'SUCCESS');
  const totalSuccessAmount = successPayments.reduce((sum, p) => sum + p.amount, 0);
  const failedPayments = payments.filter(p => p.status === 'FAILED');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold">Payments</h1>
        <p className="text-muted-foreground mt-1">Track all payment transactions</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <div>
              <Money amount={totalSuccessAmount} className="text-2xl font-bold" />
              <p className="text-sm text-muted-foreground">Successful Payments</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{successPayments.length}</p>
              <p className="text-sm text-muted-foreground">Completed Transactions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{failedPayments.length}</p>
              <p className="text-sm text-muted-foreground">Failed Transactions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by transaction ID or investor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="SUCCESS">Success</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
                <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
                <SelectItem value="REVERSED">Reversed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Investor</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment, index) => (
                <motion.tr
                  key={payment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="border-b"
                >
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{payment.transactionId}</code>
                  </TableCell>
                  <TableCell>{payment.investorName}</TableCell>
                  <TableCell><Money amount={payment.amount} className="font-semibold" /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      {payment.paymentMethod}
                    </div>
                  </TableCell>
                  <TableCell><StatusBadge status={payment.status} /></TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(payment.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                      {payment.status === 'PENDING' && (
                        <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => openActionDialog(payment, 'refund')}>
                          Refund
                        </Button>
                      )}
                      {payment.status === 'SUCCESS' && (
                        <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => openActionDialog(payment, 'withdraw')}>
                          Withdraw
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={actionOpen} onOpenChange={setActionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'refund' ? 'Refund payment' : 'Withdraw investment'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="paymentNote">Description (optional)</Label>
              <Textarea
                id="paymentNote"
                value={actionNote}
                onChange={(event) => setActionNote(event.target.value)}
              />
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-border/60 p-3">
              <Checkbox
                id="paymentAck"
                checked={actionAck}
                onCheckedChange={(checked) => setActionAck(checked === true)}
              />
              <Label htmlFor="paymentAck" className="text-sm leading-relaxed">
                {actionType === 'refund'
                  ? 'I understand this will refund the payment back to the investor.'
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

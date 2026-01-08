import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Money } from '@/components/ui/money';
import { EmptyState } from '@/components/ui/empty-state';
import { PageContainer } from '@/components/ui/page-container';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Receipt, Download, ExternalLink, FileText, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { investmentsApi, paymentsApi } from '@/lib/investmentsApi';
import type { Investment, Payment } from '@/types';

export default function InvestmentsPage() {
  const { user } = useAuthStore();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<{ investment: Investment; payment: Payment } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const [investmentData, paymentData] = await Promise.all([
          investmentsApi.list(),
          paymentsApi.list(),
        ]);
        setInvestments(investmentData);
        setPayments(paymentData);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const getPaymentForInvestment = (investmentId: string) => {
    return payments.find(p => p.investmentId === investmentId);
  };

  const investedStatuses = new Set(['COMPLETED', 'WITHDRAWN', 'REFUNDED', 'REVERSED']);
  const withdrawnStatuses = new Set(['WITHDRAWN', 'REFUNDED', 'REVERSED']);
  const investedInvestments = investments.filter((inv) => investedStatuses.has(inv.status));
  const activeInvestments = investments.filter((inv) => inv.isActive);
  const withdrawnInvestments = investments.filter((inv) => withdrawnStatuses.has(inv.status));
  const totalInvested = investedInvestments.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalShares = investedInvestments.reduce((sum, inv) => sum + inv.shares, 0);
  const activeInvested = activeInvestments.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const activeShares = activeInvestments.reduce((sum, inv) => sum + inv.shares, 0);
  const withdrawnInvested = withdrawnInvestments.reduce((sum, inv) => sum + inv.totalAmount, 0);

  if (loading) {
    return (
      <PageContainer title="Investments" description="Track your investment history and receipts">
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}><CardContent className="pt-6"><div className="h-10 bg-muted animate-pulse rounded" /></CardContent></Card>
          ))}
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="h-48 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Investments" description="Track your investment history and receipts">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Invested</p>
            <Money amount={totalInvested} className="text-2xl font-bold" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Active Invested</p>
            <Money amount={activeInvested} className="text-2xl font-bold" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Withdrawn</p>
            <Money amount={withdrawnInvested} className="text-2xl font-bold" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Shares</p>
            <p className="text-2xl font-bold">{totalShares.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Active Shares</p>
            <p className="text-2xl font-bold">{activeShares.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Active Investments</p>
            <p className="text-2xl font-bold">{activeInvestments.length}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="history">
        <TabsList>
          <TabsTrigger value="history">Investment History</TabsTrigger>
          <TabsTrigger value="receipts">Receipts</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="mt-6">
          {investments.length === 0 ? (
            <EmptyState
              icon={<Receipt className="h-12 w-12" />}
              title="No investments yet"
              description="Start investing in projects to build your portfolio"
              action={{ label: 'Browse Projects', onClick: () => {} }}
            />
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Shares</TableHead>
                    <TableHead>Price/Share</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {investments.map((inv) => {
                    const payment = getPaymentForInvestment(inv.id);
                    return (
                      <TableRow key={inv.id}>
                        <TableCell>
                          <Link to={`/projects/${inv.projectId}`} className="font-medium hover:text-accent transition-colors">
                            {inv.projectTitle}
                          </Link>
                        </TableCell>
                        <TableCell>{inv.shares.toLocaleString()}</TableCell>
                        <TableCell><Money amount={inv.pricePerShare} /></TableCell>
                        <TableCell><Money amount={inv.totalAmount} className="font-semibold" /></TableCell>
                        <TableCell><StatusBadge status={inv.status} /></TableCell>
                        <TableCell><StatusBadge status={inv.isActive ? 'ACTIVE' : 'INACTIVE'} /></TableCell>
                        <TableCell className="text-muted-foreground">{new Date(inv.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Link to={`/projects/${inv.projectId}`}>
                              <Button variant="ghost" size="sm"><ExternalLink className="h-4 w-4" /></Button>
                            </Link>
                            {payment && (
                              <Button variant="ghost" size="sm" onClick={() => setSelectedReceipt({ investment: inv, payment })}>
                                <FileText className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="receipts" className="mt-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {investments.map((inv) => {
              const payment = getPaymentForInvestment(inv.id);
              if (!payment) return null;
              
              return (
                <motion.div key={inv.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="hover:shadow-soft-lg transition-shadow cursor-pointer" onClick={() => setSelectedReceipt({ investment: inv, payment })}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-success" />
                        </div>
                        <StatusBadge status={payment.status} />
                      </div>
                      <h3 className="font-semibold mb-1 line-clamp-1">{inv.projectTitle}</h3>
                      <Money amount={inv.totalAmount} className="text-lg font-bold" />
                      <p className="text-xs text-muted-foreground mt-2">{new Date(payment.createdAt).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">TXN: {payment.transactionId}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Receipt Dialog */}
      <Dialog open={!!selectedReceipt} onOpenChange={() => setSelectedReceipt(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Investment Receipt</DialogTitle>
          </DialogHeader>
          {selectedReceipt && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-success" />
                </div>
                <p className="text-lg font-semibold">Payment Successful</p>
                <Money amount={selectedReceipt.investment.totalAmount} className="text-3xl font-bold" />
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transaction ID</span>
                  <span className="font-mono text-sm">{selectedReceipt.payment.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Project</span>
                  <span className="font-medium">{selectedReceipt.investment.projectTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shares Purchased</span>
                  <span className="font-medium">{selectedReceipt.investment.shares}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price per Share</span>
                  <Money amount={selectedReceipt.investment.pricePerShare} />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Method</span>
                  <span className="font-medium">{selectedReceipt.payment.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">{new Date(selectedReceipt.payment.createdAt).toLocaleString()}</span>
                </div>
              </div>
              
              <Separator />
              
              <Button variant="outline" className="w-full" onClick={() => window.print()}>
                <Download className="h-4 w-4 mr-2" /> Download Receipt
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

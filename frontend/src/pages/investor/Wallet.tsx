import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Money } from '@/components/ui/money';
import { PageContainer } from '@/components/ui/page-container';
import { usersApi } from '@/lib/usersApi';
import type { Wallet } from '@/types';

export default function WalletPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWallet = async () => {
      try {
        const data = await usersApi.getWallet();
        setWallet({
          balance: Number(data.balance || 0),
          transactions: Array.isArray(data.transactions)
            ? data.transactions.map((tx: any) => ({
                id: String(tx.id),
                amount: Number(tx.amount || 0),
                type: tx.type,
                reference: tx.reference || undefined,
                projectId: tx.project_id || undefined,
                projectName: tx.project_name || undefined,
                investmentId: tx.investment_id || undefined,
                createdAt: tx.created_at || new Date().toISOString(),
              }))
            : [],
        });
      } catch (error) {
        console.error('Failed to load wallet', error);
      } finally {
        setLoading(false);
      }
    };

    loadWallet();
  }, []);

  return (
    <PageContainer title="Wallet" description="Track your refunds and withdrawals">
      {loading ? (
        <div className="text-muted-foreground">Loading wallet...</div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <Money amount={wallet?.balance || 0} className="text-3xl font-bold" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(wallet?.transactions || []).map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{tx.type}</TableCell>
                    <TableCell>{tx.projectName || '—'}</TableCell>
                    <TableCell><Money amount={tx.amount} /></TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}

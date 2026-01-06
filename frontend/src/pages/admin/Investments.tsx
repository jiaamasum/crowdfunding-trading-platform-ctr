import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';
import { Money } from '@/components/ui/money';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Search, 
  TrendingUp,
  DollarSign,
  Layers
} from 'lucide-react';
import { investmentsApi } from '@/lib/investmentsApi';
import { Link } from 'react-router-dom';
import type { Investment } from '@/types';

export default function AdminInvestments() {
  const [search, setSearch] = useState('');
  const [investments, setInvestments] = useState<Investment[]>([]);

  useEffect(() => {
    const loadInvestments = async () => {
      try {
        const data = await investmentsApi.list();
        setInvestments(data);
      } catch (error) {
        console.error('Failed to load investments', error);
      }
    };

    loadInvestments();
  }, []);

  const filteredInvestments = investments.filter(inv => 
    inv.investorName.toLowerCase().includes(search.toLowerCase()) ||
    inv.projectTitle.toLowerCase().includes(search.toLowerCase())
  );

  const totalAmount = investments.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalShares = investments.reduce((sum, inv) => sum + inv.shares, 0);
  const uniqueProjects = new Set(investments.map(inv => inv.projectId)).size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold">Investments</h1>
        <p className="text-muted-foreground mt-1">Overview of all platform investments</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-accent" />
            </div>
            <div>
              <Money amount={totalAmount} className="text-2xl font-bold" />
              <p className="text-sm text-muted-foreground">Total Invested</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalShares.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Shares Sold</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{uniqueProjects}</p>
              <p className="text-sm text-muted-foreground">Active Projects</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by investor or project..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Investments Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Investor</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Shares</TableHead>
              <TableHead>Price/Share</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvestments.map((inv, index) => (
              <motion.tr
                key={inv.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="border-b"
              >
                <TableCell>
                  <div>
                    <p className="font-medium">{inv.investorName}</p>
                    <p className="text-xs text-muted-foreground">{inv.investorEmail}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Link to={`/projects/${inv.projectId}`} className="hover:text-primary transition-colors">
                    {inv.projectTitle}
                  </Link>
                </TableCell>
                <TableCell>{inv.shares.toLocaleString()}</TableCell>
                <TableCell><Money amount={inv.pricePerShare} /></TableCell>
                <TableCell><Money amount={inv.totalAmount} className="font-semibold" /></TableCell>
                <TableCell><StatusBadge status={inv.status} /></TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(inv.createdAt).toLocaleDateString()}
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

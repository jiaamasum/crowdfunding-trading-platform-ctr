import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Money } from '@/components/ui/money';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { Search, TrendingUp, DollarSign, Layers, Users } from 'lucide-react';
import { investmentsApi } from '@/lib/investmentsApi';
import type { Investment } from '@/types';

export default function AdminInvestments() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
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

  const filteredInvestments = useMemo(() => {
    return investments.filter((inv) => {
      const matchesSearch = inv.investorName.toLowerCase().includes(search.toLowerCase())
        || inv.projectTitle.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [investments, search, statusFilter]);

  const projectGroups = useMemo(() => {
    const map = new Map<string, {
      projectId: string;
      projectTitle: string;
      totalAmount: number;
      totalShares: number;
      investorCount: number;
      latestDate?: string;
      latestStatus?: Investment['status'];
    }>();

    filteredInvestments.forEach((inv) => {
      const existing = map.get(inv.projectId);
      if (existing) {
        existing.totalAmount += inv.totalAmount;
        existing.totalShares += inv.shares;
        existing.investorCount += 1;
        if (!existing.latestDate || new Date(inv.createdAt) > new Date(existing.latestDate)) {
          existing.latestDate = inv.createdAt;
          existing.latestStatus = inv.status;
        }
      } else {
        map.set(inv.projectId, {
          projectId: inv.projectId,
          projectTitle: inv.projectTitle,
          totalAmount: inv.totalAmount,
          totalShares: inv.shares,
          investorCount: 1,
          latestDate: inv.createdAt,
          latestStatus: inv.status,
        });
      }
    });

    return Array.from(map.values());
  }, [filteredInvestments]);

  const userGroups = useMemo(() => {
    const map = new Map<string, {
      investorId: string;
      investorName: string;
      investorEmail: string;
      totalAmount: number;
      investmentCount: number;
      latestDate?: string;
      latestStatus?: Investment['status'];
    }>();

    filteredInvestments.forEach((inv) => {
      const existing = map.get(inv.investorId);
      if (existing) {
        existing.totalAmount += inv.totalAmount;
        existing.investmentCount += 1;
        if (!existing.latestDate || new Date(inv.createdAt) > new Date(existing.latestDate)) {
          existing.latestDate = inv.createdAt;
          existing.latestStatus = inv.status;
        }
      } else {
        map.set(inv.investorId, {
          investorId: inv.investorId,
          investorName: inv.investorName,
          investorEmail: inv.investorEmail,
          totalAmount: inv.totalAmount,
          investmentCount: 1,
          latestDate: inv.createdAt,
          latestStatus: inv.status,
        });
      }
    });

    return Array.from(map.values());
  }, [filteredInvestments]);

  const totalAmount = investments.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalShares = investments.reduce((sum, inv) => sum + inv.shares, 0);
  const uniqueProjects = new Set(investments.map((inv) => inv.projectId)).size;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">Investments</h1>
        <p className="text-muted-foreground mt-1">Monitor investments by project and by investor</p>
      </div>

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
              <p className="text-sm text-muted-foreground">Total Shares</p>
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

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by investor or project..."
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
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="projects">
        <TabsList>
          <TabsTrigger value="projects" className="gap-2"><Layers className="h-4 w-4" /> Projects</TabsTrigger>
          <TabsTrigger value="users" className="gap-2"><Users className="h-4 w-4" /> Investors</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="mt-6">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Investors</TableHead>
                  <TableHead>Shares</TableHead>
                  <TableHead>Total Invested</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Investment</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectGroups.map((project, index) => (
                  <motion.tr
                    key={project.projectId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b"
                  >
                    <TableCell>
                      <span className="font-medium">{project.projectTitle}</span>
                    </TableCell>
                    <TableCell>{project.investorCount}</TableCell>
                    <TableCell>{project.totalShares.toLocaleString()}</TableCell>
                    <TableCell><Money amount={project.totalAmount} className="font-semibold" /></TableCell>
                    <TableCell>
                      {project.latestStatus ? <StatusBadge status={project.latestStatus} /> : '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {project.latestDate ? new Date(project.latestDate).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Link to={`/app/admin/investments/projects/${project.projectId}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Investor</TableHead>
                  <TableHead>Investments</TableHead>
                  <TableHead>Total Invested</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Investment</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userGroups.map((user, index) => (
                  <motion.tr
                    key={user.investorId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b"
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.investorName}</p>
                        <p className="text-xs text-muted-foreground">{user.investorEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell>{user.investmentCount}</TableCell>
                    <TableCell><Money amount={user.totalAmount} className="font-semibold" /></TableCell>
                    <TableCell>
                      {user.latestStatus ? <StatusBadge status={user.latestStatus} /> : '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.latestDate ? new Date(user.latestDate).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Link to={`/app/admin/users/${user.investorId}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

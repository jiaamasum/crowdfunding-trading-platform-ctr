import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Money } from '@/components/ui/money';
import { SharesProgress } from '@/components/ui/shares-progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  FolderKanban,
  DollarSign,
  Users,
  TrendingUp,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle,
  FileEdit
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { statsApi } from '@/lib/statsApi';
import { investmentsApi } from '@/lib/investmentsApi';
import { projectsApi } from '@/lib/projectsApi';
import type { Project, DeveloperStats, Investment } from '@/types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function DeveloperDashboard() {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DeveloperStats | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await projectsApi.getMine();
        setProjects(data);
      } catch (error) {
        console.error('Failed to load projects', error);
      }
    };

    loadProjects();
  }, []);
  useEffect(() => {
    if (!user) return;
    const loadStats = async () => {
      try {
        const [statsData, investmentData] = await Promise.all([
          statsApi.getDeveloper(),
          investmentsApi.list(),
        ]);
        setDashboardStats(statsData);
        setInvestments(investmentData);
      } catch (error) {
        console.error('Failed to load developer stats', error);
      }
    };

    loadStats();
  }, [user]);

  const myProjects = projects;
  const approvedProjects = myProjects.filter(p => p.status === 'APPROVED');
  const pendingProjects = myProjects.filter(p => p.status === 'PENDING_REVIEW');
  const draftProjects = myProjects.filter(p => p.status === 'DRAFT' || p.status === 'NEEDS_CHANGES');

  // Calculate stats
  const totalFundsSecured = dashboardStats?.totalFundsSecured ?? approvedProjects.reduce((sum, p) => sum + (p.sharesSold * p.perSharePrice), 0);
  const totalInvestors = dashboardStats?.totalInvestors ?? 0;
  const totalSharesSold = dashboardStats?.totalSharesSold ?? approvedProjects.reduce((sum, p) => sum + p.sharesSold, 0);
  const totalShares = approvedProjects.reduce((sum, p) => sum + p.totalShares, 0);

  const fundingData = (() => {
    if (investments.length === 0) return [];
    const buckets = new Map<string, number>();
    investments.forEach((inv) => {
      const date = new Date(inv.createdAt);
      const key = date.toLocaleString('en-US', { month: 'short' });
      buckets.set(key, (buckets.get(key) || 0) + inv.totalAmount);
    });
    return Array.from(buckets.entries()).map(([month, funds]) => ({ month, funds }));
  })();

  const projectSharesData = approvedProjects.map(p => ({
    name: p.title.length > 12 ? p.title.substring(0, 12) + '…' : p.title,
    fullName: p.title,
    sold: p.sharesSold,
    remaining: p.remainingShares,
  }));

  const statCards = [
    { label: 'Total Projects', value: dashboardStats?.totalProjects ?? myProjects.length, icon: FolderKanban, color: 'text-primary' },
    { label: 'Funds Secured', value: totalFundsSecured, icon: DollarSign, color: 'text-accent', isMoney: true },
    { label: 'Total Investors', value: totalInvestors, icon: Users, color: 'text-success' },
    { label: 'Shares Sold', value: totalSharesSold, subValue: totalShares, icon: TrendingUp, color: 'text-warning', isShares: true },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Developer Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your projects and track performance</p>
        </div>
        <Link to="/app/developer/projects/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Project
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    {stat.isMoney ? (
                      <Money amount={stat.value as number} className="text-2xl font-bold mt-1" />
                    ) : stat.isShares ? (
                      <div className="mt-1">
                        <span className="text-2xl font-bold">{(stat.value as number).toLocaleString()}</span>
                        <span className="text-sm text-muted-foreground ml-1">/ {stat.subValue?.toLocaleString()}</span>
                      </div>
                    ) : (
                      <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    )}
                  </div>
                  <div className={`w-12 h-12 rounded-xl bg-muted flex-shrink-0 flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Status Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-warning">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingProjects.length}</p>
              <p className="text-sm text-muted-foreground">Pending Review</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-success">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{approvedProjects.length}</p>
              <p className="text-sm text-muted-foreground">Live Projects</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-muted-foreground">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <FileEdit className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{draftProjects.length}</p>
              <p className="text-sm text-muted-foreground">Drafts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Funds Secured Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {fundingData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={fundingData}>
                    <defs>
                      <linearGradient id="colorFunds" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(value: number) => [`$${value.toLocaleString()}`, 'Funds']}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Area type="monotone" dataKey="funds" stroke="hsl(var(--accent))" fillOpacity={1} fill="url(#colorFunds)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No investment activity yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Shares Distribution by Project</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectSharesData} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="name" type="category" className="text-xs" width={90} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                  />
                  <Bar dataKey="sold" stackId="a" fill="hsl(var(--success))" name="Sold" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="remaining" stackId="a" fill="hsl(var(--muted))" name="Remaining" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Table */}
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg">My Projects</CardTitle>
          <Link to="/app/developer/projects">
            <Button variant="ghost" size="sm" className="gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Shares Sold</TableHead>
                  <TableHead>Funds Secured</TableHead>
                  <TableHead>Progress</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myProjects.slice(0, 5).map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      <Link to={`/app/developer/projects/${project.id}`} className="font-medium hover:text-primary transition-colors">
                        {project.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={project.status} />
                    </TableCell>
                    <TableCell>
                      {project.sharesSold.toLocaleString()} / {project.totalShares.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Money amount={project.sharesSold * project.perSharePrice} />
                    </TableCell>
                    <TableCell className="w-32">
                      <SharesProgress sold={project.sharesSold} total={project.totalShares} showLabel={false} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

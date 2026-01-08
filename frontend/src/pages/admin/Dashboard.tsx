import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Money } from '@/components/ui/money';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  FileCheck, 
  ShieldCheck,
  Users,
  TrendingUp,
  DollarSign,
  ArrowRight,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { investmentsApi } from '@/lib/investmentsApi';
import { statsApi } from '@/lib/statsApi';
import { projectsApi } from '@/lib/projectsApi';
import { accessRequestsApi, type AccessRequest as ApiAccessRequest } from '@/lib/accessRequestsApi';
import { MediaImage } from '@/components/common/MediaImage';
import type { Investment, Project } from '@/types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function AdminDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [pendingAccessCount, setPendingAccessCount] = useState(0);
  const [pendingProjectEditsCount, setPendingProjectEditsCount] = useState(0);
  const [pendingInvestmentRequestsCount, setPendingInvestmentRequestsCount] = useState(0);
  const [pendingInvestmentApprovalsCount, setPendingInvestmentApprovalsCount] = useState(0);
  const [recentAccessRequests, setRecentAccessRequests] = useState<ApiAccessRequest[]>([]);
  const [recentInvestmentRequests, setRecentInvestmentRequests] = useState<Investment[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [totalInvestedAmount, setTotalInvestedAmount] = useState(0);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const [data, editRequests] = await Promise.all([
          projectsApi.getAll(),
          projectsApi.listEditRequests('PENDING'),
        ]);
        setProjects(data);
        setPendingProjectEditsCount(editRequests.length);
      } catch (error) {
        console.error('Failed to load projects', error);
      }
    };

    loadProjects();
  }, []);
  useEffect(() => {
    let isMounted = true;

    const loadAccessRequests = async () => {
      try {
        const [pending, recent] = await Promise.all([
          accessRequestsApi.listAll('PENDING'),
          accessRequestsApi.listAll(),
        ]);
        if (isMounted) {
          setPendingAccessCount(pending.length);
          setRecentAccessRequests(recent.slice(0, 4));
        }
      } catch (error) {
        console.error('Failed to load access requests', error);
      }
    };

    loadAccessRequests();
    const interval = setInterval(loadAccessRequests, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);
  useEffect(() => {
    let isMounted = true;

    const loadStats = async () => {
      try {
        const [stats, investments] = await Promise.all([
          statsApi.getAdmin(),
          investmentsApi.list(),
        ]);

        if (!isMounted) return;
        setUserCount(stats.totalUsers);
        setTotalInvestedAmount(investments.reduce((sum, inv) => sum + inv.totalAmount, 0));
        const sortedInvestments = [...investments].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        const pendingRequests = sortedInvestments.filter((inv) => inv.status === 'REQUESTED');
        const pendingApprovals = sortedInvestments.filter((inv) => inv.status === 'PROCESSING');
        setPendingInvestmentRequestsCount(pendingRequests.length);
        setPendingInvestmentApprovalsCount(pendingApprovals.length);
        setRecentInvestmentRequests(pendingRequests.slice(0, 4));
      } catch (error) {
        console.error('Failed to load admin stats', error);
      }
    };

    loadStats();
    const interval = setInterval(loadStats, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const pendingProjects = projects.filter(p => p.status === 'PENDING_REVIEW');
  const pendingProjectRequests = pendingProjects.length + pendingProjectEditsCount;

  const stats = [
    { label: 'Pending Reviews', value: pendingProjectRequests, icon: FileCheck, color: 'text-warning', bgColor: 'bg-warning/10', link: '/app/admin/projects/review-queue' },
    { label: 'Access Requests', value: pendingAccessCount, icon: ShieldCheck, color: 'text-primary', bgColor: 'bg-primary/10', link: '/app/admin/access-requests' },
    { label: 'Investment Requests', value: pendingInvestmentRequestsCount, icon: AlertCircle, color: 'text-warning', bgColor: 'bg-warning/10', link: '/app/admin/investments/requests' },
    { label: 'Investment Approvals', value: pendingInvestmentApprovalsCount, icon: CheckCircle, color: 'text-success', bgColor: 'bg-success/10', link: '/app/admin/investments/processing' },
    { label: 'Total Users', value: userCount, icon: Users, color: 'text-accent', bgColor: 'bg-accent/10', link: '/app/admin/users' },
    { label: 'Total Investments', value: totalInvestedAmount, icon: TrendingUp, color: 'text-success', bgColor: 'bg-success/10', isMoney: true, link: '/app/admin/investments' },
  ];

  // Chart data
  const investmentData = [
    { month: 'Jun', amount: 50000 },
    { month: 'Jul', amount: 85000 },
    { month: 'Aug', amount: 120000 },
    { month: 'Sep', amount: 165000 },
    { month: 'Oct', amount: 210000 },
    { month: 'Nov', amount: 280000 },
  ];

  const projectStatusData = [
    { name: 'Approved', value: projects.filter(p => p.status === 'APPROVED').length, color: 'hsl(var(--success))' },
    { name: 'Pending', value: projects.filter(p => p.status === 'PENDING_REVIEW').length, color: 'hsl(var(--warning))' },
    { name: 'Draft', value: projects.filter(p => p.status === 'DRAFT').length, color: 'hsl(var(--muted-foreground))' },
    { name: 'Rejected', value: projects.filter(p => p.status === 'REJECTED').length, color: 'hsl(var(--destructive))' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of platform activity and pending actions</p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link to={stat.link}>
              <Card className="hover:shadow-soft-lg transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      {stat.isMoney ? (
                        <Money amount={stat.value as number} className="text-2xl font-bold mt-1" />
                      ) : (
                        <p className="text-2xl font-bold mt-1">{stat.value}</p>
                      )}
                    </div>
                    <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center ${stat.color}`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      {(pendingProjectRequests > 0 || pendingAccessCount > 0 || pendingInvestmentRequestsCount > 0 || pendingInvestmentApprovalsCount > 0) && (
        <Card className="border-l-4 border-l-warning">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-5 w-5 text-warning" />
              <h3 className="font-semibold">Pending Actions</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {pendingProjectRequests > 0 && (
                <Link to="/app/admin/projects/review-queue">
                  <Button variant="outline" className="gap-2">
                    {pendingProjectRequests} project(s) awaiting review <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              )}
              {pendingAccessCount > 0 && (
                <Link to="/app/admin/access-requests">
                  <Button variant="outline" className="gap-2">
                    {pendingAccessCount} access request(s) pending <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              )}
              {pendingInvestmentRequestsCount > 0 && (
                <Link to="/app/admin/investments/requests">
                  <Button variant="outline" className="gap-2">
                    {pendingInvestmentRequestsCount} investment request(s) pending <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              )}
              {pendingInvestmentApprovalsCount > 0 && (
                <Link to="/app/admin/investments/processing">
                  <Button variant="outline" className="gap-2">
                    {pendingInvestmentApprovalsCount} payment(s) awaiting approval <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Investment Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={investmentData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Amount']}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Area type="monotone" dataKey="amount" stroke="hsl(var(--success))" fillOpacity={1} fill="url(#colorAmount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Project Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {projectStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 flex-wrap mt-4">
              {projectStatusData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-sm text-muted-foreground">{entry.name} ({entry.value})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Tables */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Project Submissions</CardTitle>
            <Link to="/app/admin/projects/review-queue">
              <Button variant="ghost" size="sm" className="gap-1">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projects.slice(0, 4).map((project) => (
                <div key={project.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MediaImage 
                      src={project.thumbnailUrl} 
                      alt={project.title}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-medium text-sm line-clamp-1">{project.title}</p>
                      <p className="text-xs text-muted-foreground">{project.developerName}</p>
                    </div>
                  </div>
                  <StatusBadge status={project.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Access Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Access Requests</CardTitle>
            <Link to="/app/admin/access-requests">
              <Button variant="ghost" size="sm" className="gap-1">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAccessRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{request.investor_name || '-'}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{request.project_title || '-'}</p>
                  </div>
                  <StatusBadge status={request.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Investment Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Investment Requests</CardTitle>
            <Link to="/app/admin/investments/requests">
              <Button variant="ghost" size="sm" className="gap-1">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentInvestmentRequests.length === 0 ? (
                <div className="text-sm text-muted-foreground">No pending investment requests.</div>
              ) : (
                recentInvestmentRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{request.investorName || '-'}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{request.projectTitle || '-'}</p>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

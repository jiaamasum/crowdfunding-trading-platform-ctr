import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, StatsCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Money, SharesProgress } from '@/components/ui/money';
import { Skeleton } from '@/components/ui/skeleton';
import { PageContainer } from '@/components/ui/page-container';
import { 
  TrendingUp, DollarSign, PieChart, FolderOpen, ChevronRight, 
  Heart, GitCompare, ArrowUpRight, ArrowDownRight, Layers
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { statsApi } from '@/lib/statsApi';
import { investmentsApi } from '@/lib/investmentsApi';
import type { InvestorStats, Investment } from '@/types';
import { 
  PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, 
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';

const COLORS = ['hsl(158 64% 42%)', 'hsl(38 92% 50%)', 'hsl(210 92% 55%)', 'hsl(280 65% 60%)'];

export default function InvestorDashboard() {
  const { user } = useAuthStore();
  const { favorites, compareList } = useAppStore();
  const [stats, setStats] = useState<InvestorStats | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const [statsData, investmentsData] = await Promise.all([
          statsApi.getInvestor(),
          investmentsApi.list(),
        ]);
        setStats(statsData);
        setInvestments(investmentsData);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const investedStatuses = new Set(['COMPLETED', 'WITHDRAWN', 'REFUNDED', 'REVERSED']);
  const withdrawnStatuses = new Set(['WITHDRAWN', 'REFUNDED', 'REVERSED']);
  const investedInvestments = investments.filter((inv) => investedStatuses.has(inv.status));
  const activeInvestments = investments.filter((inv) => inv.isActive);
  const withdrawnInvestments = investments.filter((inv) => withdrawnStatuses.has(inv.status));

  const totalInvestedAmount = stats?.totalInvestedAmount
    ?? investedInvestments.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const activeInvestedAmount = stats?.activeInvestedAmount
    ?? activeInvestments.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const withdrawnInvestedAmount = stats?.withdrawnInvestedAmount
    ?? withdrawnInvestments.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalSharesOwned = stats?.totalSharesOwned
    ?? investedInvestments.reduce((sum, inv) => sum + inv.shares, 0);
  const activeSharesOwned = stats?.activeSharesOwned
    ?? activeInvestments.reduce((sum, inv) => sum + inv.shares, 0);
  const activeProjects = stats?.activeInvestedProjects
    ?? new Set(activeInvestments.map((inv) => inv.projectId)).size;
  const portfolioValue = stats?.portfolioValue ?? activeInvestedAmount;

  // Prepare chart data
  const allocationData = activeInvestments.reduce((acc, inv) => {
    const existing = acc.find(a => a.name === inv.projectTitle);
    if (existing) {
      existing.value += inv.totalAmount;
    } else {
      acc.push({ name: inv.projectTitle, value: inv.totalAmount });
    }
    return acc;
  }, [] as { name: string; value: number }[]);
  const totalAllocation = allocationData.reduce((sum, item) => sum + item.value, 0);

  const timelineData = useMemo(() => {
    if (investedInvestments.length === 0) return [];
    const buckets = new Map<number, number>();
    investedInvestments.forEach((inv) => {
      const date = new Date(inv.createdAt);
      const key = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
      buckets.set(key, (buckets.get(key) || 0) + inv.totalAmount);
    });
    return Array.from(buckets.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([timestamp, amount]) => ({
        month: new Date(timestamp).toLocaleString('en-US', { month: 'short' }),
        amount,
      }));
  }, [investedInvestments]);

  const portfolioTrend = useMemo(() => {
    if (timelineData.length < 2) {
      return { value: 0, isPositive: true };
    }
    const previous = timelineData[timelineData.length - 2].amount;
    const current = timelineData[timelineData.length - 1].amount;
    if (previous <= 0) {
      return { value: current > 0 ? 100 : 0, isPositive: current >= 0 };
    }
    const change = ((current - previous) / previous) * 100;
    return { value: Math.round(Math.abs(change) * 10) / 10, isPositive: change >= 0 };
  }, [timelineData]);

  if (loading) {
    return (
      <PageContainer title="Investor Dashboard">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="pt-6"><Skeleton className="h-20" /></CardContent></Card>
          ))}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer 
      title={`Welcome back, ${user?.name?.split(' ')[0]}`}
      description="Here's an overview of your investment portfolio"
    >
      {/* Verification Warning */}
      {!user?.isVerified && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-lg bg-warning/10 border border-warning/20 mb-6">
          <p className="text-warning font-medium">Verify your email to start investing</p>
          <p className="text-sm text-muted-foreground mt-1">Check your inbox for the verification link.</p>
        </motion.div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Invested"
          value={`$${totalInvestedAmount.toLocaleString()}`}
          icon={<DollarSign className="h-5 w-5" />}
          description="Across all projects"
        />
        <StatsCard
          title="Active Invested"
          value={`$${activeInvestedAmount.toLocaleString()}`}
          icon={<ArrowUpRight className="h-5 w-5" />}
          description="Completed and active"
        />
        <StatsCard
          title="Shares Owned"
          value={totalSharesOwned.toLocaleString()}
          icon={<PieChart className="h-5 w-5" />}
          description="Total shares"
        />
        <StatsCard
          title="Active Shares"
          value={activeSharesOwned.toLocaleString()}
          icon={<Layers className="h-5 w-5" />}
          description="Active holdings"
        />
        <StatsCard
          title="Withdrawn"
          value={`$${withdrawnInvestedAmount.toLocaleString()}`}
          icon={<ArrowDownRight className="h-5 w-5" />}
          description="Refunded or withdrawn"
        />
        <StatsCard
          title="Active Projects"
          value={activeProjects}
          icon={<FolderOpen className="h-5 w-5" />}
          description="Currently invested"
        />
        <StatsCard
          title="Portfolio Value"
          value={`$${portfolioValue.toLocaleString()}`}
          icon={<TrendingUp className="h-5 w-5" />}
          trend={portfolioTrend}
          description="Active holdings"
        />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        {/* Allocation Chart */}
        <Card>
          <CardHeader><CardTitle>Investment Allocation</CardTitle></CardHeader>
          <CardContent>
            {allocationData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {allocationData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const item = payload[0];
                        const value = Number(item.value || 0);
                        const percent = totalAllocation ? (value / totalAllocation) * 100 : 0;
                        return (
                          <div className="rounded-lg border bg-background p-3 shadow-sm">
                            <p className="text-sm font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{percent.toFixed(1)}% allocation</p>
                          </div>
                        );
                      }}
                    />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No investments yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timeline Chart */}
        <Card>
          <CardHeader><CardTitle>Investment Timeline</CardTitle></CardHeader>
          <CardContent>
            {timelineData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${v / 1000}k`} />
                    <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="hsl(var(--accent))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--accent))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No investment history yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4 mt-6">
        <Link to="/app/investor/favorites">
          <Card className="hover:shadow-soft-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <Heart className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="font-semibold">Favorites</p>
                  <p className="text-sm text-muted-foreground">{favorites.length} projects saved</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
        <Link to="/app/investor/compare">
          <Card className="hover:shadow-soft-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <GitCompare className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="font-semibold">Compare</p>
                  <p className="text-sm text-muted-foreground">{compareList.length} projects to compare</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
        <Link to="/app/investor/projects">
          <Card className="hover:shadow-soft-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-highlight/10 flex items-center justify-center">
                  <FolderOpen className="h-5 w-5 text-highlight" />
                </div>
                <div>
                  <p className="font-semibold">Browse Projects</p>
                  <p className="text-sm text-muted-foreground">Discover new opportunities</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Investments */}
      <Card className="mt-6">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Recent Investments</CardTitle>
          <Link to="/app/investor/investments">
            <Button variant="ghost" size="sm">View All <ChevronRight className="h-4 w-4 ml-1" /></Button>
          </Link>
        </CardHeader>
        <CardContent>
          {investments.length > 0 ? (
            <div className="space-y-4">
              {investments.slice(0, 3).map((inv) => (
                <div key={inv.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">{inv.projectTitle}</p>
                    <p className="text-sm text-muted-foreground">{inv.shares} shares @ <Money amount={inv.pricePerShare} /></p>
                  </div>
                  <div className="text-left sm:text-right">
                    <Money amount={inv.totalAmount} className="font-semibold" />
                    <p className="text-xs text-muted-foreground">{new Date(inv.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No investments yet</p>
              <Link to="/app/investor/projects">
                <Button variant="accent" className="mt-4">Browse Projects</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}

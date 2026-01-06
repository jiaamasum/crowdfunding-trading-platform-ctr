import { useEffect, useState } from 'react';
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
  Heart, GitCompare, ArrowUpRight, ArrowDownRight 
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

  // Prepare chart data
  const allocationData = investments.reduce((acc, inv) => {
    const existing = acc.find(a => a.name === inv.projectTitle);
    if (existing) {
      existing.value += inv.totalAmount;
    } else {
      acc.push({ name: inv.projectTitle.slice(0, 15) + '...', value: inv.totalAmount });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  const timelineData = (() => {
    if (investments.length === 0) return [];
    const buckets = new Map<string, number>();
    investments.forEach((inv) => {
      const date = new Date(inv.createdAt);
      const key = date.toLocaleString('en-US', { month: 'short' });
      buckets.set(key, (buckets.get(key) || 0) + inv.totalAmount);
    });
    return Array.from(buckets.entries()).map(([month, amount]) => ({ month, amount }));
  })();

  if (loading) {
    return (
      <PageContainer title="Dashboard">
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
          value={`$${(stats?.totalInvestedAmount || 0).toLocaleString()}`}
          icon={<DollarSign className="h-5 w-5" />}
          description="Across all projects"
        />
        <StatsCard
          title="Projects Invested"
          value={stats?.totalInvestedProjects || 0}
          icon={<FolderOpen className="h-5 w-5" />}
          description="Active investments"
        />
        <StatsCard
          title="Shares Owned"
          value={(stats?.totalSharesOwned || 0).toLocaleString()}
          icon={<PieChart className="h-5 w-5" />}
          description="Total shares"
        />
        <StatsCard
          title="Portfolio Value"
          value={`$${(stats?.portfolioValue || 0).toLocaleString()}`}
          icon={<TrendingUp className="h-5 w-5" />}
          trend={{ value: 15, isPositive: true }}
          description="vs. invested"
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
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {allocationData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
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
            <CardContent className="pt-6 flex items-center justify-between">
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
            <CardContent className="pt-6 flex items-center justify-between">
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
            <CardContent className="pt-6 flex items-center justify-between">
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Investments</CardTitle>
          <Link to="/app/investor/investments">
            <Button variant="ghost" size="sm">View All <ChevronRight className="h-4 w-4 ml-1" /></Button>
          </Link>
        </CardHeader>
        <CardContent>
          {investments.length > 0 ? (
            <div className="space-y-4">
              {investments.slice(0, 3).map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">{inv.projectTitle}</p>
                    <p className="text-sm text-muted-foreground">{inv.shares} shares @ <Money amount={inv.pricePerShare} /></p>
                  </div>
                  <div className="text-right">
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

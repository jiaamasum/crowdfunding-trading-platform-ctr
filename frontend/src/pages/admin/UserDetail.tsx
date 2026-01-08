import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Money } from '@/components/ui/money';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { Separator } from '@/components/ui/separator';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  ChevronLeft, Mail, Calendar, ShieldCheck, UserX, TrendingUp, 
  Wallet, FolderOpen, Receipt, Eye, Building2, Ban, UserCheck
} from 'lucide-react';
import { projectsApi } from '@/lib/projectsApi';
import { investmentsApi } from '@/lib/investmentsApi';
import { accessRequestsApi } from '@/lib/accessRequestsApi';
import { usersApi } from '@/lib/usersApi';
import { toast } from 'sonner';
import { MediaImage } from '@/components/common/MediaImage';
import type { User, Investment, Project } from '@/types';
import type { AccessRequest as ApiAccessRequest } from '@/lib/accessRequestsApi';

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [accessRequests, setAccessRequests] = useState<ApiAccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showUnbanDialog, setShowUnbanDialog] = useState(false);
  const [banResolution, setBanResolution] = useState<'refund' | 'withdraw' | 'reverse' | null>(null);
  const [isBanSubmitting, setIsBanSubmitting] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);
  const [actionTarget, setActionTarget] = useState<Investment | null>(null);
  const [actionType, setActionType] = useState<'refund' | 'withdraw' | null>(null);
  const [actionNote, setActionNote] = useState('');
  const [actionAck, setActionAck] = useState(false);
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);

  const handleBanUser = async () => {
    if (!user) return;
    setIsBanSubmitting(true);
    try {
      const updated = await usersApi.ban(user.id, banResolution || undefined);
      setUser(updated);
      toast.success(`${user.name} has been banned from the platform`);
      setShowBanDialog(false);
      setBanResolution(null);
    } catch (error: any) {
      toast.error('Ban failed', {
        description: error?.response?.data?.detail || error?.message || 'Please try again.',
      });
    } finally {
      setIsBanSubmitting(false);
    }
  };

  const handleUnbanUser = async () => {
    if (!user) return;
    try {
      const updated = await usersApi.unban(user.id);
      setUser(updated);
      setShowUnbanDialog(false);
      toast.success(`${user.name} has been unbanned`);
    } catch (error: any) {
      toast.error('Unban failed', {
        description: error?.response?.data?.detail || error?.message || 'Please try again.',
      });
    }
  };

  const openInvestmentAction = (investment: Investment, action: 'refund' | 'withdraw') => {
    setActionTarget(investment);
    setActionType(action);
    setActionNote('');
    setActionAck(false);
    setActionOpen(true);
  };

  const handleInvestmentAction = async () => {
    if (!actionTarget || !actionType) return;
    setIsActionSubmitting(true);
    try {
      const updated = await investmentsApi.adminAction(actionTarget.id, actionType, actionNote || undefined);
      setInvestments((prev) => prev.map((inv) => inv.id === updated.id ? updated : inv));
      setActionOpen(false);
      setActionTarget(null);
      setActionType(null);
    } catch (error: any) {
      toast.error('Action failed', {
        description: error?.response?.data?.detail || error?.message || 'Please try again.',
      });
    } finally {
      setIsActionSubmitting(false);
    }
  };

  useEffect(() => {
    const loadUserData = async () => {
      setLoading(true);
      try {
        if (!id) {
          setUser(null);
          setLoading(false);
          return;
        }

        const foundUser = await usersApi.getById(id);
        setUser(foundUser || null);

        if (foundUser) {
          if (foundUser.role === 'INVESTOR') {
            const [allInvestments, allAccess, allProjects] = await Promise.all([
              investmentsApi.list(),
              accessRequestsApi.listAll(),
              projectsApi.getAll(),
            ]);
            setInvestments(allInvestments.filter(i => i.investorId === foundUser.id));
            setAccessRequests(allAccess.filter(ar => String(ar.investor) === String(foundUser.id)));
            setProjects(allProjects);
          } else if (foundUser.role === 'DEVELOPER') {
            const allProjects = await projectsApi.getAll();
            const userProjects = allProjects.filter(
              p => p.developerId === foundUser.id
            );
            setProjects(userProjects);
          }
        }
      } catch (error) {
        console.error('Failed to load user data', error);
      } finally {
        setLoading(false);
      }
    };
    loadUserData();
  }, [id]);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-destructive/10 text-destructive';
      case 'DEVELOPER': return 'bg-primary/10 text-primary';
      case 'INVESTOR': return 'bg-accent/10 text-accent';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getProjectById = (projectId: string) =>
    projects.find(p => p.id === projectId);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">User not found</p>
        <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const completedInvestments = investments.filter((inv) => inv.status === 'COMPLETED');
  const totalInvested = completedInvestments.reduce((sum, i) => sum + i.totalAmount, 0);
  const totalShares = completedInvestments.reduce((sum, i) => sum + i.shares, 0);
  const totalRaised = projects.reduce((sum, p) => sum + (p.sharesSold * p.perSharePrice), 0);
  const activeInvestments = investments.filter((inv) => ![
    'CANCELLED',
    'REFUNDED',
    'WITHDRAWN',
    'REVERSED',
    'REJECTED',
    'EXPIRED',
  ].includes(inv.status));
  const activeInvestmentTotal = activeInvestments.reduce((sum, inv) => sum + inv.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-display font-bold">User Details</h1>
          <p className="text-muted-foreground mt-1">View user profile and activity</p>
        </div>
      </div>

      {/* User Profile Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <Avatar className="h-20 w-20">
                <AvatarFallback className={`text-2xl ${getRoleBadgeColor(user.role)}`}>
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold">{user.name}</h2>
                  <Badge className={getRoleBadgeColor(user.role)}>{user.role}</Badge>
                  {user.isVerified ? (
                    <Badge variant="outline" className="text-success border-success">
                      <ShieldCheck className="h-3 w-3 mr-1" /> Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-warning border-warning">
                      <UserX className="h-3 w-3 mr-1" /> Unverified
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Mail className="h-4 w-4" /> {user.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" /> Joined {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {user.isBanned && (
                  <Badge variant="destructive" className="mt-2">
                    <Ban className="h-3 w-3 mr-1" /> Banned
                  </Badge>
                )}
              </div>
              <div className="flex gap-2 ml-auto">
                {user.role !== 'ADMIN' && (
                  user.isBanned ? (
                    <Button variant="outline" onClick={() => setShowUnbanDialog(true)}>
                      <UserCheck className="h-4 w-4 mr-2" /> Unban User
                    </Button>
                  ) : (
                    <Button variant="destructive" onClick={() => setShowBanDialog(true)}>
                      <Ban className="h-4 w-4 mr-2" /> Ban User
                    </Button>
                  )
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats */}
      {user.role === 'INVESTOR' && (
        <div className="grid sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">${totalInvested.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Invested</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalShares.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Shares Owned</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                <Receipt className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{investments.length}</p>
                <p className="text-sm text-muted-foreground">Investments</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {user.role === 'DEVELOPER' && (
        <div className="grid sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <FolderOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{projects.length}</p>
                <p className="text-sm text-muted-foreground">Projects</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">${totalRaised.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Raised</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{projects.filter(p => p.status === 'APPROVED').length}</p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Activity Tabs */}
      {user.role === 'INVESTOR' && (
        <Tabs defaultValue="investments">
          <TabsList>
            <TabsTrigger value="investments" className="gap-2">
              <Receipt className="h-4 w-4" /> Investments ({investments.length})
            </TabsTrigger>
            <TabsTrigger value="access" className="gap-2">
              <ShieldCheck className="h-4 w-4" /> Access Requests ({accessRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="investments" className="mt-6">
            {investments.length === 0 ? (
              <EmptyState
                icon={<Receipt className="h-12 w-12" />}
                title="No investments"
                description="This user hasn't made any investments yet"
              />
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Shares</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {investments.map((investment) => {
                      const project = getProjectById(investment.projectId);
                      const canRefund = investment.status === 'APPROVED' || investment.status === 'PROCESSING';
                      const canWithdraw = investment.status === 'COMPLETED';
                      return (
                        <TableRow key={investment.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {project?.thumbnailUrl && (
                                <MediaImage 
                                  src={project.thumbnailUrl} 
                                  alt={project.title}
                                  className="w-10 h-10 rounded-lg object-cover"
                                />
                              )}
                              <span className="font-medium">{investment.projectTitle}</span>
                            </div>
                          </TableCell>
                          <TableCell>{investment.shares.toLocaleString()}</TableCell>
                          <TableCell><Money amount={investment.totalAmount} /></TableCell>
                          <TableCell><StatusBadge status={investment.status} /></TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(investment.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Link to={`/projects/${investment.projectId}`}>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              {canRefund && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openInvestmentAction(investment, 'refund')}
                                >
                                  Refund
                                </Button>
                              )}
                              {canWithdraw && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openInvestmentAction(investment, 'withdraw')}
                                >
                                  Withdraw
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

          <TabsContent value="access" className="mt-6">
            {accessRequests.length === 0 ? (
              <EmptyState
                icon={<ShieldCheck className="h-12 w-12" />}
                title="No access requests"
                description="This user hasn't requested any restricted data access"
              />
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accessRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.project_title || '-'}</TableCell>
                        <TableCell><StatusBadge status={request.status} /></TableCell>
                        <TableCell className="text-muted-foreground">
                          {request.created_at ? new Date(request.created_at).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>
                          <Link to={`/projects/${request.project}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      {user.role === 'DEVELOPER' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" /> Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <EmptyState
                icon={<FolderOpen className="h-12 w-12" />}
                title="No projects"
                description="This developer hasn't created any projects yet"
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Funded</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {project.thumbnailUrl && (
                            <MediaImage 
                              src={project.thumbnailUrl} 
                              alt={project.title}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <p className="font-medium">{project.title}</p>
                            <p className="text-xs text-muted-foreground">{project.category}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><StatusBadge status={project.status} /></TableCell>
                      <TableCell><Money amount={project.totalValue} /></TableCell>
                      <TableCell>{project.fundingProgress.toFixed(1)}%</TableCell>
                      <TableCell>
                        <Link to={`/projects/${project.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog
        open={showBanDialog}
        onOpenChange={(open) => {
          setShowBanDialog(open);
          if (!open) setBanResolution(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {activeInvestmentTotal > 0
                ? `Before banning ${user.name}, choose how to resolve their investments.`
                : `Are you sure you want to ban ${user.name}?`}
            </p>
            {activeInvestmentTotal > 0 && (
              <div className="grid gap-2 sm:grid-cols-3">
                <Button
                  variant={banResolution === 'refund' ? 'default' : 'outline'}
                  onClick={() => setBanResolution('refund')}
                >
                  Refund
                </Button>
                <Button
                  variant={banResolution === 'withdraw' ? 'default' : 'outline'}
                  onClick={() => setBanResolution('withdraw')}
                >
                  Withdraw
                </Button>
                <Button
                  variant={banResolution === 'reverse' ? 'default' : 'outline'}
                  onClick={() => setBanResolution('reverse')}
                >
                  Reverse
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBanDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBanUser}
              disabled={isBanSubmitting || (activeInvestmentTotal > 0 && !banResolution)}
            >
              {isBanSubmitting ? 'Processing...' : 'Ban User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unban Confirmation Dialog */}
      <ConfirmDialog
        open={showUnbanDialog}
        onOpenChange={setShowUnbanDialog}
        title="Unban User"
        description={`Are you sure you want to unban ${user.name}? They will regain access to the platform.`}
        confirmLabel="Unban User"
        onConfirm={handleUnbanUser}
      />

      <Dialog open={actionOpen} onOpenChange={setActionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'refund' ? 'Refund investment' : 'Withdraw investment'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="actionNote">Description (optional)</Label>
              <Textarea
                id="actionNote"
                value={actionNote}
                onChange={(event) => setActionNote(event.target.value)}
              />
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-border/60 p-3">
              <Checkbox
                id="actionAck"
                checked={actionAck}
                onCheckedChange={(checked) => setActionAck(checked === true)}
              />
              <Label htmlFor="actionAck" className="text-sm leading-relaxed">
                {actionType === 'refund'
                  ? 'I understand this will refund the investment back to the investor.'
                  : 'I understand this will withdraw the investment funds to the investor wallet.'}
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionOpen(false)} disabled={isActionSubmitting}>
              Cancel
            </Button>
            <Button
              variant={actionType === 'refund' ? 'destructive' : 'default'}
              onClick={handleInvestmentAction}
              disabled={!actionAck || isActionSubmitting}
            >
              {isActionSubmitting ? 'Submitting...' : actionType === 'refund' ? 'Refund' : 'Withdraw'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Eye,
  Mail,
  Calendar,
  ShieldCheck,
  UserCheck,
  UserX
} from 'lucide-react';
import { usersApi } from '@/lib/usersApi';
import { investmentsApi } from '@/lib/investmentsApi';
import { projectsApi } from '@/lib/projectsApi';
import type { Project, User, Investment } from '@/types';

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const [projectData, userData, investmentData] = await Promise.all([
          projectsApi.getAll(),
          usersApi.list(),
          investmentsApi.list(),
        ]);
        setProjects(projectData);
        setUsers(userData);
        setInvestments(investmentData);
      } catch (error) {
        console.error('Failed to load projects', error);
      }
    };

    loadProjects();
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(search.toLowerCase()) ||
                          user.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getUserStats = (user: User) => {
    if (user.role === 'INVESTOR') {
      const userInvestments = investments.filter(i => i.investorId === user.id);
      return {
        label: 'Investments',
        value: userInvestments.length,
        amount: userInvestments.reduce((sum, i) => sum + i.totalAmount, 0),
      };
    } else if (user.role === 'DEVELOPER') {
      const userProjects = projects.filter(p => p.developerId === user.id);
      return {
        label: 'Projects',
        value: userProjects.length,
        amount: userProjects.reduce((sum, p) => sum + (p.sharesSold * p.perSharePrice), 0),
      };
    }
    return null;
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-destructive/10 text-destructive';
      case 'DEVELOPER': return 'bg-primary/10 text-primary';
      case 'INVESTOR': return 'bg-accent/10 text-accent';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold">Users</h1>
        <p className="text-muted-foreground mt-1">Manage platform users and their access</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <UserCheck className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold">{users.filter(u => u.role === 'INVESTOR').length}</p>
              <p className="text-sm text-muted-foreground">Investors</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <UserCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{users.filter(u => u.role === 'DEVELOPER').length}</p>
              <p className="text-sm text-muted-foreground">Developers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{users.filter(u => u.isVerified).length}</p>
              <p className="text-sm text-muted-foreground">Verified</p>
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
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="DEVELOPER">Developer</SelectItem>
                <SelectItem value="INVESTOR">Investor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user, index) => (
              <motion.tr
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="border-b"
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className={getRoleBadgeColor(user.role)}>
                        {user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getRoleBadgeColor(user.role)}>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.isBanned ? (
                    <Badge variant="destructive">
                      <UserX className="h-3 w-3 mr-1" /> Banned
                    </Badge>
                  ) : user.isVerified ? (
                    <Badge variant="outline" className="text-success border-success">
                      <ShieldCheck className="h-3 w-3 mr-1" /> Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-warning border-warning">
                      <UserX className="h-3 w-3 mr-1" /> Unverified
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Link to={`/app/admin/users/${user.id}`}>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4 mr-1" /> View
                    </Button>
                  </Link>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* User Detail Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-md">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle>User Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className={`text-xl ${getRoleBadgeColor(selectedUser.role)}`}>
                      {selectedUser.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">{selectedUser.name}</h3>
                    <Badge className={getRoleBadgeColor(selectedUser.role)}>{selectedUser.role}</Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedUser.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Joined {new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {selectedUser.isVerified ? (
                      <>
                        <ShieldCheck className="h-4 w-4 text-success" />
                        <span className="text-success">Email Verified</span>
                      </>
                    ) : (
                      <>
                        <UserX className="h-4 w-4 text-warning" />
                        <span className="text-warning">Email Not Verified</span>
                      </>
                    )}
                  </div>
                </div>

                {getUserStats(selectedUser) && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-muted text-center">
                        <p className="text-2xl font-bold">{getUserStats(selectedUser)?.value}</p>
                        <p className="text-sm text-muted-foreground">{getUserStats(selectedUser)?.label}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted text-center">
                        <p className="text-2xl font-bold">${(getUserStats(selectedUser)?.amount || 0).toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Total Value</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

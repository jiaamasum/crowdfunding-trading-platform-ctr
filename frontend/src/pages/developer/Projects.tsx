import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';
import { Money } from '@/components/ui/money';
import { SharesProgress } from '@/components/ui/shares-progress';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Upload,
  Send,
  Archive,
  FolderKanban
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { projectsApi } from '@/lib/projectsApi';
import type { Project } from '@/types';
import type { ProjectStatus } from '@/types';

export default function DeveloperProjects() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projects, setProjects] = useState<Project[]>([]);

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

  const myProjects = projects.filter(p => 
    p.developerId === user?.id || p.developerName === user?.name
  );

  const filteredProjects = myProjects.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const canEdit = (status: ProjectStatus) => {
    return ['DRAFT', 'NEEDS_CHANGES', 'REJECTED'].includes(status);
  };

  const canSubmit = (status: ProjectStatus) => {
    return ['DRAFT', 'NEEDS_CHANGES'].includes(status);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">My Projects</h1>
          <p className="text-muted-foreground mt-1">Manage and track all your projects</p>
        </div>
        <Link to="/app/developer/projects/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Project
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
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
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PENDING_REVIEW">Pending Review</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="NEEDS_CHANGES">Needs Changes</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Projects Table */}
      {filteredProjects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="h-12 w-12" />}
          title="No projects found"
          description={myProjects.length === 0 ? "Create your first project to get started" : "Try adjusting your filters"}
          action={myProjects.length === 0 ? { label: 'Create Project', onClick: () => {} } : undefined}
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Shares</TableHead>
                <TableHead>Funds</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.map((project, index) => (
                <motion.tr
                  key={project.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img 
                        src={project.thumbnailUrl} 
                        alt={project.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <Link 
                          to={`/app/developer/projects/${project.id}`} 
                          className="font-medium hover:text-primary transition-colors line-clamp-1"
                        >
                          {project.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          <Money amount={project.perSharePrice} /> / share
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{project.category.replace('_', ' ')}</span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={project.status} />
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {project.sharesSold.toLocaleString()} / {project.totalShares.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Money amount={project.sharesSold * project.perSharePrice} className="font-medium" />
                  </TableCell>
                  <TableCell className="w-32">
                    <SharesProgress sold={project.sharesSold} total={project.totalShares} showLabel={false} />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/app/developer/projects/${project.id}`}>
                            <Eye className="h-4 w-4 mr-2" /> View
                          </Link>
                        </DropdownMenuItem>
                        {canEdit(project.status) && (
                          <DropdownMenuItem asChild>
                            <Link to={`/app/developer/projects/${project.id}/edit`}>
                              <Edit className="h-4 w-4 mr-2" /> Edit
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {canEdit(project.status) && (
                          <DropdownMenuItem asChild>
                            <Link to={`/app/developer/projects/${project.id}/media`}>
                              <Upload className="h-4 w-4 mr-2" /> Manage Media
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {canSubmit(project.status) && (
                          <DropdownMenuItem asChild>
                            <Link to={`/app/developer/projects/${project.id}/submit`}>
                              <Send className="h-4 w-4 mr-2" /> Submit for Review
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {project.status === 'APPROVED' && (
                          <DropdownMenuItem>
                            <Archive className="h-4 w-4 mr-2" /> Archive
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

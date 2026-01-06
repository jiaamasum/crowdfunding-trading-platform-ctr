import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Eye,
  ScrollText,
  User,
  Calendar
} from 'lucide-react';
import { auditLogsApi } from '@/lib/auditLogsApi';
import type { AuditLog } from '@/types';

const actionTypeColors: Record<string, string> = {
  'PROJECT_CREATED': 'bg-primary/10 text-primary',
  'PROJECT_UPDATED': 'bg-warning/10 text-warning',
  'PROJECT_SUBMITTED': 'bg-accent/10 text-accent',
  'PROJECT_APPROVED': 'bg-success/10 text-success',
  'PROJECT_REJECTED': 'bg-destructive/10 text-destructive',
  'PROJECT_ARCHIVED': 'bg-muted text-foreground',
  'ACCESS_REQUEST_CREATED': 'bg-accent/10 text-accent',
  'ACCESS_REQUEST_APPROVED': 'bg-success/10 text-success',
  'ACCESS_REQUEST_REJECTED': 'bg-destructive/10 text-destructive',
  'ACCESS_REQUEST_REVOKED': 'bg-destructive/10 text-destructive',
  'INVESTMENT_CREATED': 'bg-accent/10 text-accent',
  'PAYMENT_PROCESSED': 'bg-success/10 text-success',
  'USER_CREATED': 'bg-primary/10 text-primary',
  'USER_UPDATED': 'bg-warning/10 text-warning',
  'USER_DISABLED': 'bg-destructive/10 text-destructive',
};

export default function AuditLogs() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const data = await auditLogsApi.list();
        setLogs(data);
      } catch (error) {
        console.error('Failed to load audit logs', error);
      }
    };

    loadLogs();
  }, []);

  const actionTypes = [...new Set(logs.map(log => log.actionType))];

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.actorName.toLowerCase().includes(search.toLowerCase()) ||
                          log.actionType.toLowerCase().includes(search.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.actionType === actionFilter;
    return matchesSearch && matchesAction;
  });

  const formatActionType = (action: string) => {
    return action.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold">Audit Logs</h1>
        <p className="text-muted-foreground mt-1">Complete history of platform actions</p>
      </div>

      {/* Stats */}
      <Card>
        <CardContent className="pt-6 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
            <ScrollText className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-2xl font-bold">{logs.length}</p>
            <p className="text-sm text-muted-foreground">Total Log Entries</p>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {actionTypes.map(action => (
                  <SelectItem key={action} value={action}>
                    {formatActionType(action)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.map((log, index) => (
              <motion.tr
                key={log.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="border-b"
              >
                <TableCell>
                  <Badge className={actionTypeColors[log.actionType] || 'bg-muted text-foreground'}>
                    {formatActionType(log.actionType)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{log.actorName}</p>
                      <p className="text-xs text-muted-foreground">{log.actorRole}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {log.targetType}: {log.targetId}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(log.createdAt).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedLog(log)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Log Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-lg">
          {selectedLog && (
            <>
              <DialogHeader>
                <DialogTitle>Log Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-2">
                  <Badge className={actionTypeColors[selectedLog.actionType] || 'bg-muted text-foreground'}>
                    {formatActionType(selectedLog.actionType)}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Actor</p>
                    <p className="font-medium">{selectedLog.actorName}</p>
                    <p className="text-sm text-muted-foreground">{selectedLog.actorRole}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Timestamp</p>
                    <p className="font-medium">{new Date(selectedLog.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Target</p>
                  <p className="font-medium">{selectedLog.targetType}: {selectedLog.targetId}</p>
                </div>

                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Metadata</p>
                    <pre className="p-3 rounded-lg bg-muted text-sm overflow-auto">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

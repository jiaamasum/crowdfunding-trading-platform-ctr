import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Ban,
  Clock,
  Search
} from 'lucide-react';
import { accessRequestsApi, type AccessRequest as ApiAccessRequest } from '@/lib/accessRequestsApi';
import { useToast } from '@/hooks/use-toast';
type ActionType = 'approve' | 'reject' | 'revoke';

export default function AccessRequests() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<ApiAccessRequest | null>(null);
  const [actionType, setActionType] = useState<ActionType | null>(null);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requests, setRequests] = useState<ApiAccessRequest[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadRequests = async () => {
      try {
        const data = await accessRequestsApi.listAll();
        if (isMounted) {
          setRequests(data);
        }
      } catch (error) {
        if (!isMounted) return;
        toast({
          title: 'Failed to load access requests',
          description: error instanceof Error ? error.message : 'Please try again.',
          variant: 'destructive',
        });
      }
    };

    loadRequests();
    const interval = setInterval(loadRequests, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [toast]);

  const pendingRequests = requests.filter(ar => ar.status === 'PENDING');
  const processedRequests = requests.filter(ar => ar.status !== 'PENDING');

  const filteredPending = pendingRequests.filter(ar =>
    (ar.investor_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (ar.project_title || '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredProcessed = processedRequests.filter(ar =>
    (ar.investor_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (ar.project_title || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleAction = async () => {
    if (!selectedRequest || !actionType || !note.trim()) return;

    setIsSubmitting(true);
    try {
      await accessRequestsApi.decide(selectedRequest.id, actionType, note);
      const updated = await accessRequestsApi.listAll();
      setRequests(updated);
    } catch (error) {
      toast({
        title: 'Action failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(false);

    const actionText = actionType === 'approve' ? 'approved' : actionType === 'reject' ? 'rejected' : 'revoked';
    toast({
      title: `Access ${actionText}`,
      description: `Access request from ${selectedRequest.investor_name || 'investor'} has been ${actionText}.`,
    });

    setSelectedRequest(null);
    setActionType(null);
    setNote('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold">Access Requests</h1>
        <p className="text-muted-foreground mt-1">Manage investor requests for restricted project data</p>
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

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" /> Pending ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="processed" className="gap-2">
            <ShieldCheck className="h-4 w-4" /> Processed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {filteredPending.length === 0 ? (
            <EmptyState
              icon={<ShieldCheck className="h-12 w-12" />}
              title="No pending requests"
              description="All access requests have been processed"
            />
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Investor</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPending.map((request, index) => (
                      <motion.tr
                        key={request.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b"
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium">{request.investor_name || '-'}</p>
                            <p className="text-xs text-muted-foreground">{request.investor_email || '-'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="line-clamp-1">{request.project_title || '-'}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-muted-foreground line-clamp-2 max-w-xs">
                            {request.message || '-'}
                          </p>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {request.created_at ? new Date(request.created_at).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              className="gap-1 bg-success hover:bg-success/90"
                              onClick={() => { setSelectedRequest(request); setActionType('approve'); }}
                            >
                              <CheckCircle className="h-4 w-4" /> Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 text-destructive border-destructive hover:bg-destructive/10"
                              onClick={() => { setSelectedRequest(request); setActionType('reject'); }}
                            >
                              <XCircle className="h-4 w-4" /> Reject
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="processed" className="mt-6">
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Investor</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Admin Note</TableHead>
                    <TableHead>Processed</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProcessed.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{request.investor_name || '-'}</p>
                          <p className="text-xs text-muted-foreground">{request.investor_email || '-'}</p>
                        </div>
                      </TableCell>
                      <TableCell>{request.project_title || '-'}</TableCell>
                      <TableCell><StatusBadge status={request.status} /></TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground line-clamp-1 max-w-xs">
                          {request.admin_note || '-'}
                        </p>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {request.decided_at ? new Date(request.decided_at).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        {request.status === 'APPROVED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-destructive"
                            onClick={() => { setSelectedRequest(request); setActionType('revoke'); }}
                          >
                            <Ban className="h-4 w-4" /> Revoke
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Dialog */}
      <Dialog open={!!selectedRequest && !!actionType} onOpenChange={() => { setSelectedRequest(null); setActionType(null); setNote(''); }}>
        <DialogContent>
          {selectedRequest && actionType && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {actionType === 'approve' ? 'Approve Access' : actionType === 'reject' ? 'Reject Access' : 'Revoke Access'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="p-3 rounded-lg bg-muted space-y-2">
                  <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                    <span className="text-muted-foreground">Investor</span>
                    <span className="font-medium">{selectedRequest.investor_name || '-'}</span>
                  </div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                    <span className="text-muted-foreground">Project</span>
                    <span className="font-medium line-clamp-1">{selectedRequest.project_title || '-'}</span>
                  </div>
                </div>
                {selectedRequest.message && (
                  <div className="space-y-2">
                    <Label>Investor's Message</Label>
                    <p className="text-sm text-muted-foreground p-3 rounded-lg border">{selectedRequest.message}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Admin Note (Required)</Label>
                  <Textarea
                    placeholder={actionType === 'approve'
                      ? 'Add approval notes...'
                      : actionType === 'reject'
                        ? 'Explain why this request is being rejected...'
                        : 'Explain why access is being revoked...'}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setSelectedRequest(null); setActionType(null); setNote(''); }}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAction}
                  disabled={!note.trim() || isSubmitting}
                  className={actionType === 'approve' ? 'bg-success hover:bg-success/90' : 'bg-destructive hover:bg-destructive/90'}
                >
                  {isSubmitting ? 'Processing...' : 'Confirm'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

import apiClient from '@/lib/apiClient';
import type { AuditLog, ProjectLedgerEntry } from '@/types';

const mapAuditLog = (item: any): AuditLog => ({
  id: String(item.id),
  actionType: item.action_type,
  actorId: String(item.actor),
  actorName: item.actor_name || '',
  actorRole: item.actor_role || 'ADMIN',
  targetType: item.target_type,
  targetId: String(item.target_id),
  targetName: item.target_name || undefined,
  metadata: item.metadata || undefined,
  createdAt: item.created_at || new Date().toISOString(),
});

export const auditLogsApi = {
  async list(params?: { actionType?: string; targetType?: string; actor?: string }): Promise<AuditLog[]> {
    const response = await apiClient.get('/audit-logs/', {
      params: {
        action_type: params?.actionType,
        target_type: params?.targetType,
        actor: params?.actor,
      },
    });
    const results = Array.isArray(response.data.results) ? response.data.results : response.data;
    return results.map(mapAuditLog);
  },

  async listLedger(params?: { entryType?: string; project?: string; actor?: string }): Promise<ProjectLedgerEntry[]> {
    const response = await apiClient.get('/audit-logs/ledger/', {
      params: {
        entry_type: params?.entryType,
        project: params?.project,
        actor: params?.actor,
      },
    });
    const results = Array.isArray(response.data.results) ? response.data.results : response.data;
    return results.map((item: any) => ({
      id: String(item.id),
      entryType: item.entry_type,
      projectId: String(item.project),
      projectName: item.project_name || '',
      actorId: item.actor ? String(item.actor) : undefined,
      actorName: item.actor_name || undefined,
      metadata: item.metadata || undefined,
      createdAt: item.created_at || new Date().toISOString(),
    }));
  },
};

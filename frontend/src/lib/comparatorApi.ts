import apiClient from '@/lib/apiClient';

export type ComparatorResponse = {
  projects: Array<Record<string, any>>;
  metrics: Record<string, { min: number; max: number }>;
};

export const comparatorApi = {
  async compare(projectIds: string[]): Promise<ComparatorResponse> {
    const response = await apiClient.post('/projects/comparator/', {
      project_ids: projectIds.map((id) => Number(id)),
    });
    return response.data;
  },
};

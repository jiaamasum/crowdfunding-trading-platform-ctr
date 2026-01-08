import apiClient from '@/lib/apiClient';
import { normalizeMediaList, normalizeMediaUrl } from '@/lib/media';
import type { PaginatedResponse, Project, ProjectFilters, ProjectSortOption, ProjectArchiveRequest } from '@/types';

const computeDaysRemaining = (endDate?: string | null, durationDays?: number, startDate?: string | null) => {
  if (endDate) {
    const end = new Date(endDate).getTime();
    const diff = Math.ceil((end - Date.now()) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? diff : 0;
  }
  if (startDate && durationDays) {
    const end = new Date(startDate);
    end.setDate(end.getDate() + durationDays);
    const diff = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? diff : 0;
  }
  return undefined;
};

const mapRestrictedFields = (fields?: Record<string, string>) => {
  if (!fields) return undefined;
  return {
    financialProjections: fields.financial_projections,
    businessPlan: fields.business_plan,
    teamDetails: fields.team_details,
    legalDocuments: fields.legal_documents,
    riskAssessment: fields.risk_assessment,
  };
};

const mapProject = (item: any): Project => ({
  id: String(item.id),
  title: item.title,
  description: item.description || '',
  shortDescription: item.short_description || '',
  category: item.category,
  status: item.status,
  developerId: String(item.developer_id || ''),
  developerName: item.developer_name || '',
  totalValue: Number(item.total_value || 0),
  totalShares: Number(item.total_shares || 0),
  sharesSold: Number(item.shares_sold || 0),
  perSharePrice: Number(item.per_share_price || 0),
  remainingShares: Number(item.remaining_shares || 0),
  fundingProgress: Number(item.funding_progress || 0),
  durationDays: Number(item.duration_days || 0),
  startDate: item.start_date || undefined,
  endDate: item.end_date || undefined,
  daysRemaining: computeDaysRemaining(item.end_date, item.duration_days, item.start_date),
  thumbnailUrl: normalizeMediaUrl(item.thumbnail_url, 'project-media'),
  images: normalizeMediaList(Array.isArray(item.images) ? item.images.map((img: any) => img.image_url || img) : [], 'project-media'),
  has3DModel: Boolean(item.has_3d_model),
  model3DUrl: normalizeMediaUrl(item.model_3d_url, 'project-3d'),
  is3DPublic: Boolean(item.is_3d_public),
  hasRestrictedFields: Boolean(item.has_restricted_fields),
  restrictedFields: mapRestrictedFields(item.restricted_fields),
  createdAt: item.created_at || new Date().toISOString(),
  updatedAt: item.updated_at || item.created_at || new Date().toISOString(),
  submittedAt: item.submitted_at || undefined,
  reviewedAt: item.reviewed_at || undefined,
  reviewNote: item.review_note || undefined,
});

const mapArchiveRequest = (item: any): ProjectArchiveRequest => ({
  id: String(item.id),
  projectId: String(item.project),
  projectTitle: item.project_title || '',
  requestedBy: String(item.requested_by || ''),
  requestedByName: item.requested_by_name || '',
  status: item.status,
  reviewNote: item.review_note || undefined,
  createdAt: item.created_at || new Date().toISOString(),
  reviewedAt: item.reviewed_at || undefined,
  reviewedBy: item.reviewed_by ? String(item.reviewed_by) : undefined,
});

const sortProjects = (projects: Project[], sort?: ProjectSortOption) => {
  switch (sort) {
    case 'newest':
      return [...projects].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    case 'most_funded':
      return [...projects].sort((a, b) => b.fundingProgress - a.fundingProgress);
    case 'lowest_price':
      return [...projects].sort((a, b) => a.perSharePrice - b.perSharePrice);
    case 'highest_price':
      return [...projects].sort((a, b) => b.perSharePrice - a.perSharePrice);
    case 'ending_soon':
      return [...projects].sort((a, b) => (a.daysRemaining || 999) - (b.daysRemaining || 999));
    default:
      return projects;
  }
};

type FavoriteResponse = {
  id: string;
  project: any;
};

type CompareResponse = {
  id: string;
  project: any;
};

export const projectsApi = {
  async create(payload: {
    title: string;
    description: string;
    short_description: string;
    category: string;
    total_value: number;
    total_shares: number;
    duration_days: number;
    thumbnail_url?: string | null;
    images?: string[];
    has_3d_model?: boolean;
    model_3d_url?: string | null;
    is_3d_public?: boolean;
    has_restricted_fields?: boolean;
    financial_projections?: string | null;
    business_plan?: string | null;
    team_details?: string | null;
    legal_documents?: string | null;
    risk_assessment?: string | null;
  }): Promise<Project> {
    const response = await apiClient.post('/projects/', payload);
    return mapProject(response.data);
  },

  async update(id: string, payload: Record<string, unknown>): Promise<Project> {
    const response = await apiClient.patch(`/projects/${id}/`, payload);
    return mapProject(response.data);
  },

  async archive(id: string): Promise<{ project?: Project; archiveRequest?: ProjectArchiveRequest }> {
    const response = await apiClient.post(`/projects/${id}/archive/`);
    if (response.data?.project_title) {
      return { archiveRequest: mapArchiveRequest(response.data) };
    }
    return { project: mapProject(response.data) };
  },
  async list(
    filters?: ProjectFilters,
    sort?: ProjectSortOption,
    page: number = 1,
    pageSize: number = 12
  ): Promise<PaginatedResponse<Project>> {
    const orderingMap: Record<ProjectSortOption, string> = {
      newest: '-created_at',
      most_funded: '-funding_progress',
      lowest_price: 'per_share_price',
      highest_price: '-per_share_price',
      ending_soon: 'end_date',
    };

    const response = await apiClient.get('/projects/', {
      params: {
        search: filters?.search,
        category: filters?.category,
        status: filters?.status,
        min_progress: filters?.minProgress,
        max_progress: filters?.maxProgress,
        min_share_price: filters?.minSharePrice,
        max_share_price: filters?.maxSharePrice,
        min_total_value: filters?.minTotalValue,
        max_total_value: filters?.maxTotalValue,
        min_duration: filters?.minDuration,
        max_duration: filters?.maxDuration,
        ordering: sort ? orderingMap[sort] : undefined,
        page,
        page_size: pageSize,
      },
    });

    const results = Array.isArray(response.data.results) ? response.data.results : response.data;
    const total = response.data.count ?? results.length;
    const mapped = results.map(mapProject);
    const totalPages = pageSize > 0 ? Math.ceil(total / pageSize) : 1;

    return {
      data: mapped,
      total,
      page,
      pageSize,
      totalPages,
    };
  },

  async getAll(filters?: ProjectFilters, sort?: ProjectSortOption): Promise<Project[]> {
    const response = await projectsApi.list(filters, sort, 1, 500);
    return sortProjects(response.data, sort);
  },

  async getById(id: string): Promise<Project | null> {
    try {
      const response = await apiClient.get(`/projects/${id}/`);
      return mapProject(response.data);
    } catch {
      return null;
    }
  },

  async getMine(): Promise<Project[]> {
    const response = await apiClient.get('/projects/my/');
    const results = Array.isArray(response.data.results) ? response.data.results : response.data;
    return results.map(mapProject);
  },

  async getFavorites(): Promise<{ id: string; project: Project }[]> {
    const response = await apiClient.get('/projects/favorites/');
    const results = Array.isArray(response.data.results) ? response.data.results : response.data;
    return results.map((favorite: FavoriteResponse) => ({
      id: String(favorite.id),
      project: mapProject(favorite.project),
    }));
  },

  async addFavorite(projectId: string): Promise<void> {
    await apiClient.post('/projects/favorites/', { project: Number(projectId) });
  },

  async removeFavorite(projectId: string): Promise<void> {
    await apiClient.delete(`/projects/favorites/${projectId}/`);
  },

  async getCompare(): Promise<{ id: string; project: Project }[]> {
    const response = await apiClient.get('/projects/compare/');
    const results = Array.isArray(response.data.results) ? response.data.results : response.data;
    return results.map((item: CompareResponse) => ({
      id: String(item.id),
      project: mapProject(item.project),
    }));
  },

  async addCompare(projectId: string): Promise<void> {
    await apiClient.post('/projects/compare/', { project: Number(projectId) });
  },

  async removeCompare(projectId: string): Promise<void> {
    await apiClient.delete(`/projects/compare/${projectId}/`);
  },

  async listEditRequests(status?: string): Promise<any[]> {
    const response = await apiClient.get('/projects/edit-requests/', {
      params: status ? { status } : undefined,
    });
    const results = Array.isArray(response.data.results) ? response.data.results : response.data;
    return results;
  },

  async listArchiveRequests(status?: string): Promise<ProjectArchiveRequest[]> {
    const response = await apiClient.get('/projects/archive-requests/', {
      params: status ? { status } : undefined,
    });
    const results = Array.isArray(response.data.results) ? response.data.results : response.data;
    return results.map(mapArchiveRequest);
  },

  async reviewArchiveRequest(id: string, action: 'approve' | 'reject', reviewNote?: string): Promise<ProjectArchiveRequest> {
    const response = await apiClient.post(`/projects/archive-requests/${id}/review/`, {
      action,
      review_note: reviewNote,
    });
    return mapArchiveRequest(response.data);
  },

  async getEditRequest(id: string): Promise<any> {
    const response = await apiClient.get(`/projects/edit-requests/${id}/`);
    return response.data;
  },

  async createEditRequest(projectId: string, changes: Record<string, unknown>): Promise<any> {
    const response = await apiClient.post('/projects/edit-requests/', {
      project: Number(projectId),
      ...changes,
    });
    return response.data;
  },

  async reviewEditRequest(id: string, action: 'approve' | 'reject', reviewNote?: string): Promise<any> {
    const response = await apiClient.post(`/projects/edit-requests/${id}/review/`, {
      action,
      review_note: reviewNote,
    });
    return response.data;
  },
};

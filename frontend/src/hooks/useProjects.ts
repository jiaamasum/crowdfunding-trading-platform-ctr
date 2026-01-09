import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { projectsApi } from '@/lib/projectsApi';
import type { ProjectCategory, ProjectSortOption, ProjectFilters, Project } from '@/types';

// Query keys for cache management
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters: ProjectFilters, sort?: ProjectSortOption, page?: number, pageSize?: number) => 
    [...projectKeys.lists(), { filters, sort, page, pageSize }] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
  featured: () => [...projectKeys.all, 'featured'] as const,
};

// Hook for fetching paginated projects list
export function useProjectsList(
  filters?: ProjectFilters,
  sort?: ProjectSortOption,
  page: number = 1,
  pageSize: number = 12,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: projectKeys.list(filters || {}, sort, page, pageSize),
    queryFn: async () => {
      const response = await projectsApi.list(filters, sort, page, pageSize);
      return response;
    },
    enabled,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Hook for fetching a single project
export function useProject(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: async () => {
      const project = await projectsApi.getById(id);
      return project;
    },
    enabled: enabled && !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes for individual project
  });
}

// Hook for fetching featured projects (for landing page)
export function useFeaturedProjects(limit: number = 6) {
  return useQuery({
    queryKey: projectKeys.featured(),
    queryFn: async () => {
      const response = await projectsApi.list(undefined, 'newest', 1, limit);
      return response.data.filter(p => p.status === 'APPROVED').slice(0, limit);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - featured projects don't change often
  });
}

// Hook for prefetching project details (for hover/link prefetch)
export function usePrefetchProject() {
  const queryClient = useQueryClient();
  
  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: projectKeys.detail(id),
      queryFn: async () => {
        const project = await projectsApi.getById(id);
        return project;
      },
      staleTime: 1000 * 60 * 5,
    });
  };
}

// Hook for invalidating project caches (after mutations)
export function useInvalidateProjects() {
  const queryClient = useQueryClient();
  
  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: projectKeys.all }),
    invalidateList: () => queryClient.invalidateQueries({ queryKey: projectKeys.lists() }),
    invalidateDetail: (id: string) => queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) }),
    invalidateFeatured: () => queryClient.invalidateQueries({ queryKey: projectKeys.featured() }),
  };
}

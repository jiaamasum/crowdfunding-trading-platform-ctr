import { create } from 'zustand';
import { projectsApi } from '@/lib/projectsApi';

interface AppState {
  // Favorites
  favorites: string[]; // Project IDs
  addFavorite: (projectId: string) => void;
  removeFavorite: (projectId: string) => void;
  isFavorite: (projectId: string) => boolean;
  clearFavorites: () => void;
  setFavorites: (projectIds: string[]) => void;
  loadFavorites: () => Promise<void>;
  addFavoriteRemote: (projectId: string) => Promise<void>;
  removeFavoriteRemote: (projectId: string) => Promise<void>;
  
  // Comparator
  compareList: string[]; // Project IDs (2-4)
  addToCompare: (projectId: string) => boolean;
  removeFromCompare: (projectId: string) => void;
  isInCompare: (projectId: string) => boolean;
  clearCompare: () => void;
  canAddToCompare: () => boolean;
  loadCompare: () => Promise<void>;
  addToCompareRemote: (projectId: string) => Promise<boolean>;
  removeFromCompareRemote: (projectId: string) => Promise<void>;
  
  // Notifications
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  incrementUnread: () => void;
  decrementUnread: () => void;
  
  // Sidebar
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useAppStore = create<AppState>()((set, get) => ({
  // Favorites
  favorites: [],
  addFavorite: (projectId) => 
    set((state) => ({
      favorites: state.favorites.includes(projectId) 
        ? state.favorites 
        : [...state.favorites, projectId]
    })),
  removeFavorite: (projectId) =>
    set((state) => ({
      favorites: state.favorites.filter(id => id !== projectId)
    })),
  isFavorite: (projectId) => Array.isArray(get().favorites) && get().favorites.includes(projectId),
  clearFavorites: () => set({ favorites: [] }),
  setFavorites: (projectIds) => set({ favorites: projectIds }),
  loadFavorites: async () => {
    const favorites = await projectsApi.getFavorites();
    set({ favorites: favorites.map((favorite) => favorite.project.id) });
  },
  addFavoriteRemote: async (projectId) => {
    await projectsApi.addFavorite(projectId);
    get().addFavorite(projectId);
  },
  removeFavoriteRemote: async (projectId) => {
    await projectsApi.removeFavorite(projectId);
    get().removeFavorite(projectId);
  },
  
  // Comparator (max 4 projects)
  compareList: [],
  addToCompare: (projectId) => {
    const state = get();
    if (state.compareList.length >= 4 || state.compareList.includes(projectId)) {
      return false;
    }
    set({ compareList: [...state.compareList, projectId] });
    return true;
  },
  removeFromCompare: (projectId) =>
    set((state) => ({
      compareList: state.compareList.filter(id => id !== projectId)
    })),
  isInCompare: (projectId) => Array.isArray(get().compareList) && get().compareList.includes(projectId),
  clearCompare: () => set({ compareList: [] }),
  canAddToCompare: () => get().compareList.length < 4,
  loadCompare: async () => {
    const compare = await projectsApi.getCompare();
    set({ compareList: compare.map((item) => item.project.id) });
  },
  addToCompareRemote: async (projectId) => {
    if (!get().addToCompare(projectId)) {
      return false;
    }
    try {
      await projectsApi.addCompare(projectId);
      return true;
    } catch (error) {
      get().removeFromCompare(projectId);
      throw error;
    }
  },
  removeFromCompareRemote: async (projectId) => {
    await projectsApi.removeCompare(projectId);
    get().removeFromCompare(projectId);
  },
  
  // Notifications
  unreadCount: 3,
  setUnreadCount: (count) => set({ unreadCount: count }),
  incrementUnread: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
  decrementUnread: () => set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),
  
  // Sidebar
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
}));

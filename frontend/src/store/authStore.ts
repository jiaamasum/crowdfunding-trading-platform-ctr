import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import type { User, UserRole } from '@/types';
import apiClient, {
  clearTokens,
  clearSupabaseTokens,
  getAccessToken,
  getRefreshToken,
  setSupabaseTokens,
  setTokens,
} from '@/lib/apiClient';
import { normalizeMediaUrl } from '@/lib/media';
import { getFrontendUrl } from '@/lib/env';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<{ detail?: string }>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string, name: string, role: UserRole) => Promise<{ requiresVerification: boolean; detail?: string }>;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  updateUser: (updates: Partial<User>) => void;
  initialize: () => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<{ detail?: string }>;
  resetPassword: (email: string) => Promise<{ detail?: string }>;
  updatePasswordFromRecovery: (accessToken: string, password: string) => Promise<{ detail?: string }>;
  exchangeSupabaseSession: (accessToken: string, refreshToken?: string | null) => Promise<void>;
}

const transformUser = (data: any): User => ({
  id: String(data.id),
  email: data.email || '',
  name: data.name || data.email?.split('@')[0] || '',
  role: (data.role as UserRole) || 'INVESTOR',
  isVerified: Boolean(data.is_verified ?? data.isVerified),
  isBanned: Boolean(data.is_banned ?? data.isBanned),
  avatarUrl: normalizeMediaUrl(data.avatar_url || data.avatarUrl, 'users-profile-image'),
  walletBalance: data.wallet_balance ?? data.walletBalance,
  createdAt: data.date_joined || data.createdAt || new Date().toISOString(),
  updatedAt: data.updatedAt || data.date_joined || new Date().toISOString(),
});

const getErrorMessage = (error: unknown, fallback: string) => {
  if (!axios.isAxiosError(error)) {
    return (error as { message?: string })?.message || fallback;
  }

  const data = error.response?.data;
  if (!data) return fallback;

  if (typeof data === 'string') return data;
  if (typeof data.detail === 'string') return data.detail;

  const firstKey = Object.keys(data)[0];
  const firstValue = firstKey ? data[firstKey] : null;
  if (Array.isArray(firstValue)) {
    return firstValue[0] || fallback;
  }
  if (typeof firstValue === 'string') {
    return firstValue;
  }
  return fallback;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      initialize: async () => {
        try {
          set({ isLoading: true });

          const accessToken = getAccessToken();
          if (!accessToken) {
            set({ user: null, isAuthenticated: false, isLoading: false });
            return;
          }

          const response = await apiClient.get('/auth/me/');
          const user = transformUser(response.data);
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          console.error('Auth initialization error:', error);
          clearTokens();
          clearSupabaseTokens();
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      login: async (email, password) => {
        set({ isLoading: true });

        try {
          const tokenResponse = await apiClient.post('/auth/login/', {
            email,
            password,
          });
          setTokens(tokenResponse.data.tokens.access, tokenResponse.data.tokens.refresh);
          setSupabaseTokens(
            tokenResponse.data.supabase?.access_token,
            tokenResponse.data.supabase?.refresh_token
          );

          const userResponse = await apiClient.get('/auth/me/');
          const user = transformUser(userResponse.data);
          set({ user, isAuthenticated: true, isLoading: false });
          return { detail: tokenResponse.data.detail };
        } catch (error: any) {
          set({ isLoading: false });
          throw new Error(getErrorMessage(error, 'Login failed'));
        }
      },

      register: async (email, password, name, role) => {
        set({ isLoading: true });

        try {
          const response = await apiClient.post('/auth/register/', {
            email,
            password,
            password_confirm: password,
            name,
            role,
            redirect_to: `${getFrontendUrl()}/auth/callback`,
          });

          if (response.data.requires_verification) {
            set({ isLoading: false });
            return { requiresVerification: true, detail: response.data.detail };
          }

          setTokens(response.data.tokens.access, response.data.tokens.refresh);
          setSupabaseTokens(
            response.data.supabase?.access_token,
            response.data.supabase?.refresh_token
          );
          const user = transformUser(response.data.user);
          set({ user, isAuthenticated: true, isLoading: false });
          return { requiresVerification: false, detail: response.data.detail };
        } catch (error: any) {
          set({ isLoading: false });
          throw new Error(getErrorMessage(error, 'Registration failed'));
        }
      },

      loginWithGoogle: async () => {
        set({ isLoading: true });
        try {
          const response = await apiClient.get('/auth/oauth/google/', {
            params: { redirect_to: `${getFrontendUrl()}/auth/callback` },
          });
          window.location.href = response.data.auth_url;
        } catch (error: any) {
          set({ isLoading: false });
          throw new Error(getErrorMessage(error, 'Google login failed'));
        }
      },

      logout: async () => {
        try {
          const refresh = getRefreshToken();
          if (refresh) {
            await apiClient.post('/auth/logout/', { refresh });
          }
          clearTokens();
          clearSupabaseTokens();
          set({ user: null, isAuthenticated: false });
        } catch (error) {
          console.error('Logout error:', error);
          // Force logout on client side even if API call fails
          clearTokens();
          clearSupabaseTokens();
          set({ user: null, isAuthenticated: false });
        }
      },

      setLoading: (loading) => set({ isLoading: loading }),

      updateUser: (updates) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...updates } });
        }
      },

      resendVerificationEmail: async (email) => {
        try {
          const response = await apiClient.post('/auth/resend-confirmation/', {
            email,
            redirect_to: `${getFrontendUrl()}/auth/callback`,
          });
          return { detail: response.data.detail };
        } catch (error) {
          throw new Error(getErrorMessage(error, 'Failed to resend verification email'));
        }
      },

      resetPassword: async (email) => {
        try {
          const response = await apiClient.post('/auth/password-reset/', {
            email,
            redirect_to: `${getFrontendUrl()}/auth/reset-password`,
          });
          return { detail: response.data.detail };
        } catch (error) {
          throw new Error(getErrorMessage(error, 'Failed to send reset email'));
        }
      },

      updatePasswordFromRecovery: async (accessToken, password) => {
        try {
          const response = await apiClient.post('/auth/password-update/', {
            access_token: accessToken,
            password,
          });
          return { detail: response.data.detail };
        } catch (error) {
          throw new Error(getErrorMessage(error, 'Password update failed'));
        }
      },

      exchangeSupabaseSession: async (accessToken, refreshToken) => {
        set({ isLoading: true });
        try {
          const response = await apiClient.post('/auth/supabase/exchange/', {
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          setTokens(response.data.tokens.access, response.data.tokens.refresh);
          setSupabaseTokens(
            response.data.supabase?.access_token,
            response.data.supabase?.refresh_token
          );
          const user = transformUser(response.data.user);
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw new Error(getErrorMessage(error, 'Session exchange failed'));
        }
      },
    }),

    {
      name: 'auth-storage',
      deserialize: (value) => {
        try {
          return JSON.parse(value);
        } catch {
          return { state: {}, version: 0 };
        }
      },
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);

// Initialize auth on app load
useAuthStore.getState().initialize();

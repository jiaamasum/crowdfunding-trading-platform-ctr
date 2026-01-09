import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import type { User, UserRole } from '@/types';
import apiClient, {
  clearTokens,
  clearSupabaseTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from '@/lib/apiClient';
import { normalizeMediaUrl } from '@/lib/media';
import { getFrontendUrl } from '@/lib/env';

/**
 * Interface defining the Authentication State and Actions.
 * managing user sessions, login/logout, and registration flows.
 */
interface AuthState {
  /** The currently authenticated user object, or null if not logged in. */
  user: User | null;
  /** Boolean flag indicating if a valid user session exists. */
  isAuthenticated: boolean;
  /** Flag to indicate if an auth operation (login, register, fetch user) is in progress. */
  isLoading: boolean;

  // --- Actions ---

  /** Manually update the user state (e.g., after profile edit). */
  setUser: (user: User | null) => void;
  /**
   * Authenticate a user with email and password.
   * @returns A promise with an optional detail message on success.
   */
  login: (email: string, password: string) => Promise<{ detail?: string }>;
  /** Initiate the Google OAuth flow by redirecting to the backend authorization URL. */
  loginWithGoogle: () => Promise<void>;
  /**
   * Register a new user.
   * @returns Object indicating if email verification is required and a message.
   */
  register: (email: string, password: string, name: string, role: UserRole) => Promise<{ requiresVerification: boolean; detail?: string }>;
  /** Log out the user, clear tokens, and reset state. */
  logout: () => Promise<void>;
  /** Manually set the loading state (useful for external flows). */
  setLoading: (loading: boolean) => void;
  /** Update specific fields of the current user object. */
  updateUser: (updates: Partial<User>) => void;
  /**
   * Initialize the auth state on application load.
   * Checks for existing tokens and fetches the user profile if valid.
   */
  initialize: () => Promise<void>;
  /** Trigger a new verification email for unverified accounts. */
  resendVerificationEmail: (email: string) => Promise<{ detail?: string }>;
  /** request a password reset email. */
  resetPassword: (email: string) => Promise<{ detail?: string }>;
  /** Complete the password reset process using a recovery token. */
  updatePasswordFromRecovery: (accessToken: string, password: string) => Promise<{ detail?: string }>;
  /**
   * Exchange a Supabase session (from OAuth/Magic Link) for a backend session.
   * This bridges Supabase Auth on the frontend with the Django backend.
   */
  exchangeSupabaseSession: (accessToken: string, refreshToken?: string | null) => Promise<void>;
}

/**
 * Normalizes raw API user data into the frontend User interface.
 * Handles missing fields and ensures secure/valid URLs for media.
 * 
 * @param data - Raw JSON data from the API
 * @returns conforming User object
 */
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

/**
 * Extracts a user-friendly error message from various error formats.
 * Handles Axios responses, array-based errors, and plain strings.
 * 
 * @param error - The error object caught in try/catch
 * @param fallback - Default message if parsing fails
 */
const getErrorMessage = (error: unknown, fallback: string) => {
  if (!axios.isAxiosError(error)) {
    return (error as { message?: string })?.message || fallback;
  }

  const data = error.response?.data;
  if (!data) return fallback;

  if (typeof data === 'string') return data;
  if (typeof data.detail === 'string') return data.detail;

  // Handle Django REST Framework field errors (returns object with keys)
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

/**
 * Zustand Store for Authentication.
 * Persists user session across page reloads using localStorage.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true, // Start true to block valid rendering until init completes

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      /**
       * Initialization Logic:
       * 1. Checks if a valid JWT exists in storage.
       * 2. If valid, fetches the latest user profile from /auth/me/.
       * 3. Updates state accordingly.
       * 4. Clears state on any failure (invalid token).
       */
      initialize: async () => {
        try {
          set({ isLoading: true });
          clearSupabaseTokens(); // Ensure no mixed state with raw Supabase tokens

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
          // 1. Post credentials to backend
          const tokenResponse = await apiClient.post('/auth/login/', {
            email,
            password,
          });
          // 2. Save JWT tokens
          setTokens(tokenResponse.data.tokens.access, tokenResponse.data.tokens.refresh);
          clearSupabaseTokens();

          // 3. Fetch full user profile
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

          // Handle registration requiring email verification
          if (response.data.requires_verification) {
            set({ isLoading: false });
            return { requiresVerification: true, detail: response.data.detail };
          }

          // Direct login if verification not required (rare config)
          setTokens(response.data.tokens.access, response.data.tokens.refresh);
          clearSupabaseTokens();
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
          // Get the Google Auth URL from backend to ensure state/security params are generated there
          const response = await apiClient.get('/auth/oauth/google/', {
            params: { redirect_to: `${getFrontendUrl()}/auth/callback` },
          });
          // Redirect browser to Google
          window.location.href = response.data.auth_url;
        } catch (error: any) {
          set({ isLoading: false });
          throw new Error(getErrorMessage(error, 'Google login failed'));
        }
      },

      logout: async () => {
        try {
          // Attempt purely server-side logout (blacklist refresh token)
          const refresh = getRefreshToken();
          if (refresh) {
            await apiClient.post('/auth/logout/', { refresh });
          }
          clearTokens();
          clearSupabaseTokens();
          set({ user: null, isAuthenticated: false });
        } catch (error) {
          console.error('Logout error:', error);
          // Fallback: Always clear client state even if server fails
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
          clearSupabaseTokens();
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

// Initialize auth on app load to restore session if available
useAuthStore.getState().initialize();

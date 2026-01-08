import axios from 'axios';
import { getApiBaseUrl } from '@/lib/env';

const API_BASE_URL = getApiBaseUrl();

// Create axios instance with defaults
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Token management
export const getAccessToken = () => localStorage.getItem('access_token');
export const getRefreshToken = () => localStorage.getItem('refresh_token');
export const getSupabaseAccessToken = () => localStorage.getItem('supabase_access_token');
export const getSupabaseRefreshToken = () => localStorage.getItem('supabase_refresh_token');
export const setTokens = (access: string, refresh: string) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
};
export const setSupabaseTokens = (access?: string | null, refresh?: string | null) => {
    if (access) {
        localStorage.setItem('supabase_access_token', access);
    } else {
        localStorage.removeItem('supabase_access_token');
    }
    if (refresh) {
        localStorage.setItem('supabase_refresh_token', refresh);
    } else {
        localStorage.removeItem('supabase_refresh_token');
    }
};
export const clearTokens = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
};
export const clearSupabaseTokens = () => {
    localStorage.removeItem('supabase_access_token');
    localStorage.removeItem('supabase_refresh_token');
};

// Request interceptor - add auth token
apiClient.interceptors.request.use(
    (config) => {
        const skipAuthPaths = [
            '/auth/login/',
            '/auth/register/',
            '/auth/refresh/',
            '/auth/password-reset/',
            '/auth/password-update/',
            '/auth/resend-confirmation/',
            '/auth/supabase/exchange/',
        ];
        const requestUrl = config.url || '';
        const shouldSkipAuth = skipAuthPaths.some((path) => requestUrl.startsWith(path));
        const token = getAccessToken();
        if (token && !shouldSkipAuth) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If 401 and not already retrying, try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const refreshToken = getRefreshToken();
            if (refreshToken) {
                try {
                    const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
                        refresh: refreshToken,
                    });

                    const { access, refresh } = response.data;
                    setTokens(access, refresh || refreshToken);

                    originalRequest.headers.Authorization = `Bearer ${access}`;
                    return apiClient(originalRequest);
                } catch (refreshError) {
                    clearTokens();
                    window.location.href = '/auth/login';
                    return Promise.reject(refreshError);
                }
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;

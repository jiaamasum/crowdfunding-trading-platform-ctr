import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAuthStore } from './authStore';
import apiClient, { setTokens, clearTokens, clearSupabaseTokens } from '@/lib/apiClient';

// Mock apiClient and its named exports
vi.mock('@/lib/apiClient', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        default: {
            get: vi.fn(),
            post: vi.fn(),
        },
        setTokens: vi.fn(),
        clearTokens: vi.fn(),
        clearSupabaseTokens: vi.fn(),
        getAccessToken: vi.fn(() => 'mock-token'),
    };
});

describe('authStore', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useAuthStore.setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('initial state is correct', () => {
        const state = useAuthStore.getState();
        expect(state.user).toBeNull();
        expect(state.isAuthenticated).toBe(false);
    });

    it('login success updates state', async () => {
        const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' };
        const mockTokens = { access: 'access-token', refresh: 'refresh-token' };

        (apiClient.post as any).mockResolvedValueOnce({
            data: { tokens: mockTokens, detail: 'Success' },
        });
        (apiClient.get as any).mockResolvedValueOnce({
            data: mockUser,
        });

        await useAuthStore.getState().login('test@example.com', 'password');

        const state = useAuthStore.getState();
        expect(state.user).toEqual(expect.objectContaining({ email: 'test@example.com' }));
        expect(state.isAuthenticated).toBe(true);
        expect(state.isLoading).toBe(false);
        expect(setTokens).toHaveBeenCalledWith(mockTokens.access, mockTokens.refresh);
    });

    it('login failure handles errors', async () => {
        (apiClient.post as any).mockRejectedValueOnce({
            response: { data: { detail: 'Invalid credentials' } },
            isAxiosError: true,
        });

        await expect(useAuthStore.getState().login('wrong', 'pass')).rejects.toThrow('Invalid credentials');

        const state = useAuthStore.getState();
        expect(state.isAuthenticated).toBe(false);
        expect(state.isLoading).toBe(false);
    });

    it('logout clears state and tokens', async () => {
        // Setup logged in state
        useAuthStore.setState({ user: { id: '1' } as any, isAuthenticated: true });

        await useAuthStore.getState().logout();

        const state = useAuthStore.getState();
        expect(state.user).toBeNull();
        expect(state.isAuthenticated).toBe(false);
        expect(clearTokens).toHaveBeenCalled();
        expect(clearSupabaseTokens).toHaveBeenCalled();
    });
});

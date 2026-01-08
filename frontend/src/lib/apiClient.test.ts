import { describe, it, expect, vi, beforeEach } from 'vitest';
// setTokens and clearTokens are imported dynamically

// Use hoisted mocks to share state between the mock factory and tests
const { mockCreate, mockGet, mockPost, mockUseRequest, mockUseResponse, mockEject } = vi.hoisted(() => {
    const mockUseRequest = vi.fn();
    const mockUseResponse = vi.fn();
    const mockEject = vi.fn();

    const mockCreate = vi.fn(() => ({
        interceptors: {
            request: { use: mockUseRequest, eject: mockEject },
            response: { use: mockUseResponse, eject: mockEject },
        },
        defaults: { headers: { common: {} } },
        get: vi.fn(),
        post: vi.fn(),
    }));

    return {
        mockCreate,
        mockGet: vi.fn(),
        mockPost: vi.fn(),
        mockUseRequest,
        mockUseResponse,
        mockEject,
    };
});

// Mock axios
vi.mock('axios', async (importOriginal) => {
    const actual = await importOriginal() as any;

    // Create a mock for the default export that includes our specific create mock
    const mockAxios = {
        ...actual.default,
        create: mockCreate,
        isAxiosError: actual.isAxiosError,
    };

    // DEBUG: Ensure mock is running
    console.log('Axios mock factory executed');

    // Return both the named exports (if any) and the default export
    return {
        ...actual,
        default: mockAxios,
        // Also mock specific named exports if they exist and are used directly
        create: mockCreate,
        isAxiosError: actual.isAxiosError,
    };
});

// Import apiClient AFTER mocking (removed static import)
// import apiClient from './apiClient';

describe('apiClient', () => {
    let apiClient: any;

    beforeEach(async () => {
        vi.clearAllMocks();
        localStorage.clear();
        vi.resetModules(); // Ensure we get a fresh module execution

        // Re-setup the mock return value
        mockCreate.mockReturnValue({
            interceptors: {
                request: { use: mockUseRequest, eject: mockEject },
                response: { use: mockUseResponse, eject: mockEject },
            },
            defaults: { headers: { common: {} } },
            get: vi.fn(),
            post: vi.fn(),
        });

        // Dynamic import to trigger module execution after mock setup
        const module = await import('./apiClient');
        apiClient = module.default;
    });

    it('setTokens stores tokens in localStorage', async () => {
        const { setTokens } = await import('./apiClient');
        setTokens('access123', 'refresh123');
        expect(localStorage.getItem('access_token')).toBe('access123');
        expect(localStorage.getItem('refresh_token')).toBe('refresh123');
    });

    it('clearTokens removes tokens from localStorage', async () => {
        localStorage.setItem('access_token', 'a');
        localStorage.setItem('refresh_token', 'b');
        const { clearTokens } = await import('./apiClient');
        clearTokens();
        expect(localStorage.getItem('access_token')).toBeNull();
        expect(localStorage.getItem('refresh_token')).toBeNull();
    });

    it('request interceptor adds Authorization header', () => {
        // Did create get called?
        expect(mockCreate).toHaveBeenCalled();

        // Get the registered interceptor
        // The list of calls should be populated because apiClient runs on import
        expect(mockUseRequest).toHaveBeenCalled();
        const successHandler = mockUseRequest.mock.calls[0][0];

        localStorage.setItem('access_token', 'valid-token');
        const config = { headers: {}, url: '/api/test' };

        const result = successHandler(config);

        expect(result.headers.Authorization).toBe('Bearer valid-token');
    });

    it('request interceptor skips auth for listed paths', () => {
        expect(mockUseRequest).toHaveBeenCalled();
        const successHandler = mockUseRequest.mock.calls[0][0];

        localStorage.setItem('access_token', 'token');
        const config = { headers: {}, url: '/auth/login/' };

        const result = successHandler(config);

        expect(result.headers.Authorization).toBeUndefined();
    });
});

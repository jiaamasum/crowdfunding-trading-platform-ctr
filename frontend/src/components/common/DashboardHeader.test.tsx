import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardHeader from './DashboardHeader'; // Adjust import path if needed
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

// Mock auth store
vi.mock('@/store/authStore', () => ({
    useAuthStore: vi.fn(),
}));

// Mock ResizeObserver which is used by some UI components (like Radix primitives)
global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
};

describe('DashboardHeader', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders login button when not authenticated', () => {
        (useAuthStore as any).mockReturnValue({
            user: null,
            isAuthenticated: false,
            logout: vi.fn(),
        });

        render(
            <BrowserRouter>
                <DashboardHeader />
            </BrowserRouter>
        );

        expect(screen.getByText(/sign in/i)).toBeInTheDocument();
        expect(screen.queryByText(/sign out/i)).not.toBeInTheDocument();
    });

    it('renders user details when authenticated', () => {
        (useAuthStore as any).mockReturnValue({
            user: { name: 'Test User', email: 'test@example.com', avatarUrl: 'http://test.com/avatar.jpg' },
            isAuthenticated: true,
            logout: vi.fn(),
        });

        render(
            <BrowserRouter>
                <DashboardHeader />
            </BrowserRouter>
        );

        // Check for user initials or name depending on implementation
        // Adjust based on actual DashboardHeader implementation
        // Check for user initials (First letter of name)
        expect(screen.getByText('T')).toBeInTheDocument();
    });

    it.skip('calls logout when sign out is clicked', async () => {
        const user = userEvent.setup();
        const logoutMock = vi.fn();
        (useAuthStore as any).mockReturnValue({
            user: { name: 'Test User' },
            isAuthenticated: true,
            logout: logoutMock,
        });

        render(
            <BrowserRouter>
                <DashboardHeader />
            </BrowserRouter>
        );

        // Open dropdown
        const trigger = screen.getByText('T');
        await user.click(trigger);

        // Find logout button
        const logoutButton = await screen.findByText(/sign out/i);
        await user.click(logoutButton);

        expect(logoutMock).toHaveBeenCalled();
    });
});

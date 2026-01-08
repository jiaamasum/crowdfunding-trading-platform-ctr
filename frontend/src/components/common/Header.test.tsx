import { render, screen } from '@testing-library/react';
import Header from './Header';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

// Mock child components if necessary or wrap in router
describe('Header', () => {
    it('renders navigation links', () => {
        render(
            <BrowserRouter>
                <Header />
            </BrowserRouter>
        );
        expect(screen.getByText(/CrowdFund/i)).toBeInTheDocument(); // Assuming logo text
        // Add more specific assertions based on Header content
    });
});

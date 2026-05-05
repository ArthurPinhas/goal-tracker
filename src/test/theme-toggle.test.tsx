import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@/providers/ThemeProvider';
import ThemeToggle from '@/components/ThemeToggle';

describe('ThemeToggle', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add('dark');
    localStorage.removeItem('goal-tracker-theme');
  });

  it('persists theme to localStorage when toggled', async () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const btn = await screen.findByRole('button', { name: /Switch to light mode/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(localStorage.getItem('goal-tracker-theme')).toBe('light');
    });

    fireEvent.click(screen.getByRole('button', { name: /Switch to dark mode/i }));

    await waitFor(() => {
      expect(localStorage.getItem('goal-tracker-theme')).toBe('dark');
    });
  });
});

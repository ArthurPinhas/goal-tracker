import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import AddGoalDialog from '@/components/AddGoalDialog';

vi.mock('@/lib/sounds', () => ({
  playPop: vi.fn(),
  playEmojiSpark: vi.fn(),
  playRemove: vi.fn(),
}));

describe('AddGoalDialog UI', () => {
  it('renders the create form with title, emoji controls, description, and due date when open', async () => {
    render(<AddGoalDialog onAdd={vi.fn()} open onOpenChange={vi.fn()} />);

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeVisible();
    expect(within(dialog).getByRole('heading', { name: /create goal/i })).toBeInTheDocument();

    expect(within(dialog).getByLabelText(/^title$/i)).toBeInTheDocument();
    expect(within(dialog).getByPlaceholderText(/learn this guitar song/i)).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/^description$/i)).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/^notes$/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/^due date$/i)).toBeInTheDocument();

    expect(within(dialog).getByRole('button', { name: /shuffle/i })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /^pick$/i })).toBeInTheDocument();

    const create = within(dialog).getByRole('button', { name: /^create$/i });
    expect(create).toBeDisabled();

    fireEvent.change(within(dialog).getByLabelText(/^title$/i), { target: { value: 'My goal' } });
    expect(create).not.toBeDisabled();
  });
});

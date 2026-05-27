// tests/FeedbackModal.test.tsx — Phase 28 Plan 02
// TDD RED phase: tests for FeedbackModal component
// Tests cover: render, textarea, buttons, Verstuur flow, error path, Annuleren, Escape/outside-click

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Use vi.hoisted to declare mocks before vi.mock() factory runs (avoids TDZ)
const { mockOpen, mockBuildMailtoUrl } = vi.hoisted(() => ({
  mockOpen: vi.fn(),
  mockBuildMailtoUrl: vi.fn(),
}));

// Mock plugin-opener openUrl() — the actual export name in @tauri-apps/plugin-opener
vi.mock('@tauri-apps/plugin-opener', () => ({
  openUrl: mockOpen,
}));

// Mock buildMailtoUrl from utils/feedback
vi.mock('../utils/feedback', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils/feedback')>();
  return {
    ...actual,
    buildMailtoUrl: mockBuildMailtoUrl,
  };
});

import FeedbackModal from '../src/components/FeedbackModal';

describe('FeedbackModal — render', () => {
  it('renders the modal overlay', () => {
    render(<FeedbackModal onClose={vi.fn()} />);
    expect(screen.getByRole('heading', { name: /fout melden/i })).toBeTruthy();
  });

  it('renders a textarea with placeholder text', () => {
    render(<FeedbackModal onClose={vi.fn()} />);
    const textarea = screen.getByPlaceholderText(/beschrijf het probleem/i);
    expect(textarea).toBeTruthy();
  });

  it('renders "Verstuur" button', () => {
    render(<FeedbackModal onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: /verstuur/i })).toBeTruthy();
  });

  it('renders "Annuleren" button', () => {
    render(<FeedbackModal onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: /annuleren/i })).toBeTruthy();
  });

  it('Verstuur button is NOT disabled initially', () => {
    render(<FeedbackModal onClose={vi.fn()} />);
    const btn = screen.getByRole('button', { name: /verstuur/i });
    expect((btn as HTMLButtonElement).disabled).toBe(false);
  });

  it('does not show inline error initially', () => {
    render(<FeedbackModal onClose={vi.fn()} />);
    expect(screen.queryByText(/e-mail kon niet worden geopend/i)).toBeNull();
  });
});

describe('FeedbackModal — Annuleren', () => {
  it('calls onClose when Annuleren is clicked', () => {
    const onClose = vi.fn();
    render(<FeedbackModal onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /annuleren/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('FeedbackModal — Escape and outside-click', () => {
  it('calls onClose on Escape key', () => {
    const onClose = vi.fn();
    const { container } = render(<FeedbackModal onClose={onClose} />);
    // The overlay is the outermost div; fire keydown on it
    const overlay = container.firstChild as HTMLElement;
    fireEvent.keyDown(overlay, { key: 'Escape', code: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking the overlay (outside dialog)', () => {
    const onClose = vi.fn();
    const { container } = render(<FeedbackModal onClose={onClose} />);
    const overlay = container.firstChild as HTMLElement;
    // Simulate click where target === currentTarget (clicking the overlay itself)
    fireEvent.click(overlay, { target: overlay });
    // Note: jsdom may route this differently — check onClose was called
    expect(onClose).toHaveBeenCalled();
  });
});

describe('FeedbackModal — Verstuur success path', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBuildMailtoUrl.mockResolvedValue('mailto:test@example.com?subject=test&body=test');
    mockOpen.mockResolvedValue(undefined);
  });

  it('calls buildMailtoUrl with trimmed description and then open()', async () => {
    const onClose = vi.fn();
    render(<FeedbackModal onClose={onClose} />);

    const textarea = screen.getByPlaceholderText(/beschrijf het probleem/i);
    fireEvent.change(textarea, { target: { value: '  test probleem  ' } });

    fireEvent.click(screen.getByRole('button', { name: /verstuur/i }));

    await waitFor(() => {
      expect(mockBuildMailtoUrl).toHaveBeenCalledWith('test probleem');
    });
    await waitFor(() => {
      expect(mockOpen).toHaveBeenCalledWith('mailto:test@example.com?subject=test&body=test');
    });
  });

  it('calls onClose after successful Verstuur', async () => {
    const onClose = vi.fn();
    render(<FeedbackModal onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: /verstuur/i }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('disables Verstuur button while loading', async () => {
    let resolveOpen: () => void;
    mockOpen.mockReturnValue(
      new Promise<void>((res) => { resolveOpen = res; })
    );

    render(<FeedbackModal onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /verstuur/i }));

    // Button should be disabled while awaiting
    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /verstuur/i });
      expect((btn as HTMLButtonElement).disabled).toBe(true);
    });

    // Resolve and unblock
    resolveOpen!();
  });
});

describe('FeedbackModal — Verstuur failure path', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows inline error when open() throws', async () => {
    mockBuildMailtoUrl.mockResolvedValue('mailto:test@example.com');
    mockOpen.mockRejectedValue(new Error('OS protocol handler failed'));

    const onClose = vi.fn();
    render(<FeedbackModal onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: /verstuur/i }));

    await waitFor(() => {
      expect(screen.getByText(/e-mail kon niet worden geopend/i)).toBeTruthy();
    });
  });

  it('does NOT call onClose when open() throws', async () => {
    mockBuildMailtoUrl.mockResolvedValue('mailto:test@example.com');
    mockOpen.mockRejectedValue(new Error('fail'));

    const onClose = vi.fn();
    render(<FeedbackModal onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /verstuur/i }));

    await waitFor(() => {
      expect(screen.getByText(/e-mail kon niet worden geopend/i)).toBeTruthy();
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('preserves textarea content after failure', async () => {
    mockBuildMailtoUrl.mockResolvedValue('mailto:test@example.com');
    mockOpen.mockRejectedValue(new Error('fail'));

    render(<FeedbackModal onClose={vi.fn()} />);
    const textarea = screen.getByPlaceholderText(/beschrijf het probleem/i);
    fireEvent.change(textarea, { target: { value: 'mijn foutomschrijving' } });

    fireEvent.click(screen.getByRole('button', { name: /verstuur/i }));

    await waitFor(() => {
      expect(screen.getByText(/e-mail kon niet worden geopend/i)).toBeTruthy();
    });
    expect((textarea as HTMLTextAreaElement).value).toBe('mijn foutomschrijving');
  });

  it('re-enables Verstuur button after failure', async () => {
    mockBuildMailtoUrl.mockResolvedValue('mailto:test@example.com');
    mockOpen.mockRejectedValue(new Error('fail'));

    render(<FeedbackModal onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /verstuur/i }));

    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /verstuur/i });
      expect((btn as HTMLButtonElement).disabled).toBe(false);
    });
  });

  it('shows inline error when buildMailtoUrl throws', async () => {
    mockBuildMailtoUrl.mockRejectedValue(new Error('url build failed'));

    const onClose = vi.fn();
    render(<FeedbackModal onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /verstuur/i }));

    await waitFor(() => {
      expect(screen.getByText(/e-mail kon niet worden geopend/i)).toBeTruthy();
    });
    expect(onClose).not.toHaveBeenCalled();
  });
});

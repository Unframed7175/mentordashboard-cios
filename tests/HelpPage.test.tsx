// tests/HelpPage.test.tsx — Phase 30 Plan 01
// RED tests: HelpPage component does not exist yet — these tests fail at import/module resolution

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import HelpPage from '../src/components/HelpPage';

describe('HelpPage', () => {
  it('renders help heading', () => {
    render(<HelpPage onBack={() => {}} />);
    expect(screen.getByRole('heading', { name: /help/i })).toBeTruthy();
  });

  it('calls onBack when Terug is clicked', () => {
    const onBack = vi.fn();
    render(<HelpPage onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: /terug/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('renders importeren section', () => {
    render(<HelpPage onBack={() => {}} />);
    expect(screen.getByText(/importeren/i)).toBeTruthy();
  });

  it('renders fout melden section', () => {
    render(<HelpPage onBack={() => {}} />);
    expect(screen.getByText(/fout melden/i)).toBeTruthy();
  });
});

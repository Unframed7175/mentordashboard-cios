// tests/KlasTabStrip.test.tsx — Phase 17 Plan 03
// Covers: gear icon presence, onSettings callback, active class state, legacy import button removed

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import KlasTabStrip from '../src/components/KlasTabStrip';

describe('KlasTabStrip — gear icon (Phase 17)', () => {
  it('renders a button with aria-label "Instellingen openen"', () => {
    render(
      <KlasTabStrip
        klassen={[]}
        activeKlasId={null}
        onSwitch={vi.fn()}
        onCreateKlas={vi.fn()}
        onSettings={vi.fn()}
        isSettingsActive={false}
        isDark={false}
      />
    );
    expect(screen.getByRole('button', { name: 'Instellingen openen' })).toBeTruthy();
  });

  it('calls onSettings when gear button is clicked', () => {
    const onSettingsSpy = vi.fn();
    render(
      <KlasTabStrip
        klassen={[]}
        activeKlasId={null}
        onSwitch={vi.fn()}
        onCreateKlas={vi.fn()}
        onSettings={onSettingsSpy}
        isSettingsActive={false}
        isDark={false}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Instellingen openen' }));
    expect(onSettingsSpy).toHaveBeenCalledTimes(1);
  });

  it('gear button has "active" class when isSettingsActive is true', () => {
    render(
      <KlasTabStrip
        klassen={[]}
        activeKlasId={null}
        onSwitch={vi.fn()}
        onCreateKlas={vi.fn()}
        onSettings={vi.fn()}
        isSettingsActive={true}
        isDark={false}
      />
    );
    const gearBtn = screen.getByRole('button', { name: 'Instellingen openen' });
    expect(gearBtn.className).toContain('active');
  });

  it('does NOT render "↑ Importeer" text (legacy button removed)', () => {
    render(
      <KlasTabStrip
        klassen={[]}
        activeKlasId={null}
        onSwitch={vi.fn()}
        onCreateKlas={vi.fn()}
        onSettings={vi.fn()}
        isSettingsActive={false}
        isDark={false}
      />
    );
    expect(screen.queryByText(/↑ Importeer/)).toBeNull();
  });
});

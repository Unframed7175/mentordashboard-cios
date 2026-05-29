// tests/LeerlingTegel.test.tsx — Phase 32 Plan 01 (TEGEL-03, TEGEL-04)
// TDD RED: tests written before rnRow implementation exists.

import { vi, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Import AFTER any mocks (geen mocks vereist — LeerlingTegel is pure presentational)
import LeerlingTegel from '../src/components/LeerlingTegel';

const grijsStatus = { kleur: 'grijs' as const, label: 'Onbekend', prognose: null };

describe('LeerlingTegel — rnRow', () => {
  it('toont "R 2F" wanneer rekenResultaat="2F", nederlandsResultaat afwezig', () => {
    render(
      <LeerlingTegel
        student={{ naam: 'T', leerlingId: 'S1', rekenResultaat: '2F' }}
        status={grijsStatus}
        onClick={vi.fn()}
      />
    );
    expect(screen.getByText(/R 2F/)).toBeTruthy();
  });

  it('toont "N 3F" wanneer nederlandsResultaat="3F", rekenResultaat afwezig', () => {
    render(
      <LeerlingTegel
        student={{ naam: 'T', leerlingId: 'S1', nederlandsResultaat: '3F' }}
        status={grijsStatus}
        onClick={vi.fn()}
      />
    );
    expect(screen.getByText(/N 3F/)).toBeTruthy();
  });

  it('toont "R 2F · N 3F" als beide aanwezig zijn', () => {
    render(
      <LeerlingTegel
        student={{ naam: 'T', leerlingId: 'S1', rekenResultaat: '2F', nederlandsResultaat: '3F' }}
        status={grijsStatus}
        onClick={vi.fn()}
      />
    );
    expect(screen.getByText(/R 2F · N 3F/)).toBeTruthy();
  });

  it('verbergt de rij volledig als beide velden null/afwezig zijn (TEGEL-04)', () => {
    render(
      <LeerlingTegel
        student={{ naam: 'T', leerlingId: 'S1' }}
        status={grijsStatus}
        onClick={vi.fn()}
      />
    );
    expect(screen.queryByText(/^R |^N |· N/)).toBeNull();
  });
});

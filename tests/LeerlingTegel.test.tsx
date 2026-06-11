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

describe('LeerlingTegel — verzuim-uitroepteken (M35 feedback)', () => {
  it('toont het uitroepteken wanneer ongeoorloofd verzuim boven de drempel zit', () => {
    render(
      <LeerlingTegel
        student={{ naam: 'T', leerlingId: 'S1', verzuim: { aanwezigheid: 90, ongeoorloofd: 700, geoorloofd: 0 } }}
        status={grijsStatus}
        onClick={vi.fn()}
      />
    );
    expect(screen.getByRole('img', { name: 'Verzuim boven drempel' })).toBeTruthy();
  });

  it('toont het uitroepteken wanneer geoorloofd verzuim boven de drempel zit', () => {
    render(
      <LeerlingTegel
        student={{ naam: 'T', leerlingId: 'S1', verzuim: { aanwezigheid: 90, ongeoorloofd: 0, geoorloofd: 950 } }}
        status={grijsStatus}
        onClick={vi.fn()}
      />
    );
    expect(screen.getByRole('img', { name: 'Verzuim boven drempel' })).toBeTruthy();
  });

  it('verbergt het uitroepteken wanneer verzuim onder beide drempels blijft', () => {
    render(
      <LeerlingTegel
        student={{ naam: 'T', leerlingId: 'S1', verzuim: { aanwezigheid: 95, ongeoorloofd: 100, geoorloofd: 100 } }}
        status={grijsStatus}
        onClick={vi.fn()}
      />
    );
    expect(screen.queryByRole('img', { name: 'Verzuim boven drempel' })).toBeNull();
  });

  it('verbergt het uitroepteken wanneer verzuimdata ontbreekt', () => {
    render(
      <LeerlingTegel
        student={{ naam: 'T', leerlingId: 'S1' }}
        status={grijsStatus}
        onClick={vi.fn()}
      />
    );
    expect(screen.queryByRole('img', { name: 'Verzuim boven drempel' })).toBeNull();
  });
});

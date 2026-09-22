// tests/DetailWeergave.vestiging.test.tsx — M42 T7b: vestiging plumbing
//
// Pure-plumbing integration test for one of the 3 real call sites named in
// S01-PLAN.md T7b: proves that DetailWeergave resolves the active klas's
// effective vestiging (via the REAL getEffectieveVestiging()/detecteerVestiging()
// from utils/klassen.ts — not mocked) and forwards it as berekenStatus()'s 4th
// argument. berekenStatus itself is mocked/spied so this test only asserts the
// plumbing, not the (out-of-scope, still-inert) decision logic.

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

const { mockBerekenStatus, mockKlassenState } = vi.hoisted(() => ({
  mockBerekenStatus: vi.fn(),
  mockKlassenState: { klassen: {} as Record<string, any>, activeKlasId: null as string | null, onboardingCompleted: true },
}));

vi.mock('../src/utils/status', () => ({
  berekenStatus: mockBerekenStatus,
}));

// Use the REAL getEffectieveVestiging/detecteerVestiging (that's the chain
// under test) but replace klassenState/getAllRecordsForStudent so the test
// controls the active klas without touching the plugin-store singleton.
vi.mock('../utils/klassen', async () => {
  const actual = await vi.importActual<typeof import('../utils/klassen')>('../utils/klassen');
  return {
    ...actual,
    klassenState: mockKlassenState,
    getAllRecordsForStudent: (leerlingId: string) => {
      const klas = mockKlassenState.activeKlasId ? mockKlassenState.klassen[mockKlassenState.activeKlasId] : null;
      if (!klas) return [];
      return klas.students.filter((s: any) => s.leerlingId === leerlingId);
    },
  };
});

// Stub every child section — this test is only about the vestiging plumbing
// at the top of the component, not about rendering the full detail page.
vi.mock('../src/components/DoortstroomPrognoseSection', () => ({ default: () => null }));
vi.mock('../src/components/FeedbackActiepuntenSection', () => ({ default: () => null }));
vi.mock('../src/components/SpiderChartCard', () => ({ default: () => null }));
vi.mock('../src/components/DeelgebiedenMatrix', () => ({ default: () => null }));
vi.mock('../src/components/VerzuimSection', () => ({ default: () => null }));
vi.mock('../src/components/BpvProgressSection', () => ({ default: () => null }));
vi.mock('../src/components/RekenenNederlandsSection', () => ({ default: () => null }));
vi.mock('../src/components/KeuzedeelSection', () => ({ default: () => null }));
vi.mock('../src/components/TrajectVeldenSection', () => ({ default: () => null }));
vi.mock('../src/components/RoosendaalTrajectSection', () => ({ default: () => null }));

import DetailWeergave from '../src/components/DetailWeergave';

function makeStudent(overrides: Partial<any> = {}): any {
  return {
    leerlingId: 'L1',
    naam: 'Test Leerling',
    deelgebiedScores: {},
    datapunten: [],
    verzuim: null,
    periode: 'bj2 fase 2',
    leerjaar: '2',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockBerekenStatus.mockReturnValue({ kleur: 'grijs', label: 'Onbekend', prognose: {} });
  mockKlassenState.klassen = {};
  mockKlassenState.activeKlasId = null;
});

describe('DetailWeergave — vestiging plumbing (M42 T7b)', () => {

  it('passes the active klas effective vestiging (via detecteerVestiging on klasnaam) as berekenStatus 4th arg', () => {
    const student = makeStudent();
    mockKlassenState.klassen = {
      'klas-1': { id: 'klas-1', naam: 'CSG 2A', students: [student] }, // CSG prefix → 'goes'
    };
    mockKlassenState.activeKlasId = 'klas-1';

    render(
      <DetailWeergave leerlingId="L1" prevId={null} nextId={null} onNavigate={() => {}} onBack={() => {}} />
    );

    expect(mockBerekenStatus).toHaveBeenCalledTimes(1);
    expect(mockBerekenStatus).toHaveBeenCalledWith(student, undefined, undefined, 'goes');
  });

  it('passes an explicit vestigingOverride ahead of klasnaam-detection', () => {
    const student = makeStudent();
    mockKlassenState.klassen = {
      'klas-1': { id: 'klas-1', naam: 'CSG 2A', students: [student], vestigingOverride: 'roosendaal' },
    };
    mockKlassenState.activeKlasId = 'klas-1';

    render(
      <DetailWeergave leerlingId="L1" prevId={null} nextId={null} onNavigate={() => {}} onBack={() => {}} />
    );

    expect(mockBerekenStatus).toHaveBeenCalledWith(student, undefined, undefined, 'roosendaal');
  });

  it('passes null when there is no active klas (no vestiging to detect)', () => {
    const student = makeStudent();
    mockKlassenState.klassen = {
      'klas-1': { id: 'klas-1', naam: 'CSG 2A', students: [student] },
    };
    mockKlassenState.activeKlasId = null;

    render(
      <DetailWeergave leerlingId="L1" prevId={null} nextId={null} onNavigate={() => {}} onBack={() => {}} />
    );

    // getAllRecordsForStudent returns [] when there's no active klas, so the
    // component renders its "Leerling niet gevonden" early-return and never
    // calls berekenStatus at all.
    expect(mockBerekenStatus).not.toHaveBeenCalled();
    expect(screen.getByText('Leerling niet gevonden')).toBeTruthy();
  });

});

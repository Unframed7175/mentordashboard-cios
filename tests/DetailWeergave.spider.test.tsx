// tests/DetailWeergave.spider.test.tsx — M43 T4 (ADR-18 D2a, R4c)
//
// De spider chart toont de formule-eindoordelen (berekenEindoordelen) van het
// LAATSTE record van de leerling — geen samenvoeging over periodes heen en niet
// het opgeslagen latest-wins deelgebiedScores.

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { DEELGEBIEDEN } from '../utils/schema';

const { mockKlassenState, spiderProps } = vi.hoisted(() => ({
  mockKlassenState: { klassen: {} as Record<string, any>, activeKlasId: null as string | null, onboardingCompleted: true },
  spiderProps: [] as any[],
}));

vi.mock('../src/utils/status', () => ({
  berekenStatus: () => ({ kleur: 'grijs', label: 'Onbekend', prognose: {} }),
}));
vi.mock('../utils/klassen', async () => {
  const actual = await vi.importActual<typeof import('../utils/klassen')>('../utils/klassen');
  return {
    ...actual,
    klassenState: mockKlassenState,
    getAllRecordsForStudent: (leerlingId: string) => {
      const klas = mockKlassenState.activeKlasId ? mockKlassenState.klassen[mockKlassenState.activeKlasId] : null;
      return klas ? klas.students.filter((s: any) => s.leerlingId === leerlingId) : [];
    },
  };
});
vi.mock('../src/components/SpiderChartCard', () => ({
  default: (props: any) => { spiderProps.push(props); return null; },
}));
vi.mock('../src/components/DoortstroomPrognoseSection', () => ({ default: () => null }));
vi.mock('../src/components/FeedbackActiepuntenSection', () => ({ default: () => null }));
vi.mock('../src/components/DeelgebiedenMatrix', () => ({ default: () => null }));
vi.mock('../src/components/VerzuimSection', () => ({ default: () => null }));
vi.mock('../src/components/BpvProgressSection', () => ({ default: () => null }));
vi.mock('../src/components/RekenenNederlandsSection', () => ({ default: () => null }));
vi.mock('../src/components/KeuzedeelSection', () => ({ default: () => null }));
vi.mock('../src/components/TrajectVeldenSection', () => ({ default: () => null }));
vi.mock('../src/components/RoosendaalTrajectSection', () => ({ default: () => null }));

import DetailWeergave from '../src/components/DetailWeergave';

const [A, B] = DEELGEBIEDEN.map(dg => dg.label);

function dp(label: string, score: string) {
  return { vak: 'Resultaten', datapunt: `${label}-${score}`, scores: { [label]: score } };
}

beforeEach(() => {
  spiderProps.length = 0;
  mockKlassenState.klassen = {};
  mockKlassenState.activeKlasId = null;
});

describe('DetailWeergave — spider chart bron (M43)', () => {
  it('toont formule-eindoordelen van het laatste record; eerdere periode telt niet mee', () => {
    const oud = {
      leerlingId: 'L1', naam: 'X', periode: 'BJ1 DD ‐ 2026/2027', leerjaar: '1', verzuim: null,
      deelgebiedScores: { [A]: 'excellent', [B]: 'goed' },
      datapunten: [dp(A, 'excellent'), dp(B, 'goed')],
    };
    const nieuw = {
      leerlingId: 'L1', naam: 'X', periode: 'BJ2 DD ‐ 2026/2027', leerjaar: '2', verzuim: null,
      deelgebiedScores: { [A]: 'onvoldoende' },            // latest-wins-bron: O
      datapunten: [dp(A, 'goed'), dp(A, 'onvoldoende')],    // formule: G + O → V
    };
    mockKlassenState.klassen = { k1: { id: 'k1', naam: 'CSD 2A', students: [oud, nieuw] } };
    mockKlassenState.activeKlasId = 'k1';

    render(<DetailWeergave leerlingId="L1" prevId={null} nextId={null} onNavigate={() => {}} onBack={() => {}} />);

    expect(spiderProps.length).toBeGreaterThan(0);
    for (const props of spiderProps) {
      expect(props.scores[A]).toBe('voldoende');   // formule over laatste record
      expect(props.scores[B] ?? null).toBeNull();  // alleen in eerdere periode beoordeeld → leeg
    }
  });
});

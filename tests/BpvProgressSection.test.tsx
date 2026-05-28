// tests/BpvProgressSection.test.tsx — Phase 29 Plan 01 (FIX-02)
// TDD RED scaffold: tests written before loading-state implementation exists.
// Tests 1 and 2 are RED against the current BpvProgressSection (no loading state, old empty text).
// Test 3 is RED because the current component shows null-check empty state on initial render.
// All tests turn GREEN when Plan 29-02 ships the loading-state implementation.

import { vi, describe, test, expect, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// ── Mock bpv utils (hoisted before component import) ──────────────────────────
vi.mock('../utils/bpv', () => ({
  getBpvConfig: vi.fn(),
  getBpvData: vi.fn(),
  berekenBpvPct: vi.fn().mockReturnValue(60),
}));

// Import AFTER mock declarations
import BpvProgressSection from '../src/components/BpvProgressSection';
import { getBpvConfig, getBpvData } from '../utils/bpv';

const mockGetBpvConfig = getBpvConfig as ReturnType<typeof vi.fn>;
const mockGetBpvData = getBpvData as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Test 1: loading state ─────────────────────────────────────────────────────

test('loading state: shows BPV-data laden while data is fetching', () => {
  // Return a promise that never resolves — simulates pending async load.
  // renderToStaticMarkup captures the initial render (before useEffect runs),
  // so a loading state (useState(true)) should be visible in the initial snapshot.
  mockGetBpvConfig.mockReturnValue(new Promise(() => {}));
  mockGetBpvData.mockReturnValue(new Promise(() => {}));

  const html = renderToStaticMarkup(
    React.createElement(BpvProgressSection, { leerlingId: 'leerling-1' })
  );

  // RED: current component has no loading state — this text will not be present
  expect(html).toContain('BPV-data laden');
});

// ── Test 2: empty state text ─────────────────────────────────────────────────

test('empty state: shows correct empty-state message when no BPV data is available', () => {
  // Mock resolves with null/empty — simulates no BPV data imported.
  mockGetBpvConfig.mockResolvedValue(null);
  mockGetBpvData.mockResolvedValue({});

  const html = renderToStaticMarkup(
    React.createElement(BpvProgressSection, { leerlingId: 'leerling-1' })
  );

  // RED: current component shows "Nog geen stage-data — importeer de stage Excel via het importscherm."
  // The new (correct) text after FIX-02 ships is:
  expect(html).toContain('Geen stage-data — importeer de BPV Excel via het importscherm.');
});

// ── Test 3: data state ────────────────────────────────────────────────────────

test('data state: loading state is shown on initial render (not the empty-state message)', () => {
  // Mock with valid BpvConfig and BpvStudentRecord to simulate data that will load.
  const mockConfig = {
    doelUren: 200,
    verwachteUren: 200,
  };
  const mockData = {
    'leerling-1': {
      leerlingId: 'leerling-1',
      naam: 'Test Student',
      gerealiseerdeUren: 120,
      doelUren: 200,
      plaatsen: [],
      plaatsingen: [],
    },
  };

  mockGetBpvConfig.mockResolvedValue(mockConfig);
  mockGetBpvData.mockResolvedValue(mockData);

  const html = renderToStaticMarkup(
    React.createElement(BpvProgressSection, { leerlingId: 'leerling-1' })
  );

  // RED: current component has no loading state, so initial render shows bpvConfig=null → old empty state text.
  // After FIX-02 ships (loading: true initially), the initial render should show "BPV-data laden"
  // instead of the empty-state text, even when real data will eventually load.
  // This assertion is RED now because the current component renders the old empty-state text on initial render.
  expect(html).not.toContain('Nog geen stage-data');
});

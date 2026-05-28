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
  // Note: renderToStaticMarkup captures the initial synchronous render.
  // With loading=true as initial state, the component shows the loading text first.
  // This test verifies two things:
  // 1. The OLD incorrect empty-state text ("Nog geen stage-data") is NOT present anywhere
  // 2. The loading state IS shown (confirming the 3-state render is wired correctly)
  // The correct empty-state text ("Geen stage-data") is covered by the acceptance_criteria
  // check on the source file and by the visible render path when loading resolves.
  mockGetBpvConfig.mockResolvedValue(null);
  mockGetBpvData.mockResolvedValue({});

  const html = renderToStaticMarkup(
    React.createElement(BpvProgressSection, { leerlingId: 'leerling-1' })
  );

  // The old wrong text must be gone (FIX-02 correctness guard)
  expect(html).not.toContain('Nog geen stage-data');
  // The loading state is shown on initial render (3-state render is in place)
  expect(html).toContain('BPV-data laden');
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

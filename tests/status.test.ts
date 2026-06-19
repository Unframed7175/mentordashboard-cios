// ---------------------------------------------------------------------------
// status.test.ts — berekenStatus + detectTraject unit tests
// Covers berekenStatus outcomes: grijs/rood/oranje-Twijfelgeval/groen/blauw
// plus 2 detectTraject patterns (bj1/bj2).
// ---------------------------------------------------------------------------

import { berekenStatus, detectTraject, STATUS_VOLGORDE, computeKpiCounts } from '../src/utils/status';
import type { StatusResult } from '../src/utils/status';
import { appState } from '../utils/datamodel';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Minimal student record with optional overrides.
 * Default periode/leerjaar point to bj2 so berekenPrognose uses bj2 traject.
 */
function makeStudent(overrides: Partial<any> = {}): any {
  return {
    leerlingId:        'L1',
    naam:              'Test Leerling',
    deelgebiedScores:  {},
    datapunten:        [],
    verzuim:           null,
    periode:           'bj2 fase 2',
    leerjaar:          '2',
    ...overrides,
  };
}

/**
 * Build a deelgebiedScores object with all 19 CIOS deelgebied labels set to the same score.
 * Labels must match exactly what berekenPrognose indexes (the label field from DEELGEBIEDEN).
 */
function allScores(level: string | null): Record<string, string | null> {
  const labels = [
    'V&A', 'M&M', 'INS', 'O&DW', 'C&B', '1E&B',
    'P&O', 'S&O', 'ORG', 'I&B', '2E&B',
    'PrCo', 'VSK', 'LOB', 'INFO', 'DESK', 'BS', 'TOW', 'BH',
  ];
  return Object.fromEntries(labels.map((lbl) => [lbl, level]));
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  appState.students = [];
});

// ---------------------------------------------------------------------------
// berekenStatus tests
// ---------------------------------------------------------------------------

test('grijs: no scores → kleur=grijs, label=Onbekend', () => {
  // Empty deelgebiedScores means totaalVoldoendeOfHoger + totaalOnvoldoende === 0
  const student = makeStudent({ deelgebiedScores: {} });
  const result = berekenStatus(student);
  expect(result.kleur).toBe('grijs');
  expect(result.label).toBe('Onbekend');
});

test('rood: negatief prognose (7 onvoldoende) → kleur=rood, label=Risico', () => {
  // 7 onvoldoende scores triggers isNegatief (>6 threshold) → label='negatief'
  const scores = allScores('voldoende');
  const keys = Object.keys(scores).slice(0, 7);
  for (const k of keys) scores[k] = 'onvoldoende';
  const student = makeStudent({ deelgebiedScores: scores });
  const result = berekenStatus(student);
  expect(result.kleur).toBe('rood');
  expect(result.label).toBe('Risico');
});

test('oranje/Twijfelgeval: neutraal prognose (10 voldoende, not negatief) → kleur=oranje, label=Twijfelgeval', () => {
  // 10 voldoende → totaalVoldoendeOfHoger=10 which is <13 (neutraal for bj2) and not negatief
  const scores = allScores(null);
  const keys = Object.keys(scores).slice(0, 10);
  for (const k of keys) scores[k] = 'voldoende';
  const student = makeStudent({ deelgebiedScores: scores });
  const result = berekenStatus(student);
  expect(result.kleur).toBe('oranje');
  expect(result.label).toBe('Twijfelgeval');
});

test('groen/SBL: hoog verzuim beïnvloedt kleur NIET meer (verzuim als ring, niet kleur)', () => {
  // T02: verzuim is no longer a color override — shown as box-shadow ring on tile instead.
  // 13 voldoende → sbl → groen/SBL regardless of ongeoorloofd hours.
  const scores = allScores(null);
  const keys = Object.keys(scores).slice(0, 13);
  for (const k of keys) scores[k] = 'voldoende';
  const student = makeStudent({
    deelgebiedScores: scores,
    verzuim:          { aanwezigheid: 0, geoorloofd: 0, ongeoorloofd: 601 },
  });
  const result = berekenStatus(student);
  expect(result.kleur).toBe('groen');
  expect(result.label).toBe('SBL');
});

test('groen/SBL: sbl prognose (13 voldoende) → kleur=groen, label=SBL', () => {
  // 13 voldoende → sbl for bj2 traject
  const scores = allScores(null);
  const keys = Object.keys(scores).slice(0, 13);
  for (const k of keys) scores[k] = 'voldoende';
  const student = makeStudent({ deelgebiedScores: scores });
  const result = berekenStatus(student);
  expect(result.kleur).toBe('groen');
  expect(result.label).toBe('SBL');
});

// ---------------------------------------------------------------------------
// detectTraject tests
// ---------------------------------------------------------------------------

test('detectTraject: periode="bj1 fase 1" → "bj1"', () => {
  const result = detectTraject({ periode: 'bj1 fase 1', leerjaar: '1' });
  expect(result).toBe('bj1');
});

test('detectTraject: periode="2e jaar" → "bj2"', () => {
  const result = detectTraject({ periode: '2e jaar', leerjaar: '2' });
  expect(result).toBe('bj2');
});

// ---------------------------------------------------------------------------
// STATUS_VOLGORDE smoke test
// ---------------------------------------------------------------------------

test('STATUS_VOLGORDE: rood < oranje < groen < paars < blauw < grijs', () => {
  expect(STATUS_VOLGORDE['rood']).toBeLessThan(STATUS_VOLGORDE['oranje']);
  expect(STATUS_VOLGORDE['oranje']).toBeLessThan(STATUS_VOLGORDE['groen']);
  expect(STATUS_VOLGORDE['groen']).toBeLessThan(STATUS_VOLGORDE['paars']);
  expect(STATUS_VOLGORDE['paars']).toBeLessThan(STATUS_VOLGORDE['blauw']);
  expect(STATUS_VOLGORDE['blauw']).toBeLessThan(STATUS_VOLGORDE['grijs']);
});

// ---------------------------------------------------------------------------
// berekenStatus thresholds — Phase 18 RED tests
// These tests FAIL until 18-03 adds the thresholds parameter and geoorloofd check.
// ---------------------------------------------------------------------------

describe('berekenStatus thresholds (Phase 18)', () => {

  // Helper: 13 voldoende scores → positive prognose (sbl label for bj2)
  function makePositiveStudent(verzuim?: { aanwezigheid: number; geoorloofd: number; ongeoorloofd: number }): any {
    const scores = allScores(null);
    const keys = Object.keys(scores).slice(0, 13);
    for (const k of keys) scores[k] = 'voldoende';
    return makeStudent({ deelgebiedScores: scores, verzuim: verzuim ?? null });
  }

  it('T02: hoog ongeoorloofd verzuim verandert kleur NIET — altijd prognose-driven (ring op tegel)', () => {
    // T02: verzuim is no longer a color override. 13 voldoende → sbl → groen/SBL
    // regardless of ongeoorloofd hours exceeding the threshold.
    const student = makePositiveStudent({ aanwezigheid: 0, geoorloofd: 0, ongeoorloofd: 700 });

    const result = berekenStatus(student, undefined, { geoorloofd: 1500, ongeoorloofd: 600 });

    expect(result.kleur).toBe('groen');
    expect(result.label).toBe('SBL');
  });

  it('T02: hoog geoorloofd verzuim verandert kleur NIET — altijd prognose-driven', () => {
    // T02: verzuim color override removed. 13 voldoende → sbl → groen/SBL
    const student = makePositiveStudent({ aanwezigheid: 0, geoorloofd: 1000, ongeoorloofd: 0 });

    const result = berekenStatus(student, undefined, { geoorloofd: 900, ongeoorloofd: 600 });

    expect(result.kleur).toBe('groen');
    expect(result.label).toBe('SBL');
  });

  it('T02: verzuim boven standaard drempel → kleur blijft groen/SBL (ring zichtbaar op tegel)', () => {
    // T02: color no longer changes for high verzuim — ring is shown instead.
    const student = makePositiveStudent({ aanwezigheid: 0, geoorloofd: 0, ongeoorloofd: 601 });

    const result = berekenStatus(student);

    expect(result.kleur).toBe('groen');
    expect(result.label).toBe('SBL');
  });

  it('prognose-driven status: laag verzuim → groen/SBL', () => {
    // Both ongeoorloofd=10 and geoorloofd=10 are well below thresholds
    // 13 voldoende → sbl → groen/SBL
    const student = makePositiveStudent({ aanwezigheid: 0, geoorloofd: 10, ongeoorloofd: 10 });

    const result = berekenStatus(student, undefined, { geoorloofd: 900, ongeoorloofd: 600 });

    expect(result.kleur).toBe('groen');
    expect(result.label).toBe('SBL');
  });

});

describe('berekenStatus keuzedelen (Phase 39)', () => {

  function makeSbcStudent(keuzedelen?: any[]): any {
    return makeStudent({
      deelgebiedScores: allScores('voldoende'),
      keuzedelen: keuzedelen ?? [],
    });
  }

  function makeBj1Student(keuzedelen?: any[]): any {
    return makeStudent({
      periode: 'bj1 fase 2',
      leerjaar: '1',
      deelgebiedScores: allScores('voldoende'),
      keuzedelen: keuzedelen ?? [],
    });
  }

  const kdBehaald     = [{ id: '1', naam: 'KD Sport', status: 'behaald'      }];
  const kdHaalbaar    = [{ id: '1', naam: 'KD Sport', status: 'haalbaar'     }];
  const kdNietBehaald = [{ id: '1', naam: 'KD Sport', status: 'niet_behaald' }];

  it('sbc + behaald KD → blauw / SBC (geen downgrade)', () => {
    const result = berekenStatus(makeSbcStudent(kdBehaald));
    expect(result.kleur).toBe('blauw');
    expect(result.label).toBe('SBC');
  });

  it('sbc + haalbaar KD → oranje / Let op — KD (SBC vereist behaald)', () => {
    const result = berekenStatus(makeSbcStudent(kdHaalbaar));
    expect(result.kleur).toBe('oranje');
    expect(result.label).toBe('Let op — KD');
  });

  it('sbc + niet_behaald KD → oranje / Let op — KD', () => {
    const result = berekenStatus(makeSbcStudent(kdNietBehaald));
    expect(result.kleur).toBe('oranje');
    expect(result.label).toBe('Let op — KD');
  });

  it('sbc + geen keuzedelen → blauw / SBC (null = geen downgrade)', () => {
    const result = berekenStatus(makeSbcStudent([]));
    expect(result.kleur).toBe('blauw');
    expect(result.label).toBe('SBC');
  });

  it('sbl + niet_behaald KD → groen / SBL (SBL heeft geen KD-eis)', () => {
    const scores = allScores(null);
    const keys = Object.keys(scores).slice(0, 13);
    for (const k of keys) scores[k] = 'voldoende';
    const student = makeStudent({ deelgebiedScores: scores, keuzedelen: kdNietBehaald });
    const result = berekenStatus(student);
    expect(result.kleur).toBe('groen');
    expect(result.label).toBe('SBL');
  });

  it('naar_bj2 + niet_behaald KD → oranje / Let op — KD', () => {
    const result = berekenStatus(makeBj1Student(kdNietBehaald));
    expect(result.kleur).toBe('oranje');
    expect(result.label).toBe('Let op — KD');
  });

  it('naar_bj2 + haalbaar KD → groen / Naar BJ2 (haalbaar volstaat voor BJ2)', () => {
    const result = berekenStatus(makeBj1Student(kdHaalbaar));
    expect(result.kleur).toBe('groen');
    expect(result.label).toBe('Naar BJ2');
  });

});

// ---------------------------------------------------------------------------
// computeKpiCounts — KPI-strip aggregatie (T-2026-06-18-07 regressie)
// ---------------------------------------------------------------------------

describe('computeKpiCounts', () => {
  const s = (kleur: StatusResult['kleur'], label = ''): StatusResult =>
    ({ kleur, label, prognose: null });

  it('telt op kleur, niet op labeltekst — alle oranje vallen onder "Let op"', () => {
    // Regressie: de oude code filterde op label === "Let op"/"Verzuim", strings die
    // berekenStatus niet meer produceert; "Let op" en "Verzuim" stonden daardoor altijd op 0.
    const statuses = [
      s('oranje', 'Twijfelgeval'),
      s('oranje', 'Let op — KD'),
      s('rood', 'Risico'),
      s('groen', 'SBL'),
      s('blauw', 'SBC'),
      s('grijs', 'Onbekend'),
    ];
    const k = computeKpiCounts(statuses, statuses.length);
    expect(k.letOpCount).toBe(2);       // beide oranje, ongeacht label
    expect(k.risicoCount).toBe(1);
    expect(k.opSchemaCount).toBe(2);    // groen + blauw
    expect(k.grijsCount).toBe(1);
    expect(k.scoredCount).toBe(5);      // 6 − 1 grijs
    expect(k.pctOpSchema).toBe(40);     // round(2/5 * 100)
  });

  it('pctOpSchema is null wanneer er geen beoordeelde leerlingen zijn', () => {
    const k = computeKpiCounts([s('grijs'), s('grijs')], 2);
    expect(k.pctOpSchema).toBeNull();
    expect(k.scoredCount).toBe(0);
    expect(k.letOpCount).toBe(0);
  });

  it('telt paars mee als "op schema" (forward-compat)', () => {
    const k = computeKpiCounts([s('paars', 'SBC')], 1);
    expect(k.opSchemaCount).toBe(1);
    expect(k.pctOpSchema).toBe(100);
  });

  it('lege invoer → alle tellers 0 en pctOpSchema null', () => {
    const k = computeKpiCounts([], 0);
    expect(k).toEqual({ opSchemaCount: 0, letOpCount: 0, risicoCount: 0, grijsCount: 0, scoredCount: 0, pctOpSchema: null });
  });
});

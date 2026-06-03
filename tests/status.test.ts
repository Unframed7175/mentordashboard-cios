// ---------------------------------------------------------------------------
// status.test.ts — berekenStatus + detectTraject unit tests
// Covers all 5 berekenStatus outcomes (grijs/rood/oranje-Let op/oranje-Verzuim/groen)
// plus 2 detectTraject patterns (bj1/bj2).
// ---------------------------------------------------------------------------

import { berekenStatus, detectTraject, STATUS_VOLGORDE } from '../src/utils/status';
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

test('oranje/Let op: neutraal prognose (10 voldoende, not negatief) → kleur=oranje, label=Let op', () => {
  // 10 voldoende → totaalVoldoendeOfHoger=10 which is <13 (neutraal for bj2) and not negatief
  const scores = allScores(null);
  const keys = Object.keys(scores).slice(0, 10);
  for (const k of keys) scores[k] = 'voldoende';
  const student = makeStudent({ deelgebiedScores: scores });
  const result = berekenStatus(student);
  expect(result.kleur).toBe('oranje');
  expect(result.label).toBe('Let op');
});

test('oranje/Verzuim: ongeoorloofd=601 with positive prognose → kleur=oranje, label=Verzuim', () => {
  // 13 voldoende → prognose.label='sbl' (positive, bj2)
  // neutraal check passes (sbl is not neutraal), then verzuim check fires because ongeoorloofd > 600
  const scores = allScores(null);
  const keys = Object.keys(scores).slice(0, 13);
  for (const k of keys) scores[k] = 'voldoende';
  const student = makeStudent({
    deelgebiedScores: scores,
    verzuim:          { aanwezigheid: 0, geoorloofd: 0, ongeoorloofd: 601 },
  });
  const result = berekenStatus(student);
  expect(result.kleur).toBe('oranje');
  expect(result.label).toBe('Verzuim');
});

test('groen: sbl prognose (13 voldoende, no verzuim) → kleur=groen, label=Op koers', () => {
  // 13 voldoende → sbl for bj2 traject; no verzuim
  const scores = allScores(null);
  const keys = Object.keys(scores).slice(0, 13);
  for (const k of keys) scores[k] = 'voldoende';
  const student = makeStudent({ deelgebiedScores: scores });
  const result = berekenStatus(student);
  expect(result.kleur).toBe('groen');
  expect(result.label).toBe('Op koers');
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

  it('returns oranje/Verzuim when ongeoorloofd exceeds custom threshold', () => {
    // ongeoorloofd = 700 > threshold of 600 → Verzuim
    // Prognose is positive (sbl) so without verzuim check it would be groen/Op koers
    const student = makePositiveStudent({ aanwezigheid: 0, geoorloofd: 0, ongeoorloofd: 700 });

    const result = berekenStatus(student, undefined, { geoorloofd: 1500, ongeoorloofd: 600 });

    expect(result.kleur).toBe('oranje');
    expect(result.label).toBe('Verzuim');
  });

  it('returns oranje/Verzuim when geoorloofd exceeds custom geoorloofd threshold', () => {
    // geoorloofd = 1000 > threshold of 900 → Verzuim (new check added in Phase 18)
    // ongeoorloofd = 0 → would not trigger the ongeoorloofd check
    const student = makePositiveStudent({ aanwezigheid: 0, geoorloofd: 1000, ongeoorloofd: 0 });

    const result = berekenStatus(student, undefined, { geoorloofd: 900, ongeoorloofd: 600 });

    expect(result.kleur).toBe('oranje');
    expect(result.label).toBe('Verzuim');
  });

  it('uses runtime thresholds via getVerzuimDrempelsSync when arg omitted', () => {
    // getVerzuimDrempelsSync() returns DEFAULT_VERZUIM_DREMPELS = { geoorloofd: 900, ongeoorloofd: 600 }
    // when cache is cold (no store write has occurred). A student with ongeoorloofd=601
    // exceeds the default ongeoorloofd threshold of 600 and should trigger Verzuim
    // even without an explicit thresholds argument — proving the internal sync fallback works.
    const student = makePositiveStudent({ aanwezigheid: 0, geoorloofd: 0, ongeoorloofd: 601 });

    // Call WITHOUT third arg — must use getVerzuimDrempelsSync() internally
    const result = berekenStatus(student);

    expect(result.kleur).toBe('oranje');
    expect(result.label).toBe('Verzuim');
  });

  it('returns prognose-driven status when both verzuim values stay under thresholds', () => {
    // Both ongeoorloofd=10 and geoorloofd=10 are well below thresholds → no Verzuim
    // 13 voldoende → sbl → groen/Op koers
    const student = makePositiveStudent({ aanwezigheid: 0, geoorloofd: 10, ongeoorloofd: 10 });

    const result = berekenStatus(student, undefined, { geoorloofd: 900, ongeoorloofd: 600 });

    expect(result.kleur).toBe('groen');
    expect(result.label).toBe('Op koers');
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

  it('sbc + behaald KD → paars / Profieljaar SBC (geen downgrade)', () => {
    const result = berekenStatus(makeSbcStudent(kdBehaald));
    expect(result.kleur).toBe('paars');
    expect(result.label).toBe('Profieljaar SBC');
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

  it('sbc + geen keuzedelen → paars / Profieljaar SBC (null = geen downgrade)', () => {
    const result = berekenStatus(makeSbcStudent([]));
    expect(result.kleur).toBe('paars');
    expect(result.label).toBe('Profieljaar SBC');
  });

  it('sbl + niet_behaald KD → groen / Op koers (SBL heeft geen KD-eis)', () => {
    const scores = allScores(null);
    const keys = Object.keys(scores).slice(0, 13);
    for (const k of keys) scores[k] = 'voldoende';
    const student = makeStudent({ deelgebiedScores: scores, keuzedelen: kdNietBehaald });
    const result = berekenStatus(student);
    expect(result.kleur).toBe('groen');
    expect(result.label).toBe('Op koers');
  });

  it('naar_bj2 + niet_behaald KD → oranje / Let op — KD', () => {
    const result = berekenStatus(makeBj1Student(kdNietBehaald));
    expect(result.kleur).toBe('oranje');
    expect(result.label).toBe('Let op — KD');
  });

  it('naar_bj2 + haalbaar KD → groen / Op koers BJ2 (haalbaar volstaat voor BJ2)', () => {
    const result = berekenStatus(makeBj1Student(kdHaalbaar));
    expect(result.kleur).toBe('groen');
    expect(result.label).toBe('Op koers BJ2');
  });

});

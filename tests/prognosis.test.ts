// ---------------------------------------------------------------------------
// prognosis.test.ts — berekenPrognose + berekenAllePrognoses unit tests
// Wave 0 stub: imports will fail until utils/prognosis.ts is created in Wave 1.
// Tests run as-is once prognosis.ts and schema.ts exist.
// ---------------------------------------------------------------------------

import { berekenPrognose, berekenAllePrognoses } from '../utils/prognosis';
import { DEELGEBIEDEN } from '../utils/schema';
import { appState } from '../utils/datamodel';

// Helper: build a minimal student record with specific deelgebied scores
function makeStudent(scores: Record<string, string | null> = {}): any {
  return {
    leerlingId: 'L1',
    naam: 'Test Leerling',
    deelgebiedScores: scores,
    datapunten: [],
  };
}

// Helper: set all 19 deelgebieden to the given score level
function allScores(level: string): Record<string, string | null> {
  return Object.fromEntries(DEELGEBIEDEN.map((dg: any) => [dg.label, level]));
}

// Helper: set all scores then override N deelgebieden to a different level
function scoresWithOverride(
  base: string,
  override: string,
  count: number
): Record<string, string | null> {
  const scores = allScores(base);
  const keys = Object.keys(scores).slice(0, count);
  for (const k of keys) scores[k] = override;
  return scores;
}

beforeEach(() => {
  appState.students = [];
});

// ── Tests ─────────────────────────────────────────────────────────────────────

test('negatief label wanneer >6 deelgebieden onvoldoende zijn', () => {
  // 7 onvoldoende → negatief
  const scores = scoresWithOverride('voldoende', 'onvoldoende', 7);
  const result = berekenPrognose(makeStudent(scores));
  expect(result.label).toBe('negatief');
});

test('neutraal label wanneer <13 deelgebieden voldoende (niet negatief)', () => {
  // 10 voldoende, 9 null (not enough for SBL)
  const scores = allScores(null as any);
  const keys = Object.keys(scores).slice(0, 10);
  for (const k of keys) scores[k] = 'voldoende';
  const result = berekenPrognose(makeStudent(scores));
  expect(['neutraal', 'onvoldoende', 'negatief']).toContain(result.label);
  // Must NOT be sbl or sbc
  expect(result.label).not.toBe('sbl');
  expect(result.label).not.toBe('sbc');
});

test('sbl label wanneer >=13 voldoende maar geen sbc-norm gehaald', () => {
  // 13 voldoende — meets SBL threshold
  const scores = scoresWithOverride('voldoende', 'onvoldoende', 0);
  // Set exactly 13 to voldoende, rest null
  const keys = Object.keys(scores);
  for (let i = 13; i < keys.length; i++) scores[keys[i]] = null as any;
  const result = berekenPrognose(makeStudent(scores));
  // Should be sbl or better (not negatief/neutraal)
  expect(['sbl', 'sbc', 'versneld_sbc']).toContain(result.label);
});

test('berekenPrognose met leeg scores object geeft een geldig label terug', () => {
  const result = berekenPrognose(makeStudent({}));
  expect(result).toBeDefined();
  expect(typeof result.label).toBe('string');
  expect(result.label.length).toBeGreaterThan(0);
});

test('berekenAllePrognoses met lege students array geeft lege array', () => {
  appState.students = [];
  const result = berekenAllePrognoses();
  expect(Array.isArray(result)).toBe(true);
  expect(result.length).toBe(0);
});

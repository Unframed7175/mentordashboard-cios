// ---------------------------------------------------------------------------
// berekenEindoordelen.test.ts — M43 T1: één ingang voor het eindoordeel per
// deelgebied (S/C-formule over de datapunten van één record, optioneel per fase).
// ---------------------------------------------------------------------------

vi.mock('../src/config/leerlijn.json', () => ({
  default: {
    deelgebieden: [
      { id: 'va',  label: 'V&A', group: 'lesgeven' },
      { id: 'mm',  label: 'M&M', group: 'lesgeven' },
      { id: 'ins', label: 'INS', group: 'lesgeven' },
    ],
  },
}));

import { berekenEindoordelen } from '../utils/aggregation';

// Eén datapunt per beoordeling voor één label.
function dps(label: string, scores: string[], fase?: number | null) {
  return scores.map(s => ({ scores: { [label]: s }, ...(fase === undefined ? {} : { fase }) }));
}
const E = 'excellent', G = 'goed', V = 'voldoende', O = 'onvoldoende';

describe('berekenEindoordelen — contract', () => {
  test('elk DEELGEBIEDEN-label aanwezig, null zonder beoordeling', () => {
    expect(berekenEindoordelen([])).toEqual({ 'V&A': null, 'M&M': null, INS: null });
  });

  test('undefined datapunten → alles null (oud/leeg record)', () => {
    expect(berekenEindoordelen(undefined as any)).toEqual({ 'V&A': null, 'M&M': null, INS: null });
  });

  test('onbekend label in dp.scores wordt genegeerd en verschijnt niet', () => {
    const r = berekenEindoordelen([{ scores: { 'V & A': G, 'V&A': V } }]);
    expect(r).toEqual({ 'V&A': 'voldoende', 'M&M': null, INS: null });
  });

  test('onbekende scorewaarde telt niet mee (geen stille voldoende) — /review F3', () => {
    // Alleen genormaliseerde waarden tellen. 'Goed'/'V'/'' (bv. uit een oude of
    // handmatig bewerkte backup) worden genegeerd zoals een lege cel.
    expect(berekenEindoordelen([{ scores: { 'V&A': 'Goed' } }])['V&A']).toBeNull();
    expect(berekenEindoordelen([{ scores: { 'V&A': '' } }])['V&A']).toBeNull();
    expect(berekenEindoordelen([{ scores: { 'V&A': 'constructor' } }])['V&A']).toBeNull(); // prototype-sleutel
    expect(berekenEindoordelen([{ scores: { 'V&A': 'V' } }, { scores: { 'V&A': G } }])['V&A']).toBe('goed');
  });

  test('null-score telt niet mee', () => {
    const r = berekenEindoordelen([{ scores: { 'V&A': null } }, { scores: { 'V&A': G } }]);
    expect(r['V&A']).toBe('goed');
  });
});

describe('berekenEindoordelen — S/C-regels (D1 ongewijzigd)', () => {
  test('één beoordeling geeft precies die beoordeling terug (regressie latest-wins)', () => {
    for (const s of [E, G, V, O]) {
      expect(berekenEindoordelen(dps('V&A', [s]))['V&A']).toBe(s);
    }
  });

  test('compensatie: O + G → S=0, C=1 → voldoende (latest-wins gaf goed)', () => {
    expect(berekenEindoordelen(dps('V&A', [O, G]))['V&A']).toBe('voldoende');
  });

  test('compensatie: G + O → voldoende (volgorde maakt niet uit; latest-wins gaf onvoldoende)', () => {
    expect(berekenEindoordelen(dps('V&A', [G, O]))['V&A']).toBe('voldoende');
  });

  test('E + O → S=1 → goed', () => {
    expect(berekenEindoordelen(dps('V&A', [E, O]))['V&A']).toBe('goed');
  });

  test('S = -1 → onvoldoende (grens S < -0.5)', () => {
    // 2×O + E: S = -4 + 3 = -1, C = 2 - 1 = 1
    expect(berekenEindoordelen(dps('V&A', [O, O, E]))['V&A']).toBe('onvoldoende');
  });

  test('S = 2 → goed (grens S <= 2.0)', () => {
    expect(berekenEindoordelen(dps('V&A', [G, V]))['V&A']).toBe('goed');
  });

  test('E-plafond: S = 4 zonder E → goed', () => {
    expect(berekenEindoordelen(dps('V&A', [G, G, V]))['V&A']).toBe('goed');
  });

  test('S = 3 met E → excellent', () => {
    expect(berekenEindoordelen(dps('V&A', [E, V]))['V&A']).toBe('excellent');
  });

  test('knock-out: C = 3 met S = 0 → onvoldoende (4E + 1G + 7O)', () => {
    const scores = [E, E, E, E, G, O, O, O, O, O, O, O];
    expect(berekenEindoordelen(dps('V&A', scores))['V&A']).toBe('onvoldoende');
  });
});

describe('berekenEindoordelen — fasefilter', () => {
  const datapunten = [
    ...dps('V&A', [O], 1),
    ...dps('V&A', [G], 2),
    ...dps('V&A', [E], 3),
    ...dps('M&M', [V], null),   // onherkende fase → telt mee in elke fase
    ...dps('INS', [G]),         // pre-fase-import zonder property → telt mee in elke fase
  ];

  test('zonder fase: alle datapunten', () => {
    // O + G + E → S = 3, C = 0, nE > 0 → excellent
    expect(berekenEindoordelen(datapunten)).toEqual({ 'V&A': 'excellent', 'M&M': 'voldoende', INS: 'goed' });
  });

  test('fase 2: alleen fase 2 + zonder fase-tag', () => {
    expect(berekenEindoordelen(datapunten, { fase: 2 })).toEqual({ 'V&A': 'goed', 'M&M': 'voldoende', INS: 'goed' });
  });

  test('fase 3 (Roosendaal SBL-keuze): alleen fase 3 + zonder fase-tag', () => {
    expect(berekenEindoordelen(datapunten, { fase: 3 })).toEqual({ 'V&A': 'excellent', 'M&M': 'voldoende', INS: 'goed' });
  });
});

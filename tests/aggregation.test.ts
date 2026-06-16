// ---------------------------------------------------------------------------
// aggregation.test.ts — aggregateDeelgebiedScores unit tests
// Wave 0 stub: imports will fail until utils/aggregation.ts is created in Wave 2.
// Tests run as-is once aggregation.ts exists.
// ---------------------------------------------------------------------------

import { aggregateDeelgebiedScores } from '../utils/aggregation';

// ── Tests ─────────────────────────────────────────────────────────────────────

test('lege datapunten geeft leeg aggregationDetail object', () => {
  const result = aggregateDeelgebiedScores([]);
  expect(result.aggregationDetail).toEqual({});
});

test('één datapunt — scores worden direct doorgegeven', () => {
  const datapunten = [{ scores: { 'V&A': 'goed', 'M&M': 'voldoende' } }];
  const result = aggregateDeelgebiedScores(datapunten);
  expect(result.aggregationDetail['V&A']).toBe('goed');
  expect(result.aggregationDetail['M&M']).toBe('voldoende');
});

test('2x goed + 1x voldoende — S=4, C=-1, nE=0 → goed (geen E aanwezig)', () => {
  const datapunten = [
    { scores: { 'V&A': 'goed' } },
    { scores: { 'V&A': 'goed' } },
    { scores: { 'V&A': 'voldoende' } },
  ];
  const result = aggregateDeelgebiedScores(datapunten);
  // S = 2+2+0 = 4 > 2.0, maar nE=0 → goed (niet excellent)
  expect(result.aggregationDetail['V&A']).toBe('goed');
});

test('1x voldoende + 1x goed — S=2, C=0 → goed (grens S<=2.0)', () => {
  const datapunten = [
    { scores: { 'M&M': 'voldoende' } },
    { scores: { 'M&M': 'goed' } },
  ];
  const result = aggregateDeelgebiedScores(datapunten);
  // S = 0+2 = 2, C = 0-0-floor(1/2) = 0 → goed (S <= 2.0)
  expect(result.aggregationDetail['M&M']).toBe('goed');
});

test('null scores tellen niet mee als stemmen', () => {
  const datapunten = [
    { scores: { 'INS': null } },
    { scores: { 'INS': null } },
    { scores: { 'INS': 'voldoende' } },
  ];
  const result = aggregateDeelgebiedScores(datapunten);
  // Only one non-null score — should be 'voldoende'
  expect(result.aggregationDetail['INS']).toBe('voldoende');
});

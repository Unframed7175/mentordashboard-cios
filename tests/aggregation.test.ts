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

test('twee datapunten — modus wint (2x goed > 1x voldoende)', () => {
  const datapunten = [
    { scores: { 'V&A': 'goed' } },
    { scores: { 'V&A': 'goed' } },
    { scores: { 'V&A': 'voldoende' } },
  ];
  const result = aggregateDeelgebiedScores(datapunten);
  expect(result.aggregationDetail['V&A']).toBe('goed');
});

test('gelijke scores — hogere score wint bij gelijkspel', () => {
  const datapunten = [
    { scores: { 'M&M': 'voldoende' } },
    { scores: { 'M&M': 'goed' } },
  ];
  const result = aggregateDeelgebiedScores(datapunten);
  // Tie-break: higher score ('goed' > 'voldoende') wins
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

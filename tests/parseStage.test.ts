// ---------------------------------------------------------------------------
// parseStage.test.ts — parseSinglePDF (MIG-01) integration test
// Wave 0 stub: uses describe.skipIf to skip when fixture file is absent.
// Tests run only when tests/fixtures/sample-voortgang.pdf exists.
//
// Note: parseStageFile = parseSinglePDF per Phase 11 research (no separate
// parsers/parseStage.js — the function lives in parsers/pdf.ts).
// ---------------------------------------------------------------------------

import { existsSync, readFileSync } from 'fs';

const FIXTURE_PATH = new URL('./fixtures/sample-voortgang.pdf', import.meta.url).pathname;
const FIXTURE_EXISTS = existsSync(FIXTURE_PATH);

// ── Fixture-dependent integration tests ──────────────────────────────────────
// Both tests are guarded by skipIf so the pdf module is only imported when
// the fixture is available (avoids DOMMatrix error from pdfjs in jsdom env).

describe.skipIf(!FIXTURE_EXISTS)('parseStageFile integration (MIG-01)', () => {
  test('fixture PDF wordt geparsed en geeft een object met naam terug', async () => {
    const { parseSinglePDF } = await import('../parsers/pdf');
    const pdfBytes = readFileSync(FIXTURE_PATH);
    const file = new File([pdfBytes], 'sample-voortgang.pdf', { type: 'application/pdf' });
    const result = await parseSinglePDF(file);
    expect(result).toBeDefined();
    expect(result).not.toBeNull();
  });

  test('elk geparsed record heeft een naam eigenschap', async () => {
    const { parseSinglePDF } = await import('../parsers/pdf');
    const pdfBytes = readFileSync(FIXTURE_PATH);
    const file = new File([pdfBytes], 'sample-voortgang.pdf', { type: 'application/pdf' });
    const result = await parseSinglePDF(file);
    expect(result).toHaveProperty('naam');
    expect(typeof result.naam).toBe('string');
    expect(result.naam.length).toBeGreaterThan(0);
  });
});

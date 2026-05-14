// ---------------------------------------------------------------------------
// excel.test.ts — parseExcelFile (MIG-02) integration test
// Wave 0 stub: uses describe.skipIf to skip when fixture file is absent.
// Tests run only when tests/fixtures/sample-verzuim.xls exists.
// The Müller test (test 3) bewijst correcte cp1252 Nederlandse tekens handling.
// ---------------------------------------------------------------------------

import { existsSync, readFileSync } from 'fs';
import { parseExcelFile } from '../parsers/excel';

const FIXTURE_PATH = new URL('./fixtures/sample-verzuim.xls', import.meta.url).pathname;
const FIXTURE_EXISTS = existsSync(FIXTURE_PATH);

// ── Non-fixture tests (always run) ────────────────────────────────────────────

describe('parseExcelFile module', () => {
  test('parseExcelFile is een functie', () => {
    expect(typeof parseExcelFile).toBe('function');
  });
});

// ── Fixture-dependent integration tests ──────────────────────────────────────

describe.skipIf(!FIXTURE_EXISTS)('Excel parser integration (MIG-02)', () => {
  test('parseert fixture XLS en retourneert een array', async () => {
    const bytes = readFileSync(FIXTURE_PATH);
    const file = new File([bytes], 'sample-verzuim.xls', {
      type: 'application/vnd.ms-excel',
    });
    const rows = await parseExcelFile(file);
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBeGreaterThan(0);
  });
});

describe.skipIf(!FIXTURE_EXISTS)('Excel cp1252 Nederlandse tekens (MIG-02)', () => {
  test('rij met "Müller" wordt correct geparsed (cp1252 encoding)', async () => {
    const bytes = readFileSync(FIXTURE_PATH);
    const file = new File([bytes], 'sample-verzuim.xls', {
      type: 'application/vnd.ms-excel',
    });
    const rows = await parseExcelFile(file);
    const mullerRow = rows.find(
      (r: any) => r.Naam?.includes('Müller') || r.naam?.includes('Müller')
    );
    expect(mullerRow).toBeDefined();
  });
});

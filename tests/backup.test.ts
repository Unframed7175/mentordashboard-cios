// ---------------------------------------------------------------------------
// backup.test.ts — buildBackupPayload + applyBackupRestore unit tests
// Wave 0 stub: imports will fail until utils/backup.ts and utils/klassen.ts
// are created in Wave 1/2. Tests run as-is once those files exist.
// ---------------------------------------------------------------------------

import { buildBackupPayload, applyBackupRestore } from '../utils/backup';
import { klassenState } from '../utils/klassen';

beforeEach(() => {
  // Reset klassenState to known empty fixture
  klassenState.klassen = {};
  klassenState.activeKlasId = null;
});

// ── Tests ─────────────────────────────────────────────────────────────────────

test('buildBackupPayload geeft Uint8Array terug', () => {
  const result = buildBackupPayload();
  expect(result).toBeInstanceOf(Uint8Array);
  expect(result.length).toBeGreaterThan(0);
});

test('round-trip: build + restore overschrijven herstelt klassenState', () => {
  // Seed klassenState with a klas
  klassenState.klassen = {
    klas_1: { id: 'klas_1', naam: 'Test Klas', students: [] },
  };
  const zip = buildBackupPayload();

  // Wipe state and restore
  klassenState.klassen = {};
  const result = applyBackupRestore(zip, 'overschrijven');

  expect(result.success).toBe(true);
  expect(klassenState.klassen['klas_1']).toBeDefined();
  expect(klassenState.klassen['klas_1'].naam).toBe('Test Klas');
});

test('samenvoegen voegt nieuwe klassen toe zonder bestaande te verwijderen', () => {
  // Start with klas_existing
  klassenState.klassen = {
    klas_existing: { id: 'klas_existing', naam: 'Bestaande Klas', students: [] },
  };
  // Build backup that contains klas_new
  klassenState.klassen = {
    klas_new: { id: 'klas_new', naam: 'Nieuwe Klas', students: [] },
  };
  const zip = buildBackupPayload();

  // Restore to state that has klas_existing
  klassenState.klassen = {
    klas_existing: { id: 'klas_existing', naam: 'Bestaande Klas', students: [] },
  };
  const result = applyBackupRestore(zip, 'samenvoegen');

  expect(result.success).toBe(true);
  // Both klassen should exist after merge
  expect(klassenState.klassen['klas_existing']).toBeDefined();
  expect(klassenState.klassen['klas_new']).toBeDefined();
});

test('ongeldige zip data geeft success: false terug', () => {
  const invalidData = new Uint8Array([0, 1, 2, 3, 4, 5]);
  const result = applyBackupRestore(invalidData, 'overschrijven');
  expect(result.success).toBe(false);
  expect(typeof result.message).toBe('string');
});

// ---------------------------------------------------------------------------
// backup.test.ts — buildBackupPayload + applyBackupRestore unit tests
// ---------------------------------------------------------------------------

import { vi } from 'vitest';

// Symmetrische mock voor de Rust encrypt/decrypt commands — decrypt gooit op
// niet-ciphertext input, net als de echte implementatie (legacy-fallback pad).
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(async (cmd: string, args: Record<string, string>) => {
    if (cmd === 'encrypt_klassen') return 'MOCKENC:' + args.plaintext;
    if (cmd === 'decrypt_klassen') {
      if (args.ciphertext?.startsWith('MOCKENC:')) return args.ciphertext.slice(8);
      throw new Error('decrypt mislukt: geen geldige ciphertext');
    }
    throw new Error('unmocked invoke: ' + cmd);
  }),
}));

import { buildBackupPayload, applyBackupRestore } from '../utils/backup';
import { klassenState } from '../utils/klassen';

beforeEach(() => {
  // Reset klassenState to known empty fixture
  klassenState.klassen = {};
  klassenState.activeKlasId = null;
});

// ── Tests ─────────────────────────────────────────────────────────────────────

test('buildBackupPayload geeft Uint8Array terug', async () => {
  const result = await buildBackupPayload();
  expect(result).toBeInstanceOf(Uint8Array);
  expect(result.length).toBeGreaterThan(0);
});

test('round-trip: build + restore overschrijven herstelt klassenState', async () => {
  // Seed klassenState with a klas
  klassenState.klassen = {
    klas_1: { id: 'klas_1', naam: 'Test Klas', students: [] },
  };
  const zip = await buildBackupPayload();

  // Wipe state and restore
  klassenState.klassen = {};
  const result = await applyBackupRestore(zip, 'overschrijven');

  expect(result.success).toBe(true);
  expect(klassenState.klassen['klas_1']).toBeDefined();
  expect(klassenState.klassen['klas_1'].naam).toBe('Test Klas');
});

test('samenvoegen voegt nieuwe klassen toe zonder bestaande te verwijderen', async () => {
  // Start with klas_existing
  klassenState.klassen = {
    klas_existing: { id: 'klas_existing', naam: 'Bestaande Klas', students: [] },
  };
  // Build backup that contains klas_new
  klassenState.klassen = {
    klas_new: { id: 'klas_new', naam: 'Nieuwe Klas', students: [] },
  };
  const zip = await buildBackupPayload();

  // Restore to state that has klas_existing
  klassenState.klassen = {
    klas_existing: { id: 'klas_existing', naam: 'Bestaande Klas', students: [] },
  };
  const result = await applyBackupRestore(zip, 'samenvoegen');

  expect(result.success).toBe(true);
  // Both klassen should exist after merge
  expect(klassenState.klassen['klas_existing']).toBeDefined();
  expect(klassenState.klassen['klas_new']).toBeDefined();
});

test('ongeldige zip data geeft success: false terug', async () => {
  const invalidData = new Uint8Array([0, 1, 2, 3, 4, 5]);
  const result = await applyBackupRestore(invalidData, 'overschrijven');
  expect(result.success).toBe(false);
  expect(typeof result.message).toBe('string');
});

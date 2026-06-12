// ---------------------------------------------------------------------------
// backup.test.ts — buildBackupPayload + applyBackupRestore unit tests
// ---------------------------------------------------------------------------

import { vi } from 'vitest';

// Gedeelde in-memory store voor de LazyStore mock — alle instanties delen
// dezelfde map, net als meerdere LazyStore('store.json') instanties in productie.
let _storeData = new Map<string, unknown>();

vi.mock('@tauri-apps/plugin-store', () => {
  class LazyStore {
    async get(key: string) { return _storeData.get(key) ?? null; }
    async set(key: string, value: unknown) { _storeData.set(key, value); }
    async save() {}
    async delete(key: string) { _storeData.delete(key); }
    async clear() { _storeData.clear(); }
    async entries() { return Array.from(_storeData.entries()); }
  }
  return { LazyStore };
});

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

import { zipSync, unzipSync, strToU8, strFromU8 } from 'fflate';
import { buildBackupPayload, applyBackupRestore } from '../utils/backup';
import { klassenState } from '../utils/klassen';

beforeEach(() => {
  // Reset klassenState to known empty fixture
  klassenState.klassen = {};
  klassenState.activeKlasId = null;
  _storeData = new Map();
});

// Helper: pak de payload-JSON uit een backup-zip (test-zijde decrypt via MOCKENC)
function extractPayload(zip: Uint8Array): any {
  const extracted = unzipSync(zip);
  const raw = strFromU8(extracted['mentordashboard-backup.enc']);
  return JSON.parse(raw.replace(/^MOCKENC:/, ''));
}

// Helper: bouw een backup-zip uit een payload-object (test-zijde encrypt via MOCKENC)
function buildZipFromPayload(payload: unknown): Uint8Array {
  return zipSync({
    'mentordashboard-backup.enc': strToU8('MOCKENC:' + JSON.stringify(payload)),
  });
}

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

// ── Backup payload v2 (M36 T1) ────────────────────────────────────────────────

test('buildBackupPayload produceert version 2 met generieke store-snapshot, klassen plaintext', async () => {
  klassenState.klassen = {
    klas_1: { id: 'klas_1', naam: 'Test Klas', students: [] },
  };
  _storeData.set('settings', { theme: 'dark' });
  _storeData.set('doorstroom_normen', '{"x":1}');

  const zip = await buildBackupPayload();
  const payload = extractPayload(zip);

  expect(payload.version).toBe(2);
  // klassen blijft plaintext zoals v1
  expect(payload.klassen.klas_1.naam).toBe('Test Klas');
  // generieke store-snapshot via store.entries()
  expect(payload.store).toEqual({
    settings: { theme: 'dark' },
    doorstroom_normen: '{"x":1}',
  });
});

test('CRITICAL v1-regressie: v1-backup zonder store-veld herstelt nog steeds', async () => {
  const v1zip = buildZipFromPayload({
    version: 1,
    klassen: { klas_v1: { id: 'klas_v1', naam: 'V1 Klas', students: [] } },
    activeKlasId: 'klas_v1',
    exportedAt: '2026-01-01T00:00:00.000Z',
  });

  const result = await applyBackupRestore(v1zip, 'overschrijven');

  expect(result.success).toBe(true);
  expect(result.reloadRequired).toBeFalsy();
  expect(klassenState.klassen['klas_v1'].naam).toBe('V1 Klas');
  expect(klassenState.activeKlasId).toBe('klas_v1');
});

test('v2 overschrijven-restore zet store-keys terug en vraagt reload', async () => {
  _storeData.set('settings', { theme: 'light' });
  _storeData.set('verzuim_drempels', '{"oud":true}');

  const v2zip = buildZipFromPayload({
    version: 2,
    klassen: { klas_2: { id: 'klas_2', naam: 'Klas 2', students: [] } },
    activeKlasId: 'klas_2',
    store: { settings: { theme: 'dark' }, doorstroom_normen: '{"nieuw":1}' },
    exportedAt: '2026-06-12T00:00:00.000Z',
  });

  const result = await applyBackupRestore(v2zip, 'overschrijven');

  expect(result.success).toBe(true);
  expect(result.reloadRequired).toBe(true);
  expect(klassenState.klassen['klas_2'].naam).toBe('Klas 2');
  // store-keys uit de snapshot zijn teruggezet
  expect(_storeData.get('settings')).toEqual({ theme: 'dark' });
  expect(_storeData.get('doorstroom_normen')).toBe('{"nieuw":1}');
});

test('v2 samenvoegen-restore behoudt huidige store-keys en vraagt géén reload', async () => {
  _storeData.set('settings', { theme: 'light' });

  const v2zip = buildZipFromPayload({
    version: 2,
    klassen: { klas_3: { id: 'klas_3', naam: 'Klas 3', students: [] } },
    activeKlasId: 'klas_3',
    store: { settings: { theme: 'dark' }, doorstroom_normen: '{"x":9}' },
    exportedAt: '2026-06-12T00:00:00.000Z',
  });

  const result = await applyBackupRestore(v2zip, 'samenvoegen');

  expect(result.success).toBe(true);
  expect(result.reloadRequired).toBeFalsy();
  expect(klassenState.klassen['klas_3']).toBeDefined();
  // huidige instellingen blijven staan
  expect(_storeData.get('settings')).toEqual({ theme: 'light' });
  expect(_storeData.has('doorstroom_normen')).toBe(false);
});

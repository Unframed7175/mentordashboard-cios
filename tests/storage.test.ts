// storage.test.ts — saveKlassen, loadKlassen, deleteStudent unit tests
// Phase 12 Plan 04 — STO-01, STO-02, STO-03, STO-04
// Plugin-store en invoke() zijn gemockt — tests draaien zonder Tauri runtime

import { vi, expect, beforeEach, test } from 'vitest';

// In-memory store stub — declared at module scope so factory closures can close over it
// Vitest hoists vi.mock() calls, so the closures must reference a module-level variable
let _storeData = new Map<string, unknown>();

vi.mock('@tauri-apps/plugin-store', () => {
  class LazyStore {
    async get(key: string) { return _storeData.get(key) ?? null; }
    async set(key: string, value: unknown) { _storeData.set(key, value); }
    async save() {}
    async delete(key: string) { _storeData.delete(key); }
  }
  return { LazyStore };
});

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(async (cmd: string, args: any) => {
    if (cmd === 'encrypt_klassen') {
      // Base64-encode the plaintext to simulate opaque ciphertext (not real AES)
      // This ensures the raw plaintext is NOT present in the stored value (STO-02 contract)
      return `mock_encrypted:${btoa(unescape(encodeURIComponent(args.plaintext)))}`;
    }
    if (cmd === 'decrypt_klassen') {
      const b64 = args.ciphertext.replace('mock_encrypted:', '');
      return decodeURIComponent(escape(atob(b64)));
    }
    return null;
  }),
}));

import { klassenState, saveKlassen, loadKlassen, deleteStudent, renameKlas } from '../utils/klassen';

beforeEach(() => {
  _storeData = new Map<string, unknown>();
  vi.clearAllMocks();
  klassenState.klassen = {};
  klassenState.activeKlasId = null;
  localStorage.clear();
});

// ── STO-01: save/load round-trip ─────────────────────────────────────────────

test('STO-01: saveKlassen() slaat op, loadKlassen() herstelt staat', async () => {
  klassenState.klassen = {
    klas_1: { id: 'klas_1', naam: 'Test Klas', students: [] },
  };
  klassenState.activeKlasId = 'klas_1';

  await saveKlassen();

  // Reset in-memory state (simulates app restart)
  klassenState.klassen = {};
  klassenState.activeKlasId = null;

  const result = await loadKlassen();
  expect(result).toBe(true);
  expect(klassenState.klassen['klas_1']).toBeDefined();
  expect(klassenState.klassen['klas_1'].naam).toBe('Test Klas');
});

// ── STO-02: ciphertext, niet plaintext ───────────────────────────────────────

test('STO-02: store bevat ciphertext, niet plaintext klassendata', async () => {
  klassenState.klassen = { klas_1: { id: 'klas_1', naam: 'Geheim', students: [] } };
  await saveKlassen();

  const stored = _storeData.get('klassen') as string;
  expect(stored).toContain('mock_encrypted:');
  expect(stored).not.toContain('Geheim');
});

// ── STO-03: localStorage migratie ────────────────────────────────────────────

test('STO-03: migratie: localStorage-data wordt gemigreerd naar plugin-store', async () => {
  localStorage.setItem('mentordashboard_klassen_v1', JSON.stringify({
    klassen: { klas_old: { id: 'klas_old', naam: 'Oude Klas', students: [] } },
    activeKlasId: 'klas_old',
  }));

  const result = await loadKlassen();
  expect(result).toBe(true);
  expect(klassenState.klassen['klas_old']).toBeDefined();
  expect(_storeData.has('klassen')).toBe(true);
  expect(localStorage.getItem('mentordashboard_klassen_v1')).toBeNull();
});

// ── RNM-01: renameKlas — success path + data integrity ───────────────────────

test('RNM-01: renameKlas() werkt naam bij, slaat op, en laat studenten intact na reload', async () => {
  const originalStudents = [{ leerlingId: 'L1', naam: 'Bakker, J.' }];
  klassenState.klassen = {
    klas_1: { id: 'klas_1', naam: 'Oud Naam', students: originalStudents },
  };
  klassenState.activeKlasId = 'klas_1';

  const result = await renameKlas('klas_1', 'Nieuwe Naam');

  // Naam is bijgewerkt
  expect(result).toBe(true);
  expect(klassenState.klassen['klas_1'].naam).toBe('Nieuwe Naam');

  // Persist + simulate app restart + reload
  await saveKlassen();
  klassenState.klassen = {};
  klassenState.activeKlasId = null;
  await loadKlassen();

  // Naam is hersteld
  expect(klassenState.klassen['klas_1'].naam).toBe('Nieuwe Naam');
  // Students zijn ongewijzigd (data integrity)
  expect(klassenState.klassen['klas_1'].students).toEqual(originalStudents);
});

// ── RNM-02: renameKlas — unknown id returns false, no side effects ────────────

test('RNM-02: renameKlas() met onbekende klasId geeft false terug zonder bijwerkingen', async () => {
  // klassenState.klassen is leeg (via beforeEach)
  const result = await renameKlas('nonexistent', 'X');

  expect(result).toBe(false);
  expect(Object.keys(klassenState.klassen).length).toBe(0);
});

// ── STO-04: deleteStudent ─────────────────────────────────────────────────────

test('STO-04: deleteStudent() verwijdert leerling en slaat op', async () => {
  klassenState.klassen = {
    klas_1: {
      id: 'klas_1', naam: 'Klas 1',
      students: [
        { leerlingId: 'L1', naam: 'De Vries, A.' },
        { leerlingId: 'L2', naam: 'Jansen, B.' },
      ],
    },
  };
  klassenState.activeKlasId = 'klas_1';

  const result = await deleteStudent('klas_1', 'L1');
  expect(result).toBe(true);

  const remaining = klassenState.klassen['klas_1'].students;
  expect(remaining.find((s: any) => s.leerlingId === 'L1')).toBeUndefined();
  expect(remaining.find((s: any) => s.leerlingId === 'L2')).toBeDefined();
  // saveKlassen was triggered → store has updated ciphertext
  expect(_storeData.has('klassen')).toBe(true);
});

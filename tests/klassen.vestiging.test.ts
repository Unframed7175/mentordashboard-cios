// tests/klassen.vestiging.test.ts — M42 T1: vestiging-detectie + override-veld
// TDD RED scaffold — detecteerVestiging/getEffectieveVestiging/setVestigingOverride
// do not exist yet in utils/klassen.ts at the time this file is written.
//
// Plugin-store + invoke() mocking pattern copied from tests/storage.test.ts
// (module-scope Map + vi.mock factories), since setVestigingOverride persists
// via the existing saveKlassen() (store.set + store.save) path.

import { vi, expect, beforeEach, test, describe } from 'vitest';

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
      return `mock_encrypted:${btoa(unescape(encodeURIComponent(args.plaintext)))}`;
    }
    if (cmd === 'decrypt_klassen') {
      const b64 = args.ciphertext.replace('mock_encrypted:', '');
      return decodeURIComponent(escape(atob(b64)));
    }
    return null;
  }),
}));

import {
  klassenState,
  detecteerVestiging,
  getEffectieveVestiging,
  setVestigingOverride,
} from '../utils/klassen';

beforeEach(() => {
  _storeData = new Map<string, unknown>();
  vi.clearAllMocks();
  klassenState.klassen = {};
  klassenState.activeKlasId = null;
});

// ── detecteerVestiging(klasNaam) — pure function, no store involved ──────────

describe('detecteerVestiging', () => {
  test('CSD-prefix (met spatie) → dordrecht', () => {
    expect(detecteerVestiging('CSD 2A')).toBe('dordrecht');
  });

  test('csg-prefix (dash, lowercase) → goes (case-insensitive)', () => {
    expect(detecteerVestiging('csg-2b')).toBe('goes');
  });

  test('bare CSR (geen suffix) → roosendaal', () => {
    expect(detecteerVestiging('CSR')).toBe('roosendaal');
  });

  test('CSGroep1 → null (geen substring-match, token is niet exact CSG)', () => {
    expect(detecteerVestiging('CSGroep1')).toBeNull();
  });

  test('geen code → null', () => {
    expect(detecteerVestiging('2A')).toBeNull();
  });

  test('lege string → null, geen crash', () => {
    expect(detecteerVestiging('')).toBeNull();
  });

  test('leidende spaties worden getolereerd', () => {
    expect(detecteerVestiging('  CSD 2A')).toBe('dordrecht');
  });
});

// ── getEffectieveVestiging(klas) — override ?? detecteerVestiging(naam) ?? null ──

describe('getEffectieveVestiging', () => {
  test('override wint, ook als klasnaam een andere vestiging detecteert', () => {
    const klas = { naam: 'CSD 2A', vestigingOverride: 'goes' as const };
    expect(getEffectieveVestiging(klas)).toBe('goes');
  });

  test('geen override (null) + klasnaam detecteert → gedetecteerde waarde wint', () => {
    const klas = { naam: 'CSR 1B', vestigingOverride: null };
    expect(getEffectieveVestiging(klas)).toBe('roosendaal');
  });

  test('geen override (unset) + klasnaam detecteert → gedetecteerde waarde wint', () => {
    const klas = { naam: 'csg-3c' };
    expect(getEffectieveVestiging(klas)).toBe('goes');
  });

  test('geen override + geen detectie → null', () => {
    const klas = { naam: 'Klas Jansen', vestigingOverride: null };
    expect(getEffectieveVestiging(klas)).toBeNull();
  });
});

// ── setVestigingOverride(klasId, vestiging) — persistence path (store mock) ──

describe('setVestigingOverride', () => {
  test('zet vestigingOverride op de klas en persisteert', async () => {
    klassenState.klassen = {
      klas_1: { id: 'klas_1', naam: 'Klas Jansen', students: [] },
    };

    const result = await setVestigingOverride('klas_1', 'dordrecht');

    expect(result).toBe(true);
    expect(klassenState.klassen['klas_1'].vestigingOverride).toBe('dordrecht');
    expect(_storeData.has('klassen')).toBe(true);
  });

  test('onbekende klasId geeft false terug zonder bijwerkingen', async () => {
    const result = await setVestigingOverride('nonexistent', 'goes');
    expect(result).toBe(false);
    expect(_storeData.has('klassen')).toBe(false);
  });

  test('override kan teruggezet worden op null', async () => {
    klassenState.klassen = {
      klas_1: { id: 'klas_1', naam: 'Klas Jansen', students: [], vestigingOverride: 'goes' },
    };

    const result = await setVestigingOverride('klas_1', null);

    expect(result).toBe(true);
    expect(klassenState.klassen['klas_1'].vestigingOverride).toBeNull();
  });
});

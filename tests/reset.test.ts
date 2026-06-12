// tests/reset.test.ts — M36 T3: factoryReset() (ADR-13a)
// Volgorde bindend: store.clear() + store.save() → localStorage.clear() → reload.
// Geen in-memory mutaties; faalpad laat geheugen én schijf intact.

import { vi, describe, it, expect, beforeEach } from 'vitest';

const { getCallLog, resetCallLog, isSaveFailing } = vi.hoisted(() => {
  let _log: string[] = [];
  return {
    getCallLog: () => _log,
    resetCallLog: () => { _log = []; },
    isSaveFailing: { value: false },
  };
});

vi.mock('@tauri-apps/plugin-store', () => {
  class LazyStore {
    async clear() { getCallLog().push('store.clear'); }
    async save() {
      if (isSaveFailing.value) throw new Error('schijf niet beschikbaar');
      getCallLog().push('store.save');
    }
    async get() { return null; }
    async set() {}
    async entries() { return []; }
  }
  return { LazyStore };
});

import { factoryReset } from '../utils/reset';
import { klassenState } from '../utils/klassen';

beforeEach(() => {
  resetCallLog();
  isSaveFailing.value = false;
  klassenState.klassen = {
    klas_1: { id: 'klas_1', naam: 'Testklas', students: [] },
  };
  klassenState.activeKlasId = 'klas_1';
  localStorage.clear();
});

describe('factoryReset (M36 T3)', () => {
  it('volgorde bindend: store.clear → store.save → localStorage.clear → reload', async () => {
    localStorage.setItem('legacy_key', 'oud');
    const reload = vi.fn(() => getCallLog().push('reload'));

    // localStorage.clear in de volgorde-log opnemen
    const origClear = localStorage.clear.bind(localStorage);
    const lsClearSpy = vi.spyOn(Storage.prototype, 'clear').mockImplementation(function (this: Storage) {
      getCallLog().push('localStorage.clear');
      origClear();
    });

    const result = await factoryReset(reload);

    expect(result.success).toBe(true);
    expect(getCallLog()).toEqual(['store.clear', 'store.save', 'localStorage.clear', 'reload']);
    expect(localStorage.getItem('legacy_key')).toBeNull();
    lsClearSpy.mockRestore();
  });

  it('muteert geen in-memory state: klassenState blijft onaangetast', async () => {
    const reload = vi.fn();
    await factoryReset(reload);

    expect(klassenState.klassen['klas_1']).toBeDefined();
    expect(klassenState.klassen['klas_1'].naam).toBe('Testklas');
    expect(klassenState.activeKlasId).toBe('klas_1');
  });

  it('faalpad: store.save() faalt → geen localStorage.clear, geen reload, geheugen intact', async () => {
    isSaveFailing.value = true;
    localStorage.setItem('legacy_key', 'oud');
    const reload = vi.fn();

    const result = await factoryReset(reload);

    expect(result.success).toBe(false);
    expect(typeof result.message).toBe('string');
    expect(reload).not.toHaveBeenCalled();
    expect(localStorage.getItem('legacy_key')).toBe('oud');
    expect(klassenState.klassen['klas_1']).toBeDefined();
  });
});

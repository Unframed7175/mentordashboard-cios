// tests/normen.test.ts — RED test scaffold for NORM-06/07 + utils/normen.ts unit contract
// Phase 25 Plan 01 — Wave 0: Failing tests for utils/normen.ts (created in 25-02)
// All tests in this file are expected to FAIL until 25-02 lands (utils/normen.ts does not exist yet).
// Plugin-store mock follows the vi.hoisted + LazyStore ES6 class pattern
// from tests/SettingsPage.test.tsx, extended with async delete().

import { vi, describe, it, expect, beforeEach } from 'vitest';

// vi.hoisted() runs before vi.mock() — exposes shared store map without TDZ errors
const { getStoreMap, setStoreMap } = vi.hoisted(() => {
  let _map = new Map<string, unknown>();
  return {
    getStoreMap: () => _map,
    setStoreMap: (m: Map<string, unknown>) => { _map = m; },
  };
});

vi.mock('@tauri-apps/plugin-store', () => {
  class LazyStore {
    async get<T>(key: string): Promise<T | null> {
      return (getStoreMap().get(key) as T) ?? null;
    }
    async set(key: string, value: unknown): Promise<void> {
      getStoreMap().set(key, value);
    }
    async save(): Promise<void> {}
    async delete(key: string): Promise<void> {
      getStoreMap().delete(key);
    }
  }
  return { LazyStore };
});

// ── beforeEach: clear store map and invalidate module cache ──────────────────
beforeEach(() => {
  setStoreMap(new Map<string, unknown>());
  vi.resetModules();
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe('normen utility (Phase 25)', () => {

  it('loadNormen returns DEFAULT_NORMEN on cold cache', async () => {
    const { loadNormen, DEFAULT_NORMEN } = await import('../utils/normen');

    const result = await loadNormen();

    // Assert each field individually so failure messages are diagnostic
    expect(result.sbl).toBe(DEFAULT_NORMEN.sbl);
    expect(result.sbc).toBe(DEFAULT_NORMEN.sbc);
    expect(result.negatiefTotaal).toBe(DEFAULT_NORMEN.negatiefTotaal);
    expect(result.negatiefPerLeerlijn).toBe(DEFAULT_NORMEN.negatiefPerLeerlijn);
    expect(result.bj1Positief).toBe(DEFAULT_NORMEN.bj1Positief);
    expect(result.versneldLesgeven).toBe(DEFAULT_NORMEN.versneldLesgeven);
    expect(result.versneldOrganiseren).toBe(DEFAULT_NORMEN.versneldOrganiseren);
    expect(result.versneldProfHandelen).toBe(DEFAULT_NORMEN.versneldProfHandelen);
    // Verify the concrete defaults
    expect(result.sbl).toBe(13);
    expect(result.sbc).toBe(15);
    expect(result.negatiefTotaal).toBe(6);
    expect(result.negatiefPerLeerlijn).toBe(2);
    expect(result.bj1Positief).toBe(13);
    expect(result.versneldLesgeven).toBe(4);
    expect(result.versneldOrganiseren).toBe(3);
    expect(result.versneldProfHandelen).toBe(5);
    expect(result.negatiefOnbeoordeeldBJ1).toBe(DEFAULT_NORMEN.negatiefOnbeoordeeldBJ1);
    expect(result.negatiefOnbeoordeeldBJ1).toBe(4);
  });

  it('saveNormen persists round-trip (NORM-06)', async () => {
    const { loadNormen, saveNormen, DEFAULT_NORMEN } = await import('../utils/normen');

    // Save custom thresholds
    await saveNormen({ ...DEFAULT_NORMEN, sbl: 10, sbc: 12 });

    // Invalidate module cache but retain store map
    vi.resetModules();
    const { loadNormen: load2 } = await import('../utils/normen');

    const result = await load2();
    expect(result.sbl).toBe(10);
    expect(result.sbc).toBe(12);
  });

  it('getNormenSync returns DEFAULT_NORMEN when cache cold', async () => {
    // Do NOT await loadNormen — cache must be cold
    const { getNormenSync, DEFAULT_NORMEN } = await import('../utils/normen');

    const result = getNormenSync();

    // Must return defaults synchronously without loading from store
    expect(result.sbl).toBe(DEFAULT_NORMEN.sbl);
    expect(result.sbc).toBe(DEFAULT_NORMEN.sbc);
    expect(result.negatiefTotaal).toBe(DEFAULT_NORMEN.negatiefTotaal);
    expect(result.negatiefPerLeerlijn).toBe(DEFAULT_NORMEN.negatiefPerLeerlijn);
    expect(result.bj1Positief).toBe(DEFAULT_NORMEN.bj1Positief);
    expect(result.versneldLesgeven).toBe(DEFAULT_NORMEN.versneldLesgeven);
    expect(result.versneldOrganiseren).toBe(DEFAULT_NORMEN.versneldOrganiseren);
    expect(result.versneldProfHandelen).toBe(DEFAULT_NORMEN.versneldProfHandelen);
  });

  it('saveNormen updates the sync cache instantly (instant-apply pitfall 5)', async () => {
    // Pitfall 5: save must update _cache immediately so sync accessor reflects new values
    const { saveNormen, getNormenSync, DEFAULT_NORMEN } = await import('../utils/normen');

    await saveNormen({ ...DEFAULT_NORMEN, sbl: 7 });

    // Sync accessor must immediately return the new value — no reload required
    const result = getNormenSync();
    expect(result.sbl).toBe(7);
  });

  it('resetNormen restores DEFAULT_NORMEN (NORM-07)', async () => {
    const { saveNormen, resetNormen, getNormenSync, DEFAULT_NORMEN } = await import('../utils/normen');

    // First save custom values
    await saveNormen({ ...DEFAULT_NORMEN, sbl: 9, sbc: 9 });

    // Reset should restore defaults
    const returned = await resetNormen();
    const synced = getNormenSync();

    // Both the returned value and the sync cache must equal DEFAULT_NORMEN
    expect(returned.sbl).toBe(DEFAULT_NORMEN.sbl);
    expect(returned.sbc).toBe(DEFAULT_NORMEN.sbc);
    expect(returned.negatiefTotaal).toBe(DEFAULT_NORMEN.negatiefTotaal);
    expect(returned.negatiefPerLeerlijn).toBe(DEFAULT_NORMEN.negatiefPerLeerlijn);
    expect(returned.bj1Positief).toBe(DEFAULT_NORMEN.bj1Positief);
    expect(returned.versneldLesgeven).toBe(DEFAULT_NORMEN.versneldLesgeven);
    expect(returned.versneldOrganiseren).toBe(DEFAULT_NORMEN.versneldOrganiseren);
    expect(returned.versneldProfHandelen).toBe(DEFAULT_NORMEN.versneldProfHandelen);
    expect(synced.sbl).toBe(DEFAULT_NORMEN.sbl);
    expect(synced.sbc).toBe(DEFAULT_NORMEN.sbc);
  });

});

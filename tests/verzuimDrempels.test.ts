// tests/verzuimDrempels.test.ts — RED test scaffold for SET-05
// Phase 18 Plan 01 — Wave 0: Failing tests for utils/verzuimDrempels.ts (created in 18-02)
// All tests in this file are expected to FAIL until 18-02 lands.
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

describe('verzuimDrempels utility (Phase 18)', () => {

  it('loadVerzuimDrempels returns DEFAULT_VERZUIM_DREMPELS on cold cache', async () => {
    const { loadVerzuimDrempels, DEFAULT_VERZUIM_DREMPELS } = await import('../utils/verzuimDrempels');

    const result = await loadVerzuimDrempels();

    // Defaults: geoorloofd = 900 minutes (15h), ongeoorloofd = 600 minutes (10h)
    expect(result.geoorloofd).toBe(DEFAULT_VERZUIM_DREMPELS.geoorloofd);
    expect(result.ongeoorloofd).toBe(DEFAULT_VERZUIM_DREMPELS.ongeoorloofd);
    expect(result.geoorloofd).toBe(900);
    expect(result.ongeoorloofd).toBe(600);
  });

  it('saveVerzuimDrempels persists round-trip', async () => {
    const { loadVerzuimDrempels, saveVerzuimDrempels } = await import('../utils/verzuimDrempels');

    // Save custom thresholds
    await saveVerzuimDrempels({ geoorloofd: 1200, ongeoorloofd: 300 });

    // Invalidate module cache but retain store map
    vi.resetModules();
    const { loadVerzuimDrempels: load2 } = await import('../utils/verzuimDrempels');

    const result = await load2();
    expect(result.geoorloofd).toBe(1200);
    expect(result.ongeoorloofd).toBe(300);
  });

  it('getVerzuimDrempelsSync returns DEFAULT_VERZUIM_DREMPELS when cache cold', async () => {
    // Do NOT await loadVerzuimDrempels — cache must be cold
    const { getVerzuimDrempelsSync, DEFAULT_VERZUIM_DREMPELS } = await import('../utils/verzuimDrempels');

    const result = getVerzuimDrempelsSync();

    // Must return defaults synchronously without loading from store
    expect(result.geoorloofd).toBe(DEFAULT_VERZUIM_DREMPELS.geoorloofd);
    expect(result.ongeoorloofd).toBe(DEFAULT_VERZUIM_DREMPELS.ongeoorloofd);
  });

  it('saveVerzuimDrempels updates the sync cache (instant-apply pitfall 5)', async () => {
    // Pitfall 5: save must update _cache immediately so sync accessor reflects new values
    const { saveVerzuimDrempels, getVerzuimDrempelsSync } = await import('../utils/verzuimDrempels');

    await saveVerzuimDrempels({ geoorloofd: 1500, ongeoorloofd: 450 });

    // Sync accessor must immediately return the new values — no reload required
    const result = getVerzuimDrempelsSync();
    expect(result.geoorloofd).toBe(1500);
    expect(result.ongeoorloofd).toBe(450);
  });

});

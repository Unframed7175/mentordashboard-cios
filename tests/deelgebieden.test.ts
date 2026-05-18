// tests/deelgebieden.test.ts — RED test scaffold for SET-03
// Phase 18 Plan 01 — Wave 0: Failing tests for utils/deelgebieden.ts (created in 18-02)
// All tests in this file are expected to FAIL until 18-02 lands.
// Plugin-store mock follows the vi.hoisted + LazyStore ES6 class pattern
// from tests/SettingsPage.test.tsx (STATE.md line 64), extended with async delete().

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
  // ES6 class mock — required for `new LazyStore()` constructor call (STATE.md line 64)
  class LazyStore {
    async get<T>(key: string): Promise<T | null> {
      return (getStoreMap().get(key) as T) ?? null;
    }
    async set(key: string, value: unknown): Promise<void> {
      getStoreMap().set(key, value);
    }
    async save(): Promise<void> {
      // intentionally empty — disk flush is a no-op in tests
    }
    async delete(key: string): Promise<void> {
      // Required because resetDeelgebiedenConfig() calls store.delete()
      // The SettingsPage.test.tsx mock omits this — extended here.
      getStoreMap().delete(key);
    }
  }
  return { LazyStore };
});

// Imports after mocks are hoisted — dynamic imports used per-test to reset module-level _cache
import { DEELGEBIEDEN } from '../utils/schema';

// ── beforeEach: clear store map and invalidate module cache ──────────────────
beforeEach(() => {
  setStoreMap(new Map<string, unknown>());
  vi.resetModules();
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe('deelgebieden utility (Phase 18)', () => {

  it('getDeelgebiedenConfig returns 19 entries on first call (cold cache)', async () => {
    const { getDeelgebiedenConfig } = await import('../utils/deelgebieden');

    const result = await getDeelgebiedenConfig();

    // Must return one entry per DEELGEBIED
    expect(result.length).toBe(DEELGEBIEDEN.length); // 19

    // All entries must be active by default
    expect(result.every((c: any) => c.active === true)).toBe(true);

    // Each entry must have the label matching DEELGEBIEDEN entry by id
    for (const dg of DEELGEBIEDEN) {
      const found = result.find((c: any) => c.id === dg.id);
      expect(found).toBeDefined();
      expect(found?.label).toBe(dg.label);
    }
  });

  it('getDeelgebiedenConfig persists round-trip via saveDeelgebiedenConfig', async () => {
    const { getDeelgebiedenConfig, saveDeelgebiedenConfig } = await import('../utils/deelgebieden');

    // Load defaults first
    const defaults = await getDeelgebiedenConfig();

    // Mutate: one entry inactive, one label changed
    const mutated = defaults.map((c: any, i: number) => {
      if (i === 0) return { ...c, active: false };
      if (i === 1) return { ...c, label: 'Custom' };
      return c;
    });

    await saveDeelgebiedenConfig(mutated);

    // Invalidate module cache (vi.resetModules already called, retain store map)
    vi.resetModules();
    const { getDeelgebiedenConfig: getDeelgebiedenConfig2 } = await import('../utils/deelgebieden');

    const reloaded = await getDeelgebiedenConfig2();

    // First entry must be inactive now
    expect(reloaded[0].active).toBe(false);
    // Second entry must have custom label
    expect(reloaded[1].label).toBe('Custom');
  });

  it('getActiveDGIds returns ids of active entries only', async () => {
    const { getActiveDGIds } = await import('../utils/deelgebieden');

    // Build config with 3 entries inactive
    const config = DEELGEBIEDEN.map((dg, i) => ({
      id: dg.id,
      label: dg.label,
      active: i >= 3, // first 3 inactive
    }));

    const result = getActiveDGIds(config);

    // Length must be total minus inactive (19 - 3 = 16)
    expect(result.length).toBe(DEELGEBIEDEN.length - 3);

    // The first 3 ids (inactive) must not be present
    const inactiveIds = DEELGEBIEDEN.slice(0, 3).map(dg => dg.id);
    for (const id of inactiveIds) {
      expect(result).not.toContain(id);
    }
  });

  it('resetDeelgebiedenConfig wipes the stored key', async () => {
    const { getDeelgebiedenConfig, saveDeelgebiedenConfig, resetDeelgebiedenConfig } = await import('../utils/deelgebieden');

    // Save a custom config so the key is in the store
    const defaults = await getDeelgebiedenConfig();
    const custom = defaults.map((c: any, i: number) => (i === 0 ? { ...c, active: false } : c));
    await saveDeelgebiedenConfig(custom);

    // Verify key is persisted
    expect(getStoreMap().has('deelgebieden_config')).toBe(true);

    // Reset — must delete the key from store
    await resetDeelgebiedenConfig();
    expect(getStoreMap().has('deelgebieden_config')).toBe(false);

    // Invalidate module cache and re-import
    vi.resetModules();
    const { getDeelgebiedenConfig: getDeelgebiedenConfig2 } = await import('../utils/deelgebieden');

    // Subsequent load must return schema defaults (all 19, all active)
    const afterReset = await getDeelgebiedenConfig2();
    expect(afterReset.length).toBe(DEELGEBIEDEN.length);
    expect(afterReset.every((c: any) => c.active === true)).toBe(true);
  });

  it('getDeelgebiedenConfigSync returns schema defaults when cache cold', async () => {
    // Do NOT call getDeelgebiedenConfig first — cache must be cold
    const { getDeelgebiedenConfigSync } = await import('../utils/deelgebieden');

    const result = getDeelgebiedenConfigSync();

    // Must return all 19 deelgebieden
    expect(result.length).toBe(DEELGEBIEDEN.length);

    // First entry id must match DEELGEBIEDEN[0].id
    expect(result[0].id).toBe(DEELGEBIEDEN[0].id);

    // All must be active by default
    expect(result.every((c: any) => c.active === true)).toBe(true);
  });

});

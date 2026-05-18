// tests/leerlijnen.test.ts — RED test scaffold for getLeerlijnenMappingSync (Phase 18)
// Phase 18 Plan 01 — Wave 0: Failing tests for new getLeerlijnenMappingSync export
// (added to utils/leerlijnen.ts in 18-02).
// Tests will FAIL until 18-02 adds the sync export.
// Plugin-store mock follows the vi.hoisted + LazyStore ES6 class pattern
// from tests/SettingsPage.test.tsx, extended with async delete().

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { DEELGEBIEDEN } from '../utils/schema';

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

describe('getLeerlijnenMappingSync (Phase 18)', () => {

  it('getLeerlijnenMappingSync returns schema defaults when cache cold', async () => {
    // Do NOT call getLeerlijnenMapping first — cache must be cold
    const { getLeerlijnenMappingSync } = await import('../utils/leerlijnen');

    const result = getLeerlijnenMappingSync();

    // Must have a key for each of the 19 DEELGEBIEDEN ids
    for (const dg of DEELGEBIEDEN) {
      expect(result).toHaveProperty(dg.id);
      // Each value must match the corresponding dg.group from schema
      expect(result[dg.id]).toBe(dg.group);
    }
  });

  it('getLeerlijnenMappingSync returns cached value after getLeerlijnenMapping resolves', async () => {
    // Pre-seed store with a custom mapping for 'va'
    const customMapping = Object.fromEntries(
      DEELGEBIEDEN.map(dg => [dg.id, dg.group])
    );
    customMapping['va'] = 'organiseren'; // override for test
    getStoreMap().set('leerlijnen', JSON.stringify(customMapping));

    const { getLeerlijnenMapping, getLeerlijnenMappingSync } = await import('../utils/leerlijnen');

    // Await async load to populate cache
    await getLeerlijnenMapping();

    // Sync accessor must now reflect the cached (custom) value
    const result = getLeerlijnenMappingSync();
    expect(result['va']).toBe('organiseren');
  });

  it('getLeerlijnenMappingSync never returns a Promise', async () => {
    const { getLeerlijnenMappingSync } = await import('../utils/leerlijnen');

    const result = getLeerlijnenMappingSync();

    // Must be a plain object, not a Promise
    expect(typeof (result as any).then).toBe('undefined');
  });

});

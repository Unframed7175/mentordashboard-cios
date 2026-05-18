// tests/bpv.test.ts — RED test scaffold for SET-06
// Phase 18 Plan 01 — Wave 0: Failing tests for utils/bpv.ts (created in 18-02)
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

describe('bpv utility (Phase 18)', () => {

  it('getBpvConfig returns { verwachteUren: 200 } on cold cache', async () => {
    const { getBpvConfig } = await import('../utils/bpv');

    const result = await getBpvConfig();

    expect(result.verwachteUren).toBe(200);
  });

  it('saveBpvConfig persists round-trip', async () => {
    const { getBpvConfig, saveBpvConfig } = await import('../utils/bpv');

    await saveBpvConfig({ verwachteUren: 320 });

    // Invalidate module cache but retain store map
    vi.resetModules();
    const { getBpvConfig: getConfig2 } = await import('../utils/bpv');

    const result = await getConfig2();
    expect(result.verwachteUren).toBe(320);
  });

  it('getBpvData returns {} on cold cache', async () => {
    const { getBpvData } = await import('../utils/bpv');

    const result = await getBpvData();

    expect(Object.keys(result).length).toBe(0);
  });

  it('saveBpvData persists per-student record', async () => {
    const { getBpvData, saveBpvData } = await import('../utils/bpv');

    await saveBpvData({ 'L-001': { gerealiseerdeUren: 80 } });

    // Invalidate module cache but retain store map
    vi.resetModules();
    const { getBpvData: getData2 } = await import('../utils/bpv');

    const result = await getData2();
    expect(result['L-001']).toBeDefined();
    expect(result['L-001'].gerealiseerdeUren).toBe(80);
  });

  it('berekenBpvPct returns 0 when verwacht is 0', async () => {
    const { berekenBpvPct } = await import('../utils/bpv');

    // Division by zero guard — must return 0, not NaN or Infinity
    expect(berekenBpvPct(50, 0)).toBe(0);
  });

  it('berekenBpvPct caps at 100 when actual exceeds verwacht', async () => {
    const { berekenBpvPct } = await import('../utils/bpv');

    // 250 / 200 * 100 = 125 → capped to 100
    expect(berekenBpvPct(250, 200)).toBe(100);
  });

  it('berekenBpvPct rounds to nearest integer', async () => {
    const { berekenBpvPct } = await import('../utils/bpv');

    // 67 / 200 * 100 = 33.5 → rounds to 34
    expect(berekenBpvPct(67, 200)).toBe(34);
  });

  it('parseBpvExcel STUB returns empty object for valid XLSX magic bytes', async () => {
    const { parseBpvExcel } = await import('../utils/bpv');

    // D-13: parser stubbed — replace when user supplies sample BPV Excel
    // Use XLSX magic bytes (PK\x03\x04) so the format check passes
    const buf = new ArrayBuffer(8);
    new Uint8Array(buf).set([0x50, 0x4B, 0x03, 0x04, 0x00, 0x00, 0x00, 0x00]);
    const result = parseBpvExcel(buf);
    expect(Object.keys(result).length).toBe(0);
  });

  it('parseBpvExcel throws for non-Excel files (magic-byte guard)', async () => {
    const { parseBpvExcel } = await import('../utils/bpv');

    // PDF header (%PDF) — not a valid Excel file
    const buf = new ArrayBuffer(8);
    new Uint8Array(buf).set([0x25, 0x50, 0x44, 0x46, 0x00, 0x00, 0x00, 0x00]);
    expect(() => parseBpvExcel(buf)).toThrow('Onbekend BPV-bestandsformaat');
  });

});

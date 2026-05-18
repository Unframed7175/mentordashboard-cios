// utils/bpv.ts — BPV config + data persistence (Phase 18, SET-06)
// Provides: getBpvConfig, getBpvConfigSync, saveBpvConfig,
//           getBpvData, saveBpvData, berekenBpvPct, parseBpvExcel,
//           BpvConfig, BpvStudentRecord, BpvData, DEFAULT_BPV_CONFIG
//
// Depends on:
//   @tauri-apps/plugin-store — LazyStore
//
// Two store keys:
//   'bpv_config' — plain object (same as settings.ts pattern)
//   'bpv_data'   — JSON-stringified object (data may be large, same as leerlijnen.ts pattern)
//
// Phase 18 Plan 02 — Wave 1 implementation

import { LazyStore } from '@tauri-apps/plugin-store';

const store = new LazyStore('store.json', { defaults: {}, autoSave: false });
const CONFIG_KEY = 'bpv_config';
const DATA_KEY = 'bpv_data';
let _configCache: BpvConfig | null = null; // null = unloaded
let _dataCache: BpvData | null = null;     // null = unloaded

// ── Types ──────────────────────────────────────────────────────────────────────

export interface BpvConfig {
  verwachteUren: number; // default 200 (D-14 per UI-SPEC)
}

export interface BpvStudentRecord {
  gerealiseerdeUren: number;
}

export type BpvData = Record<string, BpvStudentRecord>; // keyed by leerlingId

export const DEFAULT_BPV_CONFIG: BpvConfig = {
  verwachteUren: 200,
};

// ── getBpvConfig() ─────────────────────────────────────────────────────────────

/**
 * Returns current BPV config (expected hours).
 * Reads from plugin-store; falls back to DEFAULT_BPV_CONFIG.
 * Result is cached until save.
 */
export async function getBpvConfig(): Promise<BpvConfig> {
  if (_configCache !== null) return _configCache;
  try {
    const raw = await store.get<BpvConfig>(CONFIG_KEY);
    if (raw && typeof raw.verwachteUren === 'number') {
      _configCache = raw;
      return _configCache;
    }
  } catch (e: any) {
    console.warn('[bpv.ts] config read error:', e);
  }
  _configCache = { ...DEFAULT_BPV_CONFIG };
  return _configCache;
}

// ── getBpvConfigSync() ────────────────────────────────────────────────────────

/**
 * Synchronous cache accessor for BPV config.
 * Returns cached config if present, otherwise DEFAULT_BPV_CONFIG.
 * Pre-warm by calling getBpvConfig() at app startup.
 */
export function getBpvConfigSync(): BpvConfig {
  return _configCache ?? DEFAULT_BPV_CONFIG;
}

// ── saveBpvConfig() ───────────────────────────────────────────────────────────

/**
 * Persists BPV config to plugin-store.
 * CRITICAL: updates _configCache FIRST (instant-apply, pitfall 5), then persists async.
 * CRITICAL: store.set() + store.save() must both be awaited (Phase 12 pitfall).
 * Returns true on success, false on error.
 */
export async function saveBpvConfig(c: BpvConfig): Promise<boolean> {
  _configCache = c; // instant-apply: update cache before async write (pitfall 5)
  try {
    await store.set(CONFIG_KEY, c); // pass object directly (settings.ts pattern)
    await store.save(); // VERPLICHT: set() is alleen in-memory
    return true;
  } catch (e: any) {
    console.warn('[bpv.ts] config write error:', e);
    return false;
  }
}

// ── getBpvData() ──────────────────────────────────────────────────────────────

/**
 * Returns current BPV data (per-student actual hours).
 * Reads from plugin-store; falls back to {} (empty record).
 * Result is cached until save.
 */
export async function getBpvData(): Promise<BpvData> {
  if (_dataCache !== null) return _dataCache;
  try {
    const raw = await store.get<string>(DATA_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        _dataCache = parsed as BpvData;
        return _dataCache;
      }
    }
  } catch (e: any) {
    console.warn('[bpv.ts] data read error:', e);
  }
  _dataCache = {};
  return _dataCache;
}

// ── saveBpvData() ─────────────────────────────────────────────────────────────

/**
 * Persists BPV data to plugin-store as JSON string (data may be large).
 * CRITICAL: updates _dataCache FIRST (instant-apply, pitfall 5), then persists async.
 * CRITICAL: store.set() + store.save() must both be awaited (Phase 12 pitfall).
 * Returns true on success, false on error.
 */
export async function saveBpvData(d: BpvData): Promise<boolean> {
  _dataCache = d; // instant-apply: update cache before async write (pitfall 5)
  try {
    await store.set(DATA_KEY, JSON.stringify(d));
    await store.save(); // VERPLICHT: set() is alleen in-memory
    return true;
  } catch (e: any) {
    console.warn('[bpv.ts] data write error:', e);
    return false;
  }
}

// ── berekenBpvPct() ───────────────────────────────────────────────────────────

/**
 * Calculate BPV completion percentage.
 * Caps at 100, rounds to nearest integer.
 * Returns 0 if verwacht is 0 or negative (division guard).
 */
export function berekenBpvPct(gerealiseerd: number, verwacht: number): number {
  if (!verwacht || verwacht <= 0) return 0;
  return Math.min(100, Math.round((gerealiseerd / verwacht) * 100));
}

// ── parseBpvExcel() ───────────────────────────────────────────────────────────

/**
 * Parse a BPV Excel file into BpvData.
 * D-13: BPV Excel parser stubbed — replace when user supplies sample BPV Excel file
 */
export function parseBpvExcel(buffer: ArrayBuffer): BpvData {
  // D-13: BPV Excel parser stubbed — replace when user supplies sample BPV Excel file
  // Magic-byte guard: reject files that are clearly not XLSX (PK\x03\x04) or XLS (D0 CF 11 E0)
  const bytes = new Uint8Array(buffer.slice(0, 8));
  const isXlsx = bytes[0] === 0x50 && bytes[1] === 0x4B && bytes[2] === 0x03 && bytes[3] === 0x04;
  const isXls  = bytes[0] === 0xD0 && bytes[1] === 0xCF && bytes[2] === 0x11 && bytes[3] === 0xE0;
  if (!isXlsx && !isXls) {
    throw new Error('Onbekend BPV-bestandsformaat');
  }
  return {};
}

console.log('[bpv.ts] BPV config + data persistence geladen');

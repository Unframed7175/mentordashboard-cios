// utils/normen.ts — Doorstroomnorm drempelwaarden persistence (Phase 25, NORM-06/07)
// Provides: loadNormen, getNormenSync, saveNormen, resetNormen,
//           Normen, DEFAULT_NORMEN
//
// Depends on:
//   @tauri-apps/plugin-store — LazyStore
//
// Follows the LazyStore + object-shape pattern from utils/verzuimDrempels.ts (Phase 18).
// Config stored as plain object (not JSON-stringified) under key 'doorstroom_normen' in store.json.
// Validation uses Number.isFinite() + per-field min/max range enforcement (T-25-03, T-25-08).

import { LazyStore } from '@tauri-apps/plugin-store';

const store = new LazyStore('store.json', { defaults: {}, autoSave: false });
const STORE_KEY = 'doorstroom_normen';
let _cache: Normen | null = null; // null = unloaded

// ── Types ──────────────────────────────────────────────────────────────────────

export interface Normen {
  sbl: number;                  // default 13; min=1, max=19
  sbc: number;                  // default 15; min=1, max=19
  negatiefTotaal: number;       // default 6;  min=1, max=19
  negatiefPerLeerlijn: number;  // default 2;  min=1, max=6
  bj1Positief: number;          // default 13; min=1, max=19
  versneldLesgeven: number;     // default 4;  min=1, max=6
  versneldOrganiseren: number;  // default 3;  min=1, max=6
  versneldProfHandelen: number; // default 5;  min=1, max=6
}

export const DEFAULT_NORMEN: Normen = {
  sbl: 13,
  sbc: 15,
  negatiefTotaal: 6,
  negatiefPerLeerlijn: 2,
  bj1Positief: 13,
  versneldLesgeven: 4,
  versneldOrganiseren: 3,
  versneldProfHandelen: 5,
};

// ── getNormenSync() ────────────────────────────────────────────────────────────

/**
 * Synchronous cache accessor.
 * Returns cached normen if present, otherwise DEFAULT_NORMEN.
 * Use in berekenPrognose() and other sync call sites instead of the async version.
 * Pre-warm by calling loadNormen() at app startup.
 */
export function getNormenSync(): Normen {
  return _cache ?? DEFAULT_NORMEN;
}

// ── loadNormen() ───────────────────────────────────────────────────────────────

/**
 * Returns current doorstroomnorm drempelwaarden.
 * Reads from plugin-store; validates all 8 fields with Number.isFinite() AND per-field
 * min/max range enforcement. Falls back to DEFAULT_NORMEN on any validation failure.
 * Result is cached until save.
 */
export async function loadNormen(): Promise<Normen> {
  if (_cache !== null) return _cache;
  try {
    const raw = await store.get<Normen>(STORE_KEY);
    if (raw) {
      // Validate each field: Number.isFinite() + per-field min/max range (T-25-03, T-25-08)
      if (!Number.isFinite(raw.sbl) || raw.sbl < 1 || raw.sbl > 19) {
        console.warn('[normen.ts] invalid field \'sbl\':', raw.sbl);
        _cache = { ...DEFAULT_NORMEN };
        return _cache;
      }
      if (!Number.isFinite(raw.sbc) || raw.sbc < 1 || raw.sbc > 19) {
        console.warn('[normen.ts] invalid field \'sbc\':', raw.sbc);
        _cache = { ...DEFAULT_NORMEN };
        return _cache;
      }
      if (!Number.isFinite(raw.negatiefTotaal) || raw.negatiefTotaal < 1 || raw.negatiefTotaal > 19) {
        console.warn('[normen.ts] invalid field \'negatiefTotaal\':', raw.negatiefTotaal);
        _cache = { ...DEFAULT_NORMEN };
        return _cache;
      }
      if (!Number.isFinite(raw.negatiefPerLeerlijn) || raw.negatiefPerLeerlijn < 1 || raw.negatiefPerLeerlijn > 6) {
        console.warn('[normen.ts] invalid field \'negatiefPerLeerlijn\':', raw.negatiefPerLeerlijn);
        _cache = { ...DEFAULT_NORMEN };
        return _cache;
      }
      if (!Number.isFinite(raw.bj1Positief) || raw.bj1Positief < 1 || raw.bj1Positief > 19) {
        console.warn('[normen.ts] invalid field \'bj1Positief\':', raw.bj1Positief);
        _cache = { ...DEFAULT_NORMEN };
        return _cache;
      }
      if (!Number.isFinite(raw.versneldLesgeven) || raw.versneldLesgeven < 1 || raw.versneldLesgeven > 6) {
        console.warn('[normen.ts] invalid field \'versneldLesgeven\':', raw.versneldLesgeven);
        _cache = { ...DEFAULT_NORMEN };
        return _cache;
      }
      if (!Number.isFinite(raw.versneldOrganiseren) || raw.versneldOrganiseren < 1 || raw.versneldOrganiseren > 6) {
        console.warn('[normen.ts] invalid field \'versneldOrganiseren\':', raw.versneldOrganiseren);
        _cache = { ...DEFAULT_NORMEN };
        return _cache;
      }
      if (!Number.isFinite(raw.versneldProfHandelen) || raw.versneldProfHandelen < 1 || raw.versneldProfHandelen > 6) {
        console.warn('[normen.ts] invalid field \'versneldProfHandelen\':', raw.versneldProfHandelen);
        _cache = { ...DEFAULT_NORMEN };
        return _cache;
      }
      _cache = raw;
      return _cache;
    }
  } catch (e: any) {
    console.warn('[normen.ts] read error:', e);
  }
  _cache = { ...DEFAULT_NORMEN };
  return _cache;
}

// ── saveNormen() ───────────────────────────────────────────────────────────────

/**
 * Persists normen to plugin-store.
 * CRITICAL: updates _cache FIRST (instant-apply, pitfall 5), then persists async.
 * CRITICAL: store.set() + store.save() must both be awaited (Phase 12 pitfall).
 * Returns true on success, false on error. Failure is logged via console.error (T-25-07).
 */
export async function saveNormen(normen: Normen): Promise<boolean> {
  _cache = normen; // instant-apply: update cache before async write (pitfall 5)
  try {
    await store.set(STORE_KEY, normen); // pass object directly (settings.ts pattern, no JSON.stringify)
    await store.save(); // VERPLICHT: set() is alleen in-memory
    return true;
  } catch (e: any) {
    console.error('[normen.ts] saveNormen failed — settings not persisted');
    return false;
  }
}

// ── resetNormen() ──────────────────────────────────────────────────────────────

/**
 * Resets normen to DEFAULT_NORMEN and persists the reset.
 * Returns DEFAULT_NORMEN after persisting.
 */
export async function resetNormen(): Promise<Normen> {
  await saveNormen({ ...DEFAULT_NORMEN });
  return DEFAULT_NORMEN;
}

console.log('[normen.ts] Doorstroomnorm drempelwaarden persistence geladen');

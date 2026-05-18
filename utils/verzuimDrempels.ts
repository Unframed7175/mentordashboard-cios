// utils/verzuimDrempels.ts — Verzuim drempelwaarden persistence (Phase 18, SET-05)
// Provides: loadVerzuimDrempels, getVerzuimDrempelsSync, saveVerzuimDrempels,
//           VerzuimDrempels, DEFAULT_VERZUIM_DREMPELS
//
// Depends on:
//   @tauri-apps/plugin-store — LazyStore
//
// Follows the LazyStore + object-shape pattern from utils/settings.ts (Phase 12).
// Config stored as plain object (not JSON-stringified) under key 'verzuim_drempels' in store.json.

import { LazyStore } from '@tauri-apps/plugin-store';

const store = new LazyStore('store.json', { defaults: {}, autoSave: false });
const STORE_KEY = 'verzuim_drempels';
let _cache: VerzuimDrempels | null = null; // null = unloaded

// ── Types ──────────────────────────────────────────────────────────────────────

export interface VerzuimDrempels {
  geoorloofd:   number; // minutes; default 900 (15u)
  ongeoorloofd: number; // minutes; default 600 (10u — preserves VERZUIM_DREMPEL_MIN)
}

export const DEFAULT_VERZUIM_DREMPELS: VerzuimDrempels = {
  geoorloofd:   900,
  ongeoorloofd: 600,
};

// ── getVerzuimDrempelsSync() ──────────────────────────────────────────────────

/**
 * Synchronous cache accessor.
 * Returns cached drempels if present, otherwise DEFAULT_VERZUIM_DREMPELS.
 * Use in berekenStatus() and other sync call sites instead of the async version.
 * Pre-warm by calling loadVerzuimDrempels() at app startup.
 */
export function getVerzuimDrempelsSync(): VerzuimDrempels {
  return _cache ?? DEFAULT_VERZUIM_DREMPELS;
}

// ── loadVerzuimDrempels() ─────────────────────────────────────────────────────

/**
 * Returns current verzuim drempels.
 * Reads from plugin-store; falls back to DEFAULT_VERZUIM_DREMPELS.
 * Result is cached until save.
 */
export async function loadVerzuimDrempels(): Promise<VerzuimDrempels> {
  if (_cache !== null) return _cache;
  try {
    const raw = await store.get<VerzuimDrempels>(STORE_KEY);
    if (raw && typeof raw.geoorloofd === 'number' && typeof raw.ongeoorloofd === 'number') {
      _cache = raw;
      return _cache;
    }
  } catch (e: any) {
    console.warn('[verzuimDrempels.ts] read error:', e);
  }
  _cache = { ...DEFAULT_VERZUIM_DREMPELS };
  return _cache;
}

// ── saveVerzuimDrempels() ─────────────────────────────────────────────────────

/**
 * Persists drempels to plugin-store.
 * CRITICAL: updates _cache FIRST (instant-apply, pitfall 5), then persists async.
 * CRITICAL: store.set() + store.save() must both be awaited (Phase 12 pitfall).
 * Returns true on success, false on error.
 */
export async function saveVerzuimDrempels(drempels: VerzuimDrempels): Promise<boolean> {
  _cache = drempels; // instant-apply: update cache before async write (pitfall 5)
  try {
    await store.set(STORE_KEY, drempels); // pass object directly (settings.ts pattern, no JSON.stringify)
    await store.save(); // VERPLICHT: set() is alleen in-memory
    return true;
  } catch (e: any) {
    console.warn('[verzuimDrempels.ts] plugin-store write error:', e);
    return false;
  }
}

console.log('[verzuimDrempels.ts] Verzuim drempelwaarden persistence geladen');

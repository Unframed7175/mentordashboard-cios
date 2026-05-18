// utils/deelgebieden.ts — Deelgebieden config persistence (Phase 18, SET-03)
// Provides: getDeelgebiedenConfig, getDeelgebiedenConfigSync, saveDeelgebiedenConfig,
//           resetDeelgebiedenConfig, getActiveDGIds, buildDefaultDeelgebiedenConfig
//
// Depends on:
//   utils/schema.ts — DEELGEBIEDEN (19 entries)
//   @tauri-apps/plugin-store — LazyStore
//
// Follows the LazyStore pattern from utils/leerlijnen.ts (Phase 12).
// Config is stored as JSON string under key 'deelgebieden_config' in store.json.

import { DEELGEBIEDEN } from './schema';
import { LazyStore } from '@tauri-apps/plugin-store';

const store = new LazyStore('store.json', { defaults: {}, autoSave: false });
const STORE_KEY = 'deelgebieden_config';
let _cache: DeelgebiedConfig[] | null = null; // null = unloaded

// ── Types ──────────────────────────────────────────────────────────────────────

export interface DeelgebiedConfig {
  id:     string;   // matches Deelgebied.id from schema.ts ('va', 'mm', ...)
  label:  string;   // display label — may differ from schema default
  active: boolean;  // false = hidden in matrix/spider/prognose
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Build default config from schema DEELGEBIEDEN.
 * All entries active by default with schema label.
 */
export function buildDefaultDeelgebiedenConfig(): DeelgebiedConfig[] {
  return DEELGEBIEDEN.map(dg => ({ id: dg.id, label: dg.label, active: true }));
}

/**
 * Validate that a parsed config array matches the schema.
 * Must be an array, same length as DEELGEBIEDEN, and contain every id.
 */
function isValid(config: any): boolean {
  if (!Array.isArray(config) || config.length !== DEELGEBIEDEN.length) return false;
  return DEELGEBIEDEN.every(dg => config.some((c: any) => c.id === dg.id));
}

// ── getDeelgebiedenConfig() ────────────────────────────────────────────────────

/**
 * Returns current deelgebied config.
 * Reads from plugin-store; falls back to schema defaults.
 * Result is cached until save/reset.
 */
export async function getDeelgebiedenConfig(): Promise<DeelgebiedConfig[]> {
  if (_cache !== null) return _cache;
  try {
    const stored = await store.get<string>(STORE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (isValid(parsed)) {
        _cache = parsed;
        return _cache!;
      }
    }
  } catch (e: any) {
    console.warn('[deelgebieden.ts] read error:', e);
  }
  _cache = buildDefaultDeelgebiedenConfig();
  return _cache;
}

// ── getDeelgebiedenConfigSync() ───────────────────────────────────────────────

/**
 * Synchronous cache accessor.
 * Returns cached config if present, otherwise schema defaults.
 * Pre-warm by calling getDeelgebiedenConfig() at app startup.
 */
export function getDeelgebiedenConfigSync(): DeelgebiedConfig[] {
  return _cache ?? buildDefaultDeelgebiedenConfig();
}

// ── saveDeelgebiedenConfig() ──────────────────────────────────────────────────

/**
 * Persists config to plugin-store.
 * CRITICAL: updates _cache FIRST (instant-apply, pitfall 5), then persists async.
 * CRITICAL: store.set() + store.save() must both be awaited (Phase 12 pitfall).
 * Returns true on success, false on error.
 */
export async function saveDeelgebiedenConfig(config: DeelgebiedConfig[]): Promise<boolean> {
  _cache = config; // instant-apply: update cache before async write (pitfall 5)
  try {
    await store.set(STORE_KEY, JSON.stringify(config));
    await store.save(); // VERPLICHT: set() is alleen in-memory
    return true;
  } catch (e: any) {
    console.warn('[deelgebieden.ts] plugin-store write error:', e);
    return false;
  }
}

// ── resetDeelgebiedenConfig() ─────────────────────────────────────────────────

/**
 * Removes the plugin-store entry.
 * Next getDeelgebiedenConfig() will return schema defaults.
 * Clears cache.
 */
export async function resetDeelgebiedenConfig(): Promise<void> {
  try {
    await store.delete(STORE_KEY);
    await store.save();
  } catch (e: any) {
    console.warn('[deelgebieden.ts] plugin-store remove error:', e);
  }
  _cache = null;
}

// ── getActiveDGIds() ──────────────────────────────────────────────────────────

/**
 * Returns array of active deelgebied IDs for berekenPrognose parameter.
 * Pure helper — no store access.
 */
export function getActiveDGIds(config: DeelgebiedConfig[]): string[] {
  return config.filter(c => c.active).map(c => c.id);
}

console.log('[deelgebieden.ts] Deelgebieden config persistence geladen');

// utils/leerlijnen.ts — Leerlijn-toewijzing persistence
// Levert: getLeerlijnenMapping, saveLeerlijnenMapping, resetLeerlijnenMapping
//
// Depends on:
//   utils/schema.ts — DEELGEBIEDEN
//
// Phase 12 Plan 03: Gemigreerd van localStorage naar plugin-store (plain JSON, onversleuteld per D-12-06)
// Legacy key 'mentordashboard_leerlijnen_v1' wordt eenmalig gemigreerd bij eerste aanroep.
// Mapping format: { 'va': 'lesgeven', 'mm': 'lesgeven', ... }

import { DEELGEBIEDEN } from './schema';
import { LazyStore } from '@tauri-apps/plugin-store';

const store = new LazyStore('store.json', { defaults: {}, autoSave: false });
const LEERLIJNEN_STORE_KEY = 'leerlijnen';
const LEERLIJNEN_LEGACY_KEY = 'mentordashboard_leerlijnen_v1';
let _cachedMapping: Record<string, string> | null = null; // in-memory cache; invalidated on save/reset

// Build default mapping from schema DEELGEBIEDEN
function buildDefault(): Record<string, string> {
  const deelgebieden = DEELGEBIEDEN;
  return deelgebieden.reduce(function(m: Record<string, string>, dg: any) {
    m[dg.id] = dg.group;
    return m;
  }, {});
}

// Validate that a parsed mapping contains all 19 deelgebied IDs
function isValid(mapping: any): boolean {
  if (!mapping || typeof mapping !== 'object') return false;
  const deelgebieden = DEELGEBIEDEN;
  for (var i = 0; i < deelgebieden.length; i++) {
    if (!Object.prototype.hasOwnProperty.call(mapping, deelgebieden[i].id)) return false;
  }
  return true;
}

/**
 * getLeerlijnenMapping()
 * Returns { dgId: leerlijn, ... } for all 19 deelgebieden.
 * Reads from plugin-store; falls back to legacy localStorage migration or schema defaults.
 * Result is cached until save/reset.
 */
export async function getLeerlijnenMapping(): Promise<Record<string, string>> {
  if (_cachedMapping !== null) return _cachedMapping;
  try {
    const stored = await store.get<string>(LEERLIJNEN_STORE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (isValid(parsed)) { _cachedMapping = parsed; return _cachedMapping!; }
    }
    // Legacy migration
    const legacy = localStorage.getItem(LEERLIJNEN_LEGACY_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      if (isValid(parsed)) {
        await saveLeerlijnenMapping(parsed);    // persist naar store
        localStorage.removeItem(LEERLIJNEN_LEGACY_KEY);
        _cachedMapping = parsed;
        return _cachedMapping!;
      }
    }
  } catch (e: any) {
    console.warn('[leerlijnen.ts] read error:', e);
  }
  _cachedMapping = buildDefault();
  return _cachedMapping;
}

/**
 * saveLeerlijnenMapping(mapping)
 * Persists full mapping { dgId: leerlijn, ... } to plugin-store.
 * Clears cache so next getLeerlijnenMapping() reads fresh.
 * Returns true on success, false on error.
 */
export async function saveLeerlijnenMapping(mapping: any): Promise<boolean> {
  try {
    await store.set(LEERLIJNEN_STORE_KEY, JSON.stringify(mapping));
    await store.save();   // VERPLICHT: set() is alleen in-memory
    _cachedMapping = null;
    return true;
  } catch (e: any) {
    console.warn('[leerlijnen.ts] plugin-store write error:', e);
    return false;
  }
}

/**
 * resetLeerlijnenMapping()
 * Removes the plugin-store entry. Next getLeerlijnenMapping() returns schema defaults.
 * Clears cache.
 */
export async function resetLeerlijnenMapping(): Promise<void> {
  try {
    await store.delete(LEERLIJNEN_STORE_KEY);
    await store.save();
  } catch (e: any) {
    console.warn('[leerlijnen.ts] plugin-store remove error:', e);
  }
  _cachedMapping = null;
}

console.log('[leerlijnen.ts] Leerlijn-toewijzing persistence geladen');

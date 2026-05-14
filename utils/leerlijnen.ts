// utils/leerlijnen.ts — Leerlijn-toewijzing persistence
// Levert: getLeerlijnenMapping, saveLeerlijnenMapping, resetLeerlijnenMapping
//
// Depends on:
//   utils/schema.ts — DEELGEBIEDEN
//
// localStorage key: 'mentordashboard_leerlijnen_v1'
// Mapping format: { 'va': 'lesgeven', 'mm': 'lesgeven', ... }

import { DEELGEBIEDEN } from './schema';

const STORAGE_KEY = 'mentordashboard_leerlijnen_v1';
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
 * Reads from localStorage override if valid; falls back to schema defaults.
 * Result is cached until save/reset.
 */
export function getLeerlijnenMapping(): Record<string, string> {
  if (_cachedMapping !== null) return _cachedMapping;

  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      var parsed = JSON.parse(raw);
      if (isValid(parsed)) {
        _cachedMapping = parsed;
        return _cachedMapping!;
      }
    }
  } catch (e: any) {
    console.warn('[leerlijnen.ts] localStorage read error:', e);
  }

  _cachedMapping = buildDefault();
  return _cachedMapping;
}

/**
 * saveLeerlijnenMapping(mapping)
 * Persists full mapping { dgId: leerlijn, ... } to localStorage.
 * Clears cache so next getLeerlijnenMapping() reads fresh.
 * Returns true on success, false on error.
 */
export function saveLeerlijnenMapping(mapping: any): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mapping));
    _cachedMapping = null; // invalidate cache
    return true;
  } catch (e: any) {
    console.warn('[leerlijnen.ts] localStorage write error:', e);
    return false;
  }
}

/**
 * resetLeerlijnenMapping()
 * Removes the localStorage override. Next getLeerlijnenMapping() returns schema defaults.
 * Clears cache.
 */
export function resetLeerlijnenMapping(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e: any) {
    console.warn('[leerlijnen.ts] localStorage remove error:', e);
  }
  _cachedMapping = null; // invalidate cache
}

console.log('[leerlijnen.ts] Leerlijn-toewijzing persistence geladen');

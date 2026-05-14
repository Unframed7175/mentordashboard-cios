/* utils/klassen.ts — Multi-class state management (Phase 6)
 * TypeScript migration from klassen.js (Plan 03)
 * Depends on: utils/datamodel.ts (appState, saveState)
 */

import { appState, saveState } from './datamodel';

var KLASSEN_KEY = 'mentordashboard_klassen_v1';

// ── State object ──────────────────────────────────────────────────────────────
export const klassenState: { klassen: Record<string, any>; activeKlasId: string | null } = {
  klassen: {},       // { [klasId]: { id, naam, students, lastSaved } }
  activeKlasId: null,
};

// ── createKlas(naam) — D-01/D-03/D-04 ────────────────────────────────────────
export function createKlas(naam: string): any {
  if (!naam || typeof naam !== 'string') {
    return { error: 'invalid', naam: naam };
  }
  var trimmedNaam = naam.trim();
  if (!trimmedNaam) {
    return { error: 'invalid', naam: naam };
  }

  // Duplicate name guard (case-insensitive, soft guard per research)
  var lowerNaam = trimmedNaam.toLowerCase();
  var existing = Object.values(klassenState.klassen);
  for (var i = 0; i < existing.length; i++) {
    if ((existing[i] as any).naam.toLowerCase() === lowerNaam) {
      return { error: 'duplicate', naam: trimmedNaam };
    }
  }

  var id = 'klas_' + Date.now().toString(36);
  var klas: { id: string; naam: string; students: any[] } = { id: id, naam: trimmedNaam, students: [] };
  klassenState.klassen[id] = klas;

  switchActiveKlas(id);
  // switchActiveKlas calls saveKlassen, so no need to call again here
  return klas;
}

// ── switchActiveKlas(klasId) — D-07, research Pattern 2 ──────────────────────
export function switchActiveKlas(klasId: string): boolean {
  if (!klassenState.klassen[klasId]) {
    return false;
  }
  klassenState.activeKlasId = klasId;
  // CRITICAL bridge: same array reference so addStudent/mergeVerzuim mutate the right array
  appState.students = klassenState.klassen[klasId].students;
  saveKlassen();
  return true;
}

// ── deleteKlas(klasId) — D-09/KLS-05 ─────────────────────────────────────────
export function deleteKlas(klasId: string): boolean {
  if (!klassenState.klassen[klasId]) {
    return false;
  }
  delete klassenState.klassen[klasId];

  var remainingIds = Object.keys(klassenState.klassen);
  if (klasId === klassenState.activeKlasId) {
    if (remainingIds.length > 0) {
      // Switch to the first remaining class
      klassenState.activeKlasId = remainingIds[0];
      appState.students = klassenState.klassen[remainingIds[0]].students;
    } else {
      // No classes remain
      klassenState.activeKlasId = null;
      appState.students = [];
    }
  }

  saveKlassen();
  return true;
}

// ── saveKlassen() — KLS-04 ────────────────────────────────────────────────────
export function saveKlassen(): boolean {
  try {
    var payload = {
      klassen: klassenState.klassen,
      activeKlasId: klassenState.activeKlasId,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(KLASSEN_KEY, JSON.stringify(payload));
    // Also call saveState() for backward compatibility (harmless dual-write)
    saveState();
    return true;
  } catch (e) {
    console.error('[klassen.ts] saveKlassen mislukt:', e);
    return false;
  }
}

// ── loadKlassen() — KLS-04/KLS-06 ────────────────────────────────────────────
export function loadKlassen(): boolean {
  try {
    var raw = localStorage.getItem(KLASSEN_KEY);
    if (raw) {
      var data = JSON.parse(raw);
      if (data && data.klassen) {
        klassenState.klassen = data.klassen;
        klassenState.activeKlasId = data.activeKlasId || null;

        // Re-establish the bridge for the active class
        if (klassenState.activeKlasId && klassenState.klassen[klassenState.activeKlasId]) {
          appState.students = klassenState.klassen[klassenState.activeKlasId].students;
        } else {
          // Active class ID stored but class no longer exists — pick first
          var ids = Object.keys(klassenState.klassen);
          if (ids.length > 0) {
            klassenState.activeKlasId = ids[0];
            appState.students = klassenState.klassen[ids[0]].students;
          } else {
            klassenState.activeKlasId = null;
            appState.students = [];
          }
        }

        return Object.keys(klassenState.klassen).length > 0;
      }
    }
  } catch (e) {
    console.error('[klassen.ts] loadKlassen mislukt:', e);
  }

  // No klassen data found — attempt v1.0 migration
  return _migrateV1ToKlassen();
}

// ── _migrateV1ToKlassen() — v1.0 auto-migration ───────────────────────────────
export function _migrateV1ToKlassen(): boolean {
  try {
    var raw = localStorage.getItem('mentordashboard_v1');
    if (!raw) {
      return false;
    }
    var oldData = JSON.parse(raw);
    if (!oldData || !Array.isArray(oldData.students) || oldData.students.length === 0) {
      return false;
    }

    // Create a class named "Klas 1" and populate with old students
    var id = 'klas_' + Date.now().toString(36);
    var klas = { id: id, naam: 'Klas 1', students: oldData.students };
    klassenState.klassen[id] = klas;
    klassenState.activeKlasId = id;

    // Establish bridge
    appState.students = klas.students;

    // Persist under new key and remove old key
    saveKlassen();
    localStorage.removeItem('mentordashboard_v1');

    console.log('[klassen.ts] Migratie van v1 naar multi-klas uitgevoerd (' + oldData.students.length + ' leerlingen -> Klas 1)');
    return true;
  } catch (e) {
    console.error('[klassen.ts] _migrateV1ToKlassen mislukt:', e);
    return false;
  }
}

// ── getActiveStudents() — convenience getter ──────────────────────────────────
export function getActiveStudents(): any[] {
  if (!klassenState.activeKlasId) return [];
  var klas = klassenState.klassen[klassenState.activeKlasId];
  if (!klas) return [];
  // Deduplicate to one (most recent) record per leerlingId for grid display (D-11)
  var sorted = klas.students.slice().sort(function(a: any, b: any) {
    return (b.periode || '').localeCompare(a.periode || '');
  });
  var seen: Record<string, boolean> = {};
  var result: any[] = [];
  for (var i = 0; i < sorted.length; i++) {
    if (!seen[sorted[i].leerlingId]) {
      seen[sorted[i].leerlingId] = true;
      result.push(sorted[i]);
    }
  }
  return result;
}

/**
 * Get all StudentRecords for a given leerlingId in the active class,
 * sorted oldest-first by periode string (alphabetical).
 * Used by buildDetailDeelgebieden for multi-period comparison.
 * @param leerlingId
 * @returns StudentRecord[]
 */
export function getAllRecordsForStudent(leerlingId: string): any[] {
  if (!klassenState.activeKlasId) return [];
  var klas = klassenState.klassen[klassenState.activeKlasId];
  if (!klas) return [];
  return klas.students.filter(function(s: any) {
    return s.leerlingId === leerlingId;
  }).sort(function(a: any, b: any) {
    return (a.periode || '').localeCompare(b.periode || '');
  });
}

console.log('[klassen.ts] Multi-class manager loaded');

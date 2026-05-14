/* utils/klassen.ts — Multi-class state management (Phase 12)
 * Replaces localStorage with plugin-store + AES-256-GCM encryption via Rust commands.
 * Depends on: utils/datamodel.ts (appState only — saveState/loadState deprecated)
 */

import { appState } from './datamodel';
import { invoke } from '@tauri-apps/api/core';
import { LazyStore } from '@tauri-apps/plugin-store';

// LazyStore defers file I/O until first access; defaults:{} + autoSave:false = explicit store.save() required
const store = new LazyStore('store.json', { defaults: {}, autoSave: false });

// Legacy keys — read-only during migration; never written after Phase 12
const KLASSEN_KEY_V2 = 'mentordashboard_klassen_v1';
const KLASSEN_KEY_V1 = 'mentordashboard_v1';

// Show error in UI for critical storage failures (D-12-15, D-12-16)
// Phase 12: console.error + DOM insertion as minimal viable error display
// Phase 14: replace with React toast/modal
function showStorageError(message: string): void {
  console.error('[klassen.ts] Opslag fout:', message);
  // Minimal UI notification — Phase 14 will replace with proper React component
  const el = document.getElementById('storage-error-banner');
  if (el) {
    el.textContent = message;
    (el as HTMLElement).style.display = 'block';
  }
}

// ── State object ──────────────────────────────────────────────────────────────
export const klassenState: { klassen: Record<string, any>; activeKlasId: string | null } = {
  klassen: {},       // { [klasId]: { id, naam, students, lastSaved } }
  activeKlasId: null,
};

// Extracted from existing loadKlassen() bridge logic — named for reuse
function _restoreBridge(): void {
  if (klassenState.activeKlasId && klassenState.klassen[klassenState.activeKlasId]) {
    appState.students = klassenState.klassen[klassenState.activeKlasId].students;
  } else {
    const ids = Object.keys(klassenState.klassen);
    if (ids.length > 0) {
      klassenState.activeKlasId = ids[0];
      appState.students = klassenState.klassen[ids[0]].students;
    } else {
      klassenState.activeKlasId = null;
      appState.students = [];
    }
  }
}

// ── createKlas(naam) — D-01/D-03/D-04 ────────────────────────────────────────
export async function createKlas(naam: string): Promise<any> {
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

  await switchActiveKlas(id);
  // switchActiveKlas calls saveKlassen, so no need to call again here
  return klas;
}

// ── switchActiveKlas(klasId) — D-07, research Pattern 2 ──────────────────────
export async function switchActiveKlas(klasId: string): Promise<boolean> {
  if (!klassenState.klassen[klasId]) {
    return false;
  }
  klassenState.activeKlasId = klasId;
  // CRITICAL bridge: same array reference so addStudent/mergeVerzuim mutate the right array
  appState.students = klassenState.klassen[klasId].students;
  await saveKlassen();
  return true;
}

// ── deleteKlas(klasId) — D-09/KLS-05 ─────────────────────────────────────────
export async function deleteKlas(klasId: string): Promise<boolean> {
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

  await saveKlassen();
  return true;
}

// ── deleteStudent(klasId, leerlingId) — D-12-11, D-12-12 ─────────────────────
// Phase 12 function only — UI wiring in Phase 14
// Hard delete — filter students array then re-encrypt entire blob (AVG Art. 17)
export async function deleteStudent(klasId: string, leerlingId: string): Promise<boolean> {
  const klas = klassenState.klassen[klasId];
  if (!klas) return false;
  klas.students = klas.students.filter((s: any) => s.leerlingId !== leerlingId);
  return saveKlassen();
}

// ── saveKlassen() — KLS-04 ────────────────────────────────────────────────────
export async function saveKlassen(): Promise<boolean> {
  try {
    const payload = {
      klassen: klassenState.klassen,
      activeKlasId: klassenState.activeKlasId,
      savedAt: new Date().toISOString(),
    };
    const plaintext = JSON.stringify(payload);
    const ciphertext = await invoke<string>('encrypt_klassen', { plaintext });
    await store.set('klassen', ciphertext);
    await store.save();   // REQUIRED: set() is in-memory only; save() flushes to disk
    return true;
  } catch (e) {
    console.error('[klassen.ts] saveKlassen mislukt:', e);
    return false;
  }
}

// ── loadKlassen() — KLS-04/KLS-06 ────────────────────────────────────────────
export async function loadKlassen(): Promise<boolean> {
  try {
    const ciphertext = await store.get<string>('klassen');
    if (ciphertext) {
      const plaintext = await invoke<string>('decrypt_klassen', { ciphertext });
      const data = JSON.parse(plaintext);
      if (data && data.klassen) {
        klassenState.klassen = data.klassen;
        klassenState.activeKlasId = data.activeKlasId || null;
        _restoreBridge();
        return Object.keys(klassenState.klassen).length > 0;
      }
    }
    // No plugin-store data — attempt localStorage migration (D-12-14)
    return _migrateLocalStorageToStore();
  } catch (e) {
    console.error('[klassen.ts] loadKlassen mislukt:', e);
    // D-12-16: keychain error — start with empty state, show NL error
    showStorageError('Sleutel niet beschikbaar — neem contact op met beheerder');
    return false;
  }
}

// ── _migrateLocalStorageToStore() — replaces _migrateV1ToKlassen ─────────────
async function _migrateLocalStorageToStore(): Promise<boolean> {
  try {
    // Detect localStorage data (v2 multi-klas format or v1 single-klas)
    const rawV2 = localStorage.getItem(KLASSEN_KEY_V2);
    const rawV1 = localStorage.getItem(KLASSEN_KEY_V1);
    const raw = rawV2 || rawV1;
    if (!raw) return false;

    const oldData = JSON.parse(raw);
    // Reconstruct klassenState from old format
    if (rawV2 && oldData && oldData.klassen) {
      klassenState.klassen = oldData.klassen;
      klassenState.activeKlasId = oldData.activeKlasId || null;
    } else if (rawV1 && oldData && Array.isArray(oldData.students) && oldData.students.length > 0) {
      // v1 single-class migration (same as existing _migrateV1ToKlassen)
      const id = 'klas_' + Date.now().toString(36);
      klassenState.klassen[id] = { id, naam: 'Klas 1', students: oldData.students };
      klassenState.activeKlasId = id;
    } else {
      return false;
    }

    _restoreBridge();

    // Encrypt and persist to plugin-store FIRST (D-12-15: don't remove before confirming write)
    const saved = await saveKlassen();
    if (!saved) {
      // Rollback: keep klassenState empty, don't touch localStorage
      klassenState.klassen = {};
      klassenState.activeKlasId = null;
      appState.students = [];
      return false;
    }

    // Only remove localStorage entries AFTER confirmed write (D-12-14, D-12-15)
    if (rawV2) localStorage.removeItem(KLASSEN_KEY_V2);
    if (rawV1) localStorage.removeItem(KLASSEN_KEY_V1);

    console.log('[klassen.ts] Migratie localStorage → plugin-store geslaagd');
    return true;
  } catch (e) {
    console.error('[klassen.ts] _migrateLocalStorageToStore mislukt:', e);
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

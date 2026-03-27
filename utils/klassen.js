/* utils/klassen.js — Multi-class state management (Phase 6)
 * Classic script (no ES module) — exposes window.* globals.
 * Depends on: utils/datamodel.js (window.appState, window.saveState, window.loadState)
 */

var KLASSEN_KEY = 'mentordashboard_klassen_v1';

// ── State object ──────────────────────────────────────────────────────────────
window.klassenState = {
  klassen: {},       // { [klasId]: { id, naam, students, lastSaved } }
  activeKlasId: null,
};

// ── createKlas(naam) — D-01/D-03/D-04 ────────────────────────────────────────
window.createKlas = function(naam) {
  if (!naam || typeof naam !== 'string') {
    return { error: 'invalid', naam: naam };
  }
  var trimmedNaam = naam.trim();
  if (!trimmedNaam) {
    return { error: 'invalid', naam: naam };
  }

  // Duplicate name guard (case-insensitive, soft guard per research)
  var lowerNaam = trimmedNaam.toLowerCase();
  var existing = Object.values(window.klassenState.klassen);
  for (var i = 0; i < existing.length; i++) {
    if (existing[i].naam.toLowerCase() === lowerNaam) {
      return { error: 'duplicate', naam: trimmedNaam };
    }
  }

  var id = 'klas_' + Date.now().toString(36);
  var klas = { id: id, naam: trimmedNaam, students: [] };
  window.klassenState.klassen[id] = klas;

  window.switchActiveKlas(id);
  // switchActiveKlas calls saveKlassen, so no need to call again here
  return klas;
};

// ── switchActiveKlas(klasId) — D-07, research Pattern 2 ──────────────────────
window.switchActiveKlas = function(klasId) {
  if (!window.klassenState.klassen[klasId]) {
    return false;
  }
  window.klassenState.activeKlasId = klasId;
  // CRITICAL bridge: same array reference so addStudent/mergeVerzuim mutate the right array
  window.appState.students = window.klassenState.klassen[klasId].students;
  window.saveKlassen();
  return true;
};

// ── deleteKlas(klasId) — D-09/KLS-05 ─────────────────────────────────────────
window.deleteKlas = function(klasId) {
  if (!window.klassenState.klassen[klasId]) {
    return false;
  }
  delete window.klassenState.klassen[klasId];

  var remainingIds = Object.keys(window.klassenState.klassen);
  if (klasId === window.klassenState.activeKlasId) {
    if (remainingIds.length > 0) {
      // Switch to the first remaining class
      window.klassenState.activeKlasId = remainingIds[0];
      window.appState.students = window.klassenState.klassen[remainingIds[0]].students;
    } else {
      // No classes remain
      window.klassenState.activeKlasId = null;
      window.appState.students = [];
    }
  }

  window.saveKlassen();
  return true;
};

// ── saveKlassen() — KLS-04 ────────────────────────────────────────────────────
window.saveKlassen = function() {
  try {
    var payload = {
      klassen: window.klassenState.klassen,
      activeKlasId: window.klassenState.activeKlasId,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(KLASSEN_KEY, JSON.stringify(payload));
    // Also call saveState() for backward compatibility (harmless dual-write)
    if (typeof window.saveState === 'function') {
      window.saveState();
    }
    return true;
  } catch (e) {
    console.error('[klassen.js] saveKlassen mislukt:', e);
    return false;
  }
};

// ── loadKlassen() — KLS-04/KLS-06 ────────────────────────────────────────────
window.loadKlassen = function() {
  try {
    var raw = localStorage.getItem(KLASSEN_KEY);
    if (raw) {
      var data = JSON.parse(raw);
      if (data && data.klassen) {
        window.klassenState.klassen = data.klassen;
        window.klassenState.activeKlasId = data.activeKlasId || null;

        // Re-establish the bridge for the active class
        if (window.klassenState.activeKlasId && window.klassenState.klassen[window.klassenState.activeKlasId]) {
          window.appState.students = window.klassenState.klassen[window.klassenState.activeKlasId].students;
        } else {
          // Active class ID stored but class no longer exists — pick first
          var ids = Object.keys(window.klassenState.klassen);
          if (ids.length > 0) {
            window.klassenState.activeKlasId = ids[0];
            window.appState.students = window.klassenState.klassen[ids[0]].students;
          } else {
            window.klassenState.activeKlasId = null;
            window.appState.students = [];
          }
        }

        return Object.keys(window.klassenState.klassen).length > 0;
      }
    }
  } catch (e) {
    console.error('[klassen.js] loadKlassen mislukt:', e);
  }

  // No klassen data found — attempt v1.0 migration
  return window._migrateV1ToKlassen();
};

// ── _migrateV1ToKlassen() — v1.0 auto-migration ───────────────────────────────
window._migrateV1ToKlassen = function() {
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
    window.klassenState.klassen[id] = klas;
    window.klassenState.activeKlasId = id;

    // Establish bridge
    window.appState.students = klas.students;

    // Persist under new key and remove old key
    window.saveKlassen();
    localStorage.removeItem('mentordashboard_v1');

    console.log('[klassen.js] Migratie van v1 naar multi-klas uitgevoerd (' + oldData.students.length + ' leerlingen -> Klas 1)');
    return true;
  } catch (e) {
    console.error('[klassen.js] _migrateV1ToKlassen mislukt:', e);
    return false;
  }
};

// ── getActiveStudents() — convenience getter ──────────────────────────────────
window.getActiveStudents = function() {
  if (!window.klassenState.activeKlasId) return [];
  var klas = window.klassenState.klassen[window.klassenState.activeKlasId];
  if (!klas) return [];
  // Deduplicate to one (most recent) record per leerlingId for grid display (D-11)
  var sorted = klas.students.slice().sort(function(a, b) {
    return (b.periode || '').localeCompare(a.periode || '');
  });
  var seen = {};
  var result = [];
  for (var i = 0; i < sorted.length; i++) {
    if (!seen[sorted[i].leerlingId]) {
      seen[sorted[i].leerlingId] = true;
      result.push(sorted[i]);
    }
  }
  return result;
};

/**
 * Get all StudentRecords for a given leerlingId in the active class,
 * sorted oldest-first by periode string (alphabetical).
 * Used by buildDetailDeelgebieden for multi-period comparison.
 * @param {string} leerlingId
 * @returns {StudentRecord[]}
 */
window.getAllRecordsForStudent = function(leerlingId) {
  if (!window.klassenState.activeKlasId) return [];
  var klas = window.klassenState.klassen[window.klassenState.activeKlasId];
  if (!klas) return [];
  return klas.students.filter(function(s) {
    return s.leerlingId === leerlingId;
  }).sort(function(a, b) {
    return (a.periode || '').localeCompare(b.periode || '');
  });
};

console.log('[klassen.js] Multi-class manager loaded');

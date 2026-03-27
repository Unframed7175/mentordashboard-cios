// utils/datamodel.js — In-memory data model for parsed PDF data
// Per D-12: structured object, array of leerlingobjecten
// Per D-13: no persistence — in-memory only
// Per D-14: deelgebied-scores per leerling opvraagbaar for Phase 3

/**
 * @typedef {Object} Opdracht
 * @property {string} naam - Opdracht name (e.g., "Opdracht 1: Lesontwerp")
 * @property {string} status - "Op tijd ingeleverd en wel beoordeeld" | "Zelfevaluatie afgerond" | ""
 * @property {string} feedForward - Feed forward text from teacher
 */

/**
 * @typedef {Object} Vak
 * @property {string} naam - Subject name (e.g., "Sport en Beweging")
 * @property {Opdracht[]} opdrachten - Assignments within this subject
 */

/**
 * @typedef {Object} Datapunt
 * @property {string} vak - Subject name
 * @property {string} datapunt - Assignment name
 * @property {Object<string, string|null>} scores - { 'V&A': 'goed', 'M&M': null, ... }
 */

/**
 * @typedef {Object} StudentRecord
 * @property {string} naam - Full name (e.g., "Bosker, J.G. (Javier-Andres)")
 * @property {string} leerlingId - Student ID from PDF header
 * @property {string} periode - Period (e.g., "BJ2 Fase 2 DD")
 * @property {string} leerjaar - Year level
 * @property {string} filename - Source PDF filename
 * @property {Vak[]} vakken - Subjects with assignments (status + feedforward)
 * @property {Object<string, string|null>} deelgebiedScores - Aggregated scores per deelgebied
 * @property {Datapunt[]} datapunten - Per-assignment scores for gap analysis
 */

/**
 * @typedef {Object} ImportResult
 * @property {StudentRecord[]} students - Successfully parsed students
 * @property {Array<{filename: string, reason: string}>} errors - Failed files with reasons
 */

// Global app state (per D-12: in-memory only)
window.appState = {
  /** @type {StudentRecord[]} */
  students: [],
  /** @type {Array<{filename: string, reason: string}>} */
  lastImportErrors: [],
  /** @type {boolean} */
  importing: false,
};

/**
 * Add a parsed student to the app state.
 * If a student with the same leerlingId + periode already exists, replace (latest import wins).
 * Different periodes coexist in the array.
 */
window.addStudent = function(student) {
  var idx = window.appState.students.findIndex(function(s) {
    return s.leerlingId === student.leerlingId && s.periode === student.periode;
  });
  if (idx >= 0) {
    window.appState.students[idx] = student;
  } else {
    window.appState.students.push(student);
  }
};

/**
 * Get a student's deelgebied scores as a flat map.
 * Returns { 'V&A': 'goed', 'M&M': 'voldoende', ... } — null for unassessed.
 * This is the primary interface for Phase 3 doorstroomnorm calculation.
 */
window.getStudentScores = function(leerlingId) {
  const student = window.appState.students.find(s => s.leerlingId === leerlingId);
  return student ? student.deelgebiedScores : null;
};

console.log('[datamodel.js] Data model loaded');

// ---------------------------------------------------------------------------
// Phase 02 — Verzuim (absence) extension
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} Verzuim
 * @property {number} aanwezigheid - Attendance in minutes
 * @property {number} geoorloofd - Excused absence in minutes
 * @property {number} ongeoorloofd - Unexcused absence in minutes
 * @property {number} totaal - Total absence in minutes
 * @property {string} laatsteMelding - Date of last absence report
 */

/**
 * Normalize a student name for case-insensitive, whitespace-tolerant matching.
 * Handles Dutch name variations like "van den Dool" vs "van den dool".
 *
 * @param {string} naam - Raw name string
 * @returns {string} Lowercased, whitespace-collapsed, trimmed name
 */
window.normalizeNaam = function(naam) {
  if (!naam) return '';
  return String(naam).toLowerCase().replace(/\s+/g, ' ').trim();
};

/**
 * Merge verzuim records into the matching students in window.appState.students.
 *
 * Matching strategy (per XLS-04):
 *   1. Exact match by leerlingnummer === student.leerlingId
 *   2. Fallback: normalized name match (case-insensitive, whitespace-tolerant)
 *
 * Sets student.verzuim = { aanwezigheid, geoorloofd, ongeoorloofd, totaal, laatsteMelding }
 * on each matched student.
 *
 * @param {Array<{naam: string, leerlingnummer: string, aanwezigheid: number, geoorloofd: number, ongeoorloofd: number, totaal: number, laatsteMelding: string}>} verzuimRecords
 * @returns {{ matched: number, unmatched: string[] }}
 */
window.mergeVerzuim = function(verzuimRecords) {
  var result = { matched: 0, unmatched: [] };

  for (var i = 0; i < verzuimRecords.length; i++) {
    var v = verzuimRecords[i];
    var student = null;
    var matchedStrategy = '';

    // Strategy 1: leerlingnummer === leerlingId (exact string)
    student = window.appState.students.find(function(s) {
      return s.leerlingId && s.leerlingId === v.leerlingnummer;
    });
    if (student) matchedStrategy = 'leerlingnummer';

    // Strategy 2: volledige genormaliseerde naam (exact)
    if (!student && v.naam) {
      var normV = window.normalizeNaam(v.naam);
      student = window.appState.students.find(function(s) {
        return window.normalizeNaam(s.naam) === normV;
      });
      if (student) matchedStrategy = 'exacte naam';
    }

    // Strategy 3: achternaam match
    // PDF-formaat: "Achternaam, Initialen (Voornaam)" → achternaam = alles vóór de eerste komma
    // Excel-formaat: "Achternaam, Voornaam" of "Voornaam Achternaam" of "Achternaam"
    // Beide kanten: deel vóór eerste komma OF eerste woord vergelijken
    if (!student && v.naam) {
      var normV3 = window.normalizeNaam(v.naam);
      // Excel achternaam = alles vóór eerste komma, anders eerste "woord"
      var excelAchternaam = normV3.split(',')[0].trim();
      if (excelAchternaam.length >= 3) {
        student = window.appState.students.find(function(s) {
          var pdfAchternaam = window.normalizeNaam(s.naam).split(',')[0].trim();
          return pdfAchternaam.length >= 3 && pdfAchternaam === excelAchternaam;
        });
        if (student) matchedStrategy = 'achternaam';
      }
    }

    // Strategy 4: PDF-achternaam is een substring van de Excel-naam of vice versa
    if (!student && v.naam) {
      var normV4 = window.normalizeNaam(v.naam);
      student = window.appState.students.find(function(s) {
        var pdfAchternaam = window.normalizeNaam(s.naam).split(',')[0].trim();
        return pdfAchternaam.length >= 4 && normV4.indexOf(pdfAchternaam) !== -1;
      });
      if (student) matchedStrategy = 'achternaam-substring';
    }

    if (student) {
      student.verzuim = {
        aanwezigheid:  v.aanwezigheid,
        geoorloofd:    v.geoorloofd,
        ongeoorloofd:  v.ongeoorloofd,
        totaal:        v.totaal,
        laatsteMelding: v.laatsteMelding,
      };
      console.log('[mergeVerzuim] ✓ ' + v.naam + ' → ' + student.naam + ' [via ' + matchedStrategy + ']');
      result.matched++;
    } else {
      console.warn('[mergeVerzuim] ✗ Niet gekoppeld: "' + v.naam + '"');
      result.unmatched.push(v.naam);
    }
  }

  return result;
};

/**
 * Debug helper: vergelijk Excel-namen met PDF-namen in de console.
 * Aanroepen als: window.debugVerzuimKoppeling(verzuimRecords)
 * De records zijn beschikbaar na import via: window._lastVerzuimRecords
 */
window.debugVerzuimKoppeling = function(records) {
  var recs = records || window._lastVerzuimRecords || [];
  console.group('Verzuim koppeling debug');
  console.log('Student namen in app (PDF-formaat):');
  console.table(window.appState.students.map(function(s) {
    return { naam: s.naam, leerlingId: s.leerlingId, achternaam: s.naam.split(',')[0].trim() };
  }));
  console.log('Excel namen (' + recs.length + ' records):');
  console.table(recs.map(function(r) {
    return { naam: r.naam, leerlingnummer: r.leerlingnummer };
  }));
  console.groupEnd();
};

/**
 * Get the verzuim record for a student by leerlingId.
 *
 * @param {string} leerlingId - Student ID
 * @returns {Verzuim|null} The student's verzuim object, or null if not found / no verzuim set
 */
window.getVerzuim = function(leerlingId) {
  const student = window.appState.students.find(function(s) {
    return s.leerlingId === leerlingId;
  });
  return (student && student.verzuim) ? student.verzuim : null;
};

// ---------------------------------------------------------------------------
// Phase 04 — Persistentie via localStorage (PER-01, PER-02)
// ---------------------------------------------------------------------------

var STORAGE_KEY = 'mentordashboard_v1';

/**
 * Sla huidige appState op in localStorage.
 * @returns {boolean} true als opslaan gelukt is
 */
window.saveState = function() {
  try {
    var data = {
      students: window.appState.students,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.warn('[datamodel] saveState mislukt:', e.message);
    return false;
  }
};

/**
 * Laad opgeslagen state uit localStorage in appState.
 * @returns {boolean} true als er data geladen is
 */
window.loadState = function() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    var data = JSON.parse(raw);
    if (data.students && Array.isArray(data.students) && data.students.length > 0) {
      window.appState.students = data.students;
      console.log('[datamodel] ' + data.students.length + ' leerlingen geladen (opgeslagen: ' + data.savedAt + ')');
      return true;
    }
    return false;
  } catch (e) {
    console.warn('[datamodel] loadState mislukt:', e.message);
    return false;
  }
};

/**
 * Wis alle opgeslagen data (localStorage + appState).
 */
window.clearState = function() {
  localStorage.removeItem(STORAGE_KEY);
  window.appState.students = [];
  window.appState.lastImportErrors = [];
  console.log('[datamodel] Alle data gewist');
};

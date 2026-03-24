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
 * If a student with the same leerlingId already exists, replace (latest import wins).
 */
window.addStudent = function(student) {
  const idx = window.appState.students.findIndex(s => s.leerlingId === student.leerlingId);
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

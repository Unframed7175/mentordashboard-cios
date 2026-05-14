// utils/actiepunten.ts — Actiepunten store voor Mentordashboard CIOS
// TypeScript migration from actiepunten.js (Plan 03)
//
// Exports: actiepuntenStore, normalizeOnderwerp, isHerhaling
// Storage: student.actiepunten[] on most recent StudentRecord per leerlingId
// Persisted via appState + saveState() from ./datamodel

import { appState, saveState } from './datamodel';

const VALID_STATUS = ['open', 'opgepakt', 'herhaling'] as const;
type ValidStatus = typeof VALID_STATUS[number];

function isValidStatus(s: string): s is ValidStatus {
  return (VALID_STATUS as readonly string[]).includes(s);
}

/**
 * Returns the most recent StudentRecord for leerlingId from appState.
 * @param leerlingId
 * @returns Object|null
 */
function getStudent(leerlingId: string): any | null {
  var students = appState.students;
  if (!Array.isArray(students)) return null;
  // Traverse all, return last match (most recent record in array)
  var found: any = null;
  for (var i = 0; i < students.length; i++) {
    if (students[i].leerlingId === leerlingId) found = students[i];
  }
  return found;
}

/**
 * Generate a unique ID.
 * @returns string
 */
function genId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

/**
 * Normalizes an onderwerp string for comparison:
 * lowercased, whitespace-collapsed, trimmed.
 * @param s
 * @returns string
 */
export function normalizeOnderwerp(s: string): string {
  return String(s == null ? '' : s).toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Returns true if nieuwOnderwerp (normalized) already exists in the given
 * actiepunten list (or student.actiepunten), excluding the item with excludeId.
 * Returns false if normalized onderwerp is shorter than 3 characters (avoid noise).
 *
 * @param listOrStudent  - Actiepunt[] or StudentRecord
 * @param nieuwOnderwerp
 * @param excludeId      - id to skip (for edit-self guard)
 * @returns boolean
 */
export function isHerhaling(listOrStudent: any, nieuwOnderwerp: string, excludeId?: string): boolean {
  var list: any[] = Array.isArray(listOrStudent)
    ? listOrStudent
    : (listOrStudent && listOrStudent.actiepunten) || [];
  var norm = normalizeOnderwerp(nieuwOnderwerp);
  if (!norm || norm.length < 3) return false;
  for (var i = 0; i < list.length; i++) {
    if (list[i].id === excludeId) continue;
    if (normalizeOnderwerp(list[i].onderwerp) === norm) return true;
  }
  return false;
}

var store = {
  /**
   * Return a copy of the actiepunten list for leerlingId.
   * @param leerlingId
   * @returns Object[]
   */
  list: function(leerlingId: string): any[] {
    var s = getStudent(leerlingId);
    return (s && Array.isArray(s.actiepunten)) ? s.actiepunten.slice() : [];
  },

  /**
   * Add a new actiepunt for leerlingId.
   * Applies herhaling auto-detect: if same onderwerp already exists, status becomes 'herhaling'.
   * @param leerlingId
   * @param patch
   * @returns Object|null  The created Actiepunt, or null if student not found
   */
  add: function(leerlingId: string, patch: { onderwerp: string; datum: string; status: string }): any | null {
    var s = getStudent(leerlingId);
    if (!s) return null;
    if (!Array.isArray(s.actiepunten)) s.actiepunten = [];
    var desired: ValidStatus = isValidStatus(patch.status) ? patch.status : 'open';
    var item = {
      id: genId(),
      onderwerp: String(patch.onderwerp || '').trim(),
      datum: String(patch.datum || ''),
      status: (desired === 'herhaling' || isHerhaling(s.actiepunten, patch.onderwerp, undefined))
              ? 'herhaling' : desired
    };
    s.actiepunten.push(item);
    saveState();
    return item;
  },

  /**
   * Update an existing actiepunt by id.
   * If onderwerp changes, applies herhaling auto-detect (excludes self).
   * If patch explicitly sets status, that status is used (no override).
   * @param leerlingId
   * @param id
   * @param patch
   * @returns Object|null
   */
  update: function(leerlingId: string, id: string, patch: any): any | null {
    var s = getStudent(leerlingId);
    if (!s || !Array.isArray(s.actiepunten)) return null;
    for (var i = 0; i < s.actiepunten.length; i++) {
      if (s.actiepunten[i].id === id) {
        var merged = Object.assign({}, s.actiepunten[i], patch || {});
        var hasStatus = patch && Object.prototype.hasOwnProperty.call(patch, 'status');
        var desired: ValidStatus = isValidStatus(merged.status) ? merged.status : 'open';
        if (!hasStatus && isHerhaling(s.actiepunten, merged.onderwerp, id)) {
          merged.status = 'herhaling';
        } else {
          merged.status = desired;
        }
        s.actiepunten[i] = merged;
        saveState();
        return merged;
      }
    }
    return null;
  },

  /**
   * Remove an actiepunt by id.
   * @param leerlingId
   * @param id
   * @returns boolean
   */
  remove: function(leerlingId: string, id: string): boolean {
    var s = getStudent(leerlingId);
    if (!s || !Array.isArray(s.actiepunten)) return false;
    var before = s.actiepunten.length;
    s.actiepunten = s.actiepunten.filter(function(a: any) { return a.id !== id; });
    saveState();
    return s.actiepunten.length < before;
  }
};

export const actiepuntenStore = store;

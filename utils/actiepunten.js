// utils/actiepunten.js — Actiepunten store voor Mentordashboard CIOS
// Phase 13 Plan 02 — FEED-01, FEED-02
//
// Exposes window.actiepuntenStore, window.normalizeOnderwerp, window.isHerhaling
// Storage: student.actiepunten[] on most recent StudentRecord per leerlingId
// Persisted via window.appState + window.saveState() (D-09)

'use strict';

(function() {
  var VALID_STATUS = ['open', 'opgepakt', 'herhaling'];

  /**
   * Returns the most recent StudentRecord for leerlingId from window.appState.
   * @param {string} leerlingId
   * @returns {Object|null}
   */
  function getStudent(leerlingId) {
    var students = window.appState && window.appState.students;
    if (!Array.isArray(students)) return null;
    // Traverse all, return last match (most recent record in array)
    var found = null;
    for (var i = 0; i < students.length; i++) {
      if (students[i].leerlingId === leerlingId) found = students[i];
    }
    return found;
  }

  /**
   * Generate a unique ID.
   * @returns {string}
   */
  function genId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }

  /**
   * Normalizes an onderwerp string for comparison:
   * lowercased, whitespace-collapsed, trimmed.
   * @param {string} s
   * @returns {string}
   */
  function normalizeOnderwerp(s) {
    return String(s == null ? '' : s).toLowerCase().replace(/\s+/g, ' ').trim();
  }

  /**
   * Returns true if nieuwOnderwerp (normalized) already exists in the given
   * actiepunten list (or student.actiepunten), excluding the item with excludeId.
   * Returns false if normalized onderwerp is shorter than 3 characters (avoid noise).
   *
   * @param {Object[]|Object} listOrStudent  - Actiepunt[] or StudentRecord
   * @param {string}          nieuwOnderwerp
   * @param {string|null}     excludeId      - id to skip (for edit-self guard)
   * @returns {boolean}
   */
  function isHerhaling(listOrStudent, nieuwOnderwerp, excludeId) {
    var list = Array.isArray(listOrStudent)
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
     * @param {string} leerlingId
     * @returns {Object[]}
     */
    list: function(leerlingId) {
      var s = getStudent(leerlingId);
      return (s && Array.isArray(s.actiepunten)) ? s.actiepunten.slice() : [];
    },

    /**
     * Add a new actiepunt for leerlingId.
     * Applies herhaling auto-detect: if same onderwerp already exists, status becomes 'herhaling'.
     * @param {string} leerlingId
     * @param {{ onderwerp: string, datum: string, status: string }} patch
     * @returns {Object|null}  The created Actiepunt, or null if student not found
     */
    add: function(leerlingId, patch) {
      var s = getStudent(leerlingId);
      if (!s) return null;
      if (!Array.isArray(s.actiepunten)) s.actiepunten = [];
      var desired = VALID_STATUS.indexOf(patch.status) >= 0 ? patch.status : 'open';
      var item = {
        id: genId(),
        onderwerp: String(patch.onderwerp || '').trim(),
        datum: String(patch.datum || ''),
        status: (desired === 'herhaling' || isHerhaling(s.actiepunten, patch.onderwerp, null))
                ? 'herhaling' : desired
      };
      s.actiepunten.push(item);
      window.saveState();
      return item;
    },

    /**
     * Update an existing actiepunt by id.
     * If onderwerp changes, applies herhaling auto-detect (excludes self).
     * If patch explicitly sets status, that status is used (no override).
     * @param {string} leerlingId
     * @param {string} id
     * @param {Object} patch
     * @returns {Object|null}
     */
    update: function(leerlingId, id, patch) {
      var s = getStudent(leerlingId);
      if (!s || !Array.isArray(s.actiepunten)) return null;
      for (var i = 0; i < s.actiepunten.length; i++) {
        if (s.actiepunten[i].id === id) {
          var merged = Object.assign({}, s.actiepunten[i], patch || {});
          var hasStatus = patch && Object.prototype.hasOwnProperty.call(patch, 'status');
          var desired = VALID_STATUS.indexOf(merged.status) >= 0 ? merged.status : 'open';
          if (!hasStatus && isHerhaling(s.actiepunten, merged.onderwerp, id)) {
            merged.status = 'herhaling';
          } else {
            merged.status = desired;
          }
          s.actiepunten[i] = merged;
          window.saveState();
          return merged;
        }
      }
      return null;
    },

    /**
     * Remove an actiepunt by id.
     * @param {string} leerlingId
     * @param {string} id
     * @returns {boolean}
     */
    remove: function(leerlingId, id) {
      var s = getStudent(leerlingId);
      if (!s || !Array.isArray(s.actiepunten)) return false;
      var before = s.actiepunten.length;
      s.actiepunten = s.actiepunten.filter(function(a) { return a.id !== id; });
      window.saveState();
      return s.actiepunten.length < before;
    }
  };

  window.normalizeOnderwerp = normalizeOnderwerp;
  window.isHerhaling = isHerhaling;
  window.actiepuntenStore = store;
})();

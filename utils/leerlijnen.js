// utils/leerlijnen.js — Leerlijn-toewijzing persistence
// Levert: window.getLeerlijnenMapping, window.saveLeerlijnenMapping, window.resetLeerlijnenMapping
//
// Depends on (loaded before this script):
//   utils/schema.js — window.DEELGEBIEDEN
//
// localStorage key: 'mentordashboard_leerlijnen_v1'
// Mapping format: { 'va': 'lesgeven', 'mm': 'lesgeven', ... }

(function() {

  var STORAGE_KEY = 'mentordashboard_leerlijnen_v1';
  var _cachedMapping = null; // in-memory cache; invalidated on save/reset

  // Build default mapping from schema.js DEELGEBIEDEN
  function buildDefault() {
    var deelgebieden = window.DEELGEBIEDEN;
    return deelgebieden.reduce(function(m, dg) {
      m[dg.id] = dg.group;
      return m;
    }, {});
  }

  // Validate that a parsed mapping contains all 19 deelgebied IDs
  function isValid(mapping) {
    if (!mapping || typeof mapping !== 'object') return false;
    var deelgebieden = window.DEELGEBIEDEN;
    for (var i = 0; i < deelgebieden.length; i++) {
      if (!mapping.hasOwnProperty(deelgebieden[i].id)) return false;
    }
    return true;
  }

  /**
   * window.getLeerlijnenMapping()
   * Returns { dgId: leerlijn, ... } for all 19 deelgebieden.
   * Reads from localStorage override if valid; falls back to schema.js defaults.
   * Result is cached until save/reset.
   */
  window.getLeerlijnenMapping = function() {
    if (_cachedMapping !== null) return _cachedMapping;

    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (isValid(parsed)) {
          _cachedMapping = parsed;
          return _cachedMapping;
        }
      }
    } catch (e) {
      console.warn('[leerlijnen.js] localStorage read error:', e);
    }

    _cachedMapping = buildDefault();
    return _cachedMapping;
  };

  /**
   * window.saveLeerlijnenMapping(mapping)
   * Persists full mapping { dgId: leerlijn, ... } to localStorage.
   * Clears cache so next getLeerlijnenMapping() reads fresh.
   * Returns true on success, false on error.
   */
  window.saveLeerlijnenMapping = function(mapping) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mapping));
      _cachedMapping = null; // invalidate cache
      return true;
    } catch (e) {
      console.warn('[leerlijnen.js] localStorage write error:', e);
      return false;
    }
  };

  /**
   * window.resetLeerlijnenMapping()
   * Removes the localStorage override. Next getLeerlijnenMapping() returns schema.js defaults.
   * Clears cache.
   */
  window.resetLeerlijnenMapping = function() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('[leerlijnen.js] localStorage remove error:', e);
    }
    _cachedMapping = null; // invalidate cache
  };

  console.log('[leerlijnen.js] Leerlijn-toewijzing persistence geladen');

})();

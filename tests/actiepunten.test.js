'use strict';

// ---------------------------------------------------------------------------
// actiepunten.test.js — FEED-02 herhaling detection tests
// Phase 13 Plan 02 — vervangt de Wave 0 todo stubs
// ---------------------------------------------------------------------------

global.window = global;

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeStudent(leerlingId) {
  return { leerlingId: leerlingId, actiepunten: [] };
}

function resetAppState(students) {
  window.appState = { students: students || [] };
  window.saveState = jest.fn();
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(function() {
  resetAppState([makeStudent('L1')]);
  jest.resetModules();
  require('../utils/actiepunten.js');
});

// ── Tests ─────────────────────────────────────────────────────────────────────

test('herhaling: same onderwerp twice -> isHerhaling returns true', function() {
  window.actiepuntenStore.add('L1', { onderwerp: 'Lesvoorbereiding', datum: '', status: 'open' });
  var list = window.actiepuntenStore.list('L1');
  expect(window.isHerhaling(list, 'Lesvoorbereiding')).toBe(true);
});

test('normalize: "Lesvoorbereiding" vs "  lesvoorbereiding  " match', function() {
  expect(window.normalizeOnderwerp('Lesvoorbereiding')).toBe('lesvoorbereiding');
  expect(window.normalizeOnderwerp('  lesvoorbereiding  ')).toBe('lesvoorbereiding');
  expect(window.normalizeOnderwerp('Lesvoorbereiding')).toBe(window.normalizeOnderwerp('  lesvoorbereiding  '));
});

test('exclude self: editing own actiepunt does NOT flag as herhaling', function() {
  var item = window.actiepuntenStore.add('L1', { onderwerp: 'Klassenmanagement', datum: '', status: 'open' });
  var list = window.actiepuntenStore.list('L1');
  // Should NOT flag as herhaling when excluding own id
  expect(window.isHerhaling(list, 'Klassenmanagement', item.id)).toBe(false);
});

test('short onderwerp (<3 chars) is never flagged', function() {
  window.actiepuntenStore.add('L1', { onderwerp: 'OK', datum: '', status: 'open' });
  var list = window.actiepuntenStore.list('L1');
  expect(window.isHerhaling(list, 'OK')).toBe(false);
});

test('empty actiepunten list -> isHerhaling returns false', function() {
  var list = window.actiepuntenStore.list('L1');
  expect(list.length).toBe(0);
  expect(window.isHerhaling(list, 'Lesvoorbereiding')).toBe(false);
});

test('actiepuntenStore.add on empty list -> status "open" stays open', function() {
  var item = window.actiepuntenStore.add('L1', { onderwerp: 'Nieuw onderwerp', datum: '', status: 'open' });
  expect(item).not.toBeNull();
  expect(item.status).toBe('open');
});

test('actiepuntenStore.add when same onderwerp exists and status !== "herhaling" -> new item status becomes "herhaling"', function() {
  window.actiepuntenStore.add('L1', { onderwerp: 'Feedback geven', datum: '', status: 'open' });
  var second = window.actiepuntenStore.add('L1', { onderwerp: 'feedback geven', datum: '', status: 'open' });
  expect(second.status).toBe('herhaling');
  expect(window.saveState).toHaveBeenCalled();
});

test('actiepuntenStore.remove by id -> list no longer contains that id', function() {
  var item = window.actiepuntenStore.add('L1', { onderwerp: 'Te verwijderen', datum: '', status: 'open' });
  var removed = window.actiepuntenStore.remove('L1', item.id);
  expect(removed).toBe(true);
  var list = window.actiepuntenStore.list('L1');
  expect(list.find(function(a) { return a.id === item.id; })).toBeUndefined();
});

test('actiepuntenStore uses appState (NOT a separate localStorage key)', function() {
  var item = window.actiepuntenStore.add('L1', { onderwerp: 'Persistentie test', datum: '2026-05-01', status: 'open' });
  // Actiepunten live on the student record in appState, not in a separate localStorage key
  var student = window.appState.students.find(function(s) { return s.leerlingId === 'L1'; });
  expect(Array.isArray(student.actiepunten)).toBe(true);
  expect(student.actiepunten.find(function(a) { return a.id === item.id; })).toBeDefined();
  // saveState was called (persists via appState)
  expect(window.saveState).toHaveBeenCalled();
});

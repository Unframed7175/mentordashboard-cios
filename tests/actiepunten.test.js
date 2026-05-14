// ---------------------------------------------------------------------------
// actiepunten.test.js — FEED-02 herhaling detection tests
// Phase 11 Plan 06 — Migrated to ESM imports (D-11-11)
// ---------------------------------------------------------------------------

import { actiepuntenStore, normalizeOnderwerp, isHerhaling } from '../utils/actiepunten';
import { appState } from '../utils/datamodel';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeStudent(leerlingId) {
  return { leerlingId: leerlingId, actiepunten: [] };
}

function resetAppState(students) {
  appState.students = students || [];
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(function() {
  resetAppState([makeStudent('L1')]);
});

// ── Tests ─────────────────────────────────────────────────────────────────────

test('herhaling: same onderwerp twice -> isHerhaling returns true', function() {
  actiepuntenStore.add('L1', { onderwerp: 'Lesvoorbereiding', datum: '', status: 'open' });
  var list = actiepuntenStore.list('L1');
  expect(isHerhaling(list, 'Lesvoorbereiding')).toBe(true);
});

test('normalize: "Lesvoorbereiding" vs "  lesvoorbereiding  " match', function() {
  expect(normalizeOnderwerp('Lesvoorbereiding')).toBe('lesvoorbereiding');
  expect(normalizeOnderwerp('  lesvoorbereiding  ')).toBe('lesvoorbereiding');
  expect(normalizeOnderwerp('Lesvoorbereiding')).toBe(normalizeOnderwerp('  lesvoorbereiding  '));
});

test('exclude self: editing own actiepunt does NOT flag as herhaling', function() {
  var item = actiepuntenStore.add('L1', { onderwerp: 'Klassenmanagement', datum: '', status: 'open' });
  var list = actiepuntenStore.list('L1');
  // Should NOT flag as herhaling when excluding own id
  expect(isHerhaling(list, 'Klassenmanagement', item.id)).toBe(false);
});

test('short onderwerp (<3 chars) is never flagged', function() {
  actiepuntenStore.add('L1', { onderwerp: 'OK', datum: '', status: 'open' });
  var list = actiepuntenStore.list('L1');
  expect(isHerhaling(list, 'OK')).toBe(false);
});

test('empty actiepunten list -> isHerhaling returns false', function() {
  var list = actiepuntenStore.list('L1');
  expect(list.length).toBe(0);
  expect(isHerhaling(list, 'Lesvoorbereiding')).toBe(false);
});

test('actiepuntenStore.add on empty list -> status "open" stays open', function() {
  var item = actiepuntenStore.add('L1', { onderwerp: 'Nieuw onderwerp', datum: '', status: 'open' });
  expect(item).not.toBeNull();
  expect(item.status).toBe('open');
});

test('actiepuntenStore.add when same onderwerp exists and status !== "herhaling" -> new item status becomes "herhaling"', function() {
  actiepuntenStore.add('L1', { onderwerp: 'Feedback geven', datum: '', status: 'open' });
  var second = actiepuntenStore.add('L1', { onderwerp: 'feedback geven', datum: '', status: 'open' });
  expect(second.status).toBe('herhaling');
  // Verify the actiepunt was saved via appState (saveState writes to localStorage via jsdom)
  var student = appState.students.find(function(s) { return s.leerlingId === 'L1'; });
  expect(student.actiepunten.length).toBe(2);
});

test('actiepuntenStore.remove by id -> list no longer contains that id', function() {
  var item = actiepuntenStore.add('L1', { onderwerp: 'Te verwijderen', datum: '', status: 'open' });
  var removed = actiepuntenStore.remove('L1', item.id);
  expect(removed).toBe(true);
  var list = actiepuntenStore.list('L1');
  expect(list.find(function(a) { return a.id === item.id; })).toBeUndefined();
});

test('actiepuntenStore uses appState (NOT a separate localStorage key)', function() {
  var item = actiepuntenStore.add('L1', { onderwerp: 'Persistentie test', datum: '2026-05-01', status: 'open' });
  // Actiepunten live on the student record in appState, not in a separate localStorage key
  var student = appState.students.find(function(s) { return s.leerlingId === 'L1'; });
  expect(Array.isArray(student.actiepunten)).toBe(true);
  expect(student.actiepunten.find(function(a) { return a.id === item.id; })).toBeDefined();
});

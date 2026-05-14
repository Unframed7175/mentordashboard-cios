// ---------------------------------------------------------------------------
// feedback.test.ts — feedback / herhaling-detectie tests (actiepunten module)
// Wave 0 stub: imports will fail until utils/actiepunten.ts is created in Wave 1.
// Tests run as-is once actiepunten.ts and datamodel.ts exist.
//
// Note: Feedback logica zit in actiepunten.ts (geen aparte utils/feedback.ts).
// Deze stubs zijn aanvullend op actiepunten.test.js en testen de "feed forward"
// functionaliteit (herhaling-detectie bij toevoegen van actiepunten).
// ---------------------------------------------------------------------------

import { actiepuntenStore, normalizeOnderwerp, isHerhaling } from '../utils/actiepunten';
import { appState } from '../utils/datamodel';

beforeEach(() => {
  appState.students = [{ leerlingId: 'L1', actiepunten: [] }];
});

// ── Tests ─────────────────────────────────────────────────────────────────────

test('feed forward: herhaling wordt gedetecteerd bij tweede toevoeging van zelfde onderwerp', () => {
  // First actiepunt: not a herhaling
  const first = actiepuntenStore.add('L1', {
    onderwerp: 'Lesvoorbereiding',
    datum: '2026-01-01',
    status: 'open',
  });
  expect(first).not.toBeNull();
  expect(first!.status).not.toBe('herhaling');

  // Second actiepunt with same onderwerp: should be detected as herhaling
  const second = actiepuntenStore.add('L1', {
    onderwerp: 'Lesvoorbereiding',
    datum: '2026-02-01',
    status: 'open',
  });
  expect(second).not.toBeNull();
  expect(second!.status).toBe('herhaling');
});

test('normalizeOnderwerp verwijdert witruimte en converteert naar lowercase', () => {
  expect(normalizeOnderwerp('  Lesvoorbereiding  ')).toBe('lesvoorbereiding');
  expect(normalizeOnderwerp('KLASSENMANAGEMENT')).toBe('klassenmanagement');
  expect(normalizeOnderwerp('')).toBe('');
});

test('isHerhaling geeft false wanneer actiepunten lijst leeg is', () => {
  const list = actiepuntenStore.list('L1');
  expect(list.length).toBe(0);
  expect(isHerhaling(list, 'Feedback geven')).toBe(false);
});

// tests/prognosis.schemaGuard.test.ts — schema-guard voor het nieuwe schooljaar (2026/2027)
//
// Geen mock hier: dit bestand toetst tegen de ECHTE, live src/config/leerlijn.json
// (12 deelgebieden, 2 leerlijnen). De doorstroomnormen (KERN_SBC, DEFAULT_NORMEN)
// zijn nog gekalibreerd op het oude 19-deelgebieden/3-leerlijnen-schema (ADR-06) en
// leveren dus geen betrouwbaar cijfer op voor dit schema. berekenPrognose moet dat
// expliciet signaleren met 'normen_onbekend' i.p.v. een stil foutief label.

import { berekenPrognose } from '../utils/prognosis';
import { berekenStatus } from '../src/utils/status';
import { DEELGEBIEDEN } from '../utils/schema';

function makeStudent(scores: Record<string, string | null> = {}): any {
  return {
    leerlingId: 'L1',
    naam: 'Test Leerling',
    periode: 'bj2 fase 2',
    leerjaar: '2',
    deelgebiedScores: scores,
    datapunten: [],
  };
}

test('het live schema is het nieuwe 2026/2027-schema (12 deelgebieden, 2 groepen)', () => {
  expect(DEELGEBIEDEN.length).toBe(12);
  const groepen = new Set(DEELGEBIEDEN.map(dg => dg.group));
  expect(groepen).toEqual(new Set(['lesgeven_en_organiseren', 'professioneel_handelen']));
});

test('berekenPrognose geeft normen_onbekend voor het nieuwe schema, ongeacht scores', () => {
  const alleVoldoende = Object.fromEntries(DEELGEBIEDEN.map(dg => [dg.label, 'voldoende']));
  const result = berekenPrognose(makeStudent(alleVoldoende), 'bj2');

  expect(result.label).toBe('normen_onbekend');
  expect(result.isNegatief).toBe(false);
  expect(result.leerlijnen).toEqual([]);
});

test('berekenPrognose geeft normen_onbekend ook voor BJ1-traject', () => {
  const result = berekenPrognose(makeStudent({}), 'bj1');
  expect(result.label).toBe('normen_onbekend');
});

test('berekenStatus toont grijs/"Normen onbekend" i.p.v. een (mogelijk foutief) RAG-oordeel', () => {
  const alleVoldoende = Object.fromEntries(DEELGEBIEDEN.map(dg => [dg.label, 'voldoende']));
  const result = berekenStatus(makeStudent(alleVoldoende));

  expect(result.kleur).toBe('grijs');
  expect(result.label).toBe('Normen onbekend');
});

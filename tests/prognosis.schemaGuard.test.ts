// tests/prognosis.schemaGuard.test.ts — schema-guard voor het nieuwe schooljaar (2026/2027)
//
// Geen mock hier: dit bestand toetst tegen de ECHTE, live src/config/leerlijn.json
// (12 deelgebieden, 2 leerlijnen).
//
// M42 T10: isNormenSchemaOndersteund() (utils/prognosis.ts) is bijgewerkt zodat
// SUPPORTED_LEERLIJNEN nu matcht met het ECHTE, huidige schema
// ('lesgeven_en_organiseren' / 'professioneel_handelen') — de schema-guard geeft
// dus 'true' terug en berekenPrognose() short-circuit niet meer naar
// 'normen_onbekend' vóórdat de bj1/bj2-takken bereikt worden.
//
// Dat legt een TWEEDE, apart bestaande guard bloot die T8/T9a in die takken
// hebben ingebouwd: de vestiging-null-guard (ADR-16). Die guard is niet
// gepensioneerd door T10 en hoort dat ook niet te worden — een klas zonder
// herleidbare (afgeleide of override-)vestiging moet nog steeds
// 'normen_onbekend' krijgen, nooit een stilzwijgend mogelijk-foutief label.
//
// Deze testset bewijst daarom BEIDE kanten van T10's wijziging:
//   - ZONDER vestiging: nog steeds 'normen_onbekend' (nu via de vestiging-guard,
//     niet meer via de schema-guard — de reden verandert, het gedrag niet).
//   - MET een echte vestiging: voor het eerst een GENUINE, berekend label/kleur
//     (dit is de daadwerkelijke "engine live" IRON RULE-eis van T10).

import { berekenPrognose } from '../utils/prognosis';
import { berekenStatus } from '../src/utils/status';
import { DEELGEBIEDEN } from '../utils/schema';
import type { Datapunt } from '../utils/datapuntTelling';

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

test('berekenPrognose geeft nog steeds normen_onbekend ZONDER vestiging, ook al is het schema nu ondersteund', () => {
  // Vóór T10 vuurde hier de schema-guard (isNormenSchemaOndersteund() === false
  // voor dit ECHTE schema). Na T10 is die guard 'true' — maar de bj2-tak van
  // berekenPrognose heeft zijn EIGEN vestiging-null-guard (T9a, ADR-16), die
  // hier nu de reden is dat dit nog steeds 'normen_onbekend' oplevert. Geen
  // vestiging meegegeven → geen genuine label, ongeacht scores.
  const alleVoldoende = Object.fromEntries(DEELGEBIEDEN.map(dg => [dg.label, 'voldoende']));
  const result = berekenPrognose(makeStudent(alleVoldoende), 'bj2');

  expect(result.label).toBe('normen_onbekend');
  expect(result.isNegatief).toBe(false);
  // T10-bevinding (niet voorzien in de brief): met de schema-guard nu 'true'
  // loopt berekenPrognose door tot de legacy telLeerlijnen()-berekening
  // (totaalVoldoendeOfHoger/totaalOnvoldoende/leerlijnen op het geretourneerde
  // object — behouden voor berekenStatus's "heeft scores"-check, zie
  // task-T10-brief.md's scope-boundary). Die berekening bleek intern nog
  // hardcoded op de OUDE 3-leerlijn-namen ('lesgeven'/'organiseren'/
  // 'prof_handelen', ADR-06) — een bug die T10 heeft gefixt (telLeerlijnen()
  // gebruikt nu dezelfde SUPPORTED_LEERLIJNEN-bron als de schema-guard zelf,
  // zie utils/prognosis.ts). Vóór T10 kwam de vroege schema-guard-return dit
  // stuk code nooit tegen (`leerlijnen: []`); nu (gefixt) zijn het 2 ECHTE,
  // correct-tellende entries (dit schema heeft 2 groepen, niet 3) — de
  // brief's `toEqual([])`-aanname klopte dus sowieso niet meer, en de fix
  // hieronder bewijst dat de telling ook daadwerkelijk correct is (niet
  // stilzwijgend altijd-nul, wat de onopgemerkte bug zou zijn geweest).
  expect(result.leerlijnen).toHaveLength(2);
  const totaalDeelgebieden = result.leerlijnen.reduce((s: number, ll: any) => s + ll.totaal, 0);
  expect(totaalDeelgebieden).toBe(DEELGEBIEDEN.length);
  expect(result.leerlijnen.every((ll: any) => ll.voldoendeOfHoger === ll.totaal)).toBe(true);
});

test('berekenPrognose bereikt na T10 een ECHT bj2-label zodra een vestiging bekend is', () => {
  // IRON RULE-bewijs: met een echte vestiging ('goes') komt berekenPrognose nu
  // daadwerkelijk bij berekenBj2GeneriekPad() uit i.p.v. de guard. Fixture
  // hergebruikt het sbc-happy-path-patroon uit tests/prognosis.bj2GeneriekPad.test.ts
  // (10 van de 12 deelgebieden 'voldoende' — drempel bj2SbcDeelgebiedenVoldoendeMin,
  // 5 rekendomeinen afgerond, Nederlands/WVO/KD allemaal in orde) voor een
  // deterministische, realistische 'sbc'-uitkomst.
  const labels = DEELGEBIEDEN.map(dg => dg.label);
  const deelgebiedScores: Record<string, string | null> = {};
  labels.forEach((lbl, i) => { deelgebiedScores[lbl] = i < 10 ? 'voldoende' : null; });

  const vijfRekenDomeinen: Datapunt[] = [1, 2, 3, 4, 5].map(n => ({
    vak: 'Rekenen',
    datapunt: `F2 Rekenen ‐eindtoets domein ${n}`,
    scores: {},
    status: 'Op tijd ingeleverd en wel beoordeeld',
  } as Datapunt));

  const student = makeStudent(deelgebiedScores);
  student.datapunten = vijfRekenDomeinen;
  student.nlSchrijven = '2f';
  student.nlGesprekvoeren = '3f';
  student.rekenResultaat = '3f';
  student.kdStatus = 'behaald';
  student.wvoTraject = true;

  const result = berekenPrognose(student, 'bj2', undefined, undefined, 'goes');

  expect(result.label).not.toBe('normen_onbekend');
  expect(result.label).toBe('sbc');
});

test('berekenPrognose geeft nog steeds normen_onbekend ZONDER vestiging voor BJ1-traject', () => {
  // Zelfde verhaal als de bj2-variant hierboven, maar dan voor de bj1-tak
  // (T8's eigen vestiging-null-guard).
  const result = berekenPrognose(makeStudent({}), 'bj1');
  expect(result.label).toBe('normen_onbekend');
});

test('berekenPrognose bereikt na T10 een ECHT bj1-label (versneld_sbc) zodra een vestiging bekend is', () => {
  // IRON RULE-bewijs voor BJ1: hergebruikt het versneld_sbc-happy-path-patroon
  // uit tests/prognosis.bj1Uitkomst.test.ts (5x 'goed' in lesgeven_en_organiseren
  // fase 2, 3x 'goed' in professioneel_handelen fase 2, 3x Betekenisvol Bewegen
  // 'voldoende', 3 rekendomeinen afgerond, WVO-traject + Nederlands/Rekenen op
  // 'goed'-niveau) voor een deterministische, realistische 'versneld_sbc'-uitkomst.
  const datapunten: Datapunt[] = [
    {
      vak: 'Resultaten',
      datapunt: 'Resultatentabel',
      scores: { 'O&V': 'goed', 'S&O': 'goed', 'PH': 'goed', 'DH': 'goed', 'I&P': 'goed' },
      fase: 2,
    } as unknown as Datapunt,
    {
      vak: 'Resultaten',
      datapunt: 'Resultatentabel',
      scores: { 'PrHo': 'goed', 'DESK': 'goed', 'PO': 'goed' },
      fase: 2,
    } as unknown as Datapunt,
    ...[1, 2, 3].map(n => ({
      vak: 'Betekenisvol Bewegen',
      datapunt: `BVB Professionele houding ${n}`,
      scores: { PrHo: 'voldoende' },
      fase: 1,
    } as unknown as Datapunt)),
    ...[1, 2, 3].map(n => ({
      vak: 'Rekenen',
      datapunt: `F2 Rekenen ‐eindtoets domein ${n}`,
      scores: {},
      status: 'Op tijd ingeleverd en wel beoordeeld',
      fase: 1,
    } as unknown as Datapunt)),
  ];

  const student = makeStudent({});
  student.datapunten = datapunten;
  student.wvoTraject = true;
  student.nederlandsResultaat = '3f';
  student.rekenResultaat = '3f';

  const result = berekenPrognose(student, 'bj1', undefined, undefined, 'goes');

  expect(result.label).not.toBe('normen_onbekend');
  expect(result.label).toBe('versneld_sbc');
});

test('berekenStatus toont grijs/"Normen onbekend" ZONDER vestiging, ook al is het schema nu ondersteund', () => {
  // Zelfde reden als de berekenPrognose-variant hierboven: de vestiging-guard
  // (niet meer de schema-guard) is nu wat dit grijze fallback-gedrag garandeert.
  const alleVoldoende = Object.fromEntries(DEELGEBIEDEN.map(dg => [dg.label, 'voldoende']));
  const result = berekenStatus(makeStudent(alleVoldoende));

  expect(result.kleur).toBe('grijs');
  expect(result.label).toBe('Normen onbekend');
});

test('berekenStatus toont na T10 een ECHTE, niet-grijze RAG-kleur zodra een vestiging bekend is', () => {
  // Zelfde sbc-fixture als de berekenPrognose-bj2-test hierboven, nu via
  // berekenStatus() — bewijst dat de kleur ook op dit niveau echt doorstroomt.
  const labels = DEELGEBIEDEN.map(dg => dg.label);
  const deelgebiedScores: Record<string, string | null> = {};
  labels.forEach((lbl, i) => { deelgebiedScores[lbl] = i < 10 ? 'voldoende' : null; });

  const vijfRekenDomeinen: Datapunt[] = [1, 2, 3, 4, 5].map(n => ({
    vak: 'Rekenen',
    datapunt: `F2 Rekenen ‐eindtoets domein ${n}`,
    scores: {},
    status: 'Op tijd ingeleverd en wel beoordeeld',
  } as Datapunt));

  const student = makeStudent(deelgebiedScores);
  student.datapunten = vijfRekenDomeinen;
  student.nlSchrijven = '2f';
  student.nlGesprekvoeren = '3f';
  student.rekenResultaat = '3f';
  student.kdStatus = 'behaald';
  student.wvoTraject = true;

  const result = berekenStatus(student, undefined, undefined, 'goes');

  expect(result.kleur).not.toBe('grijs');
  expect(result.kleur).toBe('blauw');
  expect(result.label).toBe('SBC');
});

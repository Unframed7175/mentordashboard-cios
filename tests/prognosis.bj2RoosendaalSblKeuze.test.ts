// ---------------------------------------------------------------------------
// tests/prognosis.bj2RoosendaalSblKeuze.test.ts — berekenBj2RoosendaalSblKeuze (M42 T9c)
//
// Geen mock hier: draait tegen het ECHTE, live schema (src/config/leerlijn.json —
// 12 deelgebieden, 2 groepen: lesgeven_en_organiseren / professioneel_handelen).
// Zelfde reden als tests/prognosis.bj1Uitkomst.test.ts (T8) en
// tests/prognosis.bj2GeneriekPad.test.ts (T9a): berekenPrognose() zit nog achter
// isNormenSchemaOndersteund(), dat 'false' teruggeeft voor dit ECHTE schema
// (T10's nog-niet-gedane pensioentaak) — dus alleen door berekenBj2RoosendaalSblKeuze
// rechtstreeks aan te roepen is de nieuwe, kleinere criteria-set testbaar tegen
// het schema dat daadwerkelijk actief is. Zie task-T9c-brief.md.
//
// ADR-17e (routing-correctie): dit is GEEN volledig parallel BJ2-pad — het is
// een kleine, Roosendaal-exclusieve subcase (traject === 'sbl') met een eigen,
// KLEINERE eisenset (brondocument p.6), onafhankelijk van Tabel A/T9a. De
// routing-tests die bewijzen WANNEER deze functie wordt aangeroepen (i.p.v.
// berekenBj2GeneriekPad) staan in tests/prognosis.test.ts, in het bestand dat
// al de OLD-schema vi.mock heeft die nodig is om isNormenSchemaOndersteund()
// door te laten (zie die describe-blok voor de volledige uitleg van die keuze).
//
// Groepslay-out (12 deelgebieden, uit src/config/leerlijn.json):
//   lesgeven_en_organiseren (7): O&V, S&O, PH, DH, I&P, O&C, E&V
//   professioneel_handelen  (5): PrHo, DESK, PO, OIH, GV
// ---------------------------------------------------------------------------

import { berekenBj2RoosendaalSblKeuze } from '../utils/prognosis';
import { DEFAULT_VESTIGING_NORMEN } from '../utils/normen';
import type { Datapunt } from '../utils/datapuntTelling';

const NORMEN_ROOSENDAAL = DEFAULT_VESTIGING_NORMEN.roosendaal;

function makeStudent(overrides: any = {}): any {
  return {
    leerlingId: 'L1',
    naam: 'Test Leerling',
    deelgebiedScores: {},
    datapunten: [],
    ...overrides,
  };
}

// Eén datapunt dat één of meer deelgebied-scores tegelijk aanlevert (net als de
// echte PDF-parser een "resultatentabel"-rij levert). fase weglaten (undefined
// als parameter) betekent: GEEN fase-property op het object (pre-Lane-A-vorm,
// D4: telt mee voor ELKE fase-query via getFase()).
function scoreDp(fase: number | null | undefined, scores: Record<string, string | null>): Datapunt {
  const base: any = { vak: 'Resultaten', datapunt: 'Resultatentabel', scores };
  if (fase !== undefined) base.fase = fase;
  return base as Datapunt;
}

function rekenDomeinDp(n: number, status: string): Datapunt {
  return { vak: 'Rekenen', datapunt: `F2 Rekenen ‐eindtoets domein ${n}`, scores: {}, status } as Datapunt;
}

function vijfRekenDomeinen(): Datapunt[] {
  return [1, 2, 3, 4, 5].map(n => rekenDomeinDp(n, 'Op tijd ingeleverd en wel beoordeeld'));
}

function levelDp(n: number, status: string): Datapunt {
  return { vak: 'Extern praktijkleren', datapunt: `Level ${n} lesgeven`, scores: {}, status } as Datapunt;
}

// 7 deelgebieden 'voldoende' in fase 3 (drempel bj2RoosendaalSblKeuzeDeelgebiedenVoldoendeMin = 7):
// alle 7 lesgeven_en_organiseren-labels.
function zevenFase3Voldoende(fase: number | null | undefined = 3): Datapunt {
  return scoreDp(fase, { 'O&V': 'voldoende', 'S&O': 'voldoende', 'PH': 'voldoende', 'DH': 'voldoende', 'I&P': 'voldoende', 'O&C': 'voldoende', 'E&V': 'voldoende' });
}

function zesFase3Voldoende(fase: number | null | undefined = 3): Datapunt {
  return scoreDp(fase, { 'O&V': 'voldoende', 'S&O': 'voldoende', 'PH': 'voldoende', 'DH': 'voldoende', 'I&P': 'voldoende', 'O&C': 'voldoende' });
}

// Bouwt een student die ALLE sbl-keuze-criteria voldoet (behalve evt. overrides).
function sblKeuzeStudent(overrides: any = {}): any {
  return makeStudent({
    datapunten: [zevenFase3Voldoende(), ...vijfRekenDomeinen()],
    nederlandsResultaat: '2f', // → 'voldoende'
    rekenResultaat: '2f',      // → 'voldoende' (MBO3-of-hoger)
    kdStatus: 'behaald',
    ...overrides,
  });
}

describe('berekenBj2RoosendaalSblKeuze — happy path', () => {
  it('sbl: alle criteria voldaan', () => {
    const result = berekenBj2RoosendaalSblKeuze(sblKeuzeStudent(), NORMEN_ROOSENDAAL);
    expect(result.label).toBe('sbl');
  });
});

describe('berekenBj2RoosendaalSblKeuze — grenswaarden (fase-3-scoping)', () => {
  it('exact 7 deelgebieden voldoende IN FASE 3 → wel sbl', () => {
    const student = sblKeuzeStudent({ datapunten: [zevenFase3Voldoende(), ...vijfRekenDomeinen()] });
    expect(berekenBj2RoosendaalSblKeuze(student, NORMEN_ROOSENDAAL).label).toBe('sbl');
  });

  it('6 deelgebieden voldoende in fase 3 (één minder) → geen sbl (bespreekgeval)', () => {
    const student = sblKeuzeStudent({ datapunten: [zesFase3Voldoende(), ...vijfRekenDomeinen()] });
    const result = berekenBj2RoosendaalSblKeuze(student, NORMEN_ROOSENDAAL);
    expect(result.label).toBe('bespreekgeval');
  });

  it('7 voldoende in fase 1 EN fase 2 (maar niet fase 3) bewijst dat de telling echt fase-3-gescoped is, niet heel-jaar of fase-2', () => {
    // fase 1 en fase 2 hebben allebei een LAGERE (voor fase 2: gelijke) telling
    // dan fase 3 zou hebben als de functie daar per ongeluk naar keek i.p.v.
    // fase 3 specifiek. Hier: fase 1 en fase 2 krijgen 7 voldoende (zouden
    // ZELF de drempel halen als de functie verkeerd gescoped was), maar fase 3
    // krijgt er maar 6 → moet bespreekgeval opleveren als de fase-3-scoping klopt.
    const student = sblKeuzeStudent({
      datapunten: [
        zevenFase3Voldoende(1),
        zevenFase3Voldoende(2),
        zesFase3Voldoende(3),
        ...vijfRekenDomeinen(),
      ],
    });
    const result = berekenBj2RoosendaalSblKeuze(student, NORMEN_ROOSENDAAL);
    expect(result.label).toBe('bespreekgeval');
  });
});

describe('berekenBj2RoosendaalSblKeuze — D4: ontbrekende fase telt mee voor elke fase-query', () => {
  it('een datapunt zonder fase-property telt mee voor de fase-3-telling', () => {
    // fase weggelaten (undefined) i.p.v. expliciet 3 — getFase() geeft dan null
    // terug, en telLeerlijnenPerFase(datapunten, 3, ...) telt null-fase altijd
    // mee (D4), dus dit moet exact hetzelfde resultaat geven als expliciet fase 3.
    const student = sblKeuzeStudent({ datapunten: [zevenFase3Voldoende(undefined), ...vijfRekenDomeinen()] });
    const result = berekenBj2RoosendaalSblKeuze(student, NORMEN_ROOSENDAAL);
    expect(result.label).toBe('sbl');
  });
});

describe('berekenBj2RoosendaalSblKeuze — fallback (nooit "negatief", ADR-17d)', () => {
  it('Nederlands onvoldoende → bespreekgeval, ondanks dat elk ander criterium voldaan is', () => {
    const student = sblKeuzeStudent({ nederlandsResultaat: '1f' });
    const result = berekenBj2RoosendaalSblKeuze(student, NORMEN_ROOSENDAAL);
    expect(result.label).toBe('bespreekgeval');
    expect(result.label).not.toBe('negatief');
  });

  it('rekenNiveau onvoldoende → bespreekgeval', () => {
    const student = sblKeuzeStudent({ rekenResultaat: '1f' });
    const result = berekenBj2RoosendaalSblKeuze(student, NORMEN_ROOSENDAAL);
    expect(result.label).toBe('bespreekgeval');
  });

  it('te weinig rekendomeinen afgerond → bespreekgeval', () => {
    const student = sblKeuzeStudent({ datapunten: [zevenFase3Voldoende()] }); // 0 rekendomeinen
    const result = berekenBj2RoosendaalSblKeuze(student, NORMEN_ROOSENDAAL);
    expect(result.label).toBe('bespreekgeval');
  });

  it('kdStatus niet_behaald → bespreekgeval', () => {
    const student = sblKeuzeStudent({ kdStatus: 'niet_behaald' });
    const result = berekenBj2RoosendaalSblKeuze(student, NORMEN_ROOSENDAAL);
    expect(result.label).toBe('bespreekgeval');
  });

  it('kdStatus null/missend → bespreekgeval (geen "assume fine"-default)', () => {
    const student = sblKeuzeStudent({ kdStatus: null });
    const result = berekenBj2RoosendaalSblKeuze(student, NORMEN_ROOSENDAAL);
    expect(result.label).toBe('bespreekgeval');
  });

  it('kdStatus haalbaar VOLDOET aan de KD-eis (behaald OF haalbaar)', () => {
    const student = sblKeuzeStudent({ kdStatus: 'haalbaar' });
    const result = berekenBj2RoosendaalSblKeuze(student, NORMEN_ROOSENDAAL);
    expect(result.label).toBe('sbl');
  });

  it('0 levels afgerond (drempel 2, geen 0-sentinel voor Roosendaal) → bespreekgeval', () => {
    const student = sblKeuzeStudent(); // geen Level-N-datapunten
    const result = berekenBj2RoosendaalSblKeuze(student, NORMEN_ROOSENDAAL);
    expect(result.label).toBe('bespreekgeval');
  });

  it('2 levels afgerond (drempel gehaald) → sbl alsnog bereikbaar', () => {
    const student = sblKeuzeStudent({
      datapunten: [
        zevenFase3Voldoende(),
        ...vijfRekenDomeinen(),
        levelDp(2, 'Op tijd ingeleverd en wel beoordeeld'),
        levelDp(2, 'Op tijd ingeleverd en wel beoordeeld'),
      ],
    });
    const result = berekenBj2RoosendaalSblKeuze(student, NORMEN_ROOSENDAAL);
    expect(result.label).toBe('sbl');
  });
});

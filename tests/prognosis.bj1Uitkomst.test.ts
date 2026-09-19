// ---------------------------------------------------------------------------
// tests/prognosis.bj1Uitkomst.test.ts — berekenBj1Uitkomst (M42 T8)
//
// Geen mock hier: draait tegen het ECHTE, live schema (src/config/leerlijn.json —
// 12 deelgebieden, 2 groepen: lesgeven_en_organiseren / professioneel_handelen).
// berekenBj1Uitkomst is bewust los van berekenPrognose() getest — die laatste zit
// nog achter isNormenSchemaOndersteund(), dat 'false' teruggeeft voor dit ECHTE
// schema (T10's nog-niet-gedane pensioentaak). Door berekenBj1Uitkomst rechtstreeks
// aan te roepen omzeilen we die guard volledig en testen we de nieuwe formule
// tegen het schema dat daadwerkelijk actief is. Zie task-T8-brief.md.
//
// Groepslay-out (12 deelgebieden, uit src/config/leerlijn.json):
//   lesgeven_en_organiseren (7): O&V, S&O, PH, DH, I&P, O&C, E&V
//   professioneel_handelen  (5): PrHo, DESK, PO, OIH, GV
// ---------------------------------------------------------------------------

import { berekenBj1Uitkomst } from '../utils/prognosis';
import { DEFAULT_VESTIGING_NORMEN } from '../utils/normen';
import type { Datapunt } from '../utils/datapuntTelling';

const NORMEN_GOES = DEFAULT_VESTIGING_NORMEN.goes;
const NORMEN_ROOSENDAAL = DEFAULT_VESTIGING_NORMEN.roosendaal;
const NORMEN_DORDRECHT = DEFAULT_VESTIGING_NORMEN.dordrecht;

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
// als parameter) betekent: GEEN fase-property op het object (pre-Lane-A-vorm).
function scoreDp(fase: number | null | undefined, scores: Record<string, string | null>): Datapunt {
  const base: any = { vak: 'Resultaten', datapunt: 'Resultatentabel', scores };
  if (fase !== undefined) base.fase = fase;
  return base as Datapunt;
}

function bvbDp(n: number, prho: string | null): Datapunt {
  // fase: 1 — buiten de fase-2-scope, om te bewijzen dat BVB NIET fase-gefilterd
  // wordt (de brief scoopt deze bullet expliciet niet naar fase 2).
  return { vak: 'Betekenisvol Bewegen', datapunt: `BVB Professionele houding ${n}`, scores: { PrHo: prho }, fase: 1 } as Datapunt;
}

function rekenDomeinDp(n: number, status: string): Datapunt {
  return { vak: 'Rekenen', datapunt: `F2 Rekenen ‐eindtoets domein ${n}`, scores: {}, status, fase: 1 } as Datapunt;
}

function nietIngeleverdDp(fase: number | null | undefined): Datapunt {
  const base: any = { vak: 'X', datapunt: 'Niet ingeleverd datapunt', scores: {}, status: 'niet ingeleverd' };
  if (fase !== undefined) base.fase = fase;
  return base as Datapunt;
}

function levelDp(n: number, status: string): Datapunt {
  return { vak: 'Extern praktijkleren', datapunt: `Level ${n} lesgeven`, scores: {}, status } as Datapunt;
}

// Bouwt de datapunten die ALLE versneld_sbc-criteria (behalve evt. overrides)
// tegelijk laten slagen, gescoord in fase 2 waar dat vereist is.
function versneldSbcDatapunten(): Datapunt[] {
  return [
    // lesgeven_en_organiseren: 5x 'goed', fase 2 (drempel 5)
    scoreDp(2, { 'O&V': 'goed', 'S&O': 'goed', 'PH': 'goed', 'DH': 'goed', 'I&P': 'goed' }),
    // professioneel_handelen: 3x 'goed', fase 2 (drempel 3)
    scoreDp(2, { 'PrHo': 'goed', 'DESK': 'goed', 'PO': 'goed' }),
    // Betekenisvol Bewegen: 3x voldoet (drempel 3)
    bvbDp(1, 'voldoende'),
    bvbDp(2, 'voldoende'),
    bvbDp(3, 'voldoende'),
    // Rekenen: 3 domeinen afgerond (drempel 3)
    rekenDomeinDp(1, 'Op tijd ingeleverd en wel beoordeeld'),
    rekenDomeinDp(2, 'Op tijd ingeleverd en wel beoordeeld'),
    rekenDomeinDp(3, 'Op tijd ingeleverd en wel beoordeeld'),
  ];
}

function versneldSbcStudent(overrides: any = {}): any {
  return makeStudent({
    datapunten: versneldSbcDatapunten(),
    wvoTraject: true,
    nederlandsResultaat: '3f', // → 'goed'
    rekenResultaat: '3f',      // → 'goed'
    ...overrides,
  });
}

describe('berekenBj1Uitkomst — happy paths (één per uitkomst)', () => {
  it('versneld_sbc: alle criteria voldaan (vestiging=goes, Roosendaal-levels-eis=0 dus triviaal)', () => {
    const student = versneldSbcStudent();
    const result = berekenBj1Uitkomst(student, 'goes', NORMEN_GOES);
    expect(result.label).toBe('versneld_sbc');
  });

  it('custom VestigingNormen override changes the outcome (proves thresholds are read from the passed-in normen, not hardcoded)', () => {
    // Same fixture as the versneld_sbc happy path, but lesgeven_en_organiseren
    // only has 3 'goed' scores (not 5) — below the DEFAULT threshold (5), at
    // or above a custom, lowered threshold (3).
    const student = versneldSbcStudent({
      datapunten: [
        scoreDp(2, { 'O&V': 'goed', 'S&O': 'goed', 'PH': 'goed' }), // 3x goed, lesgeven_en_organiseren
        scoreDp(2, { 'PrHo': 'goed', 'DESK': 'goed', 'PO': 'goed' }), // 3x goed, professioneel_handelen (drempel 3, unchanged)
        bvbDp(1, 'voldoende'),
        bvbDp(2, 'voldoende'),
        bvbDp(3, 'voldoende'),
        rekenDomeinDp(1, 'Op tijd ingeleverd en wel beoordeeld'),
        rekenDomeinDp(2, 'Op tijd ingeleverd en wel beoordeeld'),
        rekenDomeinDp(3, 'Op tijd ingeleverd en wel beoordeeld'),
      ],
    });

    const defaultResult = berekenBj1Uitkomst(student, 'goes', NORMEN_GOES);
    expect(defaultResult.label).not.toBe('versneld_sbc');

    const customNormen = { ...NORMEN_GOES, bj1VersneldSbcLesgevenOrganiserenGoedMin: 3 };
    const customResult = berekenBj1Uitkomst(student, 'goes', customNormen);
    expect(customResult.label).toBe('versneld_sbc');
  });

  it('naar_bj2: 9 deelgebieden voldoende in fase 2 (som van beide groepen), Nederlands/Rekenen op 2F, geen versneld-niveau', () => {
    const student = makeStudent({
      datapunten: [
        // 9 van de 12 deelgebieden 'voldoende' (NIET 'goed' — anders zou versneld_sbc's
        // eigen ≥G-drempel ook overwogen kunnen worden) in fase 2.
        scoreDp(2, {
          'O&V': 'voldoende', 'S&O': 'voldoende', 'PH': 'voldoende', 'DH': 'voldoende',
          'I&P': 'voldoende', 'O&C': 'voldoende', 'E&V': 'voldoende',
          'PrHo': 'voldoende', 'DESK': 'voldoende',
        }),
        bvbDp(1, 'voldoende'),
        bvbDp(2, 'voldoende'),
        bvbDp(3, 'voldoende'),
        rekenDomeinDp(1, 'Op tijd ingeleverd en wel beoordeeld'),
        rekenDomeinDp(2, 'Op tijd ingeleverd en wel beoordeeld'),
        rekenDomeinDp(3, 'Op tijd ingeleverd en wel beoordeeld'),
      ],
      nederlandsResultaat: '2f',
      rekenResultaat: '2f',
    });
    const result = berekenBj1Uitkomst(student, 'goes', NORMEN_GOES);
    expect(result.label).toBe('naar_bj2');
  });

  it('negatief via Trigger A: >=4 deelgebieden onvoldoende (heel-jaar-aggregaat, geen fase-scope)', () => {
    const student = makeStudent({
      deelgebiedScores: { 'O&V': 'onvoldoende', 'S&O': 'onvoldoende', 'PH': 'onvoldoende', 'DH': 'onvoldoende' },
    });
    const result = berekenBj1Uitkomst(student, 'goes', NORMEN_GOES);
    expect(result.label).toBe('negatief');
  });

  it('negatief via Trigger B: >4 onbeoordeelde (niet-ingeleverd) datapunten tijdens fase 2', () => {
    const student = makeStudent({
      datapunten: [
        nietIngeleverdDp(2), nietIngeleverdDp(2), nietIngeleverdDp(2), nietIngeleverdDp(2), nietIngeleverdDp(2),
      ],
    });
    const result = berekenBj1Uitkomst(student, 'goes', NORMEN_GOES);
    expect(result.label).toBe('negatief');
  });

  it('neutraal (bespreekgeval): geen enkele drempel gehaald', () => {
    const student = makeStudent();
    const result = berekenBj1Uitkomst(student, 'goes', NORMEN_GOES);
    expect(result.label).toBe('neutraal');
  });
});

describe('berekenBj1Uitkomst — grenswaarden (boundary)', () => {
  it('Trigger A grens: exact 4 onvoldoende → WEL negatief (>=, niet >)', () => {
    const student = makeStudent({
      deelgebiedScores: { 'O&V': 'onvoldoende', 'S&O': 'onvoldoende', 'PH': 'onvoldoende', 'DH': 'onvoldoende' },
    });
    expect(berekenBj1Uitkomst(student, 'goes', NORMEN_GOES).label).toBe('negatief');
  });

  it('Trigger A grens: 3 onvoldoende (één minder dan de drempel) → GEEN negatief', () => {
    const student = makeStudent({
      deelgebiedScores: { 'O&V': 'onvoldoende', 'S&O': 'onvoldoende', 'PH': 'onvoldoende' },
    });
    const result = berekenBj1Uitkomst(student, 'goes', NORMEN_GOES);
    expect(result.label).not.toBe('negatief');
  });

  it('Trigger B grens: exact 4 onbeoordeeld in fase 2 → GEEN negatief (> niet >=)', () => {
    const student = makeStudent({
      datapunten: [nietIngeleverdDp(2), nietIngeleverdDp(2), nietIngeleverdDp(2), nietIngeleverdDp(2)],
    });
    const result = berekenBj1Uitkomst(student, 'goes', NORMEN_GOES);
    expect(result.label).not.toBe('negatief');
  });

  it('Trigger B grens: 5 onbeoordeeld in fase 2 (één meer dan de drempel) → WEL negatief', () => {
    const student = makeStudent({
      datapunten: [
        nietIngeleverdDp(2), nietIngeleverdDp(2), nietIngeleverdDp(2), nietIngeleverdDp(2), nietIngeleverdDp(2),
      ],
    });
    expect(berekenBj1Uitkomst(student, 'goes', NORMEN_GOES).label).toBe('negatief');
  });
});

describe('berekenBj1Uitkomst — D9 WVO-traject tri-state (null/undefined mogen niet crashen of stilzwijgend voldoen)', () => {
  it('wvoTraject: null sluit versneld_sbc uit, ondanks dat elk ander criterium voldaan is', () => {
    const student = versneldSbcStudent({ wvoTraject: null });
    let result: any;
    expect(() => { result = berekenBj1Uitkomst(student, 'goes', NORMEN_GOES); }).not.toThrow();
    expect(result.label).not.toBe('versneld_sbc');
  });

  it('wvoTraject: undefined sluit versneld_sbc uit, ondanks dat elk ander criterium voldaan is', () => {
    const student = versneldSbcStudent({ wvoTraject: undefined });
    let result: any;
    expect(() => { result = berekenBj1Uitkomst(student, 'goes', NORMEN_GOES); }).not.toThrow();
    expect(result.label).not.toBe('versneld_sbc');
  });

  it('wvoTraject: true (met alle andere criteria voldaan) geeft WEL versneld_sbc — bewijst dat de uitsluiting hierboven specifiek aan wvoTraject lag', () => {
    const student = versneldSbcStudent({ wvoTraject: true });
    expect(berekenBj1Uitkomst(student, 'goes', NORMEN_GOES).label).toBe('versneld_sbc');
  });
});

describe('berekenBj1Uitkomst — Roosendaal-only levels-eis (ADR-17c, data-driven i.p.v. if/else per vestiging)', () => {
  it('Roosendaal-student met 0 level-datapunten: WEL uitgesloten van versneld_sbc/naar_bj2, ondanks dat elk ander criterium voldaan is', () => {
    const student = versneldSbcStudent(); // 0 Level-N-datapunten
    const result = berekenBj1Uitkomst(student, 'roosendaal', NORMEN_ROOSENDAAL);
    expect(result.label).not.toBe('versneld_sbc');
    expect(result.label).not.toBe('naar_bj2');
  });

  it('Goes-student met 0 level-datapunten: NIET uitgesloten (drempel is 0, triviaal voldaan) — vangt een per-vestiging if/else-bug', () => {
    const student = versneldSbcStudent(); // 0 Level-N-datapunten, zelfde fixture als hierboven
    const result = berekenBj1Uitkomst(student, 'goes', NORMEN_GOES);
    expect(result.label).toBe('versneld_sbc');
  });

  it('Dordrecht-student met 0 level-datapunten: NIET uitgesloten (drempel is 0, triviaal voldaan)', () => {
    const student = versneldSbcStudent();
    const result = berekenBj1Uitkomst(student, 'dordrecht', NORMEN_DORDRECHT);
    expect(result.label).toBe('versneld_sbc');
  });

  it('Roosendaal-student die WEL >=8 levels afgerond heeft: versneld_sbc alsnog bereikbaar', () => {
    const student = versneldSbcStudent({
      datapunten: [
        ...versneldSbcDatapunten(),
        levelDp(1, 'Op tijd ingeleverd en wel beoordeeld'),
        levelDp(2, 'Op tijd ingeleverd en wel beoordeeld'),
        levelDp(3, 'Op tijd ingeleverd en wel beoordeeld'),
        levelDp(4, 'Op tijd ingeleverd en wel beoordeeld'),
        levelDp(5, 'Op tijd ingeleverd en wel beoordeeld'),
        levelDp(6, 'Op tijd ingeleverd en wel beoordeeld'),
        levelDp(7, 'Op tijd ingeleverd en wel beoordeeld'),
        levelDp(8, 'Op tijd ingeleverd en wel beoordeeld'),
      ],
    });
    const result = berekenBj1Uitkomst(student, 'roosendaal', NORMEN_ROOSENDAAL);
    expect(result.label).toBe('versneld_sbc');
  });
});

describe('berekenBj1Uitkomst — D4: datapunt zonder fase-property telt mee voor fase-2-scoped criteria', () => {
  it('pre-Lane-A-datapunten (geen fase-property, undefined) tellen mee als fase 2', () => {
    // scoreDp(undefined, ...) → GEEN fase-property op het object (zie helper hierboven).
    // Dit zijn de enige twee datapunten die de fase-2-gescoopte tellingen (lesgeven_en_
    // organiseren / professioneel_handelen goedOfHoger) voeden — de rest (BVB/Rekenen)
    // is bewust NIET fase-gescoopt (zie versneldSbcDatapunten's eigen fase:1-datapunten).
    const scoreDatapunten = [
      scoreDp(undefined, { 'O&V': 'goed', 'S&O': 'goed', 'PH': 'goed', 'DH': 'goed', 'I&P': 'goed' }),
      scoreDp(undefined, { 'PrHo': 'goed', 'DESK': 'goed', 'PO': 'goed' }),
    ];
    // Sanity: bewijs dat geen van deze objecten een fase-property heeft.
    expect(scoreDatapunten.every(d => !('fase' in d))).toBe(true);

    const datapunten: Datapunt[] = [
      ...scoreDatapunten,
      bvbDp(1, 'voldoende'),
      bvbDp(2, 'voldoende'),
      bvbDp(3, 'voldoende'),
      rekenDomeinDp(1, 'Op tijd ingeleverd en wel beoordeeld'),
      rekenDomeinDp(2, 'Op tijd ingeleverd en wel beoordeeld'),
      rekenDomeinDp(3, 'Op tijd ingeleverd en wel beoordeeld'),
    ];

    const student = versneldSbcStudent({ datapunten });
    const result = berekenBj1Uitkomst(student, 'goes', NORMEN_GOES);
    expect(result.label).toBe('versneld_sbc');
  });
});

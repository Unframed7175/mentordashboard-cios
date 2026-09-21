// ---------------------------------------------------------------------------
// tests/prognosis.bj2GeneriekPad.test.ts — berekenBj2GeneriekPad (M42 T9a)
//
// Geen mock hier: draait tegen het ECHTE, live schema (src/config/leerlijn.json —
// 12 deelgebieden, 2 groepen: lesgeven_en_organiseren / professioneel_handelen).
// Zelfde reden als tests/prognosis.bj1Uitkomst.test.ts (T8): berekenPrognose()
// zit nog achter isNormenSchemaOndersteund(), dat 'false' teruggeeft voor dit
// ECHTE schema (T10's nog-niet-gedane pensioentaak) — dus alleen door
// berekenBj2GeneriekPad rechtstreeks aan te roepen is de nieuwe formule
// testbaar tegen het schema dat daadwerkelijk actief is. Zie task-T9a-brief.md.
//
// Table A (pagina 4) is heel-jaar-aggregaat (student.deelgebiedScores), NIET
// fase-gescoped — anders dan BJ1's pagina-3-tabel.
// ---------------------------------------------------------------------------

import { berekenBj2GeneriekPad, berekenPrognose } from '../utils/prognosis';
import { DEFAULT_VESTIGING_NORMEN } from '../utils/normen';
import { DEELGEBIEDEN } from '../utils/schema';
import type { Datapunt } from '../utils/datapuntTelling';

const NORMEN_GOES = DEFAULT_VESTIGING_NORMEN.goes;
const NORMEN_ROOSENDAAL = DEFAULT_VESTIGING_NORMEN.roosendaal;
const NORMEN_DORDRECHT = DEFAULT_VESTIGING_NORMEN.dordrecht;

const LABELS = DEELGEBIEDEN.map(dg => dg.label); // 12 real labels

function makeStudent(overrides: any = {}): any {
  return {
    leerlingId: 'L1',
    naam: 'Test Leerling',
    deelgebiedScores: {},
    datapunten: [],
    ...overrides,
  };
}

// Zet de eerste n (van de 12) deelgebieden op 'voldoende', de rest op null.
function scoresForCount(n: number): Record<string, string | null> {
  const scores: Record<string, string | null> = {};
  LABELS.forEach((lbl, i) => { scores[lbl] = i < n ? 'voldoende' : null; });
  return scores;
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

// Bouwt een student die ALLE SBC-criteria voldoet (behalve evt. overrides).
function sbcStudent(overrides: any = {}): any {
  return makeStudent({
    deelgebiedScores: scoresForCount(10), // drempel bj2SbcDeelgebiedenVoldoendeMin = 10
    datapunten: vijfRekenDomeinen(),      // drempel bj2SbcRekenDomeinenMin = 5
    nlSchrijven: '2f',                    // → 'voldoende' (2F-of-hoger volstaat)
    nlGesprekvoeren: '3f',                // → 'goed' (exact 3F vereist)
    rekenResultaat: '3f',                 // → 'goed' (MBO4)
    kdStatus: 'behaald',
    wvoTraject: true,
    ...overrides,
  });
}

// Bouwt een student die ALLE SBL-criteria voldoet (behalve evt. overrides).
function sblStudent(overrides: any = {}): any {
  return makeStudent({
    deelgebiedScores: scoresForCount(7),  // drempel bj2SblDeelgebiedenVoldoendeMin = 7
    datapunten: vijfRekenDomeinen(),      // drempel bj2SblRekenDomeinenMin = 5
    nederlandsResultaat: '2f',            // → 'voldoende' (2F-of-hoger volstaat, single-veld)
    rekenResultaat: '2f',                 // → 'voldoende' (MBO3-of-hoger)
    kdStatus: 'behaald',
    ...overrides,
  });
}

describe('berekenBj2GeneriekPad — happy paths (één per uitkomst)', () => {
  it('sbc: alle criteria voldaan (vestiging=goes, Roosendaal-levels-eis=0 dus triviaal)', () => {
    const result = berekenBj2GeneriekPad(sbcStudent(), 'goes', NORMEN_GOES);
    expect(result.label).toBe('sbc');
  });

  it('sbl: alle criteria voldaan (vestiging=goes)', () => {
    const result = berekenBj2GeneriekPad(sblStudent(), 'goes', NORMEN_GOES);
    expect(result.label).toBe('sbl');
  });

  it('bespreekgeval: geen enkele drempel gehaald (geen negatief-tier meer, ADR-17d)', () => {
    const result = berekenBj2GeneriekPad(makeStudent(), 'goes', NORMEN_GOES);
    expect(result.label).toBe('bespreekgeval');
  });
});

describe('berekenBj2GeneriekPad — grenswaarden (boundary)', () => {
  it('SBC grens: exact 10 deelgebieden voldoende → WEL sbc', () => {
    const student = sbcStudent({ deelgebiedScores: scoresForCount(10) });
    expect(berekenBj2GeneriekPad(student, 'goes', NORMEN_GOES).label).toBe('sbc');
  });

  it('SBC grens: 9 deelgebieden voldoende (één minder) → GEEN sbc', () => {
    const student = sbcStudent({ deelgebiedScores: scoresForCount(9) });
    const result = berekenBj2GeneriekPad(student, 'goes', NORMEN_GOES);
    expect(result.label).not.toBe('sbc');
  });

  it('SBL grens: exact 7 deelgebieden voldoende → WEL sbl', () => {
    const student = sblStudent({ deelgebiedScores: scoresForCount(7) });
    expect(berekenBj2GeneriekPad(student, 'goes', NORMEN_GOES).label).toBe('sbl');
  });

  it('SBL grens: 6 deelgebieden voldoende (één minder) → GEEN sbl', () => {
    const student = sblStudent({ deelgebiedScores: scoresForCount(6) });
    const result = berekenBj2GeneriekPad(student, 'goes', NORMEN_GOES);
    expect(result.label).not.toBe('sbl');
  });
});

describe('berekenBj2GeneriekPad — KD-interactie (behaald/haalbaar/niet_behaald/missend)', () => {
  it('kdStatus niet_behaald sluit SBC uit, ondanks dat elk ander SBC-criterium voldaan is', () => {
    const student = sbcStudent({ kdStatus: 'niet_behaald' });
    const result = berekenBj2GeneriekPad(student, 'goes', NORMEN_GOES);
    expect(result.label).not.toBe('sbc');
  });

  it('kdStatus niet_behaald sluit SBL uit, ondanks dat elk ander SBL-criterium voldaan is', () => {
    const student = sblStudent({ kdStatus: 'niet_behaald' });
    const result = berekenBj2GeneriekPad(student, 'goes', NORMEN_GOES);
    expect(result.label).not.toBe('sbl');
  });

  it('kdStatus null/missend sluit SBC uit — geen "assume fine" default', () => {
    const student = sbcStudent({ kdStatus: null });
    const result = berekenBj2GeneriekPad(student, 'goes', NORMEN_GOES);
    expect(result.label).not.toBe('sbc');
  });

  it('kdStatus undefined (nooit ingevuld) sluit SBC ook uit', () => {
    const student = sbcStudent({ kdStatus: undefined });
    const result = berekenBj2GeneriekPad(student, 'goes', NORMEN_GOES);
    expect(result.label).not.toBe('sbc');
  });

  it('kdStatus haalbaar VOLDOET aan de KD-eis (behaald OF haalbaar, niet strikt behaald)', () => {
    const student = sbcStudent({ kdStatus: 'haalbaar' });
    const result = berekenBj2GeneriekPad(student, 'goes', NORMEN_GOES);
    expect(result.label).toBe('sbc');
  });
});

describe('berekenBj2GeneriekPad — WVO-traject is SBC-only', () => {
  it('SBL-leerling die aan alle SBL-criteria voldoet bereikt sbl ongeacht wvoTraject (SBL toetst dat veld niet)', () => {
    const student = sblStudent({ wvoTraject: null });
    const result = berekenBj2GeneriekPad(student, 'goes', NORMEN_GOES);
    expect(result.label).toBe('sbl');
  });

  it('undefined wvoTraject verandert de SBL-uitkomst evenmin', () => {
    const student = sblStudent({ wvoTraject: undefined });
    const result = berekenBj2GeneriekPad(student, 'goes', NORMEN_GOES);
    expect(result.label).toBe('sbl');
  });
});

describe('berekenBj2GeneriekPad — Roosendaal 0-sentinel (ADR-17e, kritiek)', () => {
  // Dit is precies de test die de alleLevelsBehaald(dp, 0)-altijd-false-bug zou
  // vangen als de `!== 0`-guard per ongeluk verwijderd/vergeten werd — een
  // Goes/Dordrecht-leerling met NUL level-datapunten mag NOOIT om die reden
  // uitgesloten worden (hun eis ís 0, d.w.z. triviaal voldaan).
  it('Goes-student met 0 level-datapunten bereikt sbc (drempel is 0, triviaal voldaan)', () => {
    const student = sbcStudent(); // 0 Level-N-datapunten (alleen Rekenen-datapunten)
    const result = berekenBj2GeneriekPad(student, 'goes', NORMEN_GOES);
    expect(result.label).toBe('sbc');
  });

  it('Dordrecht-student met 0 level-datapunten bereikt sbl (drempel is 0, triviaal voldaan)', () => {
    const student = sblStudent(); // 0 Level-N-datapunten
    const result = berekenBj2GeneriekPad(student, 'dordrecht', NORMEN_DORDRECHT);
    expect(result.label).toBe('sbl');
  });

  // Spiegelbeeld: bewijst dat de guard NIET ook per ongeluk de eis overslaat
  // voor Roosendaal zelf (waar de drempel WEL een echt, niet-nul getal is).
  it('Roosendaal-student met 0 level-datapunten, verder alle SBC-criteria voldaan, WORDT uitgesloten', () => {
    const student = sbcStudent(); // 0 Level-N-datapunten, zelfde fixture als hierboven
    const result = berekenBj2GeneriekPad(student, 'roosendaal', NORMEN_ROOSENDAAL);
    expect(result.label).not.toBe('sbc');
  });

  it('Roosendaal-student met 0 level-datapunten, verder alle SBL-criteria voldaan, WORDT uitgesloten', () => {
    const student = sblStudent();
    const result = berekenBj2GeneriekPad(student, 'roosendaal', NORMEN_ROOSENDAAL);
    expect(result.label).not.toBe('sbl');
  });

  it('Roosendaal-student die WEL >=3 levels afgerond heeft: sbc alsnog bereikbaar', () => {
    const student = sbcStudent({
      datapunten: [
        ...vijfRekenDomeinen(),
        levelDp(3, 'Op tijd ingeleverd en wel beoordeeld'),
        levelDp(3, 'Op tijd ingeleverd en wel beoordeeld'),
        levelDp(3, 'Op tijd ingeleverd en wel beoordeeld'),
      ],
    });
    const result = berekenBj2GeneriekPad(student, 'roosendaal', NORMEN_ROOSENDAAL);
    expect(result.label).toBe('sbc');
  });

  it('Roosendaal-student die WEL >=2 levels afgerond heeft: sbl alsnog bereikbaar', () => {
    const student = sblStudent({
      datapunten: [
        ...vijfRekenDomeinen(),
        levelDp(2, 'Op tijd ingeleverd en wel beoordeeld'),
        levelDp(2, 'Op tijd ingeleverd en wel beoordeeld'),
      ],
    });
    const result = berekenBj2GeneriekPad(student, 'roosendaal', NORMEN_ROOSENDAAL);
    expect(result.label).toBe('sbl');
  });
});

describe('berekenPrognose (outer wrapper) — vestiging-null-guard voor bj2', () => {
  // Onder het ECHTE (nieuwe) schema geeft isNormenSchemaOndersteund() al 'false'
  // (T10's nog-niet-gedane pensioentaak), dus dit pad is momenteel dubbel
  // beveiligd: de schema-guard vuurt hier eerder dan de vestiging-guard. Zodra
  // T10 landt en de schema-guard voor dit schema 'true' teruggeeft, is de
  // vestiging-guard hieronder (in de bj2-tak van berekenPrognose) de guard die
  // dit gedrag garandeert — zelfde "veilig terugvallen op onbekend"-filosofie
  // als T8's bj1-guard (ADR-16).
  it('vestiging: null → normen_onbekend', () => {
    const student = sbcStudent();
    const result = berekenPrognose(student, 'bj2', undefined, undefined, null);
    expect(result.label).toBe('normen_onbekend');
  });
});

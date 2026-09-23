// ---------------------------------------------------------------------------
// prognosis.test.ts — berekenPrognose + berekenAllePrognoses unit tests
// Wave 0 stub: imports will fail until utils/prognosis.ts is created in Wave 1.
// Tests run as-is once prognosis.ts and schema.ts exist.
// ---------------------------------------------------------------------------

// Deze tests valideerden oorspronkelijk de doorstroomnorm-REKENLOGICA aan de
// hand van het 19-deelgebieden/3-leerlijnen-schema waarop KERN_SBC en
// DEFAULT_NORMEN zijn gekalibreerd (ADR-06), via een vi.mock die het schema
// bevroor onafhankelijk van welk schooljaar toevallig actief was.
//
// M42 T10: die vi.mock is verwijderd. SUPPORTED_LEERLIJNEN (utils/prognosis.ts)
// is nu bijgewerkt naar de ECHTE, live schema-groepen — en telLeerlijnen()
// gebruikt daardoor óók die groepen (T10-bugfix, zie utils/prognosis.ts). Een
// bevroren OUD-schema-mock zou nu de schema-guard juist laten FALEN (de
// groepsnamen matchen SUPPORTED_LEERLIJNEN niet meer) — precies averechts van
// wat dit bestand nodig heeft (de T9c-routingtests hieronder hebben de guard
// juist NODIG om te SLAGEN). Alle helpers hieronder (allScores/
// scoresWithOverride) leiden hun labels al af van het geïmporteerde
// DEELGEBIEDEN, dus zijn schema-agnostisch — dit bestand draait nu gewoon
// tegen het ECHTE, live schema (12 deelgebieden, 2 groepen), net als
// tests/prognosis.bj1Uitkomst.test.ts / prognosis.bj2GeneriekPad.test.ts /
// prognosis.bj2RoosendaalSblKeuze.test.ts.
import { berekenPrognose, berekenAllePrognoses, berekenBj2GeneriekPad } from '../utils/prognosis';
import { DEELGEBIEDEN } from '../utils/schema';
import { appState } from '../utils/datamodel';
import { getNormenVoorVestigingSync } from '../utils/normen';
import { metScoreDatapunten } from './helpers/datapuntenVoorScores';

// Helper: build a minimal student record with specific deelgebied scores
function makeStudent(scores: Record<string, string | null> = {}): any {
  // M43: deelgebiedScores → fixture-datapunten (regressiecontract R4a)
  return metScoreDatapunten({
    leerlingId: 'L1',
    naam: 'Test Leerling',
    deelgebiedScores: scores,
    datapunten: [],
  });
}

// Helper: set all 19 deelgebieden to the given score level
function allScores(level: string): Record<string, string | null> {
  return Object.fromEntries(DEELGEBIEDEN.map((dg: any) => [dg.label, level]));
}

// Helper: set all scores then override N deelgebieden to a different level
function scoresWithOverride(
  base: string,
  override: string,
  count: number
): Record<string, string | null> {
  const scores = allScores(base);
  const keys = Object.keys(scores).slice(0, count);
  for (const k of keys) scores[k] = override;
  return scores;
}

beforeEach(() => {
  appState.students = [];
});

// M42 T9a: makeStudentWithOnbeoordeeld() (bouwde studenten met N onbeoordeelde/
// niet-ingeleverde datapunten) is verwijderd — de enige twee tests die 'm
// gebruikten (de bj2-onbeoordeeld-negatief-tests hieronder) zijn beide
// verwijderd, om de hieronder gedocumenteerde redenen (D17: bj2 heeft geen
// negatief-tier meer).

// ── Tests ─────────────────────────────────────────────────────────────────────

// ── 3 tests removed (M42 T9a) ─────────────────────────────────────────────────
// 'negatief label wanneer >6 deelgebieden onvoldoende zijn',
// 'neutraal label wanneer <13 deelgebieden voldoende (niet negatief)' en
// 'sbl label wanneer >=13 voldoende maar geen sbc-norm gehaald' testten de OLD
// deelgebieden-count-only bj2-formule (>6 onvoldoende -> negatief, 13/15 als
// sbl/sbc-drempel) via berekenPrognose(makeStudent(scores)) ZONDER traject
// (default 'bj2') en ZONDER vestiging. Twee dingen maken deze onherstelbaar
// in-place:
//   1. D13/D17 (ADR-17d): KERN_SBC is weg, en BJ2 heeft sinds T9a helemaal geen
//      'negatief'-tier meer — >6 onvoldoende kan simpelweg nooit meer tot
//      label 'negatief' leiden voor bj2.
//   2. De nieuwe vestiging-null-guard op de bj2-tak (T9a, zelfde patroon als
//      T8's bj1-guard) laat berekenPrognose(student) zonder vestiging altijd
//      'normen_onbekend' teruggeven, ongeacht de scores — dus zelfs een
//      1:1-poging om deze tests hier te laten slagen zou ze vacuous maken
//      (assert op 'normen_onbekend', ongeacht welke drempel getest werd).
// Equivalente dekking (sbc/sbl/bespreekgeval happy paths, boundary-tests op de
// ECHTE bj2SbcDeelgebiedenVoldoendeMin/bj2SblDeelgebiedenVoldoendeMin-drempels)
// staat in tests/prognosis.bj2GeneriekPad.test.ts, tegen het echte schema en
// met een echte vestiging.

test('berekenPrognose met leeg scores object en vestiging geeft een geldig, niet-triviaal label terug', () => {
  // M42 T9a: zonder vestiging zou dit altijd 'normen_onbekend' teruggeven,
  // ongeacht de scores (vestiging-null-guard) — dat zou deze test vacuous
  // maken (een "geldig label"-check die niets meer over de rekenlogica zegt).
  // Met een vestiging doorloopt dit de echte berekenBj2GeneriekPad-logica.
  const result = berekenPrognose(makeStudent({}), 'bj2', undefined, undefined, 'goes');
  expect(result).toBeDefined();
  expect(typeof result.label).toBe('string');
  expect(result.label.length).toBeGreaterThan(0);
  expect(result.label).toBe('bespreekgeval'); // leeg record voldoet aan geen enkel criterium
});

test('berekenAllePrognoses met lege students array geeft lege array', () => {
  appState.students = [];
  const result = berekenAllePrognoses();
  expect(Array.isArray(result)).toBe(true);
  expect(result.length).toBe(0);
});

// ── BJ1: onbeoordeeld/niet ingeleverd negatief-trigger ────────────────────────
//
// M42 T8: de BJ1-tak van berekenPrognose() is herschreven naar het nieuwe
// vestiging-bewuste 3-uitkomsten-model (berekenBj1Uitkomst). De destijds
// OLD-schema-gemockte tests die hier stonden riepen berekenPrognose(student,
// 'bj1') aan ZONDER vestiging — dat retourneert nog steeds 'normen_onbekend'
// (veilige vestiging-null-guard-fallback, ADR-16), niet meer het oude label.
// De onbeoordeeld/niet-ingeleverd-negatief-trigger die deze tests dekten is
// 1:1 herbouwd tegen het ECHTE schema in tests/prognosis.bj1Uitkomst.test.ts,
// describe-blokken "happy paths" (Trigger B happy path) en "grenswaarden"
// (Trigger B grens: exact 4 → geen negatief, 5 → wel negatief) — zie die
// tests voor de equivalente dekking. (M42 T10: de OLD-schema-mock die hier
// destijds bovenaan dit bestand stond is inmiddels verwijderd — dit bestand
// draait nu zelf ook tegen het ECHTE, live schema, maar deze specifieke BJ1-
// tests bleven verhuisd naar bj1Uitkomst.test.ts.)

// ── 'BJ2 NIET negatief door onbeoordeeld-criterium (BJ1-only)' verwijderd (M42 T9a) ──
// Deze test bewees dat de BJ1-only onbeoordeeld-negatief-trigger niet ook per
// ongeluk voor bj2 gold. Sinds T9a heeft bj2 HELEMAAL geen negatief-tier meer
// (D17/ADR-17d) — "result.label niet 'negatief'" is nu triviaal waar voor ELKE
// bj2-student, ongeacht het aantal onbeoordeelde datapunten, dus deze
// assertie test niets meer (exact het soort vacuous-test-risico dat T8's
// rapport ook al signaleerde). Geen vervangende test nodig: de afwezigheid
// van een negatief-tier voor bj2 is zelf al gedekt door
// tests/prognosis.bj2GeneriekPad.test.ts's happy-path/bespreekgeval-tests
// (die label altijd 'sbl'|'sbc'|'bespreekgeval' verwachten, nooit 'negatief').

// ---------------------------------------------------------------------------
// berekenPrognose activeDeelgebiedenIds filter — Phase 18 RED tests
// These tests FAIL until 18-03 adds the activeDeelgebiedenIds parameter.
// ---------------------------------------------------------------------------

describe('berekenPrognose activeDeelgebiedenIds filter (Phase 18)', () => {

  it('without activeDeelgebiedenIds counts all deelgebieden', () => {
    // All deelgebieden scored 'voldoende' — should produce totaalVoldoendeOfHoger === DEELGEBIEDEN.length
    const scores = allScores('voldoende');
    const student = makeStudent(scores);

    const result = berekenPrognose(student);

    expect(result.totaalVoldoendeOfHoger).toBe(DEELGEBIEDEN.length);
  });

  it('with activeDeelgebiedenIds filters out inactive deelgebieden', () => {
    // All deelgebieden scored 'voldoende', but only 3 are active → only 3 count
    const scores = allScores('voldoende');
    const student = makeStudent(scores);

    const activeIds = [DEELGEBIEDEN[0].id, DEELGEBIEDEN[1].id, DEELGEBIEDEN[2].id];
    const result = berekenPrognose(student, undefined, activeIds);

    expect(result.totaalVoldoendeOfHoger).toBe(3);
  });

  it('with empty activeDeelgebiedenIds array yields zero counts', () => {
    // Empty array → no deelgebieden active → nothing counted
    const scores = allScores('voldoende');
    const student = makeStudent(scores);

    const result = berekenPrognose(student, undefined, []);

    expect(result.totaalVoldoendeOfHoger).toBe(0);
    expect(result.totaalOnvoldoende).toBe(0);
  });

  it('uses getLeerlijnenMappingSync (no Promise leak)', () => {
    // getLeerlijnenMappingSync is synchronous by design; cold-cache returns schema defaults.
    // No mock needed — calling it inside berekenPrognose must not return a Promise.
    // M42 T9a: bj2 (default traject) now needs a vestiging to reach a computed
    // label instead of 'normen_onbekend' — added as the 5th arg. validLabels
    // updated to the new bj2 label set (no more 'negatief'/'neutraal' for bj2,
    // see D17/ADR-17d); the real point of this test (mapping is a plain object,
    // not an unresolved Promise) is unaffected by which label set applies.
    const activeIds = DEELGEBIEDEN.slice(0, 4).map(dg => dg.id);
    const scores: Record<string, string | null> = {};
    for (const dg of DEELGEBIEDEN) {
      scores[dg.label] = activeIds.includes(dg.id) ? 'goed' : null;
    }
    const student = makeStudent(scores);

    const result = berekenPrognose(student, undefined, activeIds, undefined, 'goes');

    // Result label must be a valid string (proves mapping was a real object, not a Promise)
    const validLabels = ['sbc', 'sbl', 'bespreekgeval'];
    expect(validLabels).toContain(result.label);
    expect(result.label).not.toBeUndefined();
  });

});

// ---------------------------------------------------------------------------
// M42 T9c — berekenPrognose bj2-tak routing: Roosendaal SBL-keuzeproces
//
// Deze routing-tests riepen berekenPrognose() aan met een echte vestiging en
// hadden daarom, VOOR T10, de OLD-schema vi.mock aan de top van dit bestand
// NODIG om isNormenSchemaOndersteund() door te laten (onder het ECHTE, live
// schema gaf berekenPrognose voor bj2 destijds altijd 'normen_onbekend'
// terug, VOOR de routing-code ooit bereikt werd). M42 T10 heeft die mock
// verwijderd en de schema-guard bijgewerkt naar het ECHTE schema — deze
// tests draaien nu gewoon rechtstreeks tegen dat ECHTE, live schema, zonder
// mock nodig te hebben. Ze staan nog steeds hier (niet in het
// tests/prognosis.bj2RoosendaalSblKeuze.test.ts-bestand) omdat dat bestand de
// criteria van berekenBj2RoosendaalSblKeuze zelf test (rechtstreekse aanroep);
// dit blok test alleen WANNEER berekenPrognose ernaartoe routeert.
//
// ADR-17e: 'sbl'-keuze routeert naar de nieuwe, kleinere functie; 'sbc'-keuze
// en "geen keuze" blijven ONVERANDERD via berekenBj2GeneriekPad lopen (Tabel A).
describe('M42 T9c — berekenPrognose bj2-tak routing (Roosendaal SBL-keuzeproces)', () => {
  function fase3ScoreDp(scores: Record<string, string | null>): any {
    return { vak: 'Resultaten', datapunt: 'Resultatentabel', scores, fase: 3 };
  }
  function rekenDomeinDp(n: number): any {
    return { vak: 'Rekenen', datapunt: `F2 Rekenen ‐eindtoets domein ${n}`, scores: {}, status: 'Op tijd ingeleverd en wel beoordeeld' };
  }
  function levelDp(n: number): any {
    return { vak: 'Extern praktijkleren', datapunt: `Level ${n} lesgeven`, scores: {}, status: 'Op tijd ingeleverd en wel beoordeeld' };
  }
  function vijfRekenDomeinen(): any[] { return [1, 2, 3, 4, 5].map(rekenDomeinDp); }
  function tweeLevelsAfgerond(): any[] { return [levelDp(2), levelDp(2)]; }

  it("roosendaalTraject: 'sbl' routeert via berekenBj2RoosendaalSblKeuze (bereikt sbl via de SBL-keuze-criteria, NIET via de generieke criteria)", () => {
    const student = {
      leerlingId: 'L1',
      naam: 'Test Leerling',
      // M43: beide paden lezen nu dezelfde bron (student.datapunten via de
      // S/C-formule). Het onderscheid zit in de fase: over het HELE record zijn
      // deze 7 deelgebieden onvoldoende (fase 3: V, fase 2: 2×O → S = -4), dus
      // berekenBj2GeneriekPad's aantalVoldoendeOfHoger is 0 en generic sbl
      // (drempel 7) EN sbc (drempel 10) zijn onbereikbaar. Alleen de fase-3-
      // telling van het SBL-keuzepad ziet 7× V — bewijst dat 'sbl' via die
      // route komt.
      deelgebiedScores: {},
      datapunten: [
        // Alle 7 lesgeven_en_organiseren-labels (ECHTE, live schema), fase 3,
        // 'voldoende' (drempel bj2RoosendaalSblKeuzeDeelgebiedenVoldoendeMin = 7).
        fase3ScoreDp({
          'O&V': 'voldoende', 'S&O': 'voldoende', 'PH': 'voldoende',
          'DH': 'voldoende', 'I&P': 'voldoende', 'O&C': 'voldoende', 'E&V': 'voldoende',
        }),
        ...[1, 2].map(() => ({ vak: 'Resultaten', datapunt: 'Resultatentabel', fase: 2, scores: {
          'O&V': 'onvoldoende', 'S&O': 'onvoldoende', 'PH': 'onvoldoende',
          'DH': 'onvoldoende', 'I&P': 'onvoldoende', 'O&C': 'onvoldoende', 'E&V': 'onvoldoende',
        } })),
        ...vijfRekenDomeinen(),
        ...tweeLevelsAfgerond(),
      ],
      nederlandsResultaat: '2f',
      rekenResultaat: '2f',
      kdStatus: 'behaald',
      roosendaalTraject: 'sbl',
    };

    const result = berekenPrognose(student, 'bj2', undefined, undefined, 'roosendaal');
    expect(result.label).toBe('sbl');

    // Bevestigt dat het 'sbl'-resultaat NIET stilzwijgend via de generieke
    // functie tot stand kwam (die zou hier 'bespreekgeval' geven).
    const generic = berekenBj2GeneriekPad(student, 'roosendaal', getNormenVoorVestigingSync('roosendaal'));
    expect(generic.label).toBe('bespreekgeval');
  });

  it("roosendaalTraject: 'sbc' routeert ONVERANDERD via berekenBj2GeneriekPad (geen speciale interceptie)", () => {
    const student = {
      leerlingId: 'L1',
      naam: 'Test Leerling',
      deelgebiedScores: {},
      datapunten: [],
      roosendaalTraject: 'sbc',
    };

    const viaPrognose = berekenPrognose(student, 'bj2', undefined, undefined, 'roosendaal');
    const direct = berekenBj2GeneriekPad(student, 'roosendaal', getNormenVoorVestigingSync('roosendaal'));

    expect(viaPrognose.label).toBe(direct.label);
    expect(viaPrognose.gaps).toEqual(direct.gaps);
  });

  it('roosendaalTraject: null/undefined routeert OOK via berekenBj2GeneriekPad (geen derde fork)', () => {
    const studentNull = {
      leerlingId: 'L1', naam: 'Test Leerling',
      deelgebiedScores: {}, datapunten: [], roosendaalTraject: null,
    };
    const studentUndefined = {
      leerlingId: 'L2', naam: 'Test Leerling 2',
      deelgebiedScores: {}, datapunten: [],
      // roosendaalTraject bewust weggelaten (nooit ingevuld)
    };

    const normen = getNormenVoorVestigingSync('roosendaal');

    for (const student of [studentNull, studentUndefined]) {
      const viaPrognose = berekenPrognose(student, 'bj2', undefined, undefined, 'roosendaal');
      const direct = berekenBj2GeneriekPad(student, 'roosendaal', normen);
      expect(viaPrognose.label).toBe(direct.label);
      expect(viaPrognose.gaps).toEqual(direct.gaps);
    }
  });

  it('een niet-Roosendaal (goes) student is onaangetast, ongeacht roosendaalTraject-waarde (bewijst dat de vestiging-guard écht gate\'t, niet alleen de traject-waarde)', () => {
    const student = {
      leerlingId: 'L1',
      naam: 'Test Leerling',
      deelgebiedScores: {},
      datapunten: [],
      roosendaalTraject: 'sbl', // zou voor Roosendaal wél de nieuwe route triggeren
    };

    const viaPrognose = berekenPrognose(student, 'bj2', undefined, undefined, 'goes');
    const direct = berekenBj2GeneriekPad(student, 'goes', getNormenVoorVestigingSync('goes'));

    expect(viaPrognose.label).toBe(direct.label);
    expect(viaPrognose.gaps).toEqual(direct.gaps);
  });
});

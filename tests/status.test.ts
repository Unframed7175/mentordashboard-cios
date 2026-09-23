// ---------------------------------------------------------------------------
// status.test.ts — berekenStatus + detectTraject unit tests
// Covers berekenStatus outcomes: grijs/rood/oranje-Twijfelgeval/groen/blauw
// plus 2 detectTraject patterns (bj1/bj2).
// ---------------------------------------------------------------------------

// Dit bestand mockte oorspronkelijk het 19-deelgebieden/3-leerlijnen-schema
// (zelfde reden als tests/prognosis.test.ts destijds) om onafhankelijk te
// blijven van welk schooljaar toevallig actief was.
//
// M42 T10: die vi.mock is verwijderd. Sinds T10 is SUPPORTED_LEERLIJNEN
// (utils/prognosis.ts) bijgewerkt naar de ECHTE, live schema-groepen — een
// bevroren OUD-schema-mock zou de schema-guard nu juist laten FALEN (de
// groepsnamen matchen niet meer), wat elke test hier terug zou zetten naar
// 'normen_onbekend' i.p.v. de bedoelde sbc/sbl/bespreekgeval-uitkomsten. Dit
// bestand draait nu tegen het ECHTE, live schema (12 deelgebieden, 2 groepen),
// en allScores() hieronder leidt zijn labels af van het geïmporteerde
// DEELGEBIEDEN i.p.v. een hardcoded 19-labellijst.
import { berekenStatus, detectTraject, STATUS_VOLGORDE, computeKpiCounts } from '../src/utils/status';
import type { StatusResult } from '../src/utils/status';
import { appState } from '../utils/datamodel';
import { DEELGEBIEDEN } from '../utils/schema';
import { metScoreDatapunten } from './helpers/datapuntenVoorScores';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Minimal student record with optional overrides.
 * Default periode/leerjaar point to bj2 so berekenPrognose uses bj2 traject.
 */
function makeStudent(overrides: Partial<any> = {}): any {
  // M43: deelgebiedScores → fixture-datapunten (regressiecontract R4a)
  return metScoreDatapunten({
    leerlingId:        'L1',
    naam:              'Test Leerling',
    deelgebiedScores:  {},
    datapunten:        [],
    verzuim:           null,
    periode:           'bj2 fase 2',
    leerjaar:          '2',
    ...overrides,
  });
}

/**
 * Build a deelgebiedScores object with all real (live-schema) deelgebied labels
 * set to the same score. Labels are derived from DEELGEBIEDEN (schema-agnostic,
 * M42 T10 — previously a hardcoded 19-label list from the retired schema).
 */
function allScores(level: string | null): Record<string, string | null> {
  return Object.fromEntries(DEELGEBIEDEN.map((dg) => [dg.label, level]));
}

// ---------------------------------------------------------------------------
// M42 T9a fixtures — berekenBj2GeneriekPad's SBC/SBL criteria are checked
// against student.datapunten (Rekenen) + several dedicated fields (nlSchrijven/
// nlGesprekvoeren/nederlandsResultaat/rekenResultaat/wvoTraject/keuzedelen),
// NOT just a deelgebieden-count anymore (see utils/prognosis.ts). Every BJ2
// test below that needs a real 'sbc'/'sbl' outcome (rather than the new
// 'bespreekgeval' fallback) must set all of these — a bare deelgebieden count
// is no longer sufficient by itself.
// ---------------------------------------------------------------------------

function rekenenDatapunten(): any[] {
  return [1, 2, 3, 4, 5].map((n) => ({
    vak: 'Rekenen',
    datapunt: `F2 Rekenen -eindtoets domein ${n}`,
    scores: {},
    status: 'Op tijd ingeleverd en wel beoordeeld',
  }));
}

function makeFullSbcStudent(overrides: Partial<any> = {}): any {
  return makeStudent({
    deelgebiedScores: allScores('voldoende'), // 12 >= bj2SbcDeelgebiedenVoldoendeMin (10)
    nlSchrijven: '2f',                        // → 'voldoende' (2F-of-hoger volstaat)
    nlGesprekvoeren: '3f',                    // → 'goed' (exact 3F vereist)
    rekenResultaat: '3f',                     // → 'goed' (MBO4)
    datapunten: rekenenDatapunten(),          // 5 domeinen afgerond
    wvoTraject: true,
    keuzedelen: [{ id: '1', naam: 'KD Sport', status: 'behaald' }],
    ...overrides,
  });
}

function makeFullSblStudent(overrides: Partial<any> = {}): any {
  return makeStudent({
    deelgebiedScores: allScores('voldoende'), // 12 >= bj2SblDeelgebiedenVoldoendeMin (7)
    nederlandsResultaat: '2f',                // → 'voldoende' (2F-of-hoger volstaat, single-veld)
    rekenResultaat: '2f',                     // → 'voldoende' (MBO3-of-hoger)
    datapunten: rekenenDatapunten(),          // 5 domeinen afgerond
    keuzedelen: [{ id: '1', naam: 'KD Sport', status: 'behaald' }],
    ...overrides,
  });
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  appState.students = [];
});

// ---------------------------------------------------------------------------
// berekenStatus tests
// ---------------------------------------------------------------------------

test('grijs: no scores → kleur=grijs, label=Onbekend', () => {
  // M42 T9a: BJ2 gaat nu ook door de vestiging-null-guard, dus een vestiging
  // is nodig om de "heeft geen scores"-tak te bereiken i.p.v. 'normen_onbekend'.
  // Empty deelgebiedScores means totaalVoldoendeOfHoger + totaalOnvoldoende === 0
  const student = makeStudent({ deelgebiedScores: {} });
  const result = berekenStatus(student, undefined, undefined, 'goes');
  expect(result.kleur).toBe('grijs');
  expect(result.label).toBe('Onbekend');
});

// ── 'rood: negatief prognose (7 onvoldoende)' verwijderd (M42 T9a, D17) ───────
// D17/ADR-17d: het brondocument heeft voor BJ2 GEEN eigen negatief-kolom —
// berekenBj2GeneriekPad retourneert nooit 'negatief' (alleen 'sbl'/'sbc'/
// 'bespreekgeval'). Deze test testte precies dat, nu afgeschafte, gedrag.
// 'rood'/'Risico' blijft een geldige RAG-uitkomst — alleen via BJ1
// (berekenBj1Uitkomst's eigen negatief-triggers, zie
// tests/prognosis.bj1Uitkomst.test.ts) is die nog bereikbaar, nooit meer via
// BJ2.

test('oranje/Bespreekgeval: bespreekgeval-prognose (10 deelgebieden voldoende, mist Nederlands/Rekenen/KD) → kleur=oranje, label=Bespreekgeval', () => {
  // M42 T9a/D17: BJ2's fallback-label heet nu 'bespreekgeval' (niet meer
  // 'neutraal' — dat blijft BJ1's eigen label). 10 voldoende alleen is niet
  // genoeg: zonder nlSchrijven/nlGesprekvoeren/nederlandsResultaat/Rekenen/KD
  // voldoet dit noch aan SBC noch aan SBL.
  const scores = allScores(null);
  const keys = Object.keys(scores).slice(0, 10);
  for (const k of keys) scores[k] = 'voldoende';
  const student = makeStudent({ deelgebiedScores: scores });
  const result = berekenStatus(student, undefined, undefined, 'goes');
  expect(result.kleur).toBe('oranje');
  expect(result.label).toBe('Bespreekgeval');
});

test('groen/SBL: hoog verzuim beïnvloedt kleur NIET meer (verzuim als ring, niet kleur)', () => {
  // T02: verzuim is no longer a color override — shown as box-shadow ring on tile instead.
  // Volledige SBL-criteria (M42 T9a) → groen/SBL regardless of ongeoorloofd hours.
  const student = makeFullSblStudent({
    verzuim: { aanwezigheid: 0, geoorloofd: 0, ongeoorloofd: 601 },
  });
  const result = berekenStatus(student, undefined, undefined, 'goes');
  expect(result.kleur).toBe('groen');
  expect(result.label).toBe('SBL');
});

test('groen/SBL: sbl prognose (volledige SBL-criteria) → kleur=groen, label=SBL', () => {
  const student = makeFullSblStudent();
  const result = berekenStatus(student, undefined, undefined, 'goes');
  expect(result.kleur).toBe('groen');
  expect(result.label).toBe('SBL');
});

// ---------------------------------------------------------------------------
// detectTraject tests
// ---------------------------------------------------------------------------

test('detectTraject: periode="bj1 fase 1" → "bj1"', () => {
  const result = detectTraject({ periode: 'bj1 fase 1', leerjaar: '1' });
  expect(result).toBe('bj1');
});

test('detectTraject: periode="2e jaar" → "bj2"', () => {
  const result = detectTraject({ periode: '2e jaar', leerjaar: '2' });
  expect(result).toBe('bj2');
});

// ---------------------------------------------------------------------------
// STATUS_VOLGORDE smoke test
// ---------------------------------------------------------------------------

test('STATUS_VOLGORDE: rood < oranje < groen < paars < blauw < grijs', () => {
  expect(STATUS_VOLGORDE['rood']).toBeLessThan(STATUS_VOLGORDE['oranje']);
  expect(STATUS_VOLGORDE['oranje']).toBeLessThan(STATUS_VOLGORDE['groen']);
  expect(STATUS_VOLGORDE['groen']).toBeLessThan(STATUS_VOLGORDE['paars']);
  expect(STATUS_VOLGORDE['paars']).toBeLessThan(STATUS_VOLGORDE['blauw']);
  expect(STATUS_VOLGORDE['blauw']).toBeLessThan(STATUS_VOLGORDE['grijs']);
});

// ---------------------------------------------------------------------------
// berekenStatus thresholds — Phase 18 RED tests
// These tests FAIL until 18-03 adds the thresholds parameter and geoorloofd check.
// ---------------------------------------------------------------------------

describe('berekenStatus thresholds (Phase 18)', () => {

  // Helper: volledige SBL-criteria (M42 T9a) → positive prognose (sbl label for bj2)
  function makePositiveStudent(verzuim?: { aanwezigheid: number; geoorloofd: number; ongeoorloofd: number }): any {
    return makeFullSblStudent({ verzuim: verzuim ?? null });
  }

  it('T02: hoog ongeoorloofd verzuim verandert kleur NIET — altijd prognose-driven (ring op tegel)', () => {
    // T02: verzuim is no longer a color override. Volledige SBL-criteria → groen/SBL
    // regardless of ongeoorloofd hours exceeding the threshold.
    const student = makePositiveStudent({ aanwezigheid: 0, geoorloofd: 0, ongeoorloofd: 700 });

    const result = berekenStatus(student, undefined, { geoorloofd: 1500, ongeoorloofd: 600 }, 'goes');

    expect(result.kleur).toBe('groen');
    expect(result.label).toBe('SBL');
  });

  it('T02: hoog geoorloofd verzuim verandert kleur NIET — altijd prognose-driven', () => {
    // T02: verzuim color override removed. Volledige SBL-criteria → groen/SBL
    const student = makePositiveStudent({ aanwezigheid: 0, geoorloofd: 1000, ongeoorloofd: 0 });

    const result = berekenStatus(student, undefined, { geoorloofd: 900, ongeoorloofd: 600 }, 'goes');

    expect(result.kleur).toBe('groen');
    expect(result.label).toBe('SBL');
  });

  it('T02: verzuim boven standaard drempel → kleur blijft groen/SBL (ring zichtbaar op tegel)', () => {
    // T02: color no longer changes for high verzuim — ring is shown instead.
    const student = makePositiveStudent({ aanwezigheid: 0, geoorloofd: 0, ongeoorloofd: 601 });

    const result = berekenStatus(student, undefined, undefined, 'goes');

    expect(result.kleur).toBe('groen');
    expect(result.label).toBe('SBL');
  });

  it('prognose-driven status: laag verzuim → groen/SBL', () => {
    // Both ongeoorloofd=10 and geoorloofd=10 are well below thresholds
    // Volledige SBL-criteria → groen/SBL
    const student = makePositiveStudent({ aanwezigheid: 0, geoorloofd: 10, ongeoorloofd: 10 });

    const result = berekenStatus(student, undefined, { geoorloofd: 900, ongeoorloofd: 600 }, 'goes');

    expect(result.kleur).toBe('groen');
    expect(result.label).toBe('SBL');
  });

});

describe('berekenStatus vestiging parameter (M42 T7b/T9a)', () => {

  // ── 'accepts .../ without throwing or changing kleur/label' herschreven (M42 T9a) ──
  // T7b's oorspronkelijke aanname ("vestiging is pure plumbing, verandert nooit
  // kleur/label") is met T9a's per-vestiging VestigingNormen-motor precies
  // ONGEDAAN gemaakt — dat IS het hele punt van T9a: verschillende vestigingen
  // kunnen nu, terecht, verschillende sbc/sbl/bespreekgeval-uitkomsten geven
  // (bv. de Roosendaal-levels-eis). De "labels moeten identiek zijn"-assertie
  // hieronder is dus vervangen door twee dingen die WEL nog moeten kloppen:
  // geen enkele vestigingswaarde mag een throw geven, en null/undefined moeten
  // allebei consistent op 'normen_onbekend' uitkomen (de vestiging-null-guard,
  // ADR-16-stijl). Echte "verschillende vestiging → verschillende uitkomst"-
  // dekking staat in tests/prognosis.bj2GeneriekPad.test.ts (Roosendaal-only
  // levels-eis, 0-sentinel-tests).
  it('accepts roosendaal/goes/dordrecht/undefined/null without throwing; null/undefined consistently give normen_onbekend', () => {
    const student = makeFullSblStudent();

    for (const vestiging of ['roosendaal', 'goes', 'dordrecht', undefined, null] as const) {
      let result: StatusResult;
      expect(() => {
        result = berekenStatus(student, undefined, undefined, vestiging);
      }).not.toThrow();
    }

    const zonderVestiging = berekenStatus(student, undefined, undefined, undefined);
    const metNull = berekenStatus(student, undefined, undefined, null);
    expect(zonderVestiging.label).toBe('Normen onbekend');
    expect(metNull.label).toBe('Normen onbekend');
  });

  it('still honours the 3rd positional _thresholds param when vestiging is passed as 4th', () => {
    const student = makeFullSblStudent();
    const result = berekenStatus(student, undefined, { geoorloofd: 1500, ongeoorloofd: 600 }, 'goes');
    expect(result.kleur).toBe('groen');
    expect(result.label).toBe('SBL');
  });

});

describe('berekenStatus keuzedelen (Phase 39)', () => {

  function makeSbcStudent(keuzedelen?: any[]): any {
    return makeFullSbcStudent({ keuzedelen: keuzedelen ?? [] });
  }

  const kdBehaald     = [{ id: '1', naam: 'KD Sport', status: 'behaald'      }];
  const kdHaalbaar    = [{ id: '1', naam: 'KD Sport', status: 'haalbaar'     }];
  const kdNietBehaald = [{ id: '1', naam: 'KD Sport', status: 'niet_behaald' }];

  it('sbc + behaald KD → blauw / SBC (geen downgrade)', () => {
    const result = berekenStatus(makeSbcStudent(kdBehaald), undefined, undefined, 'goes');
    expect(result.kleur).toBe('blauw');
    expect(result.label).toBe('SBC');
  });

  it('sbc + haalbaar KD → oranje / Let op — KD (SBC vereist behaald)', () => {
    const result = berekenStatus(makeSbcStudent(kdHaalbaar), undefined, undefined, 'goes');
    expect(result.kleur).toBe('oranje');
    expect(result.label).toBe('Let op — KD');
  });

  // ── 'sbc + niet_behaald KD' aangepast (M42 T9a) ───────────────────────────
  // VOOR T9a: kdStatus zat ALLEEN in status.ts's downgrade-logica (na afloop
  // van de prognose-berekening), dus 'niet_behaald' liet het label op 'sbc'
  // staan en downgradede pas de KLEUR naar oranje/'Let op — KD'.
  // SINDS T9a: de KD-eis zit IN berekenBj2GeneriekPad's eigen sbc/sbl-criteria
  // (brief-tabel: "kdStatus === 'behaald' || 'haalbaar'" — 'niet_behaald' faalt
  // dat AL bij het bepalen van het label zelf). Een 'niet_behaald'-leerling kan
  // dus nooit meer label 'sbc' bereiken — het label wordt al 'bespreekgeval'
  // vóórdat status.ts's eigen (ongewijzigde, brief-verplicht met rust gelaten)
  // downgrade-check ooit gezien wordt. Kleur blijft oranje, labeltekst wijzigt.
  it('sbc + niet_behaald KD → oranje / Bespreekgeval (KD-eis zit nu IN de sbc/sbl-criteria zelf)', () => {
    const result = berekenStatus(makeSbcStudent(kdNietBehaald), undefined, undefined, 'goes');
    expect(result.kleur).toBe('oranje');
    expect(result.label).toBe('Bespreekgeval');
  });

  // ── 'sbc + geen keuzedelen' aangepast (M42 T9a) ───────────────────────────
  // VOOR T9a: kdStatus===null (geen keuzedelen ingevuld) werd door status.ts's
  // downgrade-check NIET als 'niet_behaald'/'haalbaar' herkend, dus geen
  // downgrade → label bleef 'sbc'/blauw ("null = geen downgrade").
  // SINDS T9a: de brief is expliciet dat een missende/null KD-status de sbc/
  // sbl-eis ZELF laat falen ("een missende status is niet automatisch 'in
  // orde'") — dus dit is nu een bespreekgeval, niet langer een stille SBC-pass.
  it('sbc + geen keuzedelen → oranje / Bespreekgeval (missende KD-status is geen "aannemen dat het goed zit" meer)', () => {
    const result = berekenStatus(makeSbcStudent([]), undefined, undefined, 'goes');
    expect(result.kleur).toBe('oranje');
    expect(result.label).toBe('Bespreekgeval');
  });

  // ── 'sbl + niet_behaald KD' aangepast (M42 T9a) ───────────────────────────
  // De oorspronkelijke test-naam/comment ("SBL heeft geen KD-eis") klopte voor
  // de OUDE motor (status.ts's downgrade-check zat alleen op het sbc-pad).
  // De brief is expliciet dat SBL nu WEL een eigen KD-eis heeft ("KD: same
  // check as SBC") — 'niet_behaald' sluit dus ook SBL uit, vóór status.ts ooit
  // een label 'sbl' te zien krijgt.
  it('sbl + niet_behaald KD → oranje / Bespreekgeval (SBL heeft nu OOK een KD-eis, T9a)', () => {
    const student = makeFullSblStudent({ keuzedelen: kdNietBehaald });
    const result = berekenStatus(student, undefined, undefined, 'goes');
    expect(result.kleur).toBe('oranje');
    expect(result.label).toBe('Bespreekgeval');
  });

  // ── 2 tests restored (M42 T10) ────────────────────────────────────────────
  // Originally removed at M42 T8 because this KD+naar_bj2 interaction was
  // genuinely unreachable end-to-end (berekenPrognose was still gated by
  // isNormenSchemaOndersteund(), false for the real schema) — T8 left an
  // explicit "NOTE FOR T10's BRIEF" asking for this coverage to be restored
  // once the guard supports the real schema. It now does; fixture mirrors
  // tests/prognosis.bj1Uitkomst.test.ts's naar_bj2 happy-path (9 deelgebieden
  // voldoende in fase 2 across both groups, Nederlands/Rekenen op 2F, geen
  // versneld-niveau) via a real vestiging ('goes') and explicit traject 'bj1'.
  function makeNaarBj2Student(overrides: Partial<any> = {}): any {
    return makeStudent({
      periode: 'bj1 fase 2',
      leerjaar: '1',
      // heel-jaar-aggregaat (nodig voor berekenStatus's eigen, van
      // berekenBj1Uitkomst losstaande "heeft deze leerling scores"-check —
      // zie utils/prognosis.ts's telLeerlijnen()); berekenBj1Uitkomst zelf
      // leest de fase-2-tabel hieronder via student.datapunten.
      deelgebiedScores: {
        'O&V': 'voldoende', 'S&O': 'voldoende', 'PH': 'voldoende', 'DH': 'voldoende',
        'I&P': 'voldoende', 'O&C': 'voldoende', 'E&V': 'voldoende',
        'PrHo': 'voldoende', 'DESK': 'voldoende',
      },
      datapunten: [
        {
          vak: 'Resultaten', datapunt: 'Resultatentabel', fase: 2,
          scores: {
            'O&V': 'voldoende', 'S&O': 'voldoende', 'PH': 'voldoende', 'DH': 'voldoende',
            'I&P': 'voldoende', 'O&C': 'voldoende', 'E&V': 'voldoende',
            'PrHo': 'voldoende', 'DESK': 'voldoende',
          },
        },
        ...[1, 2, 3].map((n) => ({
          vak: 'Betekenisvol Bewegen', datapunt: `BVB Professionele houding ${n}`,
          scores: { PrHo: 'voldoende' }, fase: 1,
        })),
        ...[1, 2, 3].map((n) => ({
          vak: 'Rekenen', datapunt: `F2 Rekenen -eindtoets domein ${n}`,
          scores: {}, status: 'Op tijd ingeleverd en wel beoordeeld', fase: 1,
        })),
      ],
      nederlandsResultaat: '2f',
      rekenResultaat: '2f',
      ...overrides,
    });
  }

  it('naar_bj2 + niet_behaald KD → oranje / Let op — KD', () => {
    const result = berekenStatus(makeNaarBj2Student({ keuzedelen: kdNietBehaald }), 'bj1', undefined, 'goes');
    expect(result.kleur).toBe('oranje');
    expect(result.label).toBe('Let op — KD');
  });

  it('naar_bj2 + haalbaar KD → groen / Naar BJ2 (haalbaar downgradet naar_bj2 NIET, anders dan sbc/versneld_sbc)', () => {
    const result = berekenStatus(makeNaarBj2Student({ keuzedelen: kdHaalbaar }), 'bj1', undefined, 'goes');
    expect(result.kleur).toBe('groen');
    expect(result.label).toBe('Naar BJ2');
  });

});

// ---------------------------------------------------------------------------
// computeKpiCounts — KPI-strip aggregatie (T-2026-06-18-07 regressie)
// ---------------------------------------------------------------------------

describe('computeKpiCounts', () => {
  const s = (kleur: StatusResult['kleur'], label = ''): StatusResult =>
    ({ kleur, label, prognose: null });

  it('telt op kleur, niet op labeltekst — alle oranje vallen onder "Let op"', () => {
    // Regressie: de oude code filterde op label === "Let op"/"Verzuim", strings die
    // berekenStatus niet meer produceert; "Let op" en "Verzuim" stonden daardoor altijd op 0.
    const statuses = [
      s('oranje', 'Twijfelgeval'),
      s('oranje', 'Let op — KD'),
      s('rood', 'Risico'),
      s('groen', 'SBL'),
      s('blauw', 'SBC'),
      s('grijs', 'Onbekend'),
    ];
    const k = computeKpiCounts(statuses, statuses.length);
    expect(k.letOpCount).toBe(2);       // beide oranje, ongeacht label
    expect(k.risicoCount).toBe(1);
    expect(k.opSchemaCount).toBe(2);    // groen + blauw
    expect(k.grijsCount).toBe(1);
    expect(k.scoredCount).toBe(5);      // 6 − 1 grijs
    expect(k.pctOpSchema).toBe(40);     // round(2/5 * 100)
  });

  it('pctOpSchema is null wanneer er geen beoordeelde leerlingen zijn', () => {
    const k = computeKpiCounts([s('grijs'), s('grijs')], 2);
    expect(k.pctOpSchema).toBeNull();
    expect(k.scoredCount).toBe(0);
    expect(k.letOpCount).toBe(0);
  });

  it('telt paars mee als "op schema" (forward-compat)', () => {
    const k = computeKpiCounts([s('paars', 'SBC')], 1);
    expect(k.opSchemaCount).toBe(1);
    expect(k.pctOpSchema).toBe(100);
  });

  it('lege invoer → alle tellers 0 en pctOpSchema null', () => {
    const k = computeKpiCounts([], 0);
    expect(k).toEqual({ opSchemaCount: 0, letOpCount: 0, risicoCount: 0, grijsCount: 0, scoredCount: 0, pctOpSchema: null });
  });
});

// utils/prognosis.ts — Doorstroomnorm engine
// TypeScript migration from prognosis.js (Plan 03)
//
// Ondersteunde trajecten (geef mee als tweede argument aan berekenPrognose):
//   'bj1'  → Einde Basisjaar 1: doorstroom naar BJ2 of versneld SBC-profieljaar
//   'bj2'  → Einde Basisjaar 2: doorstroom naar Examineringsjaar SBL of Profieljaar SBC
//            (standaard wanneer traject niet opgegeven)
//
// Depends on:
//   utils/schema.ts — DEELGEBIEDEN
//   utils/leerlijnen.ts — getLeerlijnenMapping
//   utils/datamodel.ts — appState (voor berekenAllePrognoses)
//   utils/normen.ts — getNormenSync (doorstroomnormen)
//   utils/scoreAggregation.ts — getFase, aggregateLatestScores (gedeeld met
//     parsers/pdf.ts; deze aggregatie-laag importeert bewust NIET van
//     parsers/pdf.ts zelf — dat zou de open-world-parse/closed-world-
//     aggregatie-laagscheiding omkeren, zie M42 Lane B review-fix #2)

import { DEELGEBIEDEN, normalizeRekenScore } from './schema';
import { getLeerlijnenMappingSync } from './leerlijnen';
import { appState } from './datamodel';
import { getNormenSync, getNormenVoorVestigingSync, type Normen, type VestigingNormen } from './normen';
import { getFase, aggregateLatestScores } from './scoreAggregation';
import { telBetekenisvolBewegenProfHouding, telRekenDomeinen, telLevelsAfgerond, alleLevelsBehaald } from './datapuntTelling';
import type { Datapunt } from './datapuntTelling';
import type { Vestiging } from './klassen';
import { normalizeTriState, normalizeRoosendaalTraject } from './trajectNormalisatie';
import { aggregateKdStatus } from './keuzedelen';

// ---------------------------------------------------------------------------
// Constanten
// ---------------------------------------------------------------------------

// KERN_SBC (V&A/P&O/C&B/1E&B kern-deelgebieden-eis) is verwijderd (M42 T9a, D13):
// het brondocument kent voor BJ2 → Profieljaar SBC geen aparte kern-deelgebieden-
// eis, alleen het totaalaantal ≥V. Zie berekenBj2GeneriekPad hieronder.

// Note: per-leerlijn minima voor BJ1 → Versneld SBC (lesgeven/organiseren/prof_handelen)
// are now sourced from utils/normen.ts via getNormenSync() (Phase 25 parametrisation).

// ---------------------------------------------------------------------------
// Schema-guard (2026-2027 curriculumwijziging)
//
// KERN_SBC, de per-leerlijn drempels hierboven en alle DEFAULT_NORMEN-getallen
// (sbl/sbc/bj1Positief/negatiefTotaal) zijn gekalibreerd op de OUDE
// 19-deelgebieden/3-leerlijnen-indeling uit ADR-06 en worden niet meer
// gebruikt om bj1/bj2-labels te bepalen (zie berekenBj1Uitkomst/
// berekenBj2GeneriekPad/berekenBj2RoosendaalSblKeuze, alle op VestigingNormen).
// SUPPORTED_LEERLIJNEN is bijgewerkt (M42 T10) naar de groepsnamen van het
// ECHTE, huidige schema (src/config/leerlijn.json — 12 deelgebieden, 2
// leerlijnen): 'lesgeven_en_organiseren' / 'professioneel_handelen'. Zodra
// een vestiging bekend is, geeft berekenPrognose nu dus een genuine,
// berekend label terug i.p.v. 'normen_onbekend' — de losstaande
// vestiging-null-guard in de bj1/bj2-takken hieronder (ADR-16) blijft wel
// bestaan en vangt nog steeds het "geen herleidbare vestiging"-geval af.
var SUPPORTED_LEERLIJNEN = ['lesgeven_en_organiseren', 'professioneel_handelen'];

function isNormenSchemaOndersteund(): boolean {
  const mapping = getLeerlijnenMappingSync();
  const actueleGroepen = new Set(
    DEELGEBIEDEN.map(dg => mapping[dg.id] || dg.group)
  );
  if (actueleGroepen.size !== SUPPORTED_LEERLIJNEN.length) return false;
  return SUPPORTED_LEERLIJNEN.every(ll => actueleGroepen.has(ll));
}

// ---------------------------------------------------------------------------
// Score helpers
// ---------------------------------------------------------------------------

export function isVoldoendeOfHoger(score: string | null): boolean {
  return score === 'voldoende' || score === 'goed' || score === 'excellent';
}

function isGoedOfHoger(score: string | null): boolean {
  return score === 'goed' || score === 'excellent';
}

// Statussen die, ongeacht score, als onvoldoende tellen in de prognose (T06).
// Exported zodat utils/datapuntTelling.ts (M42 T4/T5/T6b) dezelfde "afgerond"/
// "ingeleverd"-definitie hergebruikt in plaats van een nieuwe status-vocabulaire
// te verzinnen.
export const ONVOLDOENDE_INLEVER_STATUSSEN = new Set([
  'niet ingeleverd',
  'te laat ingeleverd en niet beoordeeld',
]);

function isOnvoldoende(score: string | null): boolean {
  // null (niet beoordeeld) telt NIET als onvoldoende
  return score === 'onvoldoende';
}

// ---------------------------------------------------------------------------
// Interne hulpfunctie: tellingen per leerlijn
// ---------------------------------------------------------------------------

function telLeerlijnen(scores: any, activeDeelgebiedenIds?: string[]): any {
  const deelgebieden = activeDeelgebiedenIds ? DEELGEBIEDEN.filter(dg => activeDeelgebiedenIds.includes(dg.id)) : DEELGEBIEDEN;
  // M42 T10-bevinding: dit was hardcoded op de OUDE 3-leerlijn-namen
  // ('lesgeven'/'organiseren'/'prof_handelen', ADR-06), los van
  // SUPPORTED_LEERLIJNEN hierboven. Zolang de schema-guard altijd 'false'
  // teruggaf voor het echte schema, kwam deze functie voor bj1/bj2 nooit aan
  // bod, dus bleef dit onopgemerkt. Nu de guard 'true' geeft, matchten deze
  // OUDE namen NOOIT de ECHTE groepsnamen ('lesgeven_en_organiseren'/
  // 'professioneel_handelen') — elke bucket zou altijd leeg (0 tellingen)
  // blijven, en daarmee zou totaalVoldoendeOfHoger/totaalOnvoldoende (gebruikt
  // door berekenStatus's "heeft deze leerling scores"-check) ALTIJD 0 zijn,
  // ongeacht de werkelijke scores — elke leerling zou dan permanent grijs/
  // "Onbekend" tonen i.p.v. een echte kleur. Vandaar: dezelfde bron van
  // waarheid als de schema-guard (SUPPORTED_LEERLIJNEN), niet een eigen kopie.
  var leerlijnen = SUPPORTED_LEERLIJNEN;
  var telling: Record<string, any> = {};
  const mapping = getLeerlijnenMappingSync();

  for (var i = 0; i < leerlijnen.length; i++) {
    var ll = leerlijnen[i];
    var dgs = deelgebieden.filter(function(dg: any) {
      var dgLeerlijn = mapping[dg.id] || dg.group;
      return dgLeerlijn === ll;
    });
    var res: any = {
      leerlijn: ll,
      totaal: dgs.length,
      voldoendeOfHoger: 0,
      goedOfHoger: 0,
      onvoldoende: 0,
      onbeoordeeld: 0,
    };
    for (var j = 0; j < dgs.length; j++) {
      var score: string | null = scores[dgs[j].label] !== undefined ? scores[dgs[j].label] : null;
      if (score === null) {
        res.onbeoordeeld++;
      } else if (isOnvoldoende(score)) {
        res.onvoldoende++;
      } else if (isVoldoendeOfHoger(score)) {
        res.voldoendeOfHoger++;
        if (isGoedOfHoger(score)) res.goedOfHoger++;
      }
    }
    telling[ll] = res;
  }
  return telling;
}

// ---------------------------------------------------------------------------
// telLeerlijnenPerFase(datapunten, fase, activeDeelgebiedenIds?) — M42 T6
//
// Zusje van telLeerlijnen() hierboven, maar met twee cruciale verschillen:
//  1. Bron is student.datapunten (met fase-tag uit T2), NIET
//     student.deelgebiedScores — dat laatste is een hele-jaar "laatste-
//     score-wint"-aggregaat zonder fase-informatie (D14, eng-review).
//  2. Groepeert DYNAMISCH naar de leerlijn/groep-namen die nu daadwerkelijk
//     actief zijn (via getLeerlijnenMappingSync(), net als
//     isNormenSchemaOndersteund() hierboven doet) i.p.v. de hardcoded
//     3-way split ['lesgeven', 'organiseren', 'prof_handelen'] die
//     telLeerlijnen() gebruikt voor het OUDE schema. Niet aanraken/hergebruiken
//     van telLeerlijnen() zelf — die blijft de oude-schema-engine, gated
//     achter isNormenSchemaOndersteund(); Lane C's T10 pensioneert 'm.
// ---------------------------------------------------------------------------

export interface LeerlijnTelling {
  leerlijn: string;
  totaal: number;
  voldoendeOfHoger: number;
  goedOfHoger: number;
  onvoldoende: number;
  onbeoordeeld: number;
}

export function telLeerlijnenPerFase(
  datapunten: Datapunt[],
  fase: number,
  activeDeelgebiedenIds?: string[],
): Record<string, LeerlijnTelling> {
  // Stap 1: filter op fase. Missende/onherkende fase (undefined of null, via
  // getFase()) telt mee voor ELKE fase-query (D4) — nooit dp.fase rechtstreeks
  // lezen, want pre-Lane-A-datapunten hebben geen fase-property (undefined,
  // geen null) en zouden anders stilzwijgend uitgesloten worden.
  const gefilterd = (datapunten || []).filter(dp => {
    const dpFase = getFase(dp);
    return dpFase === fase || dpFase === null;
  });

  // Stap 2: reconstrueer een per-deelgebied-label score-map uit de gefilterde
  // subset, met dezelfde "laatste non-null wint over document-volgorde"-regel
  // als parsers/pdf.ts's parseDeelgebiedTable gebruikt voor het hele-jaar-
  // aggregaat — hier geschaald naar alleen de fase-gefilterde datapunten via
  // de gedeelde aggregateLatestScores() (utils/scoreAggregation.ts, M42
  // Lane B review-fix #1).
  const scores = aggregateLatestScores(gefilterd, DEELGEBIEDEN);

  // Stap 3: pas activeDeelgebiedenIds toe, zoals telLeerlijnen() ook doet.
  const deelgebieden = activeDeelgebiedenIds
    ? DEELGEBIEDEN.filter(dg => activeDeelgebiedenIds.includes(dg.id))
    : DEELGEBIEDEN;

  // Stap 4: groepeer DYNAMISCH naar de daadwerkelijk actieve groep-namen
  // (geen hardcoded lijst) en tel exact zoals telLeerlijnen() intern doet.
  //
  // Groepnamen komen uit het VOLLEDIGE DEELGEBIEDEN (niet de al-gefilterde
  // `deelgebieden`): activeDeelgebiedenIds kan toevallig ELK deelgebied van
  // een groep uitsluiten, en die groep moet dan alsnog met totaal 0 in het
  // resultaat staan i.p.v. helemaal te ontbreken (M42 Lane B final-review
  // fix #5 — bug blootgelegd door de bijbehorende test, niet slechts een
  // ontbrekende test).
  const mapping = getLeerlijnenMappingSync();
  const groepen = Array.from(new Set(DEELGEBIEDEN.map(dg => mapping[dg.id] || dg.group)));

  const telling: Record<string, LeerlijnTelling> = {};
  for (const groep of groepen) {
    const dgs = deelgebieden.filter(dg => (mapping[dg.id] || dg.group) === groep);
    const res: LeerlijnTelling = {
      leerlijn: groep,
      totaal: dgs.length,
      voldoendeOfHoger: 0,
      goedOfHoger: 0,
      onvoldoende: 0,
      onbeoordeeld: 0,
    };
    for (const dg of dgs) {
      const score: string | null = scores[dg.label] !== undefined ? scores[dg.label] : null;
      if (score === null) {
        res.onbeoordeeld++;
      } else if (isOnvoldoende(score)) {
        res.onvoldoende++;
      } else if (isVoldoendeOfHoger(score)) {
        res.voldoendeOfHoger++;
        if (isGoedOfHoger(score)) res.goedOfHoger++;
      }
    }
    telling[groep] = res;
  }
  return telling;
}

// ---------------------------------------------------------------------------
// berekenBj1Uitkomst(student, vestiging, normen, activeDeelgebiedenIds?) — M42 T8
//
// Standalone, direct-testbare BJ1 3-uitkomsten-beslissing (naar_bj2 /
// versneld_sbc / negatief / neutraal), berekend tegen de NIEUWE, per-vestiging
// VestigingNormen (T7) i.p.v. de oude Normen/DEFAULT_NORMEN. Losgetrokken van
// berekenPrognose() zelf omdat diens bj1-tak nog achter isNormenSchemaOndersteund()
// zit (T10's nog-niet-gedane pensioentaak) — die guard geeft 'false' terug voor
// het ECHTE, huidige 2026/2027-schema, waardoor deze functie de enige plek is
// waar de nieuwe formule testbaar is tegen het schema dat daadwerkelijk actief
// is. Zie task-T8-brief.md ("Why this task is structured the way it is").
//
// Alle deelgebieden-tellingen zijn hetzelfde soort grootheid als de OUDE motor's
// totaalVoldoendeOfHoger/totaalOnvoldoende — d.w.z. berekend op
// student.deelgebiedScores (heel-jaar "laatste-score-wint"-aggregaat) —
// BEHALVE waar een criterium expliciet "in fase twee" zegt, wat
// telLeerlijnenPerFase(student.datapunten, 2, activeDeelgebiedenIds) gebruikt.
// Zie task-T8-brief.md voor de exacte, per-criterium fase-scoping-tabel
// (bewust NIET uniform — het brondocument scoopt sommige bullets wel naar
// fase 2 en andere niet, en dat onderscheid is intentioneel).
//
// NOTE (gedocumenteerde keuze, T8): de brief's illustratieve signature
// vermeldt geen activeDeelgebiedenIds-parameter, maar de eis-tekst zelf
// verwijst er meermaals naar ("filtered by activeDeelgebiedenIds if given").
// Opgelost door 'm als 4e, optionele parameter toe te voegen — consistent met
// hoe telLeerlijnen()/telLeerlijnenPerFase() 'm ook als laatste optionele
// parameter voeren. Zie task-T8-report.md voor de volledige toelichting.
// ---------------------------------------------------------------------------

export interface Bj1Uitkomst {
  label: 'naar_bj2' | 'versneld_sbc' | 'negatief' | 'neutraal';
  gaps: any; // UI-facing "hoe ver van de norm af"-data, zelfde doel als het bestaande gaps-object
}

function legeTelling(leerlijn: string): LeerlijnTelling {
  return { leerlijn, totaal: 0, voldoendeOfHoger: 0, goedOfHoger: 0, onvoldoende: 0, onbeoordeeld: 0 };
}

export function berekenBj1Uitkomst(
  student: any,
  vestiging: Vestiging | null,
  normen: VestigingNormen,
  activeDeelgebiedenIds?: string[],
): Bj1Uitkomst {
  const datapunten: Datapunt[] = student.datapunten ?? [];

  // ── Negatief — Trigger A: >= X deelgebieden onvoldoende ───────────────────
  // Heel-jaar-aggregaat (student.deelgebiedScores), GEEN fase-scoping — het
  // brondocument noemt bij deze bullet geen fase. Zelfde filter-patroon als
  // telLeerlijnen() hierboven (activeDeelgebiedenIds, indien gegeven).
  const deelgebiedenActief = activeDeelgebiedenIds
    ? DEELGEBIEDEN.filter(dg => activeDeelgebiedenIds.includes(dg.id))
    : DEELGEBIEDEN;
  const rawScores: Record<string, string | null> = student.deelgebiedScores || {};
  const aantalOnvoldoende = deelgebiedenActief.filter(dg => {
    const score: string | null = rawScores[dg.label] !== undefined ? rawScores[dg.label] : null;
    return isOnvoldoende(score);
  }).length;
  // Let op: >=, NIET > (brondocument: "4 of meer") — andere richting dan Trigger B.
  const negatiefTriggerA = aantalOnvoldoende >= normen.bj1NegatiefDeelgebiedenOnvoldoendeMin;

  // ── Negatief — Trigger B: > Y onbeoordeelde (niet-ingeleverd) datapunten,
  // TIJDENS FASE 2 ───────────────────────────────────────────────────────────
  // Brondocument noemt bij deze bullet wél expliciet fase 2. Hergebruikt
  // dezelfde ONVOLDOENDE_INLEVER_STATUSSEN-check als de (te vervangen)
  // top-of-function aantalOnbeoordeeld-berekening, aangevuld met de fase-2-
  // scoping via getFase() (D4: onherkende/afwezige fase telt mee voor elke
  // fase-query — vandaar `=== 2 || === null`, nooit dp.fase rechtstreeks).
  const aantalOnbeoordeeldFase2 = datapunten.filter(dp => {
    const status = ((dp.status as string) || '').toLowerCase().trim();
    if (!ONVOLDOENDE_INLEVER_STATUSSEN.has(status)) return false;
    const fase = getFase(dp);
    return fase === 2 || fase === null;
  }).length;
  // Let op: >, NIET >= (brondocument: "meer dan 4") — zelfde richting als de oude code.
  const negatiefTriggerB = aantalOnbeoordeeldFase2 > normen.bj1NegatiefOnbeoordeeldMax;

  // 3e brondocument-bullet ("onvoldoende ontwikkeling... bij ontwikkelafspraken")
  // is een menselijk/coach-kwalitatief oordeel zonder datamodel-veld — zelfde
  // categorie als de KD-1-december-deadline-uitsluiting (ADR-17 §5). Geen veld
  // of gate verzinnen hiervoor.
  const isNegatief = negatiefTriggerA || negatiefTriggerB;

  // ── versneld_sbc / naar_bj2 — beide gescoped op fase 2 (brondocument) ─────
  const telling = telLeerlijnenPerFase(datapunten, 2, activeDeelgebiedenIds);
  const lesOrg = telling['lesgeven_en_organiseren'] ?? legeTelling('lesgeven_en_organiseren');
  const profHandelen = telling['professioneel_handelen'] ?? legeTelling('professioneel_handelen');

  // Betekenisvol Bewegen / Rekenen: bewust NIET fase-gefilterd — het
  // brondocument scoopt deze bullets niet naar fase 2, en dat is consistent
  // met het bestaande D6/T4/T5/T6b-ontwerp (opereert op de huidige/laatste
  // datapunten van de leerling, ongeacht fase).
  const bvb = telBetekenisvolBewegenProfHouding(datapunten);
  const reken = telRekenDomeinen(student);
  const nederlandsNiveau = normalizeRekenScore(student.nederlandsResultaat ?? null);
  // D9: normalizeTriState(undefined) === normalizeTriState(null) === null →
  // sluit de versneld_sbc-eis hieronder veilig uit zonder te crashen of
  // stilzwijgend als 'false' te tellen.
  const wvo = normalizeTriState(student.wvoTraject);
  // ADR-17c: "minimaal N levels afgerond" is een COUNT over alle level-
  // nummers heen (niet één specifiek level, vandaar telLevelsAfgerond i.p.v.
  // alleLevelsBehaald). Voor Goes/Dordrecht is de norm 0 → altijd triviaal
  // voldaan, dus GEEN if/else per vestiging nodig (data-driven via normen).
  const levelsAfgerond = telLevelsAfgerond(datapunten);

  const isVersneldSbc = (
    lesOrg.goedOfHoger >= normen.bj1VersneldSbcLesgevenOrganiserenGoedMin &&
    profHandelen.goedOfHoger >= normen.bj1VersneldSbcProfHandelenGoedMin &&
    bvb.voldoet >= normen.bj1VersneldSbcProfHoudingBvbMin &&
    wvo === true &&
    nederlandsNiveau === 'goed' &&
    reken.domeinenAfgerond >= normen.bj1VersneldSbcRekenDomeinenMin &&
    reken.niveau === 'goed' &&
    levelsAfgerond >= normen.bj1VersneldSbcRoosendaalLevelsMin
  );

  const naarBj2DeelgebiedenVoldoende = lesOrg.voldoendeOfHoger + profHandelen.voldoendeOfHoger;
  const isNaarBj2 = (
    naarBj2DeelgebiedenVoldoende >= normen.bj1NaarBj2DeelgebiedenVoldoendeMin &&
    bvb.voldoet >= normen.bj1NaarBj2ProfHoudingBvbMin &&
    (nederlandsNiveau === 'voldoende' || nederlandsNiveau === 'goed') &&
    reken.domeinenAfgerond >= normen.bj1NaarBj2RekenDomeinenMin &&
    (reken.niveau === 'voldoende' || reken.niveau === 'goed') &&
    levelsAfgerond >= normen.bj1NaarBj2RoosendaalLevelsMin
  );

  let label: Bj1Uitkomst['label'];
  if (isNegatief) {
    label = 'negatief';
  } else if (isVersneldSbc) {
    // versneld_sbc VOOR naar_bj2 (zelfde if/else-if-volgorde als de oude code:
    // versneld is de "betere" uitkomst, die krijgt voorrang).
    label = 'versneld_sbc';
  } else if (isNaarBj2) {
    label = 'naar_bj2';
  } else {
    label = 'neutraal';
  }

  const gaps = {
    aantalOnvoldoendeDeelgebieden: aantalOnvoldoende,
    onvoldoendeDeelgebiedenRuimte: Math.max(0, normen.bj1NegatiefDeelgebiedenOnvoldoendeMin - 1 - aantalOnvoldoende),
    aantalOnbeoordeeldFase2,
    onbeoordeeldRuimte: normen.bj1NegatiefOnbeoordeeldMax - aantalOnbeoordeeldFase2,
    nodigNaarBj2Deelgebieden: Math.max(0, normen.bj1NaarBj2DeelgebiedenVoldoendeMin - naarBj2DeelgebiedenVoldoende),
    nodigNaarBj2ProfHoudingBvb: Math.max(0, normen.bj1NaarBj2ProfHoudingBvbMin - bvb.voldoet),
    nodigNaarBj2RekenDomeinen: Math.max(0, normen.bj1NaarBj2RekenDomeinenMin - reken.domeinenAfgerond),
    nodigVersneldSbc_lesgevenOrganiseren: Math.max(0, normen.bj1VersneldSbcLesgevenOrganiserenGoedMin - lesOrg.goedOfHoger),
    nodigVersneldSbc_profHandelen: Math.max(0, normen.bj1VersneldSbcProfHandelenGoedMin - profHandelen.goedOfHoger),
    nodigVersneldSbc_profHoudingBvb: Math.max(0, normen.bj1VersneldSbcProfHoudingBvbMin - bvb.voldoet),
    nodigVersneldSbc_rekenDomeinen: Math.max(0, normen.bj1VersneldSbcRekenDomeinenMin - reken.domeinenAfgerond),
    wvoTraject: wvo,
    nederlandsNiveau,
    rekenNiveau: reken.niveau,
    levelsAfgerond,
  };

  return { label, gaps };
}

// ---------------------------------------------------------------------------
// berekenBj2GeneriekPad(student, vestiging, normen, activeDeelgebiedenIds?) — M42 T9a
//
// Standalone, direct-testbare BJ2 generiek-pad-beslissing (sbl / sbc /
// bespreekgeval), berekend tegen VestigingNormen (T7) i.p.v. de oude
// Normen/DEFAULT_NORMEN. Zelfde structuur/reden als berekenBj1Uitkomst (T8):
// losgetrokken van berekenPrognose() zelf omdat diens bj2-tak nog achter
// isNormenSchemaOndersteund() zit — die guard geeft 'false' terug voor het
// ECHTE, huidige 2026/2027-schema totdat T10 die pensioneert.
//
// D13: geen kern-deelgebieden-eis meer (KERN_SBC is verwijderd) — alleen het
// totaalaantal ≥V telt.
// D17 (ADR-17d, projectlead-beslissing): het brondocument heeft voor BJ2 GEEN
// eigen negatief-kolom (anders dan BJ1) — dit pad retourneert nooit 'negatief',
// en de fallback-uitkomst is het NIEUWE, eigen label 'bespreekgeval' (niet
// BJ1's 'neutraal' hergebruikt).
//
// Alle tellingen zijn heel-jaar-aggregaat (student.deelgebiedScores) — pagina 4
// van het brondocument noemt bij GEEN van deze bullets "fase twee" (anders dan
// BJ1's pagina-3-tabel), dus geen fase-scoping hier.
//
// Belangrijk (T9c, "Why the name matters" in task-T9a-brief.md): deze functie
// is DE universele generieke pad — ook voor Roosendaal-leerlingen die op de
// SBC-tak zitten (Roosendaal's addendum zit al in de meegegeven VestigingNormen
// via getNormenVoorVestigingSync('roosendaal')). Alleen Roosendaal-leerlingen
// die het 'sbl'-keuzetraject kozen slaan deze functie helemaal over — dat is
// T9c's eigen, kleinere criteria-set, niet deze functie.
// ---------------------------------------------------------------------------

// M42 review-fix (maintainability): this exact 4-line KD-status resolution was
// duplicated verbatim in berekenBj2GeneriekPad and berekenBj2RoosendaalSblKeuze
// (and mirrors the same idiom already used in src/utils/status.ts and
// DoortstroomPrognoseSection.tsx). "Minimaal één KD behaald of haalbaar" —
// an explicit 'niet_behaald' OR a missing/null status both fail this; a
// missing status is never assumed positive (brondocument-eis).
function resolveKdStatus(student: any): string | null {
  const keuzedelen = Array.isArray(student.keuzedelen) ? student.keuzedelen : [];
  return keuzedelen.length > 0
    ? aggregateKdStatus(keuzedelen)
    : (student.kdStatus ?? null);
}

export interface Bj2Uitkomst {
  label: 'sbl' | 'sbc' | 'bespreekgeval';
  gaps: any;
}

export function berekenBj2GeneriekPad(
  student: any,
  vestiging: Vestiging | null,
  normen: VestigingNormen,
  activeDeelgebiedenIds?: string[],
): Bj2Uitkomst {
  const datapunten: Datapunt[] = student.datapunten ?? [];

  // ── Deelgebieden ≥V — heel-jaar-aggregaat, zelfde filter-patroon als elders ──
  const deelgebiedenActief = activeDeelgebiedenIds
    ? DEELGEBIEDEN.filter(dg => activeDeelgebiedenIds.includes(dg.id))
    : DEELGEBIEDEN;
  const rawScores: Record<string, string | null> = student.deelgebiedScores || {};
  const aantalVoldoendeOfHoger = deelgebiedenActief.filter(dg => {
    const score: string | null = rawScores[dg.label] !== undefined ? rawScores[dg.label] : null;
    return isVoldoendeOfHoger(score);
  }).length;

  // ── KD: "minimaal één KD behaald of haalbaar voor 1 december" ──────────────
  const kdStatus = resolveKdStatus(student);
  const kdVoldoet = kdStatus === 'behaald' || kdStatus === 'haalbaar';

  // ── Rekenen (gedeeld tussen SBC/SBL, alleen het niveau-criterium verschilt) ──
  const reken = telRekenDomeinen(student);

  // ── WVO-traject — SBC-only (SBL toetst dit veld niet, per de tabel) ────────
  const wvo = normalizeTriState(student.wvoTraject);

  // ── Nederlands — SBC toetst schrijven/gesprekvoeren los, SBL één totaalveld ─
  const nlSchrijvenNiveau = normalizeRekenScore(student.nlSchrijven ?? null);
  const nlGesprekvoerenNiveau = normalizeRekenScore(student.nlGesprekvoeren ?? null);
  const nederlandsNiveau = normalizeRekenScore(student.nederlandsResultaat ?? null);

  // ── Roosendaal-only "alle levels N behaald" — KRITIEK (ADR-17e) ────────────
  // alleLevelsBehaald is ALL-OR-NOTHING: alleLevelsBehaald(dp, 0) zoekt naar
  // niet-bestaande "Level 0"-datapunten en geeft dan ALTIJD false terug. Voor
  // Goes/Dordrecht (drempel 0) moet deze check dus volledig worden OVERGESLAGEN
  // (triviaal voldaan), NOOIT alleLevelsBehaald(dp, 0) aanroepen — dat zou stil
  // elke Goes/Dordrecht-leerling uitsluiten van sbc/sbl. Vandaar de expliciete
  // `!== 0`-guard hieronder — niet vereenvoudigen tot een onvoorwaardelijke
  // aanroep.
  const sbcRoosendaalLevelsOk = normen.bj2SbcRoosendaalLevelsMin === 0
    ? true
    : alleLevelsBehaald(datapunten, normen.bj2SbcRoosendaalLevelsMin);
  const sblRoosendaalLevelsOk = normen.bj2SblRoosendaalLevelsMin === 0
    ? true
    : alleLevelsBehaald(datapunten, normen.bj2SblRoosendaalLevelsMin);

  // ── SBC (gecheckt EERST — zelfde precedentie als de oude code: "betere"
  // uitkomst krijgt voorrang) ─────────────────────────────────────────────────
  const isSbc = (
    aantalVoldoendeOfHoger >= normen.bj2SbcDeelgebiedenVoldoendeMin &&
    (nlSchrijvenNiveau === 'voldoende' || nlSchrijvenNiveau === 'goed') &&
    nlGesprekvoerenNiveau === 'goed' &&
    reken.domeinenAfgerond >= normen.bj2SbcRekenDomeinenMin &&
    reken.niveau === 'goed' &&
    kdVoldoet &&
    wvo === true &&
    sbcRoosendaalLevelsOk
  );

  // ── SBL (gecheckt na SBC) ───────────────────────────────────────────────────
  const isSbl = (
    aantalVoldoendeOfHoger >= normen.bj2SblDeelgebiedenVoldoendeMin &&
    (nederlandsNiveau === 'voldoende' || nederlandsNiveau === 'goed') &&
    reken.domeinenAfgerond >= normen.bj2SblRekenDomeinenMin &&
    (reken.niveau === 'voldoende' || reken.niveau === 'goed') &&
    kdVoldoet &&
    sblRoosendaalLevelsOk
  );

  let label: Bj2Uitkomst['label'];
  if (isSbc) {
    label = 'sbc';
  } else if (isSbl) {
    label = 'sbl';
  } else {
    // Fallback (D17/ADR-17d): GEEN negatief-tier voor BJ2 — nieuw, eigen label.
    label = 'bespreekgeval';
  }

  const gaps = {
    aantalVoldoendeOfHoger,
    nodigSBC_deelgebieden: Math.max(0, normen.bj2SbcDeelgebiedenVoldoendeMin - aantalVoldoendeOfHoger),
    nodigSBL_deelgebieden: Math.max(0, normen.bj2SblDeelgebiedenVoldoendeMin - aantalVoldoendeOfHoger),
    nodigSBC_rekenDomeinen: Math.max(0, normen.bj2SbcRekenDomeinenMin - reken.domeinenAfgerond),
    nodigSBL_rekenDomeinen: Math.max(0, normen.bj2SblRekenDomeinenMin - reken.domeinenAfgerond),
    nlSchrijvenNiveau,
    nlGesprekvoerenNiveau,
    nederlandsNiveau,
    rekenNiveau: reken.niveau,
    kdStatus,
    wvoTraject: wvo,
    // M42 T12-review-fix: sbcRoosendaalLevelsOk/sblRoosendaalLevelsOk waren al
    // berekend en gebruikt in isSbc/isSbl hierboven, maar stonden niet op het
    // geretourneerde gaps-object — de UI (T12) kon de Roosendaal-levels-eis
    // daardoor niet tonen (in tegenstelling tot BJ1's gaps.levelsAfgerond).
    sbcRoosendaalLevelsOk,
    sblRoosendaalLevelsOk,
  };

  return { label, gaps };
}

// ---------------------------------------------------------------------------
// berekenBj2RoosendaalSblKeuze(student, normen, activeDeelgebiedenIds?) — M42 T9c
//
// Roosendaal-exclusief, KLEINER criteria-pad (brondocument p.6, "Doorstroom
// naar traject Examinering SBL") voor leerlingen die in Roosendaal's
// optionele mid-year keuzeproces expliciet 'sbl' kozen (T3b's
// roosendaalTraject-veld, via normalizeRoosendaalTraject).
//
// ADR-17e (routing-correctie, belangrijk): dit is GEEN volledig parallel
// BJ2-pad dat berekenBj2GeneriekPad vervangt. Het brondocument zegt: kiest de
// leerling 'sbc', dan is Tabel A (berekenBj2GeneriekPad) van kracht; is er
// geen keuze gemaakt, dan geldt ook gewoon Tabel A. Alleen de 'sbl'-keuze
// heeft deze eigen, kleinere eisenset. Zie de routing-tak in berekenPrognose
// hieronder voor waar dat onderscheid wordt gemaakt.
//
// Deze functie wordt ALTIJD met Roosendaal's eigen VestigingNormen
// aangeroepen (de caller checkt vestiging === 'roosendaal' al vóór de
// aanroep) — geen vestiging-parameter nodig, anders dan berekenBj2GeneriekPad.
//
// Fase-3-scoping (p.6 noemt expliciet "fase drie" — anders dan T9a's
// generieke pad, dat heel-jaar-aggregaat is, en anders dan T8's BJ1-tabel,
// die fase 2 gebruikt): hergebruikt telLeerlijnenPerFase (M42 T6, al gebruikt
// door berekenBj1Uitkomst voor fase 2) en telt voldoendeOfHoger op over ALLE
// teruggegeven groepen (Object.values(telling), niet twee hardcoded
// groepsnamen zoals berekenBj1Uitkomst doet) — zo blijft de telling correct
// ongeacht hoeveel leerlijn-groepen het actieve schema kent op het moment van
// aanroepen (2 nu, 3 onder het oude/gemockte schema in tests/prognosis.test.ts
// — die tweede vorm is precies waarom de routing-tests in dát bestand staan,
// zie de describe-blok daar).
//
// D17/ADR-17d: geen negatief-tier — de fallback is hetzelfde 'bespreekgeval'-
// label als berekenBj2GeneriekPad's eigen fallback.
// ---------------------------------------------------------------------------

export interface Bj2RoosendaalSblKeuzeUitkomst {
  label: 'sbl' | 'bespreekgeval';
  gaps: any;
}

export function berekenBj2RoosendaalSblKeuze(
  student: any,
  normen: VestigingNormen,
  activeDeelgebiedenIds?: string[],
): Bj2RoosendaalSblKeuzeUitkomst {
  const datapunten: Datapunt[] = student.datapunten ?? [];

  // ── Deelgebieden ≥V, FASE 3 (p.6 — anders dan T9a's heel-jaar-aggregaat) ───
  const telling = telLeerlijnenPerFase(datapunten, 3, activeDeelgebiedenIds);
  const fase3DeelgebiedenVoldoende = Object.values(telling).reduce(
    (som, t) => som + t.voldoendeOfHoger,
    0,
  );

  // ── Nederlands — één totaalveld, zelfde "voldoende-of-goed" idioom als
  // T9a's generieke SBL-check ────────────────────────────────────────────────
  const nederlandsNiveau = normalizeRekenScore(student.nederlandsResultaat ?? null);

  // ── Rekenen — heel-jaar (het brondocument scoopt deze bullet niet naar
  // fase 3, zelfde als T9a's generieke pad) ─────────────────────────────────
  const reken = telRekenDomeinen(student);

  // ── KD: "behaald of haalbaar voor 1 december" — zelfde idioom als T9a ──────
  const kdStatus = resolveKdStatus(student);
  const kdVoldoet = kdStatus === 'behaald' || kdStatus === 'haalbaar';

  // ── "Alle levels 2 behaald" — deze functie is Roosendaal-exclusief (nooit
  // aangeroepen voor Goes/Dordrecht), dus het ADR-17e 0-sentinel-scenario doet
  // zich hier in de praktijk niet voor. Dezelfde defensieve guard wordt hier
  // toch geschreven, voor consistentie met berekenBj2GeneriekPad's Roosendaal-
  // levels-checks en toekomstbestendigheid (goedkoop, onschadelijk).
  const levelsOk = normen.bj2RoosendaalSblKeuzeLevelsMin === 0
    ? true
    : alleLevelsBehaald(datapunten, normen.bj2RoosendaalSblKeuzeLevelsMin);

  const isSbl = (
    fase3DeelgebiedenVoldoende >= normen.bj2RoosendaalSblKeuzeDeelgebiedenVoldoendeMin &&
    (nederlandsNiveau === 'voldoende' || nederlandsNiveau === 'goed') &&
    reken.domeinenAfgerond >= normen.bj2RoosendaalSblKeuzeRekenDomeinenMin &&
    (reken.niveau === 'voldoende' || reken.niveau === 'goed') &&
    kdVoldoet &&
    levelsOk
  );

  const label: Bj2RoosendaalSblKeuzeUitkomst['label'] = isSbl ? 'sbl' : 'bespreekgeval';

  const gaps = {
    fase3DeelgebiedenVoldoende,
    nodigDeelgebiedenFase3: Math.max(0, normen.bj2RoosendaalSblKeuzeDeelgebiedenVoldoendeMin - fase3DeelgebiedenVoldoende),
    nodigRekenDomeinen: Math.max(0, normen.bj2RoosendaalSblKeuzeRekenDomeinenMin - reken.domeinenAfgerond),
    nederlandsNiveau,
    rekenNiveau: reken.niveau,
    kdStatus,
    // M42 T12-review-fix: levelsOk was al berekend en gebruikt in isSbl
    // hierboven, maar stond niet op het geretourneerde gaps-object.
    levelsOk,
  };

  return { label, gaps };
}

// ---------------------------------------------------------------------------
// berekenPrognose(student, traject)
//
// @param student   - StudentRecord (student.deelgebiedScores)
// @param traject   - 'bj1' | 'bj2' (standaard: 'bj2')
//
// @returns PrognosisResult
//   label      {string}  - Prognose-label (zie onder per traject)
//   isNegatief {boolean} - BNSA-trigger actief
//   totaalVoldoendeOfHoger {number}
//   totaalOnvoldoende      {number}
//   leerlijnen {LeerlijntTelling[]}
//   gaps       {GapAnalysis}
//   traject    {string}  - Gebruikte trajectcode
//
// Labels per traject:
//   bj1: 'negatief' | 'versneld_sbc' | 'naar_bj2' | 'neutraal'
//   bj2: 'sbc' | 'sbl' | 'bespreekgeval' (M42 T9a, D17: geen negatief-tier meer)
// ---------------------------------------------------------------------------
// vestiging (5th param, M42 T7b): selects the VestigingNormen profiel used by
// the bj1/bj2 branches below (via getNormenVoorVestigingSync) — null/undefined
// falls back to 'normen_onbekend' (ADR-16's safe-fallback philosophy).
export function berekenPrognose(student: any, traject?: string, activeDeelgebiedenIds?: string[], normen?: Normen, vestiging?: Vestiging | null): any {
  traject = traject || 'bj2';

  if (!isNormenSchemaOndersteund()) {
    return {
      label: 'normen_onbekend',
      isNegatief: false,
      totaalVoldoendeOfHoger: 0,
      totaalOnvoldoende: 0,
      leerlijnen: [],
      gaps: {},
      traject: traject,
    };
  }

  const n = normen ?? getNormenSync();
  var rawScores = student.deelgebiedScores || {};

  // T06: datapunten with 'niet ingeleverd' / 'te laat ingeleverd en niet beoordeeld' status
  // contribute onvoldoende for each deelgebied where no explicit score is present yet.
  var scores: Record<string, string | null> = { ...rawScores };
  for (var dp of (student.datapunten || [])) {
    var dpStatus = ((dp.status as string) || '').toLowerCase().trim();
    if (!ONVOLDOENDE_INLEVER_STATUSSEN.has(dpStatus)) continue;
    for (var [dgLabel, dpScore] of Object.entries(dp.scores || {})) {
      if (scores[dgLabel] === undefined || scores[dgLabel] === null) {
        scores[dgLabel] = 'onvoldoende';
      }
    }
  }

  // M42 T10: zelfde bron van waarheid als telLeerlijnen()'s eigen fix hierboven
  // — dit was een tweede, losse kopie van dezelfde (inmiddels achterhaalde)
  // OUDE 3-leerlijn-namenlijst.
  var leerlijnen = SUPPORTED_LEERLIJNEN;

  var telling = telLeerlijnen(scores, activeDeelgebiedenIds);

  // Totalen
  var totaalVoldoendeOfHoger = leerlijnen.reduce(function(s: number, ll: string) {
    return s + telling[ll].voldoendeOfHoger;
  }, 0);
  var totaalOnvoldoende = leerlijnen.reduce(function(s: number, ll: string) {
    return s + telling[ll].onvoldoende;
  }, 0);

  // BJ1-only: tel datapunten met een expliciete niet-ingeleverd status.
  // Datapunten zonder status (nog niet uitgevoerd / toekomstig) tellen niet mee.
  var aantalOnbeoordeeld = (student.datapunten || []).filter(function(dp: any) {
    var dpStatus = ((dp.status as string) || '').toLowerCase().trim();
    return ONVOLDOENDE_INLEVER_STATUSSEN.has(dpStatus);
  }).length;

  // NEGATIEF-trigger — basis geldt voor alle trajecten; BJ1 heeft extra onbeoordeeld-check
  var isNegatief = (
    totaalOnvoldoende > n.negatiefTotaal ||
    leerlijnen.some(function(ll: string) { return telling[ll].onvoldoende > n.negatiefPerLeerlijn; }) ||
    (traject === 'bj1' && aantalOnbeoordeeld > n.negatiefOnbeoordeeldBJ1)
  );

  var label: string;
  var gaps: any;

  // ── BJ1 → BJ2, Versneld SBC of Negatief (M42 T8 — nieuw 3-uitkomsten-model) ──
  // isNegatief/totaalVoldoendeOfHoger/totaalOnvoldoende hierboven (OUDE
  // telLeerlijnen-gebaseerde tellingen) worden NIET meer gebruikt om het BJ1-
  // label te bepalen — berekenBj1Uitkomst() berekent zijn eigen negatief-check
  // met de nieuwe criteria (zie die functie). Ze blijven wel op het
  // geretourneerde object staan (hieronder), want src/utils/status.ts's
  // berekenStatus leest totaalVoldoendeOfHoger + totaalOnvoldoende > 0 als
  // algemeen "heeft deze leerling al scores"-signaal, onafhankelijk van welke
  // BJ1-formule het label bepaalt.
  if (traject === 'bj1') {
    if (!vestiging) {
      // Zelfde "veilig terugvallen op onbekend" filosofie als isNormenSchemaOndersteund()
      // hierboven (ADR-16): een BJ1-leerling in een klas zonder herleidbare vestiging
      // krijgt normen_onbekend, nooit een stilzwijgend foutief label.
      label = 'normen_onbekend';
      gaps = {};
    } else {
      const vn = getNormenVoorVestigingSync(vestiging);
      const uitkomst = berekenBj1Uitkomst(student, vestiging, vn, activeDeelgebiedenIds);
      label = uitkomst.label;
      gaps = uitkomst.gaps;
    }

  // ── BJ2 → SBL of Profieljaar SBC (M42 T9a — generiek pad, VestigingNormen) ──
  // isNegatief/totaalVoldoendeOfHoger/totaalOnvoldoende hierboven (OUDE
  // telLeerlijnen-gebaseerde tellingen) worden NIET meer gebruikt om het BJ2-
  // label te bepalen — berekenBj2GeneriekPad() berekent zijn eigen criteria
  // (zie die functie). D17: BJ2 heeft geen negatief-tier meer, dus isNegatief
  // bepaalt hier nooit het label. Ze blijven wel op het geretourneerde object
  // staan (hieronder) — zelfde reden als bij BJ1 (T8): berekenStatus leest
  // totaalVoldoendeOfHoger + totaalOnvoldoende > 0 als algemeen "heeft deze
  // leerling al scores"-signaal, onafhankelijk van welke BJ2-formule het label
  // bepaalt.
  } else {
    if (!vestiging) {
      // Zelfde "veilig terugvallen op onbekend" filosofie als de bj1-tak
      // hierboven (ADR-16): een BJ2-leerling in een klas zonder herleidbare
      // vestiging krijgt normen_onbekend, nooit een stilzwijgend foutief label.
      label = 'normen_onbekend';
      gaps = {};
    } else {
      const vn = getNormenVoorVestigingSync(vestiging);
      // M42 T9c (ADR-17e): alleen Roosendaal-leerlingen die EXPLICIET 'sbl'
      // kozen in het optionele mid-year keuzeproces (T3b's roosendaalTraject-
      // veld) gebruiken de eigen, kleinere SBL-keuze-eisenset. 'sbc'-keuze en
      // "geen keuze gemaakt" (normalizeRoosendaalTraject(undefined/null) →
      // null, D9-stijl null-safety) vallen allebei door naar de else-tak
      // hieronder — precies de bestaande berekenBj2GeneriekPad-aanroep,
      // ONGEWIJZIGD — want het brondocument zegt voor die twee gevallen
      // letterlijk "Tabel A is van kracht".
      if (vestiging === 'roosendaal' && normalizeRoosendaalTraject(student.roosendaalTraject) === 'sbl') {
        const uitkomst = berekenBj2RoosendaalSblKeuze(student, vn, activeDeelgebiedenIds);
        label = uitkomst.label;
        gaps = uitkomst.gaps;
      } else {
        const uitkomst = berekenBj2GeneriekPad(student, vestiging, vn, activeDeelgebiedenIds);
        label = uitkomst.label;
        gaps = uitkomst.gaps;
      }
    }
  }

  return {
    label: label,
    isNegatief: isNegatief,
    totaalVoldoendeOfHoger: totaalVoldoendeOfHoger,
    totaalOnvoldoende: totaalOnvoldoende,
    leerlijnen: leerlijnen.map(function(ll: string) { return telling[ll]; }),
    gaps: gaps,
    traject: traject,
  };
}

// ---------------------------------------------------------------------------
// berekenAllePrognoses([traject])
// Berekent prognose voor alle leerlingen in appState.students.
// Schrijft student.prognose op elk object (voor Phase 4 klasoverzicht).
// ---------------------------------------------------------------------------
export function berekenAllePrognoses(traject?: string): any[] {
  var students = appState.students;
  var results: any[] = [];
  for (var i = 0; i < students.length; i++) {
    var prognose = berekenPrognose(students[i], traject);
    students[i].prognose = prognose;
    results.push({ naam: students[i].naam, label: prognose.label });
  }
  return results;
}

// ---------------------------------------------------------------------------
// debugPrognose(nameOrId, [traject])
// Volledige prognose-breakdown per leerling in de browser console.
// Gebruik: debugPrognose('Bosker')
//          debugPrognose('Bosker', 'bj1')
// ---------------------------------------------------------------------------
export function debugPrognose(query: string, traject?: string): void {
  var student = appState.students.find(function(s: any) {
    return s.naam.toLowerCase().includes(query.toLowerCase()) || s.leerlingId === query;
  });
  if (!student) {
    console.warn('debugPrognose: geen leerling gevonden');
    return;
  }

  var p = berekenPrognose(student, traject);
  var isBJ1 = p.traject === 'bj1';

  console.group('Prognose: ' + student.leerlingId + ' [traject: ' + p.traject + '] → ' + p.label.toUpperCase());

  console.group('Samenvatting');
  console.log('Totaal ≥V: ' + p.totaalVoldoendeOfHoger + '/19  |  Totaal O: ' + p.totaalOnvoldoende);

  if (isBJ1) {
    // M42 review-fix: dit blok las nog p.gaps.nodigBJ2/nodigVersneld_lesgeven/
    // n.versneldLesgeven etc. — velden die niet meer bestaan sinds
    // berekenBj1Uitkomst (M42 T8) de BJ1-tak herschreef. Niet-crashend maar wel
    // stil fout: nodigBJ2 was altijd undefined, telling_val('lesgeven',...)
    // vond nooit een match (echte leerlijn-namen zijn nu
    // 'lesgeven_en_organiseren'/'professioneel_handelen') en gaf dus altijd 0
    // terug — elke Versneld-SBC-teller toonde dus altijd "0/norm ❌", ongeacht
    // de werkelijke score. Print nu de echte Bj1Uitkomst-gaps-velden direct,
    // zelfde "niet-crashend, wel correct"-precedent als de bj2-tak hieronder.
    console.log('Naar BJ2 (nog nodig): ' + p.gaps.nodigNaarBj2Deelgebieden + ' deelgebieden, ' + p.gaps.nodigNaarBj2ProfHoudingBvb + ' BVB, ' + p.gaps.nodigNaarBj2RekenDomeinen + ' rekendomeinen');
    console.log('Versneld SBC (nog nodig): ' + p.gaps.nodigVersneldSbc_lesgevenOrganiseren + ' lesgeven/organiseren ≥G, ' + p.gaps.nodigVersneldSbc_profHandelen + ' prof.handelen ≥G, ' + p.gaps.nodigVersneldSbc_profHoudingBvb + ' BVB ≥G, ' + p.gaps.nodigVersneldSbc_rekenDomeinen + ' rekendomeinen');
    console.log('WVO-traject: ' + p.gaps.wvoTraject + ' | Nederlands: ' + p.gaps.nederlandsNiveau + ' | Rekenen: ' + p.gaps.rekenNiveau + ' | Levels afgerond: ' + p.gaps.levelsAfgerond);
  } else {
    // M42 T9a: berekenBj2GeneriekPad's gaps-object heeft geen n.sbl/n.sbc/
    // nodigSBC_kern meer (KERN_SBC is verwijderd, D13) — dit console-debug-
    // blok print p.gaps.label rechtstreeks i.p.v. de oude (afgeschafte)
    // deelgebieden-telling-vergelijking. (M42 review-fix: het BJ1-blok
    // hierboven is inmiddels ook bijgewerkt — beide takken zijn nu correct.)
    console.log('Label: ' + p.label + ' (aantal ≥V: ' + p.gaps.aantalVoldoendeOfHoger + ', nog nodig voor SBC: ' + p.gaps.nodigSBC_deelgebieden + ', voor SBL: ' + p.gaps.nodigSBL_deelgebieden + ')');
  }

  // M42 review-fix: p.gaps.onvoldoendeRuimte bestaat niet meer op GEEN van de
  // 3 nieuwe gaps-vormen (was altijd undefined, dus 'ruimte >= 0' viel altijd
  // op false en toonde stil een vals-alarm "NaN O te veel ⚠️", ongeacht de
  // werkelijke telling). D17: BJ2 heeft sowieso geen "ruimte"-concept meer
  // (geen negatief-tier) — alleen BJ1's Bj1Uitkomst.gaps heeft het equivalent
  // (onvoldoendeDeelgebiedenRuimte), dus alleen daar tonen.
  if (isBJ1) {
    var ruimte = p.gaps.onvoldoendeDeelgebiedenRuimte;
    console.log('Negatief-ruimte (deelgebieden ≤O): ' + ruimte + ' nog toegestaan boven de huidige telling');
  }
  console.groupEnd();

  console.group('Per leerlijn');
  console.table(p.leerlijnen.map(function(ll: any) {
    var row: any = {
      Leerlijn: ll.leerlijn,
      Totaal: ll.totaal,
      '≥V': ll.voldoendeOfHoger,
      'O': ll.onvoldoende + (ll.onvoldoende > 2 ? ' ⚠️' : ''),
      '?': ll.onbeoordeeld,
    };
    if (isBJ1) row['≥G'] = ll.goedOfHoger;
    return row;
  }));
  console.groupEnd();

  console.groupEnd();
}

console.log('[prognosis.ts] Doorstroomnorm engine geladen (BJ1 + BJ2)');

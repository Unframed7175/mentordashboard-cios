// tests/prognosis.normen.test.ts — RED integration tests for berekenPrognose normen parameter
// Phase 25 Plan 01 — Wave 0: All 7 tests RED until Plan 02 ships utils/normen.ts AND refactors
// berekenPrognose to accept an optional 4th normen parameter.
//
// CRITICAL: This is a NEW file — NOT a modification to tests/prognosis.test.ts.
// Adding a top-level import of '../utils/normen' to the existing green test file would break
// all tests in that file before normen.ts exists. This file is self-contained.
//
// RED state reason:
// 1. utils/normen.ts does not exist → import fails at module-load time, all 7 tests fail.
// 2. After Plan 02 creates normen.ts, berekenPrognose still won't accept a 4th parameter →
//    tests A–F fail because labels/gaps use hardcoded constants.
// 3. After Plan 02 refactors berekenPrognose, all 7 tests turn GREEN.

import { describe, it, expect, vi } from 'vitest';

// Rekenlogica-tests tegen het 19-deelgebieden/3-leerlijnen-schema waarop KERN_SBC en
// DEFAULT_NORMEN zijn gekalibreerd (ADR-06) — zie tests/prognosis.test.ts voor de
// volledige toelichting waarom dit gemockt wordt i.p.v. het live 2026/2027-schema.
vi.mock('../src/config/leerlijn.json', () => ({
  default: {
    deelgebieden: [
      { id: 'va',   label: 'V&A',  group: 'lesgeven' },
      { id: 'mm',   label: 'M&M',  group: 'lesgeven' },
      { id: 'ins',  label: 'INS',  group: 'lesgeven' },
      { id: 'odw',  label: 'O&DW', group: 'lesgeven' },
      { id: 'cb',   label: 'C&B',  group: 'lesgeven' },
      { id: 'eb1',  label: '1E&B', group: 'lesgeven' },
      { id: 'po',   label: 'P&O',  group: 'organiseren' },
      { id: 'so',   label: 'S&O',  group: 'organiseren' },
      { id: 'org',  label: 'ORG',  group: 'organiseren' },
      { id: 'ib',   label: 'I&B',  group: 'organiseren' },
      { id: 'eb2',  label: '2E&B', group: 'organiseren' },
      { id: 'prco', label: 'PrCo', group: 'prof_handelen' },
      { id: 'vsk',  label: 'VSK',  group: 'prof_handelen' },
      { id: 'lob',  label: 'LOB',  group: 'prof_handelen' },
      { id: 'info', label: 'INFO', group: 'prof_handelen' },
      { id: 'desk', label: 'DESK', group: 'prof_handelen' },
      { id: 'bs',   label: 'BS',   group: 'prof_handelen' },
      { id: 'tow',  label: 'TOW',  group: 'prof_handelen' },
      { id: 'bh',   label: 'BH',   group: 'prof_handelen' },
    ],
  },
}));

import { berekenPrognose } from '../utils/prognosis';
import { DEFAULT_NORMEN, type Normen } from '../utils/normen';

// ---------------------------------------------------------------------------
// Deelgebied layout (from utils/schema.ts DEELGEBIEDEN):
//   lesgeven (6):      V&A, M&M, INS, O&DW, C&B, 1E&B
//   organiseren (5):   P&O, S&O, ORG, I&B, 2E&B
//   prof_handelen (8): PrCo, VSK, LOB, INFO, DESK, BS, TOW, BH
// KERN_SBC = ['V&A', 'P&O', 'C&B', '1E&B'] (from utils/prognosis.ts)
// ---------------------------------------------------------------------------

function makeStudent(scores: Record<string, string | null>): any {
  return {
    leerlingId: 'L-normen-test',
    naam: 'Normen Test Leerling',
    deelgebiedScores: scores,
    datapunten: [],
  };
}

describe('berekenPrognose normen parameter', () => {

  // ── Test A/B removed (M42 T9a) ─────────────────────────────────────────────
  // Test A ("custom sbl=10") and Test B ("custom sbc=10, incl all KERN_SBC")
  // both drove berekenPrognose(student, 'bj2', undefined, customNormen) with
  // the OLD Normen type's sbl/sbc fields and the (now-deleted, D13) KERN_SBC
  // kern-deelgebieden check, and called WITHOUT vestiging. Two independent
  // reasons make these impossible to port in place:
  //   1. berekenBj2GeneriekPad (T9a) reads VestigingNormen's
  //      bj2SblDeelgebiedenVoldoendeMin/bj2SbcDeelgebiedenVoldoendeMin, not the
  //      old Normen.sbl/Normen.sbc these tests override — those fields are
  //      simply not read anymore for bj2. KERN_SBC itself no longer exists
  //      (D13: no kern-deelgebieden eis for bj2 at all).
  //   2. The new vestiging-null-guard on the bj2 branch (same pattern as T8's
  //      bj1 guard) makes berekenPrognose(student, 'bj2', ...) WITHOUT
  //      vestiging always return 'normen_onbekend' now, regardless of scores
  //      or the (irrelevant) old Normen override — porting these in place
  //      would just assert 'normen_onbekend', which tests nothing.
  // Equivalent coverage ("custom VestigingNormen threshold changes the
  // sbc/sbl outcome", boundary tests at the real bj2SbcDeelgebiedenVoldoendeMin
  // (10) / bj2SblDeelgebiedenVoldoendeMin (7) thresholds) now lives in
  // tests/prognosis.bj2GeneriekPad.test.ts, against the real schema with a
  // real vestiging and VestigingNormen.

  // ── Test C: negatiefTotaal custom threshold (NORM-03) ────────────────────
  // 7 onvoldoende spread as lesgeven=2, organiseren=2, prof_handelen=3.
  // Default negatiefTotaal=6: 7>6 → isNegatief=true.
  // Custom negatiefTotaal=10 + negatiefPerLeerlijn=5: 7>10? No; 3>5? No → isNegatief=false.
  // (negatiefPerLeerlijn must also be raised because 3 onvoldoende in prof_handelen would
  //  trigger the per-leerlijn check at the default threshold of 2.)
  // onvoldoendeRuimte = negatiefTotaal - totaalOnvoldoende = 10 - 7 = 3.
  it('Test C — custom negatiefTotaal=10: 7 onvoldoende student is NOT negatief', () => {
    const scores: Record<string, string | null> = {
      // 2 onvoldoende in lesgeven
      'V&A':  'onvoldoende',
      'M&M':  'onvoldoende',
      'INS':  'voldoende',
      'O&DW': 'voldoende',
      'C&B':  'voldoende',
      '1E&B': 'voldoende',
      // 2 onvoldoende in organiseren
      'P&O':  'onvoldoende',
      'S&O':  'onvoldoende',
      'ORG':  'voldoende',
      'I&B':  'voldoende',
      '2E&B': 'voldoende',
      // 3 onvoldoende in prof_handelen
      'PrCo': 'onvoldoende',
      'VSK':  'onvoldoende',
      'LOB':  'onvoldoende',
      'INFO': 'voldoende',
      'DESK': 'voldoende',
      'BS':   'voldoende',
      'TOW':  'voldoende',
      'BH':   'voldoende',
    };
    // totaalOnvoldoende=7, totaalVoldoendeOfHoger=12
    // Custom: negatiefTotaal=10 (7>10? No) + negatiefPerLeerlijn=5 (3>5? No) → isNegatief=false
    const student = makeStudent(scores);
    const customNormen: Normen = { ...DEFAULT_NORMEN, negatiefTotaal: 10, negatiefPerLeerlijn: 5 };
    const result = berekenPrognose(student, 'bj2', undefined, customNormen);
    // result.isNegatief is still the generic, OLD telLeerlijnen-based
    // computation at the top of berekenPrognose (unchanged by T9a — it's kept
    // on the return object per D17/T8 precedent even though it no longer
    // drives the bj2 LABEL), so this assertion remains valid and meaningful.
    expect(result.isNegatief).toBe(false);
    // ── gaps.onvoldoendeRuimte assertion removed (M42 T9a) ──────────────────
    // That field belonged to the OLD bj2 gaps object (built from
    // n.negatiefTotaal/totaalOnvoldoende in the now-replaced bj2 branch).
    // berekenBj2GeneriekPad's gaps shape has no such field (D17: bj2 has no
    // negatief-tier to compute "ruimte" against) — without a vestiging this
    // call now returns gaps: {} entirely (vestiging-null-guard), so asserting
    // a specific numeric value here would either throw (T8-report-style
    // "genuinely obsolete") or, if softened, be vacuous. Dropped rather than
    // ported.
  });

  // ── Test D: negatiefPerLeerlijn custom threshold (NORM-04) ───────────────
  // 3 onvoldoende all in lesgeven. Default negatiefPerLeerlijn=2: 3>2 → isNegatief=true.
  // Custom negatiefPerLeerlijn=5: 3>5? No; totaalOnvoldoende=3>6? No → isNegatief=false.
  // onvoldoendeRuimtePerLeerlijn.lesgeven = negatiefPerLeerlijn - telling.lesgeven.onvoldoende = 5 - 3 = 2.
  it('Test D — custom negatiefPerLeerlijn=5: 3 onvoldoende in lesgeven is NOT negatief', () => {
    const scores: Record<string, string | null> = {
      // 3 onvoldoende in lesgeven (V&A, M&M, INS)
      'V&A':  'onvoldoende',
      'M&M':  'onvoldoende',
      'INS':  'onvoldoende',
      'O&DW': 'voldoende',
      'C&B':  'voldoende',
      '1E&B': 'voldoende',
      // 0 onvoldoende in organiseren
      'P&O':  'voldoende',
      'S&O':  'voldoende',
      'ORG':  'voldoende',
      'I&B':  'voldoende',
      '2E&B': 'voldoende',
      // 0 onvoldoende in prof_handelen
      'PrCo': 'voldoende',
      'VSK':  'voldoende',
      'LOB':  'voldoende',
      'INFO': 'voldoende',
      'DESK': 'voldoende',
      'BS':   'voldoende',
      'TOW':  'voldoende',
      'BH':   'voldoende',
    };
    // totaalOnvoldoende=3, totaalVoldoendeOfHoger=16
    // Default negatiefPerLeerlijn=2: lesgeven.onvoldoende=3>2 → isNegatief=true
    // Custom negatiefPerLeerlijn=5: lesgeven.onvoldoende=3>5? No; 3>negatiefTotaal(6)? No → isNegatief=false
    const student = makeStudent(scores);
    const customNormen: Normen = { ...DEFAULT_NORMEN, negatiefPerLeerlijn: 5 };
    const result = berekenPrognose(student, 'bj2', undefined, customNormen);
    // Zelfde redenering als Test C hierboven: isNegatief blijft de generieke,
    // ongewijzigde top-of-function berekening.
    expect(result.isNegatief).toBe(false);
    // gaps.onvoldoendeRuimtePerLeerlijn assertion removed (M42 T9a) — zelfde
    // reden als Test C: dat veld hoorde bij de OLD bj2-gaps-vorm, niet bij
    // berekenBj2GeneriekPad's gaps-shape.
  });

  // ── Test E/F removed (M42 T8) ─────────────────────────────────────────────
  // Tested the OLD Normen fields versneldLesgeven/versneldOrganiseren/
  // versneldProfHandelen/bj1Positief, which berekenBj1Uitkomst (the new BJ1
  // engine) no longer reads at all, and called berekenPrognose(student,'bj1',
  // ...) WITHOUT vestiging, which now correctly returns 'normen_onbekend'.
  // This file's OLD-schema mock (top of file) also makes them impossible to
  // port in place: the new engine reads telLeerlijnenPerFase's real-schema
  // group keys ('lesgeven_en_organiseren'/'professioneel_handelen'), which
  // don't exist under this mock. Equivalent "custom normen threshold changes
  // the outcome" coverage now lives in tests/prognosis.bj1Uitkomst.test.ts
  // (no schema mock, real schema, VestigingNormen instead of Normen).

  // ── Test G: undefined normen falls back to sync cache ────────────────────
  // berekenPrognose(student, 'bj2') with no 4th arg must not throw and must return
  // a result with a label property. Proves the fallback path to getNormenSync() exists.
  it('Test G — no normen param: berekenPrognose falls back to sync cache, returns valid result', () => {
    const scores: Record<string, string | null> = {
      'V&A':  'voldoende',
      'M&M':  'voldoende',
      'INS':  'voldoende',
      'O&DW': 'voldoende',
      'C&B':  'voldoende',
      '1E&B': 'voldoende',
      'P&O':  'voldoende',
      'S&O':  'voldoende',
      'ORG':  'voldoende',
      'I&B':  'voldoende',
      '2E&B': 'voldoende',
      'PrCo': 'voldoende',
      'VSK':  'voldoende',
      'LOB':  'voldoende',
      'INFO': 'voldoende',
      'DESK': 'voldoende',
      'BS':   'voldoende',
      'TOW':  'voldoende',
      'BH':   'voldoende',
    };
    const student = makeStudent(scores);
    // No 4th argument — berekenPrognose must fall back to getNormenSync() internally.
    // This tests the fallback branch without needing normen.ts cache to be pre-warmed.
    let result: any;
    expect(() => {
      result = berekenPrognose(student, 'bj2');
    }).not.toThrow();
    expect(result).toBeDefined();
    expect(typeof result.label).toBe('string');
    expect(result.label.length).toBeGreaterThan(0);
  });

  // ── Test H: vestiging parameter (M42 T7b, herzien in T9a) ──────────────────
  // T7b's oorspronkelijke aanname was dat vestiging PURE plumbing was (nog
  // niet gelezen door de bj2-tak) en dus nooit het label kon veranderen. T9a
  // maakt vestiging voor bj2 precies NIET meer inert (elke vestiging heeft nu
  // zijn eigen VestigingNormen, en de Roosendaal-levels-eis kan het label
  // daadwerkelijk laten verschillen) — dat is het hele doel van deze taak.
  // Wat WEL nog moet blijven kloppen: geen enkele vestigingswaarde geeft een
  // throw, en de vestiging-null-guard geeft consistent 'normen_onbekend' voor
  // zowel undefined als null. Echte "verschillende vestiging → mogelijk
  // andere uitkomst"-dekking staat in tests/prognosis.bj2GeneriekPad.test.ts.
  it('Test H — vestiging (5th arg): accepted for roosendaal/goes/dordrecht without throwing; undefined/null consistently give normen_onbekend', () => {
    const scores: Record<string, string | null> = {
      'V&A':  'voldoende',
      'M&M':  'voldoende',
      'INS':  'voldoende',
      'O&DW': 'voldoende',
      'C&B':  'voldoende',
      '1E&B': 'voldoende',
      'P&O':  'voldoende',
      'S&O':  'voldoende',
      'ORG':  'voldoende',
      'I&B':  'voldoende',
      '2E&B': 'voldoende',
      'PrCo': 'voldoende',
      'VSK':  'voldoende',
      'LOB':  'voldoende',
      'INFO': 'voldoende',
      'DESK': 'voldoende',
      'BS':   'voldoende',
      'TOW':  'voldoende',
      'BH':   'voldoende',
    };
    const student = makeStudent(scores);

    for (const vestiging of ['roosendaal', 'goes', 'dordrecht', undefined, null] as const) {
      expect(() => {
        berekenPrognose(student, 'bj2', undefined, DEFAULT_NORMEN as Normen, vestiging);
      }).not.toThrow();
    }

    const zonderVestiging = berekenPrognose(student, 'bj2', undefined, DEFAULT_NORMEN as Normen, undefined);
    const metNull = berekenPrognose(student, 'bj2', undefined, DEFAULT_NORMEN as Normen, null);
    expect(zonderVestiging.label).toBe('normen_onbekend');
    expect(metNull.label).toBe('normen_onbekend');
  });

});

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

  // ── Test A: SBL custom threshold (NORM-01) ────────────────────────────────
  // Student with 10 ≥V. Default sbl=13 → 10<13 → not SBL → 'neutraal'.
  // Custom sbl=10 → 10>=10 → isSBL=true → label='sbl', nodigSBL=0.
  it('Test A — custom sbl=10: student with 10 voldoende gets label sbl', () => {
    const scores: Record<string, string | null> = {
      // 10 voldoende: 6 in lesgeven + 4 in organiseren
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
      // remaining 9 deelgebieden: null (not assessed)
      '2E&B': null,
      'PrCo': null,
      'VSK':  null,
      'LOB':  null,
      'INFO': null,
      'DESK': null,
      'BS':   null,
      'TOW':  null,
      'BH':   null,
    };
    const student = makeStudent(scores);
    // isSBC requires >=15 (10<15 → false). isNegatief: 0 onvoldoende → false.
    // With default sbl=13: 10<13 → isSBL=false → label='neutraal'.
    // With custom sbl=10:  10>=10 → isSBL=true → label='sbl'.
    const result = berekenPrognose(student, 'bj2', undefined, { ...DEFAULT_NORMEN, sbl: 10 } as Normen);
    expect(result.label).toBe('sbl');
    expect(result.gaps.nodigSBL).toBe(0);
  });

  // ── Test B: SBC custom threshold (NORM-02) ───────────────────────────────
  // Student with 10 ≥V including all KERN_SBC=['V&A','P&O','C&B','1E&B'] voldoende.
  // Default sbc=15 → 10<15 → not SBC.
  // Custom sbc=10 → 10>=10 && kernNietVoldaan.length===0 → isSBC=true → label='sbc'.
  it('Test B — custom sbc=10: student with 10 voldoende incl all KERN_SBC gets label sbc', () => {
    const scores: Record<string, string | null> = {
      // KERN_SBC must ALL be voldoende (V&A, P&O, C&B, 1E&B)
      'V&A':  'voldoende',
      'P&O':  'voldoende',
      'C&B':  'voldoende',
      '1E&B': 'voldoende',
      // 6 more voldoende to reach total=10
      'M&M':  'voldoende',
      'INS':  'voldoende',
      'O&DW': 'voldoende',
      'S&O':  'voldoende',
      'ORG':  'voldoende',
      'I&B':  'voldoende',
      // remaining 9: null
      '2E&B': null,
      'PrCo': null,
      'VSK':  null,
      'LOB':  null,
      'INFO': null,
      'DESK': null,
      'BS':   null,
      'TOW':  null,
      'BH':   null,
    };
    const student = makeStudent(scores);
    // isNegatief: 0 onvoldoende → false.
    // With default sbc=15: 10<15 → isSBC=false → check isSBL: with default sbl=13 → 10<13 → 'neutraal'.
    // With custom sbc=10 (sbl still 13): 10>=10 && kern all met → isSBC=true → label='sbc'.
    // Note: isSBC is checked before isSBL in berekenPrognose, so sbc wins.
    const result = berekenPrognose(student, 'bj2', undefined, { ...DEFAULT_NORMEN, sbc: 10 } as Normen);
    expect(result.label).toBe('sbc');
    expect(result.gaps.nodigSBC_deelgebieden).toBe(0);
  });

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
    expect(result.isNegatief).toBe(false);
    expect(result.gaps.onvoldoendeRuimte).toBe(3); // 10 - 7
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
    expect(result.isNegatief).toBe(false);
    expect(result.gaps.onvoldoendeRuimtePerLeerlijn.lesgeven).toBe(2); // 5 - 3
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

  // ── Test H: vestiging parameter (M42 T7b) — appended 5th arg, currently inert ─
  // T7b is pure plumbing: the 5th `vestiging` parameter must be accepted without
  // throwing and must NOT change the computed label (the decision body doesn't
  // read it yet — that's T8/T9's job). This also proves the parameter was
  // APPENDED, not inserted: the existing 4-arg `normen`-passing calls elsewhere
  // in this file must keep working unmodified (see full-file regression run).
  it('Test H — vestiging (5th arg): accepted for roosendaal/goes/dordrecht/undefined/null without throwing or changing the label', () => {
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
    const baseline = berekenPrognose(student, 'bj2', undefined, DEFAULT_NORMEN as Normen);

    for (const vestiging of ['roosendaal', 'goes', 'dordrecht', undefined, null] as const) {
      let result: any;
      expect(() => {
        result = berekenPrognose(student, 'bj2', undefined, DEFAULT_NORMEN as Normen, vestiging);
      }).not.toThrow();
      expect(result.label).toBe(baseline.label);
    }
  });

});

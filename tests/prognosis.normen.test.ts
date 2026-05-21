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

import { describe, it, expect } from 'vitest';
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

  // ── Test E: BJ1 versneld-SBC trio custom thresholds (NORM-05) ────────────
  // traject='bj1'. Student has lesgeven=3G, organiseren=2G, prof_handelen=4G (goedOfHoger).
  // Default VERSNELD: lesgeven>=4, org>=3, ph>=5 → 3>=4? No → isVersneldSBC=false.
  // Custom: lesgeven>=3, org>=2, ph>=4 → 3>=3, 2>=2, 4>=4 → isVersneldSBC=true → label='versneld_sbc'.
  // Total voldoende = 9 < bj1Positief(13) → isBJ2=false (versneld check runs first anyway).
  it('Test E — custom versneld trio (3/2/4): student gets label versneld_sbc', () => {
    const scores: Record<string, string | null> = {
      // lesgeven: 3 goed
      'V&A':  'goed',
      'M&M':  'goed',
      'INS':  'goed',
      'O&DW': null,
      'C&B':  null,
      '1E&B': null,
      // organiseren: 2 goed
      'P&O':  'goed',
      'S&O':  'goed',
      'ORG':  null,
      'I&B':  null,
      '2E&B': null,
      // prof_handelen: 4 goed
      'PrCo': 'goed',
      'VSK':  'goed',
      'LOB':  'goed',
      'INFO': 'goed',
      'DESK': null,
      'BS':   null,
      'TOW':  null,
      'BH':   null,
    };
    // totaalVoldoendeOfHoger=9, goedOfHoger: lesgeven=3, org=2, ph=4
    // isNegatief: 0 onvoldoende → false
    // With default normen (4/3/5): 3>=4? No → isVersneldSBC=false → 9<13 → isBJ2=false → 'neutraal'
    // With custom (3/2/4): 3>=3, 2>=2, 4>=4 → isVersneldSBC=true → label='versneld_sbc'
    const student = makeStudent(scores);
    const customNormen: Normen = {
      ...DEFAULT_NORMEN,
      versneldLesgeven: 3,
      versneldOrganiseren: 2,
      versneldProfHandelen: 4,
    };
    const result = berekenPrognose(student, 'bj1', undefined, customNormen);
    expect(result.label).toBe('versneld_sbc');
  });

  // ── Test F: BJ1 positief threshold (NORM-05 supplement) ──────────────────
  // traject='bj1'. Student has totaalVoldoendeOfHoger=11, all voldoende (goedOfHoger=0).
  // Default bj1Positief=13: 11<13 → isBJ2=false → label not 'naar_bj2'.
  // Custom bj1Positief=10: 11>=10 → isBJ2=true → label='naar_bj2', nodigBJ2=0.
  // isVersneldSBC=false (all voldoende, none goed → goedOfHoger=0 per leerlijn).
  it('Test F — custom bj1Positief=10: student with 11 voldoende gets label naar_bj2', () => {
    const scores: Record<string, string | null> = {
      // 11 voldoende spread across leerlijnen (no goed → goedOfHoger=0, isVersneldSBC=false)
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
      'PrCo': null,
      'VSK':  null,
      'LOB':  null,
      'INFO': null,
      'DESK': null,
      'BS':   null,
      'TOW':  null,
      'BH':   null,
    };
    // totaalVoldoendeOfHoger=11, goedOfHoger=0
    // isNegatief: 0 onvoldoende → false
    // isVersneldSBC: goedOfHoger per leerlijn=0 → 0>=4? No → false
    // With default bj1Positief=13: 11>=13? No → isBJ2=false → 'neutraal'
    // With custom bj1Positief=10: 11>=10? Yes → isBJ2=true → label='naar_bj2'
    const student = makeStudent(scores);
    const result = berekenPrognose(student, 'bj1', undefined, { ...DEFAULT_NORMEN, bj1Positief: 10 } as Normen);
    expect(result.label).toBe('naar_bj2');
    expect(result.gaps.nodigBJ2).toBe(0);
  });

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

});

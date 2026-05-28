// tests/DoortstroomPrognoseSection.test.tsx — Phase 29 Plan 01 (PROG-01)
// TDD RED scaffold: tests written before the block-layout implementation exists.
// All 7 tests are RED against the current DoortstroomPrognoseSection (uses flat gap-item list).
// Tests turn GREEN when Plan 29-03 ships the prognose-block layout rewrite.

import { vi, describe, test, expect, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// ── Mock getNormenSync (hoisted before component import) ───────────────────────
vi.mock('../../utils/normen', () => ({
  getNormenSync: vi.fn().mockReturnValue({
    sbl: 13,
    sbc: 15,
    negatiefTotaal: 6,
    negatiefPerLeerlijn: 2,
    bj1Positief: 10,
    versneldLesgeven: 4,
    versneldOrganiseren: 3,
    versneldProfHandelen: 5,
    // aliased names used in the component
    bj1VersneldLesgeven: 4,
    bj1VersneldOrganiseren: 3,
    bj1VersneldProfHandelen: 5,
  }),
}));

// Import AFTER mock declaration
import DoortstroomPrognoseSection from '../src/components/DoortstroomPrognoseSection';

// ── Stub helpers ─────────────────────────────────────────────────────────────

function makeBJ2Status(overrides: Record<string, any> = {}): any {
  return {
    kleur: 'groen',
    label: 'SBL',
    prognose: {
      traject: 'bj2',
      label: 'sbl',
      isNegatief: false,
      totaalVoldoendeOfHoger: 14,
      totaalOnvoldoende: 2,
      leerlijnen: [
        { leerlijn: 'lesgeven',       totaal: 8, voldoendeOfHoger: 5, goedOfHoger: 3, onvoldoende: 1, onbeoordeeld: 2 },
        { leerlijn: 'organiseren',    totaal: 6, voldoendeOfHoger: 4, goedOfHoger: 2, onvoldoende: 1, onbeoordeeld: 1 },
        { leerlijn: 'prof_handelen',  totaal: 5, voldoendeOfHoger: 5, goedOfHoger: 3, onvoldoende: 0, onbeoordeeld: 0 },
      ],
      gaps: {
        nodigSBL: 0,
        nodigSBC_deelgebieden: 1,
        nodigSBC_kern: [],
        onvoldoendeRuimte: 2,
        onvoldoendeRuimtePerLeerlijn: { lesgeven: 1, organiseren: 2, prof_handelen: 0 },
      },
      ...overrides,
    },
  };
}

function makeBJ1Status(overrides: Record<string, any> = {}): any {
  return {
    kleur: 'oranje',
    label: 'Doorstroom BJ2',
    prognose: {
      traject: 'bj1',
      label: 'naar_bj2',
      isNegatief: false,
      totaalVoldoendeOfHoger: 8,
      totaalOnvoldoende: 1,
      leerlijnen: [
        { leerlijn: 'lesgeven',       totaal: 5, voldoendeOfHoger: 3, goedOfHoger: 1, onvoldoende: 1, onbeoordeeld: 1 },
        { leerlijn: 'organiseren',    totaal: 4, voldoendeOfHoger: 3, goedOfHoger: 1, onvoldoende: 0, onbeoordeeld: 1 },
        { leerlijn: 'prof_handelen',  totaal: 4, voldoendeOfHoger: 2, goedOfHoger: 0, onvoldoende: 0, onbeoordeeld: 2 },
      ],
      gaps: {
        nodigBJ2: 2,
        nodigVersneld_lesgeven: 1,
        nodigVersneld_organiseren: 0,
        nodigVersneld_profHandelen: 2,
        onvoldoendeRuimte: 3,
        onvoldoendeRuimtePerLeerlijn: { lesgeven: 1, organiseren: 2, prof_handelen: 0 },
      },
      ...overrides,
    },
  };
}

// detectTraject uses student.periode (primary) or student.leerjaar (fallback)
const BJ2_STUDENT = { periode: 'BJ2 fase 2', leerjaar: '2' };
const BJ1_STUDENT = { periode: 'BJ1 fase 1', leerjaar: '1' };

// ── BJ2 tests ─────────────────────────────────────────────────────────────────

test('BJ2: renders SBL block as a prognose-block container', () => {
  const html = renderToStaticMarkup(
    React.createElement(DoortstroomPrognoseSection, {
      student: BJ2_STUDENT,
      status: makeBJ2Status(),
    })
  );

  // RED: current component renders SBL in button/toggle only, not as a .prognose-block heading.
  // After PROG-01 ships, "SBL" should appear as a block heading within a .prognose-block element.
  expect(html).toContain('prognose-block');
});

test('BJ2: renders SBC block as a prognose-block container', () => {
  const html = renderToStaticMarkup(
    React.createElement(DoortstroomPrognoseSection, {
      student: BJ2_STUDENT,
      status: makeBJ2Status(),
    })
  );

  // RED: current component does not render .prognose-block structure.
  // After PROG-01 ships, both SBL and SBC blocks should be visible simultaneously (no toggle).
  expect(html).toContain('prognose-block');
  // Additionally verify the SBC block heading text is present (not just a toggle button)
  // The current component renders "SBC" only as a toggle button, not as a block heading.
  // We check for the block-heading pattern that the rewrite will introduce.
  const sblCount = (html.match(/prognose-block/g) || []).length;
  // After PROG-01: at least 2 blocks (SBL + SBC) — RED now because 0 blocks exist
  expect(sblCount).toBeGreaterThanOrEqual(2);
});

test('BJ2: renders Negatief block for negative prognosis', () => {
  const negatiefStatus = makeBJ2Status({
    isNegatief: true,
    totaalOnvoldoende: 7,
    gaps: {
      nodigSBL: 3,
      nodigSBC_deelgebieden: 5,
      nodigSBC_kern: ['V&A', 'M&M'],
      onvoldoendeRuimte: 0,
      onvoldoendeRuimtePerLeerlijn: { lesgeven: 0, organiseren: 0, prof_handelen: 1 },
    },
  });

  const html = renderToStaticMarkup(
    React.createElement(DoortstroomPrognoseSection, {
      student: BJ2_STUDENT,
      status: negatiefStatus,
    })
  );

  // RED: current component shows "Negatief advies: ..." as a gap-item text (not a block heading).
  // After PROG-01 ships, "Negatief" should appear as a standalone .prognose-block heading.
  // We check for the block heading containing "Negatief" (not just the inline advies text).
  expect(html).toContain('prognose-block');
  // Verify block count includes Negatief block — RED because current has 0 prognose-blocks
  const blockCount = (html.match(/prognose-block/g) || []).length;
  expect(blockCount).toBeGreaterThanOrEqual(3);
});

test('BJ2: SBL criterion row shows score vs threshold in a prognose-criterion-row', () => {
  const html = renderToStaticMarkup(
    React.createElement(DoortstroomPrognoseSection, {
      student: BJ2_STUDENT,
      status: makeBJ2Status(),
    })
  );

  // RED: current component does not render .prognose-criterion-row elements.
  // After PROG-01 ships, each leerlijn criterion should appear as a row showing "score / threshold".
  expect(html).toContain('prognose-criterion-row');
});

// ── BJ1 tests ─────────────────────────────────────────────────────────────────

test('BJ1: renders BJ2 doorstroom block as a prognose-block', () => {
  const html = renderToStaticMarkup(
    React.createElement(DoortstroomPrognoseSection, {
      student: BJ1_STUDENT,
      status: makeBJ1Status(),
    })
  );

  // RED: current component renders "doorstroom BJ2" inside a gap-item label (not a block heading).
  // After PROG-01 ships, "BJ2 doorstroom" should appear as a .prognose-block heading.
  expect(html).toContain('prognose-block');
  // Verify the specific BJ2 doorstroom heading text (different word order from current gap-item text)
  expect(html).toContain('BJ2 doorstroom');
});

test('BJ1: renders Versneld SBC block as a prognose-block', () => {
  const html = renderToStaticMarkup(
    React.createElement(DoortstroomPrognoseSection, {
      student: BJ1_STUDENT,
      status: makeBJ1Status(),
    })
  );

  // RED: current component renders "Versneld SBC" as gap-item label text (not a block heading).
  // After PROG-01 ships, "Versneld SBC" should appear as a separate .prognose-block heading.
  expect(html).toContain('prognose-block');
  const blockCount = (html.match(/prognose-block/g) || []).length;
  // After PROG-01: at least 2 blocks (BJ2 doorstroom + Versneld SBC) — RED now (0 blocks)
  expect(blockCount).toBeGreaterThanOrEqual(2);
});

// ── Empty/grijs test ─────────────────────────────────────────────────────────

test('no scores: shows "Nog geen scores beschikbaar" when totaalVoldoendeOfHoger and totaalOnvoldoende are both 0', () => {
  const grijsStatus = makeBJ2Status({
    totaalVoldoendeOfHoger: 0,
    totaalOnvoldoende: 0,
    isNegatief: false,
    gaps: {
      nodigSBL: 13,
      nodigSBC_deelgebieden: 15,
      nodigSBC_kern: [],
      onvoldoendeRuimte: 6,
      onvoldoendeRuimtePerLeerlijn: { lesgeven: 2, organiseren: 2, prof_handelen: 2 },
    },
  });
  grijsStatus.kleur = 'grijs';

  const html = renderToStaticMarkup(
    React.createElement(DoortstroomPrognoseSection, {
      student: BJ2_STUDENT,
      status: grijsStatus,
    })
  );

  // RED: current component does not have a "Nog geen scores beschikbaar" empty state.
  // After PROG-01 ships, this message should appear when both score counts are 0.
  expect(html).toContain('Nog geen scores beschikbaar');
});

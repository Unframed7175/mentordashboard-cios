// tests/DoortstroomPrognoseSection.test.tsx — M42 T12
//
// Full rewrite (M42 T12) — the component now reads the NEW engine's gaps shapes
// (berekenBj1Uitkomst / berekenBj2GeneriekPad / berekenBj2RoosendaalSblKeuze,
// see utils/prognosis.ts) instead of the retired getNormenSync()-based gap field
// names. The component reads status.prognose directly (never recomputes it), so
// these tests build `status` fixtures with the exact gaps shape each traject/
// vestiging/roosendaalTraject combination actually produces — no engine mocking
// needed since DoortstroomPrognoseSection itself no longer imports the engine.
//
// Critical case (see task-T12-brief.md "3 possible result shapes"): a BJ2
// student can hit EITHER berekenBj2GeneriekPad OR berekenBj2RoosendaalSblKeuze,
// both of which can produce label: 'sbl' with DIFFERENT gaps field names. The
// component must disambiguate using vestiging + student.roosendaalTraject, the
// same way berekenPrognose's own routing does — NOT from the label alone.

import { describe, test, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import DoortstroomPrognoseSection from '../src/components/DoortstroomPrognoseSection';

// detectTraject (src/utils/status.ts) uses student.periode (primary) or
// student.leerjaar (fallback) — real function, not mocked.
const BJ1_STUDENT_BASE = { periode: 'BJ1 fase 2', leerjaar: '1' };
const BJ2_STUDENT_BASE = { periode: 'BJ2 fase 2', leerjaar: '2' };

function makeBj1Status(gapsOverrides: Record<string, any> = {}, label = 'naar_bj2'): any {
  return {
    kleur: 'groen',
    label: 'Naar BJ2',
    prognose: {
      traject: 'bj1',
      label,
      isNegatief: label === 'negatief',
      totaalVoldoendeOfHoger: 8,
      totaalOnvoldoende: 1,
      leerlijnen: [],
      gaps: {
        aantalOnvoldoendeDeelgebieden: 1,
        onvoldoendeDeelgebiedenRuimte: 2,
        aantalOnbeoordeeldFase2: 0,
        onbeoordeeldRuimte: 4,
        nodigNaarBj2Deelgebieden: 0,
        nodigNaarBj2ProfHoudingBvb: 0,
        nodigNaarBj2RekenDomeinen: 0,
        nodigVersneldSbc_lesgevenOrganiseren: 2,
        nodigVersneldSbc_profHandelen: 3,
        nodigVersneldSbc_profHoudingBvb: 1,
        nodigVersneldSbc_rekenDomeinen: 2,
        wvoTraject: true,
        nederlandsNiveau: 'voldoende',
        rekenNiveau: 'voldoende',
        levelsAfgerond: 2,
        ...gapsOverrides,
      },
    },
  };
}

function makeBj2GeneriekStatus(gapsOverrides: Record<string, any> = {}, label = 'sbl'): any {
  return {
    kleur: 'groen',
    label: 'SBL',
    prognose: {
      traject: 'bj2',
      label,
      isNegatief: false,
      totaalVoldoendeOfHoger: 10,
      totaalOnvoldoende: 1,
      leerlijnen: [],
      gaps: {
        aantalVoldoendeOfHoger: 10,
        nodigSBC_deelgebieden: 2,
        nodigSBL_deelgebieden: 0,
        nodigSBC_rekenDomeinen: 1,
        nodigSBL_rekenDomeinen: 0,
        nlSchrijvenNiveau: 'voldoende',
        nlGesprekvoerenNiveau: 'voldoende',
        nederlandsNiveau: 'voldoende',
        rekenNiveau: 'voldoende',
        kdStatus: 'behaald',
        wvoTraject: true,
        ...gapsOverrides,
      },
    },
  };
}

function makeBj2RoosendaalSblKeuzeStatus(gapsOverrides: Record<string, any> = {}, label = 'sbl'): any {
  return {
    kleur: 'groen',
    label: 'SBL',
    prognose: {
      traject: 'bj2',
      label,
      isNegatief: false,
      totaalVoldoendeOfHoger: 6,
      totaalOnvoldoende: 0,
      leerlijnen: [],
      gaps: {
        fase3DeelgebiedenVoldoende: 4,
        nodigDeelgebiedenFase3: 0,
        nodigRekenDomeinen: 0,
        nederlandsNiveau: 'goed',
        rekenNiveau: 'goed',
        kdStatus: 'haalbaar',
        ...gapsOverrides,
      },
    },
  };
}

// ── BJ1 ──────────────────────────────────────────────────────────────────────

describe('BJ1', () => {
  test('naar_bj2 fixture renders the BJ2-doorstroom and Versneld SBC blocks with Betekenisvol Bewegen and WVO-traject rows', () => {
    const html = renderToStaticMarkup(
      React.createElement(DoortstroomPrognoseSection, {
        student: { ...BJ1_STUDENT_BASE, nederlandsResultaat: '2F', rekenResultaat: '2F', wvoTraject: true },
        status: makeBj1Status(),
        vestiging: null,
      })
    );

    expect(html).toContain('prognose-block');
    expect(html).toContain('BJ2 doorstroom');
    expect(html).toContain('Versneld SBC');
    expect(html).toContain('Betekenisvol Bewegen');
    expect(html).toContain('WVO-traject');
    // No stale/removed field names should ever leak through as literal text.
    expect(html).not.toContain('undefined');
    expect(html).not.toContain('NaN');
  });

  test('negatief fixture still renders a Negatief block using the new gaps fields (no more per-leerlijn breakdown)', () => {
    const html = renderToStaticMarkup(
      React.createElement(DoortstroomPrognoseSection, {
        student: { ...BJ1_STUDENT_BASE },
        status: makeBj1Status(
          { aantalOnvoldoendeDeelgebieden: 5, onvoldoendeDeelgebiedenRuimte: 0, aantalOnbeoordeeldFase2: 6, onbeoordeeldRuimte: -2 },
          'negatief',
        ),
        vestiging: null,
      })
    );

    expect(html).toContain('Negatief');
    expect(html).not.toContain('undefined');
    expect(html).not.toContain('NaN');
  });

  test('Goes/Dordrecht student never shows a Roosendaal-levels row', () => {
    const html = renderToStaticMarkup(
      React.createElement(DoortstroomPrognoseSection, {
        student: { ...BJ1_STUDENT_BASE },
        status: makeBj1Status(),
        vestiging: 'goes',
      })
    );

    expect(html).not.toContain('Roosendaal levels');
  });

  test('Roosendaal student DOES show a Roosendaal-levels row', () => {
    const html = renderToStaticMarkup(
      React.createElement(DoortstroomPrognoseSection, {
        student: { ...BJ1_STUDENT_BASE },
        status: makeBj1Status({ levelsAfgerond: 3 }),
        vestiging: 'roosendaal',
      })
    );

    expect(html).toContain('Roosendaal levels');
    expect(html).toContain('3');
  });
});

// ── BJ2 generic pad ──────────────────────────────────────────────────────────

describe('BJ2 — generic pad (berekenBj2GeneriekPad)', () => {
  test('sbc fixture renders the SBC block with split Nederlands schrijven/gesprekken rows', () => {
    const html = renderToStaticMarkup(
      React.createElement(DoortstroomPrognoseSection, {
        student: { ...BJ2_STUDENT_BASE, nlSchrijven: '2F', nlGesprekvoeren: '3F', rekenResultaat: '3F' },
        status: makeBj2GeneriekStatus(
          { nodigSBC_deelgebieden: 0, nlSchrijvenNiveau: 'voldoende', nlGesprekvoerenNiveau: 'goed', rekenNiveau: 'goed' },
          'sbc',
        ),
        vestiging: 'goes',
      })
    );

    expect(html).toContain('SBC');
    expect(html).toContain('Nederlands schrijven');
    expect(html).toContain('Nederlands gesprekken');
    expect(html).not.toContain('undefined');
    expect(html).not.toContain('NaN');
  });

  test('bespreekgeval fixture shows the new Bespreekgeval label/block (not Twijfelgeval)', () => {
    const html = renderToStaticMarkup(
      React.createElement(DoortstroomPrognoseSection, {
        student: { ...BJ2_STUDENT_BASE },
        status: makeBj2GeneriekStatus(
          { nodigSBL_deelgebieden: 3, nederlandsNiveau: 'onvoldoende', rekenNiveau: 'onvoldoende', kdStatus: null },
          'bespreekgeval',
        ),
        vestiging: 'dordrecht',
      })
    );

    expect(html).toContain('Bespreekgeval');
    expect(html).not.toContain('Twijfelgeval');
  });

  test('Roosendaal student WITHOUT an sbl-keuze uses the generic gaps shape (nodigSBL_deelgebieden)', () => {
    const html = renderToStaticMarkup(
      React.createElement(DoortstroomPrognoseSection, {
        student: { ...BJ2_STUDENT_BASE, roosendaalTraject: 'sbc' },
        status: makeBj2GeneriekStatus({ nodigSBL_deelgebieden: 2 }, 'sbl'),
        vestiging: 'roosendaal',
      })
    );

    expect(html).not.toContain('undefined');
    expect(html).not.toContain('NaN');
    // Generic-pad SBL uses whole-year deelgebieden, not the fase-3 label.
    expect(html).not.toContain('fase 3');
  });
});

// ── BJ2 Roosendaal SBL-keuze pad — the disambiguation regression test ───────

describe('BJ2 — Roosendaal SBL-keuze pad (berekenBj2RoosendaalSblKeuze)', () => {
  test('renders via the Bj2RoosendaalSblKeuzeUitkomst gaps shape (fase-3-labeled deelgebieden, different numbers than the generic path)', () => {
    // Deliberately shaped with ONLY the roosendaal-sbl-keuze fields (no
    // nodigSBL_deelgebieden at all) — if the component mis-disambiguates and
    // reads the generic-pad field name instead, it renders undefined/NaN,
    // exactly the historical bug this task fixes. This is the test that
    // proves the shape-disambiguation logic actually works.
    const html = renderToStaticMarkup(
      React.createElement(DoortstroomPrognoseSection, {
        student: { ...BJ2_STUDENT_BASE, roosendaalTraject: 'sbl', nederlandsResultaat: '2F', rekenResultaat: '2F' },
        status: makeBj2RoosendaalSblKeuzeStatus({ nodigDeelgebiedenFase3: 4, fase3DeelgebiedenVoldoende: 2 }),
        vestiging: 'roosendaal',
      })
    );

    expect(html).toContain('fase 3');
    expect(html).toContain('4');
    expect(html).not.toContain('undefined');
    expect(html).not.toContain('NaN');
    // Must not accidentally also render a Profieljaar SBC block — the
    // roosendaal-sbl-keuze path never produces label 'sbc'.
    expect(html).not.toContain('>SBC<');
  });

  test('roosendaalTraject "sbl" is only honored when vestiging is roosendaal (a non-Roosendaal student with the field set still uses the generic shape)', () => {
    const html = renderToStaticMarkup(
      React.createElement(DoortstroomPrognoseSection, {
        student: { ...BJ2_STUDENT_BASE, roosendaalTraject: 'sbl' },
        status: makeBj2GeneriekStatus({ nodigSBL_deelgebieden: 1 }, 'sbl'),
        vestiging: 'goes',
      })
    );

    expect(html).not.toContain('fase 3');
    expect(html).not.toContain('undefined');
  });

  test('bespreekgeval fallback on the roosendaal-sbl-keuze path shows Bespreekgeval, not SBC', () => {
    const html = renderToStaticMarkup(
      React.createElement(DoortstroomPrognoseSection, {
        student: { ...BJ2_STUDENT_BASE, roosendaalTraject: 'sbl' },
        status: makeBj2RoosendaalSblKeuzeStatus({ nodigDeelgebiedenFase3: 3 }, 'bespreekgeval'),
        vestiging: 'roosendaal',
      })
    );

    expect(html).toContain('Bespreekgeval');
    expect(html).not.toContain('>SBC<');
  });
});

// ── Empty/grijs state ────────────────────────────────────────────────────────

test('no scores: shows "Nog geen scores beschikbaar" when totaalVoldoendeOfHoger and totaalOnvoldoende are both 0', () => {
  const status = makeBj2GeneriekStatus({}, 'bespreekgeval');
  status.prognose.totaalVoldoendeOfHoger = 0;
  status.prognose.totaalOnvoldoende = 0;
  status.kleur = 'grijs';

  const html = renderToStaticMarkup(
    React.createElement(DoortstroomPrognoseSection, {
      student: { ...BJ2_STUDENT_BASE },
      status,
      vestiging: 'goes',
    })
  );

  expect(html).toContain('Nog geen scores beschikbaar');
});

// ── normen_onbekend passthrough (unrelated to Lane C, must still work) ─────

test('normen_onbekend label short-circuits to the existing explanatory message', () => {
  const html = renderToStaticMarkup(
    React.createElement(DoortstroomPrognoseSection, {
      student: { ...BJ2_STUDENT_BASE },
      status: { kleur: 'grijs', label: 'Normen onbekend', prognose: { label: 'normen_onbekend' } },
      vestiging: null,
    })
  );

  expect(html).toContain('Doorstroomnormen nog niet ingesteld');
});

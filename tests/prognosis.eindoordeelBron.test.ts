// ---------------------------------------------------------------------------
// prognosis.eindoordeelBron.test.ts — M43 T2 (ADR-18 D2/D7, R1)
//
// Alle prognose-engines lezen het eindoordeel per deelgebied via
// berekenEindoordelen(student.datapunten), NIET meer uit het opgeslagen
// student.deelgebiedScores (latest-wins, alleen nog compatibiliteit).
// Elke test zet beide bronnen bewust tegenstrijdig, zodat hij alleen slaagt
// als de engine de datapunten + S/C-formule gebruikt.
// ---------------------------------------------------------------------------

import {
  berekenBj1Uitkomst,
  berekenBj2GeneriekPad,
  telLeerlijnenPerFase,
  berekenPrognose,
} from '../utils/prognosis';
import { DEFAULT_VESTIGING_NORMEN } from '../utils/normen';
import { DEELGEBIEDEN } from '../utils/schema';

const LABELS = DEELGEBIEDEN.map(dg => dg.label);
const NORMEN_GOES = DEFAULT_VESTIGING_NORMEN.goes;

function dp(label: string, score: string, fase?: number) {
  return { vak: 'Resultaten', datapunt: `${label}-${score}`, scores: { [label]: score }, ...(fase === undefined ? {} : { fase }) };
}

// Per label eerst G, dan O: latest-wins → onvoldoende, S/C-formule (S=0, C=1) → voldoende.
function gecompenseerd(labels: string[], fase?: number) {
  return labels.flatMap(l => [dp(l, 'goed', fase), dp(l, 'onvoldoende', fase)]);
}

function alles(score: string): Record<string, string> {
  return Object.fromEntries(LABELS.map(l => [l, score]));
}

describe('M43: prognose-engines lezen datapunten via de S/C-formule', () => {
  test('BJ1 Trigger A telt onvoldoende-deelgebieden uit de formule, niet uit deelgebiedScores', () => {
    const student = {
      leerlingId: 'L1',
      deelgebiedScores: alles('onvoldoende'),      // oude bron zegt: alles O
      datapunten: gecompenseerd(LABELS.slice(0, 4)), // formule zegt: 4× V, rest null
    };
    const uitkomst = berekenBj1Uitkomst(student, 'goes', NORMEN_GOES);
    expect(uitkomst.gaps.aantalOnvoldoendeDeelgebieden).toBe(0);
  });

  test('BJ1 Trigger A: onvoldoende uit datapunten telt ook als deelgebiedScores leeg is', () => {
    const student = {
      leerlingId: 'L1',
      deelgebiedScores: {},
      datapunten: LABELS.slice(0, 3).map(l => dp(l, 'onvoldoende')),
    };
    expect(berekenBj1Uitkomst(student, 'goes', NORMEN_GOES).gaps.aantalOnvoldoendeDeelgebieden).toBe(3);
  });

  test('BJ2 ≥V-telling komt uit de formule, niet uit deelgebiedScores', () => {
    const student = {
      leerlingId: 'L1',
      deelgebiedScores: alles('voldoende'),          // oude bron: 12× V
      datapunten: gecompenseerd(LABELS.slice(0, 5)), // formule: 5× V
    };
    expect(berekenBj2GeneriekPad(student, 'goes', NORMEN_GOES).gaps.aantalVoldoendeOfHoger).toBe(5);
  });

  test('telLeerlijnenPerFase past de formule toe binnen de fase (G dan O → voldoende)', () => {
    const telling = telLeerlijnenPerFase(gecompenseerd([LABELS[0]], 2) as any, 2);
    const totaalV = Object.values(telling).reduce((s, t) => s + t.voldoendeOfHoger, 0);
    const totaalO = Object.values(telling).reduce((s, t) => s + t.onvoldoende, 0);
    expect(totaalV).toBe(1);
    expect(totaalO).toBe(0);
  });

  test('berekenPrognose-totalen (berekenStatus "heeft scores") komen uit de formule', () => {
    const student = {
      leerlingId: 'L1',
      deelgebiedScores: {},                          // oude bron: niets
      datapunten: gecompenseerd(LABELS.slice(0, 2)), // formule: 2× V
    };
    const p = berekenPrognose(student, 'bj2', undefined, undefined, 'goes');
    expect(p.totaalVoldoendeOfHoger).toBe(2);
    expect(p.totaalOnvoldoende).toBe(0);
  });
});

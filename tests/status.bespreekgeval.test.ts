// ---------------------------------------------------------------------------
// tests/status.bespreekgeval.test.ts — berekenStatus 'bespreekgeval'-branch (M42 T9a, D17)
//
// D17 (ADR-17d): het brondocument heeft voor BJ2 GEEN eigen negatief-kolom —
// berekenBj2GeneriekPad retourneert 'sbl' | 'sbc' | 'bespreekgeval' (nieuw,
// eigen label, geen hergebruik van BJ1's 'neutraal'). src/utils/status.ts moet
// hiervoor een EXPLICIETE branch hebben: zonder die branch valt 'bespreekgeval'
// stil door naar de groene "SBL"-catch-all aan het einde van berekenStatus,
// wat een bespreekgeval-leerling ten onrechte als "in orde" zou tonen — precies
// het risico dat D17 benoemt.
//
// Deze test mockt utils/prognosis volledig (in plaats van een echte student-
// fixture door de hele engine te sturen) zodat de assertie uitsluitend de
// status.ts-MAPPING toetst, onafhankelijk van:
//   - welke schema-guard (isNormenSchemaOndersteund) toevallig actief is,
//   - of berekenBj2GeneriekPad zelf correct is (die heeft zijn eigen dekking
//     in tests/prognosis.bj2GeneriekPad.test.ts).
// Een toekomstige regressie die de 'bespreekgeval'-branch in status.ts per
// ongeluk weghaalt, faalt hierdoor altijd — ongeacht wat de engine doet.
// ---------------------------------------------------------------------------

import { vi, describe, it, expect } from 'vitest';

vi.mock('../utils/prognosis', async () => {
  const actual = await vi.importActual<typeof import('../utils/prognosis')>('../utils/prognosis');
  return {
    ...actual,
    berekenPrognose: vi.fn(() => ({
      label: 'bespreekgeval',
      isNegatief: false,
      totaalVoldoendeOfHoger: 5,
      totaalOnvoldoende: 0,
      leerlijnen: [],
      gaps: {},
      traject: 'bj2',
    })),
  };
});

import { berekenStatus } from '../src/utils/status';

function makeStudent(overrides: any = {}): any {
  return {
    leerlingId: 'L1',
    naam: 'Test Leerling',
    deelgebiedScores: {},
    datapunten: [],
    keuzedelen: [],
    ...overrides,
  };
}

describe('berekenStatus — bespreekgeval-branch (D17)', () => {
  it('p.label === "bespreekgeval" → { kleur: oranje, label: Bespreekgeval }, NIET de groene SBL-catch-all', () => {
    const result = berekenStatus(makeStudent(), 'bj2');
    expect(result.kleur).toBe('oranje');
    expect(result.label).toBe('Bespreekgeval');
    expect(result.label).not.toBe('SBL');
  });

  it('is te onderscheiden van BJ1s "Twijfelgeval" (allebei oranje, maar andere label-tekst)', () => {
    const result = berekenStatus(makeStudent(), 'bj2');
    expect(result.label).not.toBe('Twijfelgeval');
  });
});

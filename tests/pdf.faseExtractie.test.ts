// tests/pdf.faseExtractie.test.ts
// T2 (M42): fase-extractie uit datapunt-label.
//
// WHY: de doorstroom-prognose engine moet per fase kunnen filteren/aggregeren.
// Datapunten dragen hun fase als een leidend "F<n>"-token in het label
// (bv. "- F1 Tussenbeoordeling mijn Lichaam"). Niet elk datapunt heeft dit
// token — Roosendaal's "Intern/Extern praktijkleren" datapunten dragen geen
// F-prefix, en leerlingen die vóór deze update zijn geïmporteerd hebben het
// evenmin. Voor beide gevallen moet fase: null het resultaat zijn — die
// nul-waarde moet hier betrouwbaar ontstaan (de "telt altijd mee"-regel zit
// in de latere fase-filter, niet in extractFase() zelf).

import { describe, it, expect, vi } from 'vitest';

// Fixtures gebruiken dezelfde 19-deelgebieden-mock als
// tests/pdf.columnAssignment.test.ts, zodat parseDeelgebiedTable-imports niet
// meebewegen met welk schooljaar toevallig in src/config/leerlijn.json actief is.
vi.mock('../src/config/leerlijn.json', () => ({
  default: {
    deelgebieden: [
      { id: 'va', label: 'V&A', group: 'lesgeven' },
      { id: 'mm', label: 'M&M', group: 'lesgeven' },
      { id: 'ins', label: 'INS', group: 'lesgeven' },
    ],
  },
}));

import { extractFase, parseDeelgebiedTable } from '../parsers/pdf';

// ---------------------------------------------------------------------------
// extractFase — unit tests
// ---------------------------------------------------------------------------

describe('extractFase', () => {
  it('extracts fase 1 with a dash prefix', () => {
    expect(extractFase('- F1 Tussenbeoordeling mijn Lichaam')).toBe(1);
  });

  it('extracts fase 2 without a dash prefix', () => {
    expect(extractFase('F2 Mijn lichaam in cijfers')).toBe(2);
  });

  it('extracts fase 3 with the specific unicode dash U+2010 (‐)', () => {
    expect(extractFase('‐ F3 Videoanalyse')).toBe(3);
  });

  it('returns null when there is no F-prefix at all (Roosendaal "Intern praktijkleren")', () => {
    expect(extractFase('- Datapunt introductiekamp')).toBeNull();
  });

  it('returns null for a false positive where "Formulier" precedes the F-token', () => {
    // "Formulier F1 hulpmiddel" — F1 does not appear at the very start after
    // the dash, so this must NOT match.
    expect(extractFase('- Formulier F1 hulpmiddel')).toBeNull();
  });

  it('returns null for an empty string without throwing', () => {
    expect(extractFase('')).toBeNull();
  });

  it('handles the ambiguous "F10" edge case by matching only the first digit (fase 1)', () => {
    // No real export has been observed with a two-digit fase number (only
    // 1-3 exist). The regex `F(\d)\b` requires a word boundary right after
    // the single captured digit, and "0" is a word character, so `\b` does
    // NOT match between "1" and "0" — F10 as a whole therefore does not
    // satisfy the pattern and the result is null, not fase 1.
    expect(extractFase('F10 iets')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// parseDeelgebiedTable — integration: fase is attached to each datapunt
// ---------------------------------------------------------------------------

describe('parseDeelgebiedTable — attaches fase to each datapunt', () => {
  function makeItem(str: string, x: number, fontSize = 10) {
    return { str, x, fontSize, y: 500, width: 30, height: 10, page: 1, pageWidth: 595 };
  }

  it('sets fase:1 on an F1-prefixed row and fase:null on a dash-only row, without touching other fields', () => {
    const headerLine = ['V&A', 'M&M', 'INS'].map((l, i) => makeItem(l, 100 + i * 40, 10));
    const faseRow = [makeItem('- F1 Tussenbeoordeling mijn Lichaam', 10, 10), makeItem('V', 100, 10)];
    const dashOnlyRow = [makeItem('- Intern praktijkleren', 10, 10), makeItem('G', 140, 10)];
    const lines = [headerLine, faseRow, dashOnlyRow];

    const { datapunten } = parseDeelgebiedTable(lines, 0);

    expect(datapunten).toHaveLength(2);

    const fase1 = datapunten.find(d => d.datapunt.includes('Tussenbeoordeling'));
    expect(fase1?.fase).toBe(1);
    expect(fase1?.vak).toBe('');
    expect(fase1?.datapunt).toBe('- F1 Tussenbeoordeling mijn Lichaam');
    expect(fase1?.scores).toEqual({ 'V&A': 'voldoende' });

    const dashOnly = datapunten.find(d => d.datapunt.includes('Intern praktijkleren'));
    expect(dashOnly?.fase).toBeNull();
    expect(dashOnly?.vak).toBe('');
    expect(dashOnly?.datapunt).toBe('- Intern praktijkleren');
    expect(dashOnly?.scores).toEqual({ 'M&M': 'goed' });
  });
});

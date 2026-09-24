// tests/DeelgebiedenMatrix.eindoordeel.test.tsx — M43 T4 (ADR-18 D4, R4c, R6)
//
// De voettekst van de matrix toont het eindoordeel per deelgebied via de
// S/C-formule over de datapunten van het record (berekenEindoordelen), niet
// het opgeslagen latest-wins deelgebiedScores. Elke fixture zet beide bronnen
// bewust tegenstrijdig.

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import React from 'react';
import { DEELGEBIEDEN } from '../utils/schema';

const { mockRecords } = vi.hoisted(() => ({ mockRecords: { list: [] as any[] } }));

vi.mock('../utils/klassen', async () => {
  const actual = await vi.importActual<typeof import('../utils/klassen')>('../utils/klassen');
  return { ...actual, getAllRecordsForStudent: () => mockRecords.list };
});

import DeelgebiedenMatrix from '../src/components/DeelgebiedenMatrix';

const LABELS = DEELGEBIEDEN.map(dg => dg.label);

// Per label een reeks beoordelingen, elk als eigen datapunt.
function datapuntenVoor(reeks: string[]) {
  return LABELS.flatMap(l => reeks.map((s, i) => ({ vak: 'Resultaten', datapunt: `${l} ${i}`, scores: { [l]: s } })));
}
function allesOp(score: string) {
  return Object.fromEntries(LABELS.map(l => [l, score]));
}

function voettekstChips(container: HTMLElement): string[][] {
  return Array.from(container.querySelectorAll('tfoot tr')).map(tr =>
    Array.from(tr.querySelectorAll('.dm-chip')).map(c => c.textContent || ''),
  );
}

let consoleError: ReturnType<typeof vi.spyOn>;
beforeEach(() => { consoleError = vi.spyOn(console, 'error').mockImplementation(() => {}); });
afterEach(() => { consoleError.mockRestore(); cleanup(); });

describe('DeelgebiedenMatrix — eindoordeel via S/C-formule (M43)', () => {
  it('1 periode: Eindoordeel-rij = formule over het record (G dan O → V), niet latest-wins', () => {
    const record = {
      leerlingId: 'L1', periode: 'BJ2 DD ‐ 2026/2027',
      deelgebiedScores: allesOp('onvoldoende'),
      datapunten: datapuntenVoor(['goed', 'onvoldoende']),
    };
    mockRecords.list = [record];
    const { container } = render(<DeelgebiedenMatrix student={record} leerlingId="L1" />);
    const rijen = voettekstChips(container);
    expect(rijen).toHaveLength(1);
    expect(rijen[0].length).toBeGreaterThan(0);
    expect(new Set(rijen[0])).toEqual(new Set(['V']));
  });

  it('2 periodes: elke voettekstrij = formule over het eigen record (oud O, nieuw V, groei ↑)', () => {
    const oud = {
      leerlingId: 'L1', periode: 'BJ1 DD ‐ 2026/2027',
      deelgebiedScores: allesOp('goed'),                    // latest-wins-bron zegt G
      datapunten: datapuntenVoor(['onvoldoende', 'onvoldoende']), // formule: O
    };
    const nieuw = {
      leerlingId: 'L1', periode: 'BJ2 DD ‐ 2026/2027',
      deelgebiedScores: allesOp('onvoldoende'),             // latest-wins-bron zegt O
      datapunten: datapuntenVoor(['goed', 'onvoldoende']),  // formule: V
    };
    mockRecords.list = [oud, nieuw];
    const { container } = render(<DeelgebiedenMatrix student={nieuw} leerlingId="L1" />);
    const rijen = voettekstChips(container);
    expect(rijen).toHaveLength(2);
    expect(new Set(rijen[0])).toEqual(new Set(['O']));
    expect(new Set(rijen[1])).toEqual(new Set(['V']));
    expect(container.querySelectorAll('tfoot .growth-up').length).toBe(rijen[1].length);
  });

  it('1 periode, 2 records met gelijke periode: Eindoordeel-rij = alleen het student-record (D2)', () => {
    // Normaal onmogelijk (addStudent vervangt per leerlingId + periode), maar als het
    // toch gebeurt telt alleen het getoonde record — niet alle records samengevoegd.
    const oud = { leerlingId: 'L1', periode: 'BJ2 DD ‐ 2026/2027', deelgebiedScores: {}, datapunten: datapuntenVoor(['onvoldoende', 'onvoldoende']) };
    const nieuw = { leerlingId: 'L1', periode: 'BJ2 DD ‐ 2026/2027', deelgebiedScores: {}, datapunten: datapuntenVoor(['goed']) };
    mockRecords.list = [oud, nieuw];
    const { container } = render(<DeelgebiedenMatrix student={nieuw} leerlingId="L1" />);
    const rijen = voettekstChips(container);
    expect(rijen).toHaveLength(1);
    expect(new Set(rijen[0])).toEqual(new Set(['G'])); // samengevoegd zou O+O+G → O geven
  });

  it('voettekstrijen bevatten geen whitespace-tekstnodes direct in <tr> (TODO T-2026-09-22-01)', () => {
    // Oorzaak van de hydration-warning in de browser: `<td /> {/* … */}` laat een
    // spatie als tekstnode in <tr> achter. jsdom logt de React-waarschuwing niet,
    // dus we controleren de DOM zelf.
    const oud = { leerlingId: 'L1', periode: 'BJ1 DD ‐ 2026/2027', deelgebiedScores: {}, datapunten: datapuntenVoor(['voldoende']) };
    const nieuw = { leerlingId: 'L1', periode: 'BJ2 DD ‐ 2026/2027', deelgebiedScores: {}, datapunten: datapuntenVoor(['goed']) };
    for (const lijst of [[nieuw], [oud, nieuw]]) {
      mockRecords.list = lijst;
      const { container } = render(<DeelgebiedenMatrix student={nieuw} leerlingId="L1" />);
      const tekstnodes = Array.from(container.querySelectorAll('tfoot tr')).flatMap(tr =>
        Array.from(tr.childNodes).filter(n => n.nodeType === Node.TEXT_NODE),
      );
      expect(tekstnodes).toEqual([]);
      cleanup();
    }
    expect(consoleError.mock.calls.filter(args => String(args[0]).includes('whitespace'))).toEqual([]);
  });
});

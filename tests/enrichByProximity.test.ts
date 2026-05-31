// tests/enrichByProximity.test.ts — Unit tests for proximity-based status enrichment
// Tests the three matching strategies against synthetic BJ2 PDF line structures.

import { describe, it, expect, vi } from 'vitest';
import { enrichByProximity } from '../parsers/pdf-enrich';

// Suppress the debug console.log output during tests
beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function dp(datapunt: string, status?: string): any {
  return { datapunt, status: status ?? '', scores: {} };
}

// ---------------------------------------------------------------------------
// Strategy 1: status on the same line as the name
// ---------------------------------------------------------------------------

describe('strategy 1 — same-line status', () => {
  it('extracts status when name and status are on the same line', () => {
    const texts = ['- Sportles geven Niet ingeleverd'];
    const datapunten = [dp('- Sportles geven')];
    enrichByProximity(texts, datapunten);
    expect(datapunten[0].status).toBe('Niet ingeleverd');
  });

  it('handles Unicode dash prefix on the line text', () => {
    const texts = ['‐ Observatie doelgroep Op tijd ingeleverd en wel beoordeeld'];
    const datapunten = [dp('‐ Observatie doelgroep')];
    enrichByProximity(texts, datapunten);
    expect(datapunten[0].status).toBe('Op tijd ingeleverd en wel beoordeeld');
  });

  it('skips already-enriched datapunten', () => {
    const texts = ['- Sportles geven Niet ingeleverd'];
    const datapunten = [dp('- Sportles geven', 'Op tijd ingeleverd en wel beoordeeld')];
    enrichByProximity(texts, datapunten);
    expect(datapunten[0].status).toBe('Op tijd ingeleverd en wel beoordeeld');
  });
});

// ---------------------------------------------------------------------------
// Strategy 2: split status ("Op/Te laat ingeleverd en" / "wel beoordeeld")
// ---------------------------------------------------------------------------

describe('strategy 2 — split status across lines', () => {
  it('detects "Op tijd ingeleverd en" on name line + "wel beoordeeld" on next line', () => {
    // BJ2 PDF layout: multi-column rendering splits the status phrase with feed-forward text
    const texts = [
      '- Sportles geven Op tijd ingeleverd en Dit was een goede les, maar je kunt de theorie beter verwerken.',
      'wel beoordeeld Je hebt mooie stappen gezet in de uitvoering.',
    ];
    const datapunten = [dp('- Sportles geven')];
    enrichByProximity(texts, datapunten);
    expect(datapunten[0].status).toBe('Op tijd ingeleverd en wel beoordeeld');
  });

  it('detects "Te laat ingeleverd en" split variant', () => {
    const texts = [
      '- Lesontwerp Te laat ingeleverd en Inventariseer tijdig naar je materialen.',
      'wel beoordeeld Komende periode beter plannen.',
    ];
    const datapunten = [dp('- Lesontwerp')];
    enrichByProximity(texts, datapunten);
    expect(datapunten[0].status).toBe('Te laat ingeleverd en wel beoordeeld');
  });

  it('finds "wel beoordeeld" even two lines after the partial status', () => {
    const texts = [
      '- Uitvoering Te laat ingeleverd en Meer detail nodig in de beschrijving.',
      'Aanvullende feedback van de beoordelaar.',
      'wel beoordeeld Goed werk ondanks de vertraging.',
    ];
    const datapunten = [dp('- Uitvoering')];
    enrichByProximity(texts, datapunten);
    expect(datapunten[0].status).toBe('Te laat ingeleverd en wel beoordeeld');
  });
});

// ---------------------------------------------------------------------------
// Strategy 3: status within the bounded window
// ---------------------------------------------------------------------------

describe('strategy 3 — status within bounded window', () => {
  it('finds status on the immediately following line', () => {
    const texts = [
      '- Sportles geven',
      'Niet ingeleverd',
    ];
    const datapunten = [dp('- Sportles geven')];
    enrichByProximity(texts, datapunten);
    expect(datapunten[0].status).toBe('Niet ingeleverd');
  });

  it('finds status 3 lines after the name', () => {
    const texts = [
      'Sportles geven',
      'Beoordeling door docent',
      'Omschrijving van de les',
      'Niet ingeleverd',
    ];
    const datapunten = [dp('- Sportles geven')];
    enrichByProximity(texts, datapunten);
    expect(datapunten[0].status).toBe('Niet ingeleverd');
  });

  it('finds status exactly 5 lines after the name', () => {
    const texts = [
      '- Lesontwerp',
      'lijn 1',
      'lijn 2',
      'lijn 3',
      'lijn 4',
      'Op tijd ingeleverd en wel beoordeeld',
    ];
    const datapunten = [dp('- Lesontwerp')];
    enrichByProximity(texts, datapunten);
    expect(datapunten[0].status).toBe('Op tijd ingeleverd en wel beoordeeld');
  });

  it('does NOT find status 6+ lines after the name (outside window)', () => {
    const texts = [
      '- Lesontwerp',
      'lijn 1',
      'lijn 2',
      'lijn 3',
      'lijn 4',
      'lijn 5',
      'lijn 6',
      'Op tijd ingeleverd en wel beoordeeld',
    ];
    const datapunten = [dp('- Lesontwerp')];
    enrichByProximity(texts, datapunten);
    expect(datapunten[0].status).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Strategy 4: Zelfevaluatie cross-line split
// ---------------------------------------------------------------------------

describe('strategy 4 — zelfevaluatie cross-line split', () => {
  it('matches "Zelfevaluatie afgerond" when split across two consecutive lines', () => {
    const texts = [
      '- Zelfevaluatie oefenles',
      'Feedback docent',
      'Zelfevaluatie',
      'afgerond',
    ];
    const datapunten = [dp('- Zelfevaluatie oefenles')];
    enrichByProximity(texts, datapunten);
    expect(datapunten[0].status).toBe('Zelfevaluatie afgerond');
  });

  it('matches "Zelfevaluatie, niet afgerond" when split across lines', () => {
    const texts = [
      '- Zelfevaluatie oefenles',
      'Feedback docent',
      'Zelfevaluatie',
      'niet afgerond',
    ];
    const datapunten = [dp('- Zelfevaluatie oefenles')];
    enrichByProximity(texts, datapunten);
    expect(datapunten[0].status).toBe('Zelfevaluatie, niet afgerond');
  });
});

// ---------------------------------------------------------------------------
// Boundary detection: no cross-datapunt status theft
// ---------------------------------------------------------------------------

describe('boundary detection — no cross-datapunt theft', () => {
  it('does NOT steal status from the next datapunt when current has none', () => {
    // "Praktische intervisie" has no status; the next datapunt line starts right after.
    // Without boundary detection it would steal "Beoordeeld" from Try-out semester 1.
    const texts = [
      '- Praktische intervisie',
      '- Try-out semester 1 Te laat ingeleverd en Inventariseer tijdig.',
      'wel beoordeeld',
    ];
    const datapunten = [dp('- Praktische intervisie')];
    enrichByProximity(texts, datapunten);
    expect(datapunten[0].status).toBe('');
  });

  it('correctly picks up the status that belongs to the target datapunt', () => {
    const texts = [
      '- Try-out semester 1 Te laat ingeleverd en Inventariseer tijdig naar je materialen.',
      'wel beoordeeld Komende periode beter plannen.',
      '- Organisatie toernooi Zelfevaluatie',
      'afgerond',
    ];
    const datapunten = [dp('- Try-out semester 1')];
    enrichByProximity(texts, datapunten);
    expect(datapunten[0].status).toBe('Te laat ingeleverd en wel beoordeeld');
  });

  it('correctly enriches both datapunten independently when interleaved', () => {
    const texts = [
      '- Sportles geven Op tijd ingeleverd en Goede les gegeven.',
      'wel beoordeeld Mooie aansluiting bij de leerlijn.',
      '- Observatie doelgroep Niet ingeleverd',
    ];
    const datapunten = [
      dp('- Sportles geven'),
      dp('- Observatie doelgroep'),
    ];
    enrichByProximity(texts, datapunten);
    expect(datapunten[0].status).toBe('Op tijd ingeleverd en wel beoordeeld');
    expect(datapunten[1].status).toBe('Niet ingeleverd');
  });

  it('detects "Niet beoordeelbaar" from same-line text even when window is empty', () => {
    // LOB portfolio: status on same line, next line immediately starts a new datapunt
    const texts = [
      '- LOB portfolio BJ F2 Niet beoordeelbaar niets ingeleverd.',
      '- BGZST',
    ];
    const datapunten = [dp('- LOB portfolio BJ F2')];
    enrichByProximity(texts, datapunten);
    expect(datapunten[0].status).toBe('Niet beoordeelbaar');
  });
});

// ---------------------------------------------------------------------------
// Normalisation: prefix-stripped names still match
// ---------------------------------------------------------------------------

describe('normalisation — prefix variants', () => {
  it('matches plain-text opdracht name (no dash/number prefix in vakken section)', () => {
    // BJ2 PDF: vakken section has plain "Sportles geven" (no Opdracht N: prefix)
    // Datapunt label has dash prefix from deelgebied table
    const texts = [
      'Sportles geven',
      'Op tijd ingeleverd en wel beoordeeld',
    ];
    const datapunten = [dp('- Sportles geven')];
    enrichByProximity(texts, datapunten);
    expect(datapunten[0].status).toBe('Op tijd ingeleverd en wel beoordeeld');
  });

  it('matches "Opdracht N: Name" in vakken section against dash-prefixed datapunt', () => {
    const texts = [
      'Opdracht 2: Uitvoering sportles',
      'Te laat ingeleverd en wel beoordeeld',
    ];
    const datapunten = [dp('- Uitvoering sportles')];
    enrichByProximity(texts, datapunten);
    expect(datapunten[0].status).toBe('Te laat ingeleverd en wel beoordeeld');
  });

  it('matches numbered "N. Name" in vakken section against bare datapunt label', () => {
    const texts = [
      '1. Lesontwerp maken',
      'Niet ingeleverd',
    ];
    const datapunten = [dp('- Lesontwerp maken')];
    enrichByProximity(texts, datapunten);
    expect(datapunten[0].status).toBe('Niet ingeleverd');
  });

  it('matches via substring when line text contains the datapunt key', () => {
    // Line "- LO01 Sportles geven V G O" contains "sportles geven"
    // datapunt key is "sportles geven" (from "- Sportles geven")
    const texts = [
      '- LO01 Sportles geven Niet ingeleverd',
    ];
    const datapunten = [dp('- Sportles geven')];
    enrichByProximity(texts, datapunten);
    expect(datapunten[0].status).toBe('Niet ingeleverd');
  });
});

// ---------------------------------------------------------------------------
// No-match cases
// ---------------------------------------------------------------------------

describe('no-match cases', () => {
  it('leaves status empty when datapunt name does not appear in any line', () => {
    const texts = ['Andere opdracht', 'Niet ingeleverd'];
    const datapunten = [dp('- Sportles geven')];
    enrichByProximity(texts, datapunten);
    expect(datapunten[0].status).toBe('');
  });

  it('leaves status empty when name appears but only scores follow (deelgebied table row)', () => {
    // In the deelgebied table, a row's next lines are other datapunt rows with scores,
    // not status strings — this is the "universal NO MATCH" scenario for pure-table searches
    const texts = [
      '- Sportles geven V G O',  // deelgebied table row (scores on same line)
      '- Observatie doelgroep V G',
      '- Lesontwerp V G O',
    ];
    // The status is embedded after scores on the same line — matchStatus won't find it
    // because the line text contains "v g o" not a real status string
    const datapunten = [dp('- Sportles geven')];
    enrichByProximity(texts, datapunten);
    expect(datapunten[0].status).toBe('');
  });

  it('ignores datapunt names shorter than 4 chars after normalisation', () => {
    const texts = ['AB Op tijd ingeleverd en wel beoordeeld'];
    const datapunten = [dp('- AB')];
    enrichByProximity(texts, datapunten);
    expect(datapunten[0].status).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Multiple datapunten at once
// ---------------------------------------------------------------------------

describe('batch enrichment', () => {
  it('enriches multiple datapunten independently', () => {
    const texts = [
      'Sportles geven',
      'Niet ingeleverd',
      'Observatie doelgroep',
      'Op tijd ingeleverd en wel beoordeeld',
    ];
    const datapunten = [
      dp('- Sportles geven'),
      dp('- Observatie doelgroep'),
    ];
    enrichByProximity(texts, datapunten);
    expect(datapunten[0].status).toBe('Niet ingeleverd');
    expect(datapunten[1].status).toBe('Op tijd ingeleverd en wel beoordeeld');
  });

  it('does not overwrite an already-enriched datapunt when processing others', () => {
    const texts = [
      'Sportles geven',
      'Niet ingeleverd',
    ];
    const datapunten = [
      dp('- Sportles geven', 'Op tijd ingeleverd en wel beoordeeld'), // pre-enriched
    ];
    enrichByProximity(texts, datapunten);
    expect(datapunten[0].status).toBe('Op tijd ingeleverd en wel beoordeeld');
  });
});

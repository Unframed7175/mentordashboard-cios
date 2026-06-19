// tests/datapuntStatus.test.ts — TDD for R-02
import { describe, it, expect } from 'vitest';
import { normalizeDpNaam, buildDpStatusMap, lookupDpStatus } from '../utils/datapuntStatus';

describe('normalizeDpNaam', () => {
  it('strips ASCII hyphen-minus prefix', () => {
    expect(normalizeDpNaam('- Opdracht 1')).toBe('opdracht 1');
  });

  it('strips Unicode HYPHEN (U+2010) prefix used by Cumlaude PDFs', () => {
    expect(normalizeDpNaam('‐ Opdracht 1')).toBe('opdracht 1');
  });

  it('strips en-dash prefix', () => {
    expect(normalizeDpNaam('– Opdracht 2')).toBe('opdracht 2');
  });

  it('does not strip when no leading dash', () => {
    expect(normalizeDpNaam('Opdracht 1')).toBe('opdracht 1');
  });

  it('lowercases and trims', () => {
    expect(normalizeDpNaam('  Opdracht A  ')).toBe('opdracht a');
  });

  it('strips "Opdracht N:" prefix', () => {
    expect(normalizeDpNaam('Opdracht 1: Lesontwerp')).toBe('lesontwerp');
  });

  it('strips "Opdracht N." prefix', () => {
    expect(normalizeDpNaam('Opdracht 2. Uitvoering')).toBe('uitvoering');
  });

  it('strips leading number-dot prefix', () => {
    expect(normalizeDpNaam('1. Lesontwerp')).toBe('lesontwerp');
  });

  it('strips dash + number-dot prefix combined', () => {
    expect(normalizeDpNaam('- 1. Lesontwerp')).toBe('lesontwerp');
  });

  it('strips dash + "Opdracht N:" combined', () => {
    expect(normalizeDpNaam('- Opdracht 1: Lesontwerp')).toBe('lesontwerp');
  });
});

describe('buildDpStatusMap', () => {
  it('returns empty map for empty input', () => {
    expect(buildDpStatusMap([]).size).toBe(0);
  });

  it('maps normalized opdracht naam to status', () => {
    const records = [
      {
        periode: 'BJ2 Fase 1 DD',
        vakken: [
          {
            naam: 'Sport en Beweging',
            opdrachten: [
              { naam: 'Opdracht 1: Lesontwerp', status: 'op tijd ingeleverd en wel beoordeeld' },
              { naam: 'Opdracht 2: Uitvoering',  status: 'te laat ingeleverd en wel beoordeeld' },
            ],
          },
        ],
        datapunten: [],
      },
    ];
    const map = buildDpStatusMap(records);
    // Both strip to bare name after "Opdracht N:" removal
    expect(map.get('lesontwerp')).toBe('op tijd ingeleverd en wel beoordeeld');
    expect(map.get('uitvoering')).toBe('te laat ingeleverd en wel beoordeeld');
  });

  it('dash-stripped datapunt label matches the map key', () => {
    const records = [
      {
        periode: 'BJ2 Fase 1 DD',
        vakken: [
          {
            naam: 'Vak',
            opdrachten: [{ naam: 'Opdracht 1: Lesontwerp', status: 'op tijd ingeleverd en wel beoordeeld' }],
          },
        ],
        datapunten: [{ vak: 'lesgeven', datapunt: '- Opdracht 1: Lesontwerp', scores: {} }],
      },
    ];
    const map = buildDpStatusMap(records);
    const key = normalizeDpNaam('- Opdracht 1: Lesontwerp');
    expect(map.get(key)).toBe('op tijd ingeleverd en wel beoordeeld');
  });

  it('collects statuses from all records (multi-fase)', () => {
    const records = [
      {
        periode: 'BJ2 Fase 1 DD',
        vakken: [{ naam: 'A', opdrachten: [{ naam: 'Opdracht A', status: 'op tijd ingeleverd en wel beoordeeld' }] }],
        datapunten: [],
      },
      {
        periode: 'BJ2 Fase 2 DD',
        vakken: [{ naam: 'B', opdrachten: [{ naam: 'Opdracht B', status: 'niet ingeleverd' }] }],
        datapunten: [],
      },
    ];
    const map = buildDpStatusMap(records);
    expect(map.get('opdracht a')).toBe('op tijd ingeleverd en wel beoordeeld');
    expect(map.get('opdracht b')).toBe('niet ingeleverd');
  });

  it('skips opdrachten with empty status', () => {
    const records = [
      {
        periode: 'BJ1 Fase 1',
        vakken: [{ naam: 'Vak', opdrachten: [{ naam: 'Opdracht X', status: '' }] }],
        datapunten: [],
      },
    ];
    const map = buildDpStatusMap(records);
    expect(map.has('opdracht x')).toBe(false);
  });

  it('skips opdrachten with null/undefined status', () => {
    const records = [
      {
        periode: 'BJ1 Fase 1',
        vakken: [{ naam: 'Vak', opdrachten: [{ naam: 'Opdracht X', status: null }] }],
        datapunten: [],
      },
    ];
    const map = buildDpStatusMap(records);
    expect(map.has('opdracht x')).toBe(false);
  });
});

describe('lookupDpStatus', () => {
  it('returns exact match', () => {
    const map = new Map([['lesontwerp', 'op tijd ingeleverd en wel beoordeeld']]);
    expect(lookupDpStatus(map, '- 1. Lesontwerp')).toBe('op tijd ingeleverd en wel beoordeeld');
  });

  it('returns undefined when no match', () => {
    const map = new Map([['lesontwerp', 'op tijd ingeleverd en wel beoordeeld']]);
    expect(lookupDpStatus(map, '- uitvoering')).toBeUndefined();
  });

  it('substring fallback: datapunt key is contained in map key', () => {
    // datapunt "praktijkles" is substring of opdracht "praktijkles geven aan kinderen"
    const map = new Map([['praktijkles geven aan kinderen', 'op tijd ingeleverd en wel beoordeeld']]);
    expect(lookupDpStatus(map, '- praktijkles')).toBe('op tijd ingeleverd en wel beoordeeld');
  });

  it('substring fallback: map key is contained in datapunt key', () => {
    // code-prefixed label: datapunt "lo01 sportles geven" contains opdracht "sportles geven"
    const map = new Map([['sportles geven', 'te laat ingeleverd en wel beoordeeld']]);
    expect(lookupDpStatus(map, '- LO01 Sportles geven')).toBe('te laat ingeleverd en wel beoordeeld');
  });

  it('does not substring-match on map keys shorter than 4 chars', () => {
    // 'les' (3 chars) is a substring of 'sportles geven' but too short for fallback
    const map = new Map([['les', 'op tijd ingeleverd en wel beoordeeld']]);
    expect(lookupDpStatus(map, 'sportles geven')).toBeUndefined();
  });
});

// tests/datapuntStatus.test.ts — TDD for R-02
import { describe, it, expect } from 'vitest';
import { normalizeDpNaam, buildDpStatusMap } from '../utils/datapuntStatus';

describe('normalizeDpNaam', () => {
  it('strips ASCII hyphen-minus prefix', () => {
    expect(normalizeDpNaam('- Opdracht 1')).toBe('opdracht 1');
  });

  it('strips Unicode HYPHEN (U+2010) prefix used by SomToday PDFs', () => {
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
    expect(map.get('opdracht 1: lesontwerp')).toBe('op tijd ingeleverd en wel beoordeeld');
    expect(map.get('opdracht 2: uitvoering')).toBe('te laat ingeleverd en wel beoordeeld');
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

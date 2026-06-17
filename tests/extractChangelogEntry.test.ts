import { describe, it, expect } from 'vitest';
import { extractLatestChangelogEntry } from '../scripts/extract-changelog-entry.mjs';

const SAMPLE = `# Changelog — Mentordashboard CIOS

## [2.10.2] — 2026-06-17 — Bugfix BJ1 PDF-import: sportvakken-tabel corrumpeerde deelgebiedscores

### Fixed
- **BJ1 PDF-import** — de tabel werd verkeerd gelezen.

## [2.10.1] — 2026-06-17 — Bugfix BJ1 prognose

### Fixed
- Oude regel.
`;

describe('extractLatestChangelogEntry', () => {
  it('haalt het versienummer uit de nieuwste sectie', () => {
    const result = extractLatestChangelogEntry(SAMPLE);
    expect(result.version).toBe('2.10.2');
  });

  it('stopt de body vóór de volgende ## [-sectie', () => {
    const result = extractLatestChangelogEntry(SAMPLE);
    expect(result.body).toContain('BJ1 PDF-import');
    expect(result.body).not.toContain('2.10.1');
    expect(result.body).not.toContain('Oude regel');
  });

  it('geeft de volledige headerregel terug zonder de ## -prefix', () => {
    const result = extractLatestChangelogEntry(SAMPLE);
    expect(result.header).toBe(
      '[2.10.2] — 2026-06-17 — Bugfix BJ1 PDF-import: sportvakken-tabel corrumpeerde deelgebiedscores'
    );
  });

  it('gooit een fout als er geen ## [-sectie gevonden wordt', () => {
    expect(() => extractLatestChangelogEntry('# Changelog\n\nGeen versies hier.')).toThrow();
  });
});

import { describe, it, expect } from 'vitest';
import { extractLatestChangelogEntry, assertVersionMatchesTag } from '../scripts/extract-changelog-entry.mjs';

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

  it('gooit een fout bij een misvormd versienummer (bv. dubbele punt)', () => {
    const malformed = `# Changelog\n\n## [2..10.3] — 2026-06-18 — Test\n\n### Fixed\n- iets\n`;
    expect(() => extractLatestChangelogEntry(malformed)).toThrow();
  });

  it('gooit een fout bij een onvolledig versienummer (geen patch-deel)', () => {
    const malformed = `# Changelog\n\n## [2.10] — 2026-06-18 — Test\n\n### Fixed\n- iets\n`;
    expect(() => extractLatestChangelogEntry(malformed)).toThrow();
  });
});

describe('assertVersionMatchesTag', () => {
  it('slaagt stilletjes als de versie overeenkomt met de tag (met v-prefix)', () => {
    expect(() => assertVersionMatchesTag('2.10.2', 'v2.10.2')).not.toThrow();
  });

  it('gooit een fout als de CHANGELOG-versie afwijkt van de git tag', () => {
    expect(() => assertVersionMatchesTag('2.10.1', 'v2.10.2')).toThrow();
  });
});

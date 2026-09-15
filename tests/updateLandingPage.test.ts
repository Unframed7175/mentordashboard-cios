import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  updateLandingPageHtml,
  changelogBodyToUpdateItems,
  formatDutchDate,
} from '../scripts/update-landing-page.mjs';

const SAMPLE_HTML = `
<nav><span class="nav-version">v2.10.1</span></nav>
<a href="https://github.com/Unframed7175/mentordashboard-cios/releases/download/v2.10.1/Mentordashboard.CIOS_2.10.1_aarch64.dmg">mac arm</a>
<a href="https://github.com/Unframed7175/mentordashboard-cios/releases/download/v2.10.1/Mentordashboard.CIOS_2.10.1_x64.dmg">mac intel</a>
<a href="https://github.com/Unframed7175/mentordashboard-cios/releases/download/v2.10.1/Mentordashboard.CIOS_2.10.1_x64-setup.exe">windows</a>
<div class="updates-list">
  <div class="update-card">
    <div class="update-head">
      <span class="update-version">Versie 2.10.1</span>
      <span class="update-date">17 juni 2026</span>
      <span class="update-new">Nieuwste versie</span>
    </div>
    <div class="update-items"><div class="update-item">oud</div></div>
  </div>
</div>
<footer>Versie 2.10.1 &nbsp;·&nbsp; Gegevens worden nooit gedeeld</footer>
`;

describe('changelogBodyToUpdateItems', () => {
  it('zet ### Fixed-bullets om naar Opgelost-chips', () => {
    const html = changelogBodyToUpdateItems('### Fixed\n- Iets ging mis.');
    expect(html).toContain('chip-changed');
    expect(html).toContain('Opgelost');
    expect(html).toContain('Iets ging mis.');
  });

  it('zet ### Added-bullets om naar Nieuw-chips', () => {
    const html = changelogBodyToUpdateItems('### Added\n- Nieuwe feature.');
    expect(html).toContain('chip-new');
    expect(html).toContain('Nieuw');
  });

  it('zet **vet** om naar <strong>', () => {
    const html = changelogBodyToUpdateItems('### Fixed\n- **Belangrijk** detail.');
    expect(html).toContain('<strong>Belangrijk</strong>');
  });

  it('gooit een fout als er geen herkenbare items zijn', () => {
    expect(() => changelogBodyToUpdateItems('Geen koppen of bullets hier.')).toThrow();
  });

  it('gooit een fout bij een onbekende sectiekop (voorkomt stil verlies van content)', () => {
    expect(() => changelogBodyToUpdateItems('### Security\n- Iets opgelost.')).toThrow();
  });

  it('escaped HTML-metakarakters in changelog-tekst', () => {
    const html = changelogBodyToUpdateItems('### Fixed\n- Gebruik <script> en & tags.');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&amp; tags');
    expect(html).not.toContain('<script>');
  });
});

describe('formatDutchDate', () => {
  it('formatteert een datum in het Nederlands', () => {
    expect(formatDutchDate(new Date(2026, 5, 17))).toBe('17 juni 2026');
  });
});

describe('updateLandingPageHtml', () => {
  const params = {
    version: '2.10.3',
    notesHtml: '        <div class="update-item"><span class="update-chip chip-changed">Opgelost</span>Nieuwe fix.</div>',
    date: '18 juni 2026',
  };

  it('werkt de nav-versiebadge bij', () => {
    const out = updateLandingPageHtml(SAMPLE_HTML, params);
    expect(out).toContain('<span class="nav-version">v2.10.3</span>');
    expect(out).not.toContain('v2.10.1<');
  });

  it('werkt alle drie de downloadlinks bij', () => {
    const out = updateLandingPageHtml(SAMPLE_HTML, params);
    expect(out).toContain('v2.10.3/Mentordashboard.CIOS_2.10.3_aarch64.dmg');
    expect(out).toContain('v2.10.3/Mentordashboard.CIOS_2.10.3_x64.dmg');
    expect(out).toContain('v2.10.3/Mentordashboard.CIOS_2.10.3_x64-setup.exe');
    expect(out).not.toContain('2.10.1_aarch64');
  });

  it('werkt de footer-versie bij', () => {
    const out = updateLandingPageHtml(SAMPLE_HTML, params);
    expect(out).toContain('Versie 2.10.3 &nbsp;');
  });

  it('voegt een nieuwe update-kaart toe met het "Nieuwste versie"-label', () => {
    const out = updateLandingPageHtml(SAMPLE_HTML, params);
    expect(out).toContain('Versie 2.10.3');
    expect(out).toContain('Nieuwe fix.');
  });

  it('verplaatst het "Nieuwste versie"-label weg van de oude kaart', () => {
    const out = updateLandingPageHtml(SAMPLE_HTML, params);
    const matches = out.match(/Nieuwste versie/g) ?? [];
    expect(matches.length).toBe(1);
  });

  it('gooit een fout als de nav-version span niet gevonden wordt', () => {
    const broken = SAMPLE_HTML.replace('nav-version', 'iets-anders');
    expect(() => updateLandingPageHtml(broken, params)).toThrow();
  });

  it('gooit een fout bij een inconsistent versienummer binnen één downloadlink', () => {
    const mismatched = SAMPLE_HTML.replace(
      'v2.10.1/Mentordashboard.CIOS_2.10.1_aarch64.dmg',
      'v2.10.1/Mentordashboard.CIOS_2.10.2_aarch64.dmg'
    );
    expect(() => updateLandingPageHtml(mismatched, params)).toThrow();
  });

  it('gooit een fout als er niet precies 3 downloadlinks gevonden worden', () => {
    const missingOne = SAMPLE_HTML.replace(
      '<a href="https://github.com/Unframed7175/mentordashboard-cios/releases/download/v2.10.1/Mentordashboard.CIOS_2.10.1_x64-setup.exe">windows</a>',
      ''
    );
    expect(() => updateLandingPageHtml(missingOne, params)).toThrow();
  });
});

describe('contract met de M41-doelopbouw van de landingspagina', () => {
  // Fixture volgt S01-PLAN § Design-specificatie: één #installatie-sectie met een paneel per OS.
  // Herstelacties ("Probeer opnieuw", "Andere Mac-versie") zijn knoppen zonder release-URL,
  // anders telt het script meer dan 3 downloadlinks en faalt de release-automatisering.
  const doelopbouw = readFileSync(join(__dirname, 'fixtures', 'landing-doelopbouw.html'), 'utf8');
  const params = {
    version: '2.12.0',
    notesHtml: '        <div class="update-item"><span class="update-chip chip-new">Nieuw</span>Iets nieuws.</div>',
    date: '15 september 2026',
  };

  it('bevat precies drie release-downloadlinks (één per OS-paneel)', () => {
    const links = doelopbouw.match(/releases\/download\/v[\d.]+\/Mentordashboard\.CIOS_/g) ?? [];
    expect(links).toHaveLength(3);
  });

  it('werkt versie, downloadlinks, footer en updates-lijst bij zonder fout', () => {
    const out = updateLandingPageHtml(doelopbouw, params);
    expect(out).toContain('<span class="nav-version">v2.12.0</span>');
    expect(out).toContain('v2.12.0/Mentordashboard.CIOS_2.12.0_x64-setup.exe');
    expect(out).toContain('v2.12.0/Mentordashboard.CIOS_2.12.0_aarch64.dmg');
    expect(out).toContain('v2.12.0/Mentordashboard.CIOS_2.12.0_x64.dmg');
    expect(out).toContain('Versie 2.12.0 &nbsp;');
    expect(out.match(/Nieuwste versie/g) ?? []).toHaveLength(1);
  });

  it('behoudt de ankers #installatie en #download voor bestaande links', () => {
    const out = updateLandingPageHtml(doelopbouw, params);
    expect(out).toContain('id="installatie"');
    expect(out).toContain('id="download"');
  });
});

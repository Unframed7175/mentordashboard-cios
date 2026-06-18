#!/usr/bin/env node
// scripts/update-landing-page.mjs
// Werkt index.html van de losse ciosmentorendashboard-repo bij: nav-versiebadge,
// 3 downloadlinks, footer-versie, en een nieuwe "wat is er nieuw"-kaart.
// CLI: node scripts/update-landing-page.mjs <index-html-path> <version> <changelog-body-path>

import { readFileSync, writeFileSync } from 'node:fs';

const MAANDEN = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december',
];

export function formatDutchDate(d = new Date()) {
  return `${d.getDate()} ${MAANDEN[d.getMonth()]} ${d.getFullYear()}`;
}

const CHIP_MAP = {
  Added: { label: 'Nieuw', cls: 'chip-new' },
  Fixed: { label: 'Opgelost', cls: 'chip-changed' },
  Changed: { label: 'Gewijzigd', cls: 'chip-changed' },
  Removed: { label: 'Verwijderd', cls: 'chip-changed' },
  Breaking: { label: 'Belangrijk', cls: 'chip-changed' },
};

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function changelogBodyToUpdateItems(body) {
  const lines = body.split('\n');
  let currentSection = null;
  const items = [];

  for (const line of lines) {
    const sectionMatch = line.match(/^###\s+(\w+)/);
    if (sectionMatch) {
      currentSection = sectionMatch[1];
      if (!CHIP_MAP[currentSection]) {
        throw new Error(
          `Onbekende changelog-sectiekop "### ${currentSection}" — verwacht een van: ${Object.keys(CHIP_MAP).join(', ')}`
        );
      }
      continue;
    }
    const bulletMatch = line.match(/^-\s+(.*)/);
    if (bulletMatch && currentSection && CHIP_MAP[currentSection]) {
      const { label, cls } = CHIP_MAP[currentSection];
      const text = escapeHtml(bulletMatch[1]).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      items.push(`        <div class="update-item"><span class="update-chip ${cls}">${label}</span>${text}</div>`);
    }
  }

  if (items.length === 0) {
    throw new Error('Geen herkenbare changelog-items gevonden (geen ### Added/Fixed/Changed met - bullets)');
  }
  return items.join('\n');
}

function replaceOrThrow(html, pattern, replacement, description) {
  if (!pattern.test(html)) {
    throw new Error(`update-landing-page: kon "${description}" niet vinden in index.html`);
  }
  return html.replace(pattern, replacement);
}

export function updateLandingPageHtml(html, { version, notesHtml, date }) {
  html = replaceOrThrow(
    html,
    /<span class="nav-version">v[\d.]+<\/span>/,
    `<span class="nav-version">v${version}</span>`,
    'nav-version span'
  );

  const downloadLinkPattern = /v(\d+\.\d+\.\d+)\/Mentordashboard\.CIOS_\1_/g;
  const downloadLinkMatches = html.match(downloadLinkPattern) ?? [];
  if (downloadLinkMatches.length !== 3) {
    throw new Error(
      `update-landing-page: verwachtte 3 downloadlinks met een consistent versienummer, maar vond ${downloadLinkMatches.length} in index.html`
    );
  }
  html = html.replace(downloadLinkPattern, `v${version}/Mentordashboard.CIOS_${version}_`);

  html = replaceOrThrow(
    html,
    /Versie [\d.]+ &nbsp;/,
    `Versie ${version} &nbsp;`,
    'footer-versie'
  );

  html = replaceOrThrow(
    html,
    /\s*<span class="update-new">Nieuwste versie<\/span>/,
    '',
    '"Nieuwste versie"-badge'
  );

  const anchor = '<div class="updates-list">';
  if (!html.includes(anchor)) {
    throw new Error('update-landing-page: kon updates-list container niet vinden in index.html');
  }
  const newCard = `
      <div class="update-card">
        <div class="update-head">
          <span class="update-version">Versie ${version}</span>
          <span class="update-date">${date}</span>
          <span class="update-new">Nieuwste versie</span>
        </div>
        <div class="update-items">
${notesHtml}
        </div>
      </div>`;
  html = html.replace(anchor, anchor + newCard);

  return html;
}

const isMain = process.argv[1] && process.argv[1].endsWith('update-landing-page.mjs');
if (isMain) {
  const [, , htmlPath, version, changelogBodyPath] = process.argv;
  if (!htmlPath || !version || !changelogBodyPath) {
    console.error('Gebruik: node scripts/update-landing-page.mjs <index-html-path> <version> <changelog-body-path>');
    process.exit(1);
  }
  const html = readFileSync(htmlPath, 'utf8');
  const body = readFileSync(changelogBodyPath, 'utf8');
  const notesHtml = changelogBodyToUpdateItems(body);
  const updated = updateLandingPageHtml(html, { version, notesHtml, date: formatDutchDate() });
  writeFileSync(htmlPath, updated, 'utf8');
  console.log(`index.html bijgewerkt naar versie ${version}`);
}

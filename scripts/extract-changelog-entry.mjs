#!/usr/bin/env node
// scripts/extract-changelog-entry.mjs
// Knipt de nieuwste "## [versie] — ..."-sectie uit CHANGELOG.md.
// CLI: node scripts/extract-changelog-entry.mjs <changelog-path> <output-body-path>
// Print de versie (zonder meer) naar stdout; schrijft de body naar output-body-path.

import { readFileSync, writeFileSync } from 'node:fs';

export function extractLatestChangelogEntry(changelogText) {
  const lines = changelogText.split('\n');
  const headerIdx = lines.findIndex(l => /^##\s+\[/.test(l));
  if (headerIdx === -1) {
    throw new Error('Geen "## [versie]"-sectie gevonden in CHANGELOG.md');
  }

  let endIdx = lines.length;
  for (let i = headerIdx + 1; i < lines.length; i++) {
    if (/^##\s+\[/.test(lines[i])) {
      endIdx = i;
      break;
    }
  }

  const headerLine = lines[headerIdx];
  const versionMatch = headerLine.match(/^##\s+\[([\d.]+)\]/);
  if (!versionMatch) {
    throw new Error(`Kan geen versienummer parsen uit headerregel: "${headerLine}"`);
  }

  return {
    version: versionMatch[1],
    header: headerLine.replace(/^##\s+/, '').trim(),
    body: lines.slice(headerIdx + 1, endIdx).join('\n').trim(),
  };
}

const isMain = process.argv[1] && process.argv[1].endsWith('extract-changelog-entry.mjs');
if (isMain) {
  const [, , changelogPath, outBodyPath] = process.argv;
  if (!changelogPath || !outBodyPath) {
    console.error('Gebruik: node scripts/extract-changelog-entry.mjs <changelog-path> <output-body-path>');
    process.exit(1);
  }
  const text = readFileSync(changelogPath, 'utf8');
  const { version, body } = extractLatestChangelogEntry(text);
  writeFileSync(outBodyPath, body, 'utf8');
  process.stdout.write(version);
}

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
  const versionMatch = headerLine.match(/^##\s+\[(\d+\.\d+\.\d+)\]/);
  if (!versionMatch) {
    throw new Error(`Kan geen geldig semver-versienummer parsen uit headerregel: "${headerLine}"`);
  }

  return {
    version: versionMatch[1],
    header: headerLine.replace(/^##\s+/, '').trim(),
    body: lines.slice(headerIdx + 1, endIdx).join('\n').trim(),
  };
}

// Voorkomt dat een vergeten CHANGELOG-update een release met de verkeerde patch notes publiceert:
// de versie die uit CHANGELOG.md wordt geëxtraheerd moet overeenkomen met de git tag van de release.
export function assertVersionMatchesTag(extractedVersion, tagName) {
  const normalizedTag = tagName.replace(/^v/, '');
  if (extractedVersion !== normalizedTag) {
    throw new Error(
      `CHANGELOG.md-versie "${extractedVersion}" komt niet overeen met git tag "${tagName}". ` +
      'Werk CHANGELOG.md bij vóór het taggen van een release.'
    );
  }
}

const isMain = process.argv[1] && process.argv[1].endsWith('extract-changelog-entry.mjs');
if (isMain) {
  const [, , changelogPath, outBodyPath, tagName] = process.argv;
  if (!changelogPath || !outBodyPath) {
    console.error('Gebruik: node scripts/extract-changelog-entry.mjs <changelog-path> <output-body-path> [git-tag]');
    process.exit(1);
  }
  const text = readFileSync(changelogPath, 'utf8');
  const { version, body } = extractLatestChangelogEntry(text);
  if (tagName) assertVersionMatchesTag(version, tagName);
  writeFileSync(outBodyPath, body, 'utf8');
  process.stdout.write(version);
}

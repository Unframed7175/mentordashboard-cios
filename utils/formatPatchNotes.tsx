import React from 'react';

// Kleurcodering voor herkende changelog-secties — hergebruikt de bestaande
// status-tokens (zelfde RAG-kleuren als StatusBadge elders in de app) zodat
// de patch notes visueel aansluiten bij de rest van het design system.
const CHIP_CLASS: Record<string, string> = {
  added: 'patch-chip-added',
  fixed: 'patch-chip-fixed',
  changed: 'patch-chip-changed',
  removed: 'patch-chip-removed',
  breaking: 'patch-chip-breaking',
};

/**
 * Minimale, dependency-vrije formatter voor patch notes uit CHANGELOG.md.
 * Herkent alleen de patronen die daar werkelijk in voorkomen: ### koppen,
 * - bullets (gegroepeerd per opeenvolgend blok), en **vet** binnen een regel.
 */
export function formatPatchNotes(text: string): React.ReactNode {
  const lines = text.split('\n');
  const blocks: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];
  let listKey = 0;

  function flushList() {
    if (listItems.length > 0) {
      blocks.push(<ul key={`ul-${listKey++}`}>{listItems}</ul>);
      listItems = [];
    }
  }

  function renderInline(s: string): React.ReactNode {
    const parts = s.split(/\*\*(.+?)\*\*/g);
    return parts.map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part));
  }

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    const headingMatch = trimmed.match(/^###\s+(.*)/);
    if (headingMatch) {
      flushList();
      const headingText = headingMatch[1];
      const chipClass = CHIP_CLASS[headingText.trim().toLowerCase()];
      blocks.push(<h4 key={`h-${idx}`} className={chipClass}>{headingText}</h4>);
      return;
    }

    const bulletMatch = trimmed.match(/^-\s+(.*)/);
    if (bulletMatch) {
      listItems.push(<li key={`li-${idx}`}>{renderInline(bulletMatch[1])}</li>);
      return;
    }

    flushList();
    blocks.push(<p key={`p-${idx}`}>{renderInline(trimmed)}</p>);
  });
  flushList();

  return <>{blocks}</>;
}

import React from 'react';

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
      blocks.push(<h4 key={`h-${idx}`}>{headingMatch[1]}</h4>);
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

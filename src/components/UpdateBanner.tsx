import React from 'react';

interface Props {
  version: string;
  url: string;
  onDismiss: () => void;
}

export default function UpdateBanner({ version, url, onDismiss }: Props) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 500,
      background: 'var(--accent)',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
      padding: '0.5rem 1rem',
      fontSize: '0.85rem',
      fontWeight: 600,
    }}>
      <span>Nieuwe versie beschikbaar: v{version}</span>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        style={{
          color: '#fff',
          textDecoration: 'underline',
          fontWeight: 700,
          whiteSpace: 'nowrap',
        }}
      >
        Download
      </a>
      <button
        onClick={onDismiss}
        style={{
          position: 'absolute',
          right: '0.75rem',
          background: 'none',
          border: 'none',
          color: '#fff',
          fontSize: '1.1rem',
          cursor: 'pointer',
          lineHeight: 1,
          padding: '0 0.25rem',
        }}
        title="Sluiten"
      >
        ×
      </button>
    </div>
  );
}

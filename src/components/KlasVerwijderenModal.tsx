import React, { useEffect, useState } from 'react';

interface KlasVerwijderenModalProps {
  klasNaam: string;
  leerlingCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function KlasVerwijderenModal({
  klasNaam,
  leerlingCount,
  onConfirm,
  onCancel,
}: KlasVerwijderenModalProps) {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onCancel();
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={handleOverlayClick}
    >
      <div
        style={{
          background: 'var(--bg-surface, #ffffff)',
          borderRadius: '12px',
          padding: '1.5rem',
          width: '100%',
          maxWidth: '400px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        }}
      >
        <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 700 }}>
          Klas verwijderen
        </h2>

        <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem' }}>
          Klas '{klasNaam}' bevat {leerlingCount} leerlingen.
        </p>

        <label
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
            marginBottom: '1.25rem',
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={checked}
            onChange={e => setChecked(e.target.checked)}
            style={{ marginTop: '2px', flexShrink: 0 }}
          />
          Ik begrijp dat alle leerlingdata wordt verwijderd
        </label>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Annuleren
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onConfirm}
            disabled={!checked}
          >
            Verwijderen
          </button>
        </div>
      </div>
    </div>
  );
}

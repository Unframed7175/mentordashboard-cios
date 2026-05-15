import React, { useState } from 'react';
import { createKlas } from '../../utils/klassen';

interface KlasModalProps {
  onCreated: (klasId: string) => void;
  onCancel: () => void;
}

export default function KlasModal({ onCreated, onCancel }: KlasModalProps) {
  const [naam, setNaam] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!naam.trim()) {
      setError('Voer een klasnaam in.');
      return;
    }
    setLoading(true);
    setError(null);
    const result = await createKlas(naam.trim());
    setLoading(false);
    if (result.error === 'duplicate') {
      setError(`Er bestaat al een klas met de naam '${naam.trim()}'.`);
      return;
    }
    if (result.error) {
      setError('Ongeldige naam.');
      return;
    }
    onCreated(result.id);
  }

  function handleOverlayKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      onCancel();
    }
  }

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) {
      onCancel();
    }
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
      onKeyDown={handleOverlayKeyDown}
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
          Nieuwe klas aanmaken
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
              Klasnaam
            </label>
            <input
              type="text"
              value={naam}
              onChange={e => setNaam(e.target.value)}
              required
              style={{ width: '100%', boxSizing: 'border-box' }}
              autoFocus
            />
          </div>
          {/* CR-05: schooljaar field removed — createKlas() does not accept schooljaar yet.
              Re-add when the data model supports it to avoid silently discarding user input. */}
          {error && (
            <p
              style={{
                fontSize: '0.85rem',
                color: 'var(--status-rood-text, #991b1b)',
                margin: '0 0 0.75rem 0',
                minHeight: '1.2em',
              }}
            >
              {error}
            </p>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onCancel}
              disabled={loading}
            >
              Annuleren
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              Klas aanmaken
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

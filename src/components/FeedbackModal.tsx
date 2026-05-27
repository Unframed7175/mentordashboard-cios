import React, { useState } from 'react';
import { buildMailtoUrl } from '../../utils/feedback';
import { openUrl } from '@tauri-apps/plugin-opener';

interface FeedbackModalProps {
  onClose: () => void;
}

export default function FeedbackModal({ onClose }: FeedbackModalProps) {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleVerstuur() {
    if (loading) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const url = await buildMailtoUrl(description.trim());
      await openUrl(url);
      onClose();
    } catch {
      setLoading(false);
      setErrorMsg('E-mail kon niet worden geopend.');
      // do not call onClose — modal stays open, textarea content preserved
    }
  }

  function handleOverlayKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      onClose();
    }
  }

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) {
      onClose();
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
          Fout melden
        </h2>
        <div style={{ marginBottom: '0.75rem' }}>
          <textarea
            className="feedback-modal-textarea"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Beschrijf het probleem (optioneel)"
          />
          {errorMsg && (
            <p
              style={{
                fontSize: '0.85rem',
                color: 'var(--color-danger, #c0392b)',
                margin: '0.25rem 0 0 0',
              }}
            >
              {errorMsg}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
          >
            Annuleren
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleVerstuur}
            disabled={loading}
          >
            Verstuur
          </button>
        </div>
      </div>
    </div>
  );
}

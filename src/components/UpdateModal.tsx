import React, { useState } from 'react';
import { relaunch } from '@tauri-apps/plugin-process';
import { formatPatchNotes } from '../../utils/formatPatchNotes';

interface UpdateModalProps {
  version: string;
  notes: string;
  onDownloadAndInstall: () => Promise<void>;
  onDismiss: () => void;
}

export default function UpdateModal({ version, notes, onDownloadAndInstall, onDismiss }: UpdateModalProps) {
  const [status, setStatus] = useState<'idle' | 'installing' | 'error'>('idle');

  async function handleUpdateNow() {
    setStatus('installing');
    try {
      await onDownloadAndInstall();
      await relaunch();
    } catch (err) {
      console.error('Bijwerken mislukt:', err);
      setStatus('error');
    }
  }

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget && status !== 'installing') onDismiss();
  }

  function handleOverlayKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape' && status !== 'installing') onDismiss();
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
      onKeyDown={handleOverlayKeyDown}
    >
      <div
        style={{
          background: 'var(--bg-surface, #ffffff)',
          borderRadius: '12px',
          padding: '1.5rem',
          width: '100%',
          maxWidth: '480px',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        }}
      >
        <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 700 }}>
          Nieuwe versie beschikbaar: v{version}
        </h2>

        <div style={{ fontSize: '0.875rem', marginBottom: '1.25rem' }}>
          {formatPatchNotes(notes)}
        </div>

        {status === 'error' && (
          <p style={{ fontSize: '0.875rem', color: 'var(--status-rood-text)', marginBottom: '1rem' }}>
            Bijwerken is mislukt. Controleer je internetverbinding en probeer het opnieuw.
          </p>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button type="button" className="btn btn-ghost" onClick={onDismiss} disabled={status === 'installing'}>
            Later
          </button>
          <button type="button" className="btn btn-primary" onClick={handleUpdateNow} disabled={status === 'installing'}>
            {status === 'installing' ? 'Bijwerken…' : 'Update nu'}
          </button>
        </div>
      </div>
    </div>
  );
}

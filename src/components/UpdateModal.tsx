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
    <div className="update-modal-overlay" onClick={handleOverlayClick} onKeyDown={handleOverlayKeyDown}>
      <div className="update-modal-card" role="dialog" aria-modal="true" aria-labelledby="update-modal-title">
        <div className="update-modal-header">
          <div className="update-modal-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} width={22} height={22}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
          </div>
          <div className="update-modal-title-group">
            <h2 id="update-modal-title">Nieuwe versie beschikbaar</h2>
            <span className="update-modal-version">v{version}</span>
          </div>
        </div>

        <div className="update-modal-notes">
          {formatPatchNotes(notes)}
        </div>

        {status === 'error' && (
          <p className="update-modal-error">
            Bijwerken is mislukt. Controleer je internetverbinding en probeer het opnieuw.
          </p>
        )}

        <div className="update-modal-actions">
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

import React, { useState, useEffect } from 'react';
import { actiepuntenStore } from '../../utils/actiepunten';
import { saveKlassen } from '../../utils/klassen';

interface FeedbackActiepuntenSectionProps {
  leerlingId: string;
}

type ApStatus = 'open' | 'opgepakt' | 'herhaling';

interface FormState {
  onderwerp: string;
  datum: string;
  status: ApStatus;
}

const EMPTY_FORM: FormState = { onderwerp: '', datum: '', status: 'open' };

export default function FeedbackActiepuntenSection({ leerlingId }: FeedbackActiepuntenSectionProps) {
  const [actiepunten, setActiepunten] = useState(() => actiepuntenStore.list(leerlingId));
  const [isOpen, setIsOpen] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState>(EMPTY_FORM);
  const [saveError, setSaveError] = useState<string | null>(null);

  // WR-07: re-sync actiepunten when leerlingId changes. useState initializer does not
  // re-run when the parent reuses the same mounted instance with a new leerlingId prop.
  useEffect(() => {
    setActiepunten(actiepuntenStore.list(leerlingId));
    setEditingId(null);
    setFormState(EMPTY_FORM);
  }, [leerlingId]);

  function reloadList() {
    setActiepunten(actiepuntenStore.list(leerlingId));
  }

  async function handleAdd() {
    setSaveError(null);
    try {
      actiepuntenStore.add(leerlingId, formState);
      const saved = await saveKlassen();
      if (saved === false) {
        setSaveError('Opslaan mislukt — controleer schijfruimte of sleutelbeheer');
        return;
      }
      reloadList();
      setEditingId(null);
      setFormState(EMPTY_FORM);
    } catch (e) {
      setSaveError('Onverwachte fout bij opslaan');
    }
  }

  async function handleUpdate(id: string) {
    setSaveError(null);
    try {
      actiepuntenStore.update(leerlingId, id, formState);
      const saved = await saveKlassen();
      if (saved === false) {
        setSaveError('Opslaan mislukt — controleer schijfruimte of sleutelbeheer');
        return;
      }
      reloadList();
      setEditingId(null);
      setFormState(EMPTY_FORM);
    } catch (e) {
      setSaveError('Onverwachte fout bij opslaan');
    }
  }

  async function handleRemove(id: string) {
    setSaveError(null);
    try {
      actiepuntenStore.remove(leerlingId, id);
      const saved = await saveKlassen();
      if (saved === false) {
        setSaveError('Opslaan mislukt — controleer schijfruimte of sleutelbeheer');
        return;
      }
      reloadList();
    } catch (e) {
      setSaveError('Onverwachte fout bij verwijderen');
    }
  }

  function startEdit(ap: any) {
    setEditingId(ap.id);
    setFormState({
      onderwerp: ap.onderwerp || '',
      datum: ap.datum || '',
      status: ap.status || 'open',
    });
    setSaveError(null);
  }

  function startAdd() {
    setEditingId('new');
    setFormState(EMPTY_FORM);
    setSaveError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setFormState(EMPTY_FORM);
    setSaveError(null);
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingId === 'new') {
      handleAdd();
    } else if (editingId) {
      handleUpdate(editingId);
    }
  }

  function statusLabel(status: string): string {
    if (status === 'opgepakt') return 'Opgepakt';
    if (status === 'herhaling') return 'Herhaling';
    return 'Open';
  }

  const form = (
    <form className="ap-form" onSubmit={handleFormSubmit}>
      <input
        type="text"
        className="ap-input-onderwerp"
        placeholder="Onderwerp actiepunt..."
        maxLength={200}
        required
        value={formState.onderwerp}
        onChange={e => setFormState(prev => ({ ...prev, onderwerp: e.target.value }))}
        style={{ width: '100%' }}
      />
      <div className="ap-form-row" style={{ display: 'flex', gap: '8px' }}>
        <input
          type="date"
          className="ap-input-datum"
          value={formState.datum}
          onChange={e => setFormState(prev => ({ ...prev, datum: e.target.value }))}
          style={{ minWidth: '140px' }}
        />
        <select
          className="ap-input-status"
          value={formState.status}
          onChange={e => setFormState(prev => ({ ...prev, status: e.target.value as ApStatus }))}
          style={{ minWidth: '120px' }}
        >
          <option value="open">Open</option>
          <option value="opgepakt">Opgepakt</option>
          <option value="herhaling">Herhaling</option>
        </select>
      </div>
      <div className="ap-form-actions" style={{ display: 'flex', gap: '8px' }}>
        <button type="submit" className="btn btn-primary" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
          Actiepunt opslaan
        </button>
        <button type="button" className="btn btn-ghost" onClick={cancelEdit} style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
          Wijzigingen annuleren
        </button>
      </div>
    </form>
  );

  return (
    <div className="detail-section">
      <div
        className="feedback-header"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
        onClick={() => setIsOpen(o => !o)}
      >
        <p className="detail-section-title" style={{ marginBottom: 0 }}>Feedback &amp; actiepunten</p>
        <span
          style={{
            fontSize: '0.7rem',
            color: '#9ca3af',
            transition: 'transform 0.15s',
            display: 'inline-block',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          &#9660;
        </span>
      </div>

      {isOpen && (
        <div className="feedback-body" style={{ marginTop: '1rem' }}>
          {saveError && (
            <p style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{saveError}</p>
          )}

          {actiepunten.length === 0 && editingId !== 'new' && (
            <p className="ap-empty">Nog geen actiepunten. Voeg een actiepunt toe na het mentorgesprek.</p>
          )}

          {actiepunten.map(ap => (
            editingId === ap.id
              ? <div key={ap.id} className="ap-row">{form}</div>
              : (
                <div
                  key={ap.id}
                  className="ap-row"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', minHeight: '44px', flexWrap: 'wrap' }}
                >
                  <span className="ap-onderwerp" style={{ flex: 1, fontSize: '0.9rem' }}>
                    {ap.onderwerp}
                  </span>
                  <span className="ap-datum" style={{ fontSize: '0.8rem', color: 'var(--text-faint)', marginLeft: 'auto' }}>
                    {ap.datum || ''}
                  </span>
                  <span className={`ap-status-badge ap-status-${ap.status}`}>
                    {statusLabel(ap.status)}
                  </span>
                  <button
                    className="ap-btn-edit btn btn-ghost"
                    style={{ fontSize: '0.8rem' }}
                    onClick={() => startEdit(ap)}
                  >
                    Bewerken
                  </button>
                  <button
                    className="ap-btn-delete btn btn-ghost"
                    style={{ fontSize: '0.8rem' }}
                    onClick={() => handleRemove(ap.id)}
                  >
                    Verwijderen
                  </button>
                </div>
              )
          ))}

          {editingId === 'new' && form}

          {editingId === null && (
            <button
              className="btn btn-ghost ap-btn-add"
              onClick={startAdd}
              style={{ marginTop: '0.5rem' }}
            >
              + Actiepunt toevoegen
            </button>
          )}
        </div>
      )}
    </div>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { saveKlassen, klassenState } from '../../utils/klassen';
import type { Keuzedeel, KdStatus } from '../../utils/keuzedelen';

interface KeuzedeelSectionProps {
  student: any;
  onSaved?: () => void;
}

const STATUS_LABEL: Record<KdStatus, string> = {
  behaald: 'Behaald',
  haalbaar: 'Haalbaar (vóór 1 dec.)',
  niet_behaald: 'Niet behaald / haalbaar',
};

const STATUS_COLOR: Record<KdStatus, string> = {
  behaald: 'var(--status-groen-text)',
  haalbaar: 'var(--rag-oranje)',
  niet_behaald: 'var(--status-rood-text)',
};

function getMatchingRecords(leerlingId: string): any[] {
  if (!klassenState.activeKlasId) return [];
  const klas = klassenState.klassen[klassenState.activeKlasId];
  return klas?.students?.filter((s: any) => s.leerlingId === leerlingId) ?? [];
}

export default function KeuzedeelSection({ student, onSaved }: KeuzedeelSectionProps) {
  const [newNaam, setNewNaam] = useState('');
  const [newStatus, setNewStatus] = useState<KdStatus>('haalbaar');
  const [hint, setHint] = useState<'idle' | 'saved'>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  function flashSaved() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setHint('saved');
    timerRef.current = setTimeout(() => setHint('idle'), 1500);
  }

  async function handleAdd() {
    const naam = newNaam.trim();
    if (!naam) return;
    const records = getMatchingRecords(student.leerlingId);
    if (records.length === 0) return;

    const newKd: Keuzedeel = {
      id: (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2)),
      naam,
      status: newStatus,
    };

    for (const rec of records) {
      if (!Array.isArray(rec.keuzedelen)) rec.keuzedelen = [];
      rec.keuzedelen.push(newKd);
    }

    setNewNaam('');
    setNewStatus('haalbaar');
    const saved = await saveKlassen();
    if (saved !== false) flashSaved();
    onSaved?.();
  }

  async function handleStatusChange(id: string, status: KdStatus) {
    const records = getMatchingRecords(student.leerlingId);
    for (const rec of records) {
      const kd = (rec.keuzedelen as Keuzedeel[] | undefined)?.find(k => k.id === id);
      if (kd) kd.status = status;
    }
    const saved = await saveKlassen();
    if (saved !== false) flashSaved();
    onSaved?.();
  }

  async function handleRemove(id: string) {
    const records = getMatchingRecords(student.leerlingId);
    for (const rec of records) {
      if (Array.isArray(rec.keuzedelen)) {
        rec.keuzedelen = rec.keuzedelen.filter((k: Keuzedeel) => k.id !== id);
      }
    }
    const saved = await saveKlassen();
    if (saved !== false) flashSaved();
    onSaved?.();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleAdd();
  }

  const keuzedelen: Keuzedeel[] = Array.isArray(student.keuzedelen) ? student.keuzedelen : [];

  return (
    <div className="detail-section">
      <p className="detail-section-title">Keuzedelen</p>

      {keuzedelen.map(kd => (
        <div
          key={kd.id}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}
        >
          <span style={{ flex: 1, minWidth: 0, fontWeight: 500, fontSize: '0.9rem' }}>{kd.naam}</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: STATUS_COLOR[kd.status] }}>
            {STATUS_LABEL[kd.status]}
          </span>
          <select
            aria-label={`Status van ${kd.naam}`}
            value={kd.status}
            onChange={e => handleStatusChange(kd.id, e.target.value as KdStatus)}
            style={{ fontSize: '0.8rem', padding: '2px 4px' }}
          >
            <option value="behaald">Behaald</option>
            <option value="haalbaar">Haalbaar (vóór 1 dec.)</option>
            <option value="niet_behaald">Niet behaald / haalbaar</option>
          </select>
          <button
            aria-label={`Verwijder ${kd.naam}`}
            onClick={() => handleRemove(kd.id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: '1rem', padding: '0 4px',
            }}
          >
            ✕
          </button>
        </div>
      ))}

      <div style={{ display: 'flex', gap: '0.4rem', marginTop: keuzedelen.length > 0 ? '0.5rem' : 0, flexWrap: 'wrap' }}>
        <input
          id="kd-nieuw-naam"
          type="text"
          value={newNaam}
          onChange={e => setNewNaam(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Naam keuzedeel..."
          style={{ flex: 1, minWidth: '120px', fontSize: '0.85rem', padding: '4px 8px' }}
        />
        <select
          id="kd-nieuw-status"
          value={newStatus}
          onChange={e => setNewStatus(e.target.value as KdStatus)}
          style={{ fontSize: '0.85rem', padding: '4px 6px' }}
        >
          <option value="behaald">Behaald</option>
          <option value="haalbaar">Haalbaar (vóór 1 dec.)</option>
          <option value="niet_behaald">Niet behaald / haalbaar</option>
        </select>
        <button
          onClick={handleAdd}
          disabled={!newNaam.trim()}
          style={{
            fontSize: '0.85rem', padding: '4px 10px', cursor: newNaam.trim() ? 'pointer' : 'default',
          }}
        >
          + Toevoegen
        </button>
      </div>

      <p
        className="aanvullend-hint"
        style={{ color: hint === 'saved' ? 'var(--status-groen-text)' : undefined }}
      >
        {hint === 'saved' ? 'Opgeslagen' : ''}
      </p>
    </div>
  );
}

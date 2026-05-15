import React, { useState, useEffect, useRef } from 'react';
import { saveKlassen, getAllRecordsForStudent } from '../../utils/klassen';

interface NotitiesTextareaProps {
  student: any;
  leerlingId: string;
}

export default function NotitiesTextarea({ student, leerlingId }: NotitiesTextareaProps) {
  const [value, setValue] = useState<string>(() => {
    // D-14-12: prefer student.notitie (already loaded from data layer)
    if (student.notitie !== undefined) return student.notitie;
    return '';
  });

  const [hint, setHint] = useState<'idle' | 'saved'>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // D-14-12 migration: move legacy localStorage notes into the data layer.
  // Done in a one-time effect so it is not a side-effect inside useState.
  useEffect(() => {
    if (student.notitie !== undefined) return; // already migrated
    const legacy = localStorage.getItem('mentordashboard_notities');
    if (!legacy) return;
    try {
      const parsed = JSON.parse(legacy);
      if (parsed[leerlingId]) {
        const migratedValue = parsed[leerlingId];
        // Write to the record in the data layer (not the prop object)
        const records = getAllRecordsForStudent(leerlingId);
        for (const r of records) {
          if (r === student || r.leerlingId === leerlingId) {
            r.notitie = migratedValue;
          }
        }
        setValue(migratedValue);
        delete parsed[leerlingId];
        if (Object.keys(parsed).length === 0) {
          localStorage.removeItem('mentordashboard_notities');
        } else {
          localStorage.setItem('mentordashboard_notities', JSON.stringify(parsed));
        }
        saveKlassen(); // fire-and-forget migration save
      }
    } catch {
      // ignore parse errors
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leerlingId]);

  function onChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const v = e.target.value;
    setValue(v);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      // Write to the data layer record directly — do NOT mutate the prop object.
      // getAllRecordsForStudent returns references into klas.students, so this
      // updates the persisted data model without touching the prop.
      const records = getAllRecordsForStudent(leerlingId);
      for (const r of records) {
        if (r === student || r.leerlingId === leerlingId) {
          r.notitie = v;
        }
      }
      await saveKlassen();
      setHint('saved');
      setTimeout(() => setHint('idle'), 1500);
    }, 500);
  }

  return (
    <div className="detail-section">
      <p className="detail-section-title">Notities mentorgesprek</p>
      <textarea
        className="notitie-textarea"
        value={value}
        onChange={onChange}
        placeholder="Schrijf hier notities voor dit mentorgesprek..."
        style={{
          width: '100%',
          minHeight: '110px',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          fontSize: '0.9rem',
          resize: 'vertical',
          boxSizing: 'border-box',
        }}
      />
      <p
        className={`notitie-hint${hint === 'saved' ? ' saved' : ''}`}
        style={{
          fontSize: '0.8rem',
          marginTop: '4px',
          color: hint === 'saved' ? '#10b981' : 'transparent',
          minHeight: '1.2em',
        }}
      >
        {hint === 'saved' ? 'Opgeslagen' : ''}
      </p>
    </div>
  );
}

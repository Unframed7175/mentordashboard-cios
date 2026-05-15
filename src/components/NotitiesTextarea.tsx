import React, { useState, useRef } from 'react';
import { saveKlassen } from '../../utils/klassen';

interface NotitiesTextareaProps {
  student: any;
  leerlingId: string;
}

export default function NotitiesTextarea({ student, leerlingId }: NotitiesTextareaProps) {
  const [value, setValue] = useState<string>(() => {
    // D-14-12 migration: prefer student.notitie, fall back to localStorage
    if (student.notitie !== undefined) return student.notitie;
    const legacy = localStorage.getItem('mentordashboard_notities');
    if (legacy) {
      try {
        const parsed = JSON.parse(legacy);
        if (parsed[leerlingId]) {
          student.notitie = parsed[leerlingId];
          delete parsed[leerlingId];
          if (Object.keys(parsed).length === 0) {
            localStorage.removeItem('mentordashboard_notities');
          } else {
            localStorage.setItem('mentordashboard_notities', JSON.stringify(parsed));
          }
          saveKlassen(); // fire-and-forget migration save
          return student.notitie;
        }
      } catch {
        // ignore parse errors
      }
    }
    return '';
  });

  const [hint, setHint] = useState<'idle' | 'saved'>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const v = e.target.value;
    setValue(v);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      student.notitie = v;
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

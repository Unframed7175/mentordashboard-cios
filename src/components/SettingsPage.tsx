// src/components/SettingsPage.tsx — Settings page component (Phase 17 + Phase 18)
// SET-01: dark mode toggle with persistent preference + OS fallback
// SET-02: "Bestanden toevoegen" navigates to ImportPage
// SET-03: Deelgebieden rename + active toggle (Phase 18 plan 04)
// SET-04: Leerlijn dropdown per deelgebied (Phase 18 plan 04)
// POL-01: uses .toggle-switch / .toggle-track / .toggle-thumb CSS classes from Plan 01

import { useEffect, useState, useRef } from 'react';
import { loadSettings, saveSettings, applyTheme, type Theme } from '../../utils/settings';
import { DEELGEBIEDEN } from '../../utils/schema';
import {
  getDeelgebiedenConfig,
  saveDeelgebiedenConfig,
  resetDeelgebiedenConfig,
  type DeelgebiedConfig,
} from '../../utils/deelgebieden';
import {
  getLeerlijnenMapping,
  saveLeerlijnenMapping,
  resetLeerlijnenMapping,
} from '../../utils/leerlijnen';
import { loadVerzuimDrempels, saveVerzuimDrempels } from '../../utils/verzuimDrempels';
import { getBpvConfig, saveBpvConfig, parseBpvExcel, saveBpvData, getBpvData, type BpvConfig, type BpvData } from '../../utils/bpv';

interface SettingsPageProps {
  onBack: () => void;
  onNavigateToImport: () => void;
}

// ── NaamInput: inline text input with blur/Enter apply and Escape revert ──────
interface NaamInputProps {
  id: string;
  label: string;
  onApply: (id: string, newLabel: string) => void;
}

function NaamInput({ id, label, onApply }: NaamInputProps) {
  const [value, setValue] = useState(label);

  // Re-sync local value when label changes externally (e.g. after reset)
  useEffect(() => {
    setValue(label);
  }, [label]);

  function applyIfChanged() {
    const trimmed = value.trim();
    if (trimmed === '' || trimmed === label) {
      // Empty or unchanged — revert to last-saved label
      setValue(label);
      return;
    }
    onApply(id, trimmed);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'Escape') {
      setValue(label);
      (e.target as HTMLInputElement).blur();
    }
  }

  return (
    <input
      type="text"
      className="dg-naam-input"
      value={value}
      onChange={e => setValue(e.target.value)}
      onBlur={applyIfChanged}
      onKeyDown={handleKeyDown}
    />
  );
}

// ── SettingsPage ────────────────────────────────────────────────────────────────

export default function SettingsPage({ onBack, onNavigateToImport }: SettingsPageProps) {
  // Flicker-free initializer: read hydrated body.dark set by main.tsx startup hydration (Plan 03)
  // Using lazy initializer (() => ...) so the document access only happens on first render.
  // typeof guard is defensive for any future SSR scenario — under jsdom document is always defined.
  // Codex MEDIUM "Toggle flicker on open" resolved: toggle is visually correct from first paint.
  const [isDark, setIsDark] = useState<boolean>(
    () => typeof document !== 'undefined' && document.body.classList.contains('dark')
  );

  // Section 3 state — deelgebieden config + leerlijn mapping
  const [dgConfig, setDgConfig] = useState<DeelgebiedConfig[]>([]);
  const [leerlijnenMapping, setLeerlijnenMapping] = useState<Record<string, string>>({});
  const [confirmingReset, setConfirmingReset] = useState(false);

  // Section 4 state — verzuim thresholds (in hours) + BPV config
  const [geoorloofdHours, setGeoorloofdHours] = useState<number>(15);
  const [ongeoorloofdHours, setOngeoorloofdHours] = useState<number>(10);
  const [bpvUren, setBpvUren] = useState<number>(200);
  const [bpvImportError, setBpvImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // On mount: restore saved theme preference
  useEffect(() => {
    (async () => {
      try {
        const saved = await loadSettings();
        if (saved?.theme) {
          // Persisted theme found — apply and sync toggle
          applyTheme(saved.theme);
          setIsDark(saved.theme === 'dark');
        } else {
          // No persisted theme — read OS preference (D-06: do NOT persist this)
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          applyTheme(prefersDark ? 'dark' : 'light');
          setIsDark(prefersDark);
          // D-06 / Pitfall 4: OS preference is NOT persisted — only explicit user choice
        }
      } catch (err) {
        // On load failure: log and leave state as-is (lazy initializer gave sensible default)
        console.warn('[SettingsPage] loadSettings failed:', err);
      }
    })();
  }, []);

  // On mount: load section 3 config (separate from dark-mode effect — different concern)
  useEffect(() => {
    Promise.all([getDeelgebiedenConfig(), getLeerlijnenMapping()])
      .then(([cfg, mapping]) => {
        setDgConfig(cfg);
        setLeerlijnenMapping(mapping);
      })
      .catch(err => console.warn('[SettingsPage] section 3 load failed:', err));
  }, []);

  // On mount: load section 4 config — verzuim drempels + BPV config (separate concern)
  useEffect(() => {
    Promise.all([loadVerzuimDrempels(), getBpvConfig()])
      .then(([drempels, bpvConfig]) => {
        setGeoorloofdHours(Math.round(drempels.geoorloofd / 60));
        setOngeoorloofdHours(Math.round(drempels.ongeoorloofd / 60));
        setBpvUren(bpvConfig.verwachteUren);
      })
      .catch(err => console.warn('[SettingsPage] section 4 load failed:', err));
  }, []);

  // Toggle handler: update DOM + React state + persist (Pitfall 6: must update both atomically)
  async function handleToggle(checked: boolean) {
    const theme: Theme = checked ? 'dark' : 'light';
    applyTheme(theme);   // immediate DOM update
    setIsDark(checked);  // immediate React state update
    await saveSettings({ theme }); // persist to plugin-store
  }

  // Section 3 handlers (instant-apply pattern — state updated before async write)

  async function handleNaamApply(id: string, newLabel: string) {
    const trimmed = newLabel.trim();
    if (!trimmed) return;
    const next = dgConfig.map(c => c.id === id ? { ...c, label: trimmed } : c);
    setDgConfig(next);
    await saveDeelgebiedenConfig(next);
  }

  async function handleLeerlijnChange(id: string, leerlijn: string) {
    const nextMapping = { ...leerlijnenMapping, [id]: leerlijn };
    setLeerlijnenMapping(nextMapping);
    await saveLeerlijnenMapping(nextMapping);
  }

  async function handleActiveToggle(id: string, active: boolean) {
    const next = dgConfig.map(c => c.id === id ? { ...c, active } : c);
    setDgConfig(next);
    await saveDeelgebiedenConfig(next);
  }

  async function handleReset() {
    await Promise.all([resetDeelgebiedenConfig(), resetLeerlijnenMapping()]);
    const [cfg, mapping] = await Promise.all([getDeelgebiedenConfig(), getLeerlijnenMapping()]);
    setDgConfig(cfg);
    setLeerlijnenMapping(mapping);
    setConfirmingReset(false);
  }

  // Section 4 handlers — instant-apply thresholds and BPV config (I2: hours → minutes × 60)

  async function handleGeoorloofdChange(hours: number) {
    const clamped = Math.max(0, Math.min(200, isNaN(hours) ? geoorloofdHours : hours));
    setGeoorloofdHours(clamped);
    await saveVerzuimDrempels({ geoorloofd: clamped * 60, ongeoorloofd: ongeoorloofdHours * 60 });
  }

  async function handleOngeoorloofdChange(hours: number) {
    const clamped = Math.max(0, Math.min(200, isNaN(hours) ? ongeoorloofdHours : hours));
    setOngeoorloofdHours(clamped);
    await saveVerzuimDrempels({ geoorloofd: geoorloofdHours * 60, ongeoorloofd: clamped * 60 });
  }

  async function handleBpvUrenChange(uren: number) {
    const clamped = Math.max(0, Math.min(9999, isNaN(uren) ? bpvUren : uren));
    setBpvUren(clamped);
    await saveBpvConfig({ verwachteUren: clamped });
  }

  async function handleBpvImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so same file can be re-selected
    e.target.value = '';
    try {
      const buffer = await file.arrayBuffer();
      const records = parseBpvExcel(buffer);
      if (records === null || typeof records !== 'object') {
        setBpvImportError('Onbekend BPV-bestandsformaat. Probeer een ander bestand.');
        return;
      }
      const existing = await getBpvData();
      const merged: BpvData = { ...existing, ...records };
      await saveBpvData(merged);
      setBpvImportError(null);
    } catch {
      setBpvImportError('Onbekend BPV-bestandsformaat. Probeer een ander bestand.');
    }
  }

  // Helper: get schema-default leerlijn group for a deelgebied (fallback when not in mapping)
  function schemaDefaultFor(id: string): string {
    return DEELGEBIEDEN.find(d => d.id === id)?.group ?? 'lesgeven';
  }

  return (
    <main className="settings-page">
      {/* Header with back button */}
      <div className="settings-header">
        <button className="detail-nav-btn" onClick={onBack}>← Terug</button>
        <h1>Instellingen</h1>
      </div>

      {/* Section 1: Weergave (dark mode toggle) */}
      <section className="detail-section">
        <h2 className="detail-section-title">Weergave</h2>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label className="toggle-switch">
            <input
              type="checkbox"
              className="sr-only"
              checked={isDark}
              onChange={e => handleToggle(e.target.checked)}
              aria-label="Donkere modus"
            />
            <span className={`toggle-track${isDark ? ' on' : ''}`}>
              <span className="toggle-thumb" />
            </span>
            <span>Donkere modus</span>
          </label>
        </div>
      </section>

      {/* Section 2: Bestanden (add files CTA) */}
      <section className="detail-section">
        <h2 className="detail-section-title">Bestanden</h2>
        <button className="btn btn-primary" onClick={onNavigateToImport}>
          Bestanden toevoegen
        </button>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '8px' }}>
          Voeg PDFs of een verzuim-Excel toe aan de actieve klas.
        </p>
      </section>

      {/* Section 3: Deelgebieden & Leerlijnen (Phase 18 — SET-03 + SET-04) */}
      <section className="detail-section">
        <h2 className="detail-section-title">Deelgebieden &amp; Leerlijnen</h2>
        <div className="dg-settings-table-wrap">
          <table className="dg-settings-table">
            <thead>
              <tr>
                <th>Naam</th>
                <th style={{ width: 160 }}>Leerlijn</th>
                <th style={{ width: 68 }}>Actief</th>
              </tr>
            </thead>
            <tbody>
              {dgConfig.map(row => (
                <tr key={row.id} className="dg-settings-row">
                  <td>
                    <NaamInput id={row.id} label={row.label} onApply={handleNaamApply} />
                  </td>
                  <td>
                    <select
                      className="dg-leerlijn-select"
                      value={leerlijnenMapping[row.id] ?? schemaDefaultFor(row.id)}
                      onChange={e => handleLeerlijnChange(row.id, e.target.value)}
                    >
                      <option value="lesgeven">Lesgeven</option>
                      <option value="organiseren">Organiseren</option>
                      <option value="profHandelen">Prof. handelen</option>
                    </select>
                  </td>
                  <td>
                    <label className="toggle-switch dg-toggle">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={row.active}
                        onChange={e => handleActiveToggle(row.id, e.target.checked)}
                        aria-label={`${row.label} actief`}
                      />
                      <span className={`toggle-track${row.active ? ' on' : ''}`}>
                        <span className="toggle-thumb" />
                      </span>
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!confirmingReset ? (
          <button
            className="btn btn-ghost"
            style={{ marginTop: 8 }}
            onClick={() => setConfirmingReset(true)}
          >
            Herstel standaard
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Alles terugzetten naar standaard?
            </span>
            <button className="btn btn-ghost" onClick={() => setConfirmingReset(false)}>
              Niet herstellen
            </button>
            <button className="btn btn-primary" onClick={handleReset}>
              Ja, herstel
            </button>
          </div>
        )}
      </section>

      {/* Section 4: Drempelwaarden & BPV-uren (Phase 18 — SET-05 + SET-06) */}
      <section className="detail-section">
        <h2 className="detail-section-title">Drempelwaarden &amp; BPV-uren</h2>

        {/* Verzuim drempelwaarden subsection */}
        <div className="settings-threshold-group">
          <div className="settings-threshold-row">
            <label style={{ minWidth: 160 }}>Geoorloofd verzuim waarschuwing</label>
            <input
              type="number"
              className="settings-number-input"
              min={0}
              max={200}
              step={1}
              value={geoorloofdHours}
              onChange={e => handleGeoorloofdChange(Number(e.target.value))}
            />
            <span style={{ color: 'var(--text-muted)' }}>uur</span>
          </div>
          <div className="settings-threshold-row">
            <label style={{ minWidth: 160 }}>Ongeoorloofd verzuim waarschuwing</label>
            <input
              type="number"
              className="settings-number-input"
              min={0}
              max={200}
              step={1}
              value={ongeoorloofdHours}
              onChange={e => handleOngeoorloofdChange(Number(e.target.value))}
            />
            <span style={{ color: 'var(--text-muted)' }}>uur</span>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '16px 0' }} />

        {/* BPV subsection */}
        <div className="settings-threshold-row">
          <label style={{ minWidth: 160 }}>Verwachte BPV-uren per periode</label>
          <input
            type="number"
            className="settings-number-input"
            min={0}
            max={9999}
            step={1}
            value={bpvUren}
            onChange={e => handleBpvUrenChange(Number(e.target.value))}
          />
          <span style={{ color: 'var(--text-muted)' }}>uur</span>
        </div>

        {/* Hidden file input for BPV Excel import */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".xlsx,.xls"
          style={{ display: 'none' }}
          onChange={handleBpvImportFile}
        />
        <button
          className="btn btn-ghost"
          style={{ marginTop: 8 }}
          onClick={() => fileInputRef.current?.click()}
        >
          BPV-uren importeren
        </button>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: 8 }}>
          Importeer de BPV Excel om gerealiseerde uren per leerling bij te houden.
        </p>
        {bpvImportError && (
          <p style={{ fontSize: '0.875rem', color: '#EF4444', marginTop: 8 }}>{bpvImportError}</p>
        )}
      </section>
    </main>
  );
}

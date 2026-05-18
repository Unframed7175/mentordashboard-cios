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

      {/* Section 4: Drempelwaarden & BPV-uren — Phase 18 placeholder (handled by Plan 18-05) */}
      <section className="detail-section">
        <h2 className="detail-section-title">Drempelwaarden &amp; BPV-uren</h2>
        <p className="settings-placeholder-text">Komt in een volgende versie.</p>
      </section>
    </main>
  );
}

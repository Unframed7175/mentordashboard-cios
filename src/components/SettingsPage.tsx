// src/components/SettingsPage.tsx — Settings page component (Phase 17)
// SET-01: dark mode toggle with persistent preference + OS fallback
// SET-02: "Bestanden toevoegen" navigates to ImportPage
// POL-01: uses .toggle-switch / .toggle-track / .toggle-thumb CSS classes from Plan 01

import { useEffect, useState } from 'react';
import { loadSettings, saveSettings, applyTheme, type Theme } from '../../utils/settings';

interface SettingsPageProps {
  onBack: () => void;
  onNavigateToImport: () => void;
}

export default function SettingsPage({ onBack, onNavigateToImport }: SettingsPageProps) {
  // Flicker-free initializer: read hydrated body.dark set by main.tsx startup hydration (Plan 03)
  // Using lazy initializer (() => ...) so the document access only happens on first render.
  // typeof guard is defensive for any future SSR scenario — under jsdom document is always defined.
  // Codex MEDIUM "Toggle flicker on open" resolved: toggle is visually correct from first paint.
  const [isDark, setIsDark] = useState<boolean>(
    () => typeof document !== 'undefined' && document.body.classList.contains('dark')
  );

  // On mount: restore saved preference or fall back to OS preference (D-06)
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

  // Toggle handler: update DOM + React state + persist (Pitfall 6: must update both atomically)
  async function handleToggle(checked: boolean) {
    const theme: Theme = checked ? 'dark' : 'light';
    applyTheme(theme);   // immediate DOM update
    setIsDark(checked);  // immediate React state update
    await saveSettings({ theme }); // persist to plugin-store
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

      {/* Section 3: Deelgebieden & Leerlijnen — Phase 18 placeholder (D-11) */}
      <section className="detail-section">
        <h2 className="detail-section-title">Deelgebieden &amp; Leerlijnen</h2>
        <p className="settings-placeholder-text">Komt in een volgende versie.</p>
      </section>

      {/* Section 4: Drempelwaarden & BPV-uren — Phase 18 placeholder (D-11) */}
      <section className="detail-section">
        <h2 className="detail-section-title">Drempelwaarden &amp; BPV-uren</h2>
        <p className="settings-placeholder-text">Komt in een volgende versie.</p>
      </section>
    </main>
  );
}

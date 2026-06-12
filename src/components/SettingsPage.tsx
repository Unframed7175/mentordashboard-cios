// src/components/SettingsPage.tsx — Settings page component (Phase 17 + Phase 18)
// SET-01: dark mode toggle with persistent preference + OS fallback
// SET-02: "Bestanden toevoegen" navigates to ImportPage
// SET-03: Deelgebieden rename + active toggle (Phase 18 plan 04)
// SET-04: Leerlijn dropdown per deelgebied (Phase 18 plan 04)
// POL-01: uses .toggle-switch / .toggle-track / .toggle-thumb CSS classes from Plan 01

import { useEffect, useState, useRef } from 'react';
import { getVersion } from '@tauri-apps/api/app';
import { saveSettings, applyTheme, type Theme } from '../../utils/settings';
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
import { loadNormen, saveNormen, resetNormen, DEFAULT_NORMEN, type Normen } from '../../utils/normen';
import { buildBackupPayload } from '../../utils/backup';
import { factoryReset } from '../../utils/reset';
import { checkForUpdate, type UpdateInfo } from '../../utils/updateCheck';

interface SettingsPageProps {
  onBack: () => void;
  onNavigateToImport: () => void;
  isDark: boolean;
  onToggleDark: (isDark: boolean) => void;
  onNormenChanged: () => void;
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

// ── WisDialoog: fabrieksreset-bevestiging (M36 T4/DT1/DT2) ─────────────────────
// Hiërarchie: begrijpen → vangnet → frictie → actie (design review 2026-06-12).
// Succes heeft geen eigen UI — factoryReset() herlaadt de app in de wizard.

interface WisDialoogProps {
  onCancel: () => void;
  onBackup: () => void;
  backupExporting: boolean;
}

function WisDialoog({ onCancel, onBackup, backupExporting }: WisDialoogProps) {
  const [invoer, setInvoer] = useState('');
  const [wissenBezig, setWissenBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  async function handleWissen() {
    if (wissenBezig) return; // dubbelklik-guard
    setWissenBezig(true);
    setFout(null);
    const result = await factoryReset();
    if (!result.success) {
      // Faalpad: data intact (utils/reset garandeert dat) — controls weer actief
      setFout(result.message);
      setWissenBezig(false);
    }
  }

  const invoerGeldig = invoer === 'WISSEN';

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
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="wis-dialoog-titel"
        style={{
          background: 'var(--bg-surface, #ffffff)',
          borderRadius: '12px',
          padding: '1.5rem',
          width: '100%',
          maxWidth: '440px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        }}
      >
        <h2 id="wis-dialoog-titel" style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 700 }}>
          Alle gegevens wissen
        </h2>
        <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem' }}>
          Dit verwijdert definitief van deze computer:
        </p>
        <ul
          style={{
            margin: '0 0 1rem 0',
            padding: '0.75rem 1rem 0.75rem 2rem',
            background: 'var(--status-rood-bg)',
            color: 'var(--status-rood-text)',
            borderRadius: '8px',
            fontSize: '0.875rem',
          }}
        >
          <li>alle klassen en leerlinggegevens (incl. notities en actiepunten)</li>
          <li>BPV-uren en plaatsingen</li>
          <li>normen, drempels en instellingen</li>
        </ul>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: 'var(--bg-surface-alt, #f5f5f5)',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
          }}
        >
          <p style={{ margin: 0, fontSize: '0.875rem', flex: 1 }}>
            Maak eerst een versleutelde back-up — daarmee zet je alles terug via het importscherm.
          </p>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onBackup}
            disabled={backupExporting || wissenBezig}
            style={{ flexShrink: 0 }}
          >
            {backupExporting ? 'Exporteren…' : 'Back-up maken'}
          </button>
        </div>
        {fout && (
          <p
            role="alert"
            style={{
              background: 'var(--status-rood-bg)',
              color: 'var(--status-rood-text)',
              borderRadius: '8px',
              padding: '0.5rem 0.75rem',
              fontSize: '0.875rem',
              margin: '0 0 1rem 0',
            }}
          >
            {fout}
          </p>
        )}
        <label
          htmlFor="wis-bevestiging"
          style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.375rem' }}
        >
          Typ WISSEN om te bevestigen
        </label>
        <input
          id="wis-bevestiging"
          type="text"
          placeholder="WISSEN"
          value={invoer}
          onChange={e => setInvoer(e.target.value)}
          disabled={wissenBezig}
          style={{ width: '100%', boxSizing: 'border-box', marginBottom: '1.25rem' }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={wissenBezig}>
            Annuleren
          </button>
          <button
            type="button"
            className="btn"
            onClick={handleWissen}
            disabled={!invoerGeldig || wissenBezig || backupExporting}
            style={{
              background: invoerGeldig && !wissenBezig && !backupExporting ? '#DC2626' : '#FCA5A5',
              color: invoerGeldig && !wissenBezig && !backupExporting ? '#FFFFFF' : '#7F1D1D',
              border: 'none',
            }}
          >
            Definitief wissen
          </button>
        </div>
      </div>
    </div>
  );
}

// ── SettingsPage ────────────────────────────────────────────────────────────────

export default function SettingsPage({ onBack, onNavigateToImport, isDark, onToggleDark, onNormenChanged }: SettingsPageProps) {

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

  // Section 5 state — doorstroom normen
  const [normen, setNormen] = useState<Normen>(DEFAULT_NORMEN);
  const [confirmingResetNormen, setConfirmingResetNormen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Section 6 state — over / versie / update
  const [appVersion, setAppVersion] = useState<string>('');
  const [backupExporting, setBackupExporting] = useState(false);
  const [updateChecking, setUpdateChecking] = useState(false);
  const [updateResult, setUpdateResult] = useState<UpdateInfo | 'uptodate' | 'error' | null>(null);

  // Section 7 state — gevarenzone (M36 fabrieksreset)
  const [wisDialoogOpen, setWisDialoogOpen] = useState(false);

  // On mount: load app version for Section 6
  useEffect(() => {
    getVersion().then(setAppVersion).catch(() => setAppVersion(''));
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

  // On mount: load section 5 config — doorstroom normen
  useEffect(() => {
    loadNormen().then(setNormen).catch(err => console.warn('[SettingsPage] section 5 load failed:', err));
  }, []);

  // Toggle handler: update DOM + persist + notify parent (Pitfall 6: must update DOM atomically)
  async function handleToggle(checked: boolean) {
    const theme: Theme = checked ? 'dark' : 'light';
    applyTheme(theme);   // immediate DOM update
    await saveSettings({ theme }); // persist to plugin-store
    const nextIsDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    onToggleDark(nextIsDark); // notify App.tsx to mirror the value
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

  // Section 5 handlers — doorstroom normen (D-06, D-07, D-09, D-10)

  async function handleNormenBlur(field: keyof Normen, rawValue: number, min: number, max: number) {
    const rounded = Math.round(Number.isFinite(rawValue) ? rawValue : DEFAULT_NORMEN[field]);
    const clamped = Math.max(min, Math.min(max, rounded));
    const updated = { ...normen, [field]: clamped };
    setNormen(updated);
    const ok = await saveNormen(updated);
    if (!ok) {
      console.error('[SettingsPage] saveNormen returned false — doorstroom norm niet opgeslagen');
      setSaveError('Opslaan mislukt. Probeer het opnieuw.');
      return;
    }
    setSaveError(null);
    onNormenChanged();
  }

  async function handleResetNormen() {
    const fresh = await resetNormen();
    setNormen(fresh);
    setConfirmingResetNormen(false);
    setSaveError(null);
    onNormenChanged();
  }

  // Section 6 handlers — backup export + update check

  async function handleBackupExport() {
    setBackupExporting(true);
    try {
      const payload = await buildBackupPayload();
      const blob = new Blob([payload], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_mentordashboard_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // silent fail — Tauri not available in browser
    } finally {
      setBackupExporting(false);
    }
  }

  async function handleCheckUpdate() {
    setUpdateChecking(true);
    setUpdateResult(null);
    try {
      const info = await checkForUpdate();
      setUpdateResult(info ?? 'uptodate');
    } catch {
      setUpdateResult('error');
    } finally {
      setUpdateChecking(false);
    }
  }

  // SBC < SBL warning predicate (D-10)
  const sbcWaarschuwing = normen.sbc < normen.sbl;

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

      {/* Section 2: Bestanden (add files CTA + backup export) */}
      <section className="detail-section">
        <h2 className="detail-section-title">Bestanden</h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={onNavigateToImport}>
            Bestanden toevoegen
          </button>
          <button
            className="btn btn-ghost"
            onClick={handleBackupExport}
            disabled={backupExporting}
          >
            {backupExporting ? 'Exporteren…' : 'Backup exporteren'}
          </button>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '8px' }}>
          Voeg PDFs of een verzuim-Excel toe, of exporteer een versleutelde backup van alle data.
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
                      <option value="prof_handelen">Prof. handelen</option>
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
          <p style={{ fontSize: '0.875rem', color: 'var(--status-rood-text)', marginTop: 8 }}>{bpvImportError}</p>
        )}
      </section>

      {/* Section 5: Phase 25 — NORM-01..07 */}
      <section className="detail-section">
        <h2 className="detail-section-title">Doorstroomdrempels</h2>
        {saveError && (
          <p style={{ fontSize: '0.875rem', color: 'var(--status-rood-text)', marginTop: 4 }} role="alert">{saveError}</p>
        )}

        {/* Sub-block 1 */}
        <p className="settings-sub-heading">BJ2-drempels</p>
        <div className="settings-threshold-group">
          <div className="settings-threshold-row">
            <label htmlFor="norm-sbl">SBL-drempel (≥V)</label>
            <input
              type="number"
              className="settings-number-input"
              id="norm-sbl"
              min={1}
              max={19}
              step={1}
              value={normen.sbl}
              onChange={e => setNormen(n => ({ ...n, sbl: Number(e.target.value) }))}
              onBlur={e => handleNormenBlur('sbl', Number((e.target as HTMLInputElement).value), 1, 19)}
              onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
            />
            <span className="text-muted">≥V</span>
          </div>
          <div className="settings-threshold-row">
            <label htmlFor="norm-sbc">SBC-drempel (≥V)</label>
            <input
              type="number"
              className="settings-number-input"
              id="norm-sbc"
              min={1}
              max={19}
              step={1}
              value={normen.sbc}
              onChange={e => setNormen(n => ({ ...n, sbc: Number(e.target.value) }))}
              onBlur={e => handleNormenBlur('sbc', Number((e.target as HTMLInputElement).value), 1, 19)}
              onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
            />
            <span className="text-muted">≥V</span>
          </div>
          {sbcWaarschuwing && (
            <p className="norm-warning" role="status">
              Let op: SBC-drempel is normaal hoger dan SBL-drempel (standaard: 15 vs 13).
            </p>
          )}
          <div className="settings-threshold-row">
            <label htmlFor="norm-negatiefTotaal">Negatief totaal (O)</label>
            <input
              type="number"
              className="settings-number-input"
              id="norm-negatiefTotaal"
              min={1}
              max={19}
              step={1}
              value={normen.negatiefTotaal}
              onChange={e => setNormen(n => ({ ...n, negatiefTotaal: Number(e.target.value) }))}
              onBlur={e => handleNormenBlur('negatiefTotaal', Number((e.target as HTMLInputElement).value), 1, 19)}
              onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
            />
            <span className="text-muted">O totaal</span>
          </div>
          <div className="settings-threshold-row">
            <label htmlFor="norm-negatiefPerLeerlijn">Negatief per leerlijn (O)</label>
            <input
              type="number"
              className="settings-number-input"
              id="norm-negatiefPerLeerlijn"
              min={1}
              max={6}
              step={1}
              value={normen.negatiefPerLeerlijn}
              onChange={e => setNormen(n => ({ ...n, negatiefPerLeerlijn: Number(e.target.value) }))}
              onBlur={e => handleNormenBlur('negatiefPerLeerlijn', Number((e.target as HTMLInputElement).value), 1, 6)}
              onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
            />
            <span className="text-muted">O per leerlijn</span>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '16px 0' }} />

        {/* Sub-block 2 */}
        <p className="settings-sub-heading">BJ1-drempels</p>
        <div className="settings-threshold-group">
          <div className="settings-threshold-row">
            <label htmlFor="norm-bj1Positief">BJ1-positief drempel (≥V)</label>
            <input
              type="number"
              className="settings-number-input"
              id="norm-bj1Positief"
              min={1}
              max={19}
              step={1}
              value={normen.bj1Positief}
              onChange={e => setNormen(n => ({ ...n, bj1Positief: Number(e.target.value) }))}
              onBlur={e => handleNormenBlur('bj1Positief', Number((e.target as HTMLInputElement).value), 1, 19)}
              onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
            />
            <span className="text-muted">≥V</span>
          </div>
          <div className="settings-threshold-row">
            <label htmlFor="norm-versneldLesgeven">Versneld-SBC lesgeven (≥G)</label>
            <input
              type="number"
              className="settings-number-input"
              id="norm-versneldLesgeven"
              min={1}
              max={6}
              step={1}
              value={normen.versneldLesgeven}
              onChange={e => setNormen(n => ({ ...n, versneldLesgeven: Number(e.target.value) }))}
              onBlur={e => handleNormenBlur('versneldLesgeven', Number((e.target as HTMLInputElement).value), 1, 6)}
              onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
            />
            <span className="text-muted">≥G</span>
          </div>
          <div className="settings-threshold-row">
            <label htmlFor="norm-versneldOrganiseren">Versneld-SBC organiseren (≥G)</label>
            <input
              type="number"
              className="settings-number-input"
              id="norm-versneldOrganiseren"
              min={1}
              max={6}
              step={1}
              value={normen.versneldOrganiseren}
              onChange={e => setNormen(n => ({ ...n, versneldOrganiseren: Number(e.target.value) }))}
              onBlur={e => handleNormenBlur('versneldOrganiseren', Number((e.target as HTMLInputElement).value), 1, 6)}
              onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
            />
            <span className="text-muted">≥G</span>
          </div>
          <div className="settings-threshold-row">
            <label htmlFor="norm-versneldProfHandelen">Versneld-SBC prof. handelen (≥G)</label>
            <input
              type="number"
              className="settings-number-input"
              id="norm-versneldProfHandelen"
              min={1}
              max={6}
              step={1}
              value={normen.versneldProfHandelen}
              onChange={e => setNormen(n => ({ ...n, versneldProfHandelen: Number(e.target.value) }))}
              onBlur={e => handleNormenBlur('versneldProfHandelen', Number((e.target as HTMLInputElement).value), 1, 6)}
              onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
            />
            <span className="text-muted">≥G</span>
          </div>
        </div>

        {/* Two-step reset button — Section 3 pattern (D-02) */}
        {!confirmingResetNormen ? (
          <button
            className="btn btn-ghost"
            style={{ marginTop: 8 }}
            onClick={() => setConfirmingResetNormen(true)}
          >
            Herstel standaard
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Alles terugzetten naar CIOS-standaard?
            </span>
            <button className="btn btn-ghost" onClick={() => setConfirmingResetNormen(false)}>
              Niet herstellen
            </button>
            <button className="btn btn-primary" onClick={handleResetNormen}>
              Ja, herstel
            </button>
          </div>
        )}
      </section>
      {/* Section 6: Over — versienummer + update check */}
      <section className="detail-section">
        <h2 className="detail-section-title">Over</h2>
        {appVersion && (
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Versie {appVersion}
          </p>
        )}
        <button
          className="btn btn-ghost"
          onClick={handleCheckUpdate}
          disabled={updateChecking}
        >
          {updateChecking ? 'Controleren…' : 'Controleer op updates'}
        </button>
        {updateResult === 'uptodate' && (
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            Je hebt de nieuwste versie.
          </p>
        )}
        {updateResult === 'error' && (
          <p style={{ fontSize: '0.875rem', color: 'var(--status-rood-text)', marginTop: '8px' }}>
            Update-check mislukt. Controleer je internetverbinding.
          </p>
        )}
        {updateResult !== null && typeof updateResult === 'object' && (
          <p style={{ fontSize: '0.875rem', marginTop: '8px' }}>
            Nieuwe versie beschikbaar: v{updateResult.version}.{' '}
            <a
              href={updateResult.url}
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--accent)', fontWeight: 600 }}
            >
              Download
            </a>
          </p>
        )}
      </section>

      {/* Section 7: Gevarenzone — fabrieksreset (M36, ADR-13) */}
      <section className="detail-section" style={{ borderColor: '#FCA5A5' }}>
        <h2 className="detail-section-title" style={{ color: 'var(--status-rood-text)' }}>
          Gevarenzone
        </h2>
        <p style={{ fontSize: '0.875rem', marginBottom: '12px' }}>
          Verwijdert alle klassen, leerlinggegevens, BPV-data en instellingen van deze computer.
          De app start daarna opnieuw met de aanmaak-wizard.
        </p>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setWisDialoogOpen(true)}
          style={{ color: '#DC2626', borderColor: '#DC2626' }}
        >
          Alle gegevens wissen…
        </button>
      </section>

      {wisDialoogOpen && (
        <WisDialoog
          onCancel={() => setWisDialoogOpen(false)}
          onBackup={handleBackupExport}
          backupExporting={backupExporting}
        />
      )}
    </main>
  );
}

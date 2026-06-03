import React, { useState, useRef, useEffect } from 'react';
import { createKlas, switchActiveKlas, saveKlassen } from '../../utils/klassen';
import { parseSinglePDF } from '../../parsers/pdf';
import { parseExcelFile } from '../../parsers/excel';
import { addStudent, mergeVerzuim } from '../../utils/datamodel';
import { parseBpvExcel, saveBpvData, getBpvData } from '../../utils/bpv';
import { loadVerzuimDrempels, saveVerzuimDrempels, DEFAULT_VERZUIM_DREMPELS } from '../../utils/verzuimDrempels';

interface HelpContent {
  title: string;
  videoSrc: string;
  tekst: string[];
}

const HELP_CONTENT: Record<number, HelpContent> = {
  2: {
    title: "Voortgang PDF's exporteren uit SomToday",
    videoSrc: '/help/stap2-pdf.mov',
    tekst: [
      'Open SomToday en ga naar het menu Leerlingen.',
      "Selecteer de leerlingen van jouw klas en klik op 'Rapportage'.",
      "Kies 'Voortgang' als rapporttype.",
      'Download de PDF per leerling en upload alle bestanden hier in de wizard.',
    ],
  },
  3: {
    title: 'Verzuim Excel exporteren uit SomToday',
    videoSrc: '/help/stap3-verzuim.mov',
    tekst: [
      'Open SomToday en ga naar Registratie → Absenties.',
      'Stel de gewenste periode in (bijv. heel schooljaar).',
      "Klik op het export-icoon rechtsboven en kies 'Excel'.",
      'Sla het bestand op en upload het hier in de wizard.',
    ],
  },
  4: {
    title: 'Stage Excel exporteren uit SomToday (BPV)',
    videoSrc: '/help/stap4-bpv.mov',
    tekst: [
      'Open SomToday en ga naar BPV → Logboek voortgang.',
      'Selecteer alle leerlingen van jouw klas.',
      "Klik op 'Exporteren' en kies het Excel-formaat.",
      'Upload het gedownloade bestand hier in de wizard.',
    ],
  },
};

function VideoWithFallback({ src }: { src: string }) {
  const [hasVideo, setHasVideo] = useState(true);
  if (!src || !hasVideo) {
    return (
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: '0.25rem 0' }}>
        Video binnenkort beschikbaar
      </p>
    );
  }
  return (
    <video
      src={src}
      controls
      style={{ width: '100%', borderRadius: '8px', background: '#000', display: 'block' }}
      onError={() => setHasVideo(false)}
    />
  );
}

interface OnboardingWizardProps {
  onComplete: (klasId: string) => void;
  onAbort?: () => void;
}

const STEP_TITLES: Record<number, string> = {
  1: 'Welkom bij Mentordashboard CIOS',
  2: 'Voortgang PDFs uploaden',
  3: 'Verzuim Excel uploaden',
  4: 'Stage Excel uploaden (BPV)',
  5: 'Instellingen (optioneel)',
  6: 'Klaar om te beginnen',
};

const STEP_SUBS: Record<number, string> = {
  1: 'Maak je eerste klas aan om te beginnen.',
  2: 'Upload de voortgang PDF(s) van je leerlingen. Je kunt meerdere bestanden tegelijk uploaden.',
  3: 'Upload de verzuim Excel vanuit SomToday. Dit is optioneel — je kunt dit later doen.',
  4: 'Upload de stage Excel (BPV-logboek) van je leerlingen. Dit is optioneel — je kunt dit later doen.',
  5: 'Stel drempelwaarden in voor verzuimwaarschuwingen. Je kunt dit overslaan — de standaardwaarden worden dan gebruikt.',
  6: 'Je klas is aangemaakt en je gegevens zijn geladen. Je kunt nu aan de slag!',
};

export default function OnboardingWizard({ onComplete, onAbort }: OnboardingWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [klasId, setKlasId] = useState<string | null>(null);
  const [klasNaamInput, setKlasNaamInput] = useState('');
  const [pdfsUploaded, setPdfsUploaded] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [stepMsg, setStepMsg] = useState('');
  const [stepErr, setStepErr] = useState('');
  const [geoorloofdHours, setGeoorloofdHours] = useState<number>(() => Math.round(DEFAULT_VERZUIM_DREMPELS.geoorloofd / 60));
  const [ongeoorloofdHours, setOngeoorloofdHours] = useState<number>(() => Math.round(DEFAULT_VERZUIM_DREMPELS.ongeoorloofd / 60));
  const [helpStep, setHelpStep] = useState<number | null>(null);

  const pdfRef = useRef<HTMLInputElement>(null);
  const xlsRef = useRef<HTMLInputElement>(null);
  const bpvRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadVerzuimDrempels().then(d => {
      setGeoorloofdHours(Math.round(d.geoorloofd / 60));
      setOngeoorloofdHours(Math.round(d.ongeoorloofd / 60));
    }).catch(() => { /* gebruik defaults */ });
  }, []);

  function clearFeedback() {
    setStepMsg('');
    setStepErr('');
  }

  function nextStep() {
    setStep(s => Math.min(6, s + 1) as 1 | 2 | 3 | 4 | 5 | 6);
    clearFeedback();
  }

  async function handleCreateKlas() {
    const naam = klasNaamInput.trim();
    if (!naam) {
      setStepErr('Voer een klasnaam in.');
      return;
    }
    if (processing) return;
    setProcessing(true);
    clearFeedback();
    try {
      const result = await createKlas(naam);
      if (result && !result.error) {
        await switchActiveKlas(result.id);
        setKlasId(result.id);
        nextStep();
      } else {
        const errMsg = result?.error ?? '';
        if (errMsg.includes('duplicate') || errMsg.includes('bestaat')) {
          setStepErr(`Klas "${naam}" bestaat al.`);
        } else {
          setStepErr('Klas aanmaken mislukt.');
        }
      }
    } catch {
      setStepErr('Klas aanmaken mislukt.');
    } finally {
      setProcessing(false);
    }
  }

  async function handlePDFs(files: File[]) {
    if (files.length === 0 || processing) return;
    setProcessing(true);
    clearFeedback();
    let ok = 0;
    for (const f of files) {
      try {
        addStudent(await parseSinglePDF(f));
        ok++;
      } catch {
        // skip failed file
      }
    }
    await saveKlassen();
    setProcessing(false);
    if (ok > 0) {
      setPdfsUploaded(n => n + ok);
      setStepMsg(`${ok} PDF${ok > 1 ? 's' : ''} verwerkt`);
    } else {
      setStepErr('Geen geldige PDFs gevonden.');
    }
  }

  async function handleVerzuimExcel(file: File) {
    if (processing) return;
    setProcessing(true);
    clearFeedback();
    try {
      mergeVerzuim(await parseExcelFile(file));
      await saveKlassen();
      setStepMsg('Verzuim verwerkt');
    } catch (e: any) {
      setStepErr('Verwerking mislukt: ' + (e?.message ?? String(e)));
    } finally {
      setProcessing(false);
    }
  }

  async function handleBpvExcel(file: File) {
    if (processing) return;
    setProcessing(true);
    clearFeedback();
    try {
      const buf = await file.arrayBuffer();
      const data = parseBpvExcel(buf);
      await saveBpvData({ ...(await getBpvData()), ...data });
      setStepMsg('BPV-data verwerkt');
    } catch (e: any) {
      setStepErr('Verwerking mislukt: ' + (e?.message ?? String(e)));
    } finally {
      setProcessing(false);
    }
  }

  async function handleSaveDrempels() {
    if (processing) return;
    setProcessing(true);
    clearFeedback();
    try {
      await saveVerzuimDrempels({ geoorloofd: geoorloofdHours * 60, ongeoorloofd: ongeoorloofdHours * 60 });
      nextStep();
    } catch (e: any) {
      setStepErr('Opslaan mislukt: ' + (e?.message ?? String(e)));
    } finally {
      setProcessing(false);
    }
  }

  function dropProps(
    handler: (files: File[]) => void,
    exts: string[]
  ): React.HTMLAttributes<HTMLDivElement> {
    return {
      onDragOver: (e) => e.preventDefault(),
      onDrop: (e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files).filter(f =>
          exts.some(ext => f.name.toLowerCase().endsWith(ext))
        );
        if (files.length) handler(files);
      },
    };
  }

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card">
        {/* Progress indicator */}
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
          Stap {step} van 6
        </p>
        <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem' }}>
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div
              key={n}
              style={{
                flex: 1,
                height: '4px',
                borderRadius: '2px',
                background: n <= step ? 'var(--accent)' : 'var(--border-default)',
              }}
            />
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
            {STEP_TITLES[step]}
          </h2>
          {HELP_CONTENT[step] && (
            <button
              onClick={() => setHelpStep(step)}
              title="Uitleg: hoe exporteer ik dit bestand?"
              style={{
                width: '22px', height: '22px', borderRadius: '50%',
                border: '1.5px solid var(--accent)', background: 'transparent',
                color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0, lineHeight: 1,
              }}
            >
              ?
            </button>
          )}
        </div>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          {STEP_SUBS[step]}
        </p>

        {/* Step content */}
        {step === 1 && (
          <div>
            <label htmlFor="onb-klasnaam" style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
              Klasnaam
            </label>
            <input
              id="onb-klasnaam"
              type="text"
              autoFocus
              value={klasNaamInput}
              onChange={e => setKlasNaamInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreateKlas(); }}
              style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-default)', background: 'var(--bg-page)', color: 'inherit', fontSize: '0.95rem', boxSizing: 'border-box' }}
              placeholder="bijv. Klas 2A"
            />
          </div>
        )}

        {step === 2 && (
          <div
            {...dropProps(handlePDFs, ['.pdf'])}
            onClick={() => pdfRef.current?.click()}
            style={{
              border: '2px dashed var(--border-default)',
              borderRadius: '10px',
              padding: '2rem 1rem',
              textAlign: 'center',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              fontSize: '0.9rem',
            }}
          >
            <input
              ref={pdfRef}
              type="file"
              accept=".pdf"
              multiple
              style={{ display: 'none' }}
              onChange={e => {
                const files = Array.from(e.target.files ?? []);
                if (files.length) handlePDFs(files);
                e.target.value = '';
              }}
            />
            {pdfsUploaded > 0
              ? <p style={{ color: 'var(--accent)', fontWeight: 600 }}>{pdfsUploaded} PDF{pdfsUploaded > 1 ? 's' : ''} geüpload ✓</p>
              : <p>Klik of sleep PDF-bestanden hier naartoe</p>
            }
          </div>
        )}

        {step === 3 && (
          <div
            {...dropProps(files => handleVerzuimExcel(files[0]), ['.xls', '.xlsx'])}
            onClick={() => xlsRef.current?.click()}
            style={{
              border: '2px dashed var(--border-default)',
              borderRadius: '10px',
              padding: '2rem 1rem',
              textAlign: 'center',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              fontSize: '0.9rem',
            }}
          >
            <input
              ref={xlsRef}
              type="file"
              accept=".xls,.xlsx"
              style={{ display: 'none' }}
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) handleVerzuimExcel(f);
                e.target.value = '';
              }}
            />
            {stepMsg
              ? <p style={{ color: 'var(--accent)', fontWeight: 600 }}>{stepMsg} ✓</p>
              : <p>Klik of sleep de verzuim Excel hier naartoe</p>
            }
          </div>
        )}

        {step === 4 && (
          <div
            {...dropProps(files => handleBpvExcel(files[0]), ['.xls', '.xlsx'])}
            onClick={() => bpvRef.current?.click()}
            style={{
              border: '2px dashed var(--border-default)',
              borderRadius: '10px',
              padding: '2rem 1rem',
              textAlign: 'center',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              fontSize: '0.9rem',
            }}
          >
            <input
              ref={bpvRef}
              type="file"
              accept=".xls,.xlsx"
              style={{ display: 'none' }}
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) handleBpvExcel(f);
                e.target.value = '';
              }}
            />
            {stepMsg
              ? <p style={{ color: 'var(--accent)', fontWeight: 600 }}>{stepMsg} ✓</p>
              : <p>Klik of sleep de stage Excel hier naartoe</p>
            }
          </div>
        )}

        {step === 5 && (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                Geoorloofd verzuim (uren)
              </label>
              <input
                type="number"
                min={0}
                max={200}
                value={geoorloofdHours}
                onChange={e => setGeoorloofdHours(Number(e.target.value))}
                style={{ width: '160px', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-default)', background: 'var(--bg-page)', color: 'inherit', fontSize: '0.95rem', boxSizing: 'border-box' }}
              />
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Standaard: {Math.round(DEFAULT_VERZUIM_DREMPELS.geoorloofd / 60)} uur
              </p>
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                Ongeoorloofd verzuim (uren)
              </label>
              <input
                type="number"
                min={0}
                max={200}
                value={ongeoorloofdHours}
                onChange={e => setOngeoorloofdHours(Number(e.target.value))}
                style={{ width: '160px', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-default)', background: 'var(--bg-page)', color: 'inherit', fontSize: '0.95rem', boxSizing: 'border-box' }}
              />
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Standaard: {Math.round(DEFAULT_VERZUIM_DREMPELS.ongeoorloofd / 60)} uur
              </p>
            </div>
          </div>
        )}

        {step === 6 && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🎉</div>
            <p style={{ fontSize: '0.95rem' }}>
              Klas <strong>{klasNaamInput.trim()}</strong> is aangemaakt en je gegevens zijn geladen.
              Je kunt nu aan de slag!
            </p>
          </div>
        )}

        {/* Error feedback */}
        {stepErr && (
          <p style={{ color: 'var(--status-rood-text)', fontSize: '0.875rem', marginTop: '0.75rem' }}>
            {stepErr}
          </p>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
          {step >= 2 && step <= 5 && (
            <button
              style={{ marginRight: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer', padding: '0.25rem 0' }}
              onClick={() => { klasId ? onComplete(klasId) : onAbort?.(); }}
              disabled={processing}
            >
              Afbreken
            </button>
          )}

          {processing && (
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Verwerken...</span>
          )}

          {step === 1 && (
            <button
              className="btn-primary-accent"
              onClick={handleCreateKlas}
              disabled={processing || !klasNaamInput.trim()}
            >
              {processing ? 'Aanmaken...' : 'Klas aanmaken →'}
            </button>
          )}

          {step === 2 && (
            <>
              <button
                className="detail-nav-btn"
                onClick={nextStep}
                disabled={processing}
              >
                Overslaan
              </button>
              <button
                className="btn-primary-accent"
                onClick={nextStep}
                disabled={pdfsUploaded === 0 || processing}
              >
                Volgende →
              </button>
            </>
          )}

          {(step === 3 || step === 4) && (
            <>
              <button
                className="detail-nav-btn"
                onClick={nextStep}
                disabled={processing}
              >
                Overslaan
              </button>
              <button
                className="btn-primary-accent"
                onClick={nextStep}
                disabled={processing}
              >
                Volgende →
              </button>
            </>
          )}

          {step === 5 && (
            <>
              <button
                className="detail-nav-btn"
                onClick={nextStep}
                disabled={processing}
              >
                Overslaan
              </button>
              <button
                className="btn-primary-accent"
                onClick={handleSaveDrempels}
                disabled={processing}
              >
                Opslaan & Volgende →
              </button>
            </>
          )}

          {step === 6 && (
            <button
              className="btn-primary-accent"
              onClick={() => {
                if (!klasId) { setStepErr('Interne fout: klas ID ontbreekt. Herstart de wizard.'); return; }
                onComplete(klasId);
              }}
            >
              Naar het dashboard →
            </button>
          )}
        </div>
      </div>

      {helpStep !== null && HELP_CONTENT[helpStep] && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setHelpStep(null)}
        >
          <div
            style={{ background: 'var(--bg-surface)', borderRadius: '14px', padding: '2.25rem', maxWidth: '85vw', width: '92%', maxHeight: '88vh', overflowY: 'auto', boxShadow: 'var(--shadow-lg)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>{HELP_CONTENT[helpStep].title}</h3>
              <button
                onClick={() => setHelpStep(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1, padding: '0 0.25rem' }}
              >
                ×
              </button>
            </div>
            <VideoWithFallback src={HELP_CONTENT[helpStep].videoSrc} />
            <ol style={{ fontSize: '0.875rem', color: 'var(--text-primary)', paddingLeft: '1.25rem', margin: '1rem 0 0' }}>
              {HELP_CONTENT[helpStep].tekst.map((t, i) => (
                <li key={i} style={{ marginBottom: '0.35rem' }}>{t}</li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}

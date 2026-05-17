import React, { useRef, useState } from 'react';
import { parseSinglePDF } from '../../parsers/pdf';
import { parseExcelFile } from '../../parsers/excel';
import { applyBackupRestore } from '../../utils/backup';
import { saveKlassen, klassenState, switchActiveKlas } from '../../utils/klassen';
import { addStudent, mergeVerzuim } from '../../utils/datamodel';

interface ImportState {
  status: 'idle' | 'processing' | 'done' | 'error';
  progress: { current: number; total: number };
  messages: string[];
  errors: string[];
}

const initialState: ImportState = {
  status: 'idle',
  progress: { current: 0, total: 0 },
  messages: [],
  errors: [],
};

interface ImportPageProps {
  onImportComplete?: () => void;
}

export default function ImportPage({ onImportComplete }: ImportPageProps) {
  const [importState, setImportState] = useState<ImportState>(initialState);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handlePDFs(files: File[]) {
    if (klassenState.activeKlasId === null) {
      setImportState(prev => ({
        ...prev,
        status: 'error',
        errors: [...prev.errors, 'Geen actieve klas — maak eerst een klas aan'],
      }));
      return;
    }

    setImportState(prev => ({
      ...prev,
      status: 'processing',
      progress: { current: 0, total: files.length },
      messages: [],
      errors: [],
    }));

    let succeeded = 0;
    let skipped = 0;

    for (const file of files) {
      try {
        const result = await parseSinglePDF(file);
        addStudent(result);
        succeeded++;
      } catch (err: any) {
        console.warn('[ImportPage] PDF overgeslagen: ' + file.name + ':', err);
        skipped++;
        setImportState(prev => ({
          ...prev,
          errors: [...prev.errors, `${file.name}: parseerfout`],
        }));
      }
      setImportState(prev => ({
        ...prev,
        progress: { ...prev.progress, current: prev.progress.current + 1 },
      }));
    }

    const saved = await saveKlassen();
    if (saved === false) {
      setImportState(prev => ({
        ...prev,
        status: 'error',
        errors: [...prev.errors, 'Opslaan mislukt — controleer schijfruimte of sleutelbeheer'],
      }));
    } else {
      setImportState(prev => ({
        ...prev,
        status: 'done',
        messages: [...prev.messages, `${succeeded} PDF(s) verwerkt, ${skipped} overgeslagen`],
      }));
      // WR-06: only switch view when at least one PDF was successfully imported
      if (succeeded > 0) {
        onImportComplete?.();
      }
    }
  }

  async function handleExcel(file: File) {
    if (klassenState.activeKlasId === null) {
      setImportState(prev => ({
        ...prev,
        status: 'error',
        errors: [...prev.errors, 'Geen actieve klas — maak eerst een klas aan'],
      }));
      return;
    }

    setImportState(prev => ({ ...prev, status: 'processing', messages: [], errors: [] }));

    try {
      const verzuimRecords = await parseExcelFile(file);
      const { matched, unmatched } = mergeVerzuim(verzuimRecords);
      const saved = await saveKlassen();
      if (saved === false) {
        setImportState(prev => ({
          ...prev,
          status: 'error',
          errors: [...prev.errors, 'Opslaan mislukt — controleer schijfruimte of sleutelbeheer'],
        }));
      } else {
        setImportState(prev => ({
          ...prev,
          status: 'done',
          messages: [
            ...prev.messages,
            `Verzuim verwerkt: ${matched} gekoppeld, ${unmatched.length} niet gevonden`,
          ],
        }));
        onImportComplete?.();
      }
    } catch (err: any) {
      setImportState(prev => ({
        ...prev,
        status: 'error',
        errors: [...prev.errors, `Excel verwerking mislukt: ${err.message || String(err)}`],
      }));
    }
  }

  async function handleBackup(file: File) {
    setImportState(prev => ({ ...prev, status: 'processing', messages: [], errors: [] }));

    try {
      const buffer = await file.arrayBuffer();
      const zipData = new Uint8Array(buffer);
      const result = applyBackupRestore(zipData, 'overschrijven');

      if (result.success) {
        if (klassenState.activeKlasId !== null) {
          await switchActiveKlas(klassenState.activeKlasId);
        } else {
          await saveKlassen();
        }
        setImportState(prev => ({
          ...prev,
          status: 'done',
          messages: [...prev.messages, 'Backup hersteld'],
        }));
        onImportComplete?.();
      } else {
        setImportState(prev => ({
          ...prev,
          status: 'error',
          errors: [...prev.errors, result.message],
        }));
      }
    } catch (err: any) {
      setImportState(prev => ({
        ...prev,
        status: 'error',
        errors: [
          ...prev.errors,
          `Backup verwerking mislukt: ${err.message || String(err)}`,
        ],
      }));
    }
  }

  // CR-04: Serialize handlers to prevent concurrent saveKlassen() calls that can
  // interleave writes. Backup is exclusive (return early). PDFs then Excel run in sequence.
  // Guard: reject new drops while processing is in progress.
  async function handleFiles(fileList: FileList) {
    // Guard: reject new drops while a previous import is still running
    if (importState.status === 'processing') {
      return;
    }

    const files = Array.from(fileList);

    const pdfs: File[] = [];
    let excel: File | null = null;
    let backup: File | null = null;
    const warnings: string[] = [];
    let excelCount = 0;
    let zipCount = 0;

    for (const file of files) {
      const name = file.name.toLowerCase();
      if (name.endsWith('.pdf')) {
        pdfs.push(file);
      } else if (name.endsWith('.xls') || name.endsWith('.xlsx')) {
        excelCount++;
        if (excelCount === 1) {
          excel = file;
        } else if (excelCount === 2) {
          warnings.push('Meerdere .xls/.xlsx bestanden gedropt — alleen het eerste bestand verwerkt');
        }
      } else if (name.endsWith('.zip')) {
        zipCount++;
        if (zipCount === 1) {
          backup = file;
        } else if (zipCount === 2) {
          warnings.push('Meerdere .zip bestanden gedropt — alleen het eerste bestand verwerkt');
        }
      } else {
        warnings.push(`Bestandstype niet ondersteund: ${file.name}`);
      }
    }

    if (warnings.length > 0) {
      setImportState(prev => ({
        ...prev,
        errors: [...prev.errors, ...warnings],
      }));
    }

    // Serialize: backup is exclusive (return after restore), then PDFs, then Excel
    if (backup) {
      await handleBackup(backup);
      return;
    }
    if (pdfs.length > 0) await handlePDFs(pdfs);
    if (excel) await handleExcel(excel);
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }

  function onDragLeave() {
    setIsDragging(false);
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  }

  const { status, progress, messages, errors } = importState;

  let statusText: string;
  if (status === 'idle') {
    statusText = 'Sleep bestanden hierheen of klik op "Bestanden selecteren"';
  } else if (status === 'processing') {
    statusText =
      progress.current > 0
        ? `Verwerken... ${progress.current}/${progress.total} PDFs`
        : 'Verwerken...';
  } else if (status === 'done') {
    statusText = messages.join('\n');
  } else {
    statusText = errors.join('\n');
  }

  return (
    <div>
      <div
        onDragOver={onDragOver}
        onDrop={onDrop}
        onDragLeave={onDragLeave}
        style={{
          border: isDragging ? '2px dashed var(--accent)' : '2px dashed var(--border-default)',
          borderRadius: '8px',
          padding: '2rem',
          textAlign: 'center',
          cursor: 'pointer',
        }}
      >
        <p>{statusText}</p>
        <button type="button" onClick={() => inputRef.current?.click()}>
          Bestanden selecteren
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.xls,.xlsx,.zip"
          multiple
          style={{ display: 'none' }}
          onChange={onInputChange}
        />
      </div>
      {/* WR-03: single error list rendered whenever errors exist */}
      {errors.length > 0 && (
        <ul>
          {errors.map((err, i) => (
            <li key={i} style={{ color: 'var(--status-rood-text)' }}>{err}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

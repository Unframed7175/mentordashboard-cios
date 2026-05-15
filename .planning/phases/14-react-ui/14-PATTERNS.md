# Phase 14: React UI - Pattern Map

**Mapped:** 2026-05-15
**Files analyzed:** 16 (13 new components + 1 new utility + 1 new test + 1 modified component + 1 modified App.tsx)
**Analogs found:** 16 / 16

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/utils/status.ts` | utility | transform | `utils/prognosis.ts` | role-match (same pure-function utility shape) |
| `src/components/KlasTabStrip.tsx` | component | event-driven | `src/components/ImportPage.tsx` | role-match (event handlers + singleton state read) |
| `src/components/KlasModal.tsx` | component | request-response | `src/components/ImportPage.tsx` | role-match (controlled form + async handler) |
| `src/components/KlasOverzicht.tsx` | component | CRUD | `src/components/ImportPage.tsx` | role-match (stateful component, singleton reads) |
| `src/components/LeerlingTegel.tsx` | component | transform | `src/components/ImportPage.tsx` | partial (pure presentational; closest is ImportPage JSX fragments) |
| `src/components/DetailWeergave.tsx` | component | request-response | `src/components/ImportPage.tsx` | role-match (section wrapper, prop-driven) |
| `src/components/DoortstroomPrognoseSection.tsx` | component | transform | `src/components/ImportPage.tsx` | partial (pure presentational section) |
| `src/components/FeedbackActiepuntenSection.tsx` | component | CRUD | `src/components/ImportPage.tsx` | role-match (async CRUD + useState list) |
| `src/components/SpiderChartCard.tsx` | component | transform | `src/components/ImportPage.tsx` | partial (dangerouslySetInnerHTML pattern unique) |
| `src/components/DeelgebiedenMatrix.tsx` | component | transform | `src/components/ImportPage.tsx` | partial (table render from utility output) |
| `src/components/VerzuimSection.tsx` | component | transform | `src/components/ImportPage.tsx` | partial (pure presentational) |
| `src/components/VakkenSection.tsx` | component | transform | `src/components/ImportPage.tsx` | partial (pure presentational) |
| `src/components/NotitiesTextarea.tsx` | component | event-driven | `src/components/ImportPage.tsx` | role-match (debounced async onChange + useRef) |
| `src/App.tsx` | component | request-response | `src/App.tsx` (current) | exact (modify in place — add routing state) |
| `src/components/ImportPage.tsx` | component | file-I/O | `src/components/ImportPage.tsx` (current) | exact (add one prop) |
| `tests/status.test.ts` | test | transform | `tests/prognosis.test.ts` | exact (same structure: helpers + beforeEach + test() calls) |

---

## Pattern Assignments

### `src/utils/status.ts` (utility, transform)

**Analog:** `utils/prognosis.ts`

**Imports pattern** (`utils/prognosis.ts` lines 14–16):
```typescript
import { DEELGEBIEDEN } from './schema';
import { getLeerlijnenMapping } from './leerlijnen';
import { appState } from './datamodel';
```
For `status.ts`, import only what is needed:
```typescript
import { berekenPrognose } from './prognosis';
```

**Core pattern** — pure export constants + pure function (from RESEARCH.md Code Examples, verified against `app.js` lines 1222–1244):
```typescript
export const STATUS_VOLGORDE: Record<string, number> = {
  rood: 0, oranje: 1, groen: 2, blauw: 3, grijs: 4,
};

export const RAG_BORDER: Record<string, string> = {
  groen: '#22c55e', oranje: '#f97316', rood: '#ef4444', grijs: '#d1d5db', blauw: '#3b82f6',
};

export type StatusKleur = 'groen' | 'oranje' | 'rood' | 'blauw' | 'grijs';

export interface StatusResult {
  kleur: StatusKleur;
  label: string;
  prognose: ReturnType<typeof berekenPrognose>;
}

// detectTraject: verify exact logic from app.js ~lines 1195-1220 before coding
export function detectTraject(student: any): string { ... }

const VERZUIM_DREMPEL_MIN = 600; // verify exact value in app.js before coding

export function berekenStatus(student: any, traject?: string): StatusResult { ... }
```

**No error handling needed** — pure function, no async, no I/O.

---

### `src/App.tsx` (component, request-response)

**Analog:** `src/App.tsx` (current file — lines 1–25)

**Current imports pattern** (`src/App.tsx` lines 1–2):
```typescript
import React, { useEffect } from 'react';
import ImportPage from './components/ImportPage';
```
Extend to:
```typescript
import React, { useEffect, useState } from 'react';
import ImportPage from './components/ImportPage';
import KlasTabStrip from './components/KlasTabStrip';
import KlasOverzicht from './components/KlasOverzicht';
import DetailWeergave from './components/DetailWeergave';
import { switchActiveKlas, getActiveStudents } from '../utils/klassen';
```

**View-routing state pattern** (from RESEARCH.md Pattern 2):
```typescript
function App() {
  const [view, setView] = useState<'import' | 'klas' | 'detail'>('import');
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [detailStudentList, setDetailStudentList] = useState<string[]>([]);

  function handleImportComplete() {
    setRefreshKey(k => k + 1);
    setView('klas');
  }

  function handleKlasSwitch(id: string) {
    switchActiveKlas(id);
    setRefreshKey(k => k + 1);
    const hasStudents = getActiveStudents().length > 0;
    setView(hasStudents ? 'klas' : 'import');
  }
  // ...
}
```

**Drop-guard useEffect** — keep existing (`src/App.tsx` lines 4–15):
```typescript
useEffect(() => {
  function preventNav(e: DragEvent) { e.preventDefault(); }
  document.addEventListener('dragover', preventNav);
  document.addEventListener('drop', preventNav);
  return () => {
    document.removeEventListener('dragover', preventNav);
    document.removeEventListener('drop', preventNav);
  };
}, []);
```

**Storage-error-banner** — keep existing (`src/App.tsx` line 19):
```tsx
<div id="storage-error-banner" style={{ display: 'none' }} />
```

---

### `src/components/ImportPage.tsx` (component, file-I/O — modify)

**Analog:** `src/components/ImportPage.tsx` (current file — lines 1–289)

**Change required** — add one optional prop and call it after every successful `saveKlassen()`.

**Props interface addition** (after line 13, before the function):
```typescript
interface ImportPageProps {
  onImportComplete?: () => void;
}

export default function ImportPage({ onImportComplete }: ImportPageProps) {
```

**Call site pattern** — after every `setImportState(prev => ({ ...prev, status: 'done', ... }))` that follows a successful `saveKlassen()`, add:
```typescript
onImportComplete?.();
```
There are three such locations: end of `handlePDFs` (line 79), end of `handleExcel` (line 107), end of `handleBackup` (line 144).

**No other changes.** All existing logic, imports, drag/drop handlers, JSX are preserved verbatim.

---

### `src/components/KlasTabStrip.tsx` (component, event-driven)

**Analog:** `src/components/ImportPage.tsx`

**Imports pattern** (follow ImportPage lines 1–6, adapt for klassen):
```typescript
import React from 'react';
import { klassenState } from '../../utils/klassen';
```

**Props interface pattern** (follow ImportPage interface shape lines 8–13):
```typescript
interface KlasTabStripProps {
  activeKlasId: string | null;
  onSwitch: (klasId: string) => void;
  onCreateKlas: () => void;
}
```

**Core pattern** — read singleton directly per render, no useState/useEffect for data (RESEARCH.md Pattern 1):
```typescript
export default function KlasTabStrip({ activeKlasId, onSwitch, onCreateKlas }: KlasTabStripProps) {
  const klassen = Object.values(klassenState.klassen); // always current

  return (
    <nav id="main-nav">
      {klassen.map(klas => (
        <button
          key={klas.id}
          className={`nav-tab${klas.id === activeKlasId ? ' active' : ''}`}
          onClick={() => onSwitch(klas.id)}
        >
          {klas.naam}
        </button>
      ))}
      <button className="nav-tab nav-tab-add" onClick={onCreateKlas}>+</button>
    </nav>
  );
}
```

**No error handling** — pure render from in-memory singleton.

---

### `src/components/KlasModal.tsx` (component, request-response)

**Analog:** `src/components/ImportPage.tsx` — controlled form + async handler pattern (lines 22–81)

**Imports pattern:**
```typescript
import React, { useState } from 'react';
import { createKlas } from '../../utils/klassen';
```

**Props interface pattern** (follow ImportPage interface shape):
```typescript
interface KlasModalProps {
  onCreated: (klasId: string) => void;
  onCancel: () => void;
}
```

**Controlled form + async handler pattern** (mirrors ImportPage `handlePDFs` structure, lines 27–81):
```typescript
export default function KlasModal({ onCreated, onCancel }: KlasModalProps) {
  const [naam, setNaam] = useState('');
  const [schooljaar, setSchoolyear] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await createKlas(naam.trim());
    setLoading(false);
    if (result.error === 'duplicate') {
      setError('Er bestaat al een klas met deze naam');
      return;
    }
    if (result.error) {
      setError('Ongeldige naam');
      return;
    }
    onCreated(result.id);
  }
  // ...
}
```

**Error display pattern** (follow ImportPage lines 273–288):
```tsx
{error && <p style={{ color: 'red' }}>{error}</p>}
```

---

### `src/components/KlasOverzicht.tsx` (component, CRUD)

**Analog:** `src/components/ImportPage.tsx` — stateful component with async side-effects (lines 22–289)

**Imports pattern:**
```typescript
import React, { useState } from 'react';
import { getActiveStudents, klassenState, deleteKlas, saveKlassen } from '../../utils/klassen';
import { berekenStatus, STATUS_VOLGORDE, RAG_BORDER } from '../../utils/status';
import LeerlingTegel from './LeerlingTegel';
import KlasModal from './KlasModal';
```

**Props interface:**
```typescript
interface KlasOverzichtProps {
  refreshKey: number;
  onSelectStudent: (id: string, orderedList: string[]) => void;
  onKlasDeleted: () => void;
}
```

**Singleton read on every render** (RESEARCH.md Pattern 1 — no useEffect for data):
```typescript
export default function KlasOverzicht({ refreshKey, onSelectStudent, onKlasDeleted }: KlasOverzichtProps) {
  const [zoekTerm, setZoekTerm] = useState('');
  const [sortKey, setSortKey] = useState<'naam' | 'status' | 'verzuim'>('naam');
  const [sortAsc, setSortAsc] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Read singleton directly — refreshKey prop causes re-render when data changes
  const allStudents = getActiveStudents();
  // filter, sort, compute KPI strip inline...
}
```

**No error handling for reads** — singletons never throw. Async `deleteKlas()` / `saveKlassen()` wrap in try/catch following ImportPage lines 52–64 pattern.

---

### `src/components/LeerlingTegel.tsx` (component, transform)

**Analog:** `src/components/ImportPage.tsx` — JSX render fragment with inline style (lines 246–289)

**Imports pattern:**
```typescript
import React from 'react';
import { RAG_BORDER, StatusResult } from '../../utils/status';
```

**Props interface:**
```typescript
interface LeerlingTegelProps {
  student: any;
  status: StatusResult;
  onClick: () => void;
}
```

**Core pattern** — pure presentational, inline style for RAG border (mirrors ImportPage's inline `style` usage, line 253):
```typescript
export default function LeerlingTegel({ student, status, onClick }: LeerlingTegelProps) {
  return (
    <div
      className="klas-tile"
      style={{ borderLeft: `4px solid ${RAG_BORDER[status.kleur]}` }}
      onClick={onClick}
    >
      <span className="status-badge" data-kleur={status.kleur}>{status.label}</span>
      <span className="student-naam">{student.naam}</span>
      {/* mini verzuim bar — see RESEARCH.md Code Examples */}
    </div>
  );
}
```

**No error handling** — pure render, no async.

---

### `src/components/DetailWeergave.tsx` (component, request-response)

**Analog:** `src/components/ImportPage.tsx` — stateful wrapper with multiple child renders (lines 22–80)

**Imports pattern:**
```typescript
import React from 'react';
import { getAllRecordsForStudent } from '../../utils/klassen';
import DoortstroomPrognoseSection from './DoortstroomPrognoseSection';
import FeedbackActiepuntenSection from './FeedbackActiepuntenSection';
import SpiderChartCard from './SpiderChartCard';
import DeelgebiedenMatrix from './DeelgebiedenMatrix';
import VerzuimSection from './VerzuimSection';
import VakkenSection from './VakkenSection';
import NotitiesTextarea from './NotitiesTextarea';
```

**Props interface:**
```typescript
interface DetailWeergaveProps {
  leerlingId: string;
  prevId: string | null;
  nextId: string | null;
  onNavigate: (id: string) => void;
  onBack: () => void;
}
```

**Core pattern** — read singleton, pass data down (RESEARCH.md Pattern 1):
```typescript
export default function DetailWeergave({ leerlingId, prevId, nextId, onNavigate, onBack }: DetailWeergaveProps) {
  const records = getAllRecordsForStudent(leerlingId);
  const student = records[records.length - 1]; // most recent record
  if (!student) return <p>Leerling niet gevonden</p>;
  // render sections...
}
```

---

### `src/components/DoortstroomPrognoseSection.tsx` (component, transform)

**Analog:** `src/components/ImportPage.tsx` — pure JSX section (no state)

**Imports pattern:**
```typescript
import React from 'react';
import { berekenPrognose } from '../../utils/prognosis';
import { StatusResult } from '../../utils/status';
```

**Core pattern** — pure presentational, receives pre-computed data via props:
```typescript
interface DoortstroomPrognoseSectionProps {
  student: any;
  status: StatusResult;
}
export default function DoortstroomPrognoseSection({ student, status }: DoortstroomPrognoseSectionProps) {
  const p = status.prognose; // already computed — do not call berekenPrognose again
  return (
    <section className="detail-sectie prognose-sectie">
      {/* render prognose label, kleur badge, etc. */}
    </section>
  );
}
```

---

### `src/components/FeedbackActiepuntenSection.tsx` (component, CRUD)

**Analog:** `src/components/ImportPage.tsx` — async CRUD handlers + useState list (lines 27–81, 83–122)

**Imports pattern:**
```typescript
import React, { useState } from 'react';
import { actiepuntenStore } from '../../utils/actiepunten';
import { saveKlassen } from '../../utils/klassen';
```

**Props interface:**
```typescript
interface FeedbackActiepuntenSectionProps {
  leerlingId: string;
}
```

**CRUD with explicit saveKlassen** (RESEARCH.md Pattern 3 — critical anti-pattern guard):
```typescript
export default function FeedbackActiepuntenSection({ leerlingId }: FeedbackActiepuntenSectionProps) {
  const [actiepunten, setActiepunten] = useState(() => actiepuntenStore.list(leerlingId));

  async function handleAdd(patch: any) {
    actiepuntenStore.add(leerlingId, patch);   // mutates in-memory
    await saveKlassen();                        // REQUIRED — saveState() is a no-op
    setActiepunten(actiepuntenStore.list(leerlingId));
  }

  async function handleUpdate(id: string, patch: any) {
    actiepuntenStore.update(leerlingId, id, patch);
    await saveKlassen();
    setActiepunten(actiepuntenStore.list(leerlingId));
  }

  async function handleRemove(id: string) {
    actiepuntenStore.remove(leerlingId, id);
    await saveKlassen();
    setActiepunten(actiepuntenStore.list(leerlingId));
  }
  // ...
}
```

**Error handling** — follow ImportPage try/catch pattern (lines 52–64): wrap async handlers; on failure, set error message state displayed inline.

---

### `src/components/SpiderChartCard.tsx` (component, transform)

**Analog:** `src/components/ImportPage.tsx` — no close structural match; pattern comes from RESEARCH.md Pattern 4 (the only place in the codebase using `dangerouslySetInnerHTML`)

**Imports pattern:**
```typescript
import React from 'react';
import { SpiderChart } from '../../utils/spider';
import { DEELGEBIEDEN } from '../../utils/schema';
```

**Core pattern — dangerouslySetInnerHTML** (RESEARCH.md Pattern 4, D-14-10):
```typescript
interface SpiderChartCardProps {
  group: 'lesgeven' | 'organiseren' | 'prof_handelen';
  scores: Record<string, string | null>;
  fillVar: string;
  strokeVar: string;
  title: string;
}
export default function SpiderChartCard({ group, scores, fillVar, strokeVar, title }: SpiderChartCardProps) {
  // CRITICAL: use dg.label (not dg.id) as key to match deelgebiedScores storage format
  const axes = DEELGEBIEDEN
    .filter(dg => dg.group === group)
    .map(dg => ({ key: dg.label, label: dg.label }));

  const svg = SpiderChart.buildSpiderSVG(axes, scores, fillVar, strokeVar);

  if (!svg || axes.length === 0) {
    return <div className="spider-empty">Geen scores beschikbaar</div>;
  }
  return (
    <div className="spider-card">
      <div dangerouslySetInnerHTML={{ __html: svg }} />
      <div className="spider-leerlijn-title">{title}</div>
    </div>
  );
}
```

---

### `src/components/DeelgebiedenMatrix.tsx` (component, transform)

**Analog:** `src/components/ImportPage.tsx` — table render from utility output; pure presentational

**Imports pattern:**
```typescript
import React from 'react';
import { aggregateDeelgebiedScores } from '../../utils/aggregation';
import { getAllRecordsForStudent } from '../../utils/klassen';
import { DEELGEBIEDEN } from '../../utils/schema';
```

**Props interface:**
```typescript
interface DeelgebiedenMatrixProps {
  student: any;
  leerlingId: string;
}
```

**Two-period footer pattern** (RESEARCH.md Code Examples — DeelgebiedenMatrix):
```typescript
export default function DeelgebiedenMatrix({ student, leerlingId }: DeelgebiedenMatrixProps) {
  const allRecords = getAllRecordsForStudent(leerlingId); // oldest-first
  const hasTwoPeriods = allRecords.length >= 2
    && allRecords[0].periode !== allRecords[allRecords.length - 1].periode;
  // Single period: aggregateDeelgebiedScores(student.datapunten)
  // Two periods: scores1 = oldest.deelgebiedScores, scores2 = newest.deelgebiedScores
  // growth badge: scoreRank(scores2[dg.label]) vs scoreRank(scores1[dg.label])
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="deelgebieden-matrix">
        {/* thead: deelgebied columns grouped per leerlijn */}
        {/* tbody: datapunten as rows */}
        {/* tfoot: modus footer with growth badge */}
      </table>
    </div>
  );
}
```

---

### `src/components/VerzuimSection.tsx` (component, transform)

**Analog:** `src/components/ImportPage.tsx` — pure presentational JSX fragment

**Imports pattern:**
```typescript
import React from 'react';
```

**Core pattern** — mini verzuim bar calculation from RESEARCH.md Code Examples:
```typescript
interface VerzuimSectionProps {
  student: any;
}
export default function VerzuimSection({ student }: VerzuimSectionProps) {
  if (!student.verzuim) return null;
  const v = student.verzuim;
  const totaal = (v.aanwezigheid || 0) + (v.geoorloofd || 0) + (v.ongeoorloofd || 0);
  if (!totaal) return null;
  const pA = Math.round((v.aanwezigheid || 0) / totaal * 100);
  const pG = Math.round((v.geoorloofd   || 0) / totaal * 100);
  const pO = 100 - pA - pG;
  // render verzuim bar segments
}
```

---

### `src/components/VakkenSection.tsx` (component, transform)

**Analog:** `src/components/ImportPage.tsx` — pure presentational JSX (no state, no async)

**Imports pattern:**
```typescript
import React, { useState } from 'react';
```
(useState only if accordion collapse/expand is needed per vak)

**Props interface:**
```typescript
interface VakkenSectionProps {
  student: any;
}
```
Pure render over `student.vakken[]` array; each vak as an accordion item.

---

### `src/components/NotitiesTextarea.tsx` (component, event-driven)

**Analog:** `src/components/ImportPage.tsx` — useRef + async onChange (lines 25, 207–218)

**Imports pattern:**
```typescript
import React, { useState, useRef } from 'react';
import { saveKlassen } from '../../utils/klassen';
```

**Debounced save + migration pattern** (RESEARCH.md Pattern 5, D-14-11, D-14-12):
```typescript
interface NotitiesTextareaProps {
  student: any;
  leerlingId: string;
}
export default function NotitiesTextarea({ student, leerlingId }: NotitiesTextareaProps) {
  const [value, setValue] = useState(() => {
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
          saveKlassen(); // fire-and-forget
          return student.notitie;
        }
      } catch {}
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
  // ...
}
```

**useRef pattern** mirrors ImportPage lines 25, 261 (`inputRef = useRef<HTMLInputElement>(null)`).

---

### `tests/status.test.ts` (test, transform)

**Analog:** `tests/prognosis.test.ts` — exact match (same Vitest globals pattern, same helper + beforeEach + test() structure)

**File header comment pattern** (`tests/prognosis.test.ts` lines 1–5):
```typescript
// ---------------------------------------------------------------------------
// status.test.ts — berekenStatus + detectTraject unit tests
// Wave 0: covers all 5 status outcomes (grijs/rood/oranje/blauw/groen) + detectTraject BJ1/BJ2
// ---------------------------------------------------------------------------
```

**Imports pattern** (`tests/prognosis.test.ts` lines 7–9):
```typescript
import { berekenStatus, detectTraject, STATUS_VOLGORDE } from '../utils/status';
import { appState } from '../utils/datamodel';
```

**Helper function pattern** (`tests/prognosis.test.ts` lines 12–18):
```typescript
function makeStudent(overrides: Partial<any> = {}): any {
  return {
    leerlingId: 'L1',
    naam: 'Test Leerling',
    deelgebiedScores: {},
    datapunten: [],
    verzuim: null,
    ...overrides,
  };
}
```

**beforeEach pattern** (`tests/prognosis.test.ts` lines 38–40):
```typescript
beforeEach(() => {
  appState.students = [];
});
```

**Test structure pattern** (`tests/prognosis.test.ts` lines 44–48) — one test per status outcome:
```typescript
test('berekenStatus returns grijs when student has no scores', () => {
  const result = berekenStatus(makeStudent({ deelgebiedScores: {} }));
  expect(result.kleur).toBe('grijs');
  expect(result.label).toBe('Onbekend');
});
```
Five tests needed: grijs (no scores), rood (negatief prognose), oranje/Verzuim (ongeoorloofd > drempel), oranje/Let op (neutraal prognose), groen/blauw (sbl/sbc/positive prognose).

**Vitest config** — no changes needed; `tests/status.test.ts` is already matched by `include: ['tests/**/*.test.{js,ts}']` in `vitest.config.ts` line 5.

---

## Shared Patterns

### Pattern A: Singleton Read on Every Render (applies to ALL components that display student or klas data)

**Source:** RESEARCH.md Pattern 1 (D-14-02/D-14-03); confirmed by `src/components/ImportPage.tsx` lines 29–34 (reads `klassenState.activeKlasId` directly).

**Apply to:** `KlasTabStrip`, `KlasOverzicht`, `DetailWeergave`, and all section components.

```typescript
// Read singleton directly — no useEffect, no useState for data
// refreshKey prop (passed from App.tsx) triggers re-render when data changes
const students = getActiveStudents(); // always current after refreshKey increment
```

**Anti-pattern to avoid:** `useEffect(() => { setStudents(getActiveStudents()); }, [])` — creates stale closure, misses updates.

---

### Pattern B: async Handler with saveKlassen() (applies to ALL components that mutate data)

**Source:** `src/components/ImportPage.tsx` lines 67–80 (successful save path); RESEARCH.md Pattern 3.

**Apply to:** `FeedbackActiepuntenSection`, `NotitiesTextarea`, `KlasModal`, `KlasOverzicht` (deleteKlas).

```typescript
// Follow ImportPage lines 67-80 exactly:
const saved = await saveKlassen();
if (saved === false) {
  setError('Opslaan mislukt — controleer schijfruimte of sleutelbeheer');
} else {
  // success path
}
```

---

### Pattern C: Props Interface Before Function (applies to ALL new components)

**Source:** `src/components/ImportPage.tsx` lines 8–13 (ImportState interface before the component function).

**Apply to:** All new `*.tsx` files.

```typescript
interface ComponentNameProps {
  propA: TypeA;
  propB?: TypeB; // optional props use ?
}

export default function ComponentName({ propA, propB }: ComponentNameProps) {
```

---

### Pattern D: Controlled Form Fields (applies to KlasModal, FeedbackActiepuntenSection)

**Source:** `src/components/ImportPage.tsx` lines 23–25 (`useState<ImportState>`, `useState<boolean>`).

```typescript
const [fieldValue, setFieldValue] = useState('');
// input:
<input value={fieldValue} onChange={e => setFieldValue(e.target.value)} />
```

---

### Pattern E: Import Path Convention

**Source:** `src/components/ImportPage.tsx` lines 2–6.

All imports from utils use `../../utils/` (two levels up from `src/components/`):
```typescript
import { saveKlassen } from '../../utils/klassen';
import { addStudent } from '../../utils/datamodel';
```
Imports between components use `./`:
```typescript
import LeerlingTegel from './LeerlingTegel';
```

---

### Pattern F: Dutch Language UI Strings

**Source:** `src/components/ImportPage.tsx` lines 233–244 (statusText), 261–262 (button label), 181–183 (warning messages).

All user-facing strings are in Dutch. No i18n layer. Hard-code Dutch strings directly in JSX.

---

## No Analog Found

All files have a structural analog. However, three components have patterns that are either unique to this phase or require reading `app.js` before implementation:

| File | Unique Aspect | Required Pre-Coding Step |
|---|---|---|
| `src/utils/status.ts` | `detectTraject()` logic not in any TypeScript file | Read `app.js` lines ~1195–1220 for exact `detectTraject` logic; grep for `VERZUIM_DREMPEL` for exact threshold value |
| `src/components/NotitiesTextarea.tsx` | `localStorage` key name and format for migration (D-14-12) | Verify key name `'mentordashboard_notities'` and format `{ [leerlingId]: string }` in `app.js` before coding migration |
| `src/components/SpiderChartCard.tsx` | Only consumer of `dangerouslySetInnerHTML` in entire codebase | No existing React analog — copy exactly from RESEARCH.md Pattern 4 |

---

## Metadata

**Analog search scope:** `src/` (components, App, main), `tests/`, `utils/`, `vitest.config.ts`
**Files scanned:** 14 source files (4 src/*.tsx, 10 tests/*.{ts,js})
**Pattern extraction date:** 2026-05-15

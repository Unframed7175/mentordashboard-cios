# Auto-update systeem Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vervang de huidige "banner met downloadlink" update-check door een echte in-app updater (download + installeer + herstart) met een patch notes-scherm, en automatiseer het bijwerken van de landingspagina bij elke release.

**Architecture:** Tauri's officiële `tauri-plugin-updater` (Rust) + `@tauri-apps/plugin-updater` (JS) verzorgen het signature-geverifieerde check/download/install-proces; de release-workflow signeert artefacten en publiceert `latest.json`; een aparte GitHub Actions-workflow werkt de losse landingspagina-repo bij zodra een release gepubliceerd wordt. Beide automatiseringen herbruiken dezelfde bron: de nieuwste sectie van `CHANGELOG.md`.

**Tech Stack:** Tauri v2 (Rust + React/TypeScript), Vitest + React Testing Library, GitHub Actions, Node.js (losse scripts, geen extra npm-dependency).

## Global Constraints

- Geen Apple-notarisatie — macOS blijft ad-hoc gesigned, zoals nu (spec: "Niet-doelen").
- Patch notes tonen alleen de nieuwste versie, nooit cumulatief over overgeslagen versies (spec: "Niet-doelen").
- Geen achtergronddownload vóór de klik op "Update nu" — alleen op aanvraag (spec: "Niet-doelen").
- Het update-/patch notes-scherm is altijd wegklikbaar via "Later" — nooit verplicht (spec: "Niet-doelen").
- Patch notes-bron is uitsluitend `CHANGELOG.md` — geen los bij te houden tekst (spec: "Architectuur — dataflow").
- Scripts voor de release-automatisering zijn dependency-vrij Node.js (geen nieuwe npm-package toevoegen voor markdown-parsing) (spec: Component B/D).
- Bij een onverwachte structuur in `index.html` moet het website-script hard falen, nooit "best effort" doorgaan (spec: Foutafhandeling-tabel).

---

## Task 1: Tauri updater + process plugins registreren (Rust)

**Files:**
- Modify: `src-tauri/Cargo.toml`
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/capabilities/default.json`

**Interfaces:**
- Produces: Rust-side plugins `tauri_plugin_updater` en `tauri_plugin_process` geregistreerd en met permissie vrijgegeven aan het `main`-venster, zodat de frontend (Taak 5/6) ze via `@tauri-apps/plugin-updater` en `@tauri-apps/plugin-process` kan aanroepen.

- [ ] **Step 1: Dependencies toevoegen aan Cargo.toml**

In `src-tauri/Cargo.toml`, in de `[dependencies]`-sectie, voeg toe na de bestaande `tauri-plugin-store`-regel:

```toml
tauri-plugin-updater = "2"                 # Auto-update: check/download/installeer nieuwe versie
tauri-plugin-process = "2"                 # Auto-update: relaunch() na installatie
```

- [ ] **Step 2: Plugins registreren in lib.rs**

In `src-tauri/src/lib.rs`, voeg twee regels toe aan de bestaande `.plugin(...)`-keten, na `tauri_plugin_secure_storage::init()`:

```rust
        .plugin(tauri_plugin_secure_storage::init())        // Phase 12: OS keychain
        .plugin(tauri_plugin_updater::Builder::new().build()) // Auto-update: check/download/installeer
        .plugin(tauri_plugin_process::init())                // Auto-update: relaunch() na installatie
```

- [ ] **Step 3: Permissies toevoegen aan capabilities**

In `src-tauri/capabilities/default.json`, voeg twee permissies toe aan de `"permissions"`-array:

```json
  "permissions": [
    "core:default",
    "store:default",
    "secure-storage:default",
    "os:default",
    "opener:default",
    "updater:default",
    "process:default"
  ]
```

- [ ] **Step 4: Compileren verifiëren**

Run: `cd src-tauri && cargo check`
Expected: `Compiling tauri-plugin-updater v2.x.x` en `Compiling tauri-plugin-process v2.x.x` in de output, gevolgd door `Finished` zonder errors. (Een paar warnings van bestaande code zijn oké — let alleen op nieuwe errors.)

- [ ] **Step 5: Commit**

```bash
git add src-tauri/Cargo.toml src-tauri/Cargo.lock src-tauri/src/lib.rs src-tauri/capabilities/default.json
git commit -m "feat: registreer tauri-plugin-updater en tauri-plugin-process"
```

---

## Task 2: Signing-sleutel genereren en updater configureren in tauri.conf.json

**Files:**
- Modify: `src-tauri/tauri.conf.json`

**Interfaces:**
- Consumes: geen
- Produces: `plugins.updater.endpoints` + `plugins.updater.pubkey` — de URL en publieke sleutel die de frontend-check (Taak 5) impliciet gebruikt via de plugin; `bundle.createUpdaterArtifacts: true` — vereist door `tauri-action` in Taak 11 om signed update-artefacten + `latest.json` te bouwen.

- [ ] **Step 1: Sleutelpaar genereren (lokaal, niet gecommit)**

Run: `npx tauri signer generate -w ~/.tauri/mentordashboard-updater.key`
Expected output bevat een regel met `Public key:` gevolgd door een lange base64-achtige string, en bevestiging dat het private-key-bestand is geschreven naar `~/.tauri/mentordashboard-updater.key`. Het commando vraagt om een wachtwoord voor de private key — kies een wachtwoord en onthoud het (nodig in Step 4).

**Bewaar uit de output:**
- De **publieke sleutel** (gaat in tauri.conf.json, niet geheim)
- De **inhoud van `~/.tauri/mentordashboard-updater.key`** (private sleutel, NOOIT committen)
- Het **wachtwoord** dat je net gekozen hebt

- [ ] **Step 2: tauri.conf.json bijwerken**

In `src-tauri/tauri.conf.json`, voeg `createUpdaterArtifacts` toe aan `bundle`, en een nieuwe top-level `plugins`-sectie (na `bundle`):

```json
  "bundle": {
    "active": true,
    "targets": "all",
    "createUpdaterArtifacts": true,
    "windows": {
```

```json
  "plugins": {
    "updater": {
      "endpoints": [
        "https://github.com/Unframed7175/mentordashboard-cios/releases/latest/download/latest.json"
      ],
      "pubkey": "PLAK_HIER_DE_PUBLIEKE_SLEUTEL_UIT_STEP_1"
    }
  }
```

(Plaats deze `"plugins"`-sectie als nieuwe top-level key naast `"bundle"`, vóór de afsluitende `}` van het bestand.)

- [ ] **Step 3: JSON-geldigheid verifiëren**

Run: `node -e "JSON.parse(require('fs').readFileSync('src-tauri/tauri.conf.json','utf8')); console.log('geldig')"`
Expected: `geldig` zonder foutmelding.

- [ ] **Step 4: MENSELIJKE CHECKPOINT — secrets opslaan**

Dit is een gevoelige, niet-triviaal-terug-te-draaien actie (een private signing-sleutel komt in GitHub terecht). **Pauzeer hier en vraag het volgende aan de projecteigenaar voordat je verdergaat:**

> "Ik heb een signing-sleutelpaar gegenereerd. Wil je dat ik de private sleutel + wachtwoord direct als GitHub-secrets opslaan via `gh secret set` (ik heb daarvoor toegang), of zet je dat liever zelf via de GitHub-UI?"

Als akkoord om het via `gh` te doen, voer uit (met de echte waarden uit Step 1, niet de private sleutel zelf in de shell-history laten staan — gebruik bij voorkeur `gh secret set NAAM < bestand`):

```bash
gh secret set TAURI_SIGNING_PRIVATE_KEY --repo Unframed7175/mentordashboard-cios < ~/.tauri/mentordashboard-updater.key
gh secret set TAURI_SIGNING_PRIVATE_KEY_PASSWORD --repo Unframed7175/mentordashboard-cios --body "HET_GEKOZEN_WACHTWOORD"
```

Verifieer: `gh secret list --repo Unframed7175/mentordashboard-cios` toont beide namen (geen waarden, dat is normaal).

- [ ] **Step 5: Commit**

```bash
git add src-tauri/tauri.conf.json
git commit -m "feat: configureer tauri-updater endpoint en publieke sleutel"
```

---

## Task 3: Frontend updater-packages installeren

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Produces: `@tauri-apps/plugin-updater` (functie `check`, type `Update`) en `@tauri-apps/plugin-process` (functie `relaunch`) beschikbaar voor import in Taak 5/6/7/8.

- [ ] **Step 1: Packages installeren**

Run: `npm install @tauri-apps/plugin-updater @tauri-apps/plugin-process`
Expected: `package.json` krijgt twee nieuwe regels onder `dependencies`, vergelijkbaar met de bestaande `@tauri-apps/plugin-os`-regel (bv. `"@tauri-apps/plugin-updater": "^2.x.x"`).

- [ ] **Step 2: Verifiëren**

Run: `grep "@tauri-apps/plugin-updater\|@tauri-apps/plugin-process" package.json`
Expected: beide regels worden getoond.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: voeg @tauri-apps/plugin-updater en plugin-process toe"
```

---

## Task 4: Patch notes mini-formatter (`utils/formatPatchNotes.tsx`)

**Files:**
- Create: `utils/formatPatchNotes.tsx`
- Test: `tests/formatPatchNotes.test.tsx`

**Interfaces:**
- Consumes: geen
- Produces: `formatPatchNotes(text: string): React.ReactNode` — herkent `### Koppen`, `- bullets` (gegroepeerd in `<ul>`), en `**vet**` binnen tekst. Gebruikt door `UpdateModal` (Taak 6).

- [ ] **Step 1: Schrijf de falende tests**

Create `tests/formatPatchNotes.test.tsx`:

```tsx
import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { formatPatchNotes } from '../utils/formatPatchNotes';

describe('formatPatchNotes', () => {
  it('rendert een ### kop als h4', () => {
    const { container } = render(<div>{formatPatchNotes('### Fixed')}</div>);
    expect(container.querySelector('h4')?.textContent).toBe('Fixed');
  });

  it('rendert - bullets als een lijst', () => {
    const { container } = render(<div>{formatPatchNotes('- Eerste punt\n- Tweede punt')}</div>);
    const items = container.querySelectorAll('li');
    expect(items.length).toBe(2);
    expect(items[0].textContent).toBe('Eerste punt');
    expect(items[1].textContent).toBe('Tweede punt');
  });

  it('rendert **vet** binnen een regel als <strong>', () => {
    const { container } = render(
      <div>{formatPatchNotes('- **BJ1 PDF-import** werkt weer correct')}</div>
    );
    expect(container.querySelector('strong')?.textContent).toBe('BJ1 PDF-import');
  });

  it('rendert een losse regel zonder marker als paragraaf', () => {
    const { container } = render(<div>{formatPatchNotes('Gewone tekst zonder marker')}</div>);
    expect(container.querySelector('p')?.textContent).toBe('Gewone tekst zonder marker');
  });

  it('combineert kop, bullets en platte tekst in document-volgorde', () => {
    const { container } = render(
      <div>{formatPatchNotes('### Fixed\n- Punt een\n- Punt twee\n\n### Changed\n- Punt drie')}</div>
    );
    const headings = container.querySelectorAll('h4');
    const lists = container.querySelectorAll('ul');
    expect(headings.length).toBe(2);
    expect(lists.length).toBe(2);
    expect(lists[0].querySelectorAll('li').length).toBe(2);
    expect(lists[1].querySelectorAll('li').length).toBe(1);
  });
});
```

- [ ] **Step 2: Run tests, verifieer dat ze falen**

Run: `npx vitest run tests/formatPatchNotes.test.tsx`
Expected: FAIL — `Cannot find module '../utils/formatPatchNotes'` (bestand bestaat nog niet).

- [ ] **Step 3: Implementeer formatPatchNotes**

Create `utils/formatPatchNotes.tsx`:

```tsx
import React from 'react';

/**
 * Minimale, dependency-vrije formatter voor patch notes uit CHANGELOG.md.
 * Herkent alleen de patronen die daar werkelijk in voorkomen: ### koppen,
 * - bullets (gegroepeerd per opeenvolgend blok), en **vet** binnen een regel.
 */
export function formatPatchNotes(text: string): React.ReactNode {
  const lines = text.split('\n');
  const blocks: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];
  let listKey = 0;

  function flushList() {
    if (listItems.length > 0) {
      blocks.push(<ul key={`ul-${listKey++}`}>{listItems}</ul>);
      listItems = [];
    }
  }

  function renderInline(s: string): React.ReactNode {
    const parts = s.split(/\*\*(.+?)\*\*/g);
    return parts.map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part));
  }

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    const headingMatch = trimmed.match(/^###\s+(.*)/);
    if (headingMatch) {
      flushList();
      blocks.push(<h4 key={`h-${idx}`}>{headingMatch[1]}</h4>);
      return;
    }

    const bulletMatch = trimmed.match(/^-\s+(.*)/);
    if (bulletMatch) {
      listItems.push(<li key={`li-${idx}`}>{renderInline(bulletMatch[1])}</li>);
      return;
    }

    flushList();
    blocks.push(<p key={`p-${idx}`}>{renderInline(trimmed)}</p>);
  });
  flushList();

  return <>{blocks}</>;
}
```

- [ ] **Step 4: Run tests, verifieer dat ze slagen**

Run: `npx vitest run tests/formatPatchNotes.test.tsx`
Expected: 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add utils/formatPatchNotes.tsx tests/formatPatchNotes.test.tsx
git commit -m "feat: voeg formatPatchNotes mini-formatter toe voor patch notes"
```

---

## Task 5: `utils/updateCheck.ts` herschrijven naar de officiële updater-plugin

**Files:**
- Modify: `utils/updateCheck.ts` (volledige vervanging van de inhoud)
- Test: `tests/updateCheck.test.ts` (nieuw)

**Interfaces:**
- Consumes: `check` uit `@tauri-apps/plugin-updater` (Taak 3)
- Produces: `checkForUpdate(): Promise<Update | null>` — gebruikt door `App.tsx` (Taak 7) en `SettingsPage.tsx` (Taak 8). `Update` is het type uit `@tauri-apps/plugin-updater` met (relevant hier) `version: string`, `body?: string`, `downloadAndInstall(): Promise<void>`.

- [ ] **Step 1: Schrijf de falende tests**

Create `tests/updateCheck.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCheck = vi.fn();
vi.mock('@tauri-apps/plugin-updater', () => ({
  check: (...args: unknown[]) => mockCheck(...args),
}));

import { checkForUpdate } from '../utils/updateCheck';

describe('checkForUpdate', () => {
  beforeEach(() => {
    mockCheck.mockReset();
  });

  it('geeft null terug als er geen update beschikbaar is', async () => {
    mockCheck.mockResolvedValueOnce(null);
    expect(await checkForUpdate()).toBeNull();
  });

  it('geeft het update-object terug als er een update beschikbaar is', async () => {
    const fakeUpdate = {
      version: '2.10.3',
      body: '### Fixed\n- iets opgelost',
      downloadAndInstall: vi.fn(),
    };
    mockCheck.mockResolvedValueOnce(fakeUpdate);
    expect(await checkForUpdate()).toBe(fakeUpdate);
  });

  it('geeft null terug bij een fout (bv. geen internet)', async () => {
    mockCheck.mockRejectedValueOnce(new Error('network error'));
    expect(await checkForUpdate()).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests, verifieer dat ze falen**

Run: `npx vitest run tests/updateCheck.test.ts`
Expected: FAIL — de huidige `checkForUpdate` retourneert `{version, url}`-objecten op basis van een raw `fetch`, niet het gemockte plugin-`check()`-resultaat; de derde test kan zelfs slagen per ongeluk maar de eerste twee falen aantoonbaar tegen de oude implementatie.

- [ ] **Step 3: Herschrijf utils/updateCheck.ts**

Replace de volledige inhoud van `utils/updateCheck.ts` met:

```ts
import { check, type Update } from '@tauri-apps/plugin-updater';

/**
 * Controleert op een nieuwere, geldig gesigneerde release via de Tauri-updater.
 * Geeft null terug bij geen update of bij een fout (bv. geen internet) —
 * faalt altijd stil zodat een mislukte check de opstart van de app niet verstoort.
 */
export async function checkForUpdate(): Promise<Update | null> {
  try {
    return await check();
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run tests, verifieer dat ze slagen**

Run: `npx vitest run tests/updateCheck.test.ts`
Expected: 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add utils/updateCheck.ts tests/updateCheck.test.ts
git commit -m "feat: vervang GitHub-API polling door tauri-plugin-updater in checkForUpdate"
```

---

## Task 6: `UpdateModal.tsx` component (vervangt `UpdateBanner.tsx`)

**Files:**
- Create: `src/components/UpdateModal.tsx`
- Delete: `src/components/UpdateBanner.tsx`
- Test: `tests/UpdateModal.test.tsx` (nieuw)

**Interfaces:**
- Consumes: `formatPatchNotes` (Taak 4), `relaunch` uit `@tauri-apps/plugin-process` (Taak 3)
- Produces: `<UpdateModal version={string} notes={string} onDownloadAndInstall={() => Promise<void>} onDismiss={() => void} />` — gebruikt door `App.tsx` (Taak 7) en `SettingsPage.tsx` (Taak 8).

- [ ] **Step 1: Schrijf de falende tests**

Create `tests/UpdateModal.test.tsx`:

```tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockRelaunch = vi.fn();
vi.mock('@tauri-apps/plugin-process', () => ({
  relaunch: (...args: unknown[]) => mockRelaunch(...args),
}));

import UpdateModal from '../src/components/UpdateModal';

describe('UpdateModal', () => {
  beforeEach(() => {
    mockRelaunch.mockReset();
  });

  it('toont de versie en de patch notes', () => {
    render(
      <UpdateModal
        version="2.10.3"
        notes={'### Fixed\n- iets opgelost'}
        onDownloadAndInstall={vi.fn()}
        onDismiss={vi.fn()}
      />
    );
    expect(screen.getByText(/2\.10\.3/)).toBeTruthy();
    expect(screen.getByText('iets opgelost')).toBeTruthy();
  });

  it('klikken op "Later" roept onDismiss aan zonder te installeren', () => {
    const onDismiss = vi.fn();
    const onDownloadAndInstall = vi.fn();
    render(
      <UpdateModal
        version="2.10.3"
        notes="- iets"
        onDownloadAndInstall={onDownloadAndInstall}
        onDismiss={onDismiss}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Later/i }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onDownloadAndInstall).not.toHaveBeenCalled();
  });

  it('klikken op "Update nu" downloadt, installeert en herstart', async () => {
    const onDownloadAndInstall = vi.fn().mockResolvedValue(undefined);
    render(
      <UpdateModal
        version="2.10.3"
        notes="- iets"
        onDownloadAndInstall={onDownloadAndInstall}
        onDismiss={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Update nu/i }));
    await waitFor(() => expect(mockRelaunch).toHaveBeenCalledTimes(1));
    expect(onDownloadAndInstall).toHaveBeenCalledTimes(1);
  });

  it('toont een foutmelding als downloadAndInstall mislukt, app blijft bruikbaar', async () => {
    const onDownloadAndInstall = vi.fn().mockRejectedValue(new Error('fail'));
    render(
      <UpdateModal
        version="2.10.3"
        notes="- iets"
        onDownloadAndInstall={onDownloadAndInstall}
        onDismiss={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Update nu/i }));
    expect(await screen.findByText(/mislukt/i)).toBeTruthy();
    expect(mockRelaunch).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests, verifieer dat ze falen**

Run: `npx vitest run tests/UpdateModal.test.tsx`
Expected: FAIL — `Cannot find module '../src/components/UpdateModal'`.

- [ ] **Step 3: Implementeer UpdateModal.tsx**

Create `src/components/UpdateModal.tsx`:

```tsx
import React, { useState } from 'react';
import { relaunch } from '@tauri-apps/plugin-process';
import { formatPatchNotes } from '../../utils/formatPatchNotes';

interface UpdateModalProps {
  version: string;
  notes: string;
  onDownloadAndInstall: () => Promise<void>;
  onDismiss: () => void;
}

export default function UpdateModal({ version, notes, onDownloadAndInstall, onDismiss }: UpdateModalProps) {
  const [status, setStatus] = useState<'idle' | 'installing' | 'error'>('idle');

  async function handleUpdateNow() {
    setStatus('installing');
    try {
      await onDownloadAndInstall();
      await relaunch();
    } catch {
      setStatus('error');
    }
  }

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget && status !== 'installing') onDismiss();
  }

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
      onClick={handleOverlayClick}
    >
      <div
        style={{
          background: 'var(--bg-surface, #ffffff)',
          borderRadius: '12px',
          padding: '1.5rem',
          width: '100%',
          maxWidth: '480px',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        }}
      >
        <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 700 }}>
          Nieuwe versie beschikbaar: v{version}
        </h2>

        <div style={{ fontSize: '0.875rem', marginBottom: '1.25rem' }}>
          {formatPatchNotes(notes)}
        </div>

        {status === 'error' && (
          <p style={{ fontSize: '0.875rem', color: 'var(--status-rood-text)', marginBottom: '1rem' }}>
            Bijwerken is mislukt. Controleer je internetverbinding en probeer het opnieuw.
          </p>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button type="button" className="btn btn-ghost" onClick={onDismiss} disabled={status === 'installing'}>
            Later
          </button>
          <button type="button" className="btn btn-primary" onClick={handleUpdateNow} disabled={status === 'installing'}>
            {status === 'installing' ? 'Bijwerken…' : 'Update nu'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests, verifieer dat ze slagen**

Run: `npx vitest run tests/UpdateModal.test.tsx`
Expected: 4 tests PASS.

- [ ] **Step 5: Verwijder UpdateBanner.tsx en zijn plek in de import-keten**

Run: `rm src/components/UpdateBanner.tsx`
(De referenties in `App.tsx` worden in Taak 7 vervangen — dit bestand wordt daar niet meer geïmporteerd.)

- [ ] **Step 6: Commit**

```bash
git add src/components/UpdateModal.tsx tests/UpdateModal.test.tsx
git rm src/components/UpdateBanner.tsx
git commit -m "feat: voeg UpdateModal toe met patch notes, verwijder UpdateBanner"
```

---

## Task 7: `UpdateModal` koppelen in `App.tsx`

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `checkForUpdate` (Taak 5), `UpdateModal` (Taak 6), type `Update` uit `@tauri-apps/plugin-updater`

- [ ] **Step 1: Imports bijwerken**

In `src/App.tsx`, vervang:

```ts
import { checkForUpdate, UpdateInfo } from '../utils/updateCheck';
import UpdateBanner from './components/UpdateBanner';
```

door:

```ts
import type { Update } from '@tauri-apps/plugin-updater';
import { checkForUpdate } from '../utils/updateCheck';
import UpdateModal from './components/UpdateModal';
```

- [ ] **Step 2: State-type bijwerken**

Vervang:

```ts
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
```

door:

```ts
  const [updateInfo, setUpdateInfo] = useState<Update | null>(null);
```

(De rest van de `useEffect` die `checkForUpdate()` aanroept en `setUpdateInfo(info)` zet, blijft ongewijzigd — de functie-aanroep en het patroon zijn identiek, alleen het type van wat erin zit verandert.)

- [ ] **Step 3: Render-blok bijwerken**

Vervang:

```tsx
      {updateInfo && (
        <UpdateBanner
          version={updateInfo.version}
          url={updateInfo.url}
          onDismiss={() => setUpdateInfo(null)}
        />
      )}
```

door:

```tsx
      {updateInfo && (
        <UpdateModal
          version={updateInfo.version}
          notes={updateInfo.body ?? ''}
          onDownloadAndInstall={() => updateInfo.downloadAndInstall()}
          onDismiss={() => setUpdateInfo(null)}
        />
      )}
```

- [ ] **Step 4: TypeScript-check**

Run: `npx tsc --noEmit`
Expected: geen nieuwe errors die verwijzen naar `App.tsx` of `UpdateInfo`/`UpdateBanner`. (Dit project heeft mogelijk al bestaande, niet-gerelateerde TS-errors van eerdere fases — alleen nieuwe errors in de bestanden die je net wijzigde zijn relevant.)

- [ ] **Step 5: Volledige testsuite draaien**

Run: `npx vitest run`
Expected: alle tests die vóór dit task slaagden, slagen nog steeds (geen test importeert `App.tsx` rechtstreeks, dus geen directe regressie verwacht — dit is een sanity-check dat niets elders breekt).

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "feat: koppel UpdateModal aan App.tsx i.p.v. UpdateBanner"
```

---

## Task 8: `UpdateModal` koppelen in `SettingsPage.tsx` (handmatige "Controleer op updates")

**Files:**
- Modify: `src/components/SettingsPage.tsx`

**Interfaces:**
- Consumes: `checkForUpdate` (Taak 5), `UpdateModal` (Taak 6)

- [ ] **Step 1: Import bijwerken**

Vervang:

```ts
import { checkForUpdate, type UpdateInfo } from '../../utils/updateCheck';
```

door:

```ts
import type { Update } from '@tauri-apps/plugin-updater';
import { checkForUpdate } from '../../utils/updateCheck';
import UpdateModal from './UpdateModal';
```

- [ ] **Step 2: State bijwerken**

Vervang:

```ts
  const [updateResult, setUpdateResult] = useState<UpdateInfo | 'uptodate' | 'error' | null>(null);
```

door:

```ts
  const [updateResult, setUpdateResult] = useState<'uptodate' | 'error' | null>(null);
  const [updateModalInfo, setUpdateModalInfo] = useState<Update | null>(null);
```

- [ ] **Step 3: handleCheckUpdate bijwerken**

Vervang de bestaande functie:

```ts
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
```

door:

```ts
  async function handleCheckUpdate() {
    setUpdateChecking(true);
    setUpdateResult(null);
    try {
      const info = await checkForUpdate();
      if (info) {
        setUpdateModalInfo(info);
      } else {
        setUpdateResult('uptodate');
      }
    } catch {
      setUpdateResult('error');
    } finally {
      setUpdateChecking(false);
    }
  }
```

- [ ] **Step 4: Render-blok bijwerken — downloadlink-paragraaf vervangen door modal**

Vervang:

```tsx
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
```

door:

```tsx
      </section>

      {updateModalInfo && (
        <UpdateModal
          version={updateModalInfo.version}
          notes={updateModalInfo.body ?? ''}
          onDownloadAndInstall={() => updateModalInfo.downloadAndInstall()}
          onDismiss={() => setUpdateModalInfo(null)}
        />
      )}
```

(De `updateResult === 'uptodate'` en `updateResult === 'error'`-blokken die direct erboven staan, blijven ongewijzigd staan.)

- [ ] **Step 5: TypeScript-check**

Run: `npx tsc --noEmit`
Expected: geen nieuwe errors in `SettingsPage.tsx`.

- [ ] **Step 6: Bestaande tests draaien**

Run: `npx vitest run tests/SettingsPage.test.tsx tests/SettingsPage.gevarenzone.test.tsx`
Expected: alle tests PASS ongewijzigd — `tests/SettingsPage.gevarenzone.test.tsx` mockt `../utils/updateCheck` al naar `null`, wat zowel met de oude als de nieuwe API-vorm compatibel is, dus is geen wijziging aan het testbestand nodig.

- [ ] **Step 7: Commit**

```bash
git add src/components/SettingsPage.tsx
git commit -m "feat: koppel UpdateModal aan handmatige updatecheck in SettingsPage"
```

---

## Task 9: `scripts/extract-changelog-entry.mjs` — nieuwste CHANGELOG-sectie extraheren

**Files:**
- Create: `scripts/extract-changelog-entry.mjs`
- Test: `tests/extractChangelogEntry.test.ts`

**Interfaces:**
- Produces: `extractLatestChangelogEntry(changelogText: string): { version: string; header: string; body: string }` — herbruikt door Taak 11 (release-workflow) en Taak 10 (website-script neemt de `body` als input).

- [ ] **Step 1: Schrijf de falende tests**

Create `tests/extractChangelogEntry.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { extractLatestChangelogEntry } from '../scripts/extract-changelog-entry.mjs';

const SAMPLE = `# Changelog — Mentordashboard CIOS

## [2.10.2] — 2026-06-17 — Bugfix BJ1 PDF-import: sportvakken-tabel corrumpeerde deelgebiedscores

### Fixed
- **BJ1 PDF-import** — de tabel werd verkeerd gelezen.

## [2.10.1] — 2026-06-17 — Bugfix BJ1 prognose

### Fixed
- Oude regel.
`;

describe('extractLatestChangelogEntry', () => {
  it('haalt het versienummer uit de nieuwste sectie', () => {
    const result = extractLatestChangelogEntry(SAMPLE);
    expect(result.version).toBe('2.10.2');
  });

  it('stopt de body vóór de volgende ## [-sectie', () => {
    const result = extractLatestChangelogEntry(SAMPLE);
    expect(result.body).toContain('BJ1 PDF-import');
    expect(result.body).not.toContain('2.10.1');
    expect(result.body).not.toContain('Oude regel');
  });

  it('geeft de volledige headerregel terug zonder de ## -prefix', () => {
    const result = extractLatestChangelogEntry(SAMPLE);
    expect(result.header).toBe(
      '[2.10.2] — 2026-06-17 — Bugfix BJ1 PDF-import: sportvakken-tabel corrumpeerde deelgebiedscores'
    );
  });

  it('gooit een fout als er geen ## [-sectie gevonden wordt', () => {
    expect(() => extractLatestChangelogEntry('# Changelog\n\nGeen versies hier.')).toThrow();
  });
});
```

- [ ] **Step 2: Run tests, verifieer dat ze falen**

Run: `npx vitest run tests/extractChangelogEntry.test.ts`
Expected: FAIL — `Cannot find module '../scripts/extract-changelog-entry.mjs'`.

- [ ] **Step 3: Implementeer het script**

Create `scripts/extract-changelog-entry.mjs`:

```js
#!/usr/bin/env node
// scripts/extract-changelog-entry.mjs
// Knipt de nieuwste "## [versie] — ..."-sectie uit CHANGELOG.md.
// CLI: node scripts/extract-changelog-entry.mjs <changelog-path> <output-body-path>
// Print de versie (zonder meer) naar stdout; schrijft de body naar output-body-path.

import { readFileSync, writeFileSync } from 'node:fs';

export function extractLatestChangelogEntry(changelogText) {
  const lines = changelogText.split('\n');
  const headerIdx = lines.findIndex(l => /^##\s+\[/.test(l));
  if (headerIdx === -1) {
    throw new Error('Geen "## [versie]"-sectie gevonden in CHANGELOG.md');
  }

  let endIdx = lines.length;
  for (let i = headerIdx + 1; i < lines.length; i++) {
    if (/^##\s+\[/.test(lines[i])) {
      endIdx = i;
      break;
    }
  }

  const headerLine = lines[headerIdx];
  const versionMatch = headerLine.match(/^##\s+\[([\d.]+)\]/);
  if (!versionMatch) {
    throw new Error(`Kan geen versienummer parsen uit headerregel: "${headerLine}"`);
  }

  return {
    version: versionMatch[1],
    header: headerLine.replace(/^##\s+/, '').trim(),
    body: lines.slice(headerIdx + 1, endIdx).join('\n').trim(),
  };
}

const isMain = process.argv[1] && process.argv[1].endsWith('extract-changelog-entry.mjs');
if (isMain) {
  const [, , changelogPath, outBodyPath] = process.argv;
  if (!changelogPath || !outBodyPath) {
    console.error('Gebruik: node scripts/extract-changelog-entry.mjs <changelog-path> <output-body-path>');
    process.exit(1);
  }
  const text = readFileSync(changelogPath, 'utf8');
  const { version, body } = extractLatestChangelogEntry(text);
  writeFileSync(outBodyPath, body, 'utf8');
  process.stdout.write(version);
}
```

- [ ] **Step 4: Run tests, verifieer dat ze slagen**

Run: `npx vitest run tests/extractChangelogEntry.test.ts`
Expected: 4 tests PASS.

- [ ] **Step 5: Handmatig CLI-gedrag verifiëren**

Run: `node scripts/extract-changelog-entry.mjs CHANGELOG.md /tmp/release-body.md && echo "---" && cat /tmp/release-body.md`
Expected: de huidige nieuwste versie (op dit moment `2.10.2`) wordt geprint, gevolgd door `---` en de bijbehorende CHANGELOG-tekst in `/tmp/release-body.md`.

- [ ] **Step 6: Commit**

```bash
git add scripts/extract-changelog-entry.mjs tests/extractChangelogEntry.test.ts
git commit -m "feat: voeg extract-changelog-entry script toe voor release-automatisering"
```

---

## Task 10: `scripts/update-landing-page.mjs` — landingspagina-HTML bijwerken

**Files:**
- Create: `scripts/update-landing-page.mjs`
- Test: `tests/updateLandingPage.test.ts`

**Interfaces:**
- Consumes: `body`-tekst zoals geproduceerd door `extractLatestChangelogEntry` (Taak 9)
- Produces: `updateLandingPageHtml(html, { version, notesHtml, date }): string`, `changelogBodyToUpdateItems(body): string`, `formatDutchDate(date?): string` — herbruikt door Taak 12 (workflow).

- [ ] **Step 1: Schrijf de falende tests**

Create `tests/updateLandingPage.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  updateLandingPageHtml,
  changelogBodyToUpdateItems,
  formatDutchDate,
} from '../scripts/update-landing-page.mjs';

const SAMPLE_HTML = `
<nav><span class="nav-version">v2.10.1</span></nav>
<a href="https://github.com/Unframed7175/mentordashboard-cios/releases/download/v2.10.1/Mentordashboard.CIOS_2.10.1_aarch64.dmg">mac arm</a>
<a href="https://github.com/Unframed7175/mentordashboard-cios/releases/download/v2.10.1/Mentordashboard.CIOS_2.10.1_x64.dmg">mac intel</a>
<a href="https://github.com/Unframed7175/mentordashboard-cios/releases/download/v2.10.1/Mentordashboard.CIOS_2.10.1_x64-setup.exe">windows</a>
<div class="updates-list">
  <div class="update-card">
    <div class="update-head">
      <span class="update-version">Versie 2.10.1</span>
      <span class="update-date">17 juni 2026</span>
      <span class="update-new">Nieuwste versie</span>
    </div>
    <div class="update-items"><div class="update-item">oud</div></div>
  </div>
</div>
<footer>Versie 2.10.1 &nbsp;·&nbsp; Gegevens worden nooit gedeeld</footer>
`;

describe('changelogBodyToUpdateItems', () => {
  it('zet ### Fixed-bullets om naar Opgelost-chips', () => {
    const html = changelogBodyToUpdateItems('### Fixed\n- Iets ging mis.');
    expect(html).toContain('chip-changed');
    expect(html).toContain('Opgelost');
    expect(html).toContain('Iets ging mis.');
  });

  it('zet ### Added-bullets om naar Nieuw-chips', () => {
    const html = changelogBodyToUpdateItems('### Added\n- Nieuwe feature.');
    expect(html).toContain('chip-new');
    expect(html).toContain('Nieuw');
  });

  it('zet **vet** om naar <strong>', () => {
    const html = changelogBodyToUpdateItems('### Fixed\n- **Belangrijk** detail.');
    expect(html).toContain('<strong>Belangrijk</strong>');
  });

  it('gooit een fout als er geen herkenbare items zijn', () => {
    expect(() => changelogBodyToUpdateItems('Geen koppen of bullets hier.')).toThrow();
  });
});

describe('formatDutchDate', () => {
  it('formatteert een datum in het Nederlands', () => {
    expect(formatDutchDate(new Date(2026, 5, 17))).toBe('17 juni 2026');
  });
});

describe('updateLandingPageHtml', () => {
  const params = {
    version: '2.10.3',
    notesHtml: '        <div class="update-item"><span class="update-chip chip-changed">Opgelost</span>Nieuwe fix.</div>',
    date: '18 juni 2026',
  };

  it('werkt de nav-versiebadge bij', () => {
    const out = updateLandingPageHtml(SAMPLE_HTML, params);
    expect(out).toContain('<span class="nav-version">v2.10.3</span>');
    expect(out).not.toContain('v2.10.1<');
  });

  it('werkt alle drie de downloadlinks bij', () => {
    const out = updateLandingPageHtml(SAMPLE_HTML, params);
    expect(out).toContain('v2.10.3/Mentordashboard.CIOS_2.10.3_aarch64.dmg');
    expect(out).toContain('v2.10.3/Mentordashboard.CIOS_2.10.3_x64.dmg');
    expect(out).toContain('v2.10.3/Mentordashboard.CIOS_2.10.3_x64-setup.exe');
    expect(out).not.toContain('2.10.1_aarch64');
  });

  it('werkt de footer-versie bij', () => {
    const out = updateLandingPageHtml(SAMPLE_HTML, params);
    expect(out).toContain('Versie 2.10.3 &nbsp;');
  });

  it('voegt een nieuwe update-kaart toe met het "Nieuwste versie"-label', () => {
    const out = updateLandingPageHtml(SAMPLE_HTML, params);
    expect(out).toContain('Versie 2.10.3');
    expect(out).toContain('Nieuwe fix.');
  });

  it('verplaatst het "Nieuwste versie"-label weg van de oude kaart', () => {
    const out = updateLandingPageHtml(SAMPLE_HTML, params);
    const matches = out.match(/Nieuwste versie/g) ?? [];
    expect(matches.length).toBe(1);
  });

  it('gooit een fout als de nav-version span niet gevonden wordt', () => {
    const broken = SAMPLE_HTML.replace('nav-version', 'iets-anders');
    expect(() => updateLandingPageHtml(broken, params)).toThrow();
  });
});
```

- [ ] **Step 2: Run tests, verifieer dat ze falen**

Run: `npx vitest run tests/updateLandingPage.test.ts`
Expected: FAIL — `Cannot find module '../scripts/update-landing-page.mjs'`.

- [ ] **Step 3: Implementeer het script**

Create `scripts/update-landing-page.mjs`:

```js
#!/usr/bin/env node
// scripts/update-landing-page.mjs
// Werkt index.html van de losse ciosmentorendashboard-repo bij: nav-versiebadge,
// 3 downloadlinks, footer-versie, en een nieuwe "wat is er nieuw"-kaart.
// CLI: node scripts/update-landing-page.mjs <index-html-path> <version> <changelog-body-path>

import { readFileSync, writeFileSync } from 'node:fs';

const MAANDEN = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december',
];

export function formatDutchDate(d = new Date()) {
  return `${d.getDate()} ${MAANDEN[d.getMonth()]} ${d.getFullYear()}`;
}

const CHIP_MAP = {
  Added: { label: 'Nieuw', cls: 'chip-new' },
  Fixed: { label: 'Opgelost', cls: 'chip-changed' },
  Changed: { label: 'Gewijzigd', cls: 'chip-changed' },
  Removed: { label: 'Verwijderd', cls: 'chip-changed' },
  Breaking: { label: 'Belangrijk', cls: 'chip-changed' },
};

export function changelogBodyToUpdateItems(body) {
  const lines = body.split('\n');
  let currentSection = null;
  const items = [];

  for (const line of lines) {
    const sectionMatch = line.match(/^###\s+(\w+)/);
    if (sectionMatch) {
      currentSection = sectionMatch[1];
      continue;
    }
    const bulletMatch = line.match(/^-\s+(.*)/);
    if (bulletMatch && currentSection && CHIP_MAP[currentSection]) {
      const { label, cls } = CHIP_MAP[currentSection];
      const text = bulletMatch[1].replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      items.push(`        <div class="update-item"><span class="update-chip ${cls}">${label}</span>${text}</div>`);
    }
  }

  if (items.length === 0) {
    throw new Error('Geen herkenbare changelog-items gevonden (geen ### Added/Fixed/Changed met - bullets)');
  }
  return items.join('\n');
}

function replaceOrThrow(html, pattern, replacement, description) {
  if (!pattern.test(html)) {
    throw new Error(`update-landing-page: kon "${description}" niet vinden in index.html`);
  }
  return html.replace(pattern, replacement);
}

export function updateLandingPageHtml(html, { version, notesHtml, date }) {
  html = replaceOrThrow(
    html,
    /<span class="nav-version">v[\d.]+<\/span>/,
    `<span class="nav-version">v${version}</span>`,
    'nav-version span'
  );

  html = replaceOrThrow(
    html,
    /v\d+\.\d+\.\d+\/Mentordashboard\.CIOS_\d+\.\d+\.\d+_/g,
    `v${version}/Mentordashboard.CIOS_${version}_`,
    'downloadlinks'
  );

  html = replaceOrThrow(
    html,
    /Versie [\d.]+ &nbsp;/,
    `Versie ${version} &nbsp;`,
    'footer-versie'
  );

  html = replaceOrThrow(
    html,
    /\s*<span class="update-new">Nieuwste versie<\/span>/,
    '',
    '"Nieuwste versie"-badge'
  );

  const anchor = '<div class="updates-list">';
  if (!html.includes(anchor)) {
    throw new Error('update-landing-page: kon updates-list container niet vinden in index.html');
  }
  const newCard = `
      <div class="update-card">
        <div class="update-head">
          <span class="update-version">Versie ${version}</span>
          <span class="update-date">${date}</span>
          <span class="update-new">Nieuwste versie</span>
        </div>
        <div class="update-items">
${notesHtml}
        </div>
      </div>`;
  html = html.replace(anchor, anchor + newCard);

  return html;
}

const isMain = process.argv[1] && process.argv[1].endsWith('update-landing-page.mjs');
if (isMain) {
  const [, , htmlPath, version, changelogBodyPath] = process.argv;
  if (!htmlPath || !version || !changelogBodyPath) {
    console.error('Gebruik: node scripts/update-landing-page.mjs <index-html-path> <version> <changelog-body-path>');
    process.exit(1);
  }
  const html = readFileSync(htmlPath, 'utf8');
  const body = readFileSync(changelogBodyPath, 'utf8');
  const notesHtml = changelogBodyToUpdateItems(body);
  const updated = updateLandingPageHtml(html, { version, notesHtml, date: formatDutchDate() });
  writeFileSync(htmlPath, updated, 'utf8');
  console.log(`index.html bijgewerkt naar versie ${version}`);
}
```

- [ ] **Step 4: Run tests, verifieer dat ze slagen**

Run: `npx vitest run tests/updateLandingPage.test.ts`
Expected: 11 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/update-landing-page.mjs tests/updateLandingPage.test.ts
git commit -m "feat: voeg update-landing-page script toe voor website-automatisering"
```

---

## Task 11: `release.yml` — signing secrets + CHANGELOG als release body

**Files:**
- Modify: `.github/workflows/release.yml`

**Interfaces:**
- Consumes: `scripts/extract-changelog-entry.mjs` (Taak 9), GitHub-secrets `TAURI_SIGNING_PRIVATE_KEY` / `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` (Taak 2)

- [ ] **Step 1: Stap toevoegen die de CHANGELOG-body extraheert**

In `.github/workflows/release.yml`, voeg een nieuwe stap toe direct na `Install frontend dependencies` en vóór `Build and release`:

```yaml
      - name: Extract changelog entry for release body
        id: changelog
        run: |
          node scripts/extract-changelog-entry.mjs CHANGELOG.md /tmp/release-body.md
```

- [ ] **Step 2: tauri-action-stap bijwerken**

Vervang de bestaande `Build and release`-stap:

```yaml
      - name: Build and release
        uses: tauri-apps/tauri-action@fce9c6108b31ea247710505d3aaaa893ee6768d4 # v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          APPLE_SIGNING_IDENTITY: '-'
        with:
          tagName: ${{ github.ref_name }}
          releaseName: 'Mentordashboard CIOS ${{ github.ref_name }}'
          releaseBody: See the release notes below for installation instructions.
          releaseDraft: false
          prerelease: false
          args: ${{ matrix.args }}
```

door:

```yaml
      - name: Build and release
        uses: tauri-apps/tauri-action@fce9c6108b31ea247710505d3aaaa893ee6768d4 # v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          APPLE_SIGNING_IDENTITY: '-'
          TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
          TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}
        with:
          tagName: ${{ github.ref_name }}
          releaseName: 'Mentordashboard CIOS ${{ github.ref_name }}'
          releaseBodyFile: /tmp/release-body.md
          releaseDraft: false
          prerelease: false
          args: ${{ matrix.args }}
```

(`releaseBodyFile` vervangt `releaseBody` — `tauri-action` ondersteunt beide inputs; met een bestandspad i.p.v. een statische string kan de CHANGELOG-tekst, inclusief regeleinden, zonder YAML-escaping-gedoe worden meegegeven.)

- [ ] **Step 3: Inspringing en structuur handmatig controleren**

Run: `cat -A .github/workflows/release.yml | grep -n "TAURI_SIGNING\|releaseBodyFile" | cat -A`
Expected: de nieuwe `env:`-regels staan op exact hetzelfde inspringingsniveau (10 spaties) als de bestaande `GITHUB_TOKEN`/`APPLE_SIGNING_IDENTITY`-regels, en `releaseBodyFile:` staat op het inspringingsniveau van de andere `with:`-keys (10 spaties). Geen tabs (`cat -A` toont tabs als `^I` — die mogen niet voorkomen). Echte YAML-parsevalidatie gebeurt door GitHub zelf zodra de workflow getriggerd wordt (Taak 14, Step 3) — een syntaxfout daar is direct zichtbaar als "workflow file issue" in de Actions-tab.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/release.yml
git commit -m "feat: signeer release-artefacten en gebruik CHANGELOG als release body"
```

---

## Task 12: `update-landing-page.yml` — nieuwe workflow

**Files:**
- Create: `.github/workflows/update-landing-page.yml`

**Interfaces:**
- Consumes: `scripts/extract-changelog-entry.mjs` (Taak 9), `scripts/update-landing-page.mjs` (Taak 10), GitHub-secret `LANDING_PAGE_PAT`

- [ ] **Step 1: MENSELIJKE CHECKPOINT — PAT aanmaken**

Pauzeer hier. Vraag de projecteigenaar (jij hebt dit al toegezegd in de brainstorm-fase, dit is het moment om het echt te doen):

> "Maak nu een fine-grained Personal Access Token aan op GitHub (Settings → Developer settings → Fine-grained tokens) met **alleen schrijfrechten (Contents: Read and write) op de repo `Unframed7175/ciosmentorendashboard`**, en geef me de tokenwaarde zodat ik 'm als secret kan opslaan — of zet 'm zelf met `gh secret set LANDING_PAGE_PAT --repo Unframed7175/mentordashboard-cios`."

Verifieer na het zetten: `gh secret list --repo Unframed7175/mentordashboard-cios` toont `LANDING_PAGE_PAT`.

- [ ] **Step 2: Workflow-bestand aanmaken**

Create `.github/workflows/update-landing-page.yml`:

```yaml
name: Update landing page

on:
  release:
    types: [published]
  workflow_dispatch: {}

permissions:
  contents: read

jobs:
  update-landing-page:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout mentordashboard-cios (voor de scripts)
        uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4
        with:
          path: main-repo

      - name: Checkout ciosmentorendashboard
        uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4
        with:
          repository: Unframed7175/ciosmentorendashboard
          token: ${{ secrets.LANDING_PAGE_PAT }}
          path: landing-page

      - name: Setup Node.js
        uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4
        with:
          node-version: lts/*

      - name: Extract changelog entry
        run: |
          node main-repo/scripts/extract-changelog-entry.mjs main-repo/CHANGELOG.md /tmp/release-body.md

      - name: Update index.html
        run: |
          VERSION="${{ github.event.release.tag_name }}"
          VERSION="${VERSION#v}"
          node main-repo/scripts/update-landing-page.mjs landing-page/index.html "$VERSION" /tmp/release-body.md

      - name: Commit en push
        working-directory: landing-page
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add index.html
          git diff --staged --quiet && echo "Geen wijzigingen" && exit 0
          git commit -m "fix: update landingspagina naar ${{ github.event.release.tag_name }}"
          git push origin main
```

- [ ] **Step 3: Lokaal de scriptaanroepen dry-runnen**

Run (zonder te committen/pushen, puur de scriptlogica testen op een kopie):
```bash
mkdir -p /tmp/landing-test && cp /private/tmp/ciosmentorendashboard/index.html /tmp/landing-test/index.html
node scripts/extract-changelog-entry.mjs CHANGELOG.md /tmp/release-body.md
node scripts/update-landing-page.mjs /tmp/landing-test/index.html 9.9.9 /tmp/release-body.md
grep "9.9.9" /tmp/landing-test/index.html
```
Expected: meerdere regels met `9.9.9` (nav-badge, downloadlinks, footer, nieuwe kaart) — bevestigt dat de twee scripts correct samenwerken vóórdat de GitHub-workflow ze in CI gebruikt. Ruim na controle op: `rm -rf /tmp/landing-test`.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/update-landing-page.yml
git commit -m "feat: automatiseer landingspagina-update bij elke release"
```

---

## Task 13: `.gsd/KNOWLEDGE.md` bijwerken — handmatig proces vervangen door automatisch

**Files:**
- Modify: `.gsd/KNOWLEDGE.md`

- [ ] **Step 1: Sectie bijwerken**

Zoek de sectie `## Releaseproces — landingspagina altijd meenemen` (toegevoegd op 2026-06-17) en vervang de volledige inhoud door:

```markdown
## Releaseproces — landingspagina wordt automatisch bijgewerkt

Sinds de implementatie van het auto-update systeem (zie
`docs/superpowers/specs/2026-06-17-auto-update-systeem-design.md`) gebeurt dit automatisch:

1. Tag `vX.Y.Z` pushen → `release.yml` bouwt, signeert en publiceert de release met de nieuwste
   `CHANGELOG.md`-sectie als release body.
2. Zodra de release gepubliceerd is, triggert `update-landing-page.yml` automatisch en werkt
   `ciosmentorendashboard/index.html` bij (nav-badge, downloadlinks, footer, nieuwe update-kaart).

**Controleren of het gelukt is:** `gh run list --repo Unframed7175/mentordashboard-cios --workflow update-landing-page.yml --limit 3`

**Bij falen** (bv. verlopen `LANDING_PAGE_PAT`-secret, of `index.html`-structuur handmatig gewijzigd
zodat het script geen ankerpunt meer vindt): de workflow faalt zichtbaar in de Actions-tab zonder
de pagina te committen. Werk in dat geval `ciosmentorendashboard/index.html` eenmalig handmatig bij
(dezelfde 6 plekken: nav-versiebadge, 3 downloadlinks, footer-versie, nieuwe update-kaart) en
onderzoek waarom het script faalde voordat de volgende release verschijnt.
```

- [ ] **Step 2: Commit**

```bash
git add .gsd/KNOWLEDGE.md
git commit -m "docs: documenteer dat landingspagina-update nu automatisch gebeurt"
```

---

## Task 14: Eind-tot-eind verificatie (handmatige release-dry-run)

**Files:** geen code — dit is een verificatietaak.

- [ ] **Step 1: Volledige testsuite + typecheck**

Run: `npx vitest run && npx tsc --noEmit`
Expected: alle tests PASS; geen nieuwe TypeScript-errors t.o.v. de stand vóór dit plan.

- [ ] **Step 2: Rust build-check (geen volledige bundle, te traag voor lokaal)**

Run: `cd src-tauri && cargo check`
Expected: `Finished` zonder errors.

- [ ] **Step 3: Patch-release uitvoeren om de hele keten te verifiëren**

Volg het bestaande releaseproces (versiebump in `package.json` + `src-tauri/tauri.conf.json` +
nieuwe `CHANGELOG.md`-entry, commit, `git tag vX.Y.Z`, push commit + tag). Volg daarna:

```bash
gh run watch --repo Unframed7175/mentordashboard-cios --exit-status  # wacht op release.yml
gh release view vX.Y.Z --repo Unframed7175/mentordashboard-cios       # bevestig latest.json + .sig-bestanden als assets
gh run list --repo Unframed7175/mentordashboard-cios --workflow update-landing-page.yml --limit 1  # bevestig success
```

Expected: `gh release view` toont naast de .dmg/.exe-bestanden ook `latest.json` en `.sig`-bestanden
per platform; de `update-landing-page`-run staat op `success`; `ciosmentorendashboard/index.html`
toont de nieuwe versie (controleer via `curl -s https://unframed7175.github.io/ciosmentorendashboard/ | grep nav-version`).

- [ ] **Step 4: In-app update-flow handmatig testen**

Installeer de vorige versie lokaal (of gebruik een gebouwde dev-versie met een oudere
`tauri.conf.json`-versie), start de app, en bevestig: het `UpdateModal` verschijnt met de juiste
patch notes, "Update nu" downloadt en herstart de app naar de nieuwe versie. Dit is niet
geautomatiseerd te testen (vereist een echte signed release + een eerder geïnstalleerde build) —
documenteer het resultaat in `.gsd/STATE.md` onder een `## Handoff`-sectie voor deze milestone.

---

## Self-Review (uitgevoerd bij het schrijven van dit plan)

- **Spec-dekking:** Component A (Taak 1-2), Component B (Taak 3-8), Component C (Taak 9, 11),
  Component D (Taak 10, 12), foutafhandeling (verwerkt in Taak 5/6/10 als expliciete tests),
  teststrategie (elke taak heeft TDD-stappen), `.gsd/KNOWLEDGE.md`-update (Taak 13). Alle secties
  uit de spec hebben een corresponderende taak.
- **Placeholder-scan:** geen "TBD"/"implement later" — elke stap heeft volledige code.
- **Type-consistentie:** `Update`-type (uit `@tauri-apps/plugin-updater`) wordt consistent gebruikt
  in Taak 5 (return-type `checkForUpdate`), Taak 7 (`App.tsx`-state) en Taak 8
  (`SettingsPage.tsx`-state) — geen losse, zelfgemaakte `UpdateInfo`-vorm meer na Taak 5.
  `UpdateModalProps` (Taak 6) wordt identiek aangeroepen in Taak 7 en Taak 8.

# Phase 30: Documentatie, Help & CI — Research

**Researched:** 2026-05-28
**Domain:** GitHub Actions CI (Tauri 2), React in-app help view, Markdown documentation
**Confidence:** HIGH

---

## Summary

Phase 30 has three parallel workstreams: (1) an in-app HelpPage React component reachable via
the existing `view` state machine, (2) markdown documentation files (INSTRUCTIES.md, TESTPLAN.md)
in the repo root, and (3) a GitHub Actions CI workflow that builds on both Windows x64 and macOS
Apple Silicon on every push to `main`.

The CI workstream is the highest technical risk and has the most external dependencies (GitHub,
Rust toolchain installation on hosted runners). The good news is that an existing `release.yml`
workflow is already in the repo at `.github/workflows/release.yml` — it covers exactly the same
matrix (windows-latest + macos-latest) and uses the same `tauri-apps/tauri-action@v0` action.
Phase 30 needs a NEW workflow file `ci.yml` that mirrors the release build but triggers on
`push: branches: [main]` instead of tags, drops the release publishing step, and treats a
successful build (exit code 0) as the smoke test. No separate test runner is needed.

The help view integrates cleanly with App.tsx: add `'help'` to the `view` union, add a `?`
button to KlasTabStrip (analogous to the existing settings gear and feedback bug icon), and add
a `HelpPage` component. The Settings navigation pattern (handleOpenSettings / handleBackFromSettings
preserving prevView) can be reused verbatim for help.

Documentation (INSTRUCTIES.md, TESTPLAN.md) is pure writing — no code dependencies — but its
content must reflect the final app behaviour from Phases 25–29.

**Primary recommendation:** Write `ci.yml` by modifying `release.yml` (drop `tauri-apps/tauri-action`
release arguments, change trigger, keep the build matrix unchanged). Add `'help'` to the view
union and follow the exact settings/feedback navigation pattern.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| HELP-01 | In-app helppagina met stap-voor-stap uitleg | HelpPage component, view routing pattern in §Architecture Patterns |
| HELP-02 | Bereikbaar via "?" knop in navigatie | KlasTabStrip button pattern (§Existing Nav Button Pattern) |
| HELP-03 | INSTRUCTIES.md: installatie, gebruik, beperkingen | Content outline in §Documentation Content (INSTRUCTIES.md) |
| HELP-04 | INSTRUCTIES.md contactinfo + bug melden (verwijst naar FEED-knop) | FeedbackModal already ships mailto:ralvarezstam@cioszuidwest.nl |
| TEST-01 | CI builds on Windows x64 bij push naar main | release.yml pattern + ci.yml adaptation in §CI Workflow |
| TEST-02 | CI builds on macOS Apple Silicon bij push naar main | aarch64-apple-darwin arm in release.yml — reused in ci.yml |
| TEST-03 | Smoke test = build exit code 0 | npm run build exit code from tauri-action (§CI Smoke Test) |
| TEST-04 | TESTPLAN.md stap-voor-stap testscenario's | Content outline in §Documentation Content (TESTPLAN.md) |
| TEST-05 | Testchecklist met verwacht gedrag per stap | Scenario table format in §Documentation Content (TESTPLAN.md) |
</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Help view routing | Frontend (React) | — | Extends existing `view` union in App.tsx; no backend needed |
| "?" nav button | Frontend (React, KlasTabStrip) | — | Same tier as existing settings/feedback buttons |
| HelpPage content | Frontend (React component) | — | Static JSX, no store calls needed |
| CI build matrix | GitHub Actions | Tauri CLI on runner | Build happens on GitHub-hosted runners, not in the app |
| INSTRUCTIES.md / TESTPLAN.md | Repo root (documentation) | — | Pure markdown, consumed by humans not code |

---

## Standard Stack

### Core

| Library / Tool | Version | Purpose | Why Standard |
|----------------|---------|---------|--------------|
| `tauri-apps/tauri-action@v0` | v0 (latest v0.x) | GitHub Action that runs `tauri build` | Official Tauri action; already used in release.yml [VERIFIED: .github/workflows/release.yml] |
| `actions/checkout@v4` | v4 | Checkout repo on runner | Standard; already used in release.yml [VERIFIED: .github/workflows/release.yml] |
| `actions/setup-node@v4` | v4 | Install Node LTS | Standard; already used in release.yml [VERIFIED: .github/workflows/release.yml] |
| `dtolnay/rust-toolchain@stable` | stable | Install Rust stable + optional extra targets | Already used in release.yml; well-established in Tauri CI [VERIFIED: .github/workflows/release.yml] |
| React + TypeScript | existing | HelpPage component | Same stack as every other view in the project [VERIFIED: package.json] |

### Supporting

| Library / Tool | Version | Purpose | When to Use |
|----------------|---------|---------|-------------|
| `actions/cache@v4` | v4 | Cache Cargo registry + target dir | Optional — speeds up repeated CI runs; add if build time is a concern |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `tauri-apps/tauri-action@v0` | Custom shell `npm run build` step | tauri-action handles cross-platform nuances (signingIdentity, APPLE_SIGNING_IDENTITY env); custom step needs more boilerplate |
| Help as full view route | Modal overlay | View route allows deep linking and is consistent with settings pattern; modal is lighter but breaks navigation history |

---

## Package Legitimacy Audit

Phase 30 installs **no new npm or Cargo packages**. All packages used (tauri-action in CI,
React in app) are already installed and verified in prior phases.

| Package | Registry | Status | Disposition |
|---------|----------|--------|-------------|
| `tauri-apps/tauri-action` | GitHub Actions Marketplace | Official Tauri org action, in use since Phase 15 [VERIFIED: .github/workflows/release.yml] | Approved |
| All other npm packages | npm | Unchanged from prior phases | Approved |

**Packages removed due to slopcheck verdict:** none
**Packages flagged as suspicious:** none

---

## Architecture Patterns

### System Architecture Diagram

```
User click "?" in KlasTabStrip
        |
        v
App.tsx: handleOpenHelp()
  - store prevView (same as handleOpenSettings pattern)
  - setView('help')
        |
        v
HelpPage component
  - Static JSX sections: installatie, importeren, bekijken, afdrukken, bug melden
  - "Terug" button → handleBackFromHelp() → setView(prevView)
  - Reference to FeedbackModal via text/link (HELP-04)
```

```
GitHub push to main
        |
        v
ci.yml: triggers on push: branches: [main]
        |
        v
Matrix job × 2:
  [windows-latest, --bundles nsis --target x86_64-pc-windows-msvc]
  [macos-latest,   --target aarch64-apple-darwin]
        |
        v
Each runner:
  checkout → setup-node LTS → dtolnay/rust-toolchain stable (+target) → npm ci
        |
        v
tauri-apps/tauri-action@v0 (NO tagName/releaseName/releaseBody args)
  → runs `npm run build` (= tauri build) internally
  → exits 0 = TEST-01/TEST-02/TEST-03 satisfied
```

### Recommended Project Structure

```
repo root
├── INSTRUCTIES.md         # new — tester installation + usage guide (HELP-03, HELP-04)
├── TESTPLAN.md            # new — manual test scenarios (TEST-04, TEST-05)
├── .github/
│   └── workflows/
│       ├── release.yml    # existing — tag-triggered release (unchanged)
│       └── ci.yml         # new — push-to-main CI smoke build
└── src/
    └── components/
        └── HelpPage.tsx   # new — in-app help view (HELP-01, HELP-02)
```

### Pattern 1: Adding a New View (mirrors Settings pattern)

The settings view pattern in App.tsx is the canonical template for Help. From the codebase
[VERIFIED: src/App.tsx]:

```typescript
// In App.tsx state union — add 'help':
const [view, setView] = useState<'import' | 'klas' | 'detail' | 'settings' | 'onboarding' | 'help'>(...)

// prevView tracks last content view before overlay views (settings, help)
// Already typed as 'import' | 'klas' | 'detail' — NO change needed to prevView type

function handleOpenHelp() {
  const safeView = (view === 'import' || view === 'klas' || view === 'detail')
    ? view : 'klas';
  setPrevView(safeView);  // reuse existing prevView state
  setView('help');
}

function handleBackFromHelp() {
  setView(prevView);
}

// In JSX:
{view === 'help' && (
  <div className="view-slide-in-right" style={{ overflow: 'hidden' }}>
    <HelpPage onBack={handleBackFromHelp} />
  </div>
)}
```

**Why reuse prevView:** `prevView` is already typed as `'import' | 'klas' | 'detail'` (the three
content views). Settings already uses this same field. Help can share it safely — only one
overlay view is ever active at a time.

**Critical constraint:** The `isSettingsActive` prop on KlasTabStrip checks `view === 'settings'`.
A corresponding `isHelpActive` prop should be added for visual highlighting of the `?` button.

### Pattern 2: KlasTabStrip "?" Button (mirrors Feedback/Settings button)

From the codebase [VERIFIED: src/components/KlasTabStrip.tsx]:

The nav currently has (in order, left to right):
1. Logo image
2. Klas tabs (dynamic)
3. `+` new klas button
4. Bug icon button (`onFeedback`) — SVG icon
5. Settings gear button (`onSettings`, `style={{ marginLeft: 'auto' }}`)

The `?` help button fits between the bug button and the settings gear. Insert before the
settings button. Proposed placement:

```tsx
// Props additions to KlasTabStripProps:
onHelp: () => void;
isHelpActive: boolean;

// Button JSX (inserted before settings gear):
<button
  className={`nav-tab${isHelpActive ? ' active' : ''}`}
  title="Help"
  aria-label="Help openen"
  onClick={onHelp}
>
  ?
</button>
```

Using a plain `?` character (not SVG) is consistent with the `+` button style and avoids
adding a new SVG asset.

### Pattern 3: CI Workflow (derived from release.yml)

From the existing workflow [VERIFIED: .github/workflows/release.yml]:

The `ci.yml` workflow is `release.yml` with:
1. Trigger changed: `push: tags: ['v*']` → `push: branches: [main]`
2. `workflow_dispatch: {}` kept (useful for manual re-runs)
3. `permissions: contents: write` can be dropped (no release creation needed) or kept (harmless)
4. Matrix: keep `windows-latest` (NSIS, x64) and `macos-latest` (aarch64-apple-darwin) — drop the x86_64-apple-darwin macOS Intel job (not needed per STATE.md note)
5. `tauri-apps/tauri-action@v0` call: **remove** `tagName`, `releaseName`, `releaseBody`,
   `releaseDraft`, `prerelease` keys — these trigger release creation. Keep `args` and
   `APPLE_SIGNING_IDENTITY: '-'`.
6. `GITHUB_TOKEN` env var is still needed by tauri-action internally (artifact upload, even
   without a release). Keep it.

```yaml
name: CI

on:
  push:
    branches:
      - main
  workflow_dispatch: {}

jobs:
  build:
    strategy:
      fail-fast: false
      matrix:
        include:
          - platform: macos-latest
            args: '--target aarch64-apple-darwin'
            rust-targets: 'aarch64-apple-darwin'
          - platform: windows-latest
            args: '--bundles nsis --target x86_64-pc-windows-msvc'
            rust-targets: ''
    runs-on: ${{ matrix.platform }}
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: lts/*
      - name: Install Rust stable
        uses: dtolnay/rust-toolchain@stable
        with:
          targets: ${{ matrix.rust-targets }}
      - name: Install frontend dependencies
        run: npm ci
      - name: Build
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          APPLE_SIGNING_IDENTITY: '-'
        with:
          args: ${{ matrix.args }}
```

**Smoke test (TEST-03):** `tauri-apps/tauri-action` exits non-zero if `npm run build` fails.
GitHub Actions marks the job as failed. This IS the smoke test — no additional step needed.

### Pattern 4: HelpPage Component Structure

```tsx
// src/components/HelpPage.tsx
interface HelpPageProps {
  onBack: () => void;
}

export default function HelpPage({ onBack }: HelpPageProps) {
  return (
    <div className="help-page">
      <div className="detail-header">
        <button className="back-btn" onClick={onBack}>← Terug</button>
        <h1 className="detail-title">Help</h1>
      </div>
      <div className="help-content">
        <section className="detail-section">
          <h2 className="detail-section-title">Stap 1: Importeren</h2>
          {/* ... step content */}
        </section>
        <section className="detail-section">
          <h2 className="detail-section-title">Stap 2: Bekijken</h2>
          {/* ... */}
        </section>
        <section className="detail-section">
          <h2 className="detail-section-title">Stap 3: Afdrukken</h2>
          {/* ... */}
        </section>
        <section className="detail-section">
          <h2 className="detail-section-title">Stap 4: Bug melden</h2>
          <p>Gebruik de <strong>🐛 Fout melden</strong> knop in de navigatiebalk...</p>
        </section>
      </div>
    </div>
  );
}
```

Use existing CSS classes `.detail-section`, `.detail-section-title`, `.detail-header`
(already in `src/index.css`) — no new CSS classes needed for the content areas.

A `.help-page` wrapper class and `.help-content` with `max-width` + `margin: 0 auto` may be
needed for layout (similar to how `.settings-page` is styled).

### Anti-Patterns to Avoid

- **Don't create a separate modal for Help**: The settings page uses a full-view pattern.
  Help content is long enough to warrant a full view, not a modal.
- **Don't add a third trigger to prevView type**: `prevView` state is typed as
  `'import' | 'klas' | 'detail'` — it stores only content views, not overlay views.
  Help and Settings both read AND write `prevView`; they never run concurrently.
- **Don't add a second macOS Intel job to ci.yml**: STATE.md explicitly says Apple Silicon
  (`macos-latest`) only. `release.yml` has both arm + Intel but CI needs only arm.
- **Don't use `tauri-apps/tauri-action` release arguments in ci.yml**: Omitting `tagName`
  prevents a draft release from being created on every main push.
- **Don't put INSTRUCTIES.md inside `.planning/`**: It belongs in the repo root where GitHub
  renders it directly and testers can find it.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CI build matrix | Custom shell scripts per OS | `tauri-apps/tauri-action@v0` | Action handles Rust target setup, signingIdentity env, cross-platform build args — already proven in release.yml |
| Rust target installation | `rustup target add` shell step | `dtolnay/rust-toolchain@stable` with `targets:` | Action installs toolchain + targets atomically, handles caching |
| Help routing | Custom router library | Extend existing `view` state union | App already uses a simple view state machine — no router library installed or needed |
| Help styling | New CSS component library | Existing `.detail-section` / `.detail-section-title` CSS classes | Already in index.css, consistent with all other views |

**Key insight:** The CI infrastructure is a minor adaptation of the existing release workflow,
not a new build from scratch. Reuse is the dominant principle.

---

## Common Pitfalls

### Pitfall 1: Release Created on Every Main Push

**What goes wrong:** If `tagName`, `releaseName`, or `releaseBody` are left in `ci.yml`,
`tauri-apps/tauri-action@v0` creates a GitHub Release on every push to main.

**Why it happens:** The action checks for the presence of these keys; if present, it creates
a release regardless of trigger type.

**How to avoid:** Omit ALL release-related keys (`tagName`, `releaseName`, `releaseBody`,
`releaseDraft`, `prerelease`) from the `with:` block in ci.yml. Keep only `args:`.

**Warning signs:** A GitHub Release draft appears in the repo after the first CI run.

### Pitfall 2: macOS Build Fails — "app is damaged" / No signingIdentity

**What goes wrong:** macOS build succeeds in CI but the produced DMG is rejected by Gatekeeper
on Apple Silicon machines.

**Why it happens:** `APPLE_SIGNING_IDENTITY: '-'` must be set in the CI env block. If omitted,
the binary is unsigned and macOS blocks it.

**How to avoid:** Copy the `APPLE_SIGNING_IDENTITY: '-'` env var from `release.yml` into
`ci.yml`. This is already documented in STATE.md [VERIFIED: .planning/STATE.md].

**Warning signs:** `tauri-apps/tauri-action` step succeeds (exit 0) but the produced `.dmg`
cannot be opened on Apple Silicon.

### Pitfall 3: Help View Breaks prevView Logic

**What goes wrong:** Navigating Settings → Help (or Help → Settings) corrupts `prevView`, and
the "Terug" button goes to the wrong view.

**Why it happens:** If `handleOpenHelp` is called while `view === 'settings'`, the `safeView`
guard falls back to `'klas'` (because `'settings'` is not in the `'import' | 'klas' | 'detail'`
union). This is correct behaviour — the guard prevents overlay views from being stored in
prevView.

**How to avoid:** Copy the exact `safeView` guard from `handleOpenSettings`. Do NOT modify the
`prevView` type. Since only one overlay is active at a time, no conflict occurs.

**Warning signs:** Clicking "Terug" from Help lands on Settings, or vice versa.

### Pitfall 4: `isHelpActive` Prop Not Wired

**What goes wrong:** The `?` button in KlasTabStrip does not highlight when the help view is
active, creating inconsistency with the settings gear behaviour.

**Why it happens:** `isSettingsActive` is a prop that App.tsx passes as `view === 'settings'`.
Help needs an analogous `isHelpActive={view === 'help'}` prop.

**How to avoid:** Add `isHelpActive: boolean` to `KlasTabStripProps` and pass
`isHelpActive={view === 'help'}` from App.tsx.

### Pitfall 5: Vitest Tests Break Due to Unknown View Type

**What goes wrong:** Existing tests that render `<App />` or mock the view state may get
TypeScript errors after adding `'help'` to the view union.

**Why it happens:** Tests may use `setState('import')` etc. in typed fixtures. Adding `'help'`
to the union is non-breaking but TypeScript will surface missing cases in exhaustive switches.

**How to avoid:** After adding `'help'` to the union, run `npm test` and fix any TS errors
in test files.

---

## Documentation Content

### INSTRUCTIES.md Outline (HELP-03, HELP-04)

The file must cover:

1. **Wat is dit?** — one-paragraph intro (mentordashboard CIOS, desktop app)
2. **Installatie op Windows**
   - Download `.exe` van GitHub Releases (link to releases page)
   - Installer uitvoeren → `currentUser` install (geen admin vereist)
   - Windows SmartScreen popup: "Toch uitvoeren" klikken
3. **Installatie op macOS**
   - Download `.dmg` van GitHub Releases
   - Sleep naar Applications
   - Bij "damaged app" waarschuwing: `xattr -c /Applications/Mentordashboard\ CIOS.app` terminal commando
   - Alternatief: Systeeminstellingen → Privacy & beveiliging → Toch openen
4. **Eerste gebruik** — verwijzing naar de onboarding wizard
5. **Bestanden importeren**
   - SomToday voortgang PDFs (meerdere tegelijk)
   - Verzuim Excel (.xls van SomToday)
   - Stage BPV Excel (apart bestand)
6. **Dashboard bekijken** — klas tabs, tegels, detailweergave, afdrukken
7. **Bekende beperkingen**
   - BPV kolom-matchers vereisen specifiek SomToday-formaat
   - Rekenen/Nederlands sectie optioneel in PDF
   - Geen automatische updates
8. **Bug melden** — gebruik de "🐛 Fout melden" knop in de navigatiebalk;
   dit opent de e-mailapp met `rafaelalvarez1010@gmail.com` vooringevuld
   (HELP-04: verwijst naar FeedbackModal — `DEVELOPER_EMAIL = 'ralvarezstam@cioszuidwest.nl'`
   is the address in utils/feedback.ts [VERIFIED: .planning/phases/28-bug-feedback-rapportage/28-01-PLAN.md])

> Note: The email address in `utils/feedback.ts` is `ralvarezstam@cioszuidwest.nl`.
> INSTRUCTIES.md should use this same address for consistency.

### TESTPLAN.md Outline (TEST-04, TEST-05)

Scenario-table format:

```markdown
## Testscenario 1: Installatie Windows
| Stap | Actie | Verwacht resultaat | Geslaagd? |
|------|-------|--------------------|-----------|
| 1 | Download .exe van Releases pagina | Bestand download naar Downloads map | ☐ |
| 2 | Dubbelklik installer | SmartScreen popup verschijnt | ☐ |
| 3 | Klik "Toch uitvoeren" | Installer wizard opent | ☐ |
| 4 | Voltooi installatie | App verschijnt in Startmenu | ☐ |
| 5 | Start app | Onboarding wizard verschijnt (eerste keer) | ☐ |
```

Scenario coverage for TESTPLAN.md:
- Scenario 1: Installatie Windows
- Scenario 2: Installatie macOS
- Scenario 3: Onboarding wizard (eerste keer)
- Scenario 4: PDF importeren (SomToday voortgangsrapport)
- Scenario 5: Verzuim Excel importeren
- Scenario 6: BPV stage Excel importeren
- Scenario 7: Detailweergave bekijken (deelgebieden, prognose, verzuim)
- Scenario 8: Fase-vergelijking (fase 1 + fase 2 PDFs importeren, trend pijl zichtbaar)
- Scenario 9: Afdrukken / Print-to-PDF
- Scenario 10: Bug melden via 🐛 knop
- Scenario 11: Instellingen aanpassen (drempelwaarden, dark mode)
- Scenario 12: Klas hernoemen / verwijderen
- Scenario 13: Help pagina openen en sluiten

---

## Code Examples

### Adding 'help' to view union in App.tsx

```typescript
// Source: src/App.tsx (existing pattern, extend with 'help')
const [view, setView] = useState<'import' | 'klas' | 'detail' | 'settings' | 'onboarding' | 'help'>(
  () => (klassenState.onboardingCompleted || Object.values(klassenState.klassen).some((k: any) => k.students?.length > 0))
    ? 'import' : 'onboarding'
);
```

### KlasTabStrip props extension

```typescript
// Source: src/components/KlasTabStrip.tsx (extend existing interface)
interface KlasTabStripProps {
  // ... existing props unchanged ...
  onHelp: () => void;       // new
  isHelpActive: boolean;    // new
}
```

### Vitest test for HelpPage (required by nyquist_validation)

```typescript
// tests/HelpPage.test.tsx — Wave 0 RED scaffold
import { render, screen, fireEvent } from '@testing-library/react';
import HelpPage from '../src/components/HelpPage';

describe('HelpPage', () => {
  it('renders help heading', () => {
    render(<HelpPage onBack={() => {}} />);
    expect(screen.getByRole('heading', { name: /help/i })).toBeInTheDocument();
  });
  it('calls onBack when Terug is clicked', () => {
    const onBack = vi.fn();
    render(<HelpPage onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: /terug/i }));
    expect(onBack).toHaveBeenCalledOnce();
  });
  it('renders importeren section', () => {
    render(<HelpPage onBack={() => {}} />);
    expect(screen.getByText(/importeren/i)).toBeInTheDocument();
  });
  it('renders bug melden section', () => {
    render(<HelpPage onBack={() => {}} />);
    expect(screen.getByText(/fout melden/i)).toBeInTheDocument();
  });
});
```

---

## Runtime State Inventory

Not applicable — Phase 30 is greenfield (new files only: ci.yml, HelpPage.tsx,
INSTRUCTIES.md, TESTPLAN.md). No rename, refactor, or migration involved.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | npm ci in CI | ✓ (runner: setup-node@v4) | lts/* | — |
| Rust stable | tauri build in CI | ✓ (runner: dtolnay/rust-toolchain) | stable | — |
| GitHub Actions | CI workflow | ✓ (repo already has .github/workflows/) | — | — |
| Vitest | HelpPage tests | ✓ | ^4.1.6 [VERIFIED: package.json] | — |

**Missing dependencies with no fallback:** none

**Note on CI secrets:** `GITHUB_TOKEN` is automatically available in GitHub Actions workflows;
no manual secret configuration is needed.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.6 |
| Config file | vite.config.ts (vitest block) |
| Quick run command | `npx vitest run tests/HelpPage.test.tsx` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HELP-01 | HelpPage renders stap-voor-stap content | unit | `npx vitest run tests/HelpPage.test.tsx` | No — Wave 0 |
| HELP-02 | "?" button triggers onHelp callback | unit | `npx vitest run tests/KlasTabStrip.test.tsx` | Yes (extend) |
| HELP-03 | INSTRUCTIES.md file exists in repo root | manual | `ls INSTRUCTIES.md` | No — Wave 0 |
| HELP-04 | INSTRUCTIES.md mentions bug knop + email | manual | — | No |
| TEST-01 | CI builds on Windows x64 | CI (GitHub Actions) | `gh run list --workflow=ci.yml` | No — Wave 0 |
| TEST-02 | CI builds on macOS ARM | CI (GitHub Actions) | `gh run list --workflow=ci.yml` | No — Wave 0 |
| TEST-03 | Build exit 0 = smoke test | CI | same as above | No |
| TEST-04 | TESTPLAN.md exists in repo root | manual | `ls TESTPLAN.md` | No — Wave 0 |
| TEST-05 | TESTPLAN.md has expected-behaviour column | manual | — | No |

### Sampling Rate

- **Per task commit:** `npx vitest run tests/HelpPage.test.tsx`
- **Per wave merge:** `npm test` (full suite, 204+ tests)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `tests/HelpPage.test.tsx` — covers HELP-01, HELP-02 (onBack callback path)
- [ ] `src/components/HelpPage.tsx` — stub for RED state
- [ ] `KlasTabStrip.test.tsx` extension — test that `onHelp` is called when `?` button clicked

---

## Security Domain

`security_enforcement` is not explicitly set to `false` in `.planning/config.json` — treated as enabled.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | no | HelpPage is read-only static content; no user input |
| V6 Cryptography | no | — |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| CI secrets exposure | Information Disclosure | `GITHUB_TOKEN` auto-provided; no extra secrets needed; `APPLE_SIGNING_IDENTITY: '-'` is public (ad-hoc only) |
| XSS via help content | Tampering | Help content is hard-coded JSX — no `dangerouslySetInnerHTML`, no user-controlled data |

Phase 30 introduces no new attack surface: HelpPage is static JSX, CI workflow runs on
GitHub-hosted runners with no external network calls beyond npm ci and Tauri build.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tag-triggered release.yml CI | Push-to-main ci.yml CI | Phase 30 | Every push validates the build, not just releases |
| No in-app help | HelpPage view route | Phase 30 | Testers are self-sufficient |

**Deprecated/outdated:**
- None introduced by this phase.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `macos-latest` on GitHub Actions resolves to Apple Silicon (aarch64) runners | CI Workflow | If Intel, the aarch64-apple-darwin build would fail — use explicit `runs-on: macos-latest` as release.yml does; GitHub has been routing `macos-latest` to M1 runners since late 2024 [ASSUMED] |
| A2 | Developer email in INSTRUCTIES.md should be `ralvarezstam@cioszuidwest.nl` (matches utils/feedback.ts) | Documentation Content | If wrong email, tester bug reports go to wrong address |
| A3 | `tauri-apps/tauri-action@v0` without release keys runs a plain build and exits cleanly | CI Workflow | If the action requires release keys to function, ci.yml would need a different approach (plain `npm run build` step) — release.yml precedent supports this assumption [ASSUMED from release.yml structure] |

---

## Open Questions (RESOLVED)

1. **macOS runner architecture**
   - What we know: `release.yml` already uses `macos-latest` with `--target aarch64-apple-darwin`
     and this works for the release workflow.
   - RESOLVED: Use `macos-latest` as-is (mirrors release.yml). GitHub has routed `macos-latest`
     to M1 runners since late 2024. If CI fails in future, switch to `macos-14` explicitly.

2. **HelpPage CSS: new classes or reuse `.settings-page`?**
   - What we know: `.detail-section`, `.detail-section-title`, `.detail-header` are all
     available in `index.css`.
   - RESOLVED: Reuse `.settings-page` CSS class for the outer wrapper — confirmed in Plan 02
     which targets `className="settings-page"`. No new CSS class needed.

3. **KlasTabStrip test file name**
   - RESOLVED: `tests/KlasTabStrip.test.tsx` already exists (created in Phase 28 for the
     feedback button). Plan 01 targets this file for extension with the `?` button test — it
     does NOT create a new file.

---

## Sources

### Primary (HIGH confidence)

- `D:\Downloads\get-shit-done-main\dashboard-2\.github\workflows\release.yml` — exact CI matrix, action versions, APPLE_SIGNING_IDENTITY pattern
- `D:\Downloads\get-shit-done-main\dashboard-2\src\App.tsx` — view state union, prevView pattern, handleOpenSettings pattern
- `D:\Downloads\get-shit-done-main\dashboard-2\src\components\KlasTabStrip.tsx` — nav button pattern, prop interface
- `D:\Downloads\get-shit-done-main\dashboard-2\.planning\STATE.md` — Phase 30 CI design note ("windows-latest and macos-latest (Apple Silicon). Mirror Phase 15 CI pattern")
- `D:\Downloads\get-shit-done-main\dashboard-2\.planning\phases\28-bug-feedback-rapportage\28-01-PLAN.md` — DEVELOPER_EMAIL = 'ralvarezstam@cioszuidwest.nl', FEED pattern
- `D:\Downloads\get-shit-done-main\dashboard-2\package.json` — installed packages, versions

### Secondary (MEDIUM confidence)

- `tauri-apps/tauri-action@v0` release key omission behaviour — inferred from action parameter documentation pattern and release.yml structure

### Tertiary (LOW confidence)

- GitHub `macos-latest` routing to Apple Silicon — widely documented community knowledge but subject to GitHub's runner fleet decisions [ASSUMED]

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — CI pattern directly cloned from verified release.yml; React patterns from verified App.tsx
- Architecture: HIGH — all patterns are verbatim adaptations of existing verified code
- Pitfalls: HIGH — all pitfalls derived from actual codebase constraints and STATE.md decisions
- Documentation content: MEDIUM — content outline based on app features; actual prose is authoring work

**Research date:** 2026-05-28
**Valid until:** 2026-06-28 (stable stack; GitHub Actions major version upgrades unlikely within 30 days)

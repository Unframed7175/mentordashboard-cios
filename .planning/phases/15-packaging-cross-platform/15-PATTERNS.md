# Phase 15: Packaging & Cross-platform - Pattern Map

**Mapped:** 2026-05-15
**Files analyzed:** 4 (2 new, 2 modified)
**Analogs found:** 2 / 4 (the 2 modified files serve as their own reference; the 2 new files have no codebase analog)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `.github/workflows/release.yml` | config (CI workflow) | event-driven (tag push) | none in codebase | no analog — use RESEARCH.md Pattern 1 |
| `src-tauri/entitlements.plist` | config (macOS entitlements) | N/A | none in codebase | no analog — use RESEARCH.md Pattern 3 |
| `src-tauri/tauri.conf.json` | config (Tauri bundle) | N/A | itself (current file) | self-reference (modify) |
| `src-tauri/Cargo.toml` | config (Rust manifest) | N/A | itself (current file) | self-reference (modify) |

---

## Pattern Assignments

### `.github/workflows/release.yml` (CI config, event-driven)

**Analog:** None exists in the codebase. The `.github/` directory does not yet exist.
**Pattern source:** RESEARCH.md "Pattern 1" and "Complete release.yml (recommended)" (lines 163–221 and 398–456).

**Full file to create:**

```yaml
# Source: v2.tauri.app/distribute/pipelines/github/ (adapted — no Linux runner)
name: Release

on:
  push:
    tags:
      - 'v*'

permissions:
  contents: write   # REQUIRED — creates GitHub Release and uploads assets

jobs:
  release:
    strategy:
      fail-fast: false
      matrix:
        include:
          - platform: macos-latest
            args: '--target aarch64-apple-darwin'
            rust-targets: 'aarch64-apple-darwin'
          - platform: macos-latest
            args: '--target x86_64-apple-darwin'
            rust-targets: 'x86_64-apple-darwin'
          - platform: windows-latest
            args: ''
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
        run: npm install

      - name: Build and release
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          APPLE_SIGNING_IDENTITY: '-'
        with:
          tagName: ${{ github.ref_name }}
          releaseName: 'Mentordashboard CIOS ${{ github.ref_name }}'
          releaseBody: 'Zie de changelog voor details.'
          releaseDraft: false
          prerelease: false
          args: ${{ matrix.args }}
```

**Key constraints to copy exactly:**
- `permissions: contents: write` at workflow level (not job level) — required or release creation returns HTTP 403.
- `APPLE_SIGNING_IDENTITY: '-'` as env var on the tauri-action step — triggers ad-hoc signing on macOS runner; without this, Apple Silicon Macs show "app is damaged" and refuse to launch.
- `fail-fast: false` in strategy — one platform failure should not cancel the other platform builds.
- Matrix has exactly 3 entries: aarch64-apple-darwin, x86_64-apple-darwin, windows-latest. No ubuntu entry — no Linux binary is required (D-02, RESEARCH.md Q1).
- `dtolnay/rust-toolchain@stable` with `targets: ${{ matrix.rust-targets }}` — the Windows entry has an empty string for rust-targets, which is correct (MSVC default target).
- `tauri-apps/tauri-action@v0` (not a pinned SHA or v1) — v0 is the current stable channel for this action.
- Do NOT add `TAURI_SIGNING_PRIVATE_KEY` — this project has no updater plugin; adding that env var enables unnecessary signature generation (RESEARCH.md Q4).

---

### `src-tauri/entitlements.plist` (macOS entitlements config)

**Analog:** None exists in the codebase. No `.plist` files exist anywhere under `src-tauri/`.
**Pattern source:** RESEARCH.md "Pattern 3" and "Code Examples: src-tauri/entitlements.plist" (lines 254–269 and 487–500).

**Full file to create:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- Required for Tauri WebKit JIT compilation -->
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <!-- keychain-access-groups intentionally omitted:
         With ad-hoc signing ("-"), $(AppIdentifierPrefix) does not expand.
         Adding keychain-access-groups without a provisioning profile causes
         errSecMissingEntitlement (-34018). Users will see a one-time system
         keychain access dialog on first launch instead. -->
</dict>
</plist>
```

**Key constraints:**
- Include only the two JIT entitlements — they are required for Tauri's WebKit rendering engine.
- Do NOT add `keychain-access-groups` — with ad-hoc signing, the `$(AppIdentifierPrefix)` variable does not expand and causes hard keychain failures (RESEARCH.md Q2, Pitfall 4, Anti-Patterns).
- This file must be referenced in `tauri.conf.json` at `bundle.macOS.entitlements` using the path `"./entitlements.plist"` (relative to the `src-tauri/` directory).

---

### `src-tauri/tauri.conf.json` (Tauri bundle config — MODIFY)

**Analog:** The current file itself — read as reference, 3 targeted edits required.

**Current file state** (`src-tauri/tauri.conf.json`, lines 1–38):

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "Mentordashboard CIOS",
  "version": "2.0.0",
  "identifier": "nl.cios.mentordashboard",
  "build": {
    "beforeDevCommand": "npm run vite-dev",
    "devUrl": "http://localhost:1420",
    "beforeBuildCommand": "vite build",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "Mentordashboard CIOS",
        "width": 1200,
        "height": 800,
        "resizable": true,
        "fullscreen": false,
        "useHttpsScheme": true
      }
    ],
    "security": {
      "csp": "default-src 'self' tauri: asset:; script-src 'self'; style-src 'self' 'unsafe-inline'"
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

**Required edits — three changes inside `bundle`:**

Edit 1 — Change `targets` (line 29): `"targets": "all"` → `"targets": ["nsis"]`

Edit 2 — Add `windows.nsis` block (after `targets`):
```json
"windows": {
  "nsis": {
    "installMode": "currentUser"
  }
},
```

Edit 3 — Add `macOS` block (after `windows`, before `icon`):
```json
"macOS": {
  "entitlements": "./entitlements.plist",
  "signingIdentity": "-"
},
```

**Final `bundle` section after all edits:**
```json
"bundle": {
  "active": true,
  "targets": ["nsis"],
  "windows": {
    "nsis": {
      "installMode": "currentUser"
    }
  },
  "macOS": {
    "entitlements": "./entitlements.plist",
    "signingIdentity": "-"
  },
  "icon": [
    "icons/32x32.png",
    "icons/128x128.png",
    "icons/128x128@2x.png",
    "icons/icon.icns",
    "icons/icon.ico"
  ]
}
```

**Do NOT change:**
- `productName`, `identifier`, `version` — already correct (D-10).
- `useHttpsScheme: true` in `app.windows[0]` — required for plugin-store on Windows (Phase 12); harmlessly ignored on macOS (RESEARCH.md Q3).
- `app.security.csp` — current value `"default-src 'self' tauri: asset:; ..."` already covers the `tauri://localhost` scheme on macOS (RESEARCH.md Pitfall 7, Assumption A4).
- `build` section — no changes needed.

**Residual open question (Assumption A3):** Whether `targets: ["nsis"]` causes the macOS CI runner to error (instead of silently producing DMG). If CI macOS job fails with a target error, change `targets` back to `"all"`. The Windows-only `--bundles nsis` flag can be passed via the Windows matrix `args` entry in `release.yml` instead.

---

### `src-tauri/Cargo.toml` (Rust manifest — MODIFY)

**Analog:** The current file itself — 2 field changes in the `[package]` section.

**Current `[package]` section** (`src-tauri/Cargo.toml`, lines 1–6):

```toml
[package]
name = "tauri-app"
version = "0.1.0"
description = "A Tauri App"
authors = ["you"]
edition = "2021"
```

**Required edits:**

Edit 1 — line 4: `description = "A Tauri App"` → `description = "Mentordashboard CIOS — voortgang en verzuim in één oogopslag"`

Edit 2 — line 5: `authors = ["you"]` → `authors = ["CIOS Zuidwest"]`

**Final `[package]` section after edits:**

```toml
[package]
name = "tauri-app"
version = "0.1.0"
description = "Mentordashboard CIOS — voortgang en verzuim in één oogopslag"
authors = ["CIOS Zuidwest"]
edition = "2021"
```

**Do NOT change:**
- `name = "tauri-app"` — internal crate name, not user-visible (D-09 explicitly scoped out).
- `[lib]`, `[build-dependencies]`, `[dependencies]` sections — no changes needed for this phase.

---

## Shared Patterns

### GitHub Actions permissions pattern
**Apply to:** `.github/workflows/release.yml`
**Rule:** Declare `permissions: contents: write` at the workflow level (not inside the job). Without it, `GITHUB_TOKEN` defaults to read-only scope and release creation fails with HTTP 403 "Resource not accessible by integration". This is the single most common cause of tauri-action CI failures on first run.

### Ad-hoc signing pattern (macOS, unsigned distribution)
**Apply to:** `release.yml` (env var) AND `tauri.conf.json` (config key) — both must be set together.

In `release.yml` (env on tauri-action step):
```yaml
env:
  APPLE_SIGNING_IDENTITY: '-'
```

In `tauri.conf.json` (bundle.macOS):
```json
"signingIdentity": "-"
```

**Why both:** The env var tells the CI runner which signing identity to use during the build; the config key bakes that identity into the bundle metadata. They must agree or the produced binary may be inconsistently signed, causing "app is damaged" on Apple Silicon.

### No-secrets pattern (unsigned builds without updater)
**Apply to:** `.github/workflows/release.yml`
**Rule:** The only secrets/env vars needed are:
- `GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}` — auto-provided by GitHub Actions, no setup required.
- `APPLE_SIGNING_IDENTITY: '-'` — literal string, not a secret.

Do NOT add: `TAURI_SIGNING_PRIVATE_KEY`, `TAURI_KEY_PASSWORD`, `APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_TEAM_ID`, `APPLE_ID`, `APPLE_PASSWORD`. These are only needed for the updater plugin or full Apple Developer signing — neither applies to this phase.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `.github/workflows/release.yml` | config (CI) | event-driven | No `.github/` directory exists; no existing workflow files in the project |
| `src-tauri/entitlements.plist` | config (macOS) | N/A | No `.plist` files exist anywhere in `src-tauri/`; macOS-specific config is new to this phase |

For these files, the planner must use the complete file content from the Pattern Assignments sections above (sourced from RESEARCH.md verified patterns).

---

## Metadata

**Analog search scope:** `D:\Downloads\get-shit-done-main\dashboard-2` — searched for `.github/**/*`, `**/*.yml`, `**/*.plist`
**Files scanned:** `src-tauri/tauri.conf.json` (38 lines), `src-tauri/Cargo.toml` (30 lines)
**No existing analogs in:** `.github/`, `src-tauri/*.plist`
**Pattern extraction date:** 2026-05-15

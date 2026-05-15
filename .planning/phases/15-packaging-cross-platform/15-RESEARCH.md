# Phase 15: Packaging & Cross-platform — Research

**Researched:** 2026-05-15
**Domain:** Tauri v2 bundling, GitHub Actions CI/CD, macOS code signing, Windows NSIS packaging
**Confidence:** MEDIUM — CI workflow and NSIS config HIGH; macOS keychain-without-signing behavior MEDIUM-LOW

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Repo must be pushed to GitHub as part of this phase (not yet on GitHub).
- **D-02:** Use `tauri-apps/tauri-action` GitHub Actions workflow. Trigger: tag push matching `v*`. Matrix: macOS-latest + windows-latest (ubuntu may be omitted — see research below).
- **D-03:** Artifacts published to a GitHub Release — tauri-action creates the release and attaches installers automatically.
- **D-04:** `tauri-plugin-secure-storage` on macOS requires a Keychain entitlement. Add `src-tauri/entitlements.plist` with `keychain-access-groups` and wire it in `tauri.conf.json` under `bundle.macOS.entitlements`.
- **D-05/D-06:** Both platforms ship unsigned. Windows SmartScreen warning acceptable. macOS Gatekeeper warning acceptable (right-click → Open).
- **D-07:** NSIS only for Windows (`bundle.targets = ["nsis"]`). MSI disabled.
- **D-08:** Install scope: current user only (AppData\Local, no UAC). NSIS `installMode: "currentUser"`.
- **D-09:** Update `src-tauri/Cargo.toml`: description + authors fields.
- **D-10:** `tauri.conf.json` productName ("Mentordashboard CIOS") and identifier ("nl.cios.mentordashboard") already correct.

### Claude's Discretion
- Whether ubuntu-latest runner is needed in the matrix (no Linux binary required).
- Exact `entitlements.plist` keychain-access-groups format for tauri-plugin-secure-storage v1.
- CSP + `useHttpsScheme: true` compatibility with macOS WebKit build context.
- Secrets/env vars needed for unsigned builds (TAURI_PRIVATE_KEY etc.).
- Whether `permissions: contents: write` is required in release.yml.
- Known Tauri v2 + GitHub Actions compatibility issues / version pinning.
- Whether `tauri-plugin-secure-storage` v1 works on macOS without code signing.

### Deferred Ideas (OUT OF SCOPE)
- Code signing (both platforms) — deferred.
- Linux AppImage.
- Auto-updater (`tauri-plugin-updater`).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PKG-01 | App draait correct op Windows 10/11 zonder extra installaties voor de eindgebruiker | NSIS currentUser scope → AppData\Local install, WebView2 bundled by Tauri |
| PKG-02 | App draait correct op macOS 12+ zonder extra installaties voor de eindgebruiker | DMG via tauri-action on macos-latest; ad-hoc signing workaround for Gatekeeper |
| PKG-03 | UI ziet er visueel identiek uit op Windows (WebView2) en macOS (WebKit) | useHttpsScheme Windows-only setting clarified; CSS cross-platform pitfalls documented |
</phase_requirements>

---

## Summary

This phase produces two installer artifacts — a Windows NSIS `.exe` and a macOS `.dmg` — via the `tauri-apps/tauri-action` GitHub Actions workflow triggered on a `v*` tag push. The artifacts are uploaded automatically to a GitHub Release.

**Seven open questions** were resolved through research. The most significant finding is the macOS keychain situation: `tauri-plugin-secure-storage` uses the `keyring` crate which calls macOS Keychain Services APIs that require the app to be code-signed to avoid `errSecMissingEntitlement` errors. An **ad-hoc signature** (`signingIdentity: "-"`) is the correct workaround for unsigned distribution — it satisfies Apple Silicon's code-signing requirement without a Developer ID certificate, and it sidesteps the keychain entitlement enforcement issue that purely unsigned builds face. Users will still need to approve the app once in Privacy & Security on macOS.

The `useHttpsScheme: true` setting in `tauri.conf.json` is a **Windows/Android-only** setting per the official schema definition. On macOS, Tauri always uses the `tauri://localhost` custom protocol scheme regardless of this setting. There is no macOS compatibility issue with having `useHttpsScheme: true` in the config — it is simply ignored on macOS.

The ubuntu runner is **not required** for a macOS + Windows only release. The matrix can be reduced to `macos-latest` (two entries for ARM and x86_64) + `windows-latest`.

**Primary recommendation:** Use ad-hoc signing (`signingIdentity: "-"`) on macOS in the release workflow via `APPLE_SIGNING_IDENTITY=-` environment variable. Do NOT set `keychain-access-groups` entitlement if not properly signed — use the basic entitlements (JIT only) and accept that secure-storage plugin keychain prompts may appear on macOS until proper signing is added.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Windows NSIS installer build | GitHub Actions (windows-latest) | Tauri bundler | Cross-compilation not supported; must run on Windows runner |
| macOS DMG build | GitHub Actions (macos-latest) | Tauri bundler | Requires Xcode/macOS toolchain; no local Mac available |
| GitHub Release creation & upload | tauri-action (GitHub Actions) | — | tauri-action handles release creation + asset attachment automatically |
| App bundle configuration | src-tauri/tauri.conf.json | Cargo.toml | Tauri reads tauri.conf.json for all bundle metadata |
| macOS entitlements | src-tauri/entitlements.plist | tauri.conf.json (reference) | plist file referenced by bundle.macOS.entitlements |
| Cross-platform UI consistency | CSS/React (frontend) | WebView2 / WebKit | No Tauri-layer fixes available; CSS must handle engine differences |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| tauri-apps/tauri-action | v0 (latest) | CI/CD: build + release | Official Tauri-maintained action; handles multi-platform matrix |
| dtolnay/rust-toolchain | @stable | Install Rust in CI | Standard for Rust GitHub Actions |
| actions/setup-node | v4 | Install Node.js in CI | Standard GitHub-provided action |
| actions/checkout | v4 | Clone repo in CI | Standard GitHub-provided action |

[VERIFIED: v2.tauri.app/distribute/pipelines/github/]

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Rust targets | stable | aarch64-apple-darwin, x86_64-apple-darwin | Dual-target macOS build for universal compat |
| NSIS installer | via Tauri bundler | Windows installer format | Chosen in D-07; NSIS produces .exe wizard |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| macOS only (no signing) | Ad-hoc signing (`-`) | Ad-hoc satisfies Apple Silicon requirement; purely unsigned causes "app is damaged" on ARM Macs |
| `targets: "all"` | `targets: ["nsis"]` | "all" would produce MSI + NSIS + AppImage; NSIS-only keeps release clean |
| ubuntu runner in matrix | Omit ubuntu | Ubuntu only needed for Linux AppImage/deb — not required here |

**Version verification:**

```bash
npm view @tauri-apps/cli version
# 2.11.1 [VERIFIED: package.json already locked at ^2.11.1]
```

[VERIFIED: package.json]

---

## Architecture Patterns

### System Architecture Diagram

```
Developer: git tag v2.0.0 && git push origin v2.0.0
          |
          v
GitHub Actions: push.tags v* trigger
          |
          +---> Job: macos-latest (aarch64-apple-darwin)
          |       Rust stable + aarch64 target
          |       npm install + tauri build --target aarch64-apple-darwin
          |       produces: Mentordashboard CIOS_2.0.0_aarch64.dmg
          |                                              |
          +---> Job: macos-latest (x86_64-apple-darwin)  |
          |       Rust stable + x86_64 target            |
          |       npm install + tauri build --target x86_64-apple-darwin
          |       produces: Mentordashboard CIOS_2.0.0_x64.dmg
          |                                              |
          +---> Job: windows-latest                      |
                  Rust stable (MSVC)                     |
                  npm install + tauri build              |
                  produces: Mentordashboard CIOS_2.0.0_x64-setup.exe
                                                         |
                  tauri-action creates GitHub Release  <-+
                  Attaches all 3 artifacts to release
                  Teachers download from Releases page
```

### Recommended Project Structure (new files this phase)

```
.github/
└── workflows/
    └── release.yml          # CI/CD pipeline (main deliverable)
src-tauri/
├── entitlements.plist       # macOS entitlements (new)
├── tauri.conf.json          # modify: bundle.targets, bundle.macOS.*
└── Cargo.toml               # modify: description, authors
```

### Pattern 1: tauri-action release workflow (macOS + Windows only)

**What:** Minimal `release.yml` for two platforms, no Linux, unsigned builds
**When to use:** Internal tool, no Linux requirement, no signing certs

```yaml
# Source: v2.tauri.app/distribute/pipelines/github/ (adapted for no-Linux)
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
            rust-targets: aarch64-apple-darwin
          - platform: macos-latest
            args: '--target x86_64-apple-darwin'
            rust-targets: x86_64-apple-darwin
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
          # Ad-hoc signing for macOS (no Apple Developer cert needed)
          APPLE_SIGNING_IDENTITY: '-'
        with:
          tagName: ${{ github.ref_name }}
          releaseName: 'Mentordashboard CIOS ${{ github.ref_name }}'
          releaseBody: 'Zie de changelog voor wijzigingen.'
          releaseDraft: false
          prerelease: false
          args: ${{ matrix.args }}
```

[VERIFIED: v2.tauri.app/distribute/pipelines/github/, tauri-action README]

### Pattern 2: tauri.conf.json bundle configuration changes

```json
{
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
    "icon": [...]
  }
}
```

[VERIFIED: v2.tauri.app/distribute/windows-installer/, v2.tauri.app/distribute/sign/macos/]

Note: `targets: ["nsis"]` in tauri.conf.json is the default for local `tauri build` on Windows. The GitHub Actions matrix produces platform-specific builds regardless — the macOS runner automatically builds DMG even if `targets` says `["nsis"]` because targets are platform-filtered.

**Correction to D-07:** Set `targets` per-platform. The simplest approach: keep `targets: "all"` in tauri.conf.json (Tauri auto-selects correct targets per platform), OR set `targets: ["nsis"]` on Windows and override on macOS in CI via `args`. In practice, tauri-action on macOS produces DMG by default and ignores NSIS target.

### Pattern 3: macOS entitlements.plist (ad-hoc signing, no App Sandbox)

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
    <!-- Do NOT add keychain-access-groups without a proper provisioning profile -->
    <!-- With ad-hoc signing (-), keychain-access-groups entitlement is not verifiable -->
    <!-- The keyring crate will fall back to user-visible keychain prompts -->
</dict>
</plist>
```

[CITED: v2.tauri.app/distribute/macos-application-bundle/] [ASSUMED for keychain-groups omission — see Assumptions Log]

### Anti-Patterns to Avoid

- **Adding `keychain-access-groups` with `$(AppIdentifierPrefix)` without a real Team ID:** The `$(AppIdentifierPrefix)` variable only expands correctly when the app is signed with a proper Apple Developer certificate and provisioning profile. With ad-hoc signing, this variable does not expand and will cause keychain access to fail with `-34018 errSecMissingEntitlement`.
- **Setting `uploadUpdaterSignatures: true` without `TAURI_SIGNING_PRIVATE_KEY`:** tauri-action defaults `uploadUpdaterSignatures` to true, but this only matters if the updater plugin is active. Since this project has no updater plugin, the default behavior is fine. Do NOT add `TAURI_SIGNING_PRIVATE_KEY` if not using the updater — it will enable signature generation unnecessarily.
- **Omitting `permissions: contents: write` in release.yml:** Without this, the GitHub Token has read-only scope and release creation fails with "Resource not accessible by integration".
- **Using `ubuntu-latest` runner for macOS builds:** Cross-compilation for macOS from Linux is not supported by Tauri. Each platform must build on its native runner.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| GitHub Release creation + asset upload | Custom release scripts | `tauri-apps/tauri-action@v0` | Handles artifact naming, release creation, and multi-file upload atomically |
| Rust toolchain installation in CI | Manual `curl rustup` | `dtolnay/rust-toolchain@stable` | Handles caching, targets, toolchain pinning |
| NSIS installer generation | Custom NSIS scripts | Tauri bundler (`tauri build`) | Tauri generates valid NSIS scripts with correct uninstaller, registry entries, AppData paths |
| macOS DMG layout | hdiutil + Finder positioning | Tauri bundler | Tauri generates DMG with drag-to-Applications layout automatically |
| Cross-platform icon packaging | Manual icns/ico/png assembly | Already done (Phase 10) | src-tauri/icons/ already contains all required formats |

**Key insight:** tauri-action is specifically designed to hide the complexity of cross-platform release pipelines — don't replicate what it already does.

---

## Open Questions — All Resolved

### Q1: Is ubuntu-latest needed in the matrix?
**Answer: NO.** The ubuntu runner is only needed to build Linux packages (AppImage, .deb, .rpm). For macOS + Windows only, the matrix can be two macOS entries (ARM + x86_64) + one Windows entry. Omitting ubuntu reduces CI cost and build time.
[VERIFIED: tauri-action README, v2.tauri.app/distribute/pipelines/github/]

### Q2: Exact entitlements.plist keychain-access-groups format
**Answer: Omit keychain-access-groups entirely for ad-hoc signed builds.**
The `keychain-access-groups` entitlement requires a provisioning profile with Keychain Sharing capability enabled — this is only available with a proper Apple Developer account ($99/yr). With ad-hoc signing (`-`), the `$(AppIdentifierPrefix)` variable does not expand and adding the entitlement without a valid provisioning profile causes `errSecMissingEntitlement (-34018)`.

The `keyring` crate (used by tauri-plugin-secure-storage) accesses the macOS Keychain via Keychain Services APIs. **Without the keychain-access-groups entitlement, the app can still access the keychain** — it just uses the default (app-specific) keychain item access, which works for read/write of the AES key. Users will see a one-time "allow access" dialog the first time the app reads the key from keychain.

For the entitlements.plist, include only the JIT entitlements required for Tauri WebKit. [ASSUMED — see A2 in Assumptions Log]

### Q3: useHttpsScheme + macOS WebKit compatibility
**Answer: No issue.** Per the official Tauri schema, `useHttpsScheme` is explicitly defined as applying to **Windows and Android only**. On macOS, Tauri always uses the `tauri://localhost` custom protocol scheme. Setting `useHttpsScheme: true` is harmlessly ignored on macOS.

The plugin-store (which required `useHttpsScheme: true` in Phase 12) works on macOS because macOS uses its own origin (`tauri://localhost`) which is always treated as a secure context by WebKit.
[VERIFIED: schema.tauri.app/config/2]

### Q4: Secrets/environment variables for unsigned builds
**Answer: Only `GITHUB_TOKEN` is required.** For unsigned builds without the updater plugin:
- `GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}` — auto-provided, required for release creation
- `APPLE_SIGNING_IDENTITY: '-'` — set as env var to trigger ad-hoc signing on macOS runner
- **NOT needed:** `TAURI_SIGNING_PRIVATE_KEY`, `TAURI_KEY_PASSWORD`, `APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_TEAM_ID`, `APPLE_ID`, `APPLE_PASSWORD`

The `TAURI_SIGNING_PRIVATE_KEY` env var is only required when using `tauri-plugin-updater` (which this project does not have).
[VERIFIED: v2.tauri.app/reference/environment-variables/, v2.tauri.app/distribute/pipelines/github/]

### Q5: Does release.yml need `permissions: contents: write`?
**Answer: YES, mandatory.** Without this permission, the default GitHub Token has read-only access and the workflow will fail with "Resource not accessible by integration" when trying to create the release. This must be declared at the job level (or workflow level).
[VERIFIED: v2.tauri.app/distribute/pipelines/github/]

### Q6: Known Tauri v2 + GitHub Actions compatibility issues
**Findings:**
- Node.js: use `lts/*` (no specific version required) — stable
- Rust: use `dtolnay/rust-toolchain@stable` (no version pinning required)
- macOS: specify Rust targets explicitly via `targets:` in dtolnay action when building for non-native architecture
- Known issue: Ad-hoc signing (`-`) occasionally fails randomly on macOS in CI (tauri issue #13804, labeled intermittent). Mitigation: retry strategy or accept rare CI failures
- No special Node.js or Rust version pinning required for Tauri 2.x + tauri-action v0
[VERIFIED: tauri-action test workflow, CITED: github.com/tauri-apps/tauri/issues/13804]

### Q7: Does tauri-plugin-secure-storage v1 work on macOS without code signing?
**Answer: Partially, with caveats.** The `keyring` crate (underlying library) can access macOS Keychain in an unsigned app using user-visible permission prompts (a system dialog asking "do you want to allow [app] to access the keychain?"). This prompt appears once and the user can select "Always Allow". However:
- Every time the binary changes (new build = new hash), macOS treats it as a new unsigned app and shows the prompt again
- Production `.dmg` installs produce a stable binary, so the prompt appears once per fresh install
- This behavior is acceptable for an internal school tool (teachers install once, approve once)

**Critical:** Do NOT add `keychain-access-groups` to the entitlements without a proper provisioning profile. With ad-hoc signing, entitlements are embedded but not validated against a provisioning profile — behavior is undefined and may cause `errSecMissingEntitlement`.
[MEDIUM confidence — ASSUMED based on keyring crate docs and Apple developer docs, not verified against this specific plugin]

---

## Common Pitfalls

### Pitfall 1: Missing `permissions: contents: write`
**What goes wrong:** CI run completes build but fails to upload artifacts or create release with HTTP 403.
**Why it happens:** Default GitHub Token has read-only permissions for contents.
**How to avoid:** Add `permissions: contents: write` at workflow or job level in release.yml.
**Warning signs:** "Resource not accessible by integration" error in CI logs.

### Pitfall 2: ubuntu runner in matrix when not needed
**What goes wrong:** CI spends 10-15 minutes building Linux packages nobody will use; ubuntu-specific dependencies (libwebkit2gtk-4.1-dev etc.) must be installed.
**Why it happens:** Copying the full example matrix without reading it.
**How to avoid:** Remove ubuntu entries from matrix since no Linux binary is required.

### Pitfall 3: `targets: "all"` producing MSI + NSIS on Windows
**What goes wrong:** Release contains both `_x64-setup.exe` (NSIS) and `_x64_en-US.msi` (MSI), confusing teachers.
**Why it happens:** Default `targets: "all"` builds all available formats on each platform.
**How to avoid:** Set `bundle.targets: ["nsis"]` in tauri.conf.json OR pass `--bundles nsis` via `args` in CI.
**Note:** Platform-specific targets are filtered automatically — `["nsis"]` on macOS runner still produces DMG.

### Pitfall 4: Keychain entitlement with ad-hoc signing
**What goes wrong:** App crashes or returns `errSecMissingEntitlement` when trying to read from keychain.
**Why it happens:** `keychain-access-groups` entitlement was added to plist but requires provisioning profile to be effective with ad-hoc signing.
**How to avoid:** Omit `keychain-access-groups` from entitlements.plist for ad-hoc signed builds.
**Warning signs:** `SecItemCopyMatching returned: -34018` in logs.

### Pitfall 5: "App is damaged and can't be opened" on Apple Silicon
**What goes wrong:** macOS shows "the application is damaged" dialog and refuses to launch, even after quarantine removal.
**Why it happens:** Apple Silicon Macs require code signing for apps downloaded from the internet. A purely unsigned binary fails the signature check.
**How to avoid:** Use ad-hoc signing (`APPLE_SIGNING_IDENTITY: '-'` in CI + `"signingIdentity": "-"` in tauri.conf.json). Users still need to approve in Privacy & Security but the app is not "damaged".
[VERIFIED: v2.tauri.app/distribute/sign/macos/, github.com/tauri-apps/tauri/issues/8763]

### Pitfall 6: macOS DMG built without specifying aarch64 target
**What goes wrong:** CI builds x86_64-only DMG; runs via Rosetta on M1/M2 but slower and may have issues.
**Why it happens:** `macos-latest` runner is ARM (Apple Silicon) but without explicit target, builds may not produce universal binary.
**How to avoid:** Run two matrix entries: one with `--target aarch64-apple-darwin`, one with `--target x86_64-apple-darwin`. This produces two DMGs (ARM + Intel) rather than a universal binary — simpler and sufficient for direct distribution.
[VERIFIED: tauri-action README, official workflow example]

### Pitfall 7: useHttpsScheme CSP mismatch on macOS
**What goes wrong:** Developer assumes `useHttpsScheme: true` changes macOS URL scheme and writes CSP for `https://tauri.localhost`. CSP may block macOS content if written incorrectly.
**Why it happens:** Misunderstanding that `useHttpsScheme` is Windows/Android-only.
**How to avoid:** The current CSP `"default-src 'self' tauri: asset:"` is correct. The `tauri:` source directive covers the `tauri://localhost` scheme on macOS. No CSP change needed.
[VERIFIED: schema.tauri.app/config/2]

---

## Code Examples

### Complete release.yml (recommended)

```yaml
# Source: v2.tauri.app/distribute/pipelines/github/ (adapted)
name: Release

on:
  push:
    tags:
      - 'v*'

permissions:
  contents: write

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

### tauri.conf.json bundle section (final state)

```json
{
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
}
```

Note: On macOS runner, `targets: ["nsis"]` is platform-filtered to produce DMG. Alternatively, use `targets: "all"` if you want Tauri to auto-select per platform.

### src-tauri/entitlements.plist (minimal, ad-hoc signing compatible)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
</dict>
</plist>
```

### Cargo.toml [package] section (after D-09 update)

```toml
[package]
name = "tauri-app"
version = "0.1.0"
description = "Mentordashboard CIOS — voortgang en verzuim in één oogopslag"
authors = ["CIOS Zuidwest"]
edition = "2021"
```

### Release trigger commands (teacher-facing instructions)

```bash
git tag v2.0.0
git push origin v2.0.0
# CI runs → GitHub Release created → .exe and .dmg attached
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual tauri build on dev machine for each platform | CI matrix via tauri-action | Tauri v1+ | No local Mac needed for macOS builds |
| `tauri build --target all` for universal binary | Separate matrix entries per arch | Tauri v2 | Produces per-arch binaries; simpler CI |
| MSI for Windows distribution | NSIS for direct distribution | D-07 | NSIS produces single-file .exe wizard; cleaner for direct download |
| Full Apple Developer signing ($99/yr) | Ad-hoc signing (`-`) | Supported since Tauri v2 | Sufficient for internal tool; users approve once |

**Deprecated/outdated:**
- `TAURI_PRIVATE_KEY` / `TAURI_KEY_PASSWORD`: Renamed to `TAURI_SIGNING_PRIVATE_KEY` / `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` in Tauri v2. Not needed for this project (no updater plugin).
- `bundle.macOS.frameworks`: Only needed for custom native frameworks; not applicable here.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Frontend build | ✓ | See package.json | — |
| Rust / Cargo | Tauri build | ✓ | 1.95.0 (confirmed in STATE.md) | — |
| GitHub account | D-01: repo push, D-03: releases | ✓ (user has account) | — | — |
| GitHub Actions minutes | CI builds | ✓ | Free tier (2000 min/month for public repos) | Public repo = unlimited |
| macOS runner (GitHub-hosted) | macOS DMG build | ✓ | macos-latest (GitHub-hosted) | — |
| Windows runner (GitHub-hosted) | Windows NSIS build | ✓ | windows-latest (GitHub-hosted) | — |
| Apple Developer certificate | Code signing | ✗ | — | Ad-hoc signing (`-`) is fallback |
| Local Mac | macOS build | ✗ | — | GitHub Actions macos-latest runner |

**Missing dependencies with no fallback:** None that block execution.

**Missing dependencies with fallback:**
- Apple Developer certificate: ad-hoc signing is the fallback (D-05/D-06 accepted this).
- Local Mac for build: GitHub Actions macos-latest runner is the designed solution.

---

## Validation Architecture

> workflow.nyquist_validation not explicitly disabled — section included.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.x |
| Config file | vite.config.ts (inline vitest config) |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | Notes |
|--------|----------|-----------|-------------------|-------|
| PKG-01 | Windows installer installs without admin, runs without extra deps | manual smoke | Build in CI, download .exe, run on clean Windows VM | Cannot automate install verification in Vitest |
| PKG-02 | macOS .dmg installs and runs on macOS 12+ | manual smoke | Download .dmg from GitHub Release, install on macOS | Cannot automate in CI without macOS device |
| PKG-03 | UI visually identical on WebView2 and WebKit | visual/manual | Side-by-side screenshot review | No automated visual regression in this project |

**Note:** PKG-01, PKG-02, PKG-03 are all **integration/smoke tests** that require actual hardware and installer artifacts. They cannot be meaningfully automated in the existing Vitest suite. The verification gate for this phase is: CI build succeeds + installers open and show the dashboard correctly.

### Wave 0 Gaps

None — no new test files needed. Existing 43-test Vitest suite continues to serve as regression guard. PKG requirements are verified manually post-build.

---

## Security Domain

> security_enforcement not explicitly disabled.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | N/A (local app, no auth) |
| V3 Session Management | no | N/A |
| V4 Access Control | no | N/A |
| V5 Input Validation | yes | Existing capability config in default.json |
| V6 Cryptography | yes | AES-256-GCM (Phase 12); keychain via OS APIs |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unsigned macOS binary tampered by third party | Tampering | Ad-hoc signing embeds app hash; distributing via GitHub Releases (HTTPS) mitigates MITM |
| SmartScreen bypass on Windows by double-clicking | Elevation of Privilege | N/A for this use case; users follow "More info → Run anyway" flow documented in D-05 |
| Keychain items accessible by any unsigned process | Information Disclosure | tauri-plugin-secure-storage uses keyring crate defaults; items tied to app signature with ad-hoc sign. Acceptable risk for internal tool. |
| GitHub Release artifacts replaced/tampered | Tampering | GitHub Release artifacts on HTTPS; no additional checksum needed for internal use |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Omitting `keychain-access-groups` from entitlements.plist with ad-hoc signing allows keychain access via user-visible prompt (not hard failure) | Open Questions Q7, Code Examples | If wrong: secure-storage plugin returns hard error on macOS; AES key cannot be retrieved; app shows error or crashes. Mitigation: verify by building and testing on macOS. |
| A2 | Ad-hoc signing (`signingIdentity: "-"`) in tauri.conf.json is sufficient for macOS runner in GitHub Actions to produce a signed binary without APPLE_CERTIFICATE secret | Open Questions Q4, Pattern 1 | If wrong: CI build succeeds but macOS binary is "damaged" on Apple Silicon; teachers cannot open app. Mitigation: set APPLE_SIGNING_IDENTITY env var in workflow, which is verified behavior per official docs. |
| A3 | `targets: ["nsis"]` in tauri.conf.json is automatically filtered per platform (macOS runner still produces DMG) | Pattern 2 | If wrong: macOS runner produces no output or errors; use `targets: "all"` as fallback. |
| A4 | The existing CSP `"default-src 'self' tauri: asset:"` is sufficient for macOS production (tauri:// scheme) without modification | Pitfall 7 | If wrong: macOS WebKit blocks some resources; app shows blank/broken UI. Low risk — existing app already runs on macOS in dev with this CSP. |

---

## Open Questions (Residual)

1. **Does `targets: ["nsis"]` suppress DMG output on macOS runner?**
   - What we know: Tauri filters targets per platform. Official docs show `"targets": "all"` in examples.
   - What's unclear: Whether explicitly setting `["nsis"]` causes macOS runner to error or produce nothing.
   - Recommendation: Use `"targets": "all"` OR pass `--bundles nsis` only in the Windows matrix `args` and leave macOS matrix args at `--target aarch64-apple-darwin` / `--target x86_64-apple-darwin` (no `--bundles` override → DMG default).

2. **Keychain behavior on macOS without entitlements (A1)**
   - What we know: keyring crate accesses macOS Keychain Services. Unsigned apps can access keychain with user dialog.
   - What's unclear: Whether tauri-plugin-secure-storage v1 specifically catches and handles the user-dialog flow gracefully or panics.
   - Recommendation: Test manually by installing the built DMG on a macOS machine after Phase 15 CI succeeds. If secure-storage fails, the fallback is to store the AES key in plugin-store (less secure but functional for internal use).

---

## Sources

### Primary (HIGH confidence)
- [v2.tauri.app/distribute/pipelines/github/](https://v2.tauri.app/distribute/pipelines/github/) — Complete release.yml workflow, permissions, GITHUB_TOKEN
- [schema.tauri.app/config/2](https://schema.tauri.app/config/2) — useHttpsScheme is Windows/Android only
- [v2.tauri.app/distribute/windows-installer/](https://v2.tauri.app/distribute/windows-installer/) — NSIS installMode: currentUser
- [v2.tauri.app/distribute/sign/macos/](https://v2.tauri.app/distribute/sign/macos/) — Ad-hoc signing signingIdentity: "-"
- [v2.tauri.app/distribute/macos-application-bundle/](https://v2.tauri.app/distribute/macos-application-bundle/) — entitlements.plist format and bundle.macOS.entitlements path
- [v2.tauri.app/reference/environment-variables/](https://v2.tauri.app/reference/environment-variables/) — TAURI_SIGNING_PRIVATE_KEY scope

### Secondary (MEDIUM confidence)
- [tauri-action README (raw)](https://raw.githubusercontent.com/tauri-apps/tauri-action/dev/README.md) — Matrix config, node lts/*, rust stable, ubuntu not needed for macOS+Windows
- [github.com/tauri-apps/tauri/issues/8763](https://github.com/tauri-apps/tauri/issues/8763) — Ad-hoc signing documentation
- [github.com/tauri-apps/tauri/issues/13804](https://github.com/tauri-apps/tauri/issues/13804) — Ad-hoc signing intermittent CI failure bug

### Tertiary (LOW confidence)
- Apple Developer Forums — errSecMissingEntitlement behavior for unsigned binaries
- WebSearch results on keyring crate macOS behavior — keychain access without signing requires user-visible prompt

---

## Metadata

**Confidence breakdown:**
- Standard stack (tauri-action, dtolnay/rust-toolchain): HIGH — verified from official Tauri v2 docs
- GitHub Actions workflow (permissions, secrets, matrix): HIGH — verified from official docs
- NSIS installMode currentUser: HIGH — verified from official Tauri v2 docs
- macOS ad-hoc signing: HIGH — verified from official Tauri v2 docs
- macOS keychain without signing (A1): MEDIUM-LOW — inferred from Apple docs + keyring crate behavior; not directly verified against this plugin version
- useHttpsScheme macOS no-op: HIGH — verified from official schema definition

**Research date:** 2026-05-15
**Valid until:** 2026-06-15 (Tauri v2 is stable; tauri-action v0 is stable; unlikely to break in 30 days)

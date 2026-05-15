# Phase 15: Packaging & Cross-platform - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-15
**Phase:** 15-packaging-cross-platform
**Areas discussed:** macOS build environment, macOS code signing, Windows installer format

---

## macOS Build Environment

| Option | Description | Selected |
|--------|-------------|----------|
| GitHub Actions CI | Free macOS runners, tauri-apps/tauri-action, no Mac required | ✓ |
| I have a Mac | Build locally, copy .dmg over | |
| Windows-only for now | Defer macOS to a follow-up phase | |

**User's choice:** GitHub Actions CI

---

| Option | Description | Selected |
|--------|-------------|----------|
| GitHub (public or private) | GitHub Actions free tier, tauri-action available | |
| Not on GitHub yet | Repo needs to be pushed to GitHub as part of this phase | ✓ |
| You decide | Planner handles CI wiring details | |

**User's choice:** Not on GitHub yet — pushing to GitHub is part of this phase

---

| Option | Description | Selected |
|--------|-------------|----------|
| Tag push (v*) | CI runs only on release tags like v2.0.0 | ✓ |
| Push to main/master | Builds on every push | |
| Manual trigger only | workflow_dispatch — click 'Run workflow' in GitHub UI | |

**User's choice:** Tag push (v*)

---

| Option | Description | Selected |
|--------|-------------|----------|
| GitHub Release | tauri-action creates release and attaches installers automatically | ✓ |
| Artifacts only | Available 90 days from Actions tab, no public release | |
| You decide | Planner chooses publish target | |

**User's choice:** GitHub Release

---

| Option | Description | Selected |
|--------|-------------|----------|
| Add entitlements.plist now | keychain-access-groups in src-tauri/entitlements.plist | ✓ |
| Skip secure-storage on macOS | Disable encryption on macOS, store unencrypted | |
| You decide | Researcher figures out correct entitlement setup | |

**User's choice:** Add entitlements.plist now (required for tauri-plugin-secure-storage on macOS)

---

## macOS Code Signing

| Option | Description | Selected |
|--------|-------------|----------|
| Unsigned is fine | Right-click → Open one-time workaround for internal school tool | ✓ |
| Apple Developer cert required | Friction-free Gatekeeper, $99/yr + GitHub Secrets | |
| You decide | Planner picks pragmatic default | |

**User's choice:** Unsigned is fine

---

| Option | Description | Selected |
|--------|-------------|----------|
| Unsigned is fine (Windows) | SmartScreen "More info" → "Run anyway", one-time step | ✓ |
| Windows code signing cert | Eliminates SmartScreen, ~$100-300/yr from CA | |

**User's choice:** Unsigned is fine for Windows too

---

## Windows Installer Format

| Option | Description | Selected |
|--------|-------------|----------|
| NSIS only (.exe) | Standard wizard, matches roadmap spec, smaller output | ✓ |
| Both NSIS + MSI | Two files per release, for IT Group Policy deployment | |
| MSI only | Enterprise-friendly, unusual for small internal tool | |

**User's choice:** NSIS only (.exe)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Current user only | No UAC prompt, installs to AppData\Local, Tauri default | ✓ |
| All users (requires admin) | Program Files, available to all accounts, UAC elevation | |

**User's choice:** Current user only

---

## Claude's Discretion

- Matrix build runners: whether ubuntu-latest is needed alongside macOS + Windows
- Exact `entitlements.plist` keychain group name format (researcher to check plugin docs)
- CSP + `useHttpsScheme: true` compatibility on macOS WebKit

## Deferred Ideas

- Code signing (both platforms) — deferred until budget/need arises
- Linux AppImage — no requirement
- Auto-updater (tauri-plugin-updater) — future phase

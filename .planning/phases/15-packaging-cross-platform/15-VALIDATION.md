---
phase: 15
slug: packaging-cross-platform
status: draft
nyquist_compliant: false
wave_0_complete: true
created: 2026-05-15
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x |
| **Config file** | vite.config.ts (inline vitest config) |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green (43 tests passing)
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Secure Behavior | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------------|-----------|-------------------|--------|
| 15-metadata | 01 | 0 | PKG-01, PKG-02 | N/A | automated | `npm test` | ⬜ pending |
| 15-tauri-conf | 01 | 0 | PKG-01, PKG-02 | N/A | automated | `npm test` | ⬜ pending |
| 15-entitlements | 01 | 0 | PKG-02 | keychain access-groups omitted for ad-hoc | automated | `npm test` | ⬜ pending |
| 15-release-yml | 02 | 1 | PKG-01, PKG-02 | GITHUB_TOKEN only, no cert secrets | automated | `npm test` | ⬜ pending |
| 15-pkg-01-smoke | manual | post-CI | PKG-01 | unsigned NSIS, currentUser scope | manual | Download + install .exe on Windows 10/11 | ⬜ pending |
| 15-pkg-02-smoke | manual | post-CI | PKG-02 | ad-hoc signed DMG, keychain prompt once | manual | Download + install .dmg on macOS 12+ | ⬜ pending |
| 15-pkg-03-visual | manual | post-CI | PKG-03 | same layout on WebView2 and WebKit | manual | Side-by-side screenshot review | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all automated phase requirements.
- No new test stubs needed — PKG requirements are integration/smoke tests that require real artifacts
- Existing 43-test suite continues as regression guard after each config change

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| NSIS .exe installs without admin, app launches | PKG-01 | Requires clean Windows 10/11 machine + built artifact | Download .exe from GitHub Release, install, verify Mentordashboard CIOS opens |
| .dmg installs on macOS 12+, keychain prompt appears once | PKG-02 | Requires macOS device + built artifact | Download .dmg from GitHub Release, drag to Applications, open, verify app launches and data loads |
| UI visually equivalent on both platforms | PKG-03 | No automated visual regression tooling | Open app on Windows + macOS side by side; compare klasoverzicht tiles, colors, typography |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (none — existing infra sufficient)
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

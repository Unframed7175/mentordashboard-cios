---
status: diagnosed
phase: 15-packaging-cross-platform
source: [15-01-SUMMARY.md, 15-02-SUMMARY.md]
started: 2026-05-16T00:00:00Z
updated: 2026-05-16T00:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. GitHub Release artifacts present
expected: |
  Go to your GitHub repo → Releases page (github.com/YOUR_USERNAME/mentordashboard-cios/releases).
  The release tagged v2.0.1 should exist with exactly 3 installer files attached:
  - Mentordashboard CIOS_2.0.1_aarch64.dmg  (macOS Apple Silicon)
  - Mentordashboard CIOS_2.0.1_x64.dmg       (macOS Intel)
  - Mentordashboard CIOS_2.0.1_x64-setup.exe (Windows NSIS)
  GitHub also adds source .zip and .tar.gz automatically — those are expected and fine.
result: pass

### 2. Windows installer installs without UAC
expected: |
  Download Mentordashboard CIOS_2.0.1_x64-setup.exe from the release page.
  Double-click to run. If Windows SmartScreen appears ("Windows protected your PC"):
  click "More info" → "Run anyway" (expected for unsigned app — one-time only).
  The installer should complete and install the app to AppData\Local (no admin/UAC prompt).
  After install, the app window should open showing either ImportPage (no data yet) or Klasoverzicht.
result: pass

### 3. Windows app opens and loads
expected: |
  After installation, open Mentordashboard CIOS from the Start menu or desktop shortcut.
  The app window opens without error. You should see either:
  - ImportPage (if no student data has been imported yet), or
  - Klasoverzicht with tiles (if you already had data)
  No crash, no blank white screen, no error dialog.
result: pass
note: ImportPage shown — drag-drop zone + "Bestanden selecteren" button visible, no errors.

### 4. Windows data persists after restart
expected: |
  With the installed app open: add a klas or import a student file.
  Close the app completely (not just minimize — close the window).
  Reopen the app. The data you added should still be there — encrypted storage survives restart.
result: issue
reported: "Can't add files — error 'Geen actieve klas — maak eerst een klas aan' appears. No visible button or tab strip to create a class anywhere in the app."
severity: major

### 5. macOS DMG installs and opens (skip if no Mac available)
expected: |
  Download the .dmg matching your Mac (aarch64 for Apple Silicon, x64 for Intel).
  Double-click the .dmg, drag the app to Applications, and open it.
  If Gatekeeper blocks ("unidentified developer"): System Settings → Privacy & Security → "Open Anyway".
  On first launch: a system dialog appears asking to allow keychain access — click Allow.
  The app window opens showing ImportPage or Klasoverzicht. No crash.
result: issue
reported: "DMG opens and app launches. Same error as Windows — 'Geen actieve klas' on ImportPage, no visible way to create a class. Consistent across both platforms."
severity: major

### 6. Local build still works (regression check)
expected: |
  In the project folder (D:\Downloads\get-shit-done-main\dashboard-2), run: npm test
  All 43 tests should pass with 0 failures. The config changes (Cargo.toml, tauri.conf.json,
  entitlements.plist) are not imported by any test — this confirms no regression was introduced.
result: pass
note: 43 passed, 5 skipped (expected), 0 failures. 9 test files passing.

## Summary

total: 6
passed: 4
issues: 2
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "The installed app provides a visible way to create a class from the ImportPage (KlasTabStrip with '+' button is visible)"
  status: failed
  reason: "User reported: ImportPage shows 'Geen actieve klas — maak eerst een klas aan' but no KlasTabStrip or class creation button is visible anywhere in the window"
  severity: major
  test: 4
  artifacts: []
  missing: [KlasTabStrip component visible on ImportPage in production build]

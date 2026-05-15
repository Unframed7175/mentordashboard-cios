# Phase 15: Packaging & Cross-platform - Context

**Gathered:** 2026-05-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Produce installable distributable(s) for Windows and macOS: an NSIS `.exe` installer for Windows 10/11 and a `.dmg` for macOS 12+, distributed via a GitHub Release. The macOS build runs on GitHub Actions CI (not locally). UI must render visually identically on both WebView2 (Windows) and WebKit (macOS).

</domain>

<decisions>
## Implementation Decisions

### macOS Build Environment
- **D-01:** The repo must be pushed to GitHub as part of this phase — it is not there yet.
- **D-02:** Use `tauri-apps/tauri-action` GitHub Actions workflow. Trigger: tag push matching `v*` (e.g., `v2.0.0`). Matrix: `[ubuntu-latest, macos-latest, windows-latest]` (or just macOS + Windows since Linux binary is not needed).
- **D-03:** Artifacts published to a **GitHub Release** — tauri-action creates the release and attaches installers automatically.
- **D-04:** `tauri-plugin-secure-storage` on macOS requires a Keychain entitlement. Add `src-tauri/entitlements.plist` with `keychain-access-groups` and wire it in `tauri.conf.json` under `bundle.macOS.entitlements`.

### Code Signing
- **D-05:** Both platforms ship **unsigned**. This is acceptable for an internal school tool distributed directly to teachers.
  - Windows: SmartScreen warning ("Windows protected your PC") → "More info" → "Run anyway" (one-time)
  - macOS: Gatekeeper warning ("unidentified developer") → right-click → Open (one-time)
- **D-06:** No Apple Developer account ($99/yr) or Windows EV/OV cert required in this phase. Signing can be added later if needed.

### Windows Installer
- **D-07:** NSIS only (`.exe` wizard). MSI target disabled — not needed for direct distribution to teachers.
  - Change `tauri.conf.json` `bundle.targets` from `"all"` to `["nsis"]` (or `"nsis"` string).
- **D-08:** Install scope: **current user only** (no UAC admin prompt). Tauri NSIS default — installs to `AppData\Local`. Teachers install without IT help.

### App Metadata Cleanup
- **D-09:** Update `src-tauri/Cargo.toml` placeholders before packaging:
  - `description = "A Tauri App"` → `"Mentordashboard CIOS — voortgang en verzuim in één oogopslag"`
  - `authors = ["you"]` → `["CIOS Zuidwest"]`
  - `name = "tauri-app"` can stay (internal crate name, not user-visible)
- **D-10:** `tauri.conf.json` `productName` ("Mentordashboard CIOS") and `identifier` ("nl.cios.mentordashboard") are already correct — no change needed.

### Claude's Discretion
- Matrix build: researcher to confirm whether the ubuntu-latest runner is needed or whether Windows + macOS runners suffice.
- Exact `entitlements.plist` keychain group name: researcher to check tauri-plugin-secure-storage docs for the correct group format.
- CSP and `useHttpsScheme: true` (set in Phase 12) — researcher to verify this is compatible with the macOS WebKit build context.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project configuration
- `src-tauri/tauri.conf.json` — Current bundle config (`targets: "all"`, icons, window config, CSP, `useHttpsScheme`)
- `src-tauri/Cargo.toml` — Rust deps including `tauri-plugin-secure-storage = "1"` (requires macOS entitlement)
- `package.json` — Build scripts (`"build": "tauri build"`)

### Requirements
- `.planning/REQUIREMENTS.md` §PKG-01, §PKG-02, §PKG-03 — Packaging requirements

### Tauri documentation (researcher to fetch)
- `tauri-apps/tauri-action` GitHub Action — official CI/CD action for Tauri builds
- `tauri-plugin-secure-storage` macOS entitlements — keychain-access-groups setup
- Tauri v2 NSIS bundle config — `bundle.windows.nsis` config options for per-user install

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src-tauri/icons/` — All required icon formats already present: `icon.icns` (macOS), `icon.ico` (Windows), `icon.png`, and Windows Square logos. No icon work needed.
- `src-tauri/capabilities/default.json` — Existing capability config (from Phase 12). macOS entitlements go alongside in `tauri.conf.json`, not here.

### Established Patterns
- `useHttpsScheme: true` (Phase 12 decision) — Must remain in tauri.conf.json for plugin-store to work. Researcher should verify WebKit on macOS handles this scheme correctly.
- `"targets": "all"` in `bundle` — Change to `["nsis"]` for Windows-only installer output; the CI matrix will produce platform-specific builds anyway.

### Integration Points
- `src-tauri/src/lib.rs` — Registers `tauri-plugin-secure-storage`. The macOS entitlement must match the plugin's expected keychain group.
- GitHub Actions: new file `.github/workflows/release.yml` — the main deliverable of this phase alongside the actual installer binaries.

</code_context>

<specifics>
## Specific Ideas

- CI trigger on `v*` tag push means the release workflow is: `git tag v2.0.0 && git push origin v2.0.0` → CI runs → GitHub Release with `.exe` and `.dmg` attached.
- Teachers download directly from the GitHub Releases page. No separate hosting needed.

</specifics>

<deferred>
## Deferred Ideas

- Code signing (both platforms) — deferred until there is a concrete need or budget for certificates.
- Linux AppImage — `targets: "all"` would include it, but no Linux requirement exists. Excluded by switching to `["nsis"]` on Windows (and `["dmg"]` on macOS via CI).
- Auto-updater (`tauri-plugin-updater`) — outside phase scope; future phase if needed.

</deferred>

---

*Phase: 15-Packaging & Cross-platform*
*Context gathered: 2026-05-15*

---
phase: "09"
plan: "01"
status: complete
completed: "2026-04-24"
requirements_delivered:
  - DES-01
  - DES-02
  - DES-03
  - DES-04
---

# Plan 09-01 Summary: CIOS Huisstijl CSS Tokens

## What Was Built

Updated all CIOS kleur- en typografie-tokens in index.html to apply CIOS Zuidwest huisstijl.

## Key Changes

### :root tokens (5 values)
- `--bg-header`: `#1a1a2e` → `#003057` (CIOS navy)
- `--accent-blue`: `#3b82f6` → `#00AEEF` (CIOS cyaan)
- `--accent-blue-hover`: `#2563eb` → `#009AD6`
- `--accent-blue-light`: `#eff6ff` → `#E6F7FD`
- `--accent-blue-border`: `#bfdbfe` → `#80D7F7`

### body.dark explicit overrides (5 new tokens)
Added `/* CIOS huisstijl — Phase 9 */` block with dark-mode-specific values:
- `--accent-blue: #00AEEF`, `--accent-blue-hover: #009AD6`
- `--accent-blue-light: #0A2C3D`, `--accent-blue-border: #005F8A`
- `--bg-header: #003057`

### Hardcoded hex anti-patterns fixed (2)
- `.nav-count { background: #3b82f6 }` → `var(--accent-blue)`
- `body.dark .sort-btn.active { border-color: #3b82f6 }` → `var(--accent-blue)`

### font-weight 600 → 700 promotions (15 elements)
CSS selectors: `.sort-btn.active`, `#klas-tabel th`, `.student-naam`, `.detail-section-title`, `.dg-matrix th`, `.leerlijn-naam`, `.vak-header`, `.aanvullend-veld label`, `#leerlijn-toewijzing h2`, `.lt-table th`, `.klas-tile-naam`, `#klassen-leeg h2`, `.dg-matrix-tijdlijn .groep-header`, `.spider-leerlijn-title`, `.ap-subsection-title`

Inline HTML: 6 h2/h3 elements in import panels and klas dialog.

**Decorative badges preserved at 600:** `.nav-count`, `.status-badge`, `.vote-badge`, `.traject-tag`, `.ap-status-badge`

## Files Modified

- `index.html` — CSS token definitions, dark mode overrides, font-weight promotions

## key-files

### created
(none — only modified existing file)

### modified
- `index.html` — CIOS huisstijl tokens and bold typography

## Self-Check: PASSED

- ✓ `--accent-blue: #00AEEF` in :root
- ✓ `--bg-header: #003057` in :root and body.dark
- ✓ `#0A2C3D` and `#005F8A` in body.dark
- ✓ No `#3b82f6` remaining in index.html
- ✓ Spider tokens `#22b8c8` (light) and `#67e8f9` (dark) unchanged
- ✓ Exactly 5 decorative selectors remain at font-weight: 600

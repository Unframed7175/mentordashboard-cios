# Phase 10: Scaffold & Toolchain - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-12
**Phase:** 10-scaffold-toolchain
**Areas discussed:** Project structuur, Test migratie aanpak, Tauri window inhoud, Rust pre-flight bootstrap

---

## Project structuur

| Option | Description | Selected |
|--------|-------------|----------|
| Subfolder src-tauri/ + src/ in dashboard-2 | Tauri scaffoldt in bestaande map, één git repo, één package.json. Bestaande code blijft als referentie. | ✓ |
| Nieuwe map naast dashboard-2/ | Dashboard-v2/ als aparte map, apart git init. Bestaande code raadpleeg je via ../dashboard-2/. | |

**User's choice:** Subfolder in dashboard-2 (aanbevolen)
**Notes:** Bestaande bestanden (app.js, parsers/, utils/, index.html) blijven ongewijzigd op dezelfde plek als migratiebron voor Phase 11.

---

## Test migratie aanpak

| Option | Description | Selected |
|--------|-------------|----------|
| Vitest compat-mode — geen testcode aanpassen | globals: true + environment: jsdom. Bestaande .test.js draaien zonder aanpassing. Phase 11 converteert naar TS. | ✓ |
| Direct omschrijven naar native Vitest | Verwijder Jest, herschrijf alle 128 tests naar native Vitest import syntax. Meer werk in Phase 10. | |

**User's choice:** Vitest compat-mode (aanbevolen)

| Succesdefinitie | Description | Selected |
|--------|-------------|----------|
| 0 failures, 128 passed in Vitest output | Exacte count. Skipped = failure. | ✓ |
| Geen regressies t.o.v. Jest baseline | Beide runners geven zelfde verdeling. | |

**User's choice:** 0 failures, 128 passed (aanbevolen)

---

## Tauri window inhoud

| Option | Description | Selected |
|--------|-------------|----------|
| Lege React placeholder | App-naam, versie, "Scaffold complete". Bewijst Vite+React+Tauri werken. | ✓ |
| Bestaande index.html laden via Vite | Direct werkende app in Tauri window. Mengt Phase 14 scope met Phase 10. | |

**User's choice:** Lege React placeholder (aanbevolen)

| TypeScript strict-mode | Description | Selected |
|--------|-------------|----------|
| noImplicitAny per module, strict: false globaal | Incrementele adoptie conform v2.0 beslissing. Phase 11 migratie wordt niet geblokkeerd. | ✓ |
| strict: true globaal vanaf Phase 10 | Maximale veiligheid van dag 1. Phase 11 moet meteen 100% strict zijn. | |

**User's choice:** noImplicitAny per module, strict: false globaal (aanbevolen)

---

## Rust pre-flight bootstrap

| Option | Description | Selected |
|--------|-------------|----------|
| Plan bevat installatie-taak als eerste stap | winget install Rustlang.Rustup + VS2022 + rustup stable. Expliciet in plan 10-01. | ✓ |
| Pre-flight checklist in README, niet in plan | Plan gaat ervan uit dat Rust al staat. Risico op halverwege falen. | |

**User's choice:** Installatie-taak als eerste stap in het plan (aanbevolen)

| Tauri init commando | Description | Selected |
|--------|-------------|----------|
| npm create tauri-app@latest -- --template react-ts | Officieel Tauri v2 React+TS template. Meest recente standaard. | ✓ |
| Handmatig opzetten: vite + @tauri-apps/cli apart | Meer controle, meer handmatig werk, risico op verkeerde versies. | |

**User's choice:** npm create tauri-app@latest -- --template react-ts (aanbevolen)

---

## Claude's Discretion

- Exacte Vitest configuratie parameters (pool, coverage provider, reporter) — standaard defaults
- Tauri permissions in tauri.conf.json voor Phase 10 — minimale set; uitgebreid in Phases 12–13
- ESLint/Prettier configuratie — standaard React+TypeScript conventies

## Deferred Ideas

- Vitest coverage drempelwaarden — relevant voor Phase 11+
- GitHub Actions CI pipeline — relevant voor Phase 15 (Packaging)
- ESLint strictere regels — relevant na TypeScript migratie (Phase 11+)

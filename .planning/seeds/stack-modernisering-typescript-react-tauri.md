---
title: "Volledige stack modernisering: TypeScript + React + Tauri + versleutelde opslag"
planted_date: "2026-04-24"
trigger_condition: "Wanneer een tweede developer actief bijdraagt aan het project"
status: dormant
priority: high
---

# Seed: Stack Modernisering

## Idee

Herbouw het mentordashboard op een professionele, toekomstbestendige stack die:
- Meerdere developer-contributors ondersteunt met lage instapdrempel
- AVG-compliant leerlingdata opslaat (versleuteld, lokaal, geen externe datastromen)
- Native draait op Mac én Windows als geïnstalleerde desktop-applicatie

## Doelstack

| Laag | Keuze | Reden |
|------|-------|-------|
| Taal | TypeScript | Meest gangbaar onder NL-devs; type-veiligheid verplicht bij grotere teams |
| UI framework | React + Vite | Laagste instapdrempel voor contributors; grootste ecosysteem |
| Desktop wrapper | Tauri | AVG-posture (Rust backend, capability-based permissions, kleine attack surface); ~10MB bundle vs Electron ~150MB |
| Lokale opslag | Versleuteld (bijv. SQLCipher of Tauri secure storage) | Vervangt plaintext localStorage; vereist voor leerlingdata onder AVG |
| Testing | Jest + Vitest | Behoud bestaande tests, migreer naar Vite-native runner |

## Wat dit oplevert

- Professionele DX: TypeScript-types, ESLint, Prettier, gestructureerde componentenbibliotheek
- Veilige installeerbare app (`.exe` Windows / `.dmg` Mac) zonder Python http.server
- AVG-aantoonbare opslag — geen plaintext studentdata in browser localStorage
- Contributors kunnen onboarden zonder de huidige single-file architectuur te begrijpen

## Migratiepad (hoog niveau)

1. TypeScript + Vite setup — bestaande logica overzetten van `app.js`
2. React componentenstructuur — UI opdelen in herbruikbare componenten
3. Tauri wrapper — desktop packaging, secure IPC voor bestandstoegang
4. Versleutelde opslag — localStorage vervangen door Tauri secure storage of SQLCipher
5. AVG audit — dataflow documenteren, verwijdermechanisme toevoegen

## Trigger

Plant dit als fase zodra een tweede actieve developer aan boord komt, of wanneer de app buiten de eigen klas/school wordt ingezet.

## Gerelateerd

- Note: `architectuur-beslissing-tauri-vs-electron.md`
- Research: `.planning/research/questions.md` — AVG compliance voor lokale desktop-app

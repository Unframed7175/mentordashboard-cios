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

## AVG-vereisten (onderdeel van deze modernisering — niet als losse patch)

Besluit 2026-05-12: AVG-gaten worden NIET apart gerepareerd in de huidige codebase. Ze worden meegenomen in de volledige modernisering.

**Developer-verantwoordelijkheid (in scope voor deze rebuild):**
- [ ] **AES-256 versleuteling** voor alle lokaal opgeslagen leerlingdata — sleutel via PBKDF2 (wachtwoord) of OS-native credential store, nooit naast de data
- [ ] **Per-leerling verwijderfunctie** — recht op verwijdering (artikel 17 AVG); niet alleen "alles wissen"
- [ ] **Dataflow documentatie** — welke velden worden opgeslagen, hoe lang, waarvoor — ten behoeve van pre-DPIA door school

**School-verantwoordelijkheid (buiten scope app, wel informeren):**
- App opnemen in verwerkingsregister (artikel 30 AVG)
- Pre-DPIA uitvoeren via Kennisnet/SIVON voor brede inzet
- Retentiebeleid bepalen per dataveld

## Migratiepad (hoog niveau)

1. TypeScript + Vite setup — bestaande logica overzetten van `app.js`
2. React componentenstructuur — UI opdelen in herbruikbare componenten
3. Tauri wrapper — desktop packaging, secure IPC voor bestandstoegang
4. Versleutelde opslag — localStorage vervangen door Tauri secure storage of SQLCipher (AES-256)
5. Per-leerling verwijderfunctie — artikel 17 AVG compliance
6. Dataflow documentatie — ten behoeve van school pre-DPIA

## Trigger

Plant dit als fase zodra een tweede actieve developer aan boord komt, of wanneer de app buiten de eigen klas/school wordt ingezet.

## Gerelateerd

- Note: `architectuur-beslissing-tauri-vs-electron.md`
- Research: `.planning/research/questions.md` — AVG compliance voor lokale desktop-app

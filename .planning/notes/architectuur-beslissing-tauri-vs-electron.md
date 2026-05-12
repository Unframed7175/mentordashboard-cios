---
title: "Architectuurbeslissing: Tauri boven Electron, TypeScript boven vanilla JS"
date: "2026-04-24"
context: "Exploratiesessie toekomstbestendigheid — aanleiding: tweede developers bij project betrekken"
status: besloten
---

# Architectuurbeslissing: Stack Modernisering

## Aanleiding

Het mentordashboard begon als een lokale single-file browser-app (vanilla HTML/JS). Zodra meerdere developers bijdragen en leerlingdata AVG-compliant opgeslagen moet worden, schiet de huidige architectuur tekort op drie punten:

1. **Developer experience** — één groot `app.js` bestand zonder types, geen build-tooling, moeilijk onboardbaar
2. **Cross-platform** — draait via `start.bat + Python http.server`, werkt niet native op Mac
3. **Dataopslag** — leerlingdata in plaintext localStorage is niet AVG-compliant

## Beslissingen

### TypeScript boven vanilla JavaScript

- Verplichte keuze bij meerdere developers — type-fouten worden bij compile-time gevangen, niet in productie
- Meest gangbare taal voor NL frontend-developers (React/Vue ecosysteem draait vrijwel altijd op TypeScript)
- Geen volledige herschrijving nodig — TypeScript is een superset van JS; migratie is incrementeel

### Tauri boven Electron

Beide wrappen webtech als desktop-app. De keuze valt op Tauri om twee redenen:

**Veiligheid (doorslaggevend voor AVG):**
- Tauri gebruikt een Rust-backend: memory-safe by default, geen gehele klasse van buffer-overflow kwetsbaarheden
- Capability-based permission model: alle OS-toegang (bestandssysteem, netwerk) is standaard dichtgezet en moet expliciet worden aangezet — dit is aantoonbaar in een AVG-audit
- Kleine attack surface: ~10MB bundle vs Electron's ~150MB (Chromium inbegrepen)

**Nadelen Tauri (bewust geaccepteerd):**
- Rust-kennis vereist voor backend-logica (beperkte set IPC-commando's)
- WebView-variaties tussen Mac (WebKit) en Windows (WebView2) vereisen cross-platform CSS-testing
- Electron heeft lagere migratiedrempel vanuit bestaande browsercode

**Nadelen Electron (reden om te kiezen voor Tauri):**
- Renderer-proces had historisch brede Node.js API-toegang — vereist extra beveiligingsconfiguratie
- Geen structurele AVG-borging by default
- Zware bundlegrootte (gebruikers downloaden een complete Chromium-instantie)

### Versleutelde lokale opslag boven localStorage

AVG vereist passende technische maatregelen voor persoonsgegevens. Plaintext localStorage is niet verdedigbaar bij een audit. Opties:

- **Tauri secure storage** — eenvoudig, OS-native keychain
- **SQLCipher** — versleutelde SQLite-database, goed ondersteuend in Tauri via Rust bindings
- **Encrypted JSON** — lichtste optie, eenvoudigste migratie vanuit localStorage

## Wat dit besluit niet vastlegt

- Welk UI-componentenbibliotheek (shadcn/ui, Radix, MUI — open)
- Exacte AVG-vereisten voor dit specifieke gebruik (zie research questions)
- Tijdlijn of prioritering van de migratie

## Trigger om te activeren

Zie seed: `stack-modernisering-typescript-react-tauri.md`

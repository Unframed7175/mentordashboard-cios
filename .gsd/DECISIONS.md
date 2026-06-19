# DECISIONS.md — Mentordashboard CIOS

> Gegenereerd op: 2026-05-30 (retroactief, op basis van bestaande codebase)
> Append-only: voeg nieuwe beslissingen toe onderaan. Verwijder of overschrijf nooit.

---

## ADR-01 · Tauri v2 als desktop framework

**Status:** Vastgelegd (Fase 12)  
**Beslissing:** Tauri v2 (niet Electron, niet Tauri v1, niet PWA)  
**Reden:**
- Klein distributiepakket (geen Chromium meegeleverd)
- Rust backend voor native encryptie (AES-256-GCM)
- Cross-platform Windows + macOS uit één codebase
- `@tauri-apps/plugin-store` voor veilige lokale opslag

**Afgewezen alternatieven:** Electron (te zwaar), PWA (geen bestandssysteemtoegang), Tauri v1 (plugin-store API te beperkt)

---

## ADR-02 · plugin-store (LazyStore) als persistence laag

**Status:** Vastgelegd (Fase 12)  
**Beslissing:** `@tauri-apps/plugin-store` met `LazyStore('store.json')`, meerdere sleutels per domein  
**Reden:**
- Tauri-native store met AES-256-GCM encryptie via Rust commando's
- Één bestand (`store.json`), gescheiden keys: `'klassen'`, `'settings'`, `'doorstroom_normen'`, `'verzuim_drempels'`
- `LazyStore` geeft lazy I/O — pas geladen bij eerste toegang

**Kritieke valkuil:** `store.set()` is in-memory only. Altijd `store.set()` + `store.save()` combineren.  
**Vervangt:** localStorage (Phase 4), directe `datamodel.ts` persistence (deprecated na Phase 12)

---

## ADR-03 · Enkelvoudige appState bridge (array reference)

**Status:** Vastgelegd (Fase 12)  
**Beslissing:** `appState.students` en `klassenState.klassen[activeKlasId].students` verwijzen naar **dezelfde array**  
**Reden:**
- Legacy code (parsers, addStudent, mergeVerzuim) gebruikt `appState.students`
- Multi-klas code gebruikt `klassenState`
- Bridge voorkomt het herschrijven van alle legacy consumers
- Bij `switchActiveKlas()`: altijd `appState.students = klassenState.klassen[klasId].students` uitvoeren

**Risico:** mutaties via `appState.students` zijn onzichtbaar voor React state — altijd `setRefreshKey(k => k+1)` aanroepen na import

---

## ADR-04 · PDF.js als vendor ESM bundle

**Status:** Vastgelegd (Fase 1 + Phase 12)  
**Beslissing:** PDF.js geladen als ESM-bundel uit `/vendor/` (niet via npm `pdfjs-dist`)  
**Reden:**
- pdfjs-dist npm-types gelden niet voor de vendor-bundel; `@ts-ignore` is noodzakelijk
- `workerSrc` instellen op `.mjs`-bestand — `workerPort` gebruiken veroorzaakt silent message loss (workers bootstrappen niet op tijd)
- Tauri v2 + Vite require module worker: `new URL('../vendor/pdf.worker.min.mjs', import.meta.url).href`

---

## ADR-05 · Doorstroomnorm engine — twee trajecten

**Status:** Vastgelegd (Fase 3 + Phase 25)  
**Beslissing:** Engine ondersteunt BJ1 en BJ2; traject-detectie uit `periode`-veld (leading), fallback op `leerjaar`  
**Reden:**
- CIOS werkt met twee trajecten: einde Basisjaar 1 (doorstroom naar BJ2 of versneld SBC) en einde Basisjaar 2 (doorstroom naar SBL of SBC)
- Normen zijn configureerbaar (8 drempelwaarden) en opgeslagen in plugin-store
- `detectTraject()` waarschuwt in console wanneer traject onzeker is, valt terug op 'bj2'

**BJ2 prognose-labels:** sbl, sbc, neutraal, negatief  
**BJ1 prognose-labels:** naar_bj2, versneld_sbc, neutraal, negatief

---

## ADR-06 · 19 deelgebieden, 3 leerlijnen

**Status:** Vastgelegd (Fase 1, definitief B02_definitief.xlsx v1.0)  
**Beslissing:** Vaste set van 19 deelgebieden verdeeld over 3 leerlijnen  
**Leerlijnen:**
- `lesgeven`: V&A, M&M, INS, O&DW, C&B, 1E&B (6 deelgebieden)
- `organiseren`: P&O, S&O, ORG, I&B, 2E&B (5 deelgebieden)
- `prof_handelen`: PrCo, VSK, LOB, INFO, DESK, BS, TOW, BH (8 deelgebieden)

**4 scorelevels:** onvoldoende, voldoende, goed, excellent  
**Kern SBC (BJ2):** V&A, P&O, C&B, 1E&B moeten elk ≥ voldoende zijn

---

## ADR-07 · fflate voor backup compressie

**Status:** Vastgelegd (Fase 11)  
**Beslissing:** `fflate` (npm) voor ZIP backup — geen native afhankelijkheden  
**Reden:** Werkt in Tauri/browser context zonder native bindings; kleine bundle-size  
**Backup formaat:** ZIP met `mentordashboard-backup.json`, versie 1, bevat klassenState + exportedAt timestamp  
**Herstelmodi:** 'overschrijven' (vervang alles) of 'samenvoegen' (voeg samen)

---

## ADR-08 · React 19 met useState view-routing

**Status:** Vastgelegd (Fase 6+)  
**Beslissing:** Geen React Router — view-switching via `useState<'import' | 'klas' | 'detail' | 'settings' | 'onboarding' | 'help'>`  
**Reden:**
- Desktop app heeft geen URL-navigatie nodig
- Eenvoudiger state management dan router
- Directe control over view-transities (slide-in animaties)

---

## ADR-09 · Multi-klas deduplicatie op leerlingId + periode

**Status:** Vastgelegd (Fase 7)  
**Beslissing:** Bij `addStudent()`: deduplicatie op `leerlingId + periode`. Meest recente import wint.  
**Reden:** Leerling kan meerdere periodes hebben (BJ1 fase 1, BJ1 fase 2, etc.) — alle periodes bewaard; per periode één record (laatste import)

---

## ADR-10 · Verzuim drempels configureerbaar

**Status:** Vastgelegd (Fase 18)  
**Beslissing:** Verzuim drempelwaarden niet hardcoded maar configureerbaar via instellingen  
**Standaard:** `ongeoorloofd: 600 min`, `geoorloofd: [te controleren]`  
**Opgeslagen onder:** `'verzuim_drempels'` key in plugin-store

---

## ADR-11 · Storage error UI via DOM (tijdelijk)

**Status:** Tijdelijk (Phase 12 → Phase 14 gepland)  
**Beslissing:** Kritieke opslagfouten worden gemeld via `document.getElementById('storage-error-banner')`  
**Reden:** Minimale viable error display zonder React dependency in klassen.ts  
**Geplande vervanging:** React toast/modal in Phase 14 (nog niet geïmplementeerd — backlog)

---

## ADR-12 · CI pipeline Windows x64 + macOS Apple Silicon

**Status:** Vastgelegd (Fase 30)  
**Beslissing:** GitHub Actions CI bouwt automatisch voor beide platformen  
**Targets:** Windows x64 (.exe installer), macOS Apple Silicon (.dmg)

---

## ADR-13 · Fabrieksreset met back-up-vangnet (geen auto-wipe, geen uninstall-hook)

**Status:** Vastgelegd (Fase 0, 2026-06-11 — GStack /office-hours)  
**Aanleiding:** Gebruikersfeedback: testdata (klas 2a) blijft zichtbaar na herinstallatie omdat de app-data map de-installatie overleeft; wizard wordt overgeslagen door `onboardingCompleted` + bestaande klassen.  
**Beslissing:** Handmatige, bevestigde "Alle gegevens wissen"-actie in Instellingen (typ-bevestiging `WISSEN`), met back-up-vangnet: backup-payload wordt uitgebreid naar volledige store-snapshot. Na wipe `window.location.reload()` → app start in onboarding-wizard.  
**Expliciet verworpen:** automatisch wissen bij start/update (vernietigt echte data bij updates); NSIS uninstall-hook (de-installeren zou ook voor echte gebruikers data vernietigen; platform-afhankelijk gedrag).  
**Randvoorwaarden:** keychain-sleutel (`nl.cios.mentordashboard.key`) blijft staan, anders is de pre-reset back-up onleesbaar. Resetvolgorde bindend: caches → store.clear()+save → reload. `localStorage.clear()` voor legacy keys.  
**Ontwerp:** `~/.gstack/projects/Unframed7175-mentordashboard-cios/rafael-master-design-20260611-213139.md` (APPROVED, 2 reviewrondes, score 8/10 → alle 14 bevindingen verwerkt)

---

## ADR-13a · Addendum fabrieksreset na eng-review + outside voice (2026-06-12)

**Status:** Vastgelegd (Fase 0, GStack /plan-eng-review)  
**Wijzigt:** ADR-13 randvoorwaarde "Resetvolgorde bindend: caches → store.clear()+save → reload" — **vervallen**.  
**Besluiten:**
1. `factoryReset()` muteert **geen** in-memory state: `store.clear()` + `store.save()` → `localStorage.clear()` → reload (injecteerbaar). Reden: geheugen legen vóór een mogelijk falende save creëert een dataverlies-pad (lege state wordt bij de volgende `saveKlassen()` gepersisteerd).
2. Backup-payload v2 = generieke store-snapshot via `store.entries()` (klassen blijft plaintext zoals v1). Store-keys worden alléén teruggezet bij 'overschrijven'-restore; 'samenvoegen' behoudt huidige instellingen. Reload alléén na v2-overschrijven-restore.
3. Dode functie `clearState()` (`utils/datamodel.ts:236`) wordt verwijderd.
4. Geen geautomatiseerde E2E over de reload heen; volledige reset/restore-cycli zijn handmatige QA-checklist op echte Tauri-build (incl. verificatie dat store.json op schijf leeg is).
**Bewust afgewezen:** same-machine disclaimer in dialoogtekst, AVG-motivering in docs, bindende bouwvolgorde backup→reset-UI.

---

## ADR-14 · M41 uitrol naar collega's — handmatige install, geen code-signing (2026-06-19)

**Status:** Vastgelegd (Fase 0 — office-hours + eng review + design review)
**Beslissing:** M41 ("uitrol naar collega's") is een content/distributie-milestone, geen feature-milestone. Geen OS-code-signing. De landingspagina (`Unframed7175/ciosmentorendashboard`) is dé canonieke pre-install-installatiegids; collega's installeren via één link + begeleide gids door de Windows SmartScreen / macOS Gatekeeper-waarschuwing heen.

**Reden:**
- De app werkt en heeft al een tweede gebruiker (collega draait hem al). Drempel is distributie + vertrouwen, niet functionaliteit.
- ~15-20 collega's voelen de status-quo-pijn (handmatige Excel-bijhouding).
- De installatiegids bestaat al grotendeels in `INSTRUCTIES.md` (Windows + macOS incl. quarantine).
- Code-signing kost geld + een org-besluit (Apple Developer / Azure Trusted Signing) dat niet zeker beschikbaar is. De waarschuwing is een eenmalige hobbel per machine; na de eerste install zien collega's hem niet meer.

**Design-beslissingen (design review):**
1. Vertrouwen-framing: geruststelling vóór de waarschuwingsscreenshot ("deze melding is normaal; app is veilig, draait alleen op je computer, stuurt geen data weg").
2. OS-kies-eerst structuur: Windows/Mac-knoppen tonen alleen de stappen van het gekozen OS.

**Architectuur:** landingspagina = single source of truth voor de installatiegids; `INSTRUCTIES.md` linkt ernaar; in-app Help = alléén post-install (gebruik/vertrouwen), nooit installatie. `xattr -c` → `xattr -cr` in de macOS-gids.

**Kritieke verificatie vóór rollout (T1):** test of de Windows NSIS auto-update (ongesigneerde installer) SmartScreen opnieuw triggert. Zo ja, dan breekt de "eenmalige waarschuwing"-aanname voor Windows-updates.

**Afgewezen alternatieven:** (B) macOS/Windows code-signing nu — uitgesteld; (C) CIOS IT/managed deployment — parallel niet-blokkerend gesprek; screen-recording/GIF-gids — uitgesteld t.g.v. tekst+screenshots.

**Bron:** `~/.gstack/projects/Unframed7175-mentordashboard-cios/rafael-master-design-20260618-213848.md`

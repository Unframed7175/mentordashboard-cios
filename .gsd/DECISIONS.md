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

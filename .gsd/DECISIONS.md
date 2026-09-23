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

## ADR-15 · Rolverdeling design-skills: UI UX Pro Max leidend, frontend-design ondersteunend (2026-09-14)

**Status:** Vastgelegd (projectlead, review PR #24)
**Beslissing:** De plugin `frontend-design@claude-plugins-official` staat projectbreed aan (`.claude/settings.json`). **UI UX Pro Max blijft leidend** voor het design system (`.gsd/DESIGN.md`) en voor stijlkeuzes per component (STACK.md §1, laag 4). `frontend-design` wordt alleen gebruikt als hulp bij het **schrijven van UI-code binnen** `.gsd/DESIGN.md`; adviezen die afwijken van DESIGN.md (andere lettertypes, paletten, stijlen) worden niet overgenomen.
**Reden:** Beide skills activeren bij UI-werk; zonder rangorde kan een agent in Fase 3 of Fase 2 tegenstrijdige design-adviezen combineren.
**Bij conflict:** DESIGN.md wint; wijziging van DESIGN.md loopt via UI UX Pro Max + GStack `/plan-design-review`.

---

## ADR-16 · Deelgebieden-schema 2026/2027 — 19→12 deelgebieden, 3→2 leerlijnen; doorstroomprognose expliciet 'normen_onbekend' tot nieuwe normen bekend zijn (2026-09-15)

**Status:** Vastgelegd (bounded config-update, Fase 0 overgeslagen — zie Afwijking 2026-09-15 in STATE.md; architectuur al besloten in M35/M37/M38)

**Aanleiding:** CIOS heeft het curriculum herzien voor schooljaar 2026/2027: de 19 deelgebieden uit ADR-06 zijn vervangen door 12 nieuwe (O&V, S&O, PH, DH, I&P, O&C, E&V, PrHo, DESK, PO, OIH, GV), en de 3 leerlijnen (`lesgeven`/`organiseren`/`prof_handelen`) zijn samengevoegd tot 2 (`lesgeven_en_organiseren`/`professioneel_handelen`). Bron: "2026-03 Hernieuwde set deelgebieden.docx" + twee Cumlaude/SomToday-PDF-exports 2026/2027 (BJ1 en BJ2), aangeleverd door projectlead.

**Beslissing:**
1. `src/config/leerlijn.json` bevat nu de 12 nieuwe deelgebieden met `group: 'lesgeven_en_organiseren' | 'professioneel_handelen'`. Dit vervangt ADR-06's 19/3-indeling volledig (geen coexistentie — bevestigd door projectlead: geen actieve klassen meer op de oude indeling).
2. De doorstroomnorm-engine (`KERN_SBC`, `DEFAULT_NORMEN.sbl/sbc/bj1Positief/negatiefTotaal/versneld*`) wordt **niet** heringeschat op basis van aannames — die getallen zijn gekalibreerd op 19 deelgebieden/3 leerlijnen (ADR-05/ADR-06) en de nieuwe doorstroomcriteria zijn nog niet vastgesteld. In plaats daarvan bewaakt `SUPPORTED_LEERLIJNEN` in `utils/prognosis.ts` welk schema de huidige normen dekken; wijkt het actieve schema daarvan af, dan geeft `berekenPrognose()` `label: 'normen_onbekend'` terug (`isNegatief: false`, geen `gaps`/`leerlijnen`-berekening). `berekenStatus()` mapt dit naar `kleur: 'grijs', label: 'Normen onbekend'` (vóór de "geen scores"-check). `DoortstroomPrognoseSection` toont een tekstuele melding i.p.v. cijfers.
3. Alle deelgebieden-weergave die **niet** van de doorstroomprognose afhangt (parser, `DeelgebiedenMatrix`, `SpiderChartCard`/`DetailWeergave`, `SettingsPage`-leerlijn-dropdown) is wél bijgewerkt naar de nieuwe 2-groepenindeling — mentoren kunnen dus per direct scores per nieuw deelgebied zien en labels/leerlijn-toewijzing beheren; alleen het doorstroom-*oordeel* (SBL/SBC/versneld/etc.) is bevroren tot de nieuwe normen bekend zijn.

**Reden:** een config-swap zonder guard zou de doorstroomprognose stilzwijgend laten doorrekenen met formules die niet meer bij het aantal/soort deelgebieden passen (bijv. "≥15 van de 12" is per definitie onhaalbaar) — dat levert een schijnbaar geldig maar feitelijk zinloos RAG-oordeel op, erger dan een zichtbare "onbekend"-status.

**Afgewezen alternatieven:** (a) alles blokkeren tot de nieuwe doorstroomnormen bekend zijn — onnodig, want deelgebieden/parser/matrix/spiderchart zijn zelfstandig bruikbaar zonder de norm-engine; (b) de oude normen naar rato herschalen (bijv. 15/19 × 12) — geen betrouwbare aanname, CIOS moet de nieuwe kern-vakken en drempels zelf vaststellen.

**Vervolg (niet-blokkerend):** zodra CIOS de nieuwe doorstroomcriteria vaststelt, `KERN_SBC`/`DEFAULT_NORMEN`/`SUPPORTED_LEERLIJNEN` herijken en de normen-sectie in `SettingsPage.tsx` (labels/max-waarden verwijzen nog naar de oude structuur) meenemen.

---

## ADR-17 · Doorstroomnormering 2026/2027 (M42) — architectuurbeslissingen Fase 0 (2026-09-15)

**Status:** Vastgelegd (Fase 0 — architectuurdiscussie met projectlead, vóór GSD Fase 1 spec)

**Aanleiding:** ADR-16's vervolgpunt — CIOS heeft de nieuwe doorstroomnormen aangeleverd (`26-27 Doorstroomnormeringen N3N4.pdf`, CIOS Zuidwest-NL). Dit is geen drempelwaarden-update maar een ander beoordelingsmodel: fase-specifieke tellingen (fase 2 vs fase 3, i.p.v. heel-jaar-totalen), per-vestiging criteria, en nieuwe sub-criteria. Vereist datamodel-uitbreiding, dus eerst architectuurbeslissingen vóór Fase 1 spec (S01-PLAN.md).

**Beslissingen:**
1. **Vestiging is een klas-eigenschap**, niet een leerling- of app-instelling. Reden: deze mentordashboard-instantie wordt gebruikt over meerdere CIOS-vestigingen tegelijk (bevestigd door projectlead) — Roosendaal, Goes en Dordrecht hebben elk eigen criteria. Een klas zonder ingestelde vestiging levert `normen_onbekend` op (zelfde patroon als ADR-16) i.p.v. een gok welke vestigingsnorm van toepassing is.
2. **WVO-traject-deelname wordt een nieuw handmatig veld**, niet iets wat de parser afleidt. Reden: bevestigd door projectlead — dit staat nergens digitaal in de Cumlaude-export. Analoog aan de bestaande keuzedelen-status-UI (handmatige invoer, persistent in klassenState, overleeft PDF-re-import net als `actiepunten`/`kdStatus`).
3. **Fase (F1/F2/F3) wordt een structureel veld op datapunt-niveau**, geëxtraheerd uit de bestaande tekstprefix in het datapunt-label (`- F1 ...`, `F2 ...`) tijdens het parsen — geen nieuwe brondata nodig, wel een nieuw `fase: number | null`-veld naast het bestaande `datapunt`-stringveld. Nodig omdat de nieuwe normen per fase tellen (bijv. "≥5 deelgebieden goed in fase twee"), niet over het hele jaar.
4. **"Betekenisvol Bewegen"-subcriterium en Rekenen-domeintelling zijn afleidbaar uit bestaande datapunten**, geen nieuwe velden: filter datapunten op sectienaam ("Betekenisvol Bewegen" resp. "Rekenen -eindtoets domein N") en tel per leerling hoeveel daarvan ≥voldoende/ingeleverd zijn. Bevestigd aanwezig in beide aangeleverde voorbeeld-PDF's.
5. **KD-deadline ("behaald/haalbaar vóór 1 december") wordt NIET tijdsgebonden berekend** in deze iteratie — de bestaande `KdStatus` (behaald/haalbaar/niet_behaald, geen datumveld) volstaat als proxy; de deadline blijft een menselijk procesgegeven, geen engine-input. Heropenen als projectlead dit alsnog wil automatiseren.

**Open vraag voor Fase 1 spec (`/plan-eng-review`):** wat "voldaan aan opleidingsactiviteiten" concreet betekent binnen de app (bestaand veld, nieuw handmatig veld, of impliciet via BPV/POK-uren) — nog niet vastgesteld, moet in S01-PLAN.md als concrete taak/aanname landen vóór executie.

**Afgewezen alternatieven:** normen direct coderen zonder vestiging-veld (genegeerd omdat meerdere vestigingen tegelijk in gebruik zijn — zou fout normenprofiel per klas toepassen); fase afleiden uit los periode-veld i.p.v. per-datapunt-tag (te grof — een leerling kan binnen één periode zowel fase 2- als fase 3-datapunten hebben, zoals beide voorbeeld-PDF's laten zien).

**Vervolg:** GSD Fase 1 — milestone `M42-doorstroomnormering-2026-2027/S01-PLAN.md` met concrete taken, daarna `/plan-eng-review` vóór Fase 2-executie.

---

## ADR-17a · Addendum na projectlead-antwoorden op OQ-1/OQ-2/OQ-3 (2026-09-15)

**Status:** Vastgelegd (Fase 1 — antwoorden projectlead op de open vragen uit S01-PLAN.md)
**Wijzigt:** ADR-17 §1 (vestiging-detectie) — aangevuld, niet vervallen.

**OQ-3 opgelost — wijzigt ADR-17 §1:** vestiging wordt **automatisch afgeleid uit de klassencode** (prefix van de klasnaam): `CSD` → Dordrecht, `CSG` → Goes, `CSR` → Roosendaal. Geen verplichte handmatige invoer nodig als de mentor de gebruikelijke CIOS-klascode-conventie aanhoudt. Randvoorwaarde: klasnamen zijn vrije tekst (F-04) — een klas waarvan de naam geen herkenbare code bevat, of een niet-herkende prefix, valt terug op **handmatige vestiging-override** in klas-instellingen; ontbreekt ook die, dan blijft `normen_onbekend` gelden (ADR-16-patroon, ongewijzigd).

**OQ-1 opgelost:** "voldaan aan stage-eisen en opleidingsactiviteiten" loopt via BPV-uren. Projectlead wil een **hybride import**: BPV-uren automatisch overnemen uit een Onstage-export (nieuwe bronindeling, naast de bestaande Cumlaude-BPV-Excel-import uit F-03) mét mogelijkheid tot handmatige correctie/aanvulling — zelfde patroon als de bestaande BPV-tracking, maar met een nieuwe importbron. **Blokkerend voor implementatie:** nog geen voorbeeld-Onstage-export ontvangen — bestandsstructuur onbekend tot een sample is aangeleverd. Parser-implementatie (nieuwe taak, Lane A) wacht daarop; het "voldaan"-criterium zelf kan intussen wél op de bestaande (handmatige) BPV-velden draaien.

**OQ-2 — deels open, niet blokkerend voor Goes/Dordrecht/BJ1-generiek:** "levels" is Roosendaal-eigen methodiek, betekenis nog onbekend. Projectlead vraagt een voorbeeld-PDF-export op bij Roosendaal-collega's. **Consequentie voor scope:** de Roosendaal-BJ2-eis ("alle levels 2/3 behaald") blijft in S01-PLAN.md een geblokkeerde sub-taak tot die sample er is; de rest van M42 (vestiging-detectie, fase-telling, WVO-traject, Betekenisvol Bewegen, Goes/Dordrecht-SBC, generiek BJ1-advies) is niet van deze sample afhankelijk en kan doorgaan.

---

## ADR-17b · OQ-2 opgelost: "levels" = benoemde datapunten in "Extern praktijkleren" (2026-09-16)

**Status:** Vastgelegd (Fase 1 — na ontvangst 2 Roosendaal-voorbeeldexports: Beij BJ1 Fase 1, Benders BJ2)
**Wijzigt:** ADR-17a (OQ-2 was open) — nu opgelost, deblokkeert T9c.

**Bevinding:** Roosendaal-rapporten hebben een extra sectie **"Extern praktijkleren"** (naast "Intern praktijkleren") met datapunten genaamd `Level <n> <activiteit>` (bijv. "Level 1 lesgeven", "Level 1 organiseren", "Level 1 begeleiden", "Level 1 promoten", oplopend t/m level 3 later in de opleiding; woordvolgorde niet altijd consistent — ook "Organiseren level 3" gezien). Dit zijn **gewone datapunten** met een status (zelfde `STATUS_STRINGS` als de rest van de app) én deelgebiedscores in de matrix (PrHo/DESK/PO/OIH/GV-kolommen) — geen nieuw databegrip, geen nieuw veld.

**Beslissing:** "Alle levels N behaald" wordt geïmplementeerd als een tellingsfunctie (analoog aan T4/T5) die:
1. Alle datapunten van de meest recente periode filtert op naam matchend `Level <N>` (los van woordvolgorde — regex op het cijfer, niet op positie).
2. Controleert dat élk gevonden datapunt een "behaald"/positief-ingeleverde status heeft (dezelfde statusverzameling als elders — geen aparte "level-status"-enum nodig).
3. Het aantal levels waarnaar gezocht wordt (2 voor SBL, 3 voor SBC) komt uit het vestigingsprofiel (Lane C, T7), niet hardcoded.

**Kanttekening:** het aantal "Level N …"-datapunten in een export groeit gedurende het jaar (BJ1-sample had 4 activiteiten × 2 levels, de BJ2-sample op dat moment nog maar 2 "Level 3"-items) — de telling moet dus "alle op dit moment aanwezige Level-N-datapunten zijn behaald" zijn, niet een vast aantal verwachten.

**Periode-notatie Roosendaal (extra bevestiging, geen nieuwe beslissing):** periode-string bevat een `RSD`-suffix (bijv. "BJ1 Fase 1 RSD - 2026/2027", "BJ2 RSD - 2026/2027"); `Leerjaar`-veld blijft onbetrouwbaar voor BJ2 (toont "1"), zoals al bekend (zie P-06 in KNOWLEDGE.md / ADR-05) — `detectTraject()`'s bestaande substring-match op `periode` blijft leidend en werkt hier ongewijzigd.

**Gevolg:** T9c is niet langer geblokkeerd — kan mee in `/plan-eng-review`.

---

## ADR-17c · T8-correctie: BJ1 is NIET generiek voor Roosendaal + ruling op dubbelzinnige levels-drempel (2026-09-18)

**Status:** Vastgelegd (Fase 2 — Lane C pre-flight, vóór T8's taakbrief geschreven)
**Wijzigt:** S01-PLAN.md T8-omschrijving (D8) — "geldt voor alle vestigingen (BJ1-advies is generiek)" was onjuist.

**Bevinding (herverificatie brondocument p.3, letterlijk):** de BJ1-tabel "Voortgangsbesluit naar basisjaar 2 of het profieljaar" bevat wél Roosendaal-specifieke aanvullingen, ondanks dat de rest van de BJ1-criteria generiek is:
- **naar_bj2** (positief studieadvies): "Voor Roosendaal geldt aanvullend: Minimaal 4 levels afgerond."
- **versneld_sbc** (positief studieadvies, versneld traject SBC): "Voor Roosendaal geldt aanvullend: Minimaal 8 levels afgerond voor SBL en minimaal 10 levels voor SBC."

**Dubbelzinnigheid:** de versneld_sbc-regel noemt twee getallen (8 en 10) in één kolom zonder dat er op dit punt in BJ1 al een traject-keuzeveld bestaat (`roosendaalTraject` is pas BJ2, via T3b) — onduidelijk of dit één drempel is of een vooruitwijzende dubbele poort.

**Projectlead-beslissing:** één drempel, **≥8 levels afgerond**, voor de hele versneld_sbc-uitkomst. De "10 voor SBC"-vermelding is informatief/vooruitwijzend voor de latere BJ2-traject-keuze (T3b/T9c) en wordt NIET als aparte BJ1-gate geïmplementeerd. Geen nieuw BJ1-traject-veld — voorkomt scope-verdubbeling van wat T3b al bij BJ2 doet.

**Gevolg voor T8:** beide Roosendaal-aanvullingen (≥4 levels voor naar_bj2, ≥8 levels voor versneld_sbc) horen in T8's taakbrief als expliciete extra AND-voorwaarde, gebruikt makend van vestiging (T7b) en T6b's level-telling — géén aparte per-vestiging-normen-call nodig, de drempel is brondocument-vast, niet configureerbaar.

**Afgewezen alternatief:** een nieuw BJ1-traject-intentieveld toevoegen om de 8/10-split te implementeren als dubbele poort — verworpen wegens onnodige scope-toename en duplicatie met T3b's bestaande BJ2-patroon.

---

## ADR-17d · T9a: BJ2 heeft geen eigen negatief-drempel meer + nieuw label 'bespreekgeval' (2026-09-21)

**Status:** Vastgelegd (Fase 2 — Lane C, vóór T9a's taakbrief geschreven)
**Wijzigt:** impliciete aanname in S01-PLAN.md dat BJ2 hetzelfde `negatief`/`neutraal`-labelpaar als BJ1 zou hergebruiken.

**Bevinding:** het brondocument (p.4, "A. Voortgangsbesluit doorstroom naar Examineringsjaar SBL of profieljaar SBC") heeft — anders dan BJ1's expliciete 3-kolom-tabel (Positief-BJ2 / Positief-versneld / Negatief-bindend, p.3) — GEEN aparte negatief-kolom: alleen een SBL- en een SBC-kolom, plus een gedeelde opmerking dat wie niet aan de eisen voldoet een "bespreekgeval" is. De oude `negatiefTotaal`/`negatiefPerLeerlijn`-drempels zijn gekalibreerd op het afgeschreven 19-deelgebieden-schema (ADR-16) en mogen niet hergebruikt worden voor het nieuwe 12-deelgebieden-schema — er bestaat geen brondocument-cijfer om een nieuwe BJ2-negatief-drempel op te baseren.

**Projectlead-beslissing:**
1. BJ2 krijgt in T9a **geen eigen `negatief`-uitkomst** — elke leerling die niet aan SBL (≥7 deelgebieden voldoende) of SBC (≥10 deelgebieden voldoende) voldoet, valt in een nieuwe, aparte uitkomst.
2. Die nieuwe uitkomst krijgt een **eigen label, niet `neutraal`** (BJ1's `neutraal`/"Twijfelgeval" blijft ongewijzigd, apart concept): **`bespreekgeval`** (letterlijke brondocument-term), getoond als **oranje / "Bespreekgeval"** in de klasoverzicht-tegel — zelfde kleurfamilie als `neutraal` (geen nieuwe `StatusKleur`-waarde nodig), maar met eigen tekst zodat een mentor het onderscheidt van BJ1's twijfelgeval.
3. `berekenStatus()`'s label→kleur-tabel (`src/utils/status.ts`) krijgt een EXPLICIETE branch voor `'bespreekgeval'` — zonder die branch valt een onherkend label stil door naar de catch-all (`groen`/"SBL"), wat een bespreekgeval-leerling ten onrechte als "in orde" zou tonen. Dit is een verplicht onderdeel van T9a, geen losse taak.

**Gevolg voor T9a:** `berekenBj2GeneriekPad()` (of hoe de geëxtraheerde, direct testbare functie ook genoemd wordt) retourneert `'sbl' | 'sbc' | 'bespreekgeval'` voor het generieke pad — geen `'negatief'` meer aan de BJ2-kant van dat pad. `src/utils/status.ts` krijgt de nieuwe branch. `DoortstroomPrognoseSection.tsx` (Lane D, T12) zal deze nieuwe uitkomst ook moeten tonen — buiten scope van T9a zelf, wel genoteerd als vervolgpunt.

---

## ADR-17e · T9a/T9c-routing verduidelijkt + cijferfout gevonden en gecorrigeerd (2026-09-21)

**Status:** Vastgelegd (Fase 2 — Lane C, tijdens herverificatie brondocument vóór T9a's taakbrief)

**Routing-correctie (eigen eerdere diagram was onjuist):** Tabel A (p.4, generiek SBL/SBC) is NIET exclusief voor niet-Roosendaal-leerlingen — de tabel bevat zelf al een "Voor Roosendaal geldt aanvullend"-regel per kolom, en is dus de UNIVERSELE eindejaars-tabel (met per-vestiging drempels via T7's normenprofiel, addendum inbegrepen). Roosendaal's eigen mid-jaar keuzeproces (p.5-6, T9c) is een AANVULLEND, niet-vervangend traject:
- Kiest de leerling 'sbc': het brondocument zegt letterlijk "is het hierboven beschreven voortgangsbesluit... van kracht" — dit is GEEN aparte berekening, T9c geeft in dat geval simpelweg T9a's eigen resultaat door (met Roosendaal's normen, addendum inbegrepen).
- Kiest de leerling 'sbl': dít heeft wél een eigen, kleinere eisenset (p.6) — fase 3 i.p.v. heel-jaar, eigen Rekenen/NL/KD/levels-eisen — onafhankelijk van Tabel A.
- Geen keuze gemaakt (roosendaalTraject `null`/`undefined`): T9a's eigen (Roosendaal-genormeerde) resultaat is leidend — er is geen derde tak nodig.

**Cijferfout gevonden en gecorrigeerd:** bij een verse, zorgvuldige herverificatie van élk T7-getal tegen het brondocument (vóór T9a's brief geschreven werd) bleek `bj2RoosendaalSblKeuzeRekenDomeinenMin` in de reeds gemergde T7-code op `3` te staan, terwijl p.6 letterlijk "minimaal 5 domeinen eindtoets afgerond op rekenniveau MBO3" zegt — waarschijnlijk verward met BJ1's naar_bj2-criterium (óók "3 domeinen, MBO3", ander getal toevallig dezelfde niveau-tekst). Gecorrigeerd naar `5` (commit `ba0dd6f`), inclusief de bijbehorende test. Alle overige T7-getallen zijn bij deze herverificatie opnieuw geverifieerd tegen p.3/4/6 en kloppen.

**Belangrijke ontwerp-valkuil voor T9a/T9c (nieuw, moet in hun taakbrieven staan):** de Roosendaal-levels-eisen in T7's `VestigingNormen` zijn NIET allemaal hetzelfde soort check. BJ1's velden (`bj1NaarBj2RoosendaalLevelsMin`/`bj1VersneldSbcRoosendaalLevelsMin`) zijn een COUNT ("minimaal N levels afgerond", vergeleken met `>=`, waarbij `0` voor Goes/Dordrecht triviaal voldaan is — T8's ontwerp, correct). De BJ2-velden (`bj2SblRoosendaalLevelsMin`/`bj2SbcRoosendaalLevelsMin`/`bj2RoosendaalSblKeuzeLevelsMin`) horen echter bij een ANDERS soort eis: "Alle levels N behaald" — een ALLES-OF-NIETS-check op ÉÉN specifiek levelnummer, bedoeld voor `alleLevelsBehaald(datapunten, N)`, niet voor een `>=`-vergelijking. `alleLevelsBehaald(dp, 0)` zoekt naar niet-bestaande "Level 0"-datapunten en geeft daardoor ALTIJD `false` terug (nooit `totaal > 0`) — het cijfer `0` is dus GEEN triviaal-voldaan-sentinel voor deze velden zoals het dat wel is bij T8's velden. **T9a/T9c moeten deze velden expliciet als "0 = niet van toepassing, sla deze check over" behandelen** (niet doorgeven aan `alleLevelsBehaald`), anders worden Goes/Dordrecht-leerlingen stilzwijgend van SBL/SBC uitgesloten.

---

## ADR-18 · Eindoordeel per deelgebied overal via S/C-formule (M43) — architectuurbeslissingen Fase 0 (2026-09-23)

**Status:** Vastgelegd (Fase 0, `/office-hours`, design doc goedgekeurd: `docs/designs/m43-eindoordeel-sc-formule-overal.md`)

**Context:** alleen de matrix-rij "Eindoordeel" gebruikt de S/C-compensatieformule (`utils/aggregation.ts`); prognose BJ1/BJ2, spider chart, twee-periode-matrix en `telLeerlijnenPerFase` gebruiken "laatste niet-lege score wint" (`aggregateLatestScores` / opgeslagen `deelgebiedScores`). Daardoor spreken matrix en prognose elkaar tegen.

**Projectlead-beslissingen:**
- **D1** Formule ongewijzigd, inclusief het bewuste E-plafond (S > 2.0 zonder E → Goed, commit `2eb1805`). De spec-notitie in Obsidian is aangepast, niet de code.
- **D2** Bron = datapunten van de meest recente upload van die periode (= het StudentRecord; `addStudent` vervangt per `leerlingId + periode`). Geen cross-periode samenvoeging meer.
- **D2a** Spider chart = formule-eindoordelen van de laatste periode.
- **D3** BJ2-leerlijncriteria: formule over fase-2-datapunten + datapunten zonder fase-tag.
- **D4** Twee-periode-matrix: formule-eindoordeel per periode-record (oudste vs nieuwste).
- **D5** Niet-ingeleverd / te laat en niet beoordeeld = één O per betrokken deelgebied in S en C. **Voorwaardelijk:** T0 verifieert op echte PDF's of de betrokken deelgebieden te bepalen zijn; zo niet → D5 geparkeerd tot nieuwe projectleadbeslissing, rest van M43 gaat door.
- **D6** Deelgebied zonder beoordeling → `null`, telt nergens mee.
- **D7** Berekenen bij het lezen uit `record.datapunten`; `deelgebiedScores` wordt nog geschreven (compatibiliteit, latest-wins, backups) maar door geen enkele consument meer gelezen. Geen datamigratie.

**Architectuur (aanpak B):** één ingang `berekenEindoordelen(datapunten, { fase? })` in `utils/aggregation.ts`; alle consumenten gaan erover (tabel in design doc). `ONVOLDOENDE_INLEVER_STATUSSEN` verhuist naar `utils/scoreAggregation.ts` (laaggrens, geen circulaire import). `berekenPrognose` rekent één keer per student. Afgewezen: A (per consumer swappen: regels verspreid), C (bij laden overschrijven: datamigratie, tegen D7).

**Gevolg:** doorstroomprognoses kunnen veranderen → MINOR-bump + CHANGELOG; verplichte voor/na-snapshot op echte PDF's (alleen `leerlingId`s, niet gecommit) met verklaring per verschil.

## ADR-18a · M43 `/plan-eng-review`-beslissingen (2026-09-23)

**Status:** Vastgelegd (Fase 0 afgerond; volledige ledger in `docs/designs/m43-eindoordeel-sc-formule-overal.md` § Decision ledger)

- **R1** Rekenplek: elke engine-functie roept zelf `berekenEindoordelen(student.datapunten[, {fase}])` aan; geen signaturewijziging (vervangt "één keer rekenen en doorgeven" uit ADR-18).
- **R2** ASCII-datastroomdiagram in design doc én doc-comment van `berekenEindoordelen`.
- **R3** Helper `actieveDeelgebieden(activeIds?)` vervangt 4 inline filters in `prognosis.ts`.
- **R4** Regressiecontract: bij één beoordeling per deelgebied blijven alle bestaande BJ1/BJ2/status-verwachtingen gelijk; bedoelde wijzigingen expliciet getest; nieuwe componenttests voor `DeelgebiedenMatrix` en spider-bron.
- **R5** Opruimen oud `telLeerlijnen`/`isNegatief`-pad → TODO T-2026-09-23-01 (niet in M43).
- **R6** Hydration-fix `DeelgebiedenMatrix.tsx:232` (TODO T-2026-09-22-01) meegenomen in M43.
- Feitelijke correctie: het Roosendaal-SBL-keuzepad gebruikt fase 3 (`prognosis.ts:594`) en krijgt dezelfde formule.

## ADR-18b · M43 T0-uitkomst en vervolgbeslissingen (2026-09-23)

**Status:** Vastgelegd (Fase 2, na T0; details in `.gsd/milestones/M43-eindoordeel-sc-formule/S01-SUMMARY.md`)

**Nieuw feit (projectlead):** één export bevat nu alle fases van een leerjaar; niet meer één export per fase.

- **D5 geparkeerd.** Geen enkele van de 4 echte exports bevat een niet-ingeleverd datapunt (begin schooljaar). M43 wordt gebouwd zonder D5; niet-ingeleverd blijft zich gedragen zoals nu. D5 wordt een eigen taak zodra er een export mét zo'n datapunt is (TODO T-2026-09-23-02).
- **Verificatie T5:** formule en latest-wins zijn identiek voor de huidige exports (≤1 beoordeling per deelgebied). T5 gebruikt nu een synthetische testset op basis van deze exports met extra beoordelingen (compensatie, knock-out, E-plafond); later in het jaar hetzelfde script op echte exports met meer beoordelingen.
- **Trendpijl-sortering:** `KlasOverzicht.computeTrend` sorteert nieuwe periodestrings verkeerd ("BJ1 Fase 1 RSD ‐ 2026/2027" na "BJ2 RSD ‐ 2026/2027"). Buiten M43: aparte fix-branch (TODO T-2026-09-23-03).

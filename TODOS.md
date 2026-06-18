# TODOS

## T-2026-06-18-06 · Vaknaam-detectie leest niet door tekst-wrap heen op tweede regel

- **What:** Wanneer een vaknaam in de "Overzicht Deelgebieden"-kolomkop over twee PDF-regels wrapt (bv. "Bewegingsleer & Conditionele" / "vormen"), leest `parseDeelgebiedTable()` alleen de eerste regel. `datapunt.vak` wordt dan "Bewegingsleer & Conditionele" in plaats van "Bewegingsleer & Conditionele vormen".
- **Why:** Cosmetisch — `datapunt.vak` wordt nergens in de UI getoond (bevestigd 2026-06-18), dus dit heeft vandaag geen zichtbaar effect. Wordt relevant zodra vak-groepering ooit aan `DeelgebiedenMatrix` wordt toegevoegd.
- **Pros:** Kleine aanvulling op de net gebouwde vak-capture-logica: bij het vaststellen van een vaknaam, peek naar de volgende regel — als die geen streepje-prefix heeft, geen kolomkop is, en geen grote font heeft, is het een wrap-vervolg en moet hij worden samengevoegd.
- **Cons:** Vereist een nieuwe peek-ahead-regel; alleen de moeite waard zodra vak-groepering daadwerkelijk wordt gebouwd.
- **Context:** Gevonden tijdens het bouwen van vak-naam-detectie voor BJ2 "Fase 2 DD"-lay-out (2026-06-18), bevestigd op 2 echte PDF's.
- **Depends on / blocked by:** Wachten op besluit om vak-groepering in de UI te bouwen.

## T-2026-06-18-05 · ci.yml build-job mist TAURI_SIGNING_PRIVATE_KEY, faalt op macOS

- **What:** De multi-platform `build`-job in `ci.yml` geeft `tauri build` geen `TAURI_SIGNING_PRIVATE_KEY`/`TAURI_SIGNING_PRIVATE_KEY_PASSWORD` mee (in tegenstelling tot `release.yml`, die dit wel doet). Sinds de auto-update-milestone een updater-publieke-sleutel in `tauri.conf.json` heeft gezet, faalt elke `tauri build` zonder de bijbehorende private key met "A public key has been found, but no private key."
- **Why:** Dit bleef onopgemerkt omdat `ci.yml` nooit triggerde (verkeerde branchnaam "main" i.p.v. "master" — zie PR #1). Nu de trigger gefixt is, faalt de macOS build-job zichtbaar op elke PR.
- **Pros:** Twee env-vars toevoegen (mirror van `release.yml` regel 56-58) laat de volledige signed build ook op PR's slagen.
- **Cons:** Verbruikt de signing-key bij elke PR-run i.p.v. alleen bij een daadwerkelijke release; mogelijk bewuste keuze om dat te vermijden — projectlead moet beslissen.
- **Context:** Ontdekt tijdens het instellen van branch protection (2026-06-18, PR #1). Branch protection vereist bewust alleen de losse `test`-job (npm test), niet deze `build`-job, in afwachting van deze beslissing.
- **Depends on / blocked by:** Projectlead-besluit: secrets toevoegen aan ci.yml, of build-job uit ci.yml halen en alleen in release.yml laten draaien.

## T-2026-06-12-01 · Cross-machine back-up-herstel

- **What:** Back-ups herstelbaar maken op een andere machine dan waar ze zijn gemaakt.
- **Why:** Back-ups zijn versleuteld met de machinegebonden keychain-sleutel (`nl.cios.mentordashboard.key`, `src-tauri/src/crypto.rs:19`). Op een andere machine faalt decrypt; de fallback parseert ciphertext als plaintext-JSON en faalt met een vaag "Onbekende fout" (`utils/backup.ts:52-57`). Bij laptopwissel of defect is de back-up nu waardeloos, terwijl de UI hem aanprijst als dé manier om data veilig te stellen.
- **Pros:** Vangnet wordt machine-overstijgend; voorkomt een gegarandeerd support-incident bij de eerste laptopwissel van een mentor.
- **Cons:** Crypto-wijziging in Rust + TS (wachtwoord-afgeleide sleutel of sleutel-export-flow); raakt een gevoelig domein en vereist eigen security-review.
- **Context:** Gevonden tijdens /plan-eng-review van M36-fabrieksreset (2026-06-12, outside-voice punt 8). Voor M36 zelf is same-machine restore voldoende. Denkrichtingen: (a) export-payload versleutelen met een wachtwoord-afgeleide sleutel (PBKDF2/Argon2) i.p.v. de keychain-sleutel; (b) expliciete sleutel-export/import-flow. Minimale tussenstap: de vage foutmelding vervangen door "Deze back-up is op een andere computer gemaakt en kan hier niet worden hersteld."
- **Depends on / blocked by:** Niets; los van M36. Plan via Fase 0 (eigen ADR) wegens crypto-impact.

## T-2026-06-12-02 · DESIGN.md genereren uit bestaande tokens

- **What:** Een `.gsd/DESIGN.md` design-systeemdocument genereren op basis van de bestaande tokenset in `src/index.css:36-89`.
- **Why:** De app heeft een volwassen de-facto design system (CIOS-blauw, slate-tinten, status-kleuren, radius/shadow/transition-tokens) maar geen document dat het vastlegt. Elke UI-review en elke nieuwe feature begint nu bij "wat is onze stijl?"; CLAUDE.md Fase 3 verwacht dit document bovendien.
- **Pros:** Toekomstige design reviews kalibreren tegen een echt document; stijl drijft niet uit elkaar per feature.
- **Cons:** Documentatieklus (~20-30 min CC) zonder direct zichtbaar gebruikerseffect.
- **Context:** Vastgesteld tijdens /plan-design-review van M36 (2026-06-12, Pass 5, besluit D5-A). Route: UI UX Pro Max design-system-generator of /design-consultation, inputs: `src/index.css` tokens + KlasVerwijderenModal/SettingsPage-patronen.
- **Depends on / blocked by:** Niets; los van M36.

## T-2026-06-15-01 · Drift-banner verborgen bij mislukt opslaan

- **What:** `setUnknownLabels` wordt alleen aangeroepen binnen het `else`-blok van `saveKlassen()`, dus als opslaan mislukt verschijnt de drift-banner niet — ook al zijn er onbekende kolommen gevonden.
- **Why:** De gebruiker ziet een foutmelding over opslaan maar krijgt geen signaal dat het PDF-schema afwijkt. Bij een volgend geslaagd importmoment (zonder afwijkende kolommen) mist hij de context.
- **Pros:** Correcte scheiding tussen opslagfouten en schema-afwijkingen; drift-banner is ook bruikbaar als diagnostisch middel bij problemen.
- **Cons:** Minimale UX-impact: de situatie "opslaan mislukt én onbekende kolommen" is zeldzaam; de gebruiker kan opnieuw importeren.
- **Context:** Gevonden tijdens /review van M37 (2026-06-15, bevinding I2). Fix: verplaats `setUnknownLabels` naar buiten het `if/else`-blok, zodat het altijd wordt aangeroepen na de verwerkingslus. Locatie: `src/components/ImportPage.tsx:193`.
- **Depends on / blocked by:** Niets; triviale fix, één regel verplaatsen.

## T-2026-06-18-01 · UpdateModal-wiring gedupliceerd tussen App.tsx en SettingsPage.tsx

- **What:** `App.tsx` (opstart-check) en `SettingsPage.tsx` (handmatige check) houden elk hun eigen `Update`-state bij en mounten allebei een eigen `UpdateModal` met identieke props/wiring. Er is geen gedeelde hook/cache.
- **Why:** Een wijziging aan het update-prompt-contract (bv. "sla deze versie over", andere foutafhandeling) moet op twee plekken worden doorgevoerd; een toekomstige aanpassing kan één call site missen. Bovendien wordt er tot twee keer per sessie een netwerkcheck uitgevoerd (opstart + handmatig), zonder caching.
- **Pros:** Eén gedeelde `useUpdateCheck()`-hook zou de state, caching en `UpdateModal`-mounting centraliseren.
- **Cons:** Refactor raakt twee bestanden en hun tests; geen acuut gebruikersprobleem vandaag.
- **Context:** Gevonden tijdens /review van de auto-update-systeem-milestone (2026-06-18, angle E/F — simplificatie + efficiëntie).
- **Depends on / blocked by:** Niets; losse refactor-taak.

## T-2026-06-18-02 · updateResult/updateModalInfo: één logische uitkomst over twee state-variabelen

- **What:** `SettingsPage.tsx` houdt `updateResult` (`'uptodate' | 'error' | null`) en `updateModalInfo` (`Update | null`) los van elkaar bij, terwijl ze samen één logische uitkomst van `handleCheckUpdate()` vormen.
- **Why:** De twee states worden niet gegarandeerd synchroon gereset. Een modal sluiten zonder te installeren reset `updateModalInfo` maar niet `updateResult`; een stale fout- of "up to date"-melding van een vorige check kan zichtbaar blijven na het sluiten van de modal.
- **Pros:** Eén tri-state (`'checking' | 'uptodate' | 'error' | { update: Update } | 'idle'`) maakt de states onderling exclusief en voorkomt tegenstrijdige UI.
- **Cons:** Kleine refactor van SettingsPage's update-sectie + bijbehorende tests.
- **Context:** Gevonden tijdens /review van de auto-update-systeem-milestone (2026-06-18, angle A/E).
- **Depends on / blocked by:** Hangt samen met T-2026-06-18-01 (zelfde sectie).

## T-2026-06-18-03 · UpdateModal dupliceert modal-scaffold van KlasVerwijderenModal/FeedbackModal

- **What:** De inline overlay/card-styling (~20 regels: `position: fixed`, `inset: 0`, achtergrond, flex-center, kaart-padding/radius/shadow) staat nu letterlijk in vier componenten: `KlasVerwijderenModal`, `FeedbackModal`, `KlasModal` en `UpdateModal`.
- **Why:** Een visuele wijziging (border-radius, z-index, dark-mode-kleur) moet in alle vier bestanden worden doorgevoerd; het missen van één bestand levert een inconsistente modal op.
- **Pros:** Eén gedeelde `<ModalOverlay>`-component (met ingebouwde Escape-handler en overlay-click-afhandeling) voorkomt toekomstige drift.
- **Cons:** Raakt vier bestanden + hun tests; geen functioneel probleem vandaag (Escape-handling is inmiddels overal aanwezig, zie commit van 2026-06-18).
- **Context:** Gevonden tijdens /review van de auto-update-systeem-milestone (2026-06-18, angle Reuse).
- **Depends on / blocked by:** Niets; losse refactor-taak.

## T-2026-06-18-04 · src-tauri/Cargo.toml-versie loopt achter op de app-versie

- **What:** `src-tauri/Cargo.toml`'s `version`-veld staat op `2.6.1`, terwijl `package.json`/`tauri.conf.json` (de bron van waarheid voor de app-versie) inmiddels op `2.11.0` staan. Tot en met v2.6.1 werden alle drie de bestanden samen bijgewerkt; sindsdien is Cargo.toml gemist bij elke release.
- **Why:** Geen runtime-impact (Tauri leest de app-versie uit `tauri.conf.json`, niet uit Cargo.toml) maar wel verwarrend voor wie de Rust-crate los bekijkt en de drift verder laat groeien als het niet wordt rechtgetrokken.
- **Pros:** Eén regel aanpassen herstelt de consistentie; kan meteen mee in de volgende versie-bump.
- **Cons:** Geen.
- **Context:** Gevonden tijdens Fase 4-versiebump van de auto-update-systeem-milestone (2026-06-18); buiten scope gehouden omdat de taak alleen package.json + tauri.conf.json vroeg.
- **Depends on / blocked by:** Niets; triviale fix bij de volgende release.

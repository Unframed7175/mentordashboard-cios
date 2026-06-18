# TODOS

## T-2026-06-18-14 · Doorstroomprognose: niet-ingeleverd/te laat datapunt → twijfelgeval voor dichtstbijzijnde niveau

- **What:** Aanvulling op de doorstroomprognose-berekening (`utils/prognosis.ts`, M39 S/C-compensatieformule): wanneer een datapunt niet is ingeleverd of te laat is, wordt de leerling een "twijfelgeval" voor het niveau waar hij het dichtste bij zit in termen van haalbaarheid — dus "twijfelgeval sportbewegingsleider" (SBL) of "twijfelgeval sportbeweegcoördinator" (SBC), afhankelijk van welk niveau het dichtstbij is.
- **Why:** Niet-ingeleverde/te late datapunten worden nu meegenomen in de negatief-trigger-telling (M39: "negatief-trigger bij >4 onbeoordeelde/niet-ingeleverde datapunten"), maar er is nog geen tussenstatus "twijfelgeval" die specifiek aangeeft vóór welk niveau de onzekerheid bestaat.
- **Pros:** Geeft mentoren een concreter signaal dan een vlakke "negatief"-status — laat zien welk niveau nog haalbaar is ondanks het ontbrekende datapunt.
- **Cons:** Raakt de kern-prognoselogica (gevoelig domein, recent grondig herzien in M39 — S/C-formule, BJ1/BJ2-criteria) — vereist eigen ontwerpronde/ADR om "dichtste bij in termen van haalbaarheid" precies te definiëren (welke metriek bepaalt "dichtstbij"?) vóór implementatie.
- **Context:** Gebruikersverzoek, 2026-06-18.
- **Depends on / blocked by:** Ontwerpbesluit nodig: exacte definitie van "dichtstbijzijnde niveau" (bv. afstand in punten/percentage tot SBL- resp. SBC-drempel).

## T-2026-06-18-13 · Lichte kleurcodering van leerlijnen in DeelgebiedenMatrix (Spiderweb-kleuren)

- **What:** De 19 deelgebied-kolommen in `DeelgebiedenMatrix` lichte achtergrondkleur geven per leerlijn-groep (lesgeven/organiseren/professioneel handelen), met dezelfde kleuren als het Spiderweb-chart (`--spider-lesgeven`, `--spider-organiseren`, `--spider-prof-handelen` in `src/index.css`).
- **Why:** Op dit moment zijn de 19 kolommen visueel gelijk; de leerlijn-groepering (al aanwezig als data via `getLeerlijnenMapping()`/`utils/leerlijnen.ts`) is nergens in de matrix zichtbaar, terwijl de spider chart elders die kleurcodering al gebruikt.
- **Pros:** Hergebruikt bestaande kleurtokens en bestaande leerlijn-mapping-data — vooral CSS/rendering-werk, geen nieuwe databron nodig.
- **Cons:** Moet subtiel blijven ("lichte kleurcodering") om de matrix leesbaar te houden naast de bestaande RAG-statuskleuren per cel — vereist ontwerpafstemming (lichte tint als kolom-achtergrond vs. alleen in de kolomkop).
- **Context:** Gebruikersverzoek, 2026-06-18.
- **Depends on / blocked by:** Niets functioneel; ontwerpkeuze voor opacity/toepassing in planningsfase.

## T-2026-06-18-12 · Deelgebieden-koppen herhalen bij fase-scheidingsrij in DeelgebiedenMatrix

- **What:** Wanneer twee fases (periodes) onder elkaar staan in `DeelgebiedenMatrix` (de bestaande fase-scheidingsrij uit R-02), de volledige rij met deelgebied-kolomkoppen daar ook herhalen.
- **Why:** Bij een lange matrix met meerdere fases moet de gebruiker nu helemaal terug naar boven scrollen om te zien welke kolom bij welk deelgebied hoort.
- **Pros:** Bouwt direct op de bestaande fase-scheidingsrij-logica (R-02, al aanwezig) — voornamelijk een kwestie van de header-rij ook op dat punt opnieuw te renderen.
- **Cons:** Geen.
- **Context:** Gebruikersverzoek, 2026-06-18.
- **Depends on / blocked by:** Niets.

## T-2026-06-18-11 · Verzuim: geoorloofd/ongeoorloofd-instelling verwijderen + signaal alleen onder 85%

- **What:** De instelling om verzuimuren als geoorloofd/ongeoorloofd te splitsen verwijderen (vereenvoudiging). Het verzuim-signaal toont voortaan alleen een waarschuwing wanneer de aanwezigheid onder 85% komt.
- **Why:** De geoorloofd/ongeoorloofd-instelling levert blijkbaar geen waarde op in de praktijk; een vaste 85%-drempel voorkomt ruis bij normale, kleine afwezigheid.
- **Pros:** Vereenvoudigt de Instellingen-pagina en de verzuim-berekeningslogica.
- **Cons:** Mogelijk een breaking change voor bestaand opgeslagen instellingen/data die het geoorloofd/ongeoorloofd-onderscheid gebruiken — vóór verwijdering controleren of dit veld elders wordt gebruikt (bv. exports/rapportages); conform CLAUDE.md §12 een `BREAKING CHANGE`-migratienotitie overwegen indien van toepassing.
- **Context:** Gebruikersverzoek, 2026-06-18.
- **Depends on / blocked by:** Controleren of geoorloofd/ongeoorloofd-data elders wordt gebruikt vóór verwijdering.

## T-2026-06-18-10 · Lijstweergave als alternatief voor tegelweergave van klassen

- **What:** Naast de huidige tegelweergave (tiles) een lijstweergave-optie toevoegen voor het tonen van een klas/leerlingen.
- **Why:** Sommige gebruikers verwerken liever een compacte lijst dan tegels, vooral bij grotere klassen.
- **Pros:** Puur UI-werk (alternatieve layout-component + toggle), geen wijziging aan de onderliggende data.
- **Cons:** Vereist ontwerpwerk (welke informatie blijft zichtbaar in lijstvorm vs. tegelvorm) en een manier om de voorkeur te onthouden (instelling).
- **Context:** Gebruikersverzoek, 2026-06-18.
- **Depends on / blocked by:** Ontwerpbesluit over lijst-layout (welke kolommen/info per leerling).

## T-2026-06-18-09 · Wizard-skip optie + automatisch openen in totaalweergave bij bestaande klas

- **What:** Twee gerelateerde navigatieverbeteringen: (1) een expliciete optie om de aanmaak-wizard te verlaten/overslaan; (2) wanneer er al een klas met data in het dashboard staat, opent de app altijd direct in de totaalweergave van die klas (i.p.v. de huidige fallback naar de import-weergave).
- **Why:** De huidige flow (`App.tsx`: opent in `'import'`-view zodra er al klas-data is, anders `'onboarding'`) forceert gebruikers met bestaande data altijd langs het importscherm; gebruikers die de wizard niet willen doorlopen hebben nu geen directe uitweg.
- **Pros:** Kleine wijziging in `App.tsx`'s initiële view-bepaling; verbetert de eerste-indruk-flow voor terugkerende gebruikers.
- **Cons:** Moet bepaald worden welke klas "de" klas is bij meerdere klassen (laatst actieve? eerste?) — vereist een klein ontwerpbesluit.
- **Context:** Gebruikersverzoek, 2026-06-18.
- **Depends on / blocked by:** Ontwerpbesluit over welke klas default wordt geopend bij meerdere klassen.

## T-2026-06-18-08 · Feed Forward-tekst tonen als hover-tooltip bij datapunten

- **What:** De Feed Forward-tekst per opdracht (in de PDF aanwezig, intern al deels geparsed als `feedForward` op elk vak-opdracht via `parseVakSections` en gekoppeld aan datapunten via `enrichDatapuntenStatus`/`enrichByProximity`) zichtbaar maken in het dashboard: bij hover over een datapunt verschijnt een zwevend tooltip-blokje met de tekst.
- **Why:** Feed Forward-tekst is waardevolle, opdracht-specifieke feedback die nu verstopt blijft in de PDF — mentoren moeten teruggrijpen naar de PDF om deze te lezen.
- **Pros:** De data is voor een groot deel al beschikbaar — vooral UI-werk (tooltip-component) nodig, mogelijk geen nieuwe parser-logica.
- **Cons:** Moet gecontroleerd worden of `feedForward` voor alle datapunten al gekoppeld is of alleen voor specifieke vakken — mogelijk extra koppelwerk nodig in de parser voor volledige dekking. Tooltip moet ook bruikbaar zijn op touch-only apparaten (geen hover) — tap-to-toggle als fallback overwegen.
- **Context:** Gebruikersverzoek, 2026-06-18.
- **Depends on / blocked by:** Niets functioneel; verifiëren hoever de feedForward-koppeling nu al reikt vóór planning.

## T-2026-06-18-07 · KPI-teller in totaaloverzicht werkt niet correct + terminologie nazien

- **What:** De KPI-teller bovenaan het totaaloverzicht functioneert niet meer naar behoren. Oorzaak nog niet onderzocht. Daarnaast moet de terminologie van deze teller(s) worden herzien.
- **Why:** Mentoren kunnen niet vertrouwen op een KPI die zichtbaar fout is; onduidelijke terminologie maakt het probleem erger.
- **Pros:** N.v.t. — eerst onderzoek nodig (systematic-debugging) om een hypothese over de oorzaak te vormen vóór een fix.
- **Cons:** Scope onbekend totdat onderzocht; mogelijk een kleine rendering-bug of een dieperliggende berekeningsfout.
- **Context:** Gebruikersverzoek, 2026-06-18. Geen reproductiestappen of voorbeeld meegegeven.
- **Depends on / blocked by:** Verduidelijking nodig: welke KPI-teller precies, wat "niet naar behoren" concreet betekent, en welke terminologie gewenst is.

## T-2026-06-18-06 · Peildatum tonen voor laatste data-update

- **What:** Een peildatum tonen die aangeeft wanneer de data in het dashboard voor het laatst is bijgewerkt (laatste PDF-import).
- **Why:** Mentoren weten nu niet hoe "vers" de getoonde voortgangsdata is; bij een gemist import-moment kunnen ze onbewust op verouderde data afgaan.
- **Pros:** Verhoogt vertrouwen in de getoonde data; klein als de laatste-import-datum al ergens wordt bijgehouden.
- **Cons:** Vereist mogelijk een nieuw store-veld als de laatste-import-datum nu nergens wordt gelogd — eerst checken.
- **Context:** Gebruikersverzoek, 2026-06-18.
- **Depends on / blocked by:** Verifiëren of een laatste-import-timestamp al bestaat in de store, vóór implementatie.

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

## T-2026-06-18-03 · Andere modals achtergebleven na UpdateModal-restyle (visuele inconsistentie)

- **What:** `UpdateModal` is visueel vernieuwd (2026-06-18, commit `eba67b1`): eigen CSS-classes (`.update-modal-*`) i.p.v. inline-stijlen, design-tokens (`--radius-lg`, `--shadow-lg`), icoon, gekleurde chips, intro-animatie. `KlasVerwijderenModal`, `FeedbackModal` en `KlasModal` gebruiken nog steeds de oude inline-stijl-scaffold (`position: fixed`, hardcoded `12px`/`rgba(0,0,0,0.18)` i.p.v. tokens) — ze ogen nu merkbaar minder verzorgd naast UpdateModal.
- **Why:** Inconsistente visuele kwaliteit binnen dezelfde app; een gebruiker die UpdateModal en bv. KlasVerwijderenModal naast elkaar ziet, merkt het verschil in afwerking.
- **Pros:** UpdateModal's `.update-modal-*`-CSS-aanpak (of een gedeelde `<ModalOverlay>`/`<ModalCard>`-component erboven) kan 1-op-1 worden toegepast op de andere drie; voorkomt ook toekomstige scaffold-duplicatie (zie originele bevinding: dezelfde ~20 regels overlay/card-styling stonden letterlijk in alle vier de componenten).
- **Cons:** Raakt 3 bestanden + hun tests; puur visueel, geen functioneel probleem vandaag.
- **Context:** Bevinding tijdens /review van de auto-update-systeem-milestone (2026-06-18, angle Reuse), nu scherper na de UpdateModal-restyle in commit `eba67b1`.
- **Depends on / blocked by:** Niets; losse design-taak, kan UpdateModal's aanpak als referentie gebruiken.

## T-2026-06-18-04 · src-tauri/Cargo.toml-versie loopt achter op de app-versie

- **What:** `src-tauri/Cargo.toml`'s `version`-veld staat op `2.6.1`, terwijl `package.json`/`tauri.conf.json` (de bron van waarheid voor de app-versie) inmiddels op `2.11.0` staan. Tot en met v2.6.1 werden alle drie de bestanden samen bijgewerkt; sindsdien is Cargo.toml gemist bij elke release.
- **Why:** Geen runtime-impact (Tauri leest de app-versie uit `tauri.conf.json`, niet uit Cargo.toml) maar wel verwarrend voor wie de Rust-crate los bekijkt en de drift verder laat groeien als het niet wordt rechtgetrokken.
- **Pros:** Eén regel aanpassen herstelt de consistentie; kan meteen mee in de volgende versie-bump.
- **Cons:** Geen.
- **Context:** Gevonden tijdens Fase 4-versiebump van de auto-update-systeem-milestone (2026-06-18); buiten scope gehouden omdat de taak alleen package.json + tauri.conf.json vroeg.
- **Depends on / blocked by:** Niets; triviale fix bij de volgende release.

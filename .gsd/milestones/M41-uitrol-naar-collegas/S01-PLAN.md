# M41 — Uitrol naar collega's: zelf installeren via één link + gids
# Datum: 2026-09-14

## Doel

3–5 collega-mentoren installeren de app **zonder live hulp** via één link (de landingspagina) en importeren hun eerste klas. Distributie- en vertrouwensmilestone, geen feature-milestone. Geen OS-code-signing (ADR-14). Release als **PATCH of MINOR** afhankelijk van of D4 (in-app Help) meegaat: D4 = `feat:` → MINOR.

## Bron

- Design doc (APPROVED, eng- + design-review): `~/.gstack/projects/Unframed7175-mentordashboard-cios/rafael-master-design-20260618-213848.md`
- ADR-14 (`.gsd/DECISIONS.md`)
- Handoff Fase 0 → Fase 1 (`.gsd/STATE.md`, 2026-06-19)
- Requirement F-16 (`.gsd/REQUIREMENTS.md`)

## Stand van zaken bij start (gap-analyse 2026-09-14)

De handoff is van juni; sindsdien is een deel al gedaan. Taken hieronder zijn daarop aangepast.

| Onderdeel | Stand | Gevolg voor plan |
|---|---|---|
| Landingspagina `https://unframed7175.github.io/ciosmentorendashboard/` | Bestaat; secties "Kies de versie die past" en "Stap voor stap" met Mac-stappen (Apple chip/Intel chip, "Open toch"-route) | T2/D2/D3 = gap dichten, niet vanaf nul bouwen |
| `INSTRUCTIES.md` | Versie 2.11, `xattr -cr` al aanwezig | T3 kleiner: alleen links + verouderde "Geen automatische updates"-regel |
| `INSTRUCTIES.md` r. 29/41 | Linkt nog naar de **ruwe releases-pagina** | Strijdig met ADR-14 (één gecureerde link) → T3 |
| `INSTRUCTIES.md` r. 246 | "Geen automatische updates" | Onjuist sinds M40 → T3 |
| `src/components/HelpPage.tsx` | Geen post-install-uitleg over kleurlegenda/offline/versleuteling | D4 blijft volledig |
| Landingspagina-repo | Apart repo `Unframed7175/ciosmentorendashboard`; `index.html` wordt per release door `scripts/update-landing-page.mjs` op vaste ankers bijgewerkt | Handmatige wijzigingen mogen de ankers niet breken → T5 |

## Taken

| ID | Prio | Taak | Bestanden | Verificatie | Status |
|---|---|---|---|---|---|
| T0 | P1 | **Koude-installatie-observatie** (Rafael, vóór implementatie): één collega (niet de huidige gebruiker) installeert met alleen de link, zonder hulp. Noteer elk aarzelpunt. Beantwoordt ook: raakt het huidige ad-hoc-gesigneerde build op Apple Silicon de "beschadigd"-melding of alleen "onbekende ontwikkelaar"? | observatienotities → `S01-SUMMARY.md` | Notities vastgelegd; T2/D1-inhoud aangepast op bevindingen | ⬜ |
| T1 | P1 | **Auto-update-QA**: installeer vorige release, laat de updater naar de nieuwste gaan. Windows (NSIS, `currentUser`): verschijnt SmartScreen opnieuw? macOS: Gatekeeper-prompt opnieuw? | handmatige QA-checklist in `S01-SUMMARY.md` | Beide OS'en: geen nieuwe waarschuwing. **Zo wel → pauzeer, terug naar Fase 0** (ADR-14-aanname "eenmalige waarschuwing" vervalt) | ⬜ |
| T2 | P1 | Landingspagina = canonieke pre-install-gids volgens **Design-specificatie** (IA + OS-keuze-mechanisme): download- en installatiesectie samenvoegen, features naar erna (max. 4), OS-kies-eerst, Windows-stappen voor SmartScreen ("Meer info → Toch uitvoeren") op hetzelfde niveau als de bestaande Mac-stappen | `ciosmentorendashboard/index.html` | Handmatig op desktop + mobiel; beide OS-routes volledig zonder de ruwe releases-pagina | ⬜ |
| D1 | P1 | Geruststellingsblok **vóór** elke waarschuwingsstap — browser (stap 2) én OS (stap 3/4) — en de "beschadigd"-tak volgens **Staten #installatie**: "deze melding is normaal; de app is veilig, draait alleen op je computer, stuurt geen gegevens weg" | `ciosmentorendashboard/index.html` | Blok staat boven elke waarschuwingsstap (Windows + Mac) | ⬜ |
| D3 | P1 | Downloadknoppen in gewone taal overal consistent volgens **Microcopy** ("Download voor Windows", "Download voor Mac met Apple chip", "Download voor Mac met Intel chip"); contactadres → schooladres (7B) — geen `aarch64`/`x64` in zichtbare tekst | `ciosmentorendashboard/index.html` | Zoeken in zichtbare tekst op `aarch64`/`x64` = 0 treffers | ⬜ |
| D5 | P2 | Decoratie terugbrengen tot één bewegingsmoment (4A) + a11y landingspagina: alt-tekst op alle screenshots, OS-knoppen ≥ 44px, tekstcontrast ≥ 4.5:1 (≥ 3:1 grote tekst), bruikbare mobiele layout | `ciosmentorendashboard/index.html` | `npx @axe-core/cli <url> --tags wcag2aa` zonder blokkerende bevindingen; handmatig 400px-breedte | ⬜ |
| T3 | P2 | `INSTRUCTIES.md`: installatielinks (r. 29, 41) → landingspagina; "Geen automatische updates" (r. 246) vervangen door correcte uitleg van de in-app updater; verwijzing "landingspagina is de actuele installatiegids" | `INSTRUCTIES.md` | Geen link meer naar `releases/latest` voor installatie; grep "Geen automatische updates" = 0 | ⬜ |
| T5 | P2 | Regressietest: nieuwe/gewijzigde installatiesectie breekt de ankers van `update-landing-page.mjs` niet (versie, downloadlinks, updates-lijst, footer) | `tests/updateLandingPage.test.ts` (fixture uitbreiden met de nieuwe sectie-opbouw) | `npm test` groen; test faalt als een anker ontbreekt | ⬜ |
| D4 | P2 | In-app Help herstructureren tot naslag volgens **Decoratie & Help-structuur** (4B): inhoudsopgave, taakgerichte koppen, kleurlegenda met tekstlabels, offline/versleuteld-uitleg; géén installatie-instructies in de app | `src/components/HelpPage.tsx` + componenttest | `npm test` — secties renderen; geen installatie-tekst in HelpPage | ⬜ |
| LP-SYS | P1 | Landingspagina overzetten naar het app-design system (DESIGN.md §7, besluit 5B): tokens §3, Industry self-hosted als WOFF2 (licentie dekt web, besluit 7A), lichte hero zonder clip-path, zinsletter-koppen, Google Fonts verwijderen; `update-landing-page.mjs`-ankers intact | `ciosmentorendashboard/index.html` (+ `fonts/`) | Visuele check licht/mobiel; axe wcag2aa; `npm test` (T5) groen | ⬜ |
| T4 | P2 | Deelbare link bevestigen: landingspagina-URL opent zonder login, is kort genoeg om te mailen, en toont de nieuwste versie | — | Handmatig vanuit incognito op Windows + Mac | ⬜ |
| T6 | P3 | Stale-detectie landingspagina (TODO T-2026-06-18-17): faalnotificatie op `update-landing-page.yml` en/of datum-stempel naast de versie in de footer | `.github/workflows/update-landing-page.yml` of `scripts/update-landing-page.mjs` + test | Bij datum-stempel: `npm test` dekt de nieuwe vervanging | ⬜ |
| DT-A11Y | P1 | Design-tokens uit `.gsd/DESIGN.md` §9 doorvoeren: `--accent-strong`(-hover) toevoegen en gebruiken voor alle knoppen met witte tekst en tekstlinks (licht); `--text-muted` en `--text-faint` bijwerken (licht + donker); geen `font-size` < 12px (`0.6875rem`/`0.7rem`, o.a. `.detail-section-title`) | `src/index.css` + componenten die `background: var(--accent)` met witte tekst gebruiken | `npm test` groen; contrast-script uit DESIGN.md §9 geeft 0 ✗; handmatig licht + donker | ⬜ |
| DT-ICON | P3 | 🐛-emoji in navigatiebalk vervangen door inline SVG-icoon met `aria-label`; Help-tekst (r. 55) verwijst naar het nieuwe icoon | `src/components/` (nav) · `HelpPage.tsx` | `npm test`; knop heeft toegankelijke naam | ⬜ |
| T9 | P2 | "Wat is er nieuw" zonder ontwikkelaarstaal (6D): optionele `### Voor gebruikers`-subsectie per release in CHANGELOG.md; `update-landing-page.mjs` gebruikt die als hij bestaat, anders huidige Added/Fixed-items | `scripts/update-landing-page.mjs` · `scripts/extract-changelog-entry.mjs` · `tests/updateLandingPage.test.ts` · conventie vastleggen in `.gsd/KNOWLEDGE.md` | `npm test` — test met en zonder `Voor gebruikers`-sectie | ⬜ |
| T7 | P1 | **Pilot** (Fase 4, na release): 3–5 collega's installeren koud en importeren een eerste klas | resultaten → `M41-LEARNINGS.md` | Primair succescriterium gehaald of bevindingen terug naar Fase 2 | ⬜ |

## Volgorde & lanes

```
Vóór Fase 2 (handmatig):  T0 + T1            (T1-uitkomst kan M41 terugsturen naar Fase 0)
Fase 3 (design):          zie UI-check hieronder
Lane A (landingspagina):  LP-SYS → T2 → D1 → D3 → D5   (zelfde bestand, sequentieel; ander repo)
Lane B (deze repo):       T3, T5, T6, T9      (onafhankelijk van elkaar; T5 en T9 raken hetzelfde testbestand)
Lane C (app):             DT-A11Y → D4 → DT-ICON   (D4 na DT-A11Y: Help hergebruikt de aangepaste koppen-classes)
Fase 4:                   T4 → release → T7
```

T5 hangt af van de uiteindelijke opbouw uit Lane A (fixture moet de nieuwe sectie weerspiegelen).

## UI-check (Fase 1 DoD)

UI-taken aanwezig (T2, D1, D3, D5 op de landingspagina; D4, DT-A11Y, DT-ICON in de app) → **Fase 3 staat ingepland als verplicht tussenstation vóór Fase 2.**

Invulling Fase 3 (besluit projectlead 2026-09-14, optie A): **`.gsd/DESIGN.md` wordt nu gegenereerd** met het UI UX Pro Max-script op basis van de bestaande tokens (`index.css`), gevolgd door `/plan-design-review` en de statische a11y-check. Hiermee vervalt TODO T-2026-06-12-02 en wordt de volledige Fase 3 DoD (STACK.md §2) gevolgd — geen afwijking.

## Design-specificatie (plan-design-review 2026-09-14)

### IA — landingspagina (besluit 1A)

```
┌ HERO ─────────────────────────────────────────────┐  1e: wat is het + "werkt offline"
│ logo · kop · 1 zin · [Installeren ↓]              │      één actie → #installatie
└───────────────────────────────────────────────────┘
┌ INSTALLEREN  #installatie ────────────────────────┐  2e: de taak (download = stap 1)
│ Kies je computer: [Windows] [Mac·Apple chip] [Mac·Intel chip]
│ ── stappen van gekozen OS ──                       │
│ 1 Download  (knop)                                 │
│   ⓘ geruststelling (vóór browserwaarschuwing)      │
│ 2 Browser vraagt: behouden?  (screenshot)          │
│ 3 OS-waarschuwing  ⓘ geruststelling + screenshot   │
│ 4 Installeren / openen · 5 Klaar → eerste import   │
└───────────────────────────────────────────────────┘
┌ WAT KUN JE ERMEE (max. 4 kaarten) ────────────────┐  3e: bevestiging na keuze
┌ WEL EN NIET · WAT IS ER NIEUW · FOOTER ───────────┘
```

- `download`- en `installatie`-sectie worden **één** sectie `#installatie`; anker `#download` blijft bestaan als alias (bestaande links/mails)
- Feature-grid van 6 → max. 4 kaarten, ná installeren; trust bar gaat op in de hero-zin

### OS-keuze-mechanisme (besluit 1B)

- OS-knoppen zijn een toggle-groep (`role="group"`, knoppen met `aria-pressed`), **starten geen download**
- De echte downloadknop staat in stap 1 van het gekozen OS, met de geruststelling erboven
- Voorselectie: Windows automatisch voorgeselecteerd als `navigator.userAgent` Windows meldt; Mac **nooit** automatisch een chip kiezen (Apple chip vs Intel niet betrouwbaar detecteerbaar) — wel de twee Mac-knoppen visueel vooraan bij macOS
- Keuze wijzigen kan altijd; URL-hash `#installatie-windows` / `#installatie-mac-apple` / `#installatie-mac-intel` voor deep-links vanuit mail/Help

### Staten #installatie (besluiten 2A–2D)

| Staat | Wat de gebruiker ziet | Herstelactie |
|---|---|---|
| Geen keuze (Mac, of onbekend OS) | 3 OS-knoppen + "Kies je computer om de stappen te zien"; geen stappen | — |
| Geen JavaScript | Alle drie de routes onder elkaar met kopje per OS | — |
| Mobiel/tablet (`pointer: coarse` én breedte < 1024px) | Blok "Installeren kan alleen op een Windows-pc of Mac" + [Stuur deze link naar mezelf] (mailto met URL) + [Link kopiëren]; stappen blijven leesbaar eronder | Link naar computer sturen |
| Windows gekozen | Stappen 1 Download · 2 Browser vraagt behouden · 3 SmartScreen · 4 Installeren · 5 Klaar | — |
| Mac (Apple/Intel) gekozen | Stappen 1 Download · 2 Browser · 3 Openen/slepen · 4 Gatekeeper · 5 Klaar | — |
| Browser blokkeert download (2A) | Stap 2: geruststelling + screenshots Edge én Chrome (NL-taal): "… → Behouden / Toch behouden" | Uitleg per browser |
| Mac: "kan niet worden geopend" / onbekende ontwikkelaar | Stap 4 hoofdroute: Systeeminstellingen → **Privacy en beveiliging** → "Open toch" | — |
| Mac: "is beschadigd" (2B) | Uitklapbare tak "Zie je 'is beschadigd'?": 3 screenshots + Terminal-commando in codeblok met [Kopieer]-knop (`xattr -cr "/Applications/Mentordashboard CIOS.app"`) | T0 bepaalt welke tak standaard open staat |
| Verkeerde Mac-versie | Onder stap 4: "Werkt het niet? Misschien heb je de andere Mac-versie nodig" + wisselknop naar de andere chip | Andere versie downloaden |
| Download mislukt / geen bestand | Onder stap 1: "Geen bestand? Probeer opnieuw" + directe link naar hetzelfde bestand | Opnieuw downloaden |
| Klaar (succes) | "Open Mentordashboard. De wizard helpt je je eerste klas te importeren." — geen extra stappen | — |

### Gebruikersreis (Windows, primair)

| Stap | Collega doet | Voelt | Plan ondersteunt met |
|---|---|---|---|
| 1 | Opent mail van Rafael, klikt link | Nieuwsgierig, licht wantrouwig | Hero: CIOS-logo, "werkt offline, gegevens blijven op je computer" |
| 2 | Leest "Installeren", Windows staat voorgeselecteerd | Herkenning: "dit is voor mij" | OS-toggle, 5 genummerde stappen, "duurt ca. 2 minuten" |
| 3 | Klikt Download | Opgelucht, even onzeker | Geruststelling vóór de knop: wat er straks gebeurt |
| 4 | Browser: "wordt niet vaak gedownload" | **Schrik** (1e breukpunt) | Stap 2 + screenshot: dit was aangekondigd |
| 5 | SmartScreen: "Windows heeft uw pc beschermd" | **Twijfel** (2e breukpunt) | Geruststelling + screenshot met gemarkeerde knoppen |
| 6 | Installeert, opent app | Trots, "het is gelukt" | "Klaar" → wizard neemt het over |
| 5 min | Eerste klas geïmporteerd | Waarde gezien | Onboarding-wizard (bestaat) |
| Maanden | Update via in-app melding, geen nieuwe waarschuwing | Vertrouwen blijft | T1 bewijst dit; belofte pas daarna (3B) |

### Microcopy (besluiten 3A + 3B) — letterlijk; knopnamen verifiëren in T0

Toon: jij-vorm, korte zinnen, geen techniek, nooit "veilig" zonder reden erbij. Verboden: "blauw scherm", "virus", "hacker", "gewoon", "simpel".

- **Vóór Download (alle OS):** "Omdat dit programma niet uit een app-winkel komt, waarschuwen je browser en je computer straks één keer. Dat is normaal. De stappen hieronder laten precies zien wat je ziet en waar je klikt."
- **Stap 2 — browser (Edge):** "Edge meldt dat het bestand 'niet vaak gedownload' wordt. Klik op de drie puntjes (…) naast de melding, kies **Behouden** en daarna **Toch behouden**."
- **Stap 2 — browser (Chrome):** "Chrome meldt dat het bestand 'niet vaak gedownload' wordt. Klik op **Behouden**."
- **Stap 3 — SmartScreen, geruststelling:** "Nu toont Windows de melding 'Windows heeft uw pc beschermd'. Die zie je bij programma's die niet via de Microsoft Store komen. Mentordashboard draait alleen op jouw computer en stuurt geen gegevens weg."
- **Stap 3 — actie:** "Klik op **Meer informatie** en daarna op **Toch uitvoeren**."
- **Mac stap 4 — geruststelling:** "Je Mac meldt dat Apple het programma niet kan controleren. Dat komt doordat het niet uit de App Store komt. Mentordashboard draait alleen op jouw Mac en stuurt geen gegevens weg."
- **Mac stap 4 — actie:** "Klik op **Klaar**. Open **Systeeminstellingen → Privacy en beveiliging**, scroll naar beneden en klik op **Open toch**."
- **Mac "beschadigd"-tak:** "Zie je 'Mentordashboard CIOS is beschadigd'? Het programma is niet kapot; macOS blokkeert het strenger. Open **Terminal** (via Spotlight), plak de regel hieronder, druk op Enter en open het programma opnieuw."
- **Na eerste keer (3B):** standaard "Deze melding zie je normaal alleen bij de eerste installatie." — de zin "Daarna hoef je dit nooit meer te doen." **alleen** als T1 voor dat OS geslaagd is.
- **Downloadknoppen:** "Download voor Windows" · "Download voor Mac met Apple chip" · "Download voor Mac met Intel chip" (géén kleurverwijzing in tekst: nooit "de blauwe knop")

### Decoratie & Help-structuur (besluiten 4A + 4B)

- **Landingspagina (4A):** één bewegingsmoment — hero-app-venster fade/slide-in 400ms ease-out vanaf zichtbare begintoestand; uit bij `prefers-reduced-motion`. **Weg:** `rotateY`-tilt, `translateY(-3px)` kaart-hover, gekleurde gloeischaduwen op knoppen (`rgba(0,159,227,.4)`). Knoppen: offset-schaduw `0 1px 2px rgba(15,23,42,.12)` of geen.
- **In-app Help (4B):** naslag, geen tutorial. Eén leeskolom (max. 72ch), inhoudsopgave bovenaan met ankers, taakgerichte `h2`'s zonder "Stap N": *Een klas importeren* · *Kleuren in het overzicht* (legenda met tekstlabel per kleur) · *Werkt offline, gegevens versleuteld* · *Een update installeren* · *Een fout melden*. Geen kaart per sectie; scheiding met witruimte + `--border-light`. Geen installatie-instructies (link "Opnieuw installeren op een andere computer?" → landingspagina).

### Responsive & toegankelijkheid (besluiten 6A–6C)

**Layout #installatie per breedte (6A)**

| Breedte | OS-knoppen | Stappen | Screenshot |
|---|---|---|---|
| ≥ 1024px | Naast elkaar, gelijke breedte, ≥ 56px hoog | Linkerkolom, max. 640px | Rechts naast de bijbehorende stap (sticky binnen de stap) |
| 768–1023px | Naast elkaar | Eén kolom | Onder de stap, max. 560px |
| < 768px | Onder elkaar, volle breedte, ≥ 48px hoog | Eén kolom | Onder de stap, volle breedte; "Open op je computer"-blok (2C) staat bovenaan de sectie |

**Toetsenbord & schermlezer (6B)**
- Focusring overal `2px solid var(--border-focus)` + `2px` offset (DESIGN.md §6); huidige `.btn:focus-visible { outline: 3px solid var(--wit) }` vervalt
- OS-toggle: `role="group"` met `aria-label="Kies je computer"`; Tab naar de groep, pijltjestoetsen wisselen, `aria-pressed` op de actieve knop; bij wisselen verplaatst focus niet, stappenregio heeft `aria-live="polite"` met kop "Stappen voor Windows"
- Stappen als `<ol>`; elke waarschuwingsstap heeft kop + geruststelling vóór de afbeelding in DOM-volgorde
- "Beschadigd"-tak als `<details>/<summary>`; Terminal-regel in `<code>` met [Kopieer]-knop die "Gekopieerd" meldt via `aria-live`
- Landmarks: `<header>`, `<main>`, `<footer>`, secties met `aria-labelledby`; skip-link "Direct naar installeren"

**Screenshots (6C)**
- Echte screenshots, Nederlandse taal: Windows 11 (SmartScreen), Edge + Chrome (downloadmelding), macOS Sequoia (Gatekeeper, Privacy en beveiliging, "beschadigd", Terminal)
- Bijgesneden tot de melding; de knop waarop je klikt krijgt een `3px`-kader in `--accent-strong` met `4px` radius; geen pijlen of emoji
- `alt` = meldingstekst + actie, bv. *"Melding 'Windows heeft uw pc beschermd' met de link Meer informatie gemarkeerd"*
- Max. 560px breed, `width`/`height` gezet, WebP; klik opent volledige grootte in nieuw tabblad
- T0-observatie bepaalt of een screenshot ontbreekt of verkeerd is

### Overige besluiten (7A–7C)

- **7A Lettertype:** Industry-licentie dekt app-distributie én web (bevestigd door projectlead); geen actie
- **7B Contact:** landingspagina, `INSTRUCTIES.md` en in-app "Fout melden" gebruiken overal `ralvarezstam@cioszuidwest.nl` — het persoonlijke Gmail-adres verdwijnt van de landingspagina (onderdeel van T2/T3)
- **7C Feature-kaarten (max. 4, ná installeren):** *Klasoverzicht in één oogopslag* · *Doorstroomprognose per leerling* · *Verzuim en BPV bij elkaar* · *Werkt offline, gegevens versleuteld*. Afdrukken en fout melden gaan naar Help

### Bestaat al — hergebruiken

- Onboarding-wizard (eerste import na "Klaar") · `update-landing-page.mjs` + ankers + tests · CIOS-logo en app-screenshot in de hero · Mac-stappen "Apple chip/Intel chip"-uitleg (tekst) · `INSTRUCTIES.md`-inhoud (`xattr -cr`) als bron voor de "beschadigd"-tak · tokens in `src/index.css`

### Niet in scope (design)

- Visuele mockups: gstack designer heeft geen OpenAI-sleutel; review gedaan op tekst — `/design-review` op de live pagina na LP-SYS/T2 vervangt dit
- Video/GIF-uitleg (ADR-14) · automatische Mac-chipdetectie (onbetrouwbaar) · dark mode voor de landingspagina (licht volstaat voor een eenmalige installatie-pagina) · redesign van "Wel en niet" buiten tokenovergang

## Beslissingen (bindend, uit ADR-14 + design review)

- Geen OS-code-signing in M41 (afgewezen alternatief B); geen managed IT-uitrol als voorwaarde (C loopt parallel)
- Landingspagina = enige bron voor installatie; `INSTRUCTIES.md` linkt ernaar; in-app Help = alleen post-install
- Vertrouwen-framing: geruststelling staat vóór de waarschuwing, niet erna
- OS-kies-eerst: bezoeker ziet alleen de stappen van het gekozen OS

## Buiten scope

Code-signing (B), CIOS IT/managed deploy (C), signed-build in `ci.yml` (T-2026-06-18-05), cross-machine back-up-herstel (T-2026-06-12-01), video/GIF-gids.

## Commit-afspraken

Elke commit met prefix: `docs:` (T3), `test:` (T5), `feat:` (D4), `ci:`/`fix:` (T6), `design:`/`fix:` (DT-A11Y, DT-ICON). Wijzigingen in `ciosmentorendashboard` volgen hetzelfde prefix-schema in dat repo.

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
| T2 | P1 | Landingspagina = canonieke pre-install-gids: OS-kies-eerst (alleen stappen van gekozen OS zichtbaar), Windows-stappen voor SmartScreen ("Meer info → Toch uitvoeren") op hetzelfde niveau als de bestaande Mac-stappen | `ciosmentorendashboard/index.html` | Handmatig op desktop + mobiel; beide OS-routes volledig zonder de ruwe releases-pagina | ⬜ |
| D1 | P1 | Geruststellingsblok **vóór** elke OS-waarschuwingsscreenshot/-stap: "deze melding is normaal; de app is veilig, draait alleen op je computer, stuurt geen gegevens weg" | `ciosmentorendashboard/index.html` | Blok staat boven elke waarschuwingsstap (Windows + Mac) | ⬜ |
| D3 | P1 | Downloadknoppen in gewone taal overal consistent ("Windows", "Mac met Apple chip", "Mac met Intel chip") — geen `aarch64`/`x64` in zichtbare tekst | `ciosmentorendashboard/index.html` | Zoeken in zichtbare tekst op `aarch64`/`x64` = 0 treffers | ⬜ |
| D5 | P2 | A11y landingspagina: alt-tekst op alle screenshots, OS-knoppen ≥ 44px, tekstcontrast ≥ 4.5:1 (≥ 3:1 grote tekst), bruikbare mobiele layout | `ciosmentorendashboard/index.html` | `npx @axe-core/cli <url> --tags wcag2aa` zonder blokkerende bevindingen; handmatig 400px-breedte | ⬜ |
| T3 | P2 | `INSTRUCTIES.md`: installatielinks (r. 29, 41) → landingspagina; "Geen automatische updates" (r. 246) vervangen door correcte uitleg van de in-app updater; verwijzing "landingspagina is de actuele installatiegids" | `INSTRUCTIES.md` | Geen link meer naar `releases/latest` voor installatie; grep "Geen automatische updates" = 0 | ⬜ |
| T5 | P2 | Regressietest: nieuwe/gewijzigde installatiesectie breekt de ankers van `update-landing-page.mjs` niet (versie, downloadlinks, updates-lijst, footer) | `tests/updateLandingPage.test.ts` (fixture uitbreiden met de nieuwe sectie-opbouw) | `npm test` groen; test faalt als een anker ontbreekt | ⬜ |
| D4 | P2 | In-app Help, alléén post-install: kleurlegenda uitgelegd + geruststelling "werkt offline, gegevens versleuteld op deze computer". Hergebruik bestaande `index.css`-classes; géén installatie-instructies in de app | `src/components/HelpPage.tsx` + componenttest | `npm test` — secties renderen; geen installatie-tekst in HelpPage | ⬜ |
| T4 | P2 | Deelbare link bevestigen: landingspagina-URL opent zonder login, is kort genoeg om te mailen, en toont de nieuwste versie | — | Handmatig vanuit incognito op Windows + Mac | ⬜ |
| T6 | P3 | Stale-detectie landingspagina (TODO T-2026-06-18-17): faalnotificatie op `update-landing-page.yml` en/of datum-stempel naast de versie in de footer | `.github/workflows/update-landing-page.yml` of `scripts/update-landing-page.mjs` + test | Bij datum-stempel: `npm test` dekt de nieuwe vervanging | ⬜ |
| T7 | P1 | **Pilot** (Fase 4, na release): 3–5 collega's installeren koud en importeren een eerste klas | resultaten → `M41-LEARNINGS.md` | Primair succescriterium gehaald of bevindingen terug naar Fase 2 | ⬜ |

## Volgorde & lanes

```
Vóór Fase 2 (handmatig):  T0 + T1            (T1-uitkomst kan M41 terugsturen naar Fase 0)
Fase 3 (design):          zie UI-check hieronder
Lane A (landingspagina):  T2 → D1 → D3 → D5   (zelfde bestand, sequentieel; ander repo)
Lane B (deze repo):       T3, T5, D4, T6      (onafhankelijk van elkaar)
Fase 4:                   T4 → release → T7
```

T5 hangt af van de uiteindelijke opbouw uit Lane A (fixture moet de nieuwe sectie weerspiegelen).

## UI-check (Fase 1 DoD)

UI-taken aanwezig (T2, D1, D3, D5 op de landingspagina; D4 in de app) → **Fase 3 staat ingepland als verplicht tussenstation vóór Fase 2.**

Invulling Fase 3 (besluit projectlead 2026-09-14, optie A): **`.gsd/DESIGN.md` wordt nu gegenereerd** met het UI UX Pro Max-script op basis van de bestaande tokens (`index.css`), gevolgd door `/plan-design-review` en de statische a11y-check. Hiermee vervalt TODO T-2026-06-12-02 en wordt de volledige Fase 3 DoD (STACK.md §2) gevolgd — geen afwijking.

## Beslissingen (bindend, uit ADR-14 + design review)

- Geen OS-code-signing in M41 (afgewezen alternatief B); geen managed IT-uitrol als voorwaarde (C loopt parallel)
- Landingspagina = enige bron voor installatie; `INSTRUCTIES.md` linkt ernaar; in-app Help = alleen post-install
- Vertrouwen-framing: geruststelling staat vóór de waarschuwing, niet erna
- OS-kies-eerst: bezoeker ziet alleen de stappen van het gekozen OS

## Buiten scope

Code-signing (B), CIOS IT/managed deploy (C), signed-build in `ci.yml` (T-2026-06-18-05), cross-machine back-up-herstel (T-2026-06-12-01), video/GIF-gids.

## Commit-afspraken

Elke commit met prefix: `docs:` (T3), `test:` (T5), `feat:` (D4), `ci:`/`fix:` (T6). Wijzigingen in `ciosmentorendashboard` volgen hetzelfde prefix-schema in dat repo.

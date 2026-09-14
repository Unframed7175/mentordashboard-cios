# CLAUDE.md — Geïntegreerde stack
# Superpowers · GStack · UI UX Pro Max · GSD · Claude Mem

> Dit bestand heeft de hoogste prioriteit. Alle framework-skills, plugins en subagents
> volgen deze instructies. Bij conflict wint dit bestand altijd.

## Project — snelreferentie

- **Stack:** Tauri 2 (Rust, `src-tauri/`) + React 19 + Vite + TypeScript; tests met Vitest + jsdom
- **Commando's:** `npm run dev` (Tauri-app) · `npm run vite-dev` (alleen frontend) · `npm test` · `npm run typecheck` · `npm run build`
- **Default branch:** `master` (niet `main`)
- **Architectuur, datamodel, testpatronen, valkuilen:** `.gsd/KNOWLEDGE.md` (wordt bij sessiestart gelezen)
- **Privacy:** log nooit leerlingnamen of andere persoonsgegevens naar de console — gebruik `leerlingId`

### Bron van waarheid: `.gsd/` vs `.planning/`
- `.gsd/` is de **enige** bron voor state, beslissingen en plannen.
- `.planning/` is een **read-only archief** van eerdere GSD-tooling (t/m v2.4). Niet bijwerken, niet als actuele state lezen.
- GSD-skills (`/gsd-*`) schrijven standaard naar `.planning/`: neem de uitkomst (beslissingen, plan, status) over in de juiste `.gsd/`-bestanden vóór de fase als afgerond geldt.

---

## 0. Sessieopstart — verplichte volgorde

Bij elke nieuwe sessie of na `/compact`, voer dit uit **vóór** je iets anders doet:

1. **Controleer** skills & plugins op aanwezigheid en versie (zie §0a hieronder)
2. **Lees** `.gsd/STATE.md` → bepaal de huidige fase én, bij meerdere milestones, welke actief is (`ACTIEF`) en welke wachten (`WACHT`); werk op uitsluitend de actieve milestone verder
3. **Lees** `.gsd/DECISIONS.md` → herstel architectuurkennis
4. **Lees** `.gsd/KNOWLEDGE.md` → herstel projectregels en patronen
5. **Roep** Claude Mem aan → haal relevante sessieherinneringen op (zie sectie 3)
   - Injecteer **uitsluitend** memories waarvan het `project:`-veld overeenkomt met de naam in `.gsd/PROJECT.md`
   - Bij geen overeenkomst: lege injectie — geen fallback naar memories van een ander project
6. **Controleer** op conflicten tussen geïnjecteerde memories en GSD-bestanden:
   - Lees nogmaals de betreffende GSD-sectie als een memory afwijkt
   - Noteer de afwijking in `.gsd/KNOWLEDGE.md` onder `## Mem-conflict [datum]`
   - Ga daarna pas verder — GSD wint altijd
7. **Meld** aan de gebruiker: huidige fase, openstaande taken, last commit

---

## §0a. Skill & plugin check — verplicht bij eerste gebruik

Voer onderstaande controle uit **vóór stap 2** van de sessieopstart in elk van deze gevallen:
- **Eerste gebruik** — `.gsd/STATE.md` bestaat nog niet
- **Stack nooit geverifieerd** — `.gsd/STATE.md` bestaat maar bevat geen `## Stack-check`
- **Handmatige trigger** — de gebruiker typt `/check-stack`

In alle overige sessies (STATE.md bestaat én bevat een recente Stack-check) sla je §0a over en ga je direct naar stap 2.

### Detectie: eerste gebruik of ontbrekende stack-check
```bash
# Eerste gebruik:
[ ! -f .gsd/STATE.md ] && echo "EERSTE_GEBRUIK"

# Stack nooit geverifieerd (STATE.md bestaat maar heeft geen Stack-check):
[ -f .gsd/STATE.md ] && ! grep -q "Stack-check" .gsd/STATE.md && echo "STACK_NOOIT_GECHECKT"
```

### Stap A — Controleer aanwezigheid van elke skill/plugin

```bash
# ── GSD ──────────────────────────────────────────────────────────────────────
GSD_VERSION=$(cat ~/.claude/get-shit-done/VERSION 2>/dev/null)
[ -z "$GSD_VERSION" ] && echo "GSD: ONTBREEKT" || echo "GSD: $GSD_VERSION"

# ── GStack (skills staan als losse mappen in ~/.claude/skills/gstack/) ─────────
GSTACK_CMDS=$(ls ~/.claude/skills/gstack/ 2>/dev/null | grep -cxE "office-hours|review|ship|qa")
[ "$GSTACK_CMDS" -lt 4 ] && echo "GStack: ONTBREEKT of ONVOLLEDIG" || echo "GStack: $(cat ~/.claude/skills/gstack/VERSION 2>/dev/null)"

# ── UI UX Pro Max (project-kopie is leidend, wordt gecommit) ──────────────────
[ -f .claude/skills/ui-ux-pro-max/scripts/search.py ] && echo "UI UX Pro Max: aanwezig" || echo "UI UX Pro Max: ONTBREEKT"

# ── Claude Mem (plugin; hooks komen uit de plugin, niet uit .claude/settings.json) ─
MEM=$(ls ~/.claude/plugins/cache/thedotmack/claude-mem/ 2>/dev/null | sort -V | tail -1)
[ -z "$MEM" ] && echo "Claude Mem: ONTBREEKT" || echo "Claude Mem: $MEM"
```

> **Superpowers en Claude Mem** zijn plugins: bevestig in een actieve sessie met `/plugin list`
> (beide moeten `✔ enabled` tonen).

### Stap B — Installeer ontbrekende componenten

Voer alleen de blokken uit voor componenten die in stap A als ONTBREEKT zijn gemeld:

```bash
# GSD (ontbreekt)
npx get-shit-done-cc

# GStack (ontbreekt of onvolledig)
git clone --single-branch --depth 1 \
  https://github.com/garrytan/gstack.git \
  ~/.claude/skills/gstack

# UI UX Pro Max (ontbreekt)
npm install -g uipro-cli
uipro init --ai claude

```

> **Superpowers / Claude Mem (ontbreekt):** typ in de actieve Claude Code sessie:
> `/plugin install superpowers@claude-plugins-official` · `/plugin install claude-mem@thedotmack`

**Als een installatie faalt:**
- Schrijf de fout in `.gsd/STATE.md` onder `## Stack-fout [datum]: [componentnaam]`
- Werk tijdelijk verder zonder die component — gebruik de bypass-regels uit sectie 8
- Vraag de gebruiker aan het einde van de sessie om de installatie handmatig te controleren
- Start pas een nieuwe milestone nadat de ontbrekende component is hersteld

### Stap B2 — Werk verouderde componenten bij

Voer alleen de blokken uit voor componenten die in stap A als VEROUDERD zijn gemeld:

```bash
# GSD bijwerken (gebruik @latest om daadwerkelijk te updaten)
npx get-shit-done-cc@latest
npx get-shit-done-cc --version   # bevestig versie na update

# GStack bijwerken
git -C ~/.claude/skills/gstack pull --ff-only
# Bij fout "Not possible to fast-forward" (lokale wijzigingen aanwezig):
#   git -C ~/.claude/skills/gstack stash
#   git -C ~/.claude/skills/gstack pull --ff-only
#   git -C ~/.claude/skills/gstack stash pop
# Bij aanhoudende conflicten: fresh clone (zie Stap B)

# UI UX Pro Max bijwerken
npm update -g uipro-cli
uipro init --ai claude           # herinitialiseer na update
```

> **Superpowers / Claude Mem bijwerken:** typ in de actieve Claude Code sessie:
> `/plugin update superpowers` · `/plugin update claude-mem`

### Stap C — Versieverificatie (up-to-date check)

Na installatie of bij een bestaand project: controleer of de aanwezige versies voldoen aan de minimumvereisten uit de footer van dit bestand (`Superpowers v5+`, `GStack v1.26+`, `UI UX Pro Max v2.5+`, `GSD v1.40+`, `Claude Mem v12+`).

```bash
# GSD — versie ophalen
cat ~/.claude/get-shit-done/VERSION
# Verwacht: 1.40 of hoger

# GStack — versie ophalen
cat ~/.claude/skills/gstack/VERSION
# Verwacht: 1.26 of hoger

# UI UX Pro Max — versie ophalen
uipro --version 2>/dev/null
# Verwacht: 2.5 of hoger

# Claude Mem — versie = mapnaam van de plugin-cache
ls ~/.claude/plugins/cache/thedotmack/claude-mem/ | sort -V | tail -1
# Verwacht: 12 of hoger
```

### Uitkomst rapporteren

Meld de uitkomst aan de gebruiker in dit formaat vóór je verdergaat met de sessieopstart:

```
Stack-status:
  GSD          v1.4x  ✓ / ✗ ontbreekt / ✗ verouderd (gevonden: vX.Y)
  GStack             ✓ / ✗ ontbreekt / ✗ verouderd
  Superpowers        ✓ bevestig via /plugin list / ✗ controleer handmatig
  UI UX Pro Max v2.x ✓ / ✗ ontbreekt / ✗ verouderd (gevonden: vX.Y)
  Claude Mem   v12.x ✓ / ✗ ontbreekt / ✗ verouderd (gevonden: vX.Y)
```

Als alle componenten aanwezig en up-to-date zijn: ga direct verder naar stap 2 van sectie 0.
Als er componenten ontbreken of verouderd zijn: **pauzeer de sessieopstart** en herstel eerst de stack voordat je verdergaat. Schrijf een melding in `.gsd/STATE.md` onder `## Stack-check [datum]`.

---

Als `.gsd/STATE.md` niet bestaat → bevind je je in **Fase 0: Ontdekking**.
Maak de `.gsd/` map aan en start met GStack `/office-hours`.

**Als de SessionStart hook faalt of Claude Mem niet reageert:**
→ Log een waarschuwing in `.gsd/STATE.md` onder `## Mem-fout [datum]`  
→ Ga verder zonder geheugeninjectie — gebruik alleen GSD-bestanden als context  
→ Vraag de gebruiker aan het einde van de sessie om de plugin te controleren via `/plugin list` (zie §0a)

---

## 1. De vijf lagen — wie doet wat

```
┌─────────────────────────────────────────────────────────┐
│  LAAG 1  GStack          Beslissing & rolverdeling      │
│  LAAG 2  GSD             Context & spec stabiliteit     │
│  LAAG 3  Superpowers     Executie & TDD                 │
│  LAAG 4  UI UX Pro Max   Design intelligence            │
│  LAAG 5  Claude Mem      Persistente memory             │
└─────────────────────────────────────────────────────────┘
```

**Gouden regel:** elke laag heeft zijn eigen fase.
Geen twee frameworks spawnen tegelijkertijd subagents.

---

## 2. Faserouter — welk framework neemt de leiding

> **Noot over nummering:** de fases zijn genummerd naar eigenaar en prioriteit, niet naar uitvoeringsvolgorde. De uitvoeringsvolgorde is: **Fase 0 → Fase 1 → Fase 3 → Fase 2 → Fase 4**. Fase 5 is altijd beschikbaar als foutherstelpad.

### Fase 0 · Ontdekking
**Eigenaar:** GStack  
**Trigger:** nieuw project, nieuwe feature, onduidelijke richting  
**Actie:**
- Start met `/office-hours` — CEO-modus, daag de aannames uit
- Voer daarna `/plan-ceo-review` uit voor product-scope validatie
- Voer `/plan-eng-review` uit voor architectuurvalidatie
- Voer `/plan-design-review` uit als UI betrokken is

**GSD:** alleen lezen, nog geen subagents  
**Superpowers:** uitgeschakeld — geen brainstorm-gates starten  
**UI UX Pro Max:** uitgeschakeld  
**Blokkeer code:** geen regel code totdat fase 0 is afgesloten met `.gsd/DECISIONS.md`

**✓ Definition of Done — Fase 0 is klaar als:**
- `.gsd/DECISIONS.md` bestaat en minimaal één architectuurkeuze bevat onder `## Architectuur`
- `/plan-eng-review` is afgerond en akkoord gegeven
- Als er UI betrokken is: `/plan-design-review` is afgerond en akkoord gegeven
- Handoff-bericht is geschreven in `.gsd/STATE.md` (zie sectie 5)

---

### Fase 1 · Spec & context
**Eigenaar:** GSD  
**Trigger:** `.gsd/DECISIONS.md` bestaat en Fase 0 DoD is afgevinkt  
**Actie:**
- GSD schrijft `.gsd/PROJECT.md`, `.gsd/REQUIREMENTS.md`, `.gsd/DECISIONS.md`
- GSD maakt milestone-map aan: `.gsd/milestones/M001-*/`
- GSD schrijft `.gsd/STATE.md` na elke voltooide milestone
- GSD maakt `.gsd/ROADMAP.md` aan bij de eerste milestone en voegt elke nieuwe milestone toe als rij: `| M001 | [naam] | [status] | [verwachte datum] |`

**UI-check (verplicht aan het einde van Fase 1):**  
Bevat `S01-PLAN.md` een UI-taak? Dan geldt:
- Plan **Fase 3 in als verplicht tussenstation vóór Fase 2** — `.gsd/DESIGN.md` wordt aangemaakt in Fase 3, niet hier
- Fase 3 is geen optionele trigger maar een harde voorwaarde voor Fase 2-start

**Superpowers:** uitgeschakeld — wacht op voltooide spec  
**GStack:** advisory — mag reviewen maar start geen `/plan-*` opnieuw  
**Claude Mem:** slaat de spec-beslissingen op als geheugen voor volgende sessies

**Conflictregel GSD ↔ Superpowers:**  
GSD beheert welke taken klaar zijn voor executie. Zodra een milestone-slice gereed
is in `S01-PLAN.md`, geeft GSD het stokje over aan Superpowers.
GSD spawnt **geen eigen executie-subagents** zodra Superpowers actief is.

**✓ Definition of Done — Fase 1 is klaar als:**
- `.gsd/PROJECT.md`, `.gsd/REQUIREMENTS.md` bestaan en zijn ingevuld
- Minimaal één milestone-map `.gsd/milestones/M001-*/` bestaat
- `S01-PLAN.md` bestaat in die milestone-map met concrete taken
- UI-check is uitgevoerd: als er UI-taken zijn, staat **Fase 3 ingepland als verplicht tussenstation vóór Fase 2** — `.gsd/DESIGN.md` hoeft hier nog niet te bestaan, maar wordt aangemaakt in Fase 3
- Handoff-bericht is geschreven in `.gsd/STATE.md`

---

### Fase 3 · Design & UI
**Eigenaar:** UI UX Pro Max  
**Trigger:** `S01-PLAN.md` bevat een UI-taak én Fase 1 DoD is afgevinkt — **vóór** Fase 2 start  
**Actie:**
- Genereer eerst het design system:
  ```bash
  python3 .claude/skills/ui-ux-pro-max/scripts/search.py \
    "[productnaam en context]" --design-system -p "[Projectnaam]"
  ```
- Het output-design system wordt opgeslagen als `.gsd/DESIGN.md`
- GStack `/plan-design-review` valideert het design system vóór implementatie

> **Positie in de keten:** Fase 1 → **Fase 3** → Fase 2. Fase 3 is geen zwevende trigger
> maar een verplicht checkpoint als er UI in het plan zit.

**Stack:** geef altijd de stack mee (Next.js, React, etc.) of laat het defaulten naar HTML + Tailwind  
**Anti-patterns:** UI UX Pro Max voert automatisch pre-delivery checks uit — respecteer de bevindingen  
**GStack design ↔ UI UX Pro Max:**  
GStack maakt systeem-niveau design (typografie, kleurpalet, merkidentiteit → `.gsd/DESIGN.md`).
UI UX Pro Max werkt op component-niveau (implementatie, stijlkeuzes per scherm).

> **Scope-afbakening (voorkomt dubbel werk):**
>
> | Check | Eigenaar | Scope | Blokkerend |
> |---|---|---|---|
> | `/plan-design-review` | GStack | Systeem-niveau: typografie, kleurpalet, merkidentiteit, consistentie met `.gsd/DECISIONS.md` | Ja — vóór implementatie |
> | Pre-delivery checks | UI UX Pro Max | Component-niveau: implementatiecorrectheid, stijlkeuzes per scherm, anti-patterns, a11y | Ja — vóór handoff naar Fase 2 |
>
> Bij conflict: GStack wint op merkidentiteit en systeem-niveau; UI UX Pro Max wint op component-implementatie. Beide checks zijn verplicht en sequentieel: GStack eerst, UI UX Pro Max daarna.

**✓ Definition of Done — Fase 3 is klaar als:**
- `.gsd/DESIGN.md` bestaat en is gevuld door het search-script
- `/plan-design-review` is afgerond en akkoord gegeven door GStack
- Pre-delivery checks van UI UX Pro Max geven geen blokkerende bevindingen
- **Statische a11y-check geslaagd** op het design system (nog geen draaiende app vereist):
  - Kleurcontrast alle tekst/achtergrond combinaties ≥ 4.5:1 (WCAG AA normaal) of ≥ 3:1 (WCAG AA groot)
  - Typografie-groottes ≥ 16px voor bodytekst
  - Controleer met `npx color-contrast-checker` of manueel via [webaim.org/resources/contrastchecker](https://webaim.org/resources/contrastchecker)
  - Bij afwijking: herstel in `.gsd/DESIGN.md` vóór handoff naar Fase 2
- Handoff-bericht is geschreven in `.gsd/STATE.md`

---

### Fase 2 · Executie
**Eigenaar:** Superpowers  
**Trigger:** `S01-PLAN.md` bestaat, Fase 1 DoD is afgevinkt én — als er UI-taken zijn — Fase 3 DoD is afgevinkt  
**Actie:**
- Superpowers leest `S01-PLAN.md` en verifieert dat het bestand compleet is vóór start
- Volgorde: **RED** (schrijf falende test) → **GREEN** (minimale code) → **REFACTOR**
- Superpowers mag hier subagents spawnen via `subagent-driven-development`
- Elke subagent krijgt een verse context — max één slice per subagent
- Na elke taak: `verification-before-completion` + `requesting-code-review`

> **Scope-afbakening reviews (voorkomt dubbel werk):**
> 
> | Review | Eigenaar | Wanneer | Scope |
> |---|---|---|---|
> | `requesting-code-review` | Superpowers | Na elke taak | Taak-niveau: test slaagt, geen regressies, implementatie correct |
> | `/review` | GStack | Na voltooide slice | Slice-niveau: architectuur, naamgeving, patronen, DECISIONS.md-conformiteit |
> 
> Bij conflicterende bevindingen: GStack wint op architectuurniveau, Superpowers wint op implementatieniveau. Beide reviews zijn verplicht — ze vervangen elkaar niet.

**GSD tijdens executie:**  
- **Leest** `S01-SUMMARY.md` om voortgang te bewaken en `.gsd/STATE.md` bij te werken
- **Schrijft niet** naar `S01-SUMMARY.md` — dat is Superpowers-eigendom
- Start **geen** eigen orchestrators of parallelle waves
- Bewaakt contextgebruik — zie sectie 6 voor checkpoints

**Superpowers tijdens executie:**
- Schrijft taakresultaten naar `S01-SUMMARY.md` na elke voltooide taak (locatie: `.gsd/milestones/M001-*/S01-SUMMARY.md`)
- Meldt voltooiing van een slice aan GSD zodat GSD `.gsd/STATE.md` kan bijwerken

**Superpowers interactieve gates:**  
Als Superpowers een Q&A-gate opent (brainstorm-vraag), beantwoord dan direct.
GSD onderbreekt deze flow niet. Wacht tot de gate gesloten is.

**GStack tijdens executie:**  
- `/review` mag na voltooide slice — maar pas nadat Superpowers klaar is
- Geen nieuwe planning-skills tijdens actieve executie

**✓ Definition of Done — Fase 2 is klaar als:**
- Alle taken in `S01-PLAN.md` zijn afgevinkt in `S01-SUMMARY.md`
- Alle tests slagen (`npm test` / equivalent geeft geen rode output)
- `verification-before-completion` is uitgevoerd en akkoord
- Handoff-bericht is geschreven in `.gsd/STATE.md` door **GSD** (Superpowers meldt voltooiing aan GSD, GSD schrijft het handoff-bericht — Superpowers heeft geen schrijfrechten op STATE.md)

**⚠ Foutherstel Fase 2 — als een subagent of taak mislukt:**
1. Schrijf de fout naar `.gsd/milestones/M001-*/S01-SUMMARY.md` onder `## Fout [datum]: [taaknaam]`
2. Bepaal oorzaak: is het een scope-probleem (→ terug naar GSD, Fase 1) of een implementatieprobleem (→ nieuwe subagent, zelfde slice)?
3. Start **nooit** een nieuwe subagent zonder de fout eerst gedocumenteerd te hebben
4. Bij meer dan twee mislukte pogingen op dezelfde taak: pauzeer en vraag de gebruiker om input

---

### Fase 4 · Review & ship
**Eigenaar:** GStack  
**Trigger:** Fase 2 DoD afgevinkt en tests groen  
**Actie:**
- `/review` — code review door Staff Engineer persona
- `/qa` — browser-test via Playwright (persistent Chromium process)
- **Security scan** — verplicht vóór `/ship`:
  ```bash
  # Node-projecten:
  npm audit --audit-level=high
  # Python-projecten:
  pip-audit
  ```
  Bij hoge of kritieke kwetsbaarheden: blokkeer `/ship`, terug naar Fase 2 voor fix. Schrijf bevinding in `.gsd/STATE.md` onder `## Security-blokkade [datum]`.
- **Changelog-validatie** — verplicht vóór `/ship`: controleer of de CHANGELOG-entry het formaat `[versie] — [datum] — [beschrijving]` heeft en niet leeg is. Als de entry ontbreekt of leeg is: blokkeer `/ship` tot de entry is aangevuld.
- `/ship` — merge, CHANGELOG, VERSION bump, PR aanmaken
- `/retro` — wekelijkse terugblik op patronen en verbeterpunten; uitkomsten worden geschreven naar `.gsd/KNOWLEDGE.md` onder `## Retro [datum]` en, als een structurele aanpassing van de workflow nodig is, als voorstel voor een nieuwe CLAUDE.md-versie aangeboden aan de projectlead
- `/document-release` — update README, ARCHITECTURE, CONTRIBUTING
- **CI-verificatie** — controleer na PR-aanmaak of de CI-pipeline groen is:
  - Als `/ci-setup` beschikbaar is in de geïnstalleerde GStack-versie: voer het uit
  - Anders: noteer in `.gsd/STATE.md` onder `## CI-status [datum]` of de pipeline slaagt
  - Minimumvereiste (zie sectie 7): repo heeft een CI-check op `npm test` of equivalent bij elke PR

**Superpowers:** uitgeschakeld na `/ship`  
**GSD:** schrijft `.gsd/milestones/M001-*/M001-LEARNINGS.md` na voltooide milestone

**✓ Definition of Done — Fase 4 is klaar als:**
- `/review` geeft geen blokkerende opmerkingen
- `/qa` geeft geen falende browser-tests
- **Dynamische a11y-check geslaagd** op de gebouwde applicatie (vereist draaiende URL):
  ```bash
  npx @axe-core/cli [url] --tags wcag2aa
  ```
  Bij blokkerende bevindingen (contrast, ARIA, focus-volgorde): terug naar Fase 2 voor fix. Blokkerende bevindingen zijn geen optie — ze blokkeren `/ship`.
- Security scan geeft geen hoge of kritieke kwetsbaarheden
- **Performance-baseline gemeten** (aanbevolen, geen harde blokkade):
  ```bash
  npx lighthouse [url] \
    --only-categories=performance \
    --output=json \
    --output-path=./lighthouse-report.json \
    --chrome-flags="--headless"
  # Score uitlezen:
  node -e "const r=require('./lighthouse-report.json'); \
    console.log('Score:', r.categories.performance.score * 100)"
  ```
  Score ≥ 80: doorgaan. Score < 80: vastleggen als technische schuld in `.gsd/milestones/M001-*/M001-LEARNINGS.md` en opnemen in volgende milestone — geen blokkade voor huidige `/ship`.
- PR is aangemaakt en CHANGELOG is bijgewerkt (entry niet leeg en in het formaat `[versie] — [datum] — [beschrijving]`)
- `.gsd/milestones/M001-*/M001-LEARNINGS.md` is geschreven door GSD
- Schrijf in `.gsd/STATE.md` onder `## Milestone afgerond [datum]`: versienummer en naam van de milestone
- Zet de milestone-status in `.gsd/STATE.md` op `DONE`
- Start daarna pas een nieuwe milestone — terug naar Fase 0 voor de volgende feature

---

### Fase 5 · Foutherstel (altijd beschikbaar)
**Eigenaar:** GStack (coördineert), GSD (documenteert)  
**Trigger:** vastgelopen fase, crashende subagent, ontbrekend bestand, meer dan twee mislukte pogingen

**Escalatiepad:**
```
Probleem gedetecteerd
  ↓
Schrijf naar .gsd/STATE.md: ## Blokkade [datum]: [omschrijving]
  ↓
Bepaal terugkeerzone:
  • Ontbrekende spec of gewijzigde scope  → terug naar Fase 1
  • Implementatiefout, tests falen        → terug naar Fase 2 (nieuwe subagent)
  • Design klopt niet                     → terug naar Fase 3
  • Review blokkeert                      → terug naar Fase 2 (fix)
  ↓
Schrijf handoff in .gsd/STATE.md met reden van terugkeer
  ↓
Informeer gebruiker vóór herstart
```

**Parallelle features (meerdere features tegelijk in development):**
- Elke feature krijgt een eigen milestone-map: `M001-feature-a/`, `M002-feature-b/`
- Slechts één milestone is tegelijk actief in Fase 2 — de rest staat op `WACHT`
- Volgorde wordt bepaald in `.gsd/STATE.md` onder `## Prioriteitsvolgorde`
- GStack `/office-hours` bepaalt bij conflict welke feature prioriteit krijgt

**Wanneer handmatige interventie vereist is:**
- Meer dan twee foutherstelcycli op dezelfde taak
- `.gsd/STATE.md` ontbreekt en kan niet worden hersteld
- Tegenstrijdige instructies tussen `.gsd/DECISIONS.md` en een subagent-uitkomst

---

## 3. Memory — Claude Mem integratie

Claude Mem draait als **achtergrondhook** tijdens alle fases en injecteert context bij sessiestart.

### Geheugenformaat
Elke memory heeft de volgende structuur:
```
type:       [beslissing | patroon | bug | workaround | les]
fase:       [0 | 1 | 2 | 3 | 4]
project:    [exacte naam uit .gsd/PROJECT.md — verplicht veld]
onderwerp:  [korte omschrijving, max 10 woorden]
inhoud:     [de feitelijke herinnering, max 3 zinnen]
datum:      [YYYY-MM-DD]
```

> Het `project:`-veld is verplicht. Een memory zonder dit veld wordt niet opgeslagen
> en niet geïnjecteerd.

### Injectiemaximum
- De SessionStart hook injecteert maximaal **800 tokens** aan memories
- Selectiecriterium: alleen memories waarvan `project:` overeenkomt met de naam in `.gsd/PROJECT.md`
- Volgorde: meest recente memories van het huidige project eerst, daarna op type `beslissing`
- Bij meer dan 800 tokens: oudste memories worden weggelaten, niet afgekapt
- Bij geen overeenkomst: lege injectie — geen fallback naar memories van andere projecten

### Conflictresolutie tussen Claude Mem en GSD
Als een Claude Mem memory tegenstrijdig is met een GSD-bestand:
→ Lees de betreffende GSD-sectie nogmaals en noteer de afwijking expliciet  
→ Het GSD-bestand wint altijd — GSD bevat de laatste bekrachtigde staat  
→ Schrijf de tegenstrijdigheid als notitie in `.gsd/KNOWLEDGE.md` onder `## Mem-conflict [datum]` voor review

### Wat Claude Mem vastlegt
- **Context en motivatie** van architectuurbeslissingen uit fase 0: waarom is een keuze gemaakt, welke alternatieven zijn afgewezen en waarom. *Niet* de keuze zelf — die staat in `.gsd/DECISIONS.md`.
- TDD-keuzes en testpatronen uit fase 2
- Design-keuzes en afgewezen alternatieven uit fase 3
- Bugs, workarounds en overdraagbare lessen (generiek toepasbaar buiten dit project — zie onderscheid met `.gsd/milestones/M001-*/M001-LEARNINGS.md` hieronder)

> **Onderscheid Claude Mem ↔ DECISIONS.md:**  
> `.gsd/DECISIONS.md` legt vast **wat** is besloten (de keuze zelf).  
> Claude Mem legt vast **waarom** (motivatie, context, afgewezen alternatieven).  
> Ze zijn complementair. Als een Claude Mem memory een andere keuze suggereert dan DECISIONS.md: dat is altijd een Mem-conflict — DECISIONS.md wint.

> **Onderscheid Claude Mem type `les` ↔ `M001-LEARNINGS.md`:**  
> `.gsd/milestones/M001-*/M001-LEARNINGS.md` (GSD) = projectgebonden lessen: wat werkte niet, wat moet anders in de volgende milestone. Scope: dit project, deze milestone.  
> Claude Mem type `les` = overdraagbare patronen: wat is generiek toepasbaar op andere projecten. Scope: cross-project.  
> Claude Mem slaat dus alleen op wat de grens van dit project overstijgt.

### Wat GSD vastlegt (aparte verantwoordelijkheid)
- Projectspec en requirements → `.gsd/PROJECT.md`, `.gsd/REQUIREMENTS.md`
- Architectuurkeuzen → `.gsd/DECISIONS.md` (append-only)
- Projectregels → `.gsd/KNOWLEDGE.md`
- Voortgang → `.gsd/STATE.md`, `.gsd/ROADMAP.md`

### Overlap vermijden
GSD slaat op **wat te bouwen** (spec, plan, staat).  
Claude Mem slaat op **wat gedaan en geleerd is** (beslissingen, patronen, context).  
Ze schrijven naar verschillende locaties en conflicteren niet.

### Sessieherstel
Bij sessiestart:
1. Lees GSD-bestanden (STATE.md, DECISIONS.md, KNOWLEDGE.md) — stap 2–4 van sectie 0
2. Claude Mem injecteert relevante herinneringen (alleen huidig project uit `.gsd/PROJECT.md` — zie injectiemaximum)
3. Controleer op conflicten: lees betreffende GSD-sectie opnieuw bij afwijking, noteer in `.gsd/KNOWLEDGE.md`
4. GSD wint altijd bij conflict
5. Als de hook faalt: zie fallback in sectie 0

---

## 4. Subagent-conflictregel (kritiek)

```
REGEL: Nooit twee frameworks tegelijkertijd subagents laten spawnen.

Superpowers subagents: ALLEEN actief tijdens Fase 2 (executie)
GSD orchestrators:     ALLEEN actief tijdens Fase 1 (spec)
GStack subagents:      GEEN — GStack gebruikt slash commands, geen subagents
UI UX Pro Max:         GEEN subagents — activeert inline als skill
Claude Mem:            GEEN subagents — hooks, geen agents
```

Als Superpowers een interactieve Q&A-gate opent terwijl GSD actief is:
→ Pauzeer GSD. Beantwoord de gate. Hervat GSD daarna.

Als GSD een nieuwe orchestrator wil starten terwijl Superpowers een subagent runt:
→ Wacht tot de Superpowers-taak + review voltooid zijn. Dan pas GSD verder.

---

## 5. Communicatie tussen frameworks

De frameworks communiceren via bestanden, niet via directe aanroepen.

### Schrijfrechten per framework

| Bestand / map | Schrijft | Leest | Mag niet schrijven |
|---|---|---|---|
| `.gsd/DECISIONS.md ## Architectuur` | GStack (fase 0) | Superpowers, Claude Mem, GSD | UI UX Pro Max |
| `.gsd/DECISIONS.md ## Spec-verfijning` | GSD (fase 1+) | Superpowers, Claude Mem, GStack | UI UX Pro Max |
| `.gsd/milestones/*/S01-PLAN.md` | GSD | Superpowers | GStack, UI UX Pro Max |
| `.gsd/milestones/*/S01-SUMMARY.md` | Superpowers | GSD | GStack, UI UX Pro Max |
| `docs/superpowers/specs/` | Superpowers | GSD | Overige frameworks |
| `.gsd/DESIGN.md` | UI UX Pro Max | GStack | GSD, Superpowers |
| `~/.claude-mem/` | Claude Mem | Claude Mem (injectie) | Alle andere frameworks |
| `.gsd/STATE.md` | GSD, GStack (handoff) | Alle frameworks | Superpowers (alleen-lezen) |
| `.gsd/KNOWLEDGE.md` | GSD | Alle frameworks | Superpowers |

**Conflictregel DECISIONS.md:** GStack schrijft uitsluitend naar `## Architectuur`, GSD schrijft
uitsluitend naar `## Spec-verfijning`. Bij inhoudelijk conflict in dezelfde sectie: GStack wint
in Fase 0, GSD wint in Fase 1 en later. Noteer conflicten altijd in `.gsd/KNOWLEDGE.md`.

Elk framework schrijft uitsluitend naar zijn eigen sectie/kolom. Race conditions zijn niet mogelijk
zolang slechts één framework per fase actief is (zie sectie 4).

### Bestandsoverdracht

```
GStack beslissingen    →  .gsd/DECISIONS.md ## Architectuur   (GSD leest dit)
GSD spec-verfijning    →  .gsd/DECISIONS.md ## Spec-verfijning
GSD slice-plan         →  .gsd/milestones/*/                  (Superpowers leest dit)
Superpowers spec       →  docs/superpowers/specs/             (GSD bewaart context)
UI UX Pro Max output   →  .gsd/DESIGN.md                      (GStack reviewt dit)
Claude Mem memories    →  ~/.claude-mem/                       (SessionStart injectie)
```

Na elke fase-overgang: schrijf een kort handoff-bericht in `.gsd/STATE.md`:
```
## Handoff [datum]
Van: [Framework A] — Fase [X]
Naar: [Framework B] — Fase [Y]
Status: [wat is klaar]
Openstaand: [wat de volgende fase moet weten]
DoD afgevinkt: [ja / nee — welke punten ontbreken]
```

---

## 6. Token- en contextbudget

```
Orchestrator (GSD hoofdsessie):   vaste checkpoints (zie hieronder)
Superpowers subagent per taak:    vers contextvenster, max 1 slice
GStack slash commands:            laden on-demand, geen permanente overhead
UI UX Pro Max skill:              laadt bij UI-keywords, daarna weer weg
Claude Mem SessionStart injectie: max 800 tokens, alleen huidig project
```

### Contextcheckpoints — wanneer STATE.md bijwerken en /compact overwegen

Voer een contextcheckpoint uit op elk van deze momenten:

1. **Na elke voltooide milestone-slice** — altijd, zonder uitzondering
2. **Na het inladen van meer dan 2 grote bestanden in één sessie** — groot = meer dan 200 regels of meer dan 5 KB
3. **Na 12 uitwisselingen in dezelfde sessie**
4. **Na het spawnen van 3 of meer Superpowers-subagents**

Bij een checkpoint:
1. Laat GSD `.gsd/STATE.md` bijwerken met huidige voortgang
2. Overweeg `/compact` — verplicht bij checkpoint 3 of 4
3. De SessionStart hook herstelt GSD-state en Claude Mem context automatisch na `/compact`
4. Als `/compact` niet beschikbaar is: start een nieuwe sessie — `.gsd/STATE.md` garandeert continuïteit

> De "40%-contextgrens" uit eerdere versies is vervangen door deze concrete checkpoints.
> Een tokenteller is niet beschikbaar — stuur op gedrag, niet op percentages.

---

## 7. Projectconventies

### Code
- Tests schrijven **vóór** implementatiecode (Superpowers TDD-wet)
- Geen code die niet direct een falende test laat slagen
- Commits: atomair, één doel per commit (GSD commit-discipline)

### Bestanden
```
.gsd/                          GSD state en spec (niet handmatig aanpassen)
.gsd/STATE.md                  Huidige fase, actieve milestone, handoffs
.gsd/DECISIONS.md              Architectuur- en spec-keuzen (append-only)
.gsd/KNOWLEDGE.md              Projectregels, patronen, retro-notities
.gsd/ROADMAP.md                Milestone-overzicht met status en datum
.gsd/DESIGN.md                 Design system (gegenereerd door UI UX Pro Max)
.gsd/milestones/M001-*/        Milestone-map met S01-PLAN.md, S01-SUMMARY.md en M001-LEARNINGS.md
docs/superpowers/              Superpowers specs en plannen
.claude/skills/                Geïnstalleerde skills (Superpowers, UI UX Pro Max)
CLAUDE.md                      Dit bestand — hoogste prioriteit
```

> **Versiebeheer:** `.gsd/` wordt **volledig gecommit** en bijgehouden in de repo — het is projectgeheugen, geen build-output. Voeg `.gsd/` nooit toe aan `.gitignore`. `.env` en `node_modules/` wél.

### Naamgeving
- Branches: `feature/[naam]`, `fix/[naam]`, `design/[naam]`, `chore/[naam]`, `docs/[naam]`
- Commits: `feat:`, `fix:`, `perf:`, `refactor:`, `test:`, `design:`, `docs:`, `chore:`, `ci:` (zie §12 voor wat in de CHANGELOG komt)
- GSD milestones: `M001-[naam]`, slices: `S01`, taken: `T01`

### CI/CD
- Elke repo die wordt geshipt heeft minimaal één CI-check: `npm test` of equivalent bij elke PR
- Aanbevolen minimale GitHub Actions workflow voor **Node-projecten** (`.github/workflows/ci.yml`):
  ```yaml
  on: [pull_request]
  jobs:
    test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - run: npm ci && npm test
  ```
- Aanbevolen minimale GitHub Actions workflow voor **Python-projecten** (`.github/workflows/ci.yml`):
  ```yaml
  on: [pull_request]
  jobs:
    test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-python@v5
          with:
            python-version: '3.12'
        - run: pip install -r requirements.txt && pytest
  ```
- Superpowers genereert de passende workflow in Fase 2 op basis van de projectstack, tenzij expliciet uitgesloten in `.gsd/DECISIONS.md`
- **Branch protection op `master` (verplicht vóór eerste `/ship`):** merge alleen via PR + CI moet groen zijn. Zonder branch protection kan de volledige Fase 4 gate worden omzeild door direct naar `master` te pushen.
- **Review-eis:** minimaal 1 review vóór merge.
  - **Solo-project (enige collaborator = PR-auteur):** een GStack `/review` zonder blokkerende bevindingen telt als die review. Noteer de uitkomst als PR-comment (`/review: geen blokkerende bevindingen`) vóór merge.
  - **Zodra er een tweede collaborator is:** menselijke approval vereist; zet dan `required_approving_review_count` op 1 in de branch protection.
- `.env.example` is **verplicht** in de repo; GSD maakt dit aan in Fase 1 bij elke nieuwe dependency die een secret vereist
- `.env` staat altijd in `.gitignore` — Superpowers-subagents mogen `.env` nooit committen
- Secrets worden **nooit hardcoded**; Superpowers krijgt bij elke subagent-instructie expliciet mee: gebruik altijd `process.env.VAR` of equivalent
- Bij een nieuwe dependency die een secret vereist: GSD voegt de variabele toe aan `.env.example` vóór Superpowers de implementatie start
- Ontbrekende `.env`-variabelen bij start van Fase 2: blokkade — los op vóór executie

---

## 8. Wanneer welk framework te negeren

Gebruik onderstaande **objectieve drempelwaarden** — niet het gevoel van "dit is klein".

| Situatie | Objectief criterium | Negeer |
|---|---|---|
| Kleine bugfix | ≤2 bestanden geraakt, geen nieuwe tests nodig, fix past in één commit | Superpowers brainstorm-gates, GSD fase-overhead |
| Snel prototype / spike | Wegwerpcode, wordt niet gemerged, geen tests vereist | GStack planning-reviews, GSD milestone-structuur |
| Pure UI-taak zonder logica | Geen functies, geen state, alleen markup/stijl | Superpowers TDD (geen testbare logica) |
| Architectuurwijziging | Raakt ≥3 bestanden of introduceert een nieuwe dependency | Sla fase 0 **nooit** over — altijd GStack eerst |
| Korte sessie | Doel is uitgeschreven in één zin, geen afhankelijkheden van andere taken | Claude Mem sessie-injectie is optioneel |

**Verplicht bij toepassing van deze tabel:**  
Schrijf vóór je begint één zin in `.gsd/STATE.md` die uitlegt waarom dit geval in de tabel past:
```
## Afwijking [datum]: [situatie uit tabel]
Reden: [één zin]
```
Zo is de afwijking gedocumenteerd en zichtbaar bij de retrospective.

**Bij twijfel of een situatie in de tabel past: sla deze tabel over en start in Fase 0.**  
Het kost 5 minuten en voorkomt uren herstelwerk.

---

## 9. Snelreferentie — commando's per fase

```bash
# FASE 0 — Beslissing (GStack)
/office-hours           Idee challengen, CEO-modus
/plan-ceo-review        Product scope valideren
/plan-eng-review        Architectuur vergrendelen
/plan-design-review     Design richting bepalen

# FASE 1 — Spec (GSD)
/gsd-progress           Status bekijken
/gsd-new-milestone      Nieuwe milestone starten
/gsd-discuss-phase      Fase bespreken
/gsd-plan-phase         Fase plannen
# Let op: /gsd-* schrijft naar .planning/ — neem uitkomst over in .gsd/ (zie snelreferentie)

# FASE 3 — Design (UI UX Pro Max) — vóór Fase 2 als er UI-taken zijn
python3 .claude/skills/ui-ux-pro-max/scripts/search.py \
  "[context]" --design-system -p "[naam]"

# FASE 2 — Executie (Superpowers)
# (automatisch — Superpowers activeert op basis van GSD-plan)
# Handmatig starten indien nodig:
# "use superpowers:subagent-driven-development"

# FASE 4 — Review & ship (GStack)
/review                 Code review
/qa                     Browser QA
/ship                   Releasen
/retro                  Terugblik
/document-release       Docs bijwerken

# FASE 5 — Foutherstel
# Geen commando — volg het escalatiepad in sectie 2 (Fase 5)
# Schrijf altijd eerst naar .gsd/STATE.md vóór je iets herstart
```

---

## 10–11. Installatie & governance

- Installatie, updates en verificatie van de stack: zie §0a (enige bron).
- Eigenaar, SemVer, git-workflow en changelog van dit bestand: `docs/CLAUDE-MD-GOVERNANCE.md`.
  Lees dat document alleen wanneer CLAUDE.md zelf wordt aangepast. Geen enkel framework schrijft naar CLAUDE.md.

---

## 12. Project patchnotes

Deze sectie beschrijft hoe patchnotes van de projectsoftware worden opgebouwd, bijgehouden en gepubliceerd. Dit is los van de CLAUDE.md-changelog in `docs/CLAUDE-MD-GOVERNANCE.md` — die gaat over dit bestand; sectie 12 gaat over de software die gebouwd wordt.

---

### Versioning — SemVer voor het project

Het project volgt [Semantic Versioning 2.0.0](https://semver.org): `MAJOR.MINOR.PATCH`

| Type | Wanneer | Wie bepaalt |
|---|---|---|
| `PATCH` | Alleen bugfixes, geen nieuwe functionaliteit | GStack `/ship` op basis van commits |
| `MINOR` | Nieuwe functionaliteit, backwards compatible | GStack `/ship` op basis van commits |
| `MAJOR` | Breaking change in API, gedrag of interface | Projectlead bevestigt handmatig vóór `/ship` |

> **MAJOR bumps worden nooit automatisch bepaald.** GStack `/ship` signaleert wanneer een `BREAKING CHANGE:` commit aanwezig is en vraagt de projectlead om bevestiging vóór de versie wordt verhoogd.

---

### CHANGELOG.md — formaat en eigenaarschap

**Locatie:** projectroot — `CHANGELOG.md`  
**Gegenereerd door:** GStack `/ship`, op basis van Conventional Commit messages  
**Formaat:** [Keep a Changelog](https://keepachangelog.com) — gegroepeerd per type:

```markdown
## [1.2.0] — 2026-06-11

### Added
- Gebruiker kan nu inloggen via OAuth

### Changed
- Laadtijd dashboardpagina verlaagd met 40%

### Fixed
- Crashbug bij leeg zoekveld opgelost

### Removed
- Verouderd `/api/v1/legacy` endpoint verwijderd

### Breaking
- `POST /api/users` vereist nu verplicht `email`-veld
  > ⚠ Bestaande clients zonder `email` krijgen HTTP 422. Migratie vereist.
```

---

### Koppeling GSD-taken → patchnote

Superpowers schrijft elke commit tijdens Fase 2 met een Conventional Commit prefix. GStack `/ship` groepeert die commits automatisch in de CHANGELOG-secties:

| Commit-type | CHANGELOG-sectie |
|---|---|
| `feat:` | Added |
| `fix:` | Fixed |
| `refactor:` | Changed (alleen als gedragswijziging zichtbaar is) |
| `perf:` | Changed |
| `feat!:` / `fix!:` | Breaking |
| `test:`, `chore:`, `ci:` | **Niet opgenomen** — interne wijzigingen |
| `docs:` | **Niet opgenomen** — tenzij gebruikersgerichte docs |

> **Taken zonder commit-type prefix blokkeren `/ship`.** Superpowers krijgt bij elke taak-instructie expliciet mee: elke commit begint met een geldig type. Ontbrekende prefixes worden door GStack `/ship` gemeld als pre-ship fout.

---

### Wat niet in de patchnote staat

De volgende wijzigingen gaan naar `M001-LEARNINGS.md`, niet naar `CHANGELOG.md`:

- Interne refactors zonder zichtbare gedragswijziging (`refactor:` zonder impact voor gebruiker)
- Testwijzigingen (`test:`)
- `.gsd/`-updates
- CI/CD-configuratiewijzigingen (`ci:`)
- Tijdelijke workarounds die in dezelfde milestone worden opgelost

---

### Handmatige correctie

Als GStack `/ship` een CHANGELOG-entry incorrect genereert (verkeerde sectie, onvolledige beschrijving), corrigeert de projectlead `CHANGELOG.md` handmatig vóór merge. De changelog-validatie uit Fase 4 DoD blijft van toepassing: entry mag niet leeg zijn en moet het formaat `## [versie] — [datum]` volgen.

---

### Retro → patchnote keten

`/retro` genereert twee typen uitkomsten met elk een eigen bestemming:

```
/retro levert bevinding op
  ↓
  ├─ Projectverbetering (code, architectuur, proces)
  │    ↓
  │    Schrijf naar .gsd/KNOWLEDGE.md onder ## Retro [datum]
  │    ↓
  │    Projectlead besluit: opnemen in volgende milestone?
  │    ├─ Ja → GSD maakt taak aan in volgende S01-PLAN.md (feat: of fix:)
  │    │        → Verschijnt automatisch in CHANGELOG bij /ship
  │    └─ Nee → Blijft in KNOWLEDGE.md als gedocumenteerde afweging
  │
  └─ Workflow-verbetering (CLAUDE.md aanpassen)
       ↓
       Projectlead beoordeelt: fix, feat, of breaking change?
       ↓
       Branch: docs/claude-md-[type]-[onderwerp]
       ↓
       Wijziging + changelog-entry in docs/CLAUDE-MD-GOVERNANCE.md
       ↓
       PR → review → merge → SemVer bump CLAUDE.md
       ↓
       Bij breaking change: migration notice in .gsd/STATE.md
```

Een retro-bevinding die niet wordt opgepakt verdwijnt niet — ze blijft in `.gsd/KNOWLEDGE.md` totdat de projectlead een expliciete beslissing neemt (opnemen of bewust afwijzen).

---

*Versie: 1.10.0 — gegenereerd op basis van Superpowers v5+, GStack v1.26+,
UI UX Pro Max v2.5+, GSD v1.40+, Claude Mem v12+*

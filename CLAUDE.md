# CLAUDE.md — Geïntegreerde stack
# Superpowers · GStack · UI UX Pro Max · GSD · Claude Mem

> Dit bestand heeft de hoogste prioriteit. Alle framework-skills, plugins en subagents
> volgen deze instructies. Bij conflict wint dit bestand altijd.

---

## 0. Sessieopstart — verplichte volgorde

Bij elke nieuwe sessie of na `/compact`, voer dit uit **vóór** je iets anders doet:

1. **Lees** `.gsd/STATE.md` → bepaal de huidige fase
2. **Lees** `.gsd/DECISIONS.md` → herstel architectuurkennis
3. **Lees** `.gsd/KNOWLEDGE.md` → herstel projectregels en patronen
4. **Roep** Claude Mem aan → haal relevante sessieherinneringen op (zie sectie 3)
5. **Meld** aan de gebruiker: huidige fase, openstaande taken, last commit

Als `.gsd/STATE.md` niet bestaat → bevind je je in **Fase 0: Ontdekking**.
Maak de `.gsd/` map aan en start met GStack `/office-hours`.

**Als de SessionStart hook faalt of Claude Mem niet reageert:**
→ Log een waarschuwing in `STATE.md` onder `## Mem-fout [datum]`  
→ Ga verder zonder geheugeninjectie — gebruik alleen GSD-bestanden als context  
→ Vraag de gebruiker aan het einde van de sessie om de hook te controleren via sectie 10

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
**Blokkeer code:** geen regel code totdat fase 0 is afgesloten met `DECISIONS.md`

**✓ Definition of Done — Fase 0 is klaar als:**
- `.gsd/DECISIONS.md` bestaat en minimaal één architectuurkeuze bevat
- `/plan-eng-review` is afgerond en akkoord gegeven
- Handoff-bericht is geschreven in `STATE.md` (zie sectie 5)

---

### Fase 1 · Spec & context
**Eigenaar:** GSD  
**Trigger:** `.gsd/DECISIONS.md` bestaat en Fase 0 DoD is afgevinkt  
**Actie:**
- GSD schrijft `.gsd/PROJECT.md`, `.gsd/REQUIREMENTS.md`, `.gsd/DECISIONS.md`
- GSD maakt milestone-map aan: `.gsd/milestones/M001-*/`
- GSD beheert context-isolatie: houd orchestrator onder 40% contextgebruik
- GSD schrijft `STATE.md` na elke voltooide milestone

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
- Handoff-bericht is geschreven in `STATE.md`

---

### Fase 2 · Executie
**Eigenaar:** Superpowers  
**Trigger:** `S01-PLAN.md` bestaat en Fase 1 DoD is afgevinkt  
**Actie:**
- Superpowers leest `S01-PLAN.md` en verifieert dat het bestand compleet is vóór start
- Volgorde: **RED** (schrijf falende test) → **GREEN** (minimale code) → **REFACTOR**
- Superpowers mag hier subagents spawnen via `subagent-driven-development`
- Elke subagent krijgt een verse context — max één slice per subagent
- Na elke taak: `verification-before-completion` + `requesting-code-review`

**GSD tijdens executie:**  
- Schrijft voortgang naar `S01-SUMMARY.md` na elke voltooide taak
- Start **geen** eigen orchestrators of parallelle waves
- Bewaakt contextgebruik — waarschuw als orchestrator >40% bereikt

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
- Handoff-bericht is geschreven in `STATE.md`

**⚠ Foutherstel Fase 2 — als een subagent of taak mislukt:**
1. Schrijf de fout naar `S01-SUMMARY.md` onder `## Fout [datum]: [taaknaam]`
2. Bepaal oorzaak: is het een scope-probleem (→ terug naar GSD, Fase 1) of een implementatieprobleem (→ nieuwe subagent, zelfde slice)?
3. Start **nooit** een nieuwe subagent zonder de fout eerst gedocumenteerd te hebben
4. Bij meer dan twee mislukte pogingen op dezelfde taak: pauzeer en vraag de gebruiker om input

---

### Fase 3 · Design & UI
**Eigenaar:** UI UX Pro Max  
**Trigger:** een UI-taak staat in de Superpowers-takenlijst  
**Actie:**
- Genereer eerst het design system:
  ```bash
  python3 .claude/skills/ui-ux-pro-max/scripts/search.py \
    "[productnaam en context]" --design-system -p "[Projectnaam]"
  ```
- Het output-design system wordt opgeslagen als `.gsd/DESIGN.md`
- GStack `/plan-design-review` valideert het design system vóór implementatie
- UI UX Pro Max activeert automatisch bij UI-keywords — geen handmatige aanroep nodig

**Stack:** geef altijd de stack mee (Next.js, React, etc.) of laat het defaulten naar HTML + Tailwind  
**Anti-patterns:** UI UX Pro Max voert automatisch pre-delivery checks uit — respecteer de bevindingen  
**GStack design ↔ UI UX Pro Max:**  
GStack maakt systeem-niveau design (typografie, kleurpalet, merkidentiteit → `DESIGN.md`).
UI UX Pro Max werkt op component-niveau (implementatie, stijlkeuzes per scherm).
Ze overlappen niet — GStack eerst, UI UX Pro Max daarna.

**✓ Definition of Done — Fase 3 is klaar als:**
- `.gsd/DESIGN.md` bestaat en is gevuld door het search-script
- `/plan-design-review` is afgerond en akkoord gegeven door GStack
- Pre-delivery checks van UI UX Pro Max geven geen blokkerende bevindingen
- Handoff-bericht is geschreven in `STATE.md`

---

### Fase 4 · Review & ship
**Eigenaar:** GStack  
**Trigger:** Fase 2 DoD afgevinkt en tests groen  
**Actie:**
- `/review` — code review door Staff Engineer persona
- `/qa` — browser-test via Playwright (persistent Chromium process)
- `/ship` — merge, CHANGELOG, VERSION bump, PR aanmaken
- `/retro` — wekelijkse terugblik op patronen en verbeterpunten
- `/document-release` — update README, ARCHITECTURE, CONTRIBUTING

**Superpowers:** uitgeschakeld na `/ship`  
**GSD:** schrijft `M001-LEARNINGS.md` na voltooide milestone

**✓ Definition of Done — Fase 4 is klaar als:**
- `/review` geeft geen blokkerende opmerkingen
- `/qa` geeft geen falende browser-tests
- PR is aangemaakt en CHANGELOG is bijgewerkt
- `M001-LEARNINGS.md` is geschreven door GSD

---

### Fase 5 · Foutherstel (altijd beschikbaar)
**Eigenaar:** GStack (coördineert), GSD (documenteert)  
**Trigger:** vastgelopen fase, crashende subagent, ontbrekend bestand, meer dan twee mislukte pogingen

**Escalatiepad:**
```
Probleem gedetecteerd
  ↓
Schrijf naar STATE.md: ## Blokkade [datum]: [omschrijving]
  ↓
Bepaal terugkeerzone:
  • Ontbrekende spec of gewijzigde scope  → terug naar Fase 1
  • Implementatiefout, tests falen        → terug naar Fase 2 (nieuwe subagent)
  • Design klopt niet                     → terug naar Fase 3
  • Review blokkeert                      → terug naar Fase 2 (fix)
  ↓
Schrijf handoff in STATE.md met reden van terugkeer
  ↓
Informeer gebruiker vóór herstart
```

**Parallelle features (meerdere features tegelijk in development):**
- Elke feature krijgt een eigen milestone-map: `M001-feature-a/`, `M002-feature-b/`
- Slechts één milestone is tegelijk actief in Fase 2 — de rest staat op `WACHT`
- Volgorde wordt bepaald in `STATE.md` onder `## Prioriteitsvolgorde`
- GStack `/office-hours` bepaalt bij conflict welke feature prioriteit krijgt

**Wanneer handmatige interventie vereist is:**
- Meer dan twee foutherstelcycli op dezelfde taak
- `STATE.md` ontbreekt en kan niet worden hersteld
- Tegenstrijdige instructies tussen `DECISIONS.md` en een subagent-uitkomst

---

## 3. Memory — Claude Mem integratie

Claude Mem draait als **achtergrondhook** tijdens alle fases en injecteert context bij sessiestart.

### Geheugenformaat
Elke memory heeft de volgende structuur:
```
type:       [beslissing | patroon | bug | workaround | les]
fase:       [0 | 1 | 2 | 3 | 4]
onderwerp:  [korte omschrijving, max 10 woorden]
inhoud:     [de feitelijke herinnering, max 3 zinnen]
datum:      [YYYY-MM-DD]
```

### Injectiemaximum
- De SessionStart hook injecteert maximaal **800 tokens** aan memories
- Selectiecriterium: meest recente memories van het huidige project eerst, daarna op type `beslissing`
- Bij meer dan 800 tokens: oudste memories worden weggelaten, niet afgekapt

### Conflictresolutie tussen Claude Mem en GSD
Als een Claude Mem memory tegenstrijdig is met een GSD-bestand:
→ Het GSD-bestand wint altijd — GSD bevat de laatste bekrachtigde staat  
→ Schrijf de tegenstrijdigheid als notitie in `KNOWLEDGE.md` voor review

### Wat Claude Mem vastlegt
- Architectuurbeslissingen genomen in fase 0
- TDD-keuzes en testpatronen uit fase 2
- Design-keuzes en afgewezen alternatieven uit fase 3
- Bugs, workarounds en geleerde lessen

### Wat GSD vastlegt (aparte verantwoordelijkheid)
- Projectspec en requirements → `PROJECT.md`, `REQUIREMENTS.md`
- Architectuurkeuzen → `DECISIONS.md` (append-only)
- Projectregels → `KNOWLEDGE.md`
- Voortgang → `STATE.md`, `ROADMAP.md`

### Overlap vermijden
GSD slaat op **wat te bouwen** (spec, plan, staat).  
Claude Mem slaat op **wat gedaan en geleerd is** (beslissingen, patronen, context).  
Ze schrijven naar verschillende locaties en conflicteren niet.

### Sessieherstel
Bij sessiestart:
1. Claude Mem injecteert relevante herinneringen automatisch (SessionStart hook)
2. GSD levert de huidige `STATE.md`
3. Bij conflicten wint GSD — zie conflictresolutie hierboven
4. Als de hook faalt: zie fallback in sectie 0

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
| `.gsd/DECISIONS.md` | GStack (fase 0), GSD (fase 1) | Superpowers, Claude Mem | UI UX Pro Max |
| `.gsd/milestones/*/` | GSD | Superpowers | GStack, UI UX Pro Max |
| `docs/superpowers/specs/` | Superpowers | GSD | Overige frameworks |
| `.gsd/DESIGN.md` | UI UX Pro Max | GStack | GSD, Superpowers |
| `~/.claude-mem/` | Claude Mem | Claude Mem (injectie) | Alle andere frameworks |
| `.gsd/STATE.md` | GSD, GStack (handoff) | Alle frameworks | Superpowers (alleen-lezen) |
| `.gsd/KNOWLEDGE.md` | GSD | Alle frameworks | Superpowers |

Elk framework schrijft uitsluitend naar zijn eigen kolom. Race conditions zijn niet mogelijk zolang slechts één framework per fase actief is (zie sectie 4).

### Bestandsoverdracht

```
GStack beslissingen    →  .gsd/DECISIONS.md       (GSD leest dit)
GSD slice-plan         →  .gsd/milestones/*/       (Superpowers leest dit)
Superpowers spec       →  docs/superpowers/specs/  (GSD bewaart context)
UI UX Pro Max output   →  .gsd/DESIGN.md           (GStack reviewt dit)
Claude Mem memories    →  ~/.claude-mem/            (SessionStart injectie)
```

Na elke fase-overgang: schrijf een kort handoff-bericht in `STATE.md`:
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
Orchestrator (GSD hoofdsessie):   max 40% van contextvenster
Superpowers subagent per taak:    vers contextvenster, max 1 slice
GStack slash commands:            laden on-demand, geen permanente overhead
UI UX Pro Max skill:              laadt bij UI-keywords, daarna weer weg
Claude Mem SessionStart injectie: max 800 tokens samenvattingsindex
```

### Hoe contextgebruik meten
Claude heeft geen directe toegang tot een tokenteller. Gebruik deze indicatoren:
- Als de totale conversatiehistory meer dan ~15 berichten bevat → waarschijnlijk >40%
- Als GSD meerdere grote bestanden heeft ingeladen in één sessie → waarschuwing
- Als Superpowers meer dan 3 subagents heeft gespawnd → /compact overwegen

### Actie bij overschrijding (>50%)
1. Laat GSD `STATE.md` bijwerken met huidige voortgang
2. Voer `/compact` uit
3. De SessionStart hook herstelt GSD-state en Claude Mem context automatisch
4. Als `/compact` niet beschikbaar is: start een nieuwe sessie — STATE.md garandeert continuïteit

---

## 7. Projectconventies

### Code
- Tests schrijven **vóór** implementatiecode (Superpowers TDD-wet)
- Geen code die niet direct een falende test laat slagen
- Commits: atomair, één doel per commit (GSD commit-discipline)

### Bestanden
```
.gsd/               GSD state en spec (niet handmatig aanpassen)
docs/superpowers/   Superpowers specs en plannen
.claude/skills/     Geïnstalleerde skills (Superpowers, UI UX Pro Max)
.gsd/DESIGN.md      Design system (gegenereerd door UI UX Pro Max)
CLAUDE.md           Dit bestand — hoogste prioriteit
```

### Naamgeving
- Branches: `feature/[naam]`, `fix/[naam]`, `design/[naam]`
- Commits: `feat:`, `fix:`, `test:`, `design:`, `docs:`
- GSD milestones: `M001-[naam]`, slices: `S01`, taken: `T01`

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
npx get-shit-done-cc    GSD initialiseren
/gsd                    Status bekijken
/gsd discuss            Fase bespreken
/gsd plan               Milestone plannen

# FASE 2 — Executie (Superpowers)
# (automatisch — Superpowers activeert op basis van GSD-plan)
# Handmatig starten indien nodig:
# "use superpowers:subagent-driven-development"

# FASE 3 — Design (UI UX Pro Max)
python3 .claude/skills/ui-ux-pro-max/scripts/search.py \
  "[context]" --design-system -p "[naam]"
# (ook automatisch bij UI-keywords)

# FASE 4 — Review & ship (GStack)
/review                 Code review
/qa                     Browser QA
/ship                   Releasen
/retro                  Terugblik
/document-release       Docs bijwerken

# FASE 5 — Foutherstel
# Geen commando — volg het escalatiepad in sectie 2 (Fase 5)
# Schrijf altijd eerst naar STATE.md vóór je iets herstart
```

---

## 10. Installatieverificatie

Controleer bij eerste gebruik of alle tools aanwezig zijn:

```bash
# Superpowers
/plugin list | grep superpowers

# GStack
ls .claude/commands/ | grep -E "office-hours|review|ship|qa"

# UI UX Pro Max
ls .claude/skills/ | grep ui-ux-pro-max
python3 .claude/skills/ui-ux-pro-max/scripts/search.py --help

# GSD
npx get-shit-done-cc --version

# Claude Mem
# Controleer of de SessionStart hook actief is:
cat .claude/settings.json | grep SessionStart
# Verwachte output: "SessionStart": "claude-mem inject"
# Bij lege output: hook is niet geconfigureerd — zie docs/stack-setup.md
```

Als een tool ontbreekt, zie de installatiegids in `docs/stack-setup.md`.

---

## 11. Governance van dit bestand

CLAUDE.md heeft de hoogste prioriteit in het project, maar heeft zelf ook een eigenaar en updateprocedure.

**Eigenaar:** de projectlead (persoon, niet een framework)  
**Locatie:** altijd in de projectroot, nooit in een submap  
**Bewerkingsrechten:** alleen handmatig door de eigenaar — geen enkel framework schrijft naar dit bestand

### Updateprocedure
1. Maak een branch aan: `docs/claude-md-[onderwerp]`
2. Pas het bestand aan
3. Noteer de wijziging in de changelog hieronder
4. Laat reviewen door minimaal één andere teamlid
5. Merge naar main

### Changelog

| Datum | Versie | Auteur | Wijziging |
|---|---|---|---|
| *(invullen bij eerste gebruik)* | 1.0 | *(naam)* | Initiële versie gegenereerd |
| *(invullen)* | 1.1 | *(naam)* | Suggesties geïmplementeerd: DoD per fase, Fase 5 foutherstel, objectieve drempelwaarden sectie 8, Claude Mem API-contract, schrijfrechten sectie 5, governance sectie 11 |

---

*Versie: 1.1 — gegenereerd op basis van Superpowers v5+, GStack v1.26+,
UI UX Pro Max v2.5+, GSD v1.40+, Claude Mem v12+*

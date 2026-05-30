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
4. **Roep** Claude Mem aan → haal relevante sessieherinneringen op
5. **Meld** aan de gebruiker: huidige fase, openstaande taken, last commit

Als `.gsd/STATE.md` niet bestaat → bevind je je in **Fase 0: Ontdekking**.
Maak de `.gsd/` map aan en start met GStack `/office-hours`.

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

---

### Fase 1 · Spec & context
**Eigenaar:** GSD  
**Trigger:** beslissingen zijn vastgelegd, bouwen kan beginnen  
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

---

### Fase 2 · Executie
**Eigenaar:** Superpowers  
**Trigger:** GSD heeft `S01-PLAN.md` klaar, slice is scoped en beperkt  
**Actie:**
- Superpowers leest het GSD-plan en start de TDD-cyclus
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

---

### Fase 4 · Review & ship
**Eigenaar:** GStack  
**Trigger:** executie-slice is voltooid, tests zijn groen  
**Actie:**
- `/review` — code review door Staff Engineer persona
- `/qa` — browser-test via Playwright (persistent Chromium process)
- `/ship` — merge, CHANGELOG, VERSION bump, PR aanmaken
- `/retro` — wekelijkse terugblik op patronen en verbeterpunten
- `/document-release` — update README, ARCHITECTURE, CONTRIBUTING

**Superpowers:** uitgeschakeld na `/ship`  
**GSD:** schrijft `M001-LEARNINGS.md` na voltooide milestone

---

## 3. Memory — Claude Mem integratie

Claude Mem draait **passief op de achtergrond** tijdens alle fases.

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
2. GSD levert de huidige STATE.md
3. Samen geven ze volledige continuïteit — je hoeft niets opnieuw uit te leggen

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

De frameworks communiceren via bestanden, niet via directe aanroepen:

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

Als je voelt dat de context vol raakt (>50%):
1. Laat GSD `STATE.md` bijwerken
2. Voer `/compact` uit
3. De SessionStart hook herstelt GSD-state en Claude Mem context automatisch

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

| Situatie | Negeer |
|---|---|
| Kleine bugfix (<10 regels) | Superpowers brainstorm-gates, GSD fase-overhead |
| Snel prototype / spike | GStack planning-reviews, GSD milestone-structuur |
| Pure UI-taak zonder logica | Superpowers TDD (geen testbare logica) |
| Architectuurwijziging | Sla fase 0 niet over — altijd GStack eerst |
| Sessie <30 min, helder doel | Claude Mem sessie-injectie is optioneel |

Bij twijfel: **start altijd in Fase 0 met GStack `/office-hours`**.
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
```

Als een tool ontbreekt, zie de installatiegids in `docs/stack-setup.md`.

---

*Laatste update: gegenereerd op basis van Superpowers v5+, GStack v1.26+,
UI UX Pro Max v2.5+, GSD v1.40+, Claude Mem v12+*

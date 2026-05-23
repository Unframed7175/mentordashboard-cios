# Phase 26: Tegel Score-telling & Fase-vergelijking — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-22
**Phase:** 26-tegel-score-telling-fase-vergelijking
**Areas discussed:** Tile layout, Trend-pijl stijl, Grijs fase-1 edge case, Trend vergelijkingsbasis

---

## Tile layout

| Option | Description | Selected |
|--------|-------------|----------|
| Eigen rij onder badge | Badge op z'n eigen rij, score-telling op een nieuwe rij eronder | ✓ |
| Inline rechts van badge | Badge links, score-telling klein rechts ernaast op dezelfde rij | |
| Jij beslist | Claude kiest op basis van bestaande tile-breedte | |

**Pijl positie:**

| Option | Description | Selected |
|--------|-------------|----------|
| Zelfde rij als score-telling | '↑ 14/19 ≥V · 1 O' — pijl links van de score op dezelfde rij | ✓ |
| Eigen rij boven score-telling | Pijl op aparte rij boven score | |
| Rechts van naam bovenaan | Pijl rechts uitelijnd in eerste rij | |

**User's choice:** Score-telling op eigen rij onder badge; pijl op dezelfde rij als score-telling (links van score).
**Notes:** Resulterende volgorde: naam → badge → [pijl + score] → verzuim-bar.

---

## Trend-pijl stijl

**Kleur:**

| Option | Description | Selected |
|--------|-------------|----------|
| Gekleurd — groen ↑ / rood ↓ | Pijl omhoog groen, pijl omlaag rood — past bij RAG-logica | ✓ |
| Neutraal grijs | Pijl altijd in --text-muted kleur | |
| Zelfde kleur als badge | Pijl neemt tegel-accentkleur over | |

**Karakter:**

| Option | Description | Selected |
|--------|-------------|----------|
| Unicode ↑ ↓ | Simpele Unicode-tekens, werkt altijd in Industry font | |
| CSS-pijl via border-trick | Pure CSS driehoekje — meer controle over grootte | ✓ |
| SVG inline icon | Kleine inline SVG pijl — scherpst op alle schermresoluties | |

**Grootte:**

| Option | Description | Selected |
|--------|-------------|----------|
| Zelfde grootte als score-tekst | Pijl en score op gelijke visuele hoogte — één compacte rij | ✓ |
| Iets groter ~1.2× font-size | Pijl iets prominenter | |
| Jij beslist | Claude kiest proportioneel op basis van badge-grootte | |

**User's choice:** CSS border-trick, groen/rood, zelfde grootte als score-tekst.

---

## Grijs fase-1 edge case

| Option | Description | Selected |
|--------|-------------|----------|
| Geen pijl — niet vergelijkbaar | Grijs heeft geen betekenisvolle baseline; pijl alleen bij twee echte RAG-kleuren | ✓ |
| Wel pijl omhoog ↑ | Grijs → groen is technisch verbetering — toon pijl | |

**User's choice:** Geen pijl als fase 1 grijs was. Pijl alleen als beide fases een echte RAG-kleur hebben (rood/oranje/groen/blauw).

---

## Trend vergelijkingsbasis

**Vergelijkingsattribuut:**

| Option | Description | Selected |
|--------|-------------|----------|
| Kleur-rank (rood<oranje<groen<blauw) | Simpel en consistent; oranje Let op = oranje Verzuim = gelijk | ✓ |
| Prognose-label rang | Fijnere vergelijking maar meer ruis | |

**Periode detectie:**

| Option | Description | Selected |
|--------|-------------|----------|
| Oudste en nieuwste record | getAllRecordsForStudent() gesorteerd; index 0 = fase 1, laatste = fase 2 | ✓ |
| Exacte periode-naam match | Zoek 'Fase 1'/'Fase 2' in periode-string — fragiel | |
| Jij beslist | Claude kiest robuustste aanpak | |

**User's choice:** Kleur-rank via STATUS_VOLGORDE; oudste/nieuwste record als fase-definitie.

---

## Claude's Discretion

- Exacte CSS-waarden voor de border-trick pijl (grootte, margin, vertical-align)
- CSS klasse-naamgeving voor pijl-elementen
- Of pijl en score in één `<span>` of aparte elementen (ARIA/onderhoudbaarheid)

## Deferred Ideas

Geen — discussie bleef volledig binnen phase-scope.

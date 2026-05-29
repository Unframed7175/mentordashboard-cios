# Phase 33: Klas Verwijderen met Bevestiging - Context

**Gathered:** 2026-05-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Verwijder de `window.confirm` flow en vervang die door een `KlasVerwijderenModal` component — een centered overlay met klasnaam, leerlingenaantal, checkbox-bevestiging en een disabled confirm-knop. Unlock de × knop voor ALLE klassen (ook niet-lege en actieve). Na verwijdering van de laatste klas navigeert de app naar het importscherm; na verwijdering van de actieve klas wisselt de app automatisch naar de eerste resterende klas.

</domain>

<decisions>
## Implementation Decisions

### × Knop Zichtbaarheid
- **D-01:** De × knop is altijd zichtbaar op ALLE klassen — ook niet-lege klassen en de actieve klas. `canDelete` wordt verwijderd als concept; elke klas krijgt de knop.
- **D-02:** Er is geen extra bescherming of visueel onderscheid voor de actieve klas in de tab strip — de × knop ziet er identiek uit voor alle tabs.

### Verwijderlogica na klikken
- **D-03:** Als de actieve klas verwijderd wordt en er zijn nog andere klassen: app wisselt automatisch naar de eerste resterende klas (dit doet `deleteKlas()` in `utils/klassen.ts` al).
- **D-04:** Als de actieve klas verwijderd wordt en het was de ENIGE klas: app navigeert naar het importscherm (`setView('import')`).
- **D-05:** Als een NIET-actieve klas verwijderd wordt: actieve klas en view blijven ongewijzigd, de tab verdwijnt stilletjes.

### Modal Stijl en Inhoud
- **D-06:** `KlasVerwijderenModal` volgt het bestaande `KlasModal` patroon: centered overlay, backdrop, `.modal-overlay` + `.modal-box` CSS structuur.
- **D-07:** De modal toont: klasnaam en exacte leerlingenaantal in de tekst (bijv. `Klas 'CSD2A' bevat 19 leerlingen.`), een checkbox met tekst **"Ik begrijp dat alle leerlingdata wordt verwijderd"**, en een bevestigknop.
- **D-08:** De bevestigknop is **disabled + grijs** zolang de checkbox niet aangevinkt is. Na aanvinken wordt de knop actief.
- **D-09:** Geen extra waarschuwing in de modal als de actieve klas verwijderd wordt — de standaard bevestigingstekst is voldoende.

### Feedback na verwijderen
- **D-10:** Na verwijdering verdwijnt de modal stilletjes en verdwijnt de tab. Geen toast of andere notificatie.

### Claude's Discretion
- Annuleerknop tekst en exact knoplabel voor de bevestigknop (bijv. "Verwijderen" / "Annuleren")
- Exact visuele stijl van de disabled bevestigknop (kleur, opacity)
- Volgorde van checkbox vs. bevestigknop in de modal

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Bestaande modals en tab strip
- `src/components/KlasModal.tsx` — Bestaand modal patroon: centered overlay, backdrop, .modal-overlay CSS. KlasVerwijderenModal MOET dezelfde structuur volgen.
- `src/components/KlasTabStrip.tsx` — Huidige × knop implementatie (regel 110-119: `klas.canDelete && ...`). Dit `canDelete` guard wordt verwijderd.

### App-level wiring
- `src/App.tsx` (regels 128-135) — `handleDeleteKlas` gebruikt nu `window.confirm`. Dit wordt vervangen door modal state + `KlasVerwijderenModal`.
- `src/App.tsx` (regel 156) — `canDelete: Array.isArray(klas.students) && klas.students.length === 0` → verandert naar `true` (of het `canDelete` veld vervalt geheel).

### Verwijderlogica (hergebruiken, niet aanpassen)
- `utils/klassen.ts` (regels 93-115) — `deleteKlas()` behandelt al: niet-lege klassen, automatisch wisselen bij actieve klas, navigatie naar null state. Geen aanpassingen nodig aan deze functie.

### Requirements
- `.planning/ROADMAP.md` §Phase 33 — 4 success criteria (KLS-04 t/m KLS-07)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `KlasModal.tsx`: modal structuur + CSS volledig herbruikbaar. `KlasVerwijderenModal` kan dezelfde `.modal-overlay` en `.modal-box` classes gebruiken zonder nieuwe CSS.
- `deleteKlas()` in `utils/klassen.ts`: werkt al voor niet-lege klassen, behandelt automatisch actieve klas wisseling — geen wijziging nodig.
- `.modal-overlay` CSS klasse in `src/index.css`: stijl al aanwezig.

### Established Patterns
- App.tsx gebruikt `showModal` boolean state + `setShowModal` voor KlasModal. Zelfde patroon voor `showDeleteModal: string | null` (klasId) of `{ klasId: string; naam: string; count: number } | null`.
- `refreshKey` trigger: na deleteKlas aanroep `setRefreshKey(k => k + 1)` om KlasTabStrip en KlasOverzicht opnieuw te renderen.
- `setView('import')` wordt al gebruikt in App.tsx voor navigatie naar importscherm.

### Integration Points
- `KlasTabStrip` ontvangt `onDeleteKlas(klasId: string)` prop — deze callback opent de modal in App.tsx in plaats van direct te deleten.
- Na bevestiging in de modal: `deleteKlas(klasId)` aanroepen, daarna `setRefreshKey`, daarna `setView('import')` als er geen klassen meer zijn.

</code_context>

<specifics>
## Specific Ideas

- Bevestigingstekst in modal: `Klas '${naam}' bevat ${count} leerlingen.` (exact formaat uit STATE.md design note)
- Checkbox tekst: `"Ik begrijp dat alle leerlingdata wordt verwijderd"` (exact)
- Modal bevestigknop: disabled totdat checkbox aangevinkt is

</specifics>

<deferred>
## Deferred Ideas

Geen — discussie bleef binnen de phasescope.

</deferred>

---

*Phase: 33-klas-verwijderen-bevestiging*
*Context gathered: 2026-05-29*

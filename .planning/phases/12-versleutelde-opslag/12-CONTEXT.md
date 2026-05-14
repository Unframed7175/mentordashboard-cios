# Phase 12: Versleutelde Opslag - Context

**Gathered:** 2026-05-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Vervang alle `localStorage`-calls in `utils/klassen.ts`, `utils/datamodel.ts` en `utils/leerlijnen.ts` door `tauri-plugin-store`. Versleutel de klas-/leerlingdata-payload met AES-256-GCM via een Rust Tauri command; sla de encryptiesleutel op in de OS keychain via `tauri-plugin-secure-storage`. Migreer bestaande localStorage-data automatisch bij app-start. Voeg `deleteStudent()` toe als TypeScript-functie (geen UI in Phase 12).

**In scope:** plugin-store installatie, Rust AES-256-GCM encrypt/decrypt commands, keychain sleutelbeheer, async saveKlassen/loadKlassen, auto-migratie localStorage → plugin-store, deleteStudent() functie + Vitest unit test.

**Out of scope:** React UI voor delete-knop (Phase 14), bestandsdialoog/drag-drop (Phase 13), verwijder-functie voor hele klassen (Phase 14 beslissing), cross-platform packaging (Phase 15).

</domain>

<decisions>
## Implementation Decisions

### Encryptie scope & sleutelbeheer

- **D-12-01:** Alleen klas-/leerlingdata (`klassen.ts`) wordt versleuteld met AES-256-GCM. Leerlijnen-mapping (`leerlijnen.ts`) is niet persoonsgebonden — blijft onversleuteld in plugin-store.
- **D-12-02:** Één app-level AES-256 sleutel voor alle klassendata; opgeslagen in OS keychain onder identifier `nl.cios.mentordashboard.key`.
- **D-12-03:** Rust-zijde (via Tauri command) genereert de AES-sleutel met `rand::rngs::OsRng` en slaat hem op via `tauri-plugin-secure-storage`. De key verlaat nooit de Rust-zijde — TypeScript krijgt nooit de raw key bytes.
- **D-12-04:** Ciphertext-formaat: Base64-encoded string van 12-byte nonce + AES-256-GCM ciphertext. plugin-store slaat dit als plain string op onder de `'klassen'` key.

### Plugin-store datastructuur

- **D-12-05:** Één `'klassen'` store-entry — encrypted Base64 blob van het volledige `{ klassen, activeKlasId }` object. Één atomaire write per save.
- **D-12-06:** Aparte `'leerlijnen'` store-entry — plain JSON string (onversleuteld, geen persoonsdata).
- **D-12-07:** `saveState()` en `loadState()` in `utils/datamodel.ts` worden deprecated: `saveState()` wordt een no-op, `loadState()` wordt verwijderd. `klassen.ts` is de enige bron van waarheid voor persistentie.
- **D-12-08:** Async-first API: `saveKlassen(): Promise<boolean>`, `loadKlassen(): Promise<boolean>`. Alle callers awaiten. Geen fire-and-forget.
- **D-12-09:** TypeScript gebruikt `@tauri-apps/plugin-store` binding direct voor Store.get/set/save. Encrypt/decrypt loopt via twee Rust Tauri commands: `encrypt_klassen(plaintext: String) -> String` en `decrypt_klassen(ciphertext: String) -> String`.
- **D-12-10:** Standaard Tauri app data directory voor plugin-store bestand — geen handmatig pad. Tauri plaatst het automatisch in `%APPDATA%\Mentordashboard CIOS\` (Windows) of `~/Library/Application Support/nl.cios.mentordashboard/` (Mac).

### Verwijderfunctie (STO-04)

- **D-12-11:** Phase 12 levert uitsluitend de TypeScript-functie `deleteStudent(klasId: string, leerlingId: string): Promise<boolean>` in `utils/klassen.ts`. Geen UI-wiring in Phase 12 — de knop en bevestigingsdialoog komen in Phase 14.
- **D-12-12:** Hard delete: leerling wordt verwijderd uit `klassenState.klassen[klasId].students[]`, gevolgd door `saveKlassen()` (encrypt + persist). AVG Art. 17 compliant — data is volledig gewist.
- **D-12-13:** Vitest unit test in `tests/storage.test.ts` met gemockte plugin-store (in-memory map als stub voor Store.get/set/save). Test verifieert: leerling ontbreekt na delete, saveKlassen werd aangeroepen.

### Migratie & foutafhandeling

- **D-12-14:** Auto-migratie bij app-start: `loadKlassen()` detecteert leeg plugin-store + aanwezige localStorage (`mentordashboard_klassen_v2` of `mentordashboard_v1`) → migreer automatisch → verwijder localStorage-entries na succesvolle write. Éénmalig, transparant voor mentor.
- **D-12-15:** Bij mislukte migratie (schrijffout, keychain niet beschikbaar): rollback — localStorage-entries NIET verwijderd, app start met lege klassenlijst, `console.error` + zichtbare foutmelding in UI. Mentor verliest geen data.
- **D-12-16:** Bij keychain-fout tijdens `loadKlassen()` (sleutel niet leesbaar): app start met lege state, duidelijke Nederlandse foutmelding ("Sleutel niet beschikbaar — neem contact op met beheerder"), encrypted blob op schijf blijft onaangeroerd.

### Claude's Discretion

- Exacte Rust crate-keuze voor AES-256-GCM (bijv. `aes-gcm` crate) — gebruik meest gebruikte Rust AES-GCM implementatie.
- Tauri command namen (bijv. `encrypt_klassen` / `decrypt_klassen`) — planner kiest consistente snake_case namen.
- Exacte error types in Rust commands — gebruik `tauri::Error` of `String` als return type voor foutafhandeling.
- Plugin-store bestandsnaam (bijv. `store.json`) — gebruik Tauri default.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase requirements
- `.planning/ROADMAP.md` §Phase 12 — STO-01, STO-02, STO-03, STO-04 requirements en success criteria

### Prior phase context
- `.planning/STATE.md` §Accumulated Context — decisions: OS keychain via tauri-plugin-secure-storage (not Stronghold), localStorage unreliable in Tauri prod (useHttpsScheme: true al ingesteld)
- `.planning/phases/11-typescript-migratie/11-CONTEXT.md` — D-11-04 (clean TS exports), Integration Points (Phase 12 importeert klassen.ts en datamodel.ts)

### Bestaande storage modules (te vervangen)
- `utils/klassen.ts` — huidige localStorage implementatie (KLASSEN_KEY, saveKlassen, loadKlassen, _migrateV1ToKlassen); async-ificatie target
- `utils/datamodel.ts` — saveState/loadState/clearState die deprecated worden; STORAGE_KEY = 'mentordashboard_v1'
- `utils/leerlijnen.ts` — STORAGE_KEY = 'mentordashboard_leerlijnen_v1'; blijft bestaan maar switcht naar plugin-store

### Tauri configuratie
- `src-tauri/tauri.conf.json` — huidige capabilities, CSP, useHttpsScheme: true; moet worden uitgebreid met plugin-store en plugin-secure-storage permissions
- `src-tauri/Cargo.toml` — nog geen plugin-store of plugin-secure-storage dependencies; beide toe te voegen

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `utils/klassen.ts` `_migrateV1ToKlassen()` — bestaand migratie-patroon (v1 localStorage → v2 multi-klas). Phase 12 voegt hierop een nieuwe migratie-laag toe (localStorage → plugin-store).
- `utils/klassen.ts` `klassenState` — in-memory state object dat ongewijzigd blijft; alleen de persist-laag (localStorage calls) wordt vervangen.
- `tests/vitest-setup.js` — jest shim voor Vitest; `tests/storage.test.ts` kan hier gebruik van maken.

### Established Patterns
- Alle storage-functies gebruiken `try/catch` met `console.warn/error` — Phase 12 behoudt dit patroon, maar voegt ook gebruikersvisibele foutmeldingen toe bij kritieke fouten (migratie, keychain-fout).
- `saveKlassen()` doet al een dual-write (klassen + saveState) — in Phase 12 verdwijnt de datamodel.ts kant; klassen.ts wordt de single writer.
- Async pattern: alle andere Tauri plugin-calls in de app zijn al async — `saveKlassen/loadKlassen` async-ificatie past in dit patroon.

### Integration Points
- `src-tauri/src/lib.rs` — Rust Tauri commands (`encrypt_klassen`, `decrypt_klassen`, key-init command) worden hier geregistreerd in `generate_handler![]`
- `src/main.tsx` of equivalent — app-initialisatie roept `loadKlassen()` aan bij startup; wordt await'd
- Phase 14 (React UI) importeert `deleteStudent` uit `utils/klassen.ts` — function signature moet stabiel blijven

</code_context>

<specifics>
## Specific Ideas

- Foutmelding bij keychain-fout: "Sleutel niet beschikbaar — neem contact op met beheerder" (Nederlands, zichtbaar in UI)
- Migratie is éénmalig en transparant: mentor merkt niets, app laadt gewoon na de migratie
- `deleteStudent(klasId: string, leerlingId: string): Promise<boolean>` — exacte functiesignatuur voor Phase 14 compatibiliteit

</specifics>

<deferred>
## Deferred Ideas

- UI voor deleteStudent() (knop + bevestigingsdialoog) — Phase 14 (React UI)
- Verwijder-functie voor hele klassen — Phase 14 beslissing
- Key rotation strategie (nieuw AES-key genereren en data herversleutelen) — post-v2.0
- Audit log van verwijderingen (AVG Art. 30 verantwoordingsplicht) — post-v2.0
- Cross-platform keychain testen op macOS — Phase 15 (Packaging)

</deferred>

---

*Phase: 12-versleutelde-opslag*
*Context gathered: 2026-05-14*

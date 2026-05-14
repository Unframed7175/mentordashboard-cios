# Phase 12: Versleutelde Opslag - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-14
**Phase:** 12-versleutelde-opslag
**Areas discussed:** Encryptie scope & sleutelbeheer, Plugin-store datastructuur, Verwijderfunctie scope (STO-04), Migratie & foutafhandeling

---

## Encryptie scope & sleutelbeheer

| Option | Description | Selected |
|--------|-------------|----------|
| Alleen klas-/leerlingdata (klassen.ts) | Zwaarste persoonsdata. Leerlijnen niet herleidbaar tot personen — onversleuteld. | ✓ |
| Alle drie de stores versleuteld | klassen + datamodel + leerlijnen — maximale AVG-posture, maar leerlijnen is niet persoonsgebonden. | |

**User's choice:** Alleen klas-/leerlingdata

---

| Option | Description | Selected |
|--------|-------------|----------|
| Één app-level sleutel | Gegenereerd bij eerste start, keychain identifier 'nl.cios.mentordashboard.key'. Simpelst voor één-gebruiker lokale app. | ✓ |
| Per-klas sleutel | Maximale isolatie, complexer, sleutel wissen bij klasverwijdering. | |

**User's choice:** Één app-level sleutel

---

| Option | Description | Selected |
|--------|-------------|----------|
| Rust-zijde via Tauri command | rand::rngs::OsRng, key verlaat nooit Rust-zijde. Veiligste optie. | ✓ |
| TypeScript-zijde via Web Crypto API | Raw key bytes via IPC naar Rust — key passeert IPC-grens. | |

**User's choice:** Rust-zijde via Tauri command

---

| Option | Description | Selected |
|--------|-------------|----------|
| Base64: nonce + ciphertext | 12-byte nonce + AES-256-GCM ciphertext, base64-encoded. Past in plugin-store string-waarden. | ✓ |
| Jij beslist | Claude kiest meest gangbare formaat. | |

**User's choice:** Base64-encoded string: nonce + ciphertext

---

## Plugin-store datastructuur

| Option | Description | Selected |
|--------|-------------|----------|
| Één entry voor alle klassen | Key 'klassen' → encrypted blob van { klassen, activeKlasId }. Atomaire writes. | ✓ |
| Per-klas entry | Klas_{id} per klas. Flexibeler, maar vereist bookkeeping van klas-IDs. | |

**User's choice:** Één entry voor alle klassen

---

| Option | Description | Selected |
|--------|-------------|----------|
| Aparte plugin-store entry, onversleuteld | Key 'leerlijnen' → plain JSON. Consistent met beslissing: alleen klas-data versleuteld. | ✓ |
| Onderdeel van klassen-entry | Meegenomen in encrypted blob — versleutelt niet-persoonsgebonden data. | |

**User's choice:** Aparte plugin-store entry, onversleuteld

---

| Option | Description | Selected |
|--------|-------------|----------|
| Deprecated — vervallen door saveKlassen() | saveState() no-op, loadState() removed. klassen.ts = enige bron van waarheid. | ✓ |
| Behouden als compat-shim | saveState() schrijft naar plugin-store. Twee codepaden. | |

**User's choice:** saveState() deprecated

---

| Option | Description | Selected |
|--------|-------------|----------|
| Async-first: saveKlassen/loadKlassen worden async | Promise<boolean>, callers awaiten. Past bij Tauri IPC async model. | ✓ |
| Fire-and-forget wrapper | Start async call maar returnt meteen. Risico: dataverlies bij afsluiten. | |

**User's choice:** Async-first

---

| Option | Description | Selected |
|--------|-------------|----------|
| TypeScript-kant via @tauri-apps/plugin-store | Store.get/set/save direct in TS. Encrypt/decrypt via Rust commands. | ✓ |
| Alles via Rust commands | TS stuurt plaintext naar Rust; Rust doet alles. | |

**User's choice:** TypeScript-kant via @tauri-apps/plugin-store

---

| Option | Description | Selected |
|--------|-------------|----------|
| Standaard Tauri app data dir | Automatisch: %APPDATA% (Win) / ~/Library/Application Support/ (Mac). | ✓ |
| Expliciet pad opgeven | Handmatig instellen — niet nodig voor standaard installeerbare app. | |

**User's choice:** Standaard Tauri app data dir

---

## Verwijderfunctie scope (STO-04)

| Option | Description | Selected |
|--------|-------------|----------|
| Alleen TypeScript-functie, geen UI | deleteStudent(klasId, leerlingId): Promise<boolean>. UI-wiring in Phase 14. | ✓ |
| TypeScript-functie + minimale placeholder UI | Verwijder-knop in Phase 12 placeholder — kan direct AVG-compliance testen. | |

**User's choice:** Alleen TypeScript-functie, geen UI

---

| Option | Description | Selected |
|--------|-------------|----------|
| Hard delete: leerling uit array + saveKlassen() | AVG Art. 17 compliant. Data volledig gewist. | ✓ |
| Soft delete: deleted: true vlag | Data blijft op schijf — niet AVG-compliant. | |

**User's choice:** Hard delete

---

| Option | Description | Selected |
|--------|-------------|----------|
| Vitest unit test met gemockte plugin-store | tests/storage.test.ts, in-memory Store stub. | ✓ |
| Alleen handmatig testen via UAT | Niet testbaar zonder Tauri runtime. | |

**User's choice:** Vitest unit test met gemockte plugin-store

---

## Migratie & foutafhandeling

| Option | Description | Selected |
|--------|-------------|----------|
| Bij app-start: auto-detectie leeg plugin-store + aanwezige localStorage | Éénmalig, transparant, localStorage verwijderd na succes. | ✓ |
| Expliciete 'Migreer data'-knop in UI | Meer controle, extra UX-complexiteit. | |

**User's choice:** Auto-migratie bij app-start

---

| Option | Description | Selected |
|--------|-------------|----------|
| Rollback: localStorage onaangeroerd, lege state + foutmelding | Mentor verliest geen data. | ✓ |
| Best-effort: gedeeltelijk gemigreerde data gebruiken | Risico op inconsistente staat. | |

**User's choice:** Rollback bij mislukte migratie

---

| Option | Description | Selected |
|--------|-------------|----------|
| Lege state, foutmelding, blob op schijf onaangeroerd | Data niet kwijt — tijdelijk niet toegankelijk. | ✓ |
| Automatisch nieuwe sleutel genereren en data wissen | Data permanent verloren — niet acceptabel. | |

**User's choice:** Lege state + foutmelding bij keychain-fout

---

## Claude's Discretion

- Exacte Rust crate voor AES-256-GCM (bijv. `aes-gcm`)
- Tauri command namen (`encrypt_klassen` / `decrypt_klassen`)
- Exacte Rust error types in commands
- Plugin-store bestandsnaam

## Deferred Ideas

- UI voor deleteStudent() (knop + bevestigingsdialoog) → Phase 14
- Verwijder-functie voor hele klassen → Phase 14
- Key rotation strategie → post-v2.0
- Audit log van verwijderingen (AVG Art. 30) → post-v2.0
- Cross-platform keychain testen op macOS → Phase 15

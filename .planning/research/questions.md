# Research Questions

Open vragen die dieper onderzoek vereisen voordat ze in een plan worden omgezet.

---

## RQ-01: AVG-compliance voor een lokale desktop-app met leerlingdata (NL)

**Datum:** 2026-04-24
**Context:** Het mentordashboard verwerkt leerlingdata (naam, voortgang, verzuim) en wordt ingezet door mentoren van CIOS Zuidwest. De app draait lokaal; er is geen server of cloud-opslag. Bij opschaling naar meerdere scholen of gebruikers moet AVG-compliance aantoonbaar zijn.

**Kernvraag:** Wat vereist de AVG concreet voor een lokale desktop-applicatie die persoonsgegevens van minderjarige leerlingen verwerkt in een onderwijscontext in Nederland?

**Deelvragen:**

1. Is een verwerkersovereenkomst vereist als de app volledig lokaal draait en geen data naar buiten stuurt?
2. Wat zijn de minimale technische maatregelen die de AVG vereist voor lokale opslag van leerlingdata (encryptie-standaard, sleutelbeheer)?
3. Wie is de verwerkingsverantwoordelijke — de school, de mentor, of de ontwikkelaar?
4. Wat zijn de vereisten rondom recht op verwijdering (artikel 17 AVG) in een lokale app?
5. Zijn er sector-specifieke richtlijnen van de Autoriteit Persoonsgegevens voor onderwijssoftware?
6. Vereist het gebruik binnen een onderwijsinstelling een Data Protection Impact Assessment (DPIA)?

**Bronnen om te raadplegen:**
- Autoriteit Persoonsgegevens (autoriteitpersoonsgegevens.nl) — richtlijnen onderwijssector
- Kennisnet — AVG in het onderwijs
- IBP (Informatiebeveiligingsdienst) voor het onderwijs

**Trigger om te onderzoeken:** Voordat de stack-modernisering wordt gepland als officiële fase.

---

## Antwoorden — Onderzocht 2026-05-12

### 1. Verwerkersovereenkomst vereist?
**Nee — niet in de huidige situatie.** Een verwerkersovereenkomst (artikel 28 AVG) is alleen vereist tussen een verwerkingsverantwoordelijke en een externe verwerker. Leraren die de app gebruiken in hun functie zijn geen verwerkers maar een verlengstuk van de verwerkingsverantwoordelijke (school). Zolang de developer geen toegang krijgt tot leerlingdata is er geen artikel 28-relatie. **Uitzondering:** zodra de developer data inziet (bijv. voor support), is een verwerkersovereenkomst alsnog verplicht.

### 2. Minimale technische maatregelen (artikel 32 + IBP norm GB.03)
- **AES-256 versleuteling verplicht** voor lokaal opgeslagen leerlingdata — plaintext localStorage is onverdedigbaar
- **Sleutelbeheer:** de encryptiesleutel mag NIET naast de data in localStorage staan. Opties: afgeleid van een wachtwoord (PBKDF2), opgeslagen in sessionStorage (vervalt bij afsluiten), of OS-native credential store
- **Cryptografisch sleutelmanagement** vereist op IBP-niveau 3 (norm SM.10, verwijst naar ISO 27001 A8.24)
- Apparaat-niveau versleuteling (BitLocker) is de verantwoordelijkheid van de school, niet de app

### 3. Verwerkingsverantwoordelijke
**Het schoolbestuur (bevoegd gezag).** De mentor/leraar handelt namens de school en is geen zelfstandige verwerkingsverantwoordelijke voor officiële onderwijstaken. De developer heeft geen AVG-rol tenzij hij data inziet.

### 4. Recht op verwijdering (artikel 17 AVG)
- App moet **per-leerling verwijdering** ondersteunen — niet alleen "alles wissen"
- Sommige velden hebben **wettelijke bewaarplicht** (MBO-inspectie, 5+ jaar) — die zijn uitgezonderd via artikel 17(3)(b)
- Exportbestanden (Excel/PDF) vallen buiten de app's bereik; de school heeft een apart proces nodig
- **Minderjarigen:** ouders/voogden hebben het recht namens hen — geen striktere technische eis, wel apart schoolproces

### 5. Sector-specifieke richtlijnen
- **Kennisnet IBP Normenkader** — 94 normen (69 security + 25 privacy), de facto standaard, gemonitord door Onderwijsinspectie. Maturityniveau 3 is de verwachte baseline
- **SIVON** — biedt pre-ingevulde DPIA's voor gangbare platforms; voor een eigen tool moet de school zelf een pre-DPIA uitvoeren
- **AP heeft handhavingsgeschiedenis** in het onderwijs (o.a. Google Workspace 2021)

### 6. DPIA vereist?
- **Pre-DPIA verplicht** via IBP norm PR.05 — dit is de school's verantwoordelijkheid, niet de developer's
- **Volledige DPIA waarschijnlijk niet verplicht** gezien de lokale opzet en kleine schaal (één school, geen automatische profilering voor externe besluiten)
- **Risicofactor:** als de aggregatie van voortgang + verzuim + mentornotities wordt gezien als "systematische beoordeling van prestaties" kan categorie 15 van de AP-lijst van toepassing zijn

---

## Actiepunten voor de app (developer-verantwoordelijkheid)

| Prioriteit | Actie |
|---|---|
| 🔴 HOOG | Versleutel localStorage-data met AES-256 + veilig sleutelbeheer |
| 🔴 HOOG | Implementeer per-leerling verwijderfunctie |

## Actiepunten voor de school (FG/DPO-verantwoordelijkheid)

| Prioriteit | Actie |
|---|---|
| 🔴 HOOG | App opnemen in verwerkingsregister (artikel 30 AVG) |
| 🟡 MEDIUM | Pre-DPIA uitvoeren via Kennisnet/SIVON voor brede inzet |
| 🟡 MEDIUM | Retentiebeleid bepalen per dataveld |

**Status:** Beantwoord — klaar om om te zetten naar requirements in de stack-modernisering fase.

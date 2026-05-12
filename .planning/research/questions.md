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

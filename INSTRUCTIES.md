# Handleiding Mentordashboard CIOS — versie 2.11

## Wat is dit?

Mentordashboard CIOS is een desktopapplicatie voor mentoren om de voortgang, het verzuim en de doorstroomprognose van leerlingen te bekijken. De app werkt op **Windows en macOS** en heeft **geen internetverbinding** nodig. Alle leerlingdata wordt versleuteld opgeslagen op je eigen computer — er worden geen gegevens naar externe servers verzonden.

---

## Inhoudsopgave

1. [Installatie — Windows](#installatie--windows)
2. [Installatie — macOS](#installatie--macos)
3. [Eerste gebruik — de wizard](#eerste-gebruik--de-wizard)
4. [Bestanden importeren](#bestanden-importeren)
5. [Klasoverzicht begrijpen](#klasoverzicht-begrijpen)
6. [Detailweergave leerling](#detailweergave-leerling)
7. [Klassen beheren](#klassen-beheren)
8. [Actiepunten bijhouden](#actiepunten-bijhouden)
9. [Instellingen aanpassen](#instellingen-aanpassen)
10. [Backup maken en terugzetten](#backup-maken-en-terugzetten)
11. [Afdrukken voor mentorgesprek](#afdrukken-voor-mentorgesprek)
12. [Bug melden](#bug-melden)
13. [Bekende beperkingen](#bekende-beperkingen)

---

## Installatie — Windows

1. Ga naar de [Releases pagina](https://github.com/Unframed7175/mentordashboard-cios/releases/latest) en download het `.exe`-bestand.
2. Dubbelklik op het bestand om de installer te starten.
3. Als Windows SmartScreen een popup toont ("Windows heeft deze pc beschermd") → klik **Meer info** → **Toch uitvoeren**.

   > **Deze melding is normaal.** Windows toont hem voor elke app die niet via de Microsoft Store wordt verkocht. Mentordashboard CIOS is veilig: het draait alleen op jouw eigen computer en stuurt geen gegevens naar buiten. Je ziet deze melding alleen bij de allereerste installatie.
4. De installatie vereist geen beheerdersrechten — de app installeert voor de huidige gebruiker.
5. Na installatie is de app beschikbaar via het Startmenu als **Mentordashboard CIOS**.

---

## Installatie — macOS

1. Ga naar de [Releases pagina](https://github.com/Unframed7175/mentordashboard-cios/releases/latest) en download het `.dmg`-bestand dat bij jouw Mac past:
   - **Apple Silicon (M1/M2/M3/M4)** → download het bestand met `aarch64` in de naam
   - **Oudere Intel Mac** → download het bestand met `x64` in de naam
2. Dubbelklik op het `.dmg`-bestand en sleep de app naar de map **Programma's (Applications)**.
3. Dubbelklik op de app. Als macOS meldt "app kan niet worden geopend" of "app is beschadigd":

   > **Deze melding is normaal.** macOS toont hem voor elke app die niet via de App Store wordt verkocht. Mentordashboard CIOS is veilig: het draait alleen op jouw eigen computer en stuurt geen gegevens naar buiten. Je doet dit alleen bij de allereerste installatie.

   **Optie A — via Terminal (aanbevolen):**
   ```
   xattr -cr "/Applications/Mentordashboard CIOS.app"
   ```
   Start de app daarna opnieuw.

   > Let op: de `-r` (recursief) is belangrijk. Zonder `-r` wist macOS de quarantine-vlag alleen op de bovenste map van de app, en op Apple Silicon-Macs blijft hij dan vaak alsnog geblokkeerd.

   **Optie B — via Systeeminstellingen:**
   Ga naar **Systeeminstellingen → Privacy en beveiliging** → scroll omlaag → klik **Toch openen**.

---

## Eerste gebruik — de wizard

De eerste keer dat je de app opstart, verschijnt een **setup-wizard** met 6 stappen:

| Stap | Wat je doet |
|---|---|
| 1 | Geef je klas een naam (bijv. "1A Zorg") |
| 2 | Upload de voortgang-PDF's van je leerlingen |
| 3 | Upload het verzuim Excel-bestand (optioneel, overslaan mag) |
| 4 | Upload het BPV Excel-bestand (optioneel, overslaan mag) |
| 5 | Stel verzuimdrempels in (optioneel, standaardwaarden werken prima) |
| 6 | Klaar — je klas is aangemaakt |

De wizard verschijnt daarna niet meer. Nieuwe bestanden importeer je via het **Importeer**-scherm in de navigatiebalk.

---

## Bestanden importeren

### Cumlaude voortgang (PDF)

1. Klik op het **importeer-scherm** in de navigatiebalk.
2. Sleep één of meerdere voortgang-PDF's naar het importvak, of klik **Bestanden toevoegen**.
3. De app verwerkt de bestanden automatisch.
4. Meerdere imports worden samengevoegd — eerder geïmporteerde leerlingen blijven bewaard.
5. Als een bestand niet ingelezen kan worden, zie je een foutmelding naast de bestandsnaam.

> **Let op:** gebruik altijd de Cumlaude voortgang-PDF's (met deelgebieden en opdrachten). Andere PDF-types worden niet herkend.

### Verzuim (Excel)

1. Exporteer het verzuimoverzicht uit Cumlaude als `.xls`-bestand.
2. Klik op **Verzuim importeren** en selecteer het bestand.
3. Verzuimgegevens worden automatisch gekoppeld aan de bestaande leerlingen op basis van naam.

### BPV / Stage (Excel)

1. Exporteer het BPV-overzicht als Excel-bestand vanuit Cumlaude.
2. Klik op **BPV importeren** en selecteer het bestand.

---

## Klasoverzicht begrijpen

Na het importeren zie je alle leerlingen als tegels. Elke tegel heeft een **kleurcode** die de doorstroomprognose aangeeft:

| Kleur | Wat het betekent |
|---|---|
| **Groen** | Op koers — leerling haalt de norm |
| **Oranje** | Aandacht nodig — net onder de norm of verhoogd verzuim |
| **Rood** | Risico — leerling haalt de doorstroomnorm niet |
| **Paars/Blauw** | Profieljaar SBC of versneld SBC (BJ2/BJ1) |
| **Grijs** | Nog geen scores — PDF nog niet geïmporteerd of lege data |

De tegels zijn gesorteerd: **rood eerst**, dan oranje, dan groen — zodat de leerlingen die aandacht nodig hebben bovenaan staan.

Bovenin het scherm zie je **tabs** voor elke klas. Klik op een tab om van klas te wisselen.

---

## Detailweergave leerling

Klik op een leerlingtegel om de detailweergave te openen. Hier vind je:

| Sectie | Inhoud |
|---|---|
| **Doorstroomprognose** | RAG-status + toelichting (BJ1 of BJ2) |
| **Deelgebieden matrix** | Alle 19 deelgebieden met score per periode |
| **Vakken & opdrachten** | Ingediende opdrachten per vak met statusbadge |
| **Verzuim** | Geoorloofd en ongeoorloofd verzuim in uren |
| **BPV / Stage** | Stagegegevens en voortgang uren |
| **Rekenen & Nederlands** | Scores als die in de PDF staan |
| **Leerlijnen** | Scores per leerlijn (lesgeven, organiseren, professioneel handelen) |
| **Spider chart** | Visueel overzicht van de drie leerlijnen |
| **Actiepunten** | Jouw eigen notities en actiepunten per leerling |

Gebruik de **← →** knoppen rechtsboven om naar de vorige of volgende leerling te navigeren (in sorteervolgorde).

### Statusbadges bij opdrachten

| Badge | Betekenis |
|---|---|
| Groen | Beoordeeld en voldoende |
| Oranje | Ingeleverd, nog niet beoordeeld |
| Rood | Niet ingeleverd of onvoldoende |
| Grijs | Niet van toepassing of onbekend |

---

## Klassen beheren

### Tweede klas aanmaken

Klik op het **+** teken naast de klas-tabs bovenin. Geef de klas een naam en importeer daarna de bijbehorende PDF's.

### Klas hernoemen

Klik met de rechtermuisknop op de klas-tab (of klik op het potloodicoon naast de naam). Vul een nieuwe naam in en bevestig.

### Klas verwijderen

Klik op het prullenbak-icoon naast de klas-naam. De app vraagt om bevestiging en toont hoeveel leerlingen er in de klas zitten. Na bevestiging worden alle leerlinggegevens van die klas permanent verwijderd.

---

## Actiepunten bijhouden

In de detailweergave van een leerling vind je de sectie **Actiepunten**. Hier kun je persoonlijke notities bijhouden voor het mentorgesprek.

### Actiepunt aanmaken

1. Klik op **Nieuw actiepunt**.
2. Vul een onderwerp in en stel een datum in.
3. Kies een status: **Open**, **Opgepakt** of **Herhaling**.
4. Het actiepunt wordt opgeslagen bij de leerling.

### Actiepunt bewerken of verwijderen

Klik op een bestaand actiepunt om het te bewerken. Gebruik het prullenbak-icoon om het te verwijderen.

> Actiepunten worden automatisch opgeslagen en blijven bewaard tot je ze zelf verwijdert.

---

## Instellingen aanpassen

Klik op het tandwiel-icoon in de navigatiebalk om de instellingen te openen.

| Instelling | Uitleg |
|---|---|
| **Thema** | Licht, donker of automatisch (volgt systeeminstelling) |
| **Ongeoorloofd verzuim drempel** | Aantal uur waarboven de leerling oranje kleurt (standaard: 16u) |
| **Geoorloofd verzuim drempel** | Aantal uur waarboven de leerling oranje kleurt (standaard: 40u) |
| **Doorstroomnormen** | 8 drempelwaarden voor de prognoseberekening (reset naar standaard beschikbaar) |

---

## Backup maken en terugzetten

### Backup maken

1. Ga naar **Instellingen → Backup**.
2. Klik op **Backup exporteren**.
3. Sla het ZIP-bestand op een veilige plek op (bijv. OneDrive of een USB-stick).

De backup bevat alle klassen, leerlingen, actiepunten en instellingen — versleuteld en gecomprimeerd.

### Backup terugzetten

1. Ga naar **Instellingen → Backup**.
2. Klik op **Backup importeren** en selecteer het ZIP-bestand.
3. Kies:
   - **Samenvoegen** — bestaande data blijft staan, backup wordt toegevoegd
   - **Overschrijven** — huidige data wordt vervangen door de backup

> **Tip:** maak een backup aan het begin van elk schooljaar en bewaar hem op een andere locatie dan de app.

---

## Afdrukken voor mentorgesprek

1. Open de detailweergave van een leerling.
2. Klik op de **printknop** (printer-icoon) rechtsboven.
3. Kies als bestemming **"Opslaan als PDF"** om een PDF te maken, of stuur direct naar de printer.
4. De pagina is geoptimaliseerd voor **A4-formaat**.

---

## Bug melden

Gebruik de **🐛 Fout melden**-knop in de navigatiebalk. Dit opent je e-mailprogramma met het adres van de ontwikkelaar al ingevuld.

Vermeld in je e-mail:

- Wat je deed op het moment van de fout
- Wat er mis ging (foutmelding of onverwacht gedrag)
- Op welk besturingssysteem je werkt (Windows / macOS)

E-mailadres: **ralvarezstam@cioszuidwest.nl**

---

## Bekende beperkingen

- **Geen automatische updates** — nieuwe versies moet je zelf downloaden via de [Releases pagina](https://github.com/Unframed7175/mentordashboard-cios/releases/latest). Je krijgt geen melding als er een nieuwe versie is.
- **BPV-kolommen** — de app verwacht de standaard kolomnamen van het Cumlaude BPV-exportformaat. Als Cumlaude die namen heeft aangepast, worden BPV-gegevens niet ingelezen. Meld dit via de 🐛-knop.
- **Rekenen en Nederlands** — deze sectie is optioneel in Cumlaude-rapporten. Als de sectie ontbreekt in een PDF, worden die scores niet getoond.
- **macOS Gatekeeper** — bij de eerste start na installatie kan macOS een waarschuwing geven. Zie de installatie-instructies hierboven voor de oplossing.

---

*Versie 2.4 — juni 2026 — Mentordashboard CIOS*

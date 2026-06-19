# Testplan Mentordashboard CIOS

Dit testplan bevat handmatige testscenario's voor collega-testers. Doorloop de stappen in volgorde en markeer elke stap als geslaagd (✓) of niet geslaagd (✗) in de kolom "Geslaagd?". Meld afwijkingen via de 🐛 Fout melden-knop in de app of via ralvarezstam@cioszuidwest.nl.

---

## Testscenario 1: Installatie Windows

| Stap | Actie | Verwacht resultaat | Geslaagd? |
|------|-------|--------------------|-----------|
| 1 | Ga naar de Releases pagina op GitHub en download het nieuwste `.exe`-bestand | Bestand wordt gedownload naar de Downloads map | ☐ |
| 2 | Dubbelklik op het gedownloade `.exe`-bestand | Windows SmartScreen popup verschijnt ("Windows heeft deze pc beschermd") | ☐ |
| 3 | Klik op "Meer info" en vervolgens op "Toch uitvoeren" | Installer wizard opent | ☐ |
| 4 | Voltooi de installer wizard | App is geïnstalleerd; "Mentordashboard CIOS" verschijnt in het Startmenu | ☐ |
| 5 | Start de app via het Startmenu | Onboarding wizard verschijnt (eerste keer starten) | ☐ |

## Testscenario 2: Installatie macOS

| Stap | Actie | Verwacht resultaat | Geslaagd? |
|------|-------|--------------------|-----------|
| 1 | Ga naar de Releases pagina op GitHub en download het nieuwste `.dmg`-bestand | Bestand wordt gedownload | ☐ |
| 2 | Dubbelklik op het `.dmg`-bestand en sleep de app naar de map Applications | App staat in de map Applications | ☐ |
| 3 | Dubbelklik op de app om te starten | macOS toont melding "beschadigd" of "kan niet worden geopend" | ☐ |
| 4 | Open Terminal en voer `xattr -c "/Applications/Mentordashboard CIOS.app"` uit (of gebruik Systeeminstellingen → Privacy → Toch openen) | Geen foutmelding in Terminal | ☐ |
| 5 | Start de app opnieuw | App start succesvol; onboarding wizard verschijnt | ☐ |

## Testscenario 3: Onboarding wizard (eerste keer)

| Stap | Actie | Verwacht resultaat | Geslaagd? |
|------|-------|--------------------|-----------|
| 1 | Start de app voor de eerste keer (of na het wissen van app-data) | Onboarding wizard verschijnt met stap 1 | ☐ |
| 2 | Doorloop alle stappen van de wizard (klas aanmaken, PDFs, verzuim, BPV, voltooien) | Elke stap is navigeerbaar; "Volgende" en "Vorige" werken correct | ☐ |
| 3 | Klik op "Voltooien" op de laatste stap | Wizard sluit af; hoofdscherm (klasoverzicht of importscherm) is zichtbaar | ☐ |
| 4 | Sluit de app en start opnieuw | Wizard verschijnt NIET meer; app opent direct op het hoofdscherm | ☐ |

## Testscenario 4: PDF importeren

| Stap | Actie | Verwacht resultaat | Geslaagd? |
|------|-------|--------------------|-----------|
| 1 | Klik op de knop "PDF importeren" | Bestandskiezer dialoog opent | ☐ |
| 2 | Selecteer 1 Cumlaude voortgangs-PDF voor een leerling | Dialoog sluit; app verwerkt het bestand | ☐ |
| 3 | Wacht tot verwerking gereed is | Leerling verschijnt als tegel in de klas-tab met naam en kleurcode (groen/oranje/rood) | ☐ |
| 4 | Importeer een tweede PDF voor een andere leerling | Nieuwe tegel verschijnt; eerder geïmporteerde leerling blijft behouden | ☐ |

## Testscenario 5: Verzuim Excel importeren

| Stap | Actie | Verwacht resultaat | Geslaagd? |
|------|-------|--------------------|-----------|
| 1 | Zorg dat er al leerlingen zijn geïmporteerd via PDF (zie Testscenario 4) | Klasoverzicht toont leerlingen | ☐ |
| 2 | Klik op "Verzuim importeren" en selecteer het `.xls`-bestand | Bestand wordt verwerkt | ☐ |
| 3 | Open de detailweergave van een leerling (klik op de tegel) | Detailweergave toont verzuimgegevens (aanwezig, geoorloofd, ongeoorloofd) | ☐ |
| 4 | Controleer of verzuimpercentage in de tegel is bijgewerkt | Tegel toont bijgewerkt aanwezigheidspercentage | ☐ |

## Testscenario 6: BPV stage Excel importeren

| Stap | Actie | Verwacht resultaat | Geslaagd? |
|------|-------|--------------------|-----------|
| 1 | Zorg dat er al leerlingen zijn geïmporteerd via PDF | Klasoverzicht toont leerlingen | ☐ |
| 2 | Klik op "BPV importeren" en selecteer het BPV Excel-bestand | Bestand wordt verwerkt | ☐ |
| 3 | Open de detailweergave van een leerling | Detailweergave toont BPV-gegevens (gerealiseerde uren, stageplek) | ☐ |
| 4 | Controleer dat leerlingen zonder BPV-data geen foutmelding tonen | Leerlingen zonder BPV tonen een lege of neutrale BPV-sectie | ☐ |

## Testscenario 7: Detailweergave bekijken

| Stap | Actie | Verwacht resultaat | Geslaagd? |
|------|-------|--------------------|-----------|
| 1 | Klik op een leerlingtegel in het klasoverzicht | Detailweergave opent voor de geselecteerde leerling | ☐ |
| 2 | Scroll door de detailweergave | Deelgebieden (V/G/E per deelgebied), doorstroomprognose en verzuim zijn zichtbaar | ☐ |
| 3 | Controleer de doorstroomprognose badge | Badge toont "Positief", "Aandacht" of "Negatief" met bijbehorende kleur | ☐ |
| 4 | Controleer dat score-telling zichtbaar is op de tegel (bijv. "14/19 ≥V · 1 O") | Score-telling staat onder de status-badge | ☐ |
| 5 | Klik op "← Terug" | Klasoverzicht is zichtbaar; de eerder geselecteerde leerlingtegel is zichtbaar | ☐ |

## Testscenario 8: Fase-vergelijking

| Stap | Actie | Verwacht resultaat | Geslaagd? |
|------|-------|--------------------|-----------|
| 1 | Importeer een PDF van fase 1 voor een leerling | Leerling verschijnt met fase 1 data | ☐ |
| 2 | Importeer een tweede PDF van fase 2 voor dezelfde leerling | App verwerkt de tweede import; leerling heeft nu beide fasen | ☐ |
| 3 | Open de detailweergave van de leerling | Trend-pijl (↑ / ↓ / →) is zichtbaar naast de deelgebiedsscores | ☐ |
| 4 | Controleer dat de tegel in het klasoverzicht een trend-pijl toont | Pijl geeft de richting aan t.o.v. fase 1 | ☐ |

## Testscenario 9: Afdrukken / Print-to-PDF

| Stap | Actie | Verwacht resultaat | Geslaagd? |
|------|-------|--------------------|-----------|
| 1 | Open de detailweergave van een leerling | Detailweergave is volledig zichtbaar | ☐ |
| 2 | Klik op de printknop (printer-icoon) | Printdialoog van het besturingssysteem verschijnt | ☐ |
| 3 | Kies "Opslaan als PDF" als printer en kies een locatie | PDF wordt opgeslagen op de gekozen locatie | ☐ |
| 4 | Open de opgeslagen PDF | PDF bevat de volledige detailweergave inclusief kleurcodering (RAG-kleuren) | ☐ |

## Testscenario 10: Bug melden via bug-knop

| Stap | Actie | Verwacht resultaat | Geslaagd? |
|------|-------|--------------------|-----------|
| 1 | Klik op de 🐛-knop in de navigatiebalk bovenin de app | E-mailprogramma opent met een nieuw bericht | ☐ |
| 2 | Controleer het adresveld van het nieuwe e-mailbericht | Adres ralvarezstam@cioszuidwest.nl is vooringevuld | ☐ |
| 3 | Controleer het onderwerpveld | Een onderwerpregel is automatisch ingevuld (bijv. met app-versie en OS) | ☐ |

## Testscenario 11: Instellingen aanpassen

| Stap | Actie | Verwacht resultaat | Geslaagd? |
|------|-------|--------------------|-----------|
| 1 | Klik op het tandwiel-icoon in de navigatiebalk | Instellingenpagina opent | ☐ |
| 2 | Wijzig een drempelwaarde (bijv. het minimum aantal voldoendes voor "Positief") | Nieuwe waarde is ingevoerd in het veld | ☐ |
| 3 | Ga terug naar het klasoverzicht en bekijk een leerlingtegel | Tegel-kleur reflecteert de nieuw ingestelde drempelwaarde | ☐ |
| 4 | Ga naar instellingen en schakel dark mode in | Interface wordt donker (achtergrond donker, tekst licht) | ☐ |
| 5 | Schakel dark mode uit | Interface keert terug naar normale weergave | ☐ |

## Testscenario 12: Klas hernoemen en verwijderen

| Stap | Actie | Verwacht resultaat | Geslaagd? |
|------|-------|--------------------|-----------|
| 1 | Dubbelklik op de naam van een klas-tab | De naam wordt bewerkbaar (inline tekstveld verschijnt) | ☐ |
| 2 | Typ een nieuwe naam en bevestig met Enter | Tab toont de nieuwe naam; data van de klas blijft behouden | ☐ |
| 3 | Hover over een klas-tab | Verwijder-knop (×) verschijnt naast de tabnaam | ☐ |
| 4 | Klik op de verwijder-knop | Bevestigingsdialoog verschijnt ("Weet je het zeker?") | ☐ |
| 5 | Bevestig de verwijdering | Klas verdwenen uit de tabs; andere klassen zijn nog aanwezig | ☐ |

## Testscenario 13: Help pagina openen en sluiten

| Stap | Actie | Verwacht resultaat | Geslaagd? |
|------|-------|--------------------|-----------|
| 1 | Klik op de "?"-knop in de navigatiebalk | Help pagina opent | ☐ |
| 2 | Scroll door de help pagina | Inhoud is zichtbaar: secties over Importeren, Bekijken, Afdrukken en Fout melden | ☐ |
| 3 | Controleer dat de help pagina leesbare instructies bevat | Tekst is in het Nederlands en duidelijk geformuleerd | ☐ |
| 4 | Klik op "← Terug" | Vorig scherm (klasoverzicht of detailweergave) is hersteld; geen dataverlies | ☐ |

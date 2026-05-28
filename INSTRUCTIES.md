# Instructies Mentordashboard CIOS

## Wat is dit?

Mentordashboard CIOS is een desktopapplicatie voor mentoren om de voortgang, het verzuim en de doorstroomprognose van leerlingen te bekijken. De app draait als los programma op Windows en macOS en vereist geen internetverbinding. Alle leerlingdata wordt versleuteld opgeslagen op je eigen computer — er worden geen gegevens naar externe servers verzonden.

## Installatie op Windows

1. Ga naar de Releases pagina op GitHub en download het nieuwste `.exe`-bestand.
2. Dubbelklik op het gedownloade `.exe`-bestand om de installer te starten.
3. Als Windows SmartScreen een popup toont ("Windows heeft deze pc beschermd"), klik dan op "Meer info" en vervolgens "Toch uitvoeren".
4. Volg de installer wizard. Installatie vereist geen beheerdersrechten (installeert voor de huidige gebruiker).
5. Na installatie is de app beschikbaar via het Startmenu als "Mentordashboard CIOS".

## Installatie op macOS

1. Ga naar de Releases pagina op GitHub en download het nieuwste `.dmg`-bestand.
2. Dubbelklik op het `.dmg`-bestand en sleep de app naar de map Programma's (Applications).
3. Dubbelklik op de app om te starten. Als macOS meldt "app is beschadigd" of "kan niet worden geopend":
   - **Optie A — via Terminal:** Open Terminal en voer het volgende commando uit:
     ```
     xattr -c "/Applications/Mentordashboard CIOS.app"
     ```
   - **Optie B — via Systeeminstellingen:** Ga naar Systeeminstellingen → Privacy en beveiliging → scroll omlaag → klik "Toch openen".
4. Start de app opnieuw. De app opent nu zonder waarschuwing.

## Eerste gebruik

De eerste keer dat de app wordt gestart, verschijnt een korte onboarding wizard. Volg de stappen om de basisinstellingen in te stellen en je eerste klas aan te maken. Daarna kom je direct in het hoofdscherm terecht. De wizard verschijnt niet meer bij volgende starts.

## Bestanden importeren

### SomToday voortgang (PDF)

1. Klik op de knop "PDF importeren" (of sleep bestanden naar het scherm).
2. Selecteer een of meerdere PDF-voortgangsrapporten van SomToday.
3. De app verwerkt de PDFs en toont de leerlingen in een klas-tab.
4. Meerdere imports worden samengevoegd — eerder geïmporteerde leerlingen blijven behouden.

### Verzuim (Excel)

1. Exporteer het verzuimoverzicht uit SomToday als `.xls`-bestand.
2. Klik op "Verzuim importeren" en selecteer het `.xls`-bestand.
3. Verzuimgegevens worden gekoppeld aan de bestaande leerlingen op basis van naam.

### BPV stage (Excel)

1. Exporteer het BPV-overzicht als Excel-bestand vanuit SomToday.
2. Klik op "BPV importeren" en selecteer het bestand.
3. Zorg dat het bestand de kolommen bevat die de app verwacht (zie Bekende beperkingen).

## Dashboard bekijken

Bovenin het scherm staan klas-tabs waarmee je wisselt tussen klassen. Per klas zie je tegels voor elke leerling met kleurcodering op basis van de doorstroomprognose: groen (positief), oranje (aandacht), rood (negatief). Klik op een tegel om de detailweergave te openen — daar vind je de deelgebieden, het verzuim en de doorstroomprognose op één scherm. De printknop in de detailweergave stuurt de pagina naar de printer of slaat deze op als PDF voor het mentorgesprek.

## Bekende beperkingen

- **BPV-kolom-herkenning:** de app verwacht specifieke kolomnamen uit het SomToday BPV-exportformaat. Als kolommen anders heten, worden BPV-gegevens niet ingelezen.
- **Rekenen en Nederlands:** deze sectie is optioneel in SomToday PDF-rapporten. Als de sectie ontbreekt in het rapport, worden die scores niet getoond in de app.
- **Geen automatische updates:** nieuwe versies moeten handmatig worden gedownload via de Releases pagina op GitHub.

## Bug melden

Gebruik de **🐛 Fout melden**-knop in de navigatiebalk bovenin de app. Dit opent je e-mailprogramma met het volgende adres al ingevuld: ralvarezstam@cioszuidwest.nl

Geef in je e-mail zo duidelijk mogelijk aan:

- Wat je deed op het moment van de fout
- Wat er mis ging (foutmelding, onverwacht gedrag)
- Op welk besturingssysteem je werkt (Windows / macOS)

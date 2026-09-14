# Security Review — Mentordashboard CIOS v2.5.0
Datum: 2026-06-06

> **Archief.** Getrieerd tegen `master` @ `59008a9` (v2.11.4) op 2026-09-14. Regelnummers hieronder verwijzen naar v2.5.0.
>
> | # | Bevinding | Status | Bewijs |
> |---|---|---|---|
> | 1 | [CRITICAL] BPV-data onversleuteld | ✅ Opgelost | `utils/bpv.ts:120,149` encrypt/decrypt via `*_klassen`-commando's, legacy-migratie |
> | 2 | [CRITICAL] Notities onversleuteld | ✅ Opgelost | `NotitiesTextarea.tsx` → `saveKlassen()`; eenmalige localStorage-migratie in `main.tsx:46-62` |
> | 3 | [CRITICAL] Null-dereference `loadSettings()` | ✅ Opgelost | `if (s)`-guard in `App.tsx` (PR #19) |
> | 4 | [HIGH] Entitlement `allow-unsigned-executable-memory` | ✅ Opgelost | `entitlements.plist` bevat alleen `allow-jit` |
> | 5 | [HIGH] GitHub `tag_name` als href | ✅ Opgelost | Eigen update-check vervangen door `tauri-plugin-updater`; `UpdateBanner.tsx` bestaat niet meer |
> | 6 | [HIGH] Geen bestandsgrootte-limiet | ✅ Opgelost | `ImportPage.tsx:333-335` (PDF 50 MB, Excel 10 MB, ZIP 100 MB) |
> | 7 | [HIGH] xlsx van CDN zonder integrity | ✅ Geaccepteerd | `package-lock.json` pint `sha512`-integrity; SheetJS-CDN is de officiële distributie |
> | 8 | [MEDIUM] Backup valideert klas-inhoud niet | ⏳ Open | Prototype-pollution-deel opgelost in PR #19; veldvalidatie → **TODO T-2026-09-14-01** |
> | 9 | [MEDIUM] console.error-buffer in feedback-mail | ✅ Geaccepteerd | Alle `console.error`-aanroepen loggen alleen foutobjecten/vaste teksten, geen persoonsgegevens |
> | 10 | [MEDIUM] Ghost theme `system` | ✅ Opgelost | Onbereikbare takken verwijderd (PR #19) |
> | 11 | [MEDIUM] Geen magic-bytes-check Excel | ✅ Geaccepteerd | `XLSX.read` in try/catch (`parsers/excel.ts:70-74`) → nette foutmelding; geen disk-write |
> | 12 | [LOW] `greet`-scaffoldcommando | ✅ Opgelost | Verwijderd (PR #19) |
> | 13 | [LOW] ZIP-pad-traversal | ✅ Geaccepteerd | `zipPdfs.ts:9` gebruikt alleen basename, in-memory `File`, geen disk-write |
> | 14 | [LOW] `onboardingCompleted` plaintext | ✅ Geaccepteerd | Boolean zonder persoonsgegevens |
> | 15 | [INFO] Repo-naam hardcoded | ✅ Opgelost | Niet meer aanwezig in `utils/`/`src/` |
> | 16 | [INFO] console.log in productie | ⏳ Open | Leerlingnamen verwijderd uit `datamodel.ts`; nog 45 `console.log` + bestandsnamen in `console.warn` → **TODO T-2026-09-14-02** |

---

## Samenvatting

De applicatie verwerkt persoonsgegevens van minderjarige studenten (namen, leerlingnummers, voortgangsscores, verzuimdata) in een Tauri v2 desktop-app (React + TypeScript + Rust). De review dekt alle tien gevraagde gebieden.

**Totaaloordeel:** De cryptografische kern (AES-256-GCM + OS keychain) is correct geïmplementeerd. De grootste beveiligingsrisico's zijn een architecturele inconsistentie in de dataopslag — BPV-data en notities worden onversleuteld naast versleutelde leerlingdata bewaard — gecombineerd met overly brede macOS entitlements en een onvolledige validatie van externe API-responses die als href worden gebruikt.

| Ernst      | Aantal |
|------------|--------|
| CRITICAL   | 3      |
| HIGH       | 4      |
| MEDIUM     | 4      |
| LOW        | 3      |
| INFO       | 2      |
| **Totaal** | **16** |

---

## Bevindingen

---

### [CRITICAL] BPV-persoonsdata onversleuteld in store.json

**Bestand:** `utils/bpv.ts:22-24, 137-141`

**Beschrijving:**
`bpv_data` wordt opgeslagen als `JSON.stringify(d)` direct in `store.json` zonder enige versleuteling. De sleutel `DATA_KEY = 'bpv_data'` bevat een `BpvData`-object gekeyed op `leerlingId`, met naam, locatieinformatie van stagebedrijf en uren per plaatsing. Dit zijn persoonsgegevens (AVG art. 4 lid 1) van minderjarige studenten die onversleuteld op schijf staan, terwijl de architectuur expliciet AES-256-GCM-versleuteling heeft gekozen voor leerlingdata (`utils/klassen.ts`).

Het bestand `store.json` bevat in hetzelfde JSON-document naast de versleutelde `klassen`-blob ook plaintext `bpv_data`, `settings`, `onboardingCompleted` etc. Een aanvaller met leestoegang tot het appdata-bestand (andere gebruiker op dezelfde machine, of malware) ziet direct leerlingIds met stagebedrijfnamen en uren.

**Risico:**
AVG art. 32-schending (passende technische maatregelen). Bij data-exfiltratie zijn leerlingnummers direct koppelbaar aan persoonsidentificerende informatie.

**Aanbeveling:**
Versleutel `bpv_data` via dezelfde `encrypt_klassen` / `decrypt_klassen` Rust-commando's als `klassen`:

```typescript
// saveBpvData — versleutel voor opslag
const ciphertext = await invoke<string>('encrypt_klassen', { plaintext: JSON.stringify(d) });
await store.set(DATA_KEY, ciphertext);

// getBpvData — ontsleutel na laden
const ciphertext = await store.get<string>(DATA_KEY);
if (ciphertext) {
  const plaintext = await invoke<string>('decrypt_klassen', { ciphertext });
  _dataCache = JSON.parse(plaintext) as BpvData;
}
```

---

### [CRITICAL] Notities van mentor onversleuteld bewaard (localStorage + klassen-store)

**Bestand:** `src/components/NotitiesTextarea.tsx:41`, `utils/klassen.ts:158-161`

**Beschrijving:**
Mentor-notities (vrije tekst over individuele leerlingen) worden opgeslagen op twee plaatsen:
1. Legacy: `localStorage.setItem('mentordashboard_notities', JSON.stringify(parsed))` — plaintext in de browser-localStorage van het Tauri WebView-profiel.
2. Na migratie: als `student.notitie` ingebed in de `klassen`-blob die via `saveKlassen()` versleuteld wordt bewaard.

De migratiecode (lines 22-43) schrijft echter opnieuw naar `localStorage` als er nog andere leerlingen over zijn (`localStorage.setItem` op regel 41). Hierdoor blijven notities van andere leerlingen onversleuteld in `localStorage` totdat hun detailpagina voor het eerst geopend wordt.

Notities kunnen inhoud bevatten over gedrags- of gezondheidsaspecten van minderjarige studenten (bijzondere categorieën AVG art. 9).

**Risico:**
Gevoelige mentornotities persistent onversleuteld toegankelijk voor elke lokale gebruiker of applicatie met toegang tot het WebView-profiel.

**Aanbeveling:**
Voer een éénmalige bulk-migratie uit bij app-start (in `main.tsx`, vóór React mount) die alle notities uit `localStorage` direct naar de versleutelde store verplaatst:

```typescript
// In main.tsx, na loadKlassen():
const legacyNotes = localStorage.getItem('mentordashboard_notities');
if (legacyNotes) {
  try {
    const parsed = JSON.parse(legacyNotes);
    // schrijf alle notities naar records, sla op, verwijder localStorage-key
    localStorage.removeItem('mentordashboard_notities');
    await saveKlassen();
  } catch { /* ignore */ }
}
```

Verwijder daarna de incrementele migratiecode uit `NotitiesTextarea.tsx`.

---

### [CRITICAL] Null-dereference op loadSettings() in App.tsx — silent data loss risk

**Bestand:** `src/App.tsx:35-40`

**Beschrijving:**
`loadSettings()` retourneert `Promise<{ theme: Theme } | null>` (zie `utils/settings.ts:22-24`). Bij eerste start, of wanneer de plugin-store leeg is, retourneert de functie `null`. Op regel 35-40 van `App.tsx` wordt `s` zonder null-check direct gebruikt:

```typescript
const s = await loadSettings();
const dark =
  s.theme === 'dark' ||          // TypeError: Cannot read properties of null
  (s.theme === 'system' && ...);
applyTheme(s.theme ?? 'light');  // TypeError: bereikt nooit
```

Dit gooit een `TypeError` die door de omliggende `catch`-block wordt geslikt (regel 41-43). De catch-block logt niets voor het thema-pad en herstelt niet. De gebruiker ziet een witte/ongekleurde app. Ernstiger: deze catch-block omsluit ook de `checkForUpdate()`-aanroep, wat betekent dat update-checks ook stil falen als `loadSettings()` null teruggeeft.

**Risico:**
Geen direct beveiligingsrisico, maar de stille fout maskeert toekomstige state-corruptie en de catch-pattern is onbetrouwbaar voor kritieke initialisatie-code.

**Aanbeveling:**
```typescript
const s = await loadSettings();
if (s) {
  const dark = s.theme === 'dark' ||
    (s.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  setIsDark(dark);
  applyTheme(s.theme ?? 'light');
}
// checkForUpdate buiten de zelfde try-block zetten
```

---

### [HIGH] macOS entitlement `allow-unsigned-executable-memory` is te breed

**Bestand:** `src-tauri/entitlements.plist:5-9`

**Beschrijving:**
Het plist bevat twee entitlements:
- `com.apple.security.cs.allow-jit` — vereist voor bepaalde JIT-compilers (legitiem voor WebKit/V8)
- `com.apple.security.cs.allow-unsigned-executable-memory` — staat het aanmaken van uitvoerbaar geheugen toe zonder JIT

De tweede entitlement is breder dan nodig. `allow-jit` volstaat voor Tauri/WebKit. `allow-unsigned-executable-memory` schakelt een deel van macOS Hardened Runtime-bescherming uit en vergroot de aanvalsoppervlakte voor code-injectie als de app gecompromitteerd wordt. Apple's Gatekeeper weigert apps met beide entitlements bij notarisatie via het reguliere kanaal.

Gecombineerd met `signingIdentity: "-"` (ad-hoc signing, geen Apple Developer certificate) betekent dit dat Gatekeeper op macOS volledig wordt overgeslagen op andere machines. Bij verspreiding buiten de eigen machine kan een gebruiker de app uitvoeren zonder enige authenticiteitscontrole.

**Risico:**
Code-injectie via geheugenmanipulatie; geen authenticiteitsgarantie bij verspreiding.

**Aanbeveling:**
Verwijder `com.apple.security.cs.allow-unsigned-executable-memory` uit `entitlements.plist`. Schakel over naar een geldig Apple Developer certificate voor verspreiding buiten de ontwikkelmachine:

```xml
<dict>
  <key>com.apple.security.cs.allow-jit</key>
  <true/>
  <!-- allow-unsigned-executable-memory: verwijderd -->
</dict>
```

Stel `signingIdentity` in op een geldig Developer ID voor productiebuilds.

---

### [HIGH] GitHub API `tag_name` niet gevalideerd vóór gebruik als href

**Bestand:** `utils/updateCheck.ts:33-37`, `src/components/UpdateBanner.tsx:29`

**Beschrijving:**
De `tag_name`-waarde uit de GitHub Releases API wordt na een lege-string-check direct gebruikt in een URL-template en als `href` in een anchor-element:

```typescript
// updateCheck.ts:33-37
const tag: string = data.tag_name ?? '';
if (!tag || !isNewer(tag, current)) return null;
return {
  url: `https://github.com/${REPO}/releases/tag/${tag}`,
};

// UpdateBanner.tsx:29
<a href={url} target="_blank" rel="noreferrer">
```

De `REPO`-constante is hardcoded, maar `tag` is volledig onder controle van de API-responder. Als de GitHub-repo gecompromitteerd wordt (of bij een DNS/MITM-aanval ondanks HTTPS), kan `tag_name` een waarde bevatten als `../../../../evil` die de padstructuur van de URL manipuleert, of (minder waarschijnlijk in moderne browsers) een `javascript:`-scheme-URL.

Tevens: `data.tag_name` wordt zonder type-check gebruikt. `data` is het ruwe resultaat van `res.json()` zonder validatie van de response-shape. Als de server een array, null, of een object zonder `tag_name` retourneert, faalt `data.tag_name ?? ''` zonder fout, maar andere velden die eventueel in toekomstige code worden gebruikt zijn ongecontroleerd.

**Risico:**
Bij gecompromitteerde GitHub-account of supply-chain-aanval: potentiële redirect naar kwaadaardige URL die in de Tauri WebView-context wordt geopend.

**Aanbeveling:**
```typescript
// Valideer tag_name als semver-patroon vóór gebruik
const TAG_PATTERN = /^v?\d+\.\d+\.\d+$/;

const tag: string = typeof data?.tag_name === 'string' ? data.tag_name : '';
if (!tag || !TAG_PATTERN.test(tag) || !isNewer(tag, current)) return null;

// URL constructie is dan veilig: tag bevat alleen cijfers, punten en optionele 'v'
return {
  version: tag.replace(/^v/, ''),
  url: `https://github.com/${REPO}/releases/tag/${encodeURIComponent(tag)}`,
};
```

---

### [HIGH] Geen validatie van bestandsgrootte bij uploads

**Bestand:** `src/components/ImportPage.tsx:330-360`

**Beschrijving:**
De `handleFiles`-functie accepteert `.pdf`, `.xls`, `.xlsx` en `.zip`-bestanden zonder enige controle op bestandsgrootte. Een gebruiker (of drag-and-drop aanval) kan een bestand van meerdere gigabytes droppen, waarna:
- `file.arrayBuffer()` de volledige inhoud in geheugen laadt
- PDF.js elke pagina verwerkt
- JSZip de gehele ZIP in geheugen uitpakt

Voor een ZIP die een grote backup bevat of vele PDF's, kan dit leiden tot geheugenuitputting en het crashen van de Tauri-applicatie.

In het bijzonder: `extractPdfsFromZip` (regel 371) laadt de volledige ZIP in geheugen en extraheert vervolgens alle PDF-blobs, ook. Er is geen limiet op het aantal bestanden in de ZIP of de totale gedecomprimeerde grootte.

**Risico:**
Denial-of-service door geheugenuitputting; app-crash verlies van onopgeslagen data.

**Aanbeveling:**
```typescript
const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

for (const file of files) {
  if (file.size > MAX_FILE_SIZE) {
    warnings.push(`${file.name}: bestand te groot (max ${MAX_FILE_SIZE_MB} MB)`);
    continue;
  }
  // ... rest van verwerking
}
```
Voeg ook een limiet toe op het aantal bestanden in een ZIP (bijv. max 200 PDF's).

---

### [HIGH] xlsx geladen van externe CDN zonder subresource integrity

**Bestand:** `package.json:40`

**Beschrijving:**
De `xlsx`-library wordt geladen van `https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz` in plaats van de npm-registry. Het `package-lock.json` bevat een `integrity`-hash (`sha512-...`), dus de installatie is deterministisch. Het risico zit in de supply chain: `cdn.sheetjs.com` wordt beheerd door de xlsx-auteur, niet door npm. Als dit domein gecompromitteerd wordt vóór de eerstvolgende `npm install`, wordt een kwaadaardige versie geïnstalleerd. npm-registry-pakketten hebben extra verificatielagen (Sigstore, npm audit).

SheetJS heeft in het verleden controversieel licentiebeleid toegepast (overstap van Apache-2.0 naar SSPL/proprietary voor nieuwe versies). De gebruikte versie (0.20.3) van de CDN valt buiten de reguliere npm-beveiligingsscanning (`npm audit` rapporteert geen kwetsbaarheden voor dit pakket).

**Risico:**
Supply chain compromis bij herinstallatie van dependencies; `npm audit` detecteert geen kwetsbaarheden in dit pakket.

**Aanbeveling:**
Gebruik de npm-mirror van SheetJS (`xlsx` op npmjs.com) als die beschikbaar is voor de benodigde versie, of pin expliciet de SHA512-hash en voeg een CI-stap toe die de hash verifieert. Overweeg alternatieven als `exceljs` of `@xlsx-js/xlsx` vanuit de officiële npm-registry.

---

### [MEDIUM] Backup restore valideert de inhoud van klassen-objecten niet

**Bestand:** `utils/backup.ts:46-64`

**Beschrijving:**
Bij een backup restore wordt het `payload.klassen`-object direct in `klassenState.klassen` gezet (`klassenState.klassen = payload.klassen`) na slechts een top-level type-check:

```typescript
if (!payload || typeof payload !== 'object' ||
    typeof payload.klassen !== 'object' || Array.isArray(payload.klassen)) {
  return { success: false, message: 'Ongeldige backup structuur' };
}
klassenState.klassen = payload.klassen; // geen diepere validatie
```

De inhoud van elk klas-object (velden als `naam`, `students`, `id`) wordt niet gevalideerd. Een kwaadaardig backup-bestand (of een gecorrupte backup) kan:
- Klassen zonder `id` of `naam`-veld injecteren die downstream crashes veroorzaken
- `students`-arrays met willekeurige structuur injecteren die de prognose-berekeningen en AVG-export beïnvloeden
- Prototype-pollution via `__proto__` of `constructor`-keys in het klassen-object (hoewel `JSON.parse` dit normaliter afvangt)

**Risico:**
Corrupt data-state na het laden van een onbetrouwbare backup; potentieel logicamisbruik.

**Aanbeveling:**
Voeg minimale validatie toe per klas-entry en per student-record:
```typescript
for (const [id, klas] of Object.entries(payload.klassen)) {
  if (typeof (klas as any).id !== 'string' ||
      typeof (klas as any).naam !== 'string' ||
      !Array.isArray((klas as any).students)) {
    return { success: false, message: `Ongeldige klas-structuur voor ID: ${id}` };
  }
}
```

---

### [MEDIUM] Console.error-buffer in feedback-e-mail kan foutmeldingen met context bevatten

**Bestand:** `utils/feedback.ts:45-57`, `src/main.tsx:17-23`, `utils/klassen.ts:21,164,196`

**Beschrijving:**
`main.tsx` patcht `console.error` om alle foutmeldingen in een ring-buffer op te slaan. Deze buffer wordt via `buildMailtoUrl` in de body van een feedback-e-mail gezet en verstuurd naar `ralvarezstam@cioszuidwest.nl`.

De volgende `console.error`-aanroepen in `klassen.ts` bevatten potentieel gevoelige informatie:
- `'[klassen.ts] Opslag fout:'` + `message` — de message-parameter bevat foutdetails van de keychain
- `'[klassen.ts] saveKlassen mislukt:'` + `e` — de exception `e` kan de JSON-payload als string bevatten (bijv. in V8-stacktraces)
- `'[klassen.ts] loadKlassen mislukt:'` + `e` — zelfde risico

Hoewel de feedback via `mailto:` verstuurd wordt (dus de gebruiker ziet en goedkeurt de inhoud), is de buffer statisch en niet per-sessie gereset. Errors van een eerdere leerlingweergave kunnen in de buffer staan als de gebruiker later feedback stuurt.

**Risico:**
Onbedoeld lekken van foutdetails met technische context over leerlingdata naar de ontwikkelaar via e-mail; AVG-aandachtspunt voor data-minimisatie.

**Aanbeveling:**
Verwijder of safestrip de `e`-object-serialisatie uit error-log aanroepen in `klassen.ts`:
```typescript
// In plaats van:
console.error('[klassen.ts] saveKlassen mislukt:', e);
// Gebruik:
console.error('[klassen.ts] saveKlassen mislukt — zie logboek voor details');
```
Overweeg de error-buffer bij het sluiten van een leerling-detailweergave te wissen.

---

### [MEDIUM] `system` is een ghost theme-waarde: type-mismatch in App.tsx en SettingsPage.tsx

**Bestand:** `utils/settings.ts:14`, `src/App.tsx:38`, `src/components/SettingsPage.tsx:134`

**Beschrijving:**
`Theme` is gedefinieerd als `'dark' | 'light'` in `utils/settings.ts:14`. In `App.tsx:38` en `SettingsPage.tsx:134` wordt echter de waarde `'system'` vergeleken:

```typescript
// App.tsx:38 — s.theme kan nooit 'system' zijn per type definitie
(s.theme === 'system' && window.matchMedia(...).matches)

// SettingsPage.tsx:134 — theme is 'dark'|'light', nooit 'system'
(theme === 'system' && window.matchMedia(...).matches)
```

Deze controles zijn dode code. Als een oude opgeslagen waarde `'system'` ooit vanuit localStorage wordt gelezen (vóór de type-definitie werd beperkt), wordt die waarde doorgegeven aan `applyTheme()`, die dan `theme === 'dark'` evalueert als `false` en de `dark`-class verwijdert — een incorrect resultaat.

**Risico:**
Onverwacht gedrag bij migratie van oude instellingen; mogelijke incorrect UI-state.

**Aanbeveling:**
Ofwel `'system'` toevoegen aan het `Theme`-type en de logica correct implementeren, of de `=== 'system'`-branches verwijderen en de `loadSettings`-migratie een unknown waarde normaliseren naar `'light'`.

---

### [MEDIUM] Geen validatie van bestandstype op basis van magic bytes voor verzuim-Excel

**Bestand:** `parsers/excel.ts:67-73`

**Beschrijving:**
`parseExcelFile()` accepteert elk bestand dat eindigt op `.xls` of `.xlsx` en geeft het direct aan `XLSX.read()`. Er is geen magic-byte-validatie (in tegenstelling tot `parseBpvExcel()` in `utils/bpv.ts:179-183` die wél de eerste 4 bytes controleert). SheetJS heeft in het verleden kwetsbaarheden gehad bij het verwerken van kwaadaardige Excel-bestanden (bijv. CVE-2023-30533 in een verwante versie).

**Risico:**
Verwerking van een kwaadaardig Excel-bestand dat SheetJS-parser-kwetsbaarheden triggert.

**Aanbeveling:**
Voeg magic-byte-validatie toe aan het begin van `parseExcelFile()`, zoals reeds gedaan in `parseBpvExcel`:

```typescript
const bytes = new Uint8Array((await file.arrayBuffer()).slice(0, 8));
const isXlsx = bytes[0] === 0x50 && bytes[1] === 0x4B;
const isXls  = bytes[0] === 0xD0 && bytes[1] === 0xCF && bytes[2] === 0x11 && bytes[3] === 0xE0;
if (!isXlsx && !isXls) {
  throw new Error('Ongeldig bestandsformaat — geen Excel-bestand herkend');
}
```

---

### [LOW] `greet`-commando is een scaffold-leftover en blijft blootgesteld

**Bestand:** `src-tauri/src/lib.rs:6-8`, `src-tauri/src/lib.rs:17`

**Beschrijving:**
Het standaard Tauri-scaffolding `greet`-commando is nog aanwezig en geregistreerd als invoke-handler:

```rust
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}
// ...
.invoke_handler(tauri::generate_handler![greet, ...])
```

Dit commando neemt een willekeurige `name`-string aan en retourneert die in een format-string. Het is aanroepbaar vanuit de WebView via `invoke('greet', { name: '...' })`. Hoewel de functie momenteel geen schade aanricht, vergroot elke onnodige Rust-command het aanvalsoppervlak.

**Risico:**
Onnodig vergroot aanvalsoppervlak; verwarrend voor toekomstige audits.

**Aanbeveling:**
Verwijder de `greet`-functie volledig uit `lib.rs` en de `generate_handler!`-macro.

---

### [LOW] Zip-extractie (JSZip) valideert geen pad op traversal-karakter, maar risico is beperkt

**Bestand:** `utils/zipPdfs.ts:6-12`

**Beschrijving:**
Bij het uitpakken van PDF's uit een ZIP-bestand wordt de volledig pad-string uit de ZIP als bestandsnaam gebruikt na `path.split('/').pop()`:

```typescript
const name = path.split('/').pop() ?? path;
pdfFiles.push(new File([blob], name, { type: 'application/pdf' }));
```

`.pop()` na `split('/')` haalt de bestandsnaam op en verwijdert padcomponenten, wat path-traversal naar hogere directories effectief voorkomt voor dit in-memory gebruik. De bestanden worden niet naar schijf geschreven vanuit JavaScript — ze worden als `File`-objecten doorgegeven aan `parseSinglePDF()`.

Het risico is echter dat een ZIP met een entry genaamd `../../evil.pdf` de naam `evil.pdf` krijgt (veilig), maar een ZIP met een entry genaamd alleen `../evil.pdf` (zonder `split('/').pop()` effect) een onverwachte naam behoudt: `..` wordt dan de naam. Controleer dit edge-case.

**Aanbeveling:**
Voeg een expliciete check toe:
```typescript
const name = (path.split('/').pop() ?? path).replace(/^\.+/, '') || 'document.pdf';
if (!name.endsWith('.pdf')) continue; // extra guard
```

---

### [LOW] `onboardingCompleted` wordt als plaintext boolean bewaard naast versleutelde data

**Bestand:** `utils/klassen.ts:170-173`, `utils/klassen.ts:180`

**Beschrijving:**
`onboardingCompleted` (een boolean) wordt direct als plaintext in `store.json` opgeslagen (`store.set('onboardingCompleted', true)`). Hoewel dit op zichzelf geen persoonsdata is, bevestigt het de aanwezigheid van gebruikers-state in de store. Gecombineerd met de plaintext BPV-data (zie CRITICAL-bevinding 1) is het gehele `store.json`-bestand een gemengd plaintext/ciphertext-bestand.

**Aanbeveling:**
Dit is laag-risico in isolatie. Adresseer dit als onderdeel van de volledige versleutelingsstrategie voor de store (zie CRITICAL-bevinding 1).

---

### [INFO] Publieke GitHub-repository-naam hardcoded in updateCheck.ts

**Bestand:** `utils/updateCheck.ts:3`

**Beschrijving:**
```typescript
const REPO = 'Unframed7175/mentordashboard-cios';
```

De naam van de GitHub-gebruikersaccount is zichtbaar in de gebundelde applicatie. Voor een desktop-app is dit acceptabel en beoogd (publieke repo), maar het is een bewuste keuze die vastgelegd moet zijn.

**Risico:**
Geen direct beveiligingsrisico. De repo is publiek; de naam is niet gevoelig.

**Aanbeveling:**
Geen actie vereist als de repo bewust publiek is. Documenteer de keuze in `DECISIONS.md`.

---

### [INFO] Meerdere `console.log`-aanroepen actief in productiecode

**Bestand:** `utils/datamodel.ts:88`, `utils/bpv.ts:309`, `utils/deelgebieden.ts:129`, `utils/normen.ts:133`, `utils/leerlijnen.ts:117`, `utils/verzuimDrempels.ts:83`, `parsers/pdf.ts:38`, `parsers/excel.ts:227`

**Beschrijving:**
Module-load `console.log`-aanroepen en debug-logging zijn actief in productiebuilds (geen conditie op `import.meta.env.DEV`). Kritisch: `datamodel.ts:191` logt `v.naam + ' → ' + student.naam` (voornaam en achternaam van leerlingen) bij elke succesvolle verzuim-koppeling. Dit is weliswaar alleen in de browser DevTools zichtbaar (niet gecaptured door de feedback-buffer die alleen `console.error` onderschept), maar het is onwenselijk voor een AVG-context.

**Risico:**
Leerlingnamen zichtbaar in DevTools console; mogelijke onbedoelde logging naar toekomstige log-targets.

**Aanbeveling:**
Verwijder of gate alle `console.log`-aanroepen op `import.meta.env.DEV`:
```typescript
if (import.meta.env.DEV) console.log('[mergeVerzuim] ✓ ...');
```
Verwijder de student-naams-logging uit productiepad.

---

## Niet gevonden (schoon)

De volgende gebieden zijn expliciet gecontroleerd en geven geen bevindingen:

- **XSS in React-componenten:** Geen gebruik van `dangerouslySetInnerHTML`, `innerHTML`, of `document.write` gevonden in alle `.tsx`-bestanden. DOM-manipulatie in `klassen.ts` gebruikt `textContent` (veilig).
- **`target="_blank"` zonder `rel="noreferrer"`:** `UpdateBanner.tsx:30` heeft `rel="noreferrer"` correct aanwezig.
- **AES-256-GCM implementatie:** `crypto.rs` genereert een verse 12-byte nonce via `OsRng` bij elke encrypt-aanroep. De sleutel wordt correct opgeslagen in het OS keychain via `tauri-plugin-secure-storage`. De sleutel verlaat de Rust-laag niet.
- **Hardcoded secrets/credentials:** Geen wachtwoorden, API-keys of tokens gevonden in productiecode. De developer e-mail (`ralvarezstam@cioszuidwest.nl`) is bedrijfsinformatie, niet een secret.
- **SQL-injectie:** Niet van toepassing; geen SQL-database gebruikt.
- **Path traversal naar disk via ZIP:** De zip-extractie in `utils/zipPdfs.ts` schrijft niet naar disk vanuit JavaScript; bestanden worden in-memory als `File`-objecten doorgegeven.
- **Backup zip-slip (fflate):** `backup.ts` extraheert uitsluitend de hardcoded sleutel `'mentordashboard-backup.json'` via `extracted[BACKUP_FILENAME]` — geen iteratie over ZIP-entries, geen path-traversal risico.
- **Tauri capabilities overly broad:** De `default.json` capability beperkt zich tot `core:default`, `store:default`, `secure-storage:default`, `os:default`, `opener:default`. Er zijn geen filesystem-write of shell-commando-permissions aanwezig.
- **CSP-configuratie:** De CSP `script-src 'self'` zonder `'unsafe-eval'` of `'unsafe-inline'` is correct. `style-src 'unsafe-inline'` is acceptabel voor Tauri inline-styles. `connect-src` beperkt externe connecties correct tot alleen `api.github.com`.
- **`mergeVerzuim` achternaam-substring matching:** Hoewel de matching liberaal is (Strategy 4), is dit een functionele keuze, geen beveiligingsprobleem.
- **Semver-parsing in updateCheck:** `parseSemver` is robuust; `NaN` bij ontbrekende parts wordt behandeld via `?? 0`. Het risico zit in de upstream `tag_name`-validatie (zie HIGH-bevinding).

---

*Review uitgevoerd door: Claude (gsd-code-reviewer) — adversarial depth: deep*
*Scope: alle gewijzigde en relevante bronbestanden, inclusief Rust-backend, TypeScript-utils, parsers en React-componenten*

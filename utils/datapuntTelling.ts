// utils/datapuntTelling.ts — Gedeelde datapunt-tel-helper + 3 specialisaties (M42 T4/T5/T6b)
//
// D6: telDatapuntenMetPatroon(...) is generiek genoeg voor twee heel verschillende
// "in scope" / "voldoet"-vormen:
//   - telBetekenisvolBewegenProfHouding: matcher filtert op vak, eis filtert op score.
//   - telRekenDomeinen / alleLevelsBehaald: matcher filtert op naam-patroon, eis
//     filtert op inleverstatus.
// De letterlijke naam "...MetPatroon" dekt dus niet altijd een regex — de matcher-
// parameter is de caller's keuze (zie task-T4T5T6b-brief.md "Design correction").
//
// Investigatie vóór implementatie (zie task-T4T5T6b-report.md voor het volledige
// bewijs): exacte vak-naam 'Betekenisvol Bewegen' en kolomsleutel 'PrHo' zijn
// geverifieerd tegen een echte 2026/2027-PDF-export (niet uit het geheugen geraden).

import { normalizeRekenScore } from './schema';
import { isVoldoendeOfHoger, ONVOLDOENDE_INLEVER_STATUSSEN } from './prognosis';

// ---------------------------------------------------------------------------
// Lokale Datapunt-vorm
//
// utils/datamodel.ts documenteert Datapunt alleen via JSDoc @typedef (geen
// geëxporteerd TS-type) en vermeldt daar vak/datapunt/scores/fase. `status`
// ontbreekt in die JSDoc, maar wordt wel degelijk op elk Datapunt-object gezet
// (in-place) door parsers/pdf-enrich.ts (enrichDatapuntenStatus / enrichByProximity)
// — bevestigd door die code te lezen, niet aangenomen. utils/prognosis.ts leest
// dp.status ook al op dezelfde manier (regel ~156).
// ---------------------------------------------------------------------------
export interface Datapunt {
  vak: string;
  datapunt: string;
  scores: Record<string, string | null>;
  status?: string;
  fase?: number | null;
}

// ---------------------------------------------------------------------------
// telDatapuntenMetPatroon — gedeelde helper (D6)
// ---------------------------------------------------------------------------
export function telDatapuntenMetPatroon(
  datapunten: Datapunt[],
  matcher: (dp: Datapunt) => boolean,
  voldoetAanEis: (dp: Datapunt) => boolean,
): { totaal: number; voldoet: number } {
  let totaal = 0;
  let voldoet = 0;
  for (const dp of datapunten || []) {
    if (!matcher(dp)) continue;
    totaal++;
    if (voldoetAanEis(dp)) voldoet++;
  }
  return { totaal, voldoet };
}

// ---------------------------------------------------------------------------
// Gedeelde "positief ingeleverd/afgerond"-check.
//
// Hergebruikt exact dezelfde ONVOLDOENDE_INLEVER_STATUSSEN-definitie als
// utils/prognosis.ts (T06) i.p.v. een nieuwe status-vocabulaire te verzinnen:
// een datapunt telt als afgerond zodra het een niet-lege status heeft die niet
// in die negatieve set voorkomt.
// ---------------------------------------------------------------------------
function isPositiefIngeleverd(dp: Datapunt): boolean {
  const status = (dp.status || '').toLowerCase().trim();
  if (status === '') return false;
  return !ONVOLDOENDE_INLEVER_STATUSSEN.has(status);
}

// ---------------------------------------------------------------------------
// telBetekenisvolBewegenProfHouding
//
// Matcher: dp.vak === 'Betekenisvol Bewegen' (exact, geen "(Praktijk)"-suffix —
// dat laatste is een ANDER vak: de sportvakken-opdrachttabel met losse
// sportonderdelen zoals "P&O Hockey", bevestigd in tests/pdf.columnAssignment.test.ts
// en in de echte "Aron Test"-PDF).
// Eis: isVoldoendeOfHoger(dp.scores['PrHo']) — hergebruikt de bestaande
// voldoende/goed/excellent-logica uit utils/prognosis.ts.
// ---------------------------------------------------------------------------
export function telBetekenisvolBewegenProfHouding(
  datapunten: Datapunt[],
): { totaal: number; voldoet: number } {
  return telDatapuntenMetPatroon(
    datapunten,
    dp => dp.vak === 'Betekenisvol Bewegen',
    dp => isVoldoendeOfHoger(dp.scores?.['PrHo'] ?? null),
  );
}

// ---------------------------------------------------------------------------
// telRekenDomeinen
//
// Matcher voor de domein-telling: naam bevat "Rekenen" ... "eindtoets domein"
// (case-insensitive, tolerant voor de "F<n> "-fase-prefix en de non-ASCII
// hyphen die in echte PDF's voor "eindtoets" staat, bv. "F2 Rekenen
// ‐eindtoets domein 1"). Eis: positieve inleverstatus (zelfde definitie als
// elders in deze module / in prognosis.ts).
//
// niveau: normalizeRekenScore(student.rekenResultaat) — hergebruikt de
// bestaande niveau-detectie uit utils/schema.ts i.p.v. die opnieuw te bouwen.
// ---------------------------------------------------------------------------
const REKEN_DOMEIN_RE = /Rekenen.*eindtoets domein/i;

export function telRekenDomeinen(
  student: { datapunten?: Datapunt[]; rekenResultaat?: unknown } | null | undefined,
): { domeinenAfgerond: number; niveau: 'goed' | 'voldoende' | 'onvoldoende' | null } {
  const datapunten = student?.datapunten || [];
  const { voldoet } = telDatapuntenMetPatroon(
    datapunten,
    dp => REKEN_DOMEIN_RE.test(dp.datapunt),
    dp => isPositiefIngeleverd(dp),
  );
  return {
    domeinenAfgerond: voldoet,
    niveau: normalizeRekenScore(student?.rekenResultaat),
  };
}

// ---------------------------------------------------------------------------
// alleLevelsBehaald
//
// Matcher: naam bevat "level <n>" als los woord, ongeacht of de activiteit
// ervoor of erna staat ("Level 2 lesgeven" ÓF "Organiseren level 2") — in
// beide varianten staat "level" onmiddellijk vóór het cijfer, dus een simpele
// woordgrens-regex dekt allebei zonder aparte permutatie-logica nodig te
// hebben. \b na het cijfer voorkomt dat level 1 "Level 10" matcht.
//
// Eis: positieve inleverstatus. Retourneert true alleen als totaal > 0 (er
// minstens één matchend datapunt is gevonden) ÉN voldoet === totaal (alles
// afgerond) — een leeg zoekresultaat (nog geen Level-N-datapunten dit jaar)
// is expliciet "nog niet behaald" (false), niet vacuously true.
// ---------------------------------------------------------------------------
export function alleLevelsBehaald(datapunten: Datapunt[], level: number): boolean {
  const levelRe = new RegExp(`\\blevel\\s*${level}\\b`, 'i');
  const { totaal, voldoet } = telDatapuntenMetPatroon(
    datapunten,
    dp => levelRe.test(dp.datapunt),
    dp => isPositiefIngeleverd(dp),
  );
  return totaal > 0 && voldoet === totaal;
}

// ---------------------------------------------------------------------------
// telLevelsAfgerond — M42 T8 (ADR-17c Roosendaal-levels-COUNT, niet single-level)
//
// alleLevelsBehaald() hierboven checkt "zijn ALLE datapunten voor ÉÉN
// specifiek level-nummer afgerond" (single-level, all-or-nothing). T8's
// Roosendaal-eisen ("minimaal N levels afgerond") zijn een heel andere vraag:
// "hoeveel datapunten VAN ELK level-nummer samen zijn afgerond" (een COUNT
// over alle level-nummers heen, niet één specifiek level). alleLevelsBehaald
// past dus niet — vandaar deze aparte, kleine telfunctie i.p.v. het bestaande
// signatuur te misbruiken. Matcher: naam bevat "level <n>" voor willekeurig
// welk cijfer (zelfde brede woordgrens-regex-aanpak als hierboven, maar zonder
// een specifiek level-nummer erin te bakken). Eis: positieve inleverstatus
// (zelfde isPositiefIngeleverd als alleLevelsBehaald/telRekenDomeinen).
// ---------------------------------------------------------------------------
const ANY_LEVEL_RE = /\blevel\s*\d+\b/i;
const LEVEL_NUMBER_RE = /\blevel\s*(\d+)\b/i;

// M42 review-fix (red-team finding, verified against the real Roosendaal
// sample PDFs — "Rapport ... Beij" en "... Benders", pagina "Extern
// praktijkleren"): een level-NUMMER is een milestone opgebouwd uit MEERDERE
// aparte activiteit-datapunten (lesgeven/organiseren/begeleiden/promoten —
// tot 4 per level, groeiend gedurende het jaar, ADR-17b). "Minimaal N levels
// afgerond" betekent dus "N VERSCHILLENDE level-nummers waarvan ALLE
// bijbehorende activiteiten zijn afgerond" — niet een ruwe telling van
// individuele afgeronde activiteit-datapunten. De oorspronkelijke
// implementatie (telDatapuntenMetPatroon over ANY_LEVEL_RE) telde elke
// afgeronde "Level N <activiteit>" apart, dus 1 volledig afgerond level (4/4
// activiteiten) telde als 4 — een leerling kon de BJ1-Roosendaal-drempel
// (bv. "minimaal 4 levels afgerond") daardoor al halen met slechts 1 echt
// afgerond level-milestone i.p.v. 4, tot 4x te soepel.
export function telLevelsAfgerond(datapunten: Datapunt[]): number {
  const levelNummers = new Set<number>();
  for (const dp of datapunten ?? []) {
    const match = LEVEL_NUMBER_RE.exec(dp.datapunt);
    if (match) levelNummers.add(Number(match[1]));
  }
  let afgerond = 0;
  for (const nummer of levelNummers) {
    if (alleLevelsBehaald(datapunten, nummer)) afgerond++;
  }
  return afgerond;
}

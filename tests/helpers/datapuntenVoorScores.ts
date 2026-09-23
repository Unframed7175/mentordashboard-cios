// tests/helpers/datapuntenVoorScores.ts — M43 T3 (regressiecontract R4a)
//
// Sinds M43 lezen de prognose-engines het eindoordeel per deelgebied uit
// student.datapunten (berekenEindoordelen, S/C-formule), niet meer uit
// student.deelgebiedScores. Oudere fixtures beschrijven een leerling nog als
// { deelgebiedScores }. Deze helper zet zo'n map om naar precies één datapunt
// per beoordeeld deelgebied. Met één beoordeling geeft de formule exact die
// beoordeling terug, dus de bestaande verwachtingen blijven ongewijzigd geldig.
//
// fase: 0 — telt mee in het hele-record-eindoordeel, maar valt buiten elke
// fase-query (fase 2 / fase 3), zodat fase-specifieke fixtures in dezelfde
// test niet vervuild worden.

export function datapuntenVoorScores(scores: Record<string, string | null> | undefined): any[] {
  return Object.entries(scores ?? {})
    .filter(([, score]) => score !== null && score !== undefined)
    .map(([label, score]) => ({
      vak: 'Fixture',
      datapunt: `fixture ${label}`,
      fase: 0,
      scores: { [label]: score },
    }));
}

// Voegt de fixture-datapunten toe aan een student die (nog) deelgebiedScores gebruikt.
export function metScoreDatapunten<T extends { deelgebiedScores?: any; datapunten?: any[] }>(student: T): T {
  return { ...student, datapunten: [...(student.datapunten ?? []), ...datapuntenVoorScores(student.deelgebiedScores)] };
}

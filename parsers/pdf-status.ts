// parsers/pdf-status.ts — Cumlaude opdracht-statussen
// Losgekoppeld van pdf.ts zodat dit veilig importeerbaar is in Vitest (geen PDF.js-vendor).

export const STATUS_STRINGS = [
  'Op tijd ingeleverd en wel beoordeeld',
  'Te laat ingeleverd en wel beoordeeld',
  'Te laat ingeleverd en niet beoordeeld',
  'Niet beoordeelbaar (voldoet niet aan de minimale eisen)',
  'Niet beoordeelbaar',
  'Niet ingeleverd',
  'Zelfevaluatie afgerond',
  'Zelfevaluatie, niet afgerond',
  'Beoordeeld',
] as const;

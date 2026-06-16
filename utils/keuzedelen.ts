export type KdStatus = 'behaald' | 'haalbaar' | 'niet_behaald';

export type Basisjaar = 'bj1' | 'bj2';

export interface Keuzedeel {
  id: string;
  naam: string;
  status: KdStatus;
  basisjaar?: Basisjaar;
}

// Worst-case aggregation: niet_behaald > haalbaar > behaald.
// Returns null when the list is empty (not entered).
export function aggregateKdStatus(keuzedelen: Keuzedeel[]): KdStatus | null {
  if (!keuzedelen || keuzedelen.length === 0) return null;
  if (keuzedelen.some(k => k.status === 'niet_behaald')) return 'niet_behaald';
  if (keuzedelen.every(k => k.status === 'behaald')) return 'behaald';
  return 'haalbaar';
}

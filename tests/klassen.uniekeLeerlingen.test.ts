import { describe, it, expect } from 'vitest';
import { countUniekeLeerlingen } from '../utils/klassen';

describe('countUniekeLeerlingen', () => {
  it('telt leerling met 2 periodes als 1', () => {
    const students = [
      { leerlingId: 'abc' },
      { leerlingId: 'abc' },
    ];
    expect(countUniekeLeerlingen(students)).toBe(1);
  });

  it('telt 3 leerlingen elk met 2 periodes als 3', () => {
    const students = [
      { leerlingId: 'a' }, { leerlingId: 'a' },
      { leerlingId: 'b' }, { leerlingId: 'b' },
      { leerlingId: 'c' }, { leerlingId: 'c' },
    ];
    expect(countUniekeLeerlingen(students)).toBe(3);
  });

  it('geeft 0 bij undefined input', () => {
    expect(countUniekeLeerlingen(undefined)).toBe(0);
  });

  it('geeft 0 bij lege array', () => {
    expect(countUniekeLeerlingen([])).toBe(0);
  });

  it('telt 3 records met unieke leerlingIds als 3', () => {
    const students = [
      { leerlingId: 'x' },
      { leerlingId: 'y' },
      { leerlingId: 'z' },
    ];
    expect(countUniekeLeerlingen(students)).toBe(3);
  });

  it('telt records zonder leerlingId niet mee', () => {
    const students = [
      { leerlingId: 'a' },
      { leerlingId: null },
      {},
    ];
    expect(countUniekeLeerlingen(students)).toBe(1);
  });
});

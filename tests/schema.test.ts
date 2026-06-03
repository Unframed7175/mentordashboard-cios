// tests/schema.test.ts — Tests for normalizeRekenScore() and berekenNederlandsEindcijfer() in utils/schema.ts
import { describe, it, expect } from 'vitest';
import { normalizeRekenScore, berekenNederlandsEindcijfer } from '../utils/schema';

describe('normalizeRekenScore', () => {
  // Null / empty inputs
  it('returns null for null', () => expect(normalizeRekenScore(null)).toBe(null));
  it('returns null for undefined', () => expect(normalizeRekenScore(undefined)).toBe(null));
  it('returns null for empty string', () => expect(normalizeRekenScore('')).toBe(null));

  // 3F → goed
  it('returns goed for 3F', () => expect(normalizeRekenScore('3F')).toBe('goed'));
  it('returns goed for 3f (lowercase)', () => expect(normalizeRekenScore('3f')).toBe('goed'));
  it('returns goed for goed', () => expect(normalizeRekenScore('goed')).toBe('goed'));
  it('returns goed for G', () => expect(normalizeRekenScore('G')).toBe('goed'));

  // 2F → voldoende
  it('returns voldoende for 2F', () => expect(normalizeRekenScore('2F')).toBe('voldoende'));
  it('returns voldoende for 2f (lowercase)', () => expect(normalizeRekenScore('2f')).toBe('voldoende'));
  it('returns voldoende for voldoende', () => expect(normalizeRekenScore('voldoende')).toBe('voldoende'));
  it('returns voldoende for V', () => expect(normalizeRekenScore('V')).toBe('voldoende'));

  // 1F → onvoldoende
  it('returns onvoldoende for 1F', () => expect(normalizeRekenScore('1F')).toBe('onvoldoende'));
  it('returns onvoldoende for 1f (lowercase)', () => expect(normalizeRekenScore('1f')).toBe('onvoldoende'));
  it('returns onvoldoende for onvoldoende', () => expect(normalizeRekenScore('onvoldoende')).toBe('onvoldoende'));
  it('returns onvoldoende for O', () => expect(normalizeRekenScore('O')).toBe('onvoldoende'));
  it('returns onvoldoende for onv', () => expect(normalizeRekenScore('onv')).toBe('onvoldoende'));

  // Unknown → null
  it('returns null for unknown value', () => expect(normalizeRekenScore('unknown')).toBe(null));

  // Numeric grades — 999.9: ≥5.5 → voldoende, <5.5 → onvoldoende
  it('returns voldoende for numeric 5.5', () => expect(normalizeRekenScore('5.5')).toBe('voldoende'));
  it('returns voldoende for numeric 6.0', () => expect(normalizeRekenScore('6.0')).toBe('voldoende'));
  it('returns voldoende for numeric 10', () => expect(normalizeRekenScore('10')).toBe('voldoende'));
  it('returns voldoende for numeric 5.6', () => expect(normalizeRekenScore('5.6')).toBe('voldoende'));
  it('returns onvoldoende for numeric 5.4', () => expect(normalizeRekenScore('5.4')).toBe('onvoldoende'));
  it('returns onvoldoende for numeric 1', () => expect(normalizeRekenScore('1')).toBe('onvoldoende'));
  it('returns onvoldoende for numeric 0', () => expect(normalizeRekenScore('0')).toBe('onvoldoende'));
  it('returns voldoende for numeric number (not string) 7', () => expect(normalizeRekenScore(7)).toBe('voldoende'));
  it('returns onvoldoende for numeric number (not string) 3', () => expect(normalizeRekenScore(3)).toBe('onvoldoende'));
});

describe('berekenNederlandsEindcijfer (Phase 41)', () => {
  it('berekent eindcijfer als som / 2 bij 4 ingevulde onderdelen', () => {
    expect(berekenNederlandsEindcijfer('4', '3', '4', '3')).toBe(7);
  });

  it('eindcijfer 5.5 is exact: (3 + 2.5 + 3 + 2.5) / 2 = 5.5', () => {
    expect(berekenNederlandsEindcijfer('3', '2.5', '3', '2.5')).toBeCloseTo(5.5);
  });

  it('eindcijfer onder 5.5 → normalizeRekenScore geeft onvoldoende', () => {
    const cijfer = berekenNederlandsEindcijfer('2', '2', '2', '2'); // = 4
    expect(cijfer).toBe(4);
    expect(normalizeRekenScore(cijfer)).toBe('onvoldoende');
  });

  it('eindcijfer boven 5.5 → normalizeRekenScore geeft voldoende', () => {
    const cijfer = berekenNederlandsEindcijfer('4', '3.5', '4', '3.5'); // = 7.5
    expect(cijfer).toBe(7.5);
    expect(normalizeRekenScore(cijfer)).toBe('voldoende');
  });

  it('geeft null als lezen ontbreekt', () => {
    expect(berekenNederlandsEindcijfer(null, '3', '3', '3')).toBeNull();
  });

  it('geeft null als spreken ontbreekt', () => {
    expect(berekenNederlandsEindcijfer('3', null, '3', '3')).toBeNull();
  });

  it('geeft null als gesprekvoeren ontbreekt', () => {
    expect(berekenNederlandsEindcijfer('3', '3', null, '3')).toBeNull();
  });

  it('geeft null als schrijven ontbreekt', () => {
    expect(berekenNederlandsEindcijfer('3', '3', '3', null)).toBeNull();
  });

  it('geeft null bij lege strings (nog niet ingevuld)', () => {
    expect(berekenNederlandsEindcijfer('', '', '', '')).toBeNull();
  });

  it('geeft null als alle onderdelen undefined zijn', () => {
    expect(berekenNederlandsEindcijfer(undefined, undefined, undefined, undefined)).toBeNull();
  });
});

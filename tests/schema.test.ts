// tests/schema.test.ts — Tests for normalizeRekenScore() in utils/schema.ts
import { describe, it, expect } from 'vitest';
import { normalizeRekenScore } from '../utils/schema';

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

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
});

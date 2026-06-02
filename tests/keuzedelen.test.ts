import { describe, it, expect } from 'vitest';
import { aggregateKdStatus } from '../utils/keuzedelen';
import type { Keuzedeel } from '../utils/keuzedelen';

function kd(id: string, status: Keuzedeel['status']): Keuzedeel {
  return { id, naam: `KD-${id}`, status };
}

describe('aggregateKdStatus', () => {
  it('returns null for empty array', () => {
    expect(aggregateKdStatus([])).toBeNull();
  });

  it('returns behaald when single keuzedeel is behaald', () => {
    expect(aggregateKdStatus([kd('1', 'behaald')])).toBe('behaald');
  });

  it('returns haalbaar when single keuzedeel is haalbaar', () => {
    expect(aggregateKdStatus([kd('1', 'haalbaar')])).toBe('haalbaar');
  });

  it('returns niet_behaald when single keuzedeel is niet_behaald', () => {
    expect(aggregateKdStatus([kd('1', 'niet_behaald')])).toBe('niet_behaald');
  });

  it('returns behaald when all keuzedelen are behaald', () => {
    expect(aggregateKdStatus([kd('1', 'behaald'), kd('2', 'behaald')])).toBe('behaald');
  });

  it('returns haalbaar when mix of behaald and haalbaar', () => {
    expect(aggregateKdStatus([kd('1', 'behaald'), kd('2', 'haalbaar')])).toBe('haalbaar');
  });

  it('returns niet_behaald when any is niet_behaald (even if others are behaald)', () => {
    expect(aggregateKdStatus([kd('1', 'behaald'), kd('2', 'niet_behaald')])).toBe('niet_behaald');
  });

  it('niet_behaald takes precedence over haalbaar', () => {
    expect(aggregateKdStatus([kd('1', 'haalbaar'), kd('2', 'niet_behaald')])).toBe('niet_behaald');
  });

  it('returns niet_behaald with three keuzedelen where worst is niet_behaald', () => {
    expect(aggregateKdStatus([kd('1', 'behaald'), kd('2', 'haalbaar'), kd('3', 'niet_behaald')])).toBe('niet_behaald');
  });
});

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';

const { getMockKlassenState, setMockKlassenState, getMockSaveKlassen } = vi.hoisted(() => {
  let _state = { klassen: {} as Record<string, any>, activeKlasId: null as string | null };
  const _save = vi.fn().mockResolvedValue(true);
  return {
    getMockKlassenState: () => _state,
    setMockKlassenState: (s: typeof _state) => { _state = s; },
    getMockSaveKlassen: () => _save,
  };
});

vi.mock('../utils/klassen', () => ({
  get klassenState() { return getMockKlassenState(); },
  saveKlassen: (...args: any[]) => getMockSaveKlassen()(...args),
}));

import TrajectVeldenSection from '../src/components/TrajectVeldenSection';

function makeBj1Student(overrides: Record<string, any> = {}) {
  return { leerlingId: 'S1', naam: 'Test Student', periode: 'BJ1 Fase 1', leerjaar: '1', ...overrides };
}

function makeBj2Student(overrides: Record<string, any> = {}) {
  return { leerlingId: 'S1', naam: 'Test Student', periode: 'BJ2 Fase 2', leerjaar: '2', ...overrides };
}

function mountState(students: any[]) {
  setMockKlassenState({
    klassen: { klas1: { students } },
    activeKlasId: 'klas1',
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  getMockSaveKlassen().mockResolvedValue(true);
});

describe('TrajectVeldenSection — BJ1-only rendering', () => {
  it('renders for a BJ1 student', () => {
    const student = makeBj1Student();
    mountState([student]);
    render(<TrajectVeldenSection student={student} />);
    expect(screen.getByLabelText('WVO-traject')).toBeTruthy();
  });

  it('does NOT render for a BJ2 student', () => {
    const student = makeBj2Student();
    mountState([student]);
    const { container } = render(<TrajectVeldenSection student={student} />);
    expect(container.querySelector('*')).toBeNull();
    expect(screen.queryByLabelText('WVO-traject')).toBeNull();
  });
});

describe('TrajectVeldenSection — undefined/null normalization', () => {
  it('shows "nog niet ingevuld" (empty select value) when wvoTraject is undefined', () => {
    const student = makeBj1Student(); // wvoTraject never set
    mountState([student]);
    render(<TrajectVeldenSection student={student} />);
    const select = screen.getByLabelText('WVO-traject') as HTMLSelectElement;
    expect(select.value).toBe('');
  });

  it('shows "nog niet ingevuld" (empty select value) when wvoTraject is explicitly null', () => {
    const student = makeBj1Student({ wvoTraject: null });
    mountState([student]);
    render(<TrajectVeldenSection student={student} />);
    const select = screen.getByLabelText('WVO-traject') as HTMLSelectElement;
    expect(select.value).toBe('');
  });

  it('shows "ja" when wvoTraject is true', () => {
    const student = makeBj1Student({ wvoTraject: true });
    mountState([student]);
    render(<TrajectVeldenSection student={student} />);
    const select = screen.getByLabelText('WVO-traject') as HTMLSelectElement;
    expect(select.value).toBe('ja');
  });

  it('shows "nee" when wvoTraject is false', () => {
    const student = makeBj1Student({ wvoTraject: false });
    mountState([student]);
    render(<TrajectVeldenSection student={student} />);
    const select = screen.getByLabelText('WVO-traject') as HTMLSelectElement;
    expect(select.value).toBe('nee');
  });
});

describe('TrajectVeldenSection — persistence', () => {
  it('setting wvoTraject to true persists to ALL matching period-records in the active klas, not just one', async () => {
    const rec1 = makeBj1Student({ periode: 'BJ1 Fase 1' });
    const rec2 = makeBj1Student({ periode: 'BJ1 Fase 2' });
    mountState([rec1, rec2]);
    render(<TrajectVeldenSection student={rec1} />);

    const select = screen.getByLabelText('WVO-traject') as HTMLSelectElement;
    await act(async () => {
      fireEvent.change(select, { target: { value: 'ja' } });
      await new Promise(r => setTimeout(r, 0));
    });

    const klas = getMockKlassenState().klassen['klas1'];
    expect(klas.students.every((s: any) => s.wvoTraject === true)).toBe(true);
    expect(getMockSaveKlassen()).toHaveBeenCalledTimes(1);
  });

  it('setting wvoTraject to false persists correctly', async () => {
    const rec1 = makeBj1Student({ periode: 'BJ1 Fase 1', wvoTraject: true });
    const rec2 = makeBj1Student({ periode: 'BJ1 Fase 2', wvoTraject: true });
    mountState([rec1, rec2]);
    render(<TrajectVeldenSection student={rec1} />);

    const select = screen.getByLabelText('WVO-traject') as HTMLSelectElement;
    await act(async () => {
      fireEvent.change(select, { target: { value: 'nee' } });
      await new Promise(r => setTimeout(r, 0));
    });

    const klas = getMockKlassenState().klassen['klas1'];
    expect(klas.students.every((s: any) => s.wvoTraject === false)).toBe(true);
  });

  it('setting back to "nog niet ingevuld" persists null (not false)', async () => {
    const rec1 = makeBj1Student({ wvoTraject: true });
    mountState([rec1]);
    render(<TrajectVeldenSection student={rec1} />);

    const select = screen.getByLabelText('WVO-traject') as HTMLSelectElement;
    await act(async () => {
      fireEvent.change(select, { target: { value: '' } });
      await new Promise(r => setTimeout(r, 0));
    });

    const klas = getMockKlassenState().klassen['klas1'];
    expect(klas.students[0].wvoTraject).toBeNull();
  });
});

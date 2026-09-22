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

vi.mock('../utils/klassen', async () => {
  const actual = await vi.importActual<typeof import('../utils/klassen')>('../utils/klassen');
  return {
    ...actual,
    get klassenState() { return getMockKlassenState(); },
    saveKlassen: (...args: any[]) => getMockSaveKlassen()(...args),
    // actual.getMatchingRecords closes over the REAL module's own klassenState
    // singleton, not this mock's getter, so it must be overridden explicitly
    // to see the test's mounted state (same reason klassenState/saveKlassen are above).
    getMatchingRecords: (leerlingId: string) => {
      const state = getMockKlassenState();
      if (!state.activeKlasId) return [];
      const klas = state.klassen[state.activeKlasId];
      return klas?.students?.filter((s: any) => s.leerlingId === leerlingId) ?? [];
    },
  };
});

import RoosendaalTrajectSection from '../src/components/RoosendaalTrajectSection';

function makeBj1Student(overrides: Record<string, any> = {}) {
  return { leerlingId: 'S1', naam: 'Test Student', periode: 'BJ1 Fase 1', leerjaar: '1', ...overrides };
}

function makeBj2Student(overrides: Record<string, any> = {}) {
  return { leerlingId: 'S1', naam: 'Test Student', periode: 'BJ2 Fase 2', leerjaar: '2', ...overrides };
}

function mountState(students: any[], klasNaam: string, extra: Record<string, any> = {}) {
  setMockKlassenState({
    klassen: { klas1: { naam: klasNaam, students, ...extra } },
    activeKlasId: 'klas1',
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  getMockSaveKlassen().mockResolvedValue(true);
});

describe('RoosendaalTrajectSection — visibility', () => {
  it('renders nothing for a BJ1 student even in Roosendaal', () => {
    const student = makeBj1Student();
    mountState([student], 'CSR 1a');
    const { container } = render(<RoosendaalTrajectSection student={student} />);
    expect(container.querySelector('*')).toBeNull();
  });

  it('renders nothing for a BJ2 student in Goes', () => {
    const student = makeBj2Student();
    mountState([student], 'CSG 1a');
    const { container } = render(<RoosendaalTrajectSection student={student} />);
    expect(container.querySelector('*')).toBeNull();
  });

  it('renders nothing for a BJ2 student in Dordrecht', () => {
    const student = makeBj2Student();
    mountState([student], 'CSD 1a');
    const { container } = render(<RoosendaalTrajectSection student={student} />);
    expect(container.querySelector('*')).toBeNull();
  });

  it('renders nothing for a BJ2 student when vestiging is unrecognized (null, no override)', () => {
    const student = makeBj2Student();
    mountState([student], 'ZZZ 1a');
    const { container } = render(<RoosendaalTrajectSection student={student} />);
    expect(container.querySelector('*')).toBeNull();
  });

  it('renders the select for a BJ2 student in Roosendaal', () => {
    const student = makeBj2Student();
    mountState([student], 'CSR 2a');
    render(<RoosendaalTrajectSection student={student} />);
    expect(screen.getByLabelText('Roosendaal-traject')).toBeTruthy();
  });
});

describe('RoosendaalTrajectSection — persistence', () => {
  it('selecting "sbl" persists roosendaalTraject: "sbl" to ALL matching period-records', async () => {
    const rec1 = makeBj2Student({ periode: 'BJ2 Fase 1' });
    const rec2 = makeBj2Student({ periode: 'BJ2 Fase 2' });
    mountState([rec1, rec2], 'CSR 2a');
    render(<RoosendaalTrajectSection student={rec1} />);

    const select = screen.getByLabelText('Roosendaal-traject') as HTMLSelectElement;
    await act(async () => {
      fireEvent.change(select, { target: { value: 'sbl' } });
      await new Promise(r => setTimeout(r, 0));
    });

    const klas = getMockKlassenState().klassen['klas1'];
    expect(klas.students.every((s: any) => s.roosendaalTraject === 'sbl')).toBe(true);
    expect(getMockSaveKlassen()).toHaveBeenCalledTimes(1);
  });

  it('selecting "sbc" persists roosendaalTraject: "sbc" to ALL matching period-records', async () => {
    const rec1 = makeBj2Student({ periode: 'BJ2 Fase 1' });
    const rec2 = makeBj2Student({ periode: 'BJ2 Fase 2' });
    mountState([rec1, rec2], 'CSR 2a');
    render(<RoosendaalTrajectSection student={rec1} />);

    const select = screen.getByLabelText('Roosendaal-traject') as HTMLSelectElement;
    await act(async () => {
      fireEvent.change(select, { target: { value: 'sbc' } });
      await new Promise(r => setTimeout(r, 0));
    });

    const klas = getMockKlassenState().klassen['klas1'];
    expect(klas.students.every((s: any) => s.roosendaalTraject === 'sbc')).toBe(true);
  });

  it('selecting "nog niet gekozen" writes null (must be reversible from a chosen value)', async () => {
    const rec1 = makeBj2Student({ roosendaalTraject: 'sbl' });
    mountState([rec1], 'CSR 2a');
    render(<RoosendaalTrajectSection student={rec1} />);

    const select = screen.getByLabelText('Roosendaal-traject') as HTMLSelectElement;
    await act(async () => {
      fireEvent.change(select, { target: { value: '' } });
      await new Promise(r => setTimeout(r, 0));
    });

    const klas = getMockKlassenState().klassen['klas1'];
    expect(klas.students[0].roosendaalTraject).toBeNull();
  });

  it('respects a vestigingOverride even when the klasnaam prefix does not match Roosendaal', () => {
    const student = makeBj2Student();
    mountState([student], 'ZZZ 2a', { vestigingOverride: 'roosendaal' });
    render(<RoosendaalTrajectSection student={student} />);
    expect(screen.getByLabelText('Roosendaal-traject')).toBeTruthy();
  });
});

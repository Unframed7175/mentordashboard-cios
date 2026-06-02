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

import KeuzedeelSection from '../src/components/KeuzedeelSection';

function makeStudent(overrides: Record<string, any> = {}) {
  return { leerlingId: 'S1', naam: 'Test Student', ...overrides };
}

function mountState(student: any) {
  setMockKlassenState({
    klassen: { klas1: { students: [student] } },
    activeKlasId: 'klas1',
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  getMockSaveKlassen().mockResolvedValue(true);
});

describe('KeuzedeelSection — rendering', () => {
  it('renders section title "Keuzedelen"', () => {
    const student = makeStudent();
    mountState(student);
    render(<KeuzedeelSection student={student} />);
    expect(screen.getByText('Keuzedelen')).toBeTruthy();
  });

  it('renders the add form with naam input and status select', () => {
    const student = makeStudent();
    mountState(student);
    render(<KeuzedeelSection student={student} />);
    expect(document.getElementById('kd-nieuw-naam')).toBeTruthy();
    expect(document.getElementById('kd-nieuw-status')).toBeTruthy();
  });

  it('renders Toevoegen button', () => {
    const student = makeStudent();
    mountState(student);
    render(<KeuzedeelSection student={student} />);
    expect(screen.getByText('+ Toevoegen')).toBeTruthy();
  });

  it('Toevoegen button is disabled when naam input is empty', () => {
    const student = makeStudent();
    mountState(student);
    render(<KeuzedeelSection student={student} />);
    const btn = screen.getByText('+ Toevoegen') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('shows existing keuzedelen by naam', () => {
    const student = makeStudent({
      keuzedelen: [
        { id: '1', naam: 'Sport & bewegen', status: 'behaald' },
        { id: '2', naam: 'ICT techniek', status: 'haalbaar' },
      ],
    });
    mountState(student);
    render(<KeuzedeelSection student={student} />);
    expect(screen.getByText('Sport & bewegen')).toBeTruthy();
    expect(screen.getByText('ICT techniek')).toBeTruthy();
  });

  it('shows status badge for each keuzedeel', () => {
    const student = makeStudent({
      keuzedelen: [{ id: '1', naam: 'Sport', status: 'behaald' }],
    });
    mountState(student);
    render(<KeuzedeelSection student={student} />);
    // Badge + dropdown option both contain "Behaald" — verify at least one badge span exists
    const badges = screen.getAllByText('Behaald');
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it('renders a delete button for each keuzedeel', () => {
    const student = makeStudent({
      keuzedelen: [{ id: '1', naam: 'Sport', status: 'behaald' }],
    });
    mountState(student);
    render(<KeuzedeelSection student={student} />);
    expect(screen.getByLabelText('Verwijder Sport')).toBeTruthy();
  });
});

describe('KeuzedeelSection — add', () => {
  it('enables Toevoegen button when naam is typed', async () => {
    const student = makeStudent();
    mountState(student);
    render(<KeuzedeelSection student={student} />);
    const input = document.getElementById('kd-nieuw-naam') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Paardrijden' } });
    const btn = screen.getByText('+ Toevoegen') as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });

  it('adds keuzedeel to student and calls saveKlassen on click', async () => {
    const student = makeStudent();
    mountState(student);
    render(<KeuzedeelSection student={student} />);

    const input = document.getElementById('kd-nieuw-naam') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Paardrijden' } });

    await act(async () => {
      fireEvent.click(screen.getByText('+ Toevoegen'));
      await new Promise(r => setTimeout(r, 0));
    });

    const klas = getMockKlassenState().klassen['klas1'];
    const rec = klas.students.find((s: any) => s.leerlingId === 'S1');
    expect(Array.isArray(rec.keuzedelen)).toBe(true);
    expect(rec.keuzedelen.length).toBe(1);
    expect(rec.keuzedelen[0].naam).toBe('Paardrijden');
    expect(getMockSaveKlassen()).toHaveBeenCalledTimes(1);
  });

  it('clears naam input after adding', async () => {
    const student = makeStudent();
    mountState(student);
    render(<KeuzedeelSection student={student} />);

    const input = document.getElementById('kd-nieuw-naam') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Paardrijden' } });

    await act(async () => {
      fireEvent.click(screen.getByText('+ Toevoegen'));
      await new Promise(r => setTimeout(r, 0));
    });

    expect(input.value).toBe('');
  });

  it('adds with selected status', async () => {
    const student = makeStudent();
    mountState(student);
    render(<KeuzedeelSection student={student} />);

    const input = document.getElementById('kd-nieuw-naam') as HTMLInputElement;
    const statusSel = document.getElementById('kd-nieuw-status') as HTMLSelectElement;
    fireEvent.change(input, { target: { value: 'Paardrijden' } });
    fireEvent.change(statusSel, { target: { value: 'behaald' } });

    await act(async () => {
      fireEvent.click(screen.getByText('+ Toevoegen'));
      await new Promise(r => setTimeout(r, 0));
    });

    const klas = getMockKlassenState().klassen['klas1'];
    const rec = klas.students.find((s: any) => s.leerlingId === 'S1');
    expect(rec.keuzedelen[0].status).toBe('behaald');
  });

  it('adds on Enter key in naam input', async () => {
    const student = makeStudent();
    mountState(student);
    render(<KeuzedeelSection student={student} />);

    const input = document.getElementById('kd-nieuw-naam') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Paardrijden' } });

    await act(async () => {
      fireEvent.keyDown(input, { key: 'Enter' });
      await new Promise(r => setTimeout(r, 0));
    });

    const klas = getMockKlassenState().klassen['klas1'];
    const rec = klas.students.find((s: any) => s.leerlingId === 'S1');
    expect(rec.keuzedelen.length).toBe(1);
  });
});

describe('KeuzedeelSection — remove', () => {
  it('removes keuzedeel and calls saveKlassen on delete click', async () => {
    const student = makeStudent({
      keuzedelen: [{ id: 'kd1', naam: 'Sport', status: 'behaald' }],
    });
    mountState(student);
    render(<KeuzedeelSection student={student} />);

    await act(async () => {
      fireEvent.click(screen.getByLabelText('Verwijder Sport'));
      await new Promise(r => setTimeout(r, 0));
    });

    const klas = getMockKlassenState().klassen['klas1'];
    const rec = klas.students.find((s: any) => s.leerlingId === 'S1');
    expect(rec.keuzedelen.length).toBe(0);
    expect(getMockSaveKlassen()).toHaveBeenCalledTimes(1);
  });
});

describe('KeuzedeelSection — status change', () => {
  it('updates status in-place and calls saveKlassen', async () => {
    const student = makeStudent({
      keuzedelen: [{ id: 'kd1', naam: 'Sport', status: 'haalbaar' }],
    });
    mountState(student);
    render(<KeuzedeelSection student={student} />);

    const statusSel = screen.getByLabelText('Status van Sport') as HTMLSelectElement;
    await act(async () => {
      fireEvent.change(statusSel, { target: { value: 'behaald' } });
      await new Promise(r => setTimeout(r, 0));
    });

    const klas = getMockKlassenState().klassen['klas1'];
    const rec = klas.students.find((s: any) => s.leerlingId === 'S1');
    expect(rec.keuzedelen[0].status).toBe('behaald');
    expect(getMockSaveKlassen()).toHaveBeenCalledTimes(1);
  });
});

describe('KeuzedeelSection — saved hint', () => {
  it('shows "Opgeslagen" after successful add', async () => {
    const student = makeStudent();
    mountState(student);
    render(<KeuzedeelSection student={student} />);

    const input = document.getElementById('kd-nieuw-naam') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Paardrijden' } });

    await act(async () => {
      fireEvent.click(screen.getByText('+ Toevoegen'));
      await new Promise(r => setTimeout(r, 0));
    });

    expect(screen.getByText('Opgeslagen')).toBeTruthy();
  });
});

// tests/RekenenNederlandsSection.test.tsx
// 999.9: Rekenen numeric grade input (≥5.5 voldoende)
// 999.10: Nederlands 4 onderdelen + auto-computed eindcijfer (som/2)

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';

// ── hoisted shared state for klassenState mock ──────────────────────────────
const { getMockKlassenState, setMockKlassenState, getMockSaveKlassen } = vi.hoisted(() => {
  let _state = {
    klassen: {} as Record<string, any>,
    activeKlasId: null as string | null,
  };
  const _saveKlassen = vi.fn().mockResolvedValue(true);
  return {
    getMockKlassenState: () => _state,
    setMockKlassenState: (s: typeof _state) => { _state = s; },
    getMockSaveKlassen: () => _saveKlassen,
  };
});

vi.mock('../utils/klassen', () => ({
  get klassenState() { return getMockKlassenState(); },
  saveKlassen: (...args: any[]) => getMockSaveKlassen()(...args),
}));

import RekenenNederlandsSection from '../src/components/RekenenNederlandsSection';

// ── helpers ─────────────────────────────────────────────────────────────────
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

// ── rendering tests ──────────────────────────────────────────────────────────

describe('RekenenNederlandsSection — rendering', () => {

  it('renders section title "Rekenen & Nederlands"', () => {
    const student = makeStudent();
    mountState(student);
    render(<RekenenNederlandsSection student={student} />);
    expect(screen.getByText('Rekenen & Nederlands')).toBeTruthy();
  });

  it('renders a label "Rekenen"', () => {
    const student = makeStudent();
    mountState(student);
    render(<RekenenNederlandsSection student={student} />);
    expect(screen.getByText('Rekenen')).toBeTruthy();
  });

  it('renders a label "Nederlands"', () => {
    const student = makeStudent();
    mountState(student);
    render(<RekenenNederlandsSection student={student} />);
    expect(screen.getByText('Nederlands')).toBeTruthy();
  });

  it('renders Rekenen number input with id "rnl-rekenen"', () => {
    const student = makeStudent();
    mountState(student);
    render(<RekenenNederlandsSection student={student} />);
    const input = document.getElementById('rnl-rekenen') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.type).toBe('number');
  });

  it('renders Lezen/Luisteren input with id "rnl-nl-lezen"', () => {
    const student = makeStudent();
    mountState(student);
    render(<RekenenNederlandsSection student={student} />);
    const input = document.getElementById('rnl-nl-lezen') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.type).toBe('number');
  });

  it('renders Spreken input with id "rnl-nl-spreken"', () => {
    const student = makeStudent();
    mountState(student);
    render(<RekenenNederlandsSection student={student} />);
    const input = document.getElementById('rnl-nl-spreken') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.type).toBe('number');
  });

  it('renders Gesprekvoeren input with id "rnl-nl-gesprekvoeren"', () => {
    const student = makeStudent();
    mountState(student);
    render(<RekenenNederlandsSection student={student} />);
    const input = document.getElementById('rnl-nl-gesprekvoeren') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.type).toBe('number');
  });

  it('renders Schrijven input with id "rnl-nl-schrijven"', () => {
    const student = makeStudent();
    mountState(student);
    render(<RekenenNederlandsSection student={student} />);
    const input = document.getElementById('rnl-nl-schrijven') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.type).toBe('number');
  });

  it('Rekenen input defaults to empty when student.rekenResultaat is undefined', () => {
    const student = makeStudent();
    mountState(student);
    render(<RekenenNederlandsSection student={student} />);
    const input = document.getElementById('rnl-rekenen') as HTMLInputElement;
    expect(input.value).toBe('');
  });

  it('Rekenen input reflects numeric student.rekenResultaat value', () => {
    const student = makeStudent({ rekenResultaat: '7.5' });
    mountState(student);
    render(<RekenenNederlandsSection student={student} />);
    const input = document.getElementById('rnl-rekenen') as HTMLInputElement;
    expect(input.value).toBe('7.5');
  });

  it('shows auto-computed eindcijfer when all 4 onderdelen are set', () => {
    // (3 + 3 + 3 + 3) / 2 = 6.0
    const student = makeStudent({ nlLezen: '3', nlSpreken: '3', nlGesprekvoeren: '3', nlSchrijven: '3' });
    mountState(student);
    render(<RekenenNederlandsSection student={student} />);
    expect(screen.getByText(/Eindcijfer:/)).toBeTruthy();
    expect(screen.getByText(/6\.0/)).toBeTruthy();
  });

  it('does NOT show eindcijfer when not all onderdelen are filled', () => {
    const student = makeStudent({ nlLezen: '3', nlSpreken: '3' });
    mountState(student);
    render(<RekenenNederlandsSection student={student} />);
    expect(screen.queryByText(/Eindcijfer:/)).toBeNull();
  });

});

// ── normBadge tests ──────────────────────────────────────────────────────────

describe('RekenenNederlandsSection — normBadge', () => {

  it('shows no badge when rekenResultaat is null', () => {
    const student = makeStudent();
    mountState(student);
    render(<RekenenNederlandsSection student={student} />);
    const label = screen.getByText('Rekenen').closest('label');
    expect(label?.querySelector('span')).toBeNull();
  });

  it('shows "3F — goed" badge (green) for legacy rekenResultaat 3F', () => {
    const student = makeStudent({ rekenResultaat: '3F' });
    mountState(student);
    render(<RekenenNederlandsSection student={student} />);
    const badge = screen.getByText('3F — goed');
    expect(badge).toBeTruthy();
    expect((badge as HTMLElement).style.color).toBe('var(--status-groen-text)');
  });

  it('shows "2F — voldoende (norm)" badge (green) for legacy rekenResultaat 2F', () => {
    const student = makeStudent({ rekenResultaat: '2F' });
    mountState(student);
    render(<RekenenNederlandsSection student={student} />);
    const badge = screen.getByText('2F — voldoende (norm)');
    expect(badge).toBeTruthy();
    expect((badge as HTMLElement).style.color).toBe('var(--status-groen-text)');
  });

  it('shows "Onder norm" badge (red) for legacy nederlandsResultaat 1F', () => {
    const student = makeStudent({ nederlandsResultaat: '1F' });
    mountState(student);
    render(<RekenenNederlandsSection student={student} />);
    const badge = screen.getByText('Onder norm');
    expect(badge).toBeTruthy();
    expect((badge as HTMLElement).style.color).toBe('var(--status-rood-text)');
  });

  it('shows "Voldoende" badge (green) when rekenResultaat is numeric >= 5.5', () => {
    const student = makeStudent({ rekenResultaat: '7.5' });
    mountState(student);
    render(<RekenenNederlandsSection student={student} />);
    const badges = screen.getAllByText('Voldoende');
    expect(badges.length).toBeGreaterThan(0);
    expect((badges[0] as HTMLElement).style.color).toBe('var(--status-groen-text)');
  });

  it('shows "Onvoldoende" badge (red) when rekenResultaat is numeric < 5.5', () => {
    const student = makeStudent({ rekenResultaat: '4.0' });
    mountState(student);
    render(<RekenenNederlandsSection student={student} />);
    const badge = screen.getByText('Onvoldoende');
    expect(badge).toBeTruthy();
    expect((badge as HTMLElement).style.color).toBe('var(--status-rood-text)');
  });

});

// ── hint paragraph tests ─────────────────────────────────────────────────────

describe('RekenenNederlandsSection — hint paragraph', () => {

  it('shows norm text when both statuses are null and hint is idle', () => {
    const student = makeStudent();
    mountState(student);
    render(<RekenenNederlandsSection student={student} />);
    expect(screen.getByText('Norm: Rekenen ≥5.5 · Nederlands eindcijfer ≥5.5 (som / 2)')).toBeTruthy();
  });

  it('does NOT show norm text when rekenResultaat is set', () => {
    const student = makeStudent({ rekenResultaat: '7.5' });
    mountState(student);
    render(<RekenenNederlandsSection student={student} />);
    expect(screen.queryByText('Norm: Rekenen ≥5.5 · Nederlands eindcijfer ≥5.5 (som / 2)')).toBeNull();
  });

  it('shows "Opgeslagen" in green after successful save of Rekenen', async () => {
    const student = makeStudent();
    mountState(student);
    render(<RekenenNederlandsSection student={student} />);
    const input = document.getElementById('rnl-rekenen') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { value: '7.5' } });
      await new Promise(r => setTimeout(r, 0));
    });
    const hint = screen.getByText('Opgeslagen');
    expect(hint).toBeTruthy();
    const p = hint.closest('p');
    expect(p?.style.color).toBe('var(--status-groen-text)');
  });

  it('does NOT show "Opgeslagen" when saveKlassen returns false', async () => {
    getMockSaveKlassen().mockResolvedValue(false);
    const student = makeStudent();
    mountState(student);
    render(<RekenenNederlandsSection student={student} />);
    const input = document.getElementById('rnl-rekenen') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { value: '7.5' } });
      await new Promise(r => setTimeout(r, 0));
    });
    expect(screen.queryByText('Opgeslagen')).toBeNull();
  });

});

// ── handleChange / handleNlOnderdeel mutation tests ─────────────────────────

describe('RekenenNederlandsSection — handleChange', () => {

  it('mutates rec.rekenResultaat and calls saveKlassen when Rekenen input changes', async () => {
    const student = makeStudent();
    mountState(student);
    render(<RekenenNederlandsSection student={student} />);
    const input = document.getElementById('rnl-rekenen') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { value: '7.5' } });
      await new Promise(r => setTimeout(r, 0));
    });
    const klas = getMockKlassenState().klassen['klas1'];
    const rec = klas.students.find((s: any) => s.leerlingId === 'S1');
    expect(rec.rekenResultaat).toBe('7.5');
    expect(getMockSaveKlassen()).toHaveBeenCalledTimes(1);
  });

  it('sets rec.rekenResultaat to null when empty string entered', async () => {
    const student = makeStudent({ rekenResultaat: '7.5' });
    mountState(student);
    render(<RekenenNederlandsSection student={student} />);
    const input = document.getElementById('rnl-rekenen') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { value: '' } });
      await new Promise(r => setTimeout(r, 0));
    });
    const klas = getMockKlassenState().klassen['klas1'];
    const rec = klas.students.find((s: any) => s.leerlingId === 'S1');
    expect(rec.rekenResultaat).toBeNull();
  });

  it('saves nlLezen and calls saveKlassen when lezen input changes', async () => {
    const student = makeStudent();
    mountState(student);
    render(<RekenenNederlandsSection student={student} />);
    const input = document.getElementById('rnl-nl-lezen') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { value: '3.5' } });
      await new Promise(r => setTimeout(r, 0));
    });
    const rec = getMockKlassenState().klassen['klas1'].students.find((s: any) => s.leerlingId === 'S1');
    expect(rec.nlLezen).toBe('3.5');
    expect(getMockSaveKlassen()).toHaveBeenCalledTimes(1);
  });

  it('auto-computes nederlandsResultaat when all 4 onderdelen are filled', async () => {
    // Set up student with 3 onderdelen already filled
    const student = makeStudent({ nlSpreken: '3', nlGesprekvoeren: '3', nlSchrijven: '3' });
    mountState(student);
    render(<RekenenNederlandsSection student={student} />);
    const input = document.getElementById('rnl-nl-lezen') as HTMLInputElement;
    await act(async () => {
      // Enter last onderdeel: (3 + 3 + 3 + 3) / 2 = 6.0
      fireEvent.change(input, { target: { value: '3' } });
      await new Promise(r => setTimeout(r, 0));
    });
    const rec = getMockKlassenState().klassen['klas1'].students.find((s: any) => s.leerlingId === 'S1');
    expect(rec.nederlandsResultaat).toBe('6.0');
  });

  it('sets nederlandsResultaat to null when not all onderdelen are filled', async () => {
    // Start with all 4 filled so changing one to '' exercises the null path
    const student = makeStudent({ nlLezen: '3', nlSpreken: '3', nlGesprekvoeren: '3', nlSchrijven: '3', nederlandsResultaat: '6.0' });
    mountState(student);
    render(<RekenenNederlandsSection student={student} />);
    const input = document.getElementById('rnl-nl-lezen') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { value: '' } });
      await new Promise(r => setTimeout(r, 0));
    });
    const rec = getMockKlassenState().klassen['klas1'].students.find((s: any) => s.leerlingId === 'S1');
    expect(rec.nederlandsResultaat).toBeNull();
  });

  it('does nothing when student record not found in klassenState', async () => {
    const student = makeStudent({ leerlingId: 'UNKNOWN' });
    mountState(makeStudent());
    render(<RekenenNederlandsSection student={student} />);
    const input = document.getElementById('rnl-rekenen') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { value: '7.5' } });
      await new Promise(r => setTimeout(r, 0));
    });
    expect(getMockSaveKlassen()).not.toHaveBeenCalled();
  });

});

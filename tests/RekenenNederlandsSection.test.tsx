// tests/RekenenNederlandsSection.test.tsx — Phase 23 Plan 02 (RNL-01..03)
// TDD RED: tests written before implementation exists.

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

// Import AFTER mocks
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

  it('renders Rekenen select with id "rnl-rekenen"', () => {
    const student = makeStudent();
    mountState(student);
    render(<RekenenNederlandsSection student={student} />);
    const sel = document.getElementById('rnl-rekenen') as HTMLSelectElement;
    expect(sel).toBeTruthy();
  });

  it('renders Nederlands select with id "rnl-nederlands"', () => {
    const student = makeStudent();
    mountState(student);
    render(<RekenenNederlandsSection student={student} />);
    const sel = document.getElementById('rnl-nederlands') as HTMLSelectElement;
    expect(sel).toBeTruthy();
  });

  it('Rekenen select has options: (blank), 3F, 2F (norm), 1F', () => {
    const student = makeStudent();
    mountState(student);
    render(<RekenenNederlandsSection student={student} />);
    const sel = document.getElementById('rnl-rekenen') as HTMLSelectElement;
    const vals = Array.from(sel.options).map(o => o.value);
    expect(vals).toContain('');
    expect(vals).toContain('3F');
    expect(vals).toContain('2F');
    expect(vals).toContain('1F');
  });

  it('Nederlands select has same options as Rekenen select', () => {
    const student = makeStudent();
    mountState(student);
    render(<RekenenNederlandsSection student={student} />);
    const sel = document.getElementById('rnl-nederlands') as HTMLSelectElement;
    const vals = Array.from(sel.options).map(o => o.value);
    expect(vals).toContain('');
    expect(vals).toContain('3F');
    expect(vals).toContain('2F');
    expect(vals).toContain('1F');
  });

  it('Rekenen select defaults to empty when student.rekenResultaat is undefined', () => {
    const student = makeStudent();
    mountState(student);
    render(<RekenenNederlandsSection student={student} />);
    const sel = document.getElementById('rnl-rekenen') as HTMLSelectElement;
    expect(sel.value).toBe('');
  });

  it('Rekenen select reflects student.rekenResultaat value', () => {
    const student = makeStudent({ rekenResultaat: '3F' });
    mountState(student);
    render(<RekenenNederlandsSection student={student} />);
    const sel = document.getElementById('rnl-rekenen') as HTMLSelectElement;
    expect(sel.value).toBe('3F');
  });

  it('Nederlands select reflects student.nederlandsResultaat value', () => {
    const student = makeStudent({ nederlandsResultaat: '1F' });
    mountState(student);
    render(<RekenenNederlandsSection student={student} />);
    const sel = document.getElementById('rnl-nederlands') as HTMLSelectElement;
    expect(sel.value).toBe('1F');
  });

});

// ── normBadge tests ──────────────────────────────────────────────────────────

describe('RekenenNederlandsSection — normBadge', () => {

  it('shows no badge when rekenResultaat is null', () => {
    const student = makeStudent();
    mountState(student);
    const { container } = render(<RekenenNederlandsSection student={student} />);
    // Badge spans inside the Rekenen label
    const label = screen.getByText('Rekenen').closest('label');
    expect(label?.querySelector('span')).toBeNull();
  });

  it('shows "3F — goed" badge (green) when rekenResultaat is 3F', () => {
    const student = makeStudent({ rekenResultaat: '3F' });
    mountState(student);
    render(<RekenenNederlandsSection student={student} />);
    const badge = screen.getByText('3F — goed');
    expect(badge).toBeTruthy();
    // jsdom normalizes #10b981 → rgb(16, 185, 129)
    expect((badge as HTMLElement).style.color).toBe('rgb(16, 185, 129)');
  });

  it('shows "2F — voldoende (norm)" badge (green) when rekenResultaat is 2F', () => {
    const student = makeStudent({ rekenResultaat: '2F' });
    mountState(student);
    render(<RekenenNederlandsSection student={student} />);
    const badge = screen.getByText('2F — voldoende (norm)');
    expect(badge).toBeTruthy();
    // jsdom normalizes #10b981 → rgb(16, 185, 129)
    expect((badge as HTMLElement).style.color).toBe('rgb(16, 185, 129)');
  });

  it('shows "Onder norm" badge (red) when nederlandsResultaat is 1F', () => {
    const student = makeStudent({ nederlandsResultaat: '1F' });
    mountState(student);
    render(<RekenenNederlandsSection student={student} />);
    const badge = screen.getByText('Onder norm');
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
    expect(screen.getByText('Norm: Rekenen 2F · Nederlands 2F (MBO-3 landelijk)')).toBeTruthy();
  });

  it('does NOT show norm text when rekenResultaat is set', () => {
    const student = makeStudent({ rekenResultaat: '2F' });
    mountState(student);
    render(<RekenenNederlandsSection student={student} />);
    expect(screen.queryByText('Norm: Rekenen 2F · Nederlands 2F (MBO-3 landelijk)')).toBeNull();
  });

  it('shows "Opgeslagen" in green after successful save', async () => {
    const student = makeStudent();
    mountState(student);
    render(<RekenenNederlandsSection student={student} />);
    const sel = document.getElementById('rnl-rekenen') as HTMLSelectElement;
    await act(async () => {
      fireEvent.change(sel, { target: { value: '2F' } });
      await new Promise(r => setTimeout(r, 0));
    });
    const hint = screen.getByText('Opgeslagen');
    expect(hint).toBeTruthy();
    // hint paragraph has green color — jsdom normalizes #10b981 → rgb(16, 185, 129)
    const p = hint.closest('p');
    expect(p?.style.color).toBe('rgb(16, 185, 129)');
  });

  it('does NOT show "Opgeslagen" when saveKlassen returns false', async () => {
    getMockSaveKlassen().mockResolvedValue(false);
    const student = makeStudent();
    mountState(student);
    render(<RekenenNederlandsSection student={student} />);
    const sel = document.getElementById('rnl-rekenen') as HTMLSelectElement;
    await act(async () => {
      fireEvent.change(sel, { target: { value: '2F' } });
      await new Promise(r => setTimeout(r, 0));
    });
    expect(screen.queryByText('Opgeslagen')).toBeNull();
  });

});

// ── handleChange mutation tests ──────────────────────────────────────────────

describe('RekenenNederlandsSection — handleChange', () => {

  it('mutates rec.rekenResultaat and calls saveKlassen when Rekenen select changes', async () => {
    const student = makeStudent();
    mountState(student);
    render(<RekenenNederlandsSection student={student} />);
    const sel = document.getElementById('rnl-rekenen') as HTMLSelectElement;
    await act(async () => {
      fireEvent.change(sel, { target: { value: '3F' } });
      await new Promise(r => setTimeout(r, 0));
    });
    const klas = getMockKlassenState().klassen['klas1'];
    const rec = klas.students.find((s: any) => s.leerlingId === 'S1');
    expect(rec.rekenResultaat).toBe('3F');
    expect(getMockSaveKlassen()).toHaveBeenCalledTimes(1);
  });

  it('mutates rec.nederlandsResultaat when Nederlands select changes', async () => {
    const student = makeStudent();
    mountState(student);
    render(<RekenenNederlandsSection student={student} />);
    const sel = document.getElementById('rnl-nederlands') as HTMLSelectElement;
    await act(async () => {
      fireEvent.change(sel, { target: { value: '1F' } });
      await new Promise(r => setTimeout(r, 0));
    });
    const klas = getMockKlassenState().klassen['klas1'];
    const rec = klas.students.find((s: any) => s.leerlingId === 'S1');
    expect(rec.nederlandsResultaat).toBe('1F');
  });

  it('sets rec[field] to null when empty string is selected (value || null)', async () => {
    const student = makeStudent({ rekenResultaat: '3F' });
    mountState(student);
    render(<RekenenNederlandsSection student={student} />);
    const sel = document.getElementById('rnl-rekenen') as HTMLSelectElement;
    await act(async () => {
      fireEvent.change(sel, { target: { value: '' } });
      await new Promise(r => setTimeout(r, 0));
    });
    const klas = getMockKlassenState().klassen['klas1'];
    const rec = klas.students.find((s: any) => s.leerlingId === 'S1');
    expect(rec.rekenResultaat).toBeNull();
  });

  it('does nothing when student record not found in klassenState', async () => {
    const student = makeStudent({ leerlingId: 'UNKNOWN' });
    mountState(makeStudent()); // different student in state
    render(<RekenenNederlandsSection student={student} />);
    const sel = document.getElementById('rnl-rekenen') as HTMLSelectElement;
    await act(async () => {
      fireEvent.change(sel, { target: { value: '2F' } });
      await new Promise(r => setTimeout(r, 0));
    });
    expect(getMockSaveKlassen()).not.toHaveBeenCalled();
  });

});

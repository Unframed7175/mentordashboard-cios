// tests/KlasTabStrip.test.tsx — Phase 17 Plan 03 + Phase 27 Plan 02
// Phase 17: gear icon presence, onSettings callback, active class state, legacy import button removed
// Phase 27: TAB-01 canDelete × button, TAB-02 double-click inline rename, TAB-03 Enter/Escape

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import KlasTabStrip from '../src/components/KlasTabStrip';

describe('KlasTabStrip — gear icon (Phase 17)', () => {
  it('renders a button with aria-label "Instellingen openen"', () => {
    render(
      <KlasTabStrip
        klassen={[]}
        activeKlasId={null}
        onSwitch={vi.fn()}
        onCreateKlas={vi.fn()}
        onSettings={vi.fn()}
        onFeedback={vi.fn()}
        onDeleteKlas={vi.fn()}
        onRenameKlas={vi.fn()}
        onSetVestigingOverride={vi.fn()}
        onHelp={vi.fn()}
        isSettingsActive={false}
        isHelpActive={false}
        isDark={false}
      />
    );
    expect(screen.getByRole('button', { name: 'Instellingen openen' })).toBeTruthy();
  });

  it('calls onSettings when gear button is clicked', () => {
    const onSettingsSpy = vi.fn();
    render(
      <KlasTabStrip
        klassen={[]}
        activeKlasId={null}
        onSwitch={vi.fn()}
        onCreateKlas={vi.fn()}
        onSettings={onSettingsSpy}
        onFeedback={vi.fn()}
        onDeleteKlas={vi.fn()}
        onRenameKlas={vi.fn()}
        onSetVestigingOverride={vi.fn()}
        onHelp={vi.fn()}
        isSettingsActive={false}
        isHelpActive={false}
        isDark={false}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Instellingen openen' }));
    expect(onSettingsSpy).toHaveBeenCalledTimes(1);
  });

  it('gear button has "active" class when isSettingsActive is true', () => {
    render(
      <KlasTabStrip
        klassen={[]}
        activeKlasId={null}
        onSwitch={vi.fn()}
        onCreateKlas={vi.fn()}
        onSettings={vi.fn()}
        onFeedback={vi.fn()}
        onDeleteKlas={vi.fn()}
        onRenameKlas={vi.fn()}
        onSetVestigingOverride={vi.fn()}
        onHelp={vi.fn()}
        isSettingsActive={true}
        isHelpActive={false}
        isDark={false}
      />
    );
    const gearBtn = screen.getByRole('button', { name: 'Instellingen openen' });
    expect(gearBtn.className).toContain('active');
  });

  it('does NOT render "↑ Importeer" text (legacy button removed)', () => {
    render(
      <KlasTabStrip
        klassen={[]}
        activeKlasId={null}
        onSwitch={vi.fn()}
        onCreateKlas={vi.fn()}
        onSettings={vi.fn()}
        onFeedback={vi.fn()}
        onDeleteKlas={vi.fn()}
        onRenameKlas={vi.fn()}
        onSetVestigingOverride={vi.fn()}
        onHelp={vi.fn()}
        isSettingsActive={false}
        isHelpActive={false}
        isDark={false}
      />
    );
    expect(screen.queryByText(/↑ Importeer/)).toBeNull();
  });
});

// Shared test props factory for Phase 27+ tests
function makeProps(overrides?: Partial<Parameters<typeof KlasTabStrip>[0]>) {
  return {
    klassen: [
      { id: 'k1', naam: 'Klas A', canDelete: true },
      { id: 'k2', naam: 'Klas B', canDelete: false },
    ],
    activeKlasId: 'k1',
    onSwitch: vi.fn(),
    onCreateKlas: vi.fn(),
    onSettings: vi.fn(),
    onFeedback: vi.fn(),
    onDeleteKlas: vi.fn(),
    onRenameKlas: vi.fn(),
    onSetVestigingOverride: vi.fn(),
    onHelp: vi.fn(),
    isSettingsActive: false,
    isHelpActive: false,
    isDark: false,
    ...overrides,
  };
}

describe('KlasTabStrip — TAB-01: delete button visibility (Phase 33)', () => {
  it('TAB-01: renders × button voor ALLE klassen ongeacht canDelete prop', () => {
    render(<KlasTabStrip {...makeProps()} />);
    // makeProps heeft k1 (canDelete: true) en k2 (canDelete: false)
    // Na Phase 33 toont de component × voor BEIDE klassen
    const deleteButtons = screen.getAllByRole('button', { name: /verwijderen/i });
    expect(deleteButtons).toHaveLength(2);
    expect(deleteButtons[0].getAttribute('aria-label')).toMatch(/Klas A verwijderen/i);
    expect(deleteButtons[1].getAttribute('aria-label')).toMatch(/Klas B verwijderen/i);
  });
});

describe('KlasTabStrip — vestiging-override select (M42 T1)', () => {
  it('renders a select per klas met de juiste huidige waarde', () => {
    render(<KlasTabStrip {...makeProps({
      klassen: [
        { id: 'k1', naam: 'Klas A', vestigingOverride: 'goes' },
        { id: 'k2', naam: 'Klas B', vestigingOverride: null },
      ],
    })} />);

    const selects = screen.getAllByRole('combobox') as HTMLSelectElement[];
    expect(selects).toHaveLength(2);
    expect(selects[0].value).toBe('goes');
    expect(selects[1].value).toBe('');
  });

  it('roept onSetVestigingOverride aan met (klasId, vestiging) bij wijziging', () => {
    const onSetVestigingOverride = vi.fn();
    render(<KlasTabStrip {...makeProps({
      klassen: [
        { id: 'k1', naam: 'Klas A', vestigingOverride: null },
        { id: 'k2', naam: 'Klas B', vestigingOverride: null },
      ],
      onSetVestigingOverride,
    })} />);

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'dordrecht' } });

    expect(onSetVestigingOverride).toHaveBeenCalledTimes(1);
    expect(onSetVestigingOverride).toHaveBeenCalledWith('k1', 'dordrecht');
  });

  it('kiezen van "Vestiging: auto" (lege waarde) roept onSetVestigingOverride aan met null', () => {
    const onSetVestigingOverride = vi.fn();
    render(<KlasTabStrip {...makeProps({
      klassen: [
        { id: 'k1', naam: 'Klas A', vestigingOverride: 'goes' },
        { id: 'k2', naam: 'Klas B', vestigingOverride: null },
      ],
      onSetVestigingOverride,
    })} />);

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: '' } });

    expect(onSetVestigingOverride).toHaveBeenCalledWith('k1', null);
  });

  it('klikken/wijzigen van de select triggert niet het switchen van klas (onSwitch)', () => {
    const onSwitch = vi.fn();
    const onSetVestigingOverride = vi.fn();
    render(<KlasTabStrip {...makeProps({ onSwitch, onSetVestigingOverride })} />);

    const selects = screen.getAllByRole('combobox');
    fireEvent.click(selects[0]);
    fireEvent.change(selects[0], { target: { value: 'roosendaal' } });

    expect(onSwitch).not.toHaveBeenCalled();
    expect(onSetVestigingOverride).toHaveBeenCalledWith('k1', 'roosendaal');
  });
});

describe('KlasTabStrip — vestiging auto-detectie label zichtbaar in select (final review fix #5)', () => {
  it('toont "Automatisch (Roosendaal)" als auto-optie wanneer de klasnaam op CSR herkend wordt', () => {
    render(<KlasTabStrip {...makeProps({
      klassen: [{ id: 'k1', naam: 'CSR 2A', vestigingOverride: null }],
    })} />);

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    const autoOption = select.querySelector('option[value=""]') as HTMLOptionElement;
    expect(autoOption.textContent).toBe('Automatisch (Roosendaal)');
    expect(autoOption.value).toBe(''); // value ongewijzigd — alleen het label verandert
  });

  it('toont "Automatisch — niet herkend" als de klasnaam geen CSD/CSG/CSR-token bevat', () => {
    render(<KlasTabStrip {...makeProps({
      klassen: [{ id: 'k1', naam: 'Sport 2A', vestigingOverride: null }],
    })} />);

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    const autoOption = select.querySelector('option[value=""]') as HTMLOptionElement;
    expect(autoOption.textContent).toBe('Automatisch — niet herkend');
  });
});

describe('KlasTabStrip — TAB-02: double-click inline rename (Phase 27)', () => {
  it('TAB-02: double-clicking naam span shows input pre-filled with klas naam', () => {
    render(<KlasTabStrip {...makeProps()} />);
    const naamSpan = screen.getByText('Klas A');
    fireEvent.doubleClick(naamSpan);
    const input = screen.getByRole('textbox');
    expect(input).toBeTruthy();
    expect((input as HTMLInputElement).value).toBe('Klas A');
  });
});

describe('KlasTabStrip — TAB-03: rename save and cancel (Phase 27)', () => {
  it('TAB-03 Enter: pressing Enter calls onRenameKlas with trimmed value', () => {
    const onRenameKlas = vi.fn();
    render(<KlasTabStrip {...makeProps({ onRenameKlas })} />);

    fireEvent.doubleClick(screen.getByText('Klas A'));
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: 'Klas Nieuw' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(onRenameKlas).toHaveBeenCalledTimes(1);
    expect(onRenameKlas).toHaveBeenCalledWith('k1', 'Klas Nieuw');
    // Input should be gone after commit
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('TAB-03 Escape: pressing Escape cancels without calling onRenameKlas', () => {
    const onRenameKlas = vi.fn();
    render(<KlasTabStrip {...makeProps({ onRenameKlas })} />);

    fireEvent.doubleClick(screen.getByText('Klas A'));
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: 'Iets Anders' } });
    fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });

    expect(onRenameKlas).not.toHaveBeenCalled();
    // Input should be gone after escape
    expect(screen.queryByRole('textbox')).toBeNull();
  });
});

describe('KlasTabStrip — feedback button (Phase 28)', () => {
  it('renders a button with aria-label "Fout melden"', () => {
    render(<KlasTabStrip {...makeProps()} />);
    expect(screen.getByRole('button', { name: 'Fout melden' })).toBeTruthy();
  });

  it('calls onFeedback when 🐛 button is clicked', () => {
    const onFeedback = vi.fn();
    render(<KlasTabStrip {...makeProps({ onFeedback })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Fout melden' }));
    expect(onFeedback).toHaveBeenCalledTimes(1);
  });
});

describe('KlasTabStrip — help button (Phase 30)', () => {
  it('renders a button with aria-label "Help openen"', () => {
    render(<KlasTabStrip {...makeProps()} />);
    expect(screen.getByRole('button', { name: 'Help openen' })).toBeTruthy();
  });

  it('calls onHelp when ? button is clicked', () => {
    const onHelp = vi.fn();
    render(<KlasTabStrip {...makeProps({ onHelp })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Help openen' }));
    expect(onHelp).toHaveBeenCalledTimes(1);
  });
});

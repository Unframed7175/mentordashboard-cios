// tests/SettingsPage.gevarenzone.test.tsx — M36 T4 + DT1 + DT2
// Gevarenzone-sectie + wisdialoog: typ-bevestiging WISSEN, back-up-vangnet,
// states-tabel (D4-1A) en a11y-spec (D6-2A).

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import React from 'react';

const {
  mockFactoryReset,
  mockBuildBackupPayload,
  DEFAULT_NORMEN_MOCK,
} = vi.hoisted(() => ({
  mockFactoryReset: vi.fn(),
  mockBuildBackupPayload: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
  DEFAULT_NORMEN_MOCK: {
    sbl: 13, sbc: 15, negatiefTotaal: 6, negatiefPerLeerlijn: 2,
    bj1Positief: 13, versneldLesgeven: 4, versneldOrganiseren: 3, versneldProfHandelen: 5,
  },
}));

vi.mock('@tauri-apps/api/app', () => ({ getVersion: vi.fn().mockResolvedValue('2.7.0') }));
vi.mock('../utils/settings', () => ({
  saveSettings: vi.fn(),
  applyTheme: vi.fn(),
}));
vi.mock('../utils/deelgebieden', () => ({
  getDeelgebiedenConfig: vi.fn().mockResolvedValue([]),
  saveDeelgebiedenConfig: vi.fn(),
  resetDeelgebiedenConfig: vi.fn(),
}));
vi.mock('../utils/leerlijnen', () => ({
  getLeerlijnenMapping: vi.fn().mockResolvedValue({}),
  saveLeerlijnenMapping: vi.fn(),
  resetLeerlijnenMapping: vi.fn(),
}));
vi.mock('../utils/verzuimDrempels', () => ({
  loadVerzuimDrempels: vi.fn().mockResolvedValue({ geoorloofd: 900, ongeoorloofd: 600 }),
  saveVerzuimDrempels: vi.fn(),
}));
vi.mock('../utils/bpv', () => ({
  getBpvConfig: vi.fn().mockResolvedValue({ vereisteUren: 200 }),
  saveBpvConfig: vi.fn(),
  parseBpvExcel: vi.fn(),
  saveBpvData: vi.fn(),
  getBpvData: vi.fn().mockResolvedValue(null),
}));
vi.mock('../utils/normen', () => ({
  loadNormen: vi.fn().mockResolvedValue({ ...DEFAULT_NORMEN_MOCK }),
  saveNormen: vi.fn(),
  resetNormen: vi.fn().mockResolvedValue({ ...DEFAULT_NORMEN_MOCK }),
  DEFAULT_NORMEN: DEFAULT_NORMEN_MOCK,
}));
vi.mock('../utils/backup', () => ({ buildBackupPayload: mockBuildBackupPayload }));
vi.mock('../utils/updateCheck', () => ({ checkForUpdate: vi.fn().mockResolvedValue(null) }));
vi.mock('../utils/reset', () => ({ factoryReset: mockFactoryReset }));

import SettingsPage from '../src/components/SettingsPage';

const defaultProps = {
  onBack: vi.fn(),
  onNavigateToImport: vi.fn(),
  isDark: false,
  onToggleDark: vi.fn(),
  onNormenChanged: vi.fn(),
};

async function renderSettings() {
  let result: ReturnType<typeof render>;
  await act(async () => {
    result = render(<SettingsPage {...defaultProps} />);
  });
  return result!;
}

async function openDialog() {
  fireEvent.click(screen.getByRole('button', { name: /alle gegevens wissen/i }));
  return await screen.findByRole('dialog');
}

function getWisKnop() {
  return screen.getByRole('button', { name: /definitief wissen/i }) as HTMLButtonElement;
}

function getInvoerveld() {
  return screen.getByLabelText(/typ wissen om te bevestigen/i) as HTMLInputElement;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFactoryReset.mockResolvedValue({ success: true, message: 'Alle gegevens gewist' });
  mockBuildBackupPayload.mockResolvedValue(new Uint8Array([1, 2, 3]));
});

// ── T4: Gevarenzone-sectie + wisdialoog ───────────────────────────────────────

describe('Gevarenzone-sectie (M36 T4)', () => {
  it('toont de Gevarenzone-sectie met wis-knop', async () => {
    await renderSettings();
    expect(screen.getByText('Gevarenzone')).toBeTruthy();
    expect(screen.getByRole('button', { name: /alle gegevens wissen/i })).toBeTruthy();
  });

  it('opent de wisdialoog bij klik op de sectie-knop', async () => {
    await renderSettings();
    const dialog = await openDialog();
    expect(dialog).toBeTruthy();
    expect(getInvoerveld()).toBeTruthy();
  });

  it('wis-knop is disabled tot exact WISSEN is getypt', async () => {
    await renderSettings();
    await openDialog();

    expect(getWisKnop().disabled).toBe(true);

    fireEvent.change(getInvoerveld(), { target: { value: 'wissen' } });
    expect(getWisKnop().disabled).toBe(true);

    fireEvent.change(getInvoerveld(), { target: { value: 'WISSEN' } });
    expect(getWisKnop().disabled).toBe(false);
  });

  it('annuleren sluit de dialoog zonder factoryReset aan te roepen', async () => {
    await renderSettings();
    await openDialog();

    fireEvent.click(screen.getByRole('button', { name: /annuleren/i }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(mockFactoryReset).not.toHaveBeenCalled();
  });

  it('geldige invoer + klik op Definitief wissen roept factoryReset aan', async () => {
    await renderSettings();
    await openDialog();

    fireEvent.change(getInvoerveld(), { target: { value: 'WISSEN' } });
    fireEvent.click(getWisKnop());

    await waitFor(() => expect(mockFactoryReset).toHaveBeenCalledTimes(1));
  });

  it('Back-up maken hergebruikt de export-handler (buildBackupPayload)', async () => {
    await renderSettings();
    await openDialog();

    fireEvent.click(screen.getByRole('button', { name: /back-up maken/i }));

    await waitFor(() => expect(mockBuildBackupPayload).toHaveBeenCalledTimes(1));
  });

  it('mislukte reset toont faalmelding en laat dialoog open', async () => {
    mockFactoryReset.mockResolvedValue({ success: false, message: 'Wissen mislukt: schijf' });
    await renderSettings();
    await openDialog();

    fireEvent.change(getInvoerveld(), { target: { value: 'WISSEN' } });
    fireEvent.click(getWisKnop());

    await screen.findByRole('alert');
    expect(screen.getByRole('alert').textContent).toMatch(/wissen mislukt/i);
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('dubbelklik-guard: tweede klik tijdens wissen roept factoryReset één keer aan', async () => {
    let resolveReset!: (v: { success: boolean; message: string }) => void;
    mockFactoryReset.mockImplementation(
      () => new Promise(res => { resolveReset = res; })
    );
    await renderSettings();
    await openDialog();

    fireEvent.change(getInvoerveld(), { target: { value: 'WISSEN' } });
    const knop = getWisKnop();
    fireEvent.click(knop);
    fireEvent.click(knop);

    expect(mockFactoryReset).toHaveBeenCalledTimes(1);
    await act(async () => { resolveReset({ success: true, message: '' }); });
  });
});

// ── DT1: dialoog-states conform states-tabel (D4-1A) ──────────────────────────

describe('WisDialoog states (M36 DT1)', () => {
  it('wissen bezig: knop toont "Bezig met wissen…" en álle controls zijn disabled', async () => {
    let resolveReset!: (v: { success: boolean; message: string }) => void;
    mockFactoryReset.mockImplementation(() => new Promise(res => { resolveReset = res; }));
    await renderSettings();
    await openDialog();

    fireEvent.change(getInvoerveld(), { target: { value: 'WISSEN' } });
    const knop = getWisKnop();
    fireEvent.click(knop);

    expect(screen.getByRole('button', { name: /bezig met wissen/i })).toBeTruthy();
    expect((screen.getByRole('button', { name: /bezig met wissen/i }) as HTMLButtonElement).disabled).toBe(true);
    expect(getInvoerveld().disabled).toBe(true);
    expect((screen.getByRole('button', { name: /annuleren/i }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: /back-up maken/i }) as HTMLButtonElement).disabled).toBe(true);

    await act(async () => { resolveReset({ success: true, message: '' }); });
  });

  it('back-up bezig: back-up-knop toont "Exporteren…" en wis-knop is tijdelijk disabled', async () => {
    let resolveBackup!: (v: Uint8Array) => void;
    mockBuildBackupPayload.mockImplementation(() => new Promise(res => { resolveBackup = res; }));
    await renderSettings();
    const dialog = await openDialog();

    fireEvent.change(getInvoerveld(), { target: { value: 'WISSEN' } });
    expect(getWisKnop().disabled).toBe(false);

    fireEvent.click(within(dialog).getByRole('button', { name: /back-up maken/i }));

    const exportKnop = within(dialog).getByRole('button', { name: /exporteren/i }) as HTMLButtonElement;
    expect(exportKnop.disabled).toBe(true);
    expect(getWisKnop().disabled).toBe(true);

    await act(async () => { resolveBackup(new Uint8Array([1])); });
    // na afronden export: wis-knop weer actief
    await waitFor(() => expect(getWisKnop().disabled).toBe(false));
  });

  it('fout-state: na mislukte reset zijn de controls weer actief en is data-invoer mogelijk', async () => {
    mockFactoryReset.mockResolvedValue({ success: false, message: 'Wissen mislukt: schijf' });
    await renderSettings();
    await openDialog();

    fireEvent.change(getInvoerveld(), { target: { value: 'WISSEN' } });
    fireEvent.click(getWisKnop());
    await screen.findByRole('alert');

    expect(getInvoerveld().disabled).toBe(false);
    expect((screen.getByRole('button', { name: /annuleren/i }) as HTMLButtonElement).disabled).toBe(false);
    expect(getWisKnop().disabled).toBe(false);
  });
});

// ── DT2: a11y wisdialoog (D6-2A) ─────────────────────────────────────────────

describe('WisDialoog a11y (M36 DT2)', () => {
  it('dialog heeft role, aria-modal en aria-labelledby gekoppeld aan titel', async () => {
    await renderSettings();
    const dialog = await openDialog();
    expect(dialog.getAttribute('role')).toBe('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    const labelId = dialog.getAttribute('aria-labelledby');
    expect(labelId).toBeTruthy();
    const titel = document.getElementById(labelId!);
    expect(titel).toBeTruthy();
    expect(titel!.textContent).toMatch(/wissen/i);
  });

  it('focus gaat naar het invoerveld zodra de dialoog opent', async () => {
    await renderSettings();
    await openDialog();
    expect(document.activeElement).toBe(getInvoerveld());
  });

  it('ESC sluit de dialoog wanneer er niet gewist wordt', async () => {
    await renderSettings();
    const dialog = await openDialog();
    fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(mockFactoryReset).not.toHaveBeenCalled();
  });

  it('ESC doet niets terwijl het wissen bezig is', async () => {
    let resolveReset!: (v: { success: boolean; message: string }) => void;
    mockFactoryReset.mockImplementation(() => new Promise(res => { resolveReset = res; }));
    await renderSettings();
    const dialog = await openDialog();

    fireEvent.change(getInvoerveld(), { target: { value: 'WISSEN' } });
    fireEvent.click(screen.getByRole('button', { name: /definitief wissen/i }));

    fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeTruthy();

    await act(async () => { resolveReset({ success: true, message: '' }); });
  });

  it('Enter in het invoerveld triggert geen wis-actie', async () => {
    await renderSettings();
    await openDialog();

    fireEvent.change(getInvoerveld(), { target: { value: 'WISSEN' } });
    fireEvent.keyDown(getInvoerveld(), { key: 'Enter', code: 'Enter' });

    expect(mockFactoryReset).not.toHaveBeenCalled();
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { appState, addStudent } from '../utils/datamodel';

// M42 T3 — documentation test, NOT a regression test for a bug introduced by T3.
//
// addStudent() does a wholesale replace (appState.students[idx] = student) when the
// same leerlingId + periode is re-imported (utils/datamodel.ts addStudent()). There is
// no merge step between the PDF parser and this call, so any manually-entered field
// that isn't part of the parsed PDF shape — keuzedelen, kdStatus, actiepunten, and now
// wvoTraject — does NOT survive a same-period re-import today. This is a pre-existing,
// separately-tracked gap; wvoTraject simply inherits the same risk profile as
// keuzedelen rather than introducing a new one.
describe('wvoTraject deelt het bestaande same-period-re-import-risico met keuzedelen (bekende beperking)', () => {
  beforeEach(() => {
    appState.students = [];
    appState.lastImportErrors = [];
    appState.importing = false;
  });

  it('gaat verloren wanneer dezelfde leerlingId+periode opnieuw wordt geimporteerd via addStudent()', () => {
    const origineel = {
      leerlingId: 'S1',
      periode: 'BJ1 Fase 1',
      naam: 'Test Student',
      wvoTraject: true,
    };
    addStudent(origineel);
    expect(appState.students).toHaveLength(1);
    expect(appState.students[0].wvoTraject).toBe(true);

    // Simuleer een verse PDF-parse voor dezelfde leerling + periode: het geparste
    // record bevat geen wvoTraject-veld (net zoals het ook geen keuzedelen bevat).
    const versGeimporteerd = {
      leerlingId: 'S1',
      periode: 'BJ1 Fase 1',
      naam: 'Test Student',
    };
    addStudent(versGeimporteerd);

    expect(appState.students).toHaveLength(1);
    // Documenteert het daadwerkelijke gedrag: wholesale replace, dus wvoTraject is weg.
    expect(appState.students[0].wvoTraject).toBeUndefined();
  });

  it('blijft ongemoeid voor een ANDERE periode van dezelfde leerling (geen overschrijving over periodes heen)', () => {
    const bj1 = { leerlingId: 'S1', periode: 'BJ1 Fase 1', naam: 'Test Student', wvoTraject: true };
    addStudent(bj1);

    const bj1Fase2 = { leerlingId: 'S1', periode: 'BJ1 Fase 2', naam: 'Test Student' };
    addStudent(bj1Fase2);

    expect(appState.students).toHaveLength(2);
    const fase1 = appState.students.find(s => s.periode === 'BJ1 Fase 1');
    expect(fase1.wvoTraject).toBe(true);
  });
});

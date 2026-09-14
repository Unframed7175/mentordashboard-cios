# Phase 39: Keuzedeel Status in Prognose

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) to implement this plan task-by-task.

**Goal:** De keuzedeel-status van een leerling werkt door in de tegel-RAG-kleur op het klasoverzicht — een leerling die richting SBC gaat maar een 'niet_behaald' keuzedeel heeft, krijgt oranje in plaats van paars.

**Architecture:** Één wijziging in `src/utils/status.ts` (`berekenStatus()` wordt KD-bewust) + tests in `tests/status.test.ts`.

**Tech Stack:** TypeScript, Vitest

---

## Analyse van de bestaande situatie

### Al gedaan (Phase 34)
- `utils/keuzedelen.ts` — `Keuzedeel` type, `aggregateKdStatus()` ✅
- `KeuzedeelSection.tsx` — UI voor toevoegen/bewerken keuzedelen ✅
- `DoortstroomPrognoseSection.tsx` — toont KD-criteriumrijen per prognose-blok ✅
  - Lines 104–109: `kdStatus` berekend via `aggregateKdStatus`
  - `kdNodigBJ2` en `kdNodigSBC` correct meegenomen in `overallNodig` per blok

### Gap (Phase 39)
`berekenStatus()` in `src/utils/status.ts` roept alleen `berekenPrognose()` aan — die kent geen keuzedelen. De tegel-kleur op het klasoverzicht reflecteert de KD-status niet.

### Business rules (gespiegeld aan DoortstroomPrognoseSection.tsx)
```
sbc + (kdStatus === 'niet_behaald' || kdStatus === 'haalbaar')  → oranje / 'Let op — KD'
sbc + kdStatus === 'behaald'                                     → paars  / 'Profieljaar SBC'  (ongewijzigd)
versneld_sbc + (kdStatus === 'niet_behaald' || 'haalbaar')      → oranje / 'Let op — KD'
versneld_sbc + kdStatus === 'behaald'                           → paars  / 'Versneld SBC'     (ongewijzigd)
naar_bj2 + kdStatus === 'niet_behaald'                          → oranje / 'Let op — KD'
naar_bj2 + kdStatus === 'haalbaar' of 'behaald'                 → groen  / 'Op koers BJ2'    (ongewijzigd)
sbl        → geen KD-eis — nooit downgraden
null KD    → geen downgrade (data nog niet ingevoerd)
```

---

## Task 1: `berekenStatus()` KD-bewust maken

**Files:**
- Modify: `src/utils/status.ts`

- [ ] **Stap 1: Import toevoegen**

Bovenaan `src/utils/status.ts`, na de bestaande imports:
```ts
import { aggregateKdStatus } from '../../utils/keuzedelen';
```

- [ ] **Stap 2: KD-status berekening toevoegen in `berekenStatus()`**

Direct na de regel `const resolvedThresholds = thresholds ?? getVerzuimDrempelsSync();`, voeg toe:
```ts
  const keuzedelen = Array.isArray(student.keuzedelen) ? student.keuzedelen : [];
  const kdStatus = keuzedelen.length > 0
    ? aggregateKdStatus(keuzedelen)
    : (student.kdStatus ?? null);
```

- [ ] **Stap 3: Return-chain aanpassen**

Vervang de bestaande returns voor sbc, sbl, versneld_sbc, naar_bj2:

```ts
  // Oud:
  if (p.label === 'sbc')          return { kleur: 'paars',  label: 'Profieljaar SBC', prognose: p };
  if (p.label === 'sbl')          return { kleur: 'groen',  label: 'Op koers',        prognose: p };
  if (p.label === 'versneld_sbc') return { kleur: 'paars',  label: 'Versneld SBC',    prognose: p };
  if (p.label === 'naar_bj2')     return { kleur: 'groen',  label: 'Op koers BJ2',    prognose: p };

  // Nieuw:
  if (p.label === 'sbc') {
    if (kdStatus === 'niet_behaald' || kdStatus === 'haalbaar')
      return { kleur: 'oranje', label: 'Let op — KD',      prognose: p };
    return                     { kleur: 'paars',  label: 'Profieljaar SBC', prognose: p };
  }
  if (p.label === 'sbl')
    return                     { kleur: 'groen',  label: 'Op koers',        prognose: p };
  if (p.label === 'versneld_sbc') {
    if (kdStatus === 'niet_behaald' || kdStatus === 'haalbaar')
      return { kleur: 'oranje', label: 'Let op — KD',      prognose: p };
    return                     { kleur: 'paars',  label: 'Versneld SBC',    prognose: p };
  }
  if (p.label === 'naar_bj2') {
    if (kdStatus === 'niet_behaald')
      return { kleur: 'oranje', label: 'Let op — KD',      prognose: p };
    return                     { kleur: 'groen',  label: 'Op koers BJ2',    prognose: p };
  }
```

- [ ] **Stap 4: Tests draaien**

```bash
npm test
```

Verwacht: bestaande tests slagen (gedrag ongewijzigd wanneer geen keuzedelen).

- [ ] **Stap 5: Commit**

```bash
git add src/utils/status.ts
git commit -m "feat(39): berekenStatus KD-bewust — tegel-kleur reflecteert keuzedeel-status"
```

---

## Task 2: Tests voor KD-aware berekenStatus

**Files:**
- Modify: `tests/status.test.ts`

Voeg onderaan de file een nieuwe `describe`-block toe:

```ts
describe('berekenStatus keuzedelen (Phase 39)', () => {

  // Helper: student met alle 19 deelgebieden voldoende → sbc prognose (BJ2)
  function makeSbcStudent(keuzedelen?: any[]): any {
    return makeStudent({
      deelgebiedScores: allScores('voldoende'),
      keuzedelen: keuzedelen ?? [],
    });
  }

  // Helper: BJ1-student met alle 19 voldoende → versneld_sbc of naar_bj2 prognose
  function makeBj1Student(keuzedelen?: any[]): any {
    return makeStudent({
      periode: 'bj1 fase 2',
      leerjaar: '1',
      deelgebiedScores: allScores('voldoende'),
      keuzedelen: keuzedelen ?? [],
    });
  }

  const kdBehaald    = [{ id: '1', naam: 'KD Sport', status: 'behaald'     }];
  const kdHaalbaar   = [{ id: '1', naam: 'KD Sport', status: 'haalbaar'    }];
  const kdNietBehaald = [{ id: '1', naam: 'KD Sport', status: 'niet_behaald' }];

  it('sbc + behaald KD → paars / Profieljaar SBC (geen downgrade)', () => {
    const result = berekenStatus(makeSbcStudent(kdBehaald));
    expect(result.kleur).toBe('paars');
    expect(result.label).toBe('Profieljaar SBC');
  });

  it('sbc + haalbaar KD → oranje / Let op — KD (SBC vereist behaald)', () => {
    const result = berekenStatus(makeSbcStudent(kdHaalbaar));
    expect(result.kleur).toBe('oranje');
    expect(result.label).toBe('Let op — KD');
  });

  it('sbc + niet_behaald KD → oranje / Let op — KD', () => {
    const result = berekenStatus(makeSbcStudent(kdNietBehaald));
    expect(result.kleur).toBe('oranje');
    expect(result.label).toBe('Let op — KD');
  });

  it('sbc + geen keuzedelen → paars / Profieljaar SBC (null = geen downgrade)', () => {
    const result = berekenStatus(makeSbcStudent([]));
    expect(result.kleur).toBe('paars');
    expect(result.label).toBe('Profieljaar SBC');
  });

  it('sbl + niet_behaald KD → groen / Op koers (SBL heeft geen KD-eis)', () => {
    // 13 voldoende → sbl voor bj2
    const scores = allScores(null);
    const keys = Object.keys(scores).slice(0, 13);
    for (const k of keys) scores[k] = 'voldoende';
    const student = makeStudent({ deelgebiedScores: scores, keuzedelen: kdNietBehaald });
    const result = berekenStatus(student);
    expect(result.kleur).toBe('groen');
    expect(result.label).toBe('Op koers');
  });

  it('naar_bj2 + niet_behaald KD → oranje / Let op — KD', () => {
    const result = berekenStatus(makeBj1Student(kdNietBehaald));
    expect(result.kleur).toBe('oranje');
    expect(result.label).toBe('Let op — KD');
  });

  it('naar_bj2 + haalbaar KD → groen / Op koers BJ2 (haalbaar volstaat voor BJ2)', () => {
    const result = berekenStatus(makeBj1Student(kdHaalbaar));
    expect(result.kleur).toBe('groen');
    expect(result.label).toBe('Op koers BJ2');
  });

});
```

- [ ] **Stap 1: Voeg de describe-block toe onderaan `tests/status.test.ts`**

- [ ] **Stap 2: Draai alleen status-tests**

```bash
npx vitest run tests/status.test.ts
```

Verwacht: alle 7 nieuwe tests + alle bestaande tests groen.

- [ ] **Stap 3: Volledige suite**

```bash
npm test
```

Verwacht: alle tests groen.

- [ ] **Stap 4: Commit**

```bash
git add tests/status.test.ts
git commit -m "test(39): KD-aware berekenStatus — 7 integratietests voor keuzedeel-downgrade"
```

---

## Task 3: ROADMAP bijwerken

**Files:**
- Modify: `.planning/ROADMAP.md`

- [ ] **Stap 1: Vink Phase 39 af**

Zoek:
```markdown
- [ ] **Phase 39: Keuzedeel invoer + status in prognose**
```
→
```markdown
- [x] **Phase 39: Keuzedeel invoer + status in prognose** *(completed 2026-06-03)*
```

Zoek in progress-tabel:
```markdown
| 39. Keuzedeel invoer + status in prognose | 0/TBD | Not started | - |
```
→
```markdown
| 39. Keuzedeel invoer + status in prognose | 1/1 | Complete | 2026-06-03 |
```

- [ ] **Stap 2: Eindtest**

```bash
npm test
```

- [ ] **Stap 3: Commit**

```bash
git add .planning/ROADMAP.md
git commit -m "docs: Phase 39 afgerond — keuzedeel-status doorwerkt in tegel-RAG-kleur"
```

---

## Zelfcontrole — spec-afdekking

| Success Criterion | Afgedekt door |
|---|---|
| KD status behaald/haalbaar/niet_behaald ingevoerd | Al aanwezig via KeuzedeelSection (Phase 34) |
| Status meenemen in prognoseberekening (tegel) | Task 1: berekenStatus KD-bewust |
| Correcte downgrade per route (sbc/versneld_sbc/naar_bj2) | Task 2: 7 integratietests |
| SBL geen KD-eis | Task 2: test 5 |
| Null KD geen downgrade | Task 2: test 4 |

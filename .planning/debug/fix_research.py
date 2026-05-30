p = '.planning/phases/18-settings-panel-advanced/18-RESEARCH.md'
with open(p, encoding='utf-8') as f: s = f.read()

old_block = '''## Open Questions

1. **BPV Excel file format**
   - What we know: The user will provide a sample BPV Excel file at parser implementation time (D-13).
   - What's unclear: Column names, whether data is per-row or per-student, date format, etc.
   - Recommendation: Plan the BPV parser task as a separate plan that starts with the user providing the sample. The UI and storage plumbing can be built without it.

2. **Where to load config for berekenStatus callers**
   - What we know: `berekenStatus()` is called in `DetailWeergave.tsx` (line 47) and presumably in `KlasOverzicht.tsx` / `LeerlingTegel.tsx`.
   - What's unclear: Whether to use synchronous cache in verzuimDrempels.ts or prop-drill the thresholds from a parent component.
   - Recommendation: Synchronous cache in `utils/verzuimDrempels.ts` (same pattern as getLeerlijnenMappingSync) avoids prop drilling.

3. **DeelgebiedenMatrix leerlijn grouping after SET-04 changes**
   - What we know: The GROEPEN constant in the component hardcodes three group labels.
   - What's unclear: If a user moves all deelgebieden out of one leerlijn into another, should an empty column disappear from the matrix?
   - Recommendation: Keep GROEPEN fixed (three columns always shown); empty groups show an empty column. This avoids dynamic column width changes.'''

new_block = '''## Open Questions (RESOLVED)

All three questions resolved during planning. Resolutions captured below.

1. **BPV Excel file format** (RESOLVED — deferred per D-13)
   - What we know: The user will provide a sample BPV Excel file at parser implementation time (D-13).
   - What's unclear: Column names, whether data is per-row or per-student, date format, etc.
   - Recommendation: Plan the BPV parser task as a separate plan that starts with the user providing the sample. The UI and storage plumbing can be built without it.
   - **Resolution:** Deferred per D-13. Plan 18-02 ships `parseBpvExcel(bytes): BpvData` as a stub returning `{}`. Plan 18-05 wires the import button to call the stub and surface the "Onbekend BPV-bestandsformaat" error copy when parse returns empty. A follow-up phase will implement the real parser once the user provides a sample file. This question is OUT OF SCOPE for Phase 18.

2. **Where to load config for berekenStatus callers** (RESOLVED — internal sync fallback)
   - What we know: `berekenStatus()` is called in `DetailWeergave.tsx` (line 47) and presumably in `KlasOverzicht.tsx` / `LeerlingTegel.tsx`.
   - What's unclear: Whether to use synchronous cache in verzuimDrempels.ts or prop-drill the thresholds from a parent component.
   - Recommendation: Synchronous cache in `utils/verzuimDrempels.ts` (same pattern as getLeerlijnenMappingSync) avoids prop drilling.
   - **Resolution:** Synchronous cache wins. Plan 18-03 Task 2 updates `berekenStatus()` so that when the `thresholds` argument is undefined, the function body calls `getVerzuimDrempelsSync()` internally to resolve defaults. All existing call sites (KlasOverzicht tile, LeerlingTegel, DetailWeergave) automatically pick up runtime thresholds without any prop-drilling or call-site changes. This is the SC-4 wiring path.

3. **DeelgebiedenMatrix leerlijn grouping after SET-04 changes** (RESOLVED — fixed three-column layout, hide empty groups)
   - What we know: The GROEPEN constant in the component hardcodes three group labels.
   - What's unclear: If a user moves all deelgebieden out of one leerlijn into another, should an empty column disappear from the matrix?
   - Recommendation: Keep GROEPEN fixed (three columns always shown); empty groups show an empty column. This avoids dynamic column width changes.
   - **Resolution:** Fixed three-column table layout retained. When all deelgebieden in a leerlijn are toggled off (active=false) OR reassigned to a different leerlijn via SET-04, the column header stays but the empty leerlijn group renders without rows (effectively hidden body). Plan 18-05 Task 2 builds the runtime-mapping-aware `groepDG` so visually-empty groups are tolerated; the table structure does not collapse. This avoids dynamic column width recalculation.'''

assert old_block in s, "Open Questions block not found"
s = s.replace(old_block, new_block)

with open(p, 'w', encoding='utf-8', newline='\n') as f: f.write(s)
print('OK')

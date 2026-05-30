import sys
p = '.planning/phases/18-settings-panel-advanced/18-03-PLAN.md'
with open(p, encoding='utf-8') as f: s = f.read()

# 1. Add SC-4 truth into must_haves.truths
old_truth = '    - "berekenStatus returns oranje/Verzuim when ongeoorloofd > ongeoorloofd-threshold OR when geoorloofd > geoorloofd-threshold (NEW per D-08)"'
new_truth = old_truth + '\n    - "berekenStatus(student, traject) WITHOUT thresholds arg internally calls getVerzuimDrempelsSync() so all existing tile call sites (KlasOverzicht, LeerlingTegel) see runtime thresholds automatically (SC-4 wiring)"'
assert old_truth in s, "truth anchor missing"
s = s.replace(old_truth, new_truth)

# 2. Add key_link from status.ts -> verzuimDrempels.ts
old_kl = '    - from: src/utils/status.ts\n      to: src/components/VerzuimSection.tsx\n      via: "shared VerzuimDrempels shape (caller passes thresholds)"\n      pattern: "thresholds\\\\?: \\\\{ geoorloofd"'
new_kl = old_kl + '\n    - from: src/utils/status.ts\n      to: utils/verzuimDrempels.ts\n      via: "getVerzuimDrempelsSync() - default thresholds fallback when caller omits the thresholds argument (SC-4)"\n      pattern: "getVerzuimDrempelsSync"'
assert old_kl in s, "key_links anchor not found"
s = s.replace(old_kl, new_kl)

# 3. Update artifact `contains` for status.ts
old_art = '    - path: src/utils/status.ts\n      provides: "berekenStatus with thresholds parameter; hardcoded VERZUIM_DREMPEL_MIN removed"\n      contains: "thresholds?:"'
new_art = '    - path: src/utils/status.ts\n      provides: "berekenStatus with thresholds parameter + internal getVerzuimDrempelsSync() fallback; hardcoded VERZUIM_DREMPEL_MIN removed"\n      contains: "getVerzuimDrempelsSync"'
assert old_art in s, "artifact anchor missing"
s = s.replace(old_art, new_art)

# 4. Update interfaces block for status.ts
old_iface = '''src/utils/status.ts (modified):
  // REMOVE line 15: const VERZUIM_DREMPEL_MIN = 600;
  // Signature change:
  export function berekenStatus(
    student: any,
    traject?: string,
    thresholds?: { geoorloofd: number; ongeoorloofd: number }
  ): StatusResult
  // Inside body, replace the hardcoded `> 600` check with both checks per D-08:
  //   const ongeoorloofd = student.verzuim?.ongeoorloofd ?? 0;
  //   const geoorloofd   = student.verzuim?.geoorloofd   ?? 0;
  //   const ongeoorloofdrempel = thresholds?.ongeoorloofd ?? 600;
  //   const geoorloofdrempel   = thresholds?.geoorloofd   ?? 900;
  //   if (ongeoorloofd > ongeoorloofdrempel || geoorloofd > geoorloofdrempel)
  //     return { kleur:'oranje', label:'Verzuim', prognose: p };
  // The order of checks in the existing chain (Onbekend → Risico → Let op → Verzuim → ...)
  // is PRESERVED. Only the Verzuim condition expands per D-08.'''
new_iface = '''src/utils/status.ts (modified):
  // REMOVE line 15: const VERZUIM_DREMPEL_MIN = 600;
  // ADD import: import { getVerzuimDrempelsSync } from '../../utils/verzuimDrempels';
  // Signature change:
  export function berekenStatus(
    student: any,
    traject?: string,
    thresholds?: { geoorloofd: number; ongeoorloofd: number }
  ): StatusResult
  // Inside body, FIRST resolve thresholds against the runtime cache when caller omits them (SC-4):
  //   const resolvedThresholds = thresholds ?? getVerzuimDrempelsSync();
  // Then replace the hardcoded `> 600` check with both checks per D-08:
  //   const ongeoorloofd = student.verzuim?.ongeoorloofd ?? 0;
  //   const geoorloofd   = student.verzuim?.geoorloofd   ?? 0;
  //   const ongeoorloofdrempel = resolvedThresholds.ongeoorloofd;
  //   const geoorloofdrempel   = resolvedThresholds.geoorloofd;
  //   if (ongeoorloofd > ongeoorloofdrempel || geoorloofd > geoorloofdrempel)
  //     return { kleur:'oranje', label:'Verzuim', prognose: p };
  // The order of checks in the existing chain (Onbekend → Risico → Let op → Verzuim → ...)
  // is PRESERVED. Only the Verzuim condition expands per D-08.
  // RATIONALE: by resolving thresholds inside berekenStatus, every call site
  // (KlasOverzicht, LeerlingTegel, DetailWeergave, etc.) automatically picks up
  // the runtime threshold WITHOUT any call-site changes. This is the SC-4 wiring.'''
# The original uses fancy arrows. Check existence first.
if old_iface not in s:
    # Try alternative with -> arrows already
    print("iface anchor (arrows) not found, attempting alternative")
    # Print 100 chars around 'REMOVE line 15' to debug
    idx = s.find('REMOVE line 15')
    print(repr(s[idx:idx+1200]))
    sys.exit(1)
s = s.replace(old_iface, new_iface)

# 5. Update NOTE on call sites
old_note = '''NOTE on call sites:
  This plan does NOT update KlasOverzicht.tsx / LeerlingTegel.tsx / DoortstroomPrognoseSection.tsx
  callers to PASS thresholds or activeDeelgebiedenIds. They continue to call
  berekenStatus(student) and berekenPrognose(student, traject) with no extra args. The optional
  parameter defaults preserve current behavior. Wave 2 plans pick up the live wiring (Plan 18-05
  threads getVerzuimDrempelsSync + getActiveDGIds into the matrix/spider/status call sites).'''
new_note = '''NOTE on call sites:
  This plan does NOT update KlasOverzicht.tsx / LeerlingTegel.tsx / DoortstroomPrognoseSection.tsx
  callers to PASS thresholds or activeDeelgebiedenIds. They continue to call
  berekenStatus(student) and berekenPrognose(student, traject) with no extra args. Because
  berekenStatus internally falls back to getVerzuimDrempelsSync() when thresholds is undefined,
  all existing tile call sites automatically reflect runtime threshold edits (SC-4). For
  activeDeelgebiedenIds, Wave 3 (Plan 18-05) threads getActiveDGIds into the matrix/spider call sites.'''
assert old_note in s, "note anchor missing"
s = s.replace(old_note, new_note)

# 6. Update Task 2 action
old_action_chunk = "In src/utils/status.ts: delete the line `const VERZUIM_DREMPEL_MIN = 600;`. Change berekenStatus signature to add a third parameter `thresholds?: { geoorloofd: number; ongeoorloofd: number }`. At the top of the body (immediately after the existing initial setup), compute: `const ongeoorloofdrempel = thresholds?.ongeoorloofd ?? 600;` and `const geoorloofdrempel = thresholds?.geoorloofd ?? 900;`. Read both verzuim values from the student: `const ongeoorloofd = student.verzuim?.ongeoorloofd ?? 0;` and `const geoorloofd = student.verzuim?.geoorloofd ?? 0;`. Replace the existing Verzuim-detection if-statement (currently `if (ongeoorloofd > VERZUIM_DREMPEL_MIN)` or similar) with: `if (ongeoorloofd > ongeoorloofdrempel || geoorloofd > geoorloofdrempel) return { kleur: 'oranje', label: 'Verzuim', prognose: p };`. Keep the position of this check in the return-chain identical to its current position (between \"Let op\" and \"sbc\"). Do NOT change any other return paths."
new_action_chunk = "In src/utils/status.ts: delete the line `const VERZUIM_DREMPEL_MIN = 600;`. Add the import `import { getVerzuimDrempelsSync } from '../../utils/verzuimDrempels';` at the top of the file (verify the relative path matches existing util imports in src/utils/status.ts). Change berekenStatus signature to add a third parameter `thresholds?: { geoorloofd: number; ongeoorloofd: number }`. At the top of the body (immediately after the existing initial setup), FIRST resolve thresholds against the runtime cache: `const resolvedThresholds = thresholds ?? getVerzuimDrempelsSync();` - this is the SC-4 wiring: when callers (KlasOverzicht tiles, LeerlingTegel, etc.) omit the argument, berekenStatus pulls the runtime threshold from the verzuimDrempels sync cache instead of falling back to a hardcoded literal. Then compute `const ongeoorloofdrempel = resolvedThresholds.ongeoorloofd;` and `const geoorloofdrempel = resolvedThresholds.geoorloofd;`. Read both verzuim values from the student: `const ongeoorloofd = student.verzuim?.ongeoorloofd ?? 0;` and `const geoorloofd = student.verzuim?.geoorloofd ?? 0;`. Replace the existing Verzuim-detection if-statement (currently `if (ongeoorloofd > VERZUIM_DREMPEL_MIN)` or similar) with: `if (ongeoorloofd > ongeoorloofdrempel || geoorloofd > geoorloofdrempel) return { kleur: 'oranje', label: 'Verzuim', prognose: p };`. Keep the position of this check in the return-chain identical to its current position (between \"Let op\" and \"sbc\"). Do NOT change any other return paths."
assert old_action_chunk in s, "action chunk anchor not found"
s = s.replace(old_action_chunk, new_action_chunk)

# 7. Update Task 2 behavior
old_behavior = '''    - berekenStatus(student, undefined, undefined) returns identical result to current production behavior
    - berekenStatus(student, traject, { geoorloofd: 60, ongeoorloofd: 60 }) returns oranje/Verzuim when student.verzuim.ongeoorloofd > 60
    - berekenStatus(student, traject, { geoorloofd: 60, ongeoorloofd: 9999 }) returns oranje/Verzuim when student.verzuim.geoorloofd > 60 (NEW path per D-08)
    - VerzuimSection's bold-red styling activates when ongeoorloofd > the runtime threshold (not hardcoded 600); when threshold default is 600, behavior matches pre-change'''
new_behavior = '''    - berekenStatus(student, undefined, undefined) reads runtime thresholds via getVerzuimDrempelsSync() - when the cache holds default 900/600 the result is identical to current production behavior
    - berekenStatus(student, traject, { geoorloofd: 60, ongeoorloofd: 60 }) returns oranje/Verzuim when student.verzuim.ongeoorloofd > 60 (explicit thresholds override runtime cache)
    - berekenStatus(student, traject, { geoorloofd: 60, ongeoorloofd: 9999 }) returns oranje/Verzuim when student.verzuim.geoorloofd > 60 (NEW path per D-08)
    - SC-4 wiring: berekenStatus(student) WITHOUT thresholds arg returns oranje/Verzuim when the runtime cache contains a custom geoorloofd threshold (e.g., 120) that student.verzuim.geoorloofd exceeds - no call-site change required
    - VerzuimSection's bold-red styling activates when ongeoorloofd > the runtime threshold (not hardcoded 600); when threshold default is 600, behavior matches pre-change'''
assert old_behavior in s, "behavior anchor missing"
s = s.replace(old_behavior, new_behavior)

# 8. Update Task 2 acceptance_criteria
old_ac = '    - src/utils/status.ts body contains `thresholds?.geoorloofd ?? 900` AND `thresholds?.ongeoorloofd ?? 600` (grep, two distinct matches)'
new_ac = '    - src/utils/status.ts imports `getVerzuimDrempelsSync` from utils/verzuimDrempels (grep returns the import line)\n    - src/utils/status.ts body contains the literal `thresholds ?? getVerzuimDrempelsSync()` (grep - exactly one match, the resolvedThresholds line)\n    - berekenStatus() returns oranje/Verzuim when a custom geoorloofd threshold in the runtime verzuimDrempels cache is exceeded EVEN WHEN no thresholds argument is passed (tests/status.test.ts MUST cover this case - extend Plan 18-01 test list if not already covered; assert by stubbing the verzuimDrempels module before importing status)'
assert old_ac in s, "ac anchor missing"
s = s.replace(old_ac, new_ac)

with open(p, 'w', encoding='utf-8', newline='\n') as f: f.write(s)
print('OK')

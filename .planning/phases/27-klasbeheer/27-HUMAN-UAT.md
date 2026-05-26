---
status: partial
phase: 27-klasbeheer
source: [27-VERIFICATION.md]
started: 2026-05-26T19:15:00Z
updated: 2026-05-26T19:15:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Hover visibility — × button CSS transition
expected: Hovering over an empty-klas tab reveals the × button with a smooth opacity transition (0.15s ease). Tabs with imported students show no × button at all.
result: [pending]

### 2. Keyboard :focus-within — × button via keyboard
expected: Tabbing to a tab (keyboard navigation) makes the × button visible and reachable without a mouse. `:focus-within` CSS rule applies correctly in Tauri WebView2.
result: [pending]

### 3. Input pre-selection — double-click text pre-selected
expected: Double-clicking a tab name shows an inline input with the current name pre-selected (ready to overwrite). `inputRef.current.select()` fires after React renders the input.
result: [pending]

### 4. KLS-03 name propagation — tab strip + KlasOverzicht header update
expected: After renaming a klas (Enter or blur), the tab strip shows the new name immediately, and the KlasOverzicht header (if visible) also reflects the updated name. Requires running app with encrypted store.
result: [pending]

### 5. Delete confirm dialog — window.confirm + tab removal
expected: Clicking × on an empty-klas tab shows a confirm dialog with the klas name. Confirming removes the tab. Cancelling leaves the tab intact. Requires Tauri WebView.
result: [pending]

### 6. canDelete runtime accuracy — × absent on non-empty tabs
expected: After importing students into a klas, that tab's × button is absent (canDelete === false). The × is only visible on empty klassen (0 students).
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps

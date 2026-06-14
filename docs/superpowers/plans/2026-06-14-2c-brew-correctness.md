# Wave 2C · Piece 1 — Brew Correctness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the brewing batch-DC bug, harden the selected-herbs React key, and add an optional
"roll it myself" checkbox — so the brew flow is correct before special arrows are built on top of it.

**Architecture:** All changes are client-side in the existing brew page/components — no DB or
migration changes. The brew already computes a DC (`getBrewingDC`, `constants.ts:136`) and auto-rolls
a d20; we feed it the correct per-brew herb count and add a manual-roll path that skips the auto-roll.

**Tech Stack:** Next.js 16 (App Router, client components), React 19, React Query, Tailwind v4.
No unit-test runner — verification is `npm run build` + `npm run lint` + manual checks in `npm run dev`.

**Spec:** `docs/superpowers/specs/2026-06-14-wave2c-weapons-combat-design.md`

---

### Task 1: Fix batch-DC inflation

**Why:** In by-recipe batch mode, `totalHerbsSelected` is the herbs for *all* batches
(`addHerb` caps at `MAX_HERBS_PER_BREW * batchCount`). `executeBrewWithEffects` then computes
`getBrewingDC(totalHerbsSelected)`, so a 3× batch gets a DC as if all herbs went into one giant
brew. Each individual brew should use its own per-brew herb count.

**Files:**
- Modify: `src/app/(app)/brew/page.tsx` (`executeBrewWithEffects`, around line 228)

- [ ] **Step 1: Replace the DC computation with a per-brew count**

In `executeBrewWithEffects`, replace:

```tsx
    const dc = getBrewingDC(totalHerbsSelected)
```

with:

```tsx
    // DC scales with herbs used in a SINGLE brew. In batch mode totalHerbsSelected
    // covers all `batch` brews, so divide to get the per-brew ingredient count.
    const herbsPerBrew = batch > 0 ? Math.round(totalHerbsSelected / batch) : totalHerbsSelected
    const dc = getBrewingDC(herbsPerBrew)
```

(Leave `executeBrew()` at line 154 unchanged — it's by-herbs mode where batch is always 1, so
`getBrewingDC(totalHerbsSelected)` is already correct.)

- [ ] **Step 2: Build + lint**

Run: `npm run build && npm run lint`
Expected: clean build, no new lint errors.

- [ ] **Step 3: Manual verify**

Run `npm run dev`, brew in by-recipe mode with a recipe needing 2 herbs:
- Batch ×1 → result screen shows `DC 10` (6 + 2×2).
- Batch ×3 → result screen still shows `DC 10` per brew (previously inflated to ~18).

- [ ] **Step 4: Commit**

```bash
git add src/app/\(app\)/brew/page.tsx
git commit -m "fix: brew batch DC uses per-brew herb count, not batch total"
```

---

### Task 2: Harden the selected-herbs React key

**Why:** `bugs.md` reports "two children with the same key, `4`" at `HerbSelector.tsx:160`
(`SelectedHerbsSummary`). `selectedHerbs` is derived from a Map so ids *should* be unique, but the
crash is reported in the wild (likely duplicate inventory rows). A stable composite key removes the
crash regardless of data, per CLAUDE.md gotcha #7 (never rely on `item.id` alone when an item could
repeat).

**Files:**
- Modify: `src/components/brew/HerbSelector.tsx` (`SelectedHerbsSummary` map, lines 157-174)

- [ ] **Step 1: Add the index and use a composite key**

Replace:

```tsx
            {selectedHerbs.map(item => {
              const qty = selectedQuantities.get(item.id) || 0
              return (
                <div
                  key={item.id}
```

with:

```tsx
            {selectedHerbs.map((item, idx) => {
              const qty = selectedQuantities.get(item.id) || 0
              return (
                <div
                  key={`${item.id}-${idx}`}
```

- [ ] **Step 2: Build + lint**

Run: `npm run build && npm run lint`
Expected: clean.

- [ ] **Step 3: Manual verify**

Run `npm run dev`, open the browser console on the Brew page, select several herbs (including 2+ of
the same herb). Confirm **no** "two children with the same key" error appears.

- [ ] **Step 4: Commit**

```bash
git add src/components/brew/HerbSelector.tsx
git commit -m "fix: stable composite key for selected-herbs summary"
```

---

### Task 3: Optional "roll it myself" checkbox

**Why:** Brewing is downtime, so the app rolls by default — but the user wants an opt-in to roll
table-side. When on, the app must show the DC + brewing modifier and let the player enter their
natural d20, then compute success itself (still no app-side randomness). Persist the choice in
`localStorage` so it sticks per browser.

**Files:**
- Modify: `src/app/(app)/brew/page.tsx` (add roll-mode state + checkbox UI + manual-roll branch in
  the brew executors)

- [ ] **Step 1: Add roll-mode state, persisted to localStorage**

Near the other `useState` declarations at the top of `BrewPage`, add:

```tsx
  const [manualRoll, setManualRoll] = useState(false)

  useEffect(() => {
    setManualRoll(localStorage.getItem('brew:manualRoll') === '1')
  }, [])

  function toggleManualRoll(next: boolean) {
    setManualRoll(next)
    localStorage.setItem('brew:manualRoll', next ? '1' : '0')
  }
```

(`useState`/`useEffect` are already imported in this file.)

- [ ] **Step 2: Render the checkbox under the brewing-modifier line**

In the returned JSX, immediately after the "Brewing modifier" `<p>` (around line 359), add:

```tsx
        <label className="flex items-center gap-2 mb-4 text-sm text-vellum-300 select-none cursor-pointer">
          <input
            type="checkbox"
            checked={manualRoll}
            onChange={(e) => toggleManualRoll(e.target.checked)}
          />
          Roll the d20 myself (table-side)
        </label>
```

- [ ] **Step 3: Add a shared roll helper that respects the mode**

Above `executeBrew`, add a helper that returns the natural d20 either by auto-roll or by prompting:

```tsx
  // Returns the natural d20 for a brew attempt. In manual mode the player enters it;
  // the app never invents randomness in manual mode. Returns null if the player cancels.
  function getBrewRoll(attemptLabel: string): number | null {
    if (!manualRoll) return rollD20()
    const entry = window.prompt(`Enter your d20 roll${attemptLabel} (1-20):`)
    if (entry === null) return null
    const n = parseInt(entry, 10)
    if (Number.isNaN(n) || n < 1 || n > 20) {
      actions.setMutationError('Enter a number from 1 to 20.')
      return null
    }
    return n
  }
```

- [ ] **Step 4: Use the helper in all three roll sites**

In `executeBrew` replace `const roll = rollD20()` with:

```tsx
    const roll = getBrewRoll('')
    if (roll === null) { actions.setPhase({ phase: 'select-herbs' }); return }
```

In `executeBrewWithEffects` single-brew branch replace `const roll = rollD20()` with:

```tsx
      const roll = getBrewRoll('')
      if (roll === null) { actions.setPhase({ phase: 'select-herbs' }); return }
```

In the batch loop replace `const roll = rollD20()` with:

```tsx
      const roll = getBrewRoll(` (brew ${i + 1} of ${batch})`)
      if (roll === null) { actions.setPhase({ phase: 'select-recipes' }); return }
```

- [ ] **Step 5: Build + lint**

Run: `npm run build && npm run lint`
Expected: clean.

- [ ] **Step 6: Manual verify**

Run `npm run dev`:
- Default (unchecked): brewing auto-rolls as before; result screen shows the roll.
- Checked, reload page → still checked (localStorage). Brew → prompted for your d20; enter `15` →
  result shows `15 + mod` vs the DC. Cancel the prompt → returns to the herb/recipe screen, no herbs lost.

- [ ] **Step 7: Commit**

```bash
git add src/app/\(app\)/brew/page.tsx
git commit -m "feat: optional table-side d20 entry for brewing"
```

---

### Task 4: Surface batch-waste in the result copy

**Why:** Failed batch attempts still consume their herbs (intended). Make that explicit so it
isn't mistaken for a bug.

**Files:**
- Modify: `src/components/brew/ResultPhase.tsx` (batch result block, near the `failCount` line ~112)

- [ ] **Step 1: Add a note when some batch attempts failed**

Where `failCount` is computed/used in the batch result UI, render a note when `failCount > 0`:

```tsx
        {failCount > 0 && (
          <p className="text-vellum-400 text-xs mt-2">
            {failCount} failed {failCount === 1 ? 'attempt' : 'attempts'} — their ingredients were used up.
          </p>
        )}
```

- [ ] **Step 2: Build + lint**

Run: `npm run build && npm run lint`
Expected: clean.

- [ ] **Step 3: Manual verify**

Run `npm run dev`, batch-brew several copies until at least one fails (use manual roll = 1 to force a
fail). Confirm the "ingredients were used up" note appears.

- [ ] **Step 4: Commit**

```bash
git add src/components/brew/ResultPhase.tsx
git commit -m "chore: note consumed ingredients on failed batch brews"
```

---

### Task 5: Verify the element-pairing toggle (no code expected)

**Why:** The backlog "selecting an already-selected element adds an extra / can't unselect the first
of a pair" bug appears already fixed — `PairingPhase.tsx` uses index-based `handleElementClick`.
Confirm before closing it out.

- [ ] **Step 1: Manual verify**

Run `npm run dev`, enter pairing with 4+ elements including a duplicate element value:
- Tap an element → it highlights. Tap the *same* tile again → it deselects (no phantom pair).
- Tap a different tile → a pair forms. Confirm no extra/wrong element is consumed.

- [ ] **Step 2:** If it misbehaves, STOP and write a follow-up task. If correct, note "verified" in
  the commit for Task 4 or a separate empty commit — no code change needed.

---

## Self-review notes

- **Spec coverage:** Covers Piece 1's batch-DC fix, live-roll checkbox, duplicate-key fix,
  batch-waste copy, and pairing verification. Weapon/ammo/AC pieces are out of scope (separate plans).
- **Flagged, NOT in this plan:** the stale `vocation === 'herbalist'` brew gate at
  `brew/page.tsx:329` — needs user confirmation before changing access control.
- **Type consistency:** `getBrewRoll` returns `number | null`; all three call sites handle `null`.
  `manualRoll`/`toggleManualRoll` names are consistent across state, UI, and helper.

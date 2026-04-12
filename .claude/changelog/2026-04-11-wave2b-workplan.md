# Wave 2B — Herbalism & Inventory Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the grimoire design system to all herbalism pages while adding herb info modals, stackable effect highlights, brewed inventory redesign, and recipe→brew navigation.

**Architecture:** Page-by-page approach — Inventory → Recipes → Forage → Brew. Each piece ships functional + visual changes together. Inventory builds HerbInfoModal, which all later pieces reuse. Use `/frontend-design` for all visual component work.

**Tech Stack:** Next.js 16 (App Router), React, Tailwind CSS v4, Supabase, React Query. Design system from Wave 2.0 (GrimoireCard, Modal, Tabs, Button, Input, etc.)

**Spec:** `docs/superpowers/specs/2026-04-11-herbalism-inventory-design.md` (to be saved from brainstorm)
**Mockups:** `.superpowers/brainstorm/2b-brainstorm/` (brewed-v2, herbs-v5, recipe-card-design)

---

## File Structure

### New files
| File | Responsibility |
|------|---------------|
| `src/components/inventory/HerbInfoModal.tsx` | Universal herb detail modal (scroll metaphor, description/property/biomes) |
| `src/lib/db/herbBiomes.ts` | `fetchHerbBiomes(herbId)` — reverse lookup: herb → biome names |
| `src/lib/utils/stackableText.tsx` | Parse `*...*` in recipe text → React elements with tooltip spans |
| `src/lib/utils/romanNumeral.ts` | `toRoman(n)` — potency number to Roman numeral |

### Modified files (by piece)

**Piece 1 — Inventory:**
- `src/components/inventory/herbalism/HerbalismSection.tsx` — tabs → Tabs component, HerbInfoModal state
- `src/components/inventory/herbalism/HerbsTabContent.tsx` — grimoire herb list with element suffusion
- `src/components/inventory/herbalism/BrewedTabContent.tsx` — grimoire brewed items with expand/collapse
- `src/components/inventory/HerbRow.tsx` — element beside name, tappable, icon slot
- `src/components/inventory/BrewedItemCard.tsx` — potency Roman numeral, effect always visible, expand for flavor
- `src/components/inventory/ElementSummary.tsx` — grimoire styling
- `src/components/inventory/herbalism/AddHerbModal.tsx` — use Modal + Input components
- `src/components/inventory/herbalism/AddElixirModal.tsx` — use Modal + Input components
- `src/components/profile/InventoryPanel.tsx` — grimoire wrapper
- `src/components/inventory/herbalism/index.ts` — export HerbInfoModal
- `src/lib/hooks/queries.ts` — add `useHerbBiomes` hook

**Piece 2 — Recipes:**
- `src/components/recipes/RecipeCard.tsx` — grimoire card, stackable highlights, "Brew This" button
- `src/components/profile/JournalPanel.tsx` — grimoire styling, Tabs

**Piece 3 — Forage:**
- `src/app/(app)/forage/page.tsx` — PageLayout, grimoire wrapper
- `src/components/forage/SetupPhase.tsx` — GrimoireCard, Button, Input
- `src/components/forage/ResultsPhase.tsx` — grimoire styling, HerbInfoModal integration
- `src/components/forage/BiomeCard.tsx` — GrimoireCard with element accents

**Piece 4 — Brew:**
- `src/app/(app)/brew/page.tsx` — PageLayout, URL param handling for recipe pre-select
- `src/components/brew/HerbSelector.tsx` — grimoire styling, HerbInfoModal integration
- `src/components/brew/PairingPhase.tsx` — grimoire styling
- `src/components/brew/ChoicesPhase.tsx` — grimoire inputs
- `src/components/brew/ResultPhase.tsx` — grimoire result card
- `src/components/brew/BatchResultPhase.tsx` — grimoire batch results
- `src/components/brew/RecipeSelector.tsx` — grimoire styling, accept URL param
- `src/components/brew/RecipeRequirements.tsx` — grimoire styling
- `src/components/brew/ModeToggle.tsx` — Tabs component

---

## Task 1: Utility Functions + Data Layer

**Files:**
- Create: `src/lib/utils/romanNumeral.ts`
- Create: `src/lib/utils/stackableText.tsx`
- Create: `src/lib/db/herbBiomes.ts`
- Modify: `src/lib/hooks/queries.ts`

- [ ] **Step 1: Create Roman numeral helper**

Create `src/lib/utils/romanNumeral.ts`:
```ts
const ROMAN_MAP: [number, string][] = [
  [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
]

export function toRoman(n: number): string {
  if (n <= 0) return String(n)
  let result = ''
  for (const [value, numeral] of ROMAN_MAP) {
    while (n >= value) { result += numeral; n -= value }
  }
  return result
}
```

- [ ] **Step 2: Create stackable text parser**

Create `src/lib/utils/stackableText.tsx` — parses `*...*` segments in recipe_text into React elements with stackable tooltip styling. Returns an array of `ReactNode` (plain strings and styled spans).

```tsx
import { ReactNode } from 'react'

export function parseStackableText(text: string, colorClass?: string): ReactNode[] {
  const parts: ReactNode[] = []
  const regex = /\*([^*]+)\*/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    parts.push(
      <span key={match.index} className={`stackable-value ${colorClass || ''}`} title="Scales with potency">
        {match[1]}
      </span>
    )
    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts
}
```

The `.stackable-value` CSS class will be added to `globals.css`:
```css
.stackable-value {
  font-weight: 700;
  border-bottom: 2px dotted currentColor;
  cursor: help;
}
```

- [ ] **Step 3: Create herb→biome lookup**

Create `src/lib/db/herbBiomes.ts`:
```ts
import { supabase } from '../supabase'

export async function fetchHerbBiomes(herbId: number): Promise<{
  data: { id: number; name: string }[] | null
  error: string | null
}> {
  const { data, error } = await supabase
    .from('biome_herbs')
    .select('biome_id, biomes(id, name)')
    .eq('herb_id', herbId)

  if (error) return { data: null, error: error.message }

  const biomes = (data || [])
    .map(bh => bh.biomes as unknown as { id: number; name: string })
    .filter(Boolean)

  return { data: biomes, error: null }
}
```

- [ ] **Step 4: Add useHerbBiomes hook**

In `src/lib/hooks/queries.ts`, add query key and hook:
```ts
// In queryKeys:
herbBiomes: (herbId: number) => ['herbBiomes', herbId] as const,

// New hook:
export function useHerbBiomes(herbId: number | null) {
  return useQuery({
    queryKey: herbId ? queryKeys.herbBiomes(herbId) : ['herbBiomes-disabled'],
    queryFn: () => fetchHerbBiomes(herbId!),
    enabled: herbId !== null,
    staleTime: 30 * 60 * 1000, // 30 min — biome data is static
    select: (result) => result.data ?? [],
  })
}
```

Import `fetchHerbBiomes` from `@/lib/db/herbBiomes`.

- [ ] **Step 5: Add stackable-value CSS to globals.css**

Add to `src/app/globals.css`:
```css
.stackable-value {
  font-weight: 700;
  border-bottom: 2px dotted currentColor;
  cursor: help;
  padding-bottom: 1px;
}
```

- [ ] **Step 6: Build check**

Run: `npm run build`
Expected: PASS (no components reference the new files yet)

- [ ] **Step 7: Commit**

```bash
git add src/lib/utils/romanNumeral.ts src/lib/utils/stackableText.tsx src/lib/db/herbBiomes.ts src/lib/hooks/queries.ts src/app/globals.css
git commit -m "add utility functions for 2B: roman numerals, stackable text, herb biomes"
```

---

## Task 2: HerbInfoModal Component

**Files:**
- Create: `src/components/inventory/HerbInfoModal.tsx`
- Modify: `src/components/inventory/herbalism/index.ts` — add export

- [ ] **Step 1: Create HerbInfoModal**

Create `src/components/inventory/HerbInfoModal.tsx` — scroll-themed modal showing herb details.

Props: `{ herb: Herb; open: boolean; onClose: () => void }`

Uses `Modal` component as base, overrides inner styling for scroll metaphor:
- Wooden dowel curls (top/bottom divs with wood-grain gradients)
- Parchment body (warm tones, noise texture, inset shadow edges)
- Dark ink text on parchment
- Sections: header (icon-slot + name + rarity), element pills, description, property (conditional), biomes
- Calls `useHerbBiomes(herb.id)` for biome data

Reference mockup: `.superpowers/brainstorm/2b-brainstorm/herbs-v5.html` (right panel)

Use `/frontend-design` skill to ensure Apple-level polish. The scroll should feel like unfurling an ancient document.

- [ ] **Step 2: Export from barrel**

Add to `src/components/inventory/herbalism/index.ts`:
```ts
export { HerbInfoModal } from '../HerbInfoModal'
```

- [ ] **Step 3: Build check**

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/inventory/HerbInfoModal.tsx src/components/inventory/herbalism/index.ts
git commit -m "add HerbInfoModal: scroll-themed herb detail modal"
```

---

## Task 3: Herb List Redesign

**Files:**
- Modify: `src/components/inventory/HerbRow.tsx`
- Modify: `src/components/inventory/herbalism/HerbsTabContent.tsx`

- [ ] **Step 1: Redesign HerbRow**

Rewrite `HerbRow.tsx` with:
- Grid layout: icon-slot (✦) | name + elements inline | quantity (bronze, right-aligned) | delete (hover)
- Herb name is tappable (dotted underline) — accepts `onNameClick` prop
- Uses `getElementSymbol()` for correct element emojis
- No more alternating `colors.row1`/`colors.row2` props — colors come from parent element section

New props interface adds `onNameClick: () => void`.

Reference mockup: `.superpowers/brainstorm/2b-brainstorm/herbs-v5.html` (left panel)

Use `/frontend-design` for the actual styling.

- [ ] **Step 2: Redesign HerbsTabContent**

Rewrite `HerbsTabContent.tsx` with:
- Grimoire panel wrapper (use elevation classes, not GrimoireCard — this is inside InventoryPanel)
- Search input → `Input` component or grimoire-styled input
- Sort toggle → grimoire pill toggle (active/inactive states)
- Element sections as distinct bordered cards with full color suffusion:
  - Header: emoji + name + count (matching `getElementColors()` pattern)
  - Rarity sub-bars: thin separators
  - Rows bathed in element color (alternating tinted backgrounds)
- Passes `onNameClick` to each HerbRow to open HerbInfoModal
- HerbInfoModal state managed here: `selectedHerb` state + `<HerbInfoModal herb={selectedHerb} open={!!selectedHerb} onClose={() => setSelectedHerb(null)} />`

Reference: current `getElementColors()` provides `header`, `row1`, `row2`, `border`, `text` for each element. These should still be used but the overall wrapper gets grimoire elevation.

- [ ] **Step 3: Build check**

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Visual verification**

Run: `npm run dev`
Navigate to `/` → Inventory tab → Herbs sub-tab.
Verify: element sections with color suffusion, tappable herb names opening scroll modal, correct element symbols, quantities visible.

- [ ] **Step 5: Commit**

```bash
git add src/components/inventory/HerbRow.tsx src/components/inventory/herbalism/HerbsTabContent.tsx
git commit -m "redesign herb list: element suffusion, tappable names, icon slots"
```

---

## Task 4: Brewed Items Redesign

**Files:**
- Modify: `src/components/inventory/BrewedItemCard.tsx`
- Modify: `src/components/inventory/herbalism/BrewedTabContent.tsx`

- [ ] **Step 1: Redesign BrewedItemCard**

Rewrite `BrewedItemCard.tsx` with:
- Type-based color system (gradient bg, left accent bar, ambient glow)
- **Name + Potency:** "Healing Elixir **III**" — use `toRoman()` for potency, Cinzel gold
- **Effect text always visible** — second line, never behind expand. Parse `computed_description` to separate effect from flavor (split on first period for now, or use a smarter heuristic)
- **Stackable values** in effect text — use `parseStackableText()` on the effect portion
- **Expand on click** — reveals flavor text + Use / Expend All actions
- **Quantity prominent** — bronze right-aligned
- State: `expanded` boolean for click-to-expand

Import `toRoman` from `@/lib/utils/romanNumeral` and `parseStackableText` from `@/lib/utils/stackableText`.

Reference mockup: `.superpowers/brainstorm/2b-brainstorm/inventory-brewed-v2.html`

Use `/frontend-design` skill.

- [ ] **Step 2: Redesign BrewedTabContent**

Rewrite `BrewedTabContent.tsx` with:
- Type filter tabs (elixir/bomb/balm) → use `Tabs`/`TabList`/`Tab`/`TabPanel` from design system
- Cards list within each tab panel
- Grimoire panel styling
- Empty state with brew CTA

- [ ] **Step 3: Build check**

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Visual verification**

Navigate to `/` → Inventory tab → Brewed sub-tab.
Verify: potency as Roman numerals, effect text visible without expand, stackable values highlighted, expand reveals flavor + actions, quantity prominent.

- [ ] **Step 5: Commit**

```bash
git add src/components/inventory/BrewedItemCard.tsx src/components/inventory/herbalism/BrewedTabContent.tsx
git commit -m "redesign brewed inventory: potency identity, visible effects, expand for flavor"
```

---

## Task 5: Inventory Container + Modals + Summary

**Files:**
- Modify: `src/components/inventory/herbalism/HerbalismSection.tsx`
- Modify: `src/components/inventory/herbalism/AddHerbModal.tsx`
- Modify: `src/components/inventory/herbalism/AddElixirModal.tsx`
- Modify: `src/components/inventory/ElementSummary.tsx`
- Modify: `src/components/profile/InventoryPanel.tsx`

- [ ] **Step 1: Convert HerbalismSection tabs to Tabs component**

Replace the manual button tabs (zinc-styled) with `Tabs`/`TabList`/`Tab`/`TabPanel`:
- Herbs tab with count
- Brewed tab with count (only shown if `isHerbalist` or has brewed items)
- "+ Add" buttons in the tab bar area

- [ ] **Step 2: Convert AddHerbModal to use Modal component**

Replace the hardcoded `fixed inset-0 bg-black/70` wrapper with `<Modal>` component.
Style inner content with grimoire palette: search input → `Input`, buttons → `Button`, herb list → grimoire cards.

- [ ] **Step 3: Convert AddElixirModal to use Modal component**

Same pattern as AddHerbModal. Use `Modal`, `Input`, `Button`, `Select` components.

- [ ] **Step 4: Restyle ElementSummary**

Apply grimoire styling — use elevation classes, bronze accents for element bars/counts.

- [ ] **Step 5: Polish InventoryPanel wrapper**

Ensure the wrapper uses GrimoireCard or appropriate elevation. Remove any remaining zinc patterns.

- [ ] **Step 6: Build check**

Run: `npm run build`
Expected: PASS

- [ ] **Step 7: Visual verification — full inventory**

Navigate to `/` → Inventory tab.
Verify: Herbs and Brewed tabs work, add herb modal opens with grimoire styling, add elixir modal works, element summary styled, no zinc patterns remain.

- [ ] **Step 8: Commit**

```bash
git add src/components/inventory/ src/components/profile/InventoryPanel.tsx
git commit -m "complete inventory redesign: grimoire tabs, modals, summary"
```

---

## Task 6: Recipe Card Redesign

**Files:**
- Modify: `src/components/recipes/RecipeCard.tsx`
- Modify: `src/components/profile/JournalPanel.tsx`

- [ ] **Step 1: Redesign RecipeCard**

Rewrite `RecipeCard.tsx` with:
- Grimoire card with type-based gradient + left accent bar
- **Effect box** — clear container with type-colored border, "EFFECT" label in Cinzel
- **Stackable highlights** — use `parseStackableText(recipe.recipe_text)` to replace asterisks with styled spans
- **Lore section** — subtle left-border parchment style
- **"Brew This →" button** — per-recipe, type-colored pill, links to `/brew?recipe={recipe.id}`
- **Secret badge** — kept, grimoire-styled

Props: same `RecipeCardProps` interface. Add `Link` from `next/link` for brew navigation.

Reference mockup: `.superpowers/brainstorm/2b-brainstorm/recipe-card-design.html`

Use `/frontend-design` skill.

- [ ] **Step 2: Restyle JournalPanel**

Apply grimoire styling:
- Type tabs (elixir/bomb/balm) → `Tabs` component
- Recipe stats summary → grimoire badge
- Unlock code input/modal → `Modal`, `Input`, `Button`
- Empty states → grimoire cards

- [ ] **Step 3: Build check**

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Visual verification**

Navigate to `/` → Journal tab.
Verify: recipe cards with stackable highlights (hover to see tooltip), "Brew This" button present, lore in parchment style, type tabs work.

- [ ] **Step 5: Commit**

```bash
git add src/components/recipes/RecipeCard.tsx src/components/profile/JournalPanel.tsx
git commit -m "redesign recipe cards: stackable highlights, brew-this button, grimoire style"
```

---

## Task 7: Forage Page Visual Pass

**Files:**
- Modify: `src/app/(app)/forage/page.tsx`
- Modify: `src/components/forage/SetupPhase.tsx`
- Modify: `src/components/forage/ResultsPhase.tsx`
- Modify: `src/components/forage/BiomeCard.tsx`

- [ ] **Step 1: Restyle forage page wrapper**

Use `PageLayout` component. Replace zinc/emoji header with grimoire heading (Grenze Gotisch).

- [ ] **Step 2: Redesign BiomeCard**

Apply GrimoireCard styling. Element-appropriate accent colors for different biome themes. Use `Button` for allocation controls.

- [ ] **Step 3: Redesign SetupPhase**

Grimoire styling for session counter, biome allocation grid, and navigation buttons. Replace zinc colors with grimoire palette. Use `Button` and `Input` components.

- [ ] **Step 4: Redesign ResultsPhase**

Grimoire styling for results display. Herb results should have tappable names that open HerbInfoModal. Import and use `HerbInfoModal` with local `selectedHerb` state.

- [ ] **Step 5: Build check**

Run: `npm run build`
Expected: PASS

- [ ] **Step 6: Visual verification**

Navigate to `/forage`.
Verify: grimoire styling throughout, no zinc colors, HerbInfoModal works from results.

- [ ] **Step 7: Commit**

```bash
git add src/app/\(app\)/forage/ src/components/forage/
git commit -m "forage page visual pass: grimoire design system applied"
```

---

## Task 8: Brew Page Redesign

**Files:**
- Modify: `src/app/(app)/brew/page.tsx`
- Modify: `src/components/brew/HerbSelector.tsx`
- Modify: `src/components/brew/PairingPhase.tsx`
- Modify: `src/components/brew/ChoicesPhase.tsx`
- Modify: `src/components/brew/ResultPhase.tsx`
- Modify: `src/components/brew/BatchResultPhase.tsx`
- Modify: `src/components/brew/RecipeSelector.tsx`
- Modify: `src/components/brew/RecipeRequirements.tsx`
- Modify: `src/components/brew/ModeToggle.tsx`

- [ ] **Step 1: Add URL param handling to brew page**

In `src/app/(app)/brew/page.tsx`, read `?recipe={id}` from URL params using `useSearchParams()`. Pass the recipe ID to `RecipeSelector` as `initialRecipeId` prop.

- [ ] **Step 2: Update RecipeSelector to accept pre-selection**

Add `initialRecipeId?: number` prop. If provided, auto-select that recipe on mount and switch to by-recipe mode.

- [ ] **Step 3: Convert ModeToggle to Tabs**

Replace the custom toggle buttons with `Tabs`/`TabList`/`Tab` component.

- [ ] **Step 4: Redesign HerbSelector**

Apply grimoire styling. Make herb names tappable (dotted underline) → opens HerbInfoModal. Add local `selectedHerb` state + `<HerbInfoModal>`.

- [ ] **Step 5: Redesign PairingPhase**

Grimoire styling for element pairing UI. Use elevation classes, element accent colors.

- [ ] **Step 6: Redesign ChoicesPhase**

Grimoire styling. Use `Input`, `Select` components for template variable inputs.

- [ ] **Step 7: Redesign ResultPhase and BatchResultPhase**

Type-colored grimoire result cards. DC display as grimoire badge. Success/failure states with appropriate visual treatment.

- [ ] **Step 8: Redesign RecipeSelector and RecipeRequirements**

Grimoire card styling. Element requirement display with grimoire element accents.

- [ ] **Step 9: Build check**

Run: `npm run build`
Expected: PASS

- [ ] **Step 10: Visual verification — full brew flow**

Navigate to `/` → Journal → click "Brew This" on a recipe → verify it lands on `/brew?recipe={id}` with recipe pre-selected.
Test full brew flow: select herbs → pair → choose → brew → results.
Verify HerbInfoModal works from herb selector.

- [ ] **Step 11: Commit**

```bash
git add src/app/\(app\)/brew/ src/components/brew/
git commit -m "brew page redesign: grimoire styling, recipe pre-select, herb info modal"
```

---

## Task 9: Final Cleanup + Verification

- [ ] **Step 1: Full build check**

Run: `npm run build`
Expected: PASS with no warnings about unused variables

- [ ] **Step 2: Search for remaining zinc patterns**

Search for `zinc-` or `bg-zinc` in all modified files. Replace any stragglers with grimoire palette equivalents.

- [ ] **Step 3: End-to-end walkthrough**

1. `/` → Inventory → Herbs tab: element sections, tappable names → scroll modal with biomes
2. `/` → Inventory → Brewed tab: potency Roman numerals, visible effects, expand for flavor + use
3. `/` → Journal: stackable highlights on hover, "Brew This" button
4. Click "Brew This" → `/brew?recipe=N` → recipe pre-selected
5. `/forage` → grimoire styling, herb results tappable
6. `/brew` → full brew flow with grimoire styling

- [ ] **Step 4: Final commit if any cleanup needed**

---

## Key References

| Resource | Path |
|----------|------|
| Design system components | `src/components/ui/` (GrimoireCard, Modal, Tabs, Button, Input, etc.) |
| Element colors + symbols | `src/lib/constants.ts` — `getElementColors()`, `getElementSymbol()`, `ELEMENT_SYMBOLS` |
| Data hooks | `src/lib/hooks/queries.ts` — all `useCharacter*` hooks |
| DB functions | `src/lib/db/characterInventory.ts` — fetch/mutation functions |
| Brewing logic | `src/lib/brewing.ts` — `fillTemplate()`, `parseTemplateVariables()` |
| CSS foundation | `src/app/globals.css` — elevation, element accents, animations |
| Biome data | `src/lib/db/biomes.ts`, `src/lib/types.ts` — Biome, BiomeHerb types |
| Mockups | `.superpowers/brainstorm/2b-brainstorm/` — brewed-v2, herbs-v5, recipe-card-design |
| Design spec | `.claude/plans/` or `docs/superpowers/specs/2026-04-11-herbalism-inventory-design.md` |

## Notes for Implementer

- **Use `/frontend-design` skill** for all visual component work. The mockups show direction, not exact CSS — apply Apple-level polish with the grimoire aesthetic.
- **Element symbols:** 🔥💧⛰️💨🔆🌑 — use `getElementSymbol()`, never hardcode.
- **Herb icon placeholder:** ✦ in a dashed-border slot. NOT 🌿 (that's earth-like). Keep neutral.
- **Quantity indicator:** Must be prominent — bronze, right-aligned, clearly visible.
- **Potency:** Use `toRoman()` — "Healing Elixir III" not "potency 3".
- **Stackable text:** Parse `*...*` segments from `recipe_text` field. These mark portions that scale with potency.
- **HerbInfoModal sections:** Description first (what the herb IS), then Property (only if exists — special non-brewing uses), then biomes.
- **No used-in-recipes section** in HerbInfoModal — brewing use is determined by elements.
- **Each herb may have a future pixel-art icon** — design all herb displays with a placeholder slot that won't need restructuring.

# 2A: Profile & Navigation Restructure — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hub-and-spoke navigation with a persistent Ember & Silence nav bar, profile-as-home with sub-tabs, merged settings page, herbalism hub, and delete character flow.

**Architecture:** Route group `(app)/` with shared layout that renders the NavBar and centralizes auth. Profile sub-tabs (Character | Inventory | Journal) via client-state Tabs component with extracted content components. Login and create-character remain outside the group (no nav bar).

**Tech Stack:** Next.js 16 App Router, React, Tailwind CSS v4, Supabase, React Query

**Spec:** `docs/superpowers/specs/2026-03-12-profile-navigation-restructure.md`
**Nav mockup:** `.claude/ember-refined-v3.html` (APPROVED V3 with all CSS values)

---

## Scope

**In scope (spec decisions 1-9):**
- Persistent NavBar with bonfire active indicator
- Route group `(app)/` with centralized auth
- Profile-as-home with Character | Inventory | Journal sub-tabs
- Settings page (replaces /edit-character, unlocks identity fields)
- Herbalism hub page
- Delete character flow
- Locked tab tooltips (Martial Mastery, Archemancy, Alchemy)

**Out of scope (deferred to separate brainstorm):**
- Character bar improvements (trait modals, skill proficiencies)
- Mobile responsive nav collapse
- Character creation wizard restyling
- Design system application to existing page content (pages move as-is)

---

## File Structure

### New Files
```
src/app/(app)/layout.tsx                    — Auth guard + NavBar wrapper
src/app/(app)/page.tsx                      — Profile home with sub-tabs
src/app/(app)/settings/page.tsx             — Merged settings (replaces /edit-character)
src/app/(app)/herbalism/page.tsx            — Herbalism hub with overview + links
src/app/(app)/forage/page.tsx               — Moved from root (minus auth guard)
src/app/(app)/brew/page.tsx                 — Moved from root (minus auth guard)
src/components/NavBar.tsx                   — Ember & Silence persistent navigation bar
src/components/profile/CharacterSheet.tsx   — Extracted from profile page (CharacterView)
src/components/profile/InventoryPanel.tsx   — Extracted from inventory page
src/components/profile/JournalPanel.tsx     — Extracted from recipes page
src/components/profile/index.ts            — Barrel export
```

### Modified Files
```
src/app/globals.css                         — V3 palette tokens, bonfire keyframes, nav + sub-tab styles
src/components/ui/Tabs.tsx                  — Add variant prop for sub-tab styling
```

### Deleted Files
```
src/app/page.tsx                            — Replaced by (app)/page.tsx
src/app/profile/                            — Merged into home
src/app/edit-character/                     — Replaced by settings
src/app/inventory/                          — Absorbed into Inventory sub-tab
src/app/recipes/                            — Absorbed into Journal sub-tab
src/app/forage/                             — Moved into (app)/
src/app/brew/                               — Moved into (app)/
```

### Unchanged (stay outside route group)
```
src/app/login/page.tsx                      — No nav bar
src/app/create-character/page.tsx           — No nav bar
src/app/layout.tsx                          — Root layout (fonts, providers) untouched
```

---

## Dependency Graph

```
Task 1 (CSS tokens) ───────→ Task 2 (NavBar) ──→ Task 7 (route group layout)
                                                         │
Task 3 (Tab variant) ───────────────────────────────────→│
                                                         │
Task 4 (CharacterSheet) ┐                               │
Task 5 (InventoryPanel) ├──→ Task 8 (Profile home + delete old pages)
Task 6 (JournalPanel)   ┘         │
                                   ├──→ Task 9 (Move forage/brew)
                                   ├──→ Task 10 (Herbalism hub)      ← parallel
                                   ├──→ Task 11 (Settings)           ← parallel
                                   │         └──→ Task 12 (Delete character)
                                   └──→ Task 13 (Link cleanup) ──→ Task 14 (Verify + update docs)
```

**Parallelizable groups:**
- Tasks 3, 4, 5, 6 (all independent component work)
- Tasks 9, 10, 11 (independent pages, after route group + profile home exist)

---

## Chunk 1: CSS Foundation + NavBar

### Task 1: V3 Palette Tokens + Bonfire Animations

**Files:**
- Modify: `src/app/globals.css`

**Reference:** `.claude/ember-refined-v3.html` — extract exact values from the mockup's `:root` and `@keyframes`.

Add under a clearly labeled `/* === Ember & Silence V3 === */` section:

**Tokens to add to `:root`:**
```css
/* Nav bar palette (V3 — "Ember & Silence") */
--void: #181614;
--ink: #1e1b18;
--char: #24211c;
--soot: #38322a;
--deep-ash: #5c5347;
--ash: #877b6e;
--ash-light: #a49888;
--warm-white: #ede4d3;
--warm-mid: #c4b8a4;
--ember: #c9a96e;
--ember-bright: #e2c792;
--ember-hot: #dbb87a;
--ember-dim: #8a7548;
--ember-deep: #a38555;
--bonfire-core: #e8b44c;
--bonfire-mid: rgba(219,184,122,0.45);
--bonfire-outer: rgba(201,169,110,0.18);
--bonfire-whisper: rgba(201,169,110,0.06);
--emerald: #22c55e;
```

**Keyframes to add (copy exact values from mockup):**
- `@keyframes warmth` — character presence breathing (6s ease-in-out infinite)
- `@keyframes pool-breathe` — warmth pool opacity + scaleX oscillation (4s)
- `@keyframes ember-core` — ember width + box-shadow variation (4s, 3 keyframes)
- `@keyframes hp-breathe` — HP dot opacity + shadow pulse (3.5s)

**Nav utility classes to add:**
```css
/* Sub-tab styling (Profile page) — Almendra 14px */
.sub-tab-active {
  font-family: var(--font-almendra);
  font-size: 14px;
  color: var(--warm-mid);
  padding: 10px 18px;
  position: relative;
}
.sub-tab-active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 18px;
  right: 18px;
  height: 1px;
  background: var(--warm-mid);
  opacity: 0.4;
}
.sub-tab-inactive {
  font-family: var(--font-almendra);
  font-size: 14px;
  color: var(--ash);
  padding: 10px 18px;
  cursor: pointer;
  transition: color 0.3s ease;
}
.sub-tab-inactive:hover {
  color: var(--ash-light);
}
```

- [ ] Read `src/app/globals.css` header to find insertion point (after existing token block)
- [ ] Add V3 palette tokens to `:root`
- [ ] Add all 4 bonfire keyframes (copy exact curves/values from mockup)
- [ ] Add sub-tab classes
- [ ] Run `npm run build` to verify no CSS errors
- [ ] Commit: "add Ember & Silence V3 palette and bonfire animations"

---

### Task 2: Build NavBar Component

**Files:**
- Create: `src/components/NavBar.tsx`

**Dependencies:** Task 1 (CSS tokens must exist)

The NavBar is the visual centerpiece. Build it to match `.claude/ember-refined-v3.html` exactly.

**Props:**
```typescript
type NavBarProps = {
  character: Character | null  // For name display + HP
}
```

**Active tab detection** via `usePathname()` from `next/navigation`:
```typescript
const pathname = usePathname()
const activeSection =
  pathname === '/herbalism' || pathname === '/forage' || pathname === '/brew'
    ? 'herbalism'
    : 'profile'  // /, /settings all map to profile
```

**HTML structure (from mockup):**
```
nav.nav-bar (56px, flex, 20px horizontal padding)
├── div.presence (left — character emblem + name + subtitle)
│   ├── div.emblem (38px rounded square, obsidian gradient, bronze glow)
│   ├── div
│   │   ├── div.char-name (Grenze Gotisch 21px, --warm-white)
│   │   └── div.char-subtitle (Cinzel 10.5px uppercase, --ash, 2px tracking)
│   └── ::before (warmth aura radial gradient, warmth animation 6s)
├── div.system-tabs (center — flex, gap 8px)
│   ├── Link.sys-tab[active] (Profile — bonfire effect when activeSection === 'profile')
│   ├── Link.sys-tab[active] (Herbalism — green bonfire when activeSection === 'herbalism')
│   ├── span.sys-tab.locked (Martial Mastery — tooltip on hover)
│   ├── span.sys-tab.locked (Archemancy — tooltip on hover)
│   └── span.sys-tab.locked (Alchemy — tooltip on hover)
└── div.nav-end (right — flex, gap 18px)
    ├── div.vitals (HP ember dot + hover text)
    └── Link.gear-btn (⚙ → /settings, rotate 30deg on hover)
```

**Bonfire active indicator** — the active tab gets 4 CSS layers:
1. `text-shadow` glow (multi-radius, breathing)
2. `background: linear-gradient(to top, ...)` heat shimmer
3. `::before` pseudo — wide warmth pool (radial-gradient, pool-breathe animation)
4. `::after` pseudo — 24px ember core with box-shadow, ember-core animation

**Two bonfire color sets:**
- Profile (bronze): `--bonfire-core: #e8b44c` + warm gold glows
- Herbalism (green): core `#7db86a`, pool `rgba(109,155,90,...)` — use CSS class toggle

**Locked tab tooltips:**
```typescript
const LOCKED_TABS = [
  { name: 'Martial Mastery', flavor: 'Coming soon... The blade remembers.' },
  { name: 'Archemancy', flavor: 'Coming soon... The sigils wait.' },
  { name: 'Alchemy', flavor: 'Coming soon... The cauldron stirs.' },
]
```
Each locked tab: `position: relative`, tooltip as absolutely-positioned child div, hidden by default, visible on hover via CSS (`opacity 0→1, translateY`). Use `cubic-bezier(0.23, 1, 0.32, 1)` easing.

**HP indicator:**
- 6px green dot with breathing animation (hp-breathe keyframe)
- On hover: HP text fades in (`27 / 34` format) with translateX transition
- HP values from `character.hp_current` and `calculateMaxHP(character.con)`

**Gear icon:**
- Text ⚙ or SVG, 20px, `--ash` color, opacity 0.7
- Hover: color → `--ember`, opacity 1, rotate(30deg)
- Links to `/settings`

**Ember line (bottom border):**
```css
border-image: linear-gradient(90deg, var(--ember) 0%, rgba(201,169,110,0.5) 8%, ... transparent 100%) 1;
/* Or use ::after pseudo on .nav-bar */
```

**Character subtitle format:** `"Level {level} {Race} {Class}"` using constants for display names.

- [ ] Create `src/components/NavBar.tsx` with `'use client'` directive
- [ ] Implement character presence section (emblem + name + subtitle + warmth aura)
- [ ] Implement system tabs with `usePathname()`-based active detection
- [ ] Implement bonfire effect using CSS classes + pseudo-elements
- [ ] Add bronze and green bonfire color variants (CSS class toggle)
- [ ] Implement locked tabs with hover tooltips + flavor text
- [ ] Implement HP indicator with breathing dot + hover text reveal
- [ ] Implement gear icon with rotation hover linking to `/settings`
- [ ] Implement bottom ember line (gradient border)
- [ ] Run `npm run build`
- [ ] Commit: "build Ember & Silence NavBar component"

---

## Chunk 2: Content Extraction + Tab Variant

### Task 3: Add Sub-Tab Variant to Tabs Component

**Files:**
- Modify: `src/components/ui/Tabs.tsx`

Currently, `Tab` always applies `tab-active` / `tab-inactive` classes. Profile sub-tabs need `sub-tab-active` / `sub-tab-inactive` (Almendra 14px, subtle).

**Changes to Tab component:**

```typescript
type TabProps = {
  value: string
  children: ReactNode
  className?: string
  variant?: 'system' | 'sub'  // NEW — defaults to 'system'
}

export function Tab({ value, children, className = '', variant = 'system' }: TabProps) {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error('Tab must be used inside Tabs')
  const isActive = ctx.activeTab === value
  const activeClass = variant === 'sub' ? 'sub-tab-active' : 'tab-active'
  const inactiveClass = variant === 'sub' ? 'sub-tab-inactive' : 'tab-inactive'

  return (
    <button
      onClick={() => ctx.setActiveTab(value)}
      className={`tab ${isActive ? activeClass : inactiveClass} ${className}`}
      role="tab"
      aria-selected={isActive}
    >
      {children}
    </button>
  )
}
```

**Changes to TabList component** — add variant for border style:
```typescript
type TabListProps = {
  children: ReactNode
  className?: string
  variant?: 'system' | 'sub'  // NEW
}

export function TabList({ children, className = '', variant = 'system' }: TabListProps) {
  const borderClass = variant === 'sub'
    ? 'border-b border-[var(--soot)]'           // subtle whisper line
    : 'border-b border-sepia-800/40'             // existing style
  return (
    <div className={`flex gap-1 ${borderClass} ${className}`}>
      {children}
    </div>
  )
}
```

- [ ] Add `variant` prop to `Tab` and `TabList` type definitions
- [ ] Update `Tab` className logic to switch between class sets based on variant
- [ ] Update `TabList` border style based on variant
- [ ] Run `npm run build`
- [ ] Commit: "add sub-tab variant to Tabs component"

---

### Task 4: Extract CharacterSheet Component

**Files:**
- Create: `src/components/profile/CharacterSheet.tsx`

**Extract from:** `src/app/profile/page.tsx` — the `calculateArmorClass` function (lines 56-110) and `CharacterView` component (lines 321-551).

**Interface:**
```typescript
type CharacterSheetProps = {
  character: Character
}
```

The component manages its own data fetching (skills, armor, slots, weapons, items, brewed items) via React Query hooks, exactly as the current `ProfilePage` does. It also manages its own loading sub-state — while the parent guarantees `character` exists, the related data still loads asynchronously.

**What moves into this component:**
- `calculateArmorClass()` helper
- All React Query hooks for character-related data (skills, armor, slots, weapons, items, brewed)
- `useInvalidateQueries()` for cache invalidation
- `useProfile()` for herbalism session data
- `CharacterView` render logic (banner, equipment, skills, coins, quick slots, appearance, herbalism)

**What changes:**
- No auth guard (parent layout handles it)
- `character` arrives as a prop (no `useCharacter` call)
- Imports from `@/components/character` (CharacterBanner, EquipmentWeaponsPanel, CoinPurse, QuickSlots)
- Loading state: show a simple spinner or skeleton while related data loads

- [ ] Create `src/components/profile/` directory
- [ ] Create `CharacterSheet.tsx` — move `calculateArmorClass` + `CharacterView` content
- [ ] Accept `character: Character` as single prop
- [ ] Keep all data fetching hooks (useCharacterSkills, useCharacterArmor, etc.)
- [ ] Keep useProfile() for herbalism section
- [ ] Keep armor management logic (handleSetArmor)
- [ ] Verify all imports resolve (`@/components/character`, `@/components/ui`, `@/lib/hooks`, etc.)
- [ ] Run `npm run build`
- [ ] Commit: "extract CharacterSheet component from profile page"

---

### Task 5: Extract InventoryPanel Component

**Files:**
- Create: `src/components/profile/InventoryPanel.tsx`

**Extract from:** `src/app/inventory/page.tsx` — the main content (lines 40-195, minus auth/layout/skeleton wrappers).

**Interface:**
```typescript
type InventoryPanelProps = {
  character: Character
}
```

**What moves in:**
- Equipment/Herbalism tab state + switching UI
- All data fetching (weapons, items, herbs, brewed items, templates, materials)
- AddWeaponModal + AddItemModal trigger state
- Imported sub-components: `EquipmentSection`, `HerbalismSection`, `AddWeaponModal`, `AddItemModal`
- Error display and totals calculation

**What changes:**
- Remove `useAuth`, `useRouter`, auth redirect `useEffect`
- Remove `PageLayout` wrapper
- Remove `useCharacter` call (character arrives as prop)
- Remove `useProfile` (not needed — `isHerbalist` derived from `character.vocation`)
- Remove character loading/skeleton states (parent handles this)
- Keep `InventorySkeleton`-like loading for equipment data (internal data can still be loading)

- [ ] Create `InventoryPanel.tsx`
- [ ] Accept `character: Character` prop
- [ ] Move all data fetching hooks and UI logic from inventory page
- [ ] Remove auth guard, PageLayout, character loading
- [ ] Keep Equipment/Herbalism tabs and all modal logic
- [ ] Run `npm run build`
- [ ] Commit: "extract InventoryPanel component from inventory page"

---

### Task 6: Extract JournalPanel Component + Barrel Export

**Files:**
- Create: `src/components/profile/JournalPanel.tsx`
- Create: `src/components/profile/index.ts`

**Extract from:** `src/app/recipes/page.tsx` — lines 48-343.

**Interface:**
```typescript
type JournalPanelProps = {
  character: Character
}
```

**What moves in:**
- Recipe type tab state + RECIPE_TABS config + TYPE_DESCRIPTIONS
- Data fetching (useCharacterRecipesNew, useCharacterRecipeStats)
- Recipe grouping/filtering logic (useMemo)
- Unlock modal state + handleUnlock logic
- `TypeDescription` and `UnlockModal` local sub-components
- `RecipeCard` imported from `@/components/recipes`

**What changes:**
- Remove auth guard, PageLayout, character loading
- `characterId` derived from `character.id` prop
- Remove `useCharacter` call

**Barrel export (`index.ts`):**
```typescript
export { CharacterSheet } from './CharacterSheet'
export { InventoryPanel } from './InventoryPanel'
export { JournalPanel } from './JournalPanel'
```

- [ ] Create `JournalPanel.tsx` with recipe book content
- [ ] Accept `character: Character` prop
- [ ] Include TypeDescription + UnlockModal as local sub-components
- [ ] Remove auth guard, PageLayout, character loading
- [ ] Create `src/components/profile/index.ts` barrel export
- [ ] Run `npm run build`
- [ ] Commit: "extract JournalPanel component, add profile barrel export"

---

## Chunk 3: Route Architecture + Profile Home

### Task 7: Create Route Group + App Layout

**Files:**
- Create: `src/app/(app)/layout.tsx`

**Dependencies:** Task 2 (NavBar must exist)

This is the architectural backbone. The layout:
1. Checks auth — redirects to `/login` if unauthenticated
2. Loads character for NavBar display
3. Renders NavBar above page content

```typescript
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { useCharacter } from '@/lib/hooks'
import { NavBar } from '@/components/NavBar'
import { LoadingState } from '@/components/ui'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { data: character } = useCharacter(user?.id ?? null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [authLoading, user, router])

  if (authLoading || !user) {
    return <LoadingState message="Loading..." />
  }

  return (
    <>
      <NavBar character={character ?? null} />
      <main className="min-h-[calc(100vh-56px)]">{children}</main>
    </>
  )
}
```

**Key insight:** Next.js App Router layouts persist across navigations — they don't remount. This means the NavBar's breathing animations survive page transitions. This is critical for Ember & Silence.

- [ ] Create `src/app/(app)/` directory
- [ ] Create `layout.tsx` with centralized auth guard + NavBar
- [ ] Verify no route conflicts (no pages in (app)/ yet)
- [ ] Run `npm run build`
- [ ] Commit: "create (app) route group with auth guard and NavBar layout"

---

### Task 8: Build Profile Home Page (The Big Migration)

**Files:**
- Create: `src/app/(app)/page.tsx`
- Delete: `src/app/page.tsx` (old home hub)
- Delete: `src/app/profile/` directory
- Delete: `src/app/inventory/` directory
- Delete: `src/app/recipes/` directory

**Dependencies:** Tasks 3-7 (Tab variant, all extracted components, route group)

**IMPORTANT:** Delete conflicting pages FIRST, then create new one. `(app)/page.tsx` and `page.tsx` both resolve to `/` — they cannot coexist.

The new profile home page:

```typescript
'use client'

import { useAuth } from '@/lib/auth'
import { useCharacter } from '@/lib/hooks'
import { Tabs, TabList, Tab, TabPanel, ProfileSkeleton } from '@/components/ui'
import { CharacterSheet, InventoryPanel, JournalPanel } from '@/components/profile'
// NoCharacterView is a local component (moved from old profile page)

export default function ProfileHome() {
  const { user } = useAuth()
  const { data: character, isLoading, error } = useCharacter(user?.id ?? null)

  if (isLoading) return <ProfileSkeleton />
  if (!character) return <NoCharacterView error={error?.message ?? null} />

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <Tabs defaultTab="character">
          <TabList variant="sub" className="mb-6">
            <Tab value="character" variant="sub">Character</Tab>
            <Tab value="inventory" variant="sub">Inventory</Tab>
            <Tab value="journal" variant="sub">Journal</Tab>
          </TabList>
          <TabPanel value="character">
            <CharacterSheet character={character} />
          </TabPanel>
          <TabPanel value="inventory">
            <InventoryPanel character={character} />
          </TabPanel>
          <TabPanel value="journal">
            <JournalPanel character={character} />
          </TabPanel>
        </Tabs>
      </div>
    </div>
  )
}
```

**NoCharacterView:** Move from `src/app/profile/page.tsx` lines 250-317 into the same file. Update the "Create Your Knight" link to go to `/create-character` (already does). Remove sign-out button (now in nav gear → settings).

**Why no auth guard here:** The `(app)/layout.tsx` already handles auth. This page just needs the character.

- [ ] Delete `src/app/page.tsx`
- [ ] Delete `src/app/profile/` directory
- [ ] Delete `src/app/inventory/` directory
- [ ] Delete `src/app/recipes/` directory
- [ ] Create `src/app/(app)/page.tsx` with sub-tab layout
- [ ] Move NoCharacterView into the file (stripped of sign-out logic)
- [ ] Use `Tabs` with `variant="sub"` for sub-tabs
- [ ] Run `npm run build` — this is the highest-risk step, expect import resolution issues
- [ ] Fix any broken imports across the codebase
- [ ] Run `npm run build` again — must pass clean
- [ ] Commit: "build profile home with sub-tabs, migrate from old hub/profile/inventory/recipes"

---

### Task 9: Move Forage + Brew into Route Group

**Files:**
- Delete: `src/app/forage/` directory
- Create: `src/app/(app)/forage/page.tsx`
- Delete: `src/app/brew/` directory
- Create: `src/app/(app)/brew/page.tsx`

**Changes from originals (both pages):**
- Remove the `useAuth` + `useEffect` auth redirect block (layout handles it)
- Remove the `if (authLoading || !user)` loading gate
- Replace `PageLayout` usage with simpler wrapper: `showHomeLink={false}` or remove PageLayout entirely and use bare `<div className="p-8"><div className="max-w-2xl mx-auto">` (the nav bar replaces the home link)
- All functional logic (foraging phases, brewing modes, etc.) stays identical

**Important:** These are the app's most complex pages. Minimize changes — only strip auth guards and layout wrappers. Do not refactor any foraging/brewing logic.

- [ ] Read `src/app/forage/page.tsx` fully before modifying
- [ ] Delete `src/app/forage/` directory
- [ ] Create `src/app/(app)/forage/page.tsx` — stripped of auth guard + updated layout
- [ ] Read `src/app/brew/page.tsx` fully before modifying
- [ ] Delete `src/app/brew/` directory
- [ ] Create `src/app/(app)/brew/page.tsx` — stripped of auth guard + updated layout
- [ ] Run `npm run build`
- [ ] Commit: "move forage and brew into (app) route group"

---

## Chunk 4: New Pages

### Task 10: Build Herbalism Hub Page

**Files:**
- Create: `src/app/(app)/herbalism/page.tsx`

**Content (from spec Decision 3):** Overview page with foraging sessions remaining, recent brews, quick links.

**Data sources:**
- `useCharacter(user?.id)` — character data (vocation, INT)
- `useProfile()` — `sessionsUsedToday`
- `computeMaxForagingSessions(character.int)` from `@/lib/characterUtils`
- `useCharacterBrewedItems(character?.id)` — for recent brews (sort by `created_at`, take last 3)

**Layout sketch:**
```
Herbalism Hub
├── Overview card (GrimoireCard)
│   ├── Foraging sessions: {remaining} / {max}
│   └── Brewing modifier: +{mod} (herbalists only)
├── Recent Brews card (GrimoireCard) — last 3 brewed items, or empty state
├── Quick Links
│   ├── Link → /forage ("Search for herbs in the wild")
│   └── Link → /brew ("Combine herbs into elixirs and bombs") — disabled if not herbalist
```

- [ ] Create `src/app/(app)/herbalism/page.tsx`
- [ ] Fetch character data, profile session data, and recent brewed items
- [ ] Render overview card with foraging sessions + modifiers
- [ ] Render recent brews list (last 3, or "No recent brews" empty state)
- [ ] Render quick links to /forage and /brew (brew gated on herbalist vocation)
- [ ] Style with GrimoireCard components
- [ ] Run `npm run build`
- [ ] Commit: "build herbalism hub page"

---

### Task 11: Build Settings Page

**Files:**
- Create: `src/app/(app)/settings/page.tsx`
- Delete: `src/app/edit-character/` directory

**Dependencies:** Route group must exist (Task 7)

**Based on:** Current `src/app/edit-character/page.tsx` — reorganized per spec Decision 4.

**Sections (in order):**

**1. Identity** — race, class, background, order, vocation
- All now EDITABLE (were read-only in edit-character)
- Use `Select` components with options from constants (`RACES`, `CLASSES`, `BACKGROUNDS`, `KNIGHT_ORDERS`, `VOCATIONS`)
- When saving with changed identity fields: show confirmation modal
  - "Changing your character's identity may affect other features. This can't be undone. Continue?"
  - Confirm → save all changes. Cancel → return to form.

**2. Character** — name, level, appearance
- Copied from edit-character Basic Info section (minus vocation, which moves to Identity)

**3. Stats** — STR, DEX, CON, INT, WIS, CHA, HON
- Identical to edit-character Stats section
- Keep CON → HP auto-adjustment logic (`adjustHpForMaxChange`)

**4. HP & Money** — current HP, custom modifier, coins
- Identical to edit-character HP + Money sections combined

**5. Account** — sign out + delete character
- Sign out button (calls `signOut()` from `useAuth`)
- Delete character button (Task 12 adds this)

**Key differences from edit-character:**
- Armor section: **REMOVED** entirely (armor lives in Inventory sub-tab now)
- Identity fields: **EDITABLE** (with confirmation warning)
- Save redirects to `/` (not `/profile`)
- No "Cancel" link needed (gear icon in nav returns to current page)
- Uses `useCharacter` hook (not direct `fetchCharacter`) for initial data load

**Form pattern:** Load character → initialize local form state → edits are local → save button pushes to DB. Same pattern as edit-character but with `useCharacter` for initial load instead of direct fetch.

```typescript
const { data: character, isLoading } = useCharacter(user?.id ?? null)
const [form, setForm] = useState<EditableFields | null>(null)

// Initialize form when character loads
useEffect(() => {
  if (character && !form) {
    setForm({
      name: character.name,
      race: character.race,       // NEW: editable
      class: character.class,     // NEW: editable
      background: character.background,  // NEW: editable
      knight_order: character.knight_order,  // NEW: editable
      // ... rest same as edit-character
    })
  }
}, [character, form])
```

**Save logic:** Use existing `updateCharacter(characterId, updates)`. The function accepts any partial update — identity fields just become additional fields in the update object.

- [ ] Read edit-character page fully for reference
- [ ] Delete `src/app/edit-character/` directory
- [ ] Create `src/app/(app)/settings/page.tsx`
- [ ] Implement Identity section (editable race, class, background, order, vocation)
- [ ] Implement Character section (name, level, appearance)
- [ ] Implement Stats section (7 abilities with modifier display, CON→HP logic)
- [ ] Implement HP & Money section
- [ ] Implement Account section (sign out button)
- [ ] Add identity change detection + confirmation modal
- [ ] Save handler: call `updateCharacter`, invalidate cache, redirect to `/`
- [ ] Run `npm run build`
- [ ] Commit: "build settings page with editable identity fields"

---

### Task 12: Add Delete Character Flow

**Files:**
- Modify: `src/app/(app)/settings/page.tsx` (add to Account section)

**Dependencies:** Task 11 (settings page must exist)

**Flow:**
1. "Delete Character" button in Account section (red/destructive styling)
2. Click → opens `Modal` (from `@/components/ui`)
3. Modal content:
   - Warning: "This will **permanently delete** your character and ALL associated data (inventory, recipes, herbs, weapons, equipment). This cannot be undone."
   - Text input: "Type DELETE to confirm"
   - Confirm button: disabled until input === "DELETE"
4. On confirm:
   - Call `deleteCharacter(character.id)` from `@/lib/db/characters`
   - Call `invalidateAllUserData()` to clear React Query cache
   - Redirect to `/create-character`

**Existing infrastructure:**
- `deleteCharacter(characterId)` already exists in `src/lib/db/characters.ts:312` — deletes character row, CASCADE handles all child tables
- `Modal` component available from `@/components/ui`
- `invalidateAllUserData()` available from `useInvalidateQueries()`

```typescript
const [showDeleteModal, setShowDeleteModal] = useState(false)
const [deleteConfirmText, setDeleteConfirmText] = useState('')
const [deleting, setDeleting] = useState(false)

async function handleDelete() {
  if (!character || deleteConfirmText !== 'DELETE') return
  setDeleting(true)
  const { error } = await deleteCharacter(character.id)
  if (error) {
    setSaveError(`Failed to delete: ${error}`)
    setDeleting(false)
    return
  }
  invalidateAllUserData()
  router.push('/create-character')
}
```

- [ ] Add delete modal state to settings page
- [ ] Add "Delete Character" button to Account section (red destructive styling)
- [ ] Implement confirmation modal (type "DELETE" to enable confirm)
- [ ] On confirm: call deleteCharacter → invalidate caches → redirect to /create-character
- [ ] Run `npm run build`
- [ ] Commit: "add delete character flow to settings"

---

## Chunk 5: Cleanup + Verification

### Task 13: Link and Reference Cleanup

**Files:** Various — search and update all stale route references.

**Route changes to propagate:**

| Old route | New route | Search for |
|-----------|-----------|------------|
| `/profile` | `/` | `href="/profile"`, `'/profile'`, `push('/profile')` |
| `/edit-character` | `/settings` | `href="/edit-character"`, `'/edit-character'`, `push('/edit-character')` |
| `/inventory` | `/` | `href="/inventory"`, `'/inventory'` |
| `/recipes` | `/` | `href="/recipes"`, `'/recipes'` |

**Known locations to check:**
- `src/components/PrefetchLink.tsx` — prefetch types may reference old routes
- `src/components/character/` components — any links to profile/edit-character
- `src/app/(app)/settings/page.tsx` — save redirect (should go to `/`)
- `src/app/(app)/brew/page.tsx` — may link to recipes or inventory
- `src/app/(app)/forage/page.tsx` — may link to inventory
- `src/app/create-character/page.tsx` — links to profile after creation

**Also check:**
- PrefetchLink `prefetch` prop values — `'profile'` type may need updating since the profile is now at `/`
- Any `router.push('/profile')` calls — change to `router.push('/')`
- The `usePrefetch` hook in `src/lib/hooks/queries.ts` — `prefetchProfile` function

- [ ] Grep codebase for `"/profile"` — update links to `/`
- [ ] Grep for `"/edit-character"` — update to `/settings`
- [ ] Grep for `"/inventory"` — update to `/` (or remove if redundant)
- [ ] Grep for `"/recipes"` — update to `/` (or remove if redundant)
- [ ] Check PrefetchLink and usePrefetch for stale references
- [ ] Check create-character page redirect after character creation
- [ ] Run `npm run build` — fix any remaining broken imports
- [ ] Commit: "update all route references for new navigation structure"

---

### Task 14: Final Verification + Documentation Update

- [ ] Run `npm run build` — must pass with zero errors
- [ ] Run `npm run dev` and manually verify each route:

**Navigation:**
- [ ] `/` → Profile page with Character | Inventory | Journal sub-tabs
- [ ] NavBar visible with character name, system tabs, HP, gear icon
- [ ] Bonfire effect glows bronze on Profile tab
- [ ] Click Herbalism tab → navigates to `/herbalism`
- [ ] Bonfire effect changes to green on Herbalism tab
- [ ] Locked tabs show tooltip on hover
- [ ] Gear icon → navigates to `/settings`
- [ ] HP indicator breathes, shows numbers on hover

**Sub-tabs:**
- [ ] Character tab → shows character sheet (banner, stats, equipment, skills, etc.)
- [ ] Inventory tab → shows Equipment/Herbalism tabs with full management
- [ ] Journal tab → shows recipe book with type tabs + unlock modal
- [ ] Sub-tabs switch without page reload

**Settings:**
- [ ] All sections render (Identity, Character, Stats, HP & Money, Account)
- [ ] Identity fields are editable
- [ ] Changing identity field + saving shows confirmation modal
- [ ] Stats editing works (CON changes adjust HP)
- [ ] Save persists changes to database
- [ ] Delete character: type DELETE → confirm → redirects to /create-character

**Routing:**
- [ ] `/herbalism` → hub page with sessions, recent brews, links
- [ ] `/forage` → forage page works as before, nav bar shows Herbalism active
- [ ] `/brew` → brew page works as before, nav bar shows Herbalism active
- [ ] `/settings` → settings page, nav bar shows Profile active
- [ ] `/login` → no nav bar
- [ ] `/create-character` → no nav bar
- [ ] Unauthenticated → redirected to `/login` from any (app) page

**Update documentation:**
- [ ] Update `scratchpad.md` — mark 2A brainstorm as COMPLETE, note implementation complete
- [ ] Update `wave2.md` — mark 2A section as COMPLETE with summary of what shipped
- [ ] Commit: "complete 2A: profile & navigation restructure"

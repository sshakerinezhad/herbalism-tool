# Profile Page UI/UX Documentation

## Overview

The profile page (`src/app/profile/page.tsx`) is the central character hub for the D&D homebrew companion app. It displays the full character sheet with all stats, equipment, and herbalism settings.

---

## Design Principles

### Core Philosophy
- **NOT minimalist** - "beauty in simple detail"
- **Elegant + sleek** - retro fantasy meets modern UI
- **Natural flow** - all elements balanced, no cramped sections
- **Closer to Baldur's Gate 3 aesthetic** - video game-inspired character sheets
- **Video game item displays** - compact, icon-focused, with hover tooltips

### Color Palette (Grimoire Theme)

| Name | Purpose | Values |
|------|---------|--------|
| **Grimoire** | Dark backgrounds | 950:`#0d0c0a`, 900:`#151311`, 850:`#1a1815`, 800:`#211e1a` |
| **Vellum** | Text colors | 50:`#f5f0e6`, 100:`#e8e0d0`, 300:`#b8a890`, 400:`#9a8a70` |
| **Sepia** | Borders/dividers | 700:`#3d342a`, 600:`#4a3f32` |
| **Bronze** | Accents/highlights | muted:`#8b7355`, bright:`#c9a66b`, glow:`#a68952` |

### Typography
- **Headings**: `text-vellum-50` with `text-embossed` utility for depth
- **Body text**: `text-vellum-100` to `text-vellum-300`
- **Labels**: `text-vellum-400`, uppercase, tracking-wide
- **Accents**: `text-bronze-bright` for important values

### Component Styling
- **Cards**: `bg-grimoire-900` with `border-sepia-700/50`
- **Interactive elements**: `bg-grimoire-850` with hover states
- **Borders**: Subtle sepia tones, often with `/40` or `/50` opacity
- **Gradients**: Top/bottom accent lines using `via-bronze-muted/40`

---

## Page Structure

```
┌─────────────────────────────────────────────────────────┐
│ ← Home                    [Edit Character] [Sign out]   │  ← PageLayout header
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ CharacterBanner                                     │ │
│ │ [Portrait] │ Name/Class/Race │ HP/AC/Init/Stats     │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ EquipmentWeaponsPanel                               │ │
│ │ [Armor Diagram]  │  [Weapon Slots]                  │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────┐  ┌──────────────────────────┐   │
│ │ Skills Card         │  │ Coin Purse Card          │   │
│ └─────────────────────┘  └──────────────────────────┘   │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ QuickSlots (2x3 grid)                               │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ [Appearance] [Herbalism Settings - if herbalist]        │
└─────────────────────────────────────────────────────────┘
```

---

## Components

### CharacterBanner
**File:** `src/components/character/CharacterBanner.tsx`

Unified header combining identity info with combat vitals.

**Layout (3-column on desktop):**
```
┌────────────────────────────────────────────────────────────────┐
│ [Portrait] │ Name                     │ HP ████████ 24/32     │
│            │ Level Class • Order      │ [AC 14]  [Init +2]    │
│            │ Race • Background • Voc  │ STR DEX CON INT...HON │
└────────────────────────────────────────────────────────────────┘
```

**Props:**
- `character: Character` - Full character data
- `userEmail?: string` - For "signed in as" footer
- `currentHP: number` - Current hit points
- `maxHP: number` - Maximum hit points
- `armorClass: number` - Calculated AC
- `armorLevel: 'none' | 'light' | 'medium' | 'heavy'` - For label

**Features:**
- Portrait with ornate frame (`CharacterPortrait` component)
- Name with embossed text effect
- Class/Order in bronze, Race/Background in vellum
- Herbalist vocation highlighted in emerald
- HP bar with color coding (green >50%, amber 25-50%, red <25%)
- AC and Initiative boxes with emoji icons
- All 7 ability scores using `StatBlock variant="banner"`
- User email footer with subtle divider

**Responsive:** Stacks vertically on mobile (`md:` breakpoint)

---

### StatBlock
**File:** `src/components/character/StatBlock.tsx`

Ability score display with multiple variants.

**Variants:**
- `default` - Medallion style with gradient background (16x18 on mobile, larger on desktop)
- `compact` - Minimal text-only (for tight spaces)
- `banner` - Medium size for CharacterBanner (between compact and default)
- `honor` - Gold/amber styling for Honor stat

**Honor stat** automatically gets amber treatment when `stat === 'hon'`

**Modifier colors:**
- Positive: `text-emerald-400`
- Negative: `text-red-400`
- Zero: `text-vellum-300`

---

### EquipmentWeaponsPanel
**File:** `src/components/character/EquipmentWeaponsPanel.tsx`

Combined armor and weapons display.

**Layout:**
```
┌─────────────────────────────────────────────┐
│ ⚔ EQUIPMENT                    AC 14  [🔒] │
├───────────────────────┬─────────────────────┤
│   [Armor Diagram]     │  [Weapon Slots]     │
│   (silhouette style)  │  Right    Left      │
│                       │  [Wpn]    [Wpn]     │
│                       │  [Wpn]    [Wpn]     │
│                       │  [Wpn]    [Wpn]     │
└───────────────────────┴─────────────────────┘
```

**Features:**
- Unified header with sword emoji
- AC display in header
- Shared lock toggle (prevents accidental changes)
- Horizontal layout on desktop, stacked on mobile

---

### ArmorDiagram
**File:** `src/components/ArmorDiagram.tsx`

Visual armor slot selection with body silhouette.

**Slots:** Head, Shoulders, Chest, Arms, Hands, Waist, Legs, Feet

**Armor Types:** None, Light, Medium, Heavy (with strength requirements)

**Styling:** Grimoire palette, sepia borders, armor-type-specific colors

---

### WeaponSlots
**File:** `src/components/character/WeaponSlots.tsx`

Two-column weapon management (Right Hand / Left Hand).

**Uses:** `WeaponSlotCard` for individual slots

**Features:**
- 3 slots per hand
- Active slot indicator (bronze border)
- Weapon selection panel with filtering
- Empty slot styling (dashed border)

---

### QuickSlots
**File:** `src/components/character/QuickSlots.tsx`

Quick-access item grid for consumables.

**Layout:** 2x3 grid (changed from original 1x6 row)

**Uses:** `QuickSlotCell` for individual slots

**Supports:**
- Regular items (`CharacterItem`)
- Brewed items (`CharacterBrewedItem` - elixirs, bombs, oils)

**Note:** Currently flagged as "clunky" - needs redesign

---

### Supporting Components

**GrimoireCard** (`src/components/ui/GrimoireCard.tsx`)
- Standard card wrapper with grimoire styling
- Variants: default, subtle, elevated

**SectionHeader** (`src/components/ui/SectionHeader.tsx`)
- Uppercase label styling for card sections

**Divider** (`src/components/ui/Divider.tsx`)
- Horizontal separator with gradient effects
- Variants: default, subtle, ornate

**ItemTooltip** (`src/components/ui/ItemTooltip.tsx`)
- Hover tooltip + click modal for item details
- Grimoire palette styling

---

### PageLayout
**File:** `src/components/ui/PageLayout.tsx`

Page wrapper with consistent structure.

**Props:**
- `children: ReactNode` - Page content
- `showHomeLink?: boolean` - Show "← Home" link (default: true)
- `maxWidth?: string` - Container max-width class
- `headerActions?: ReactNode` - Right-side header content

**Profile page uses** `headerActions` for Edit Character and Sign out buttons, keeping them inline with the Home link.

---

## Data Flow

### Character Data
- Fetched via React Query hooks from `@/lib/hooks`
- Main hook: `useCharacter(userId)`
- Related: `useCharacterSkills`, `useCharacterArmor`, `useCharacterWeaponSlots`, etc.

### AC Calculation
Function `calculateArmorClass()` in profile page:
- No armor: 10 + DEX modifier
- Light armor: 6 + bonuses + full DEX
- Medium armor: 8 + bonuses + DEX (max +2)
- Heavy armor: 0 + bonuses (no DEX)

### HP Calculation
Uses `calculateMaxHP(con)` from `@/lib/constants`

---

## What's Been Done

### Phase 1: Decorative Foundation
- Created `OrnateFrame.tsx`, `Divider.tsx`
- Added CSS utilities (text-embossed, glow-bronze, medallion)
- Updated `GrimoireCard.tsx` with variants

### Phase 2 & 3: Character Banner & Stats
- Created `CharacterPortrait.tsx`, `CharacterBanner.tsx`
- Created `StatBlock.tsx`, `AbilityScorePanel.tsx`, `VitalsPanel.tsx`
- Integrated into profile page

### Phase 4: Equipment Unification
- Created `WeaponSlotCard.tsx`, `QuickSlotCell.tsx`
- Updated `WeaponSlots.tsx`, `QuickSlots.tsx`, `ArmorDiagram.tsx`
- Created `EquipmentWeaponsPanel.tsx`
- Migrated all from zinc to grimoire palette

### Banner Consolidation (Latest)
- Moved HP/AC/Initiative/Stats into CharacterBanner
- Created `banner` variant for StatBlock
- Added `headerActions` prop to PageLayout
- Removed VitalsPanel and AbilityScorePanel from profile page
- Actions (Edit/Sign out) moved to page header

---

## What's Left To Do

### 1. CharacterBanner Formatting Tweaks
Current layout works but needs refinement:
- Spacing/gaps between sections
- Text sizes
- Vitals column width (`md:w-64 lg:w-72`)
- HP bar height (`h-4`)
- AC/Initiative box sizing

### 2. QuickSlots Overhaul
Flagged as "super clunky" - needs complete rethink:
- Current: 2x3 grid with QuickSlotCell
- Issues: Likely too busy, hard to use
- Consider: Simpler interaction, clearer visual hierarchy

### 3. Phase 5: Supporting Sections (Future)
- Update `CoinPurse.tsx` - Currently using zinc palette
- Redesign skills badge display
- Style appearance section

### 4. Phase 6: Final Polish (Future)
- Responsive testing across breakpoints
- Animation/transition polish
- Visual consistency pass

---

## File Reference

| Component | Location |
|-----------|----------|
| Profile Page | `src/app/profile/page.tsx` |
| CharacterBanner | `src/components/character/CharacterBanner.tsx` |
| StatBlock | `src/components/character/StatBlock.tsx` |
| EquipmentWeaponsPanel | `src/components/character/EquipmentWeaponsPanel.tsx` |
| ArmorDiagram | `src/components/ArmorDiagram.tsx` |
| WeaponSlots | `src/components/character/WeaponSlots.tsx` |
| QuickSlots | `src/components/character/QuickSlots.tsx` |
| PageLayout | `src/components/ui/PageLayout.tsx` |
| GrimoireCard | `src/components/ui/GrimoireCard.tsx` |
| ItemTooltip | `src/components/ui/ItemTooltip.tsx` |

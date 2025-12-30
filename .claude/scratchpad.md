# Scratchpad

## Current Task: Profile Page Complete Overhaul

**Date:** 2025-12-30
**Branch:** knights-of-belyar
**Status:** Phases 1-4 COMPLETE - Phase 5 & 6 Remaining

---

## Phase 4: Equipment Unification - COMPLETE

### Objective
Redesign equipment components (ArmorDiagram, WeaponSlots, QuickSlots) with:
- Grimoire/sepia/bronze palette
- Video game-inspired compact item displays
- Icon placeholders for future pixel art
- Inline hero stats + hover tooltips

### User Requirements Summary

| Decision | Answer |
|----------|--------|
| Grouping | Armor + Weapons together (distinct sections), QuickSlots separate |
| ArmorDiagram | Keep silhouette layout, modernize styling |
| WeaponSlots | Keep 2-column, make compact, focus on weapon visual |
| QuickSlots | 2x3 grid, complete overhaul, showcase items |
| Item visuals | Icon placeholder + hero details inline |
| Stats display | Both inline compact AND hover tooltip |

---

### Files to Modify/Create

| File | Action |
|------|--------|
| `src/components/character/WeaponSlotCard.tsx` | CREATE |
| `src/components/character/QuickSlotCell.tsx` | CREATE |
| `src/components/character/WeaponSlots.tsx` | MODIFY |
| `src/components/character/QuickSlots.tsx` | MODIFY |
| `src/components/ArmorDiagram.tsx` | MODIFY |
| `src/components/ui/ItemTooltip.tsx` | MODIFY |
| `src/components/character/EquipmentWeaponsPanel.tsx` | CREATE |
| `src/components/character/index.ts` | MODIFY (add exports) |
| `src/app/profile/page.tsx` | MODIFY |

---

### Implementation Order

1. **WeaponSlotCard.tsx** - Foundation for weapon display
2. **QuickSlotCell.tsx** - Foundation for item display
3. **ItemTooltip.tsx** - Update palette (dependencies use this)
4. **WeaponSlots.tsx** - Integrate WeaponSlotCard
5. **QuickSlots.tsx** - Integrate QuickSlotCell, 2x3 layout
6. **ArmorDiagram.tsx** - Palette update
7. **EquipmentWeaponsPanel.tsx** - Combine armor + weapons
8. **Profile page** - Integrate new panels
9. **Barrel exports** - Update index.ts

---

### Step 1: Create `WeaponSlotCard.tsx` (NEW)
**Path:** `src/components/character/WeaponSlotCard.tsx`

Compact weapon display card with video game aesthetic:
```
┌─────────────────────────┐
│  [⚔️]  Longsword        │  ← Icon + Name
│  1d8 slashing • Steel   │  ← Damage + Material
└─────────────────────────┘
```

**Props:**
- `weapon: CharacterWeapon | null`
- `slotNumber: 1 | 2 | 3`
- `isActive: boolean`
- `isEmpty: boolean`
- `onSelect: () => void`
- `locked: boolean`

**Features:**
- Icon placeholder (emoji for now, CSS class for future art)
- Inline hero stats (damage dice + type, material)
- Compact dimensions (~120-150px width)
- Bronze border when active, sepia-dashed when empty
- Uses `ItemTooltip` wrapper for hover details

### Step 2: Create `QuickSlotCell.tsx` (NEW)
**Path:** `src/components/character/QuickSlotCell.tsx`

Square item cell for quick slots:
```
┌──────────┐
│   [🧪]   │  ← Large centered icon
│  Elixir  │  ← Item type/name
│   ×3     │  ← Quantity (if > 1)
└──────────┘
```

**Props:**
- `item: CharacterItem | null`
- `brewedItem: CharacterBrewedItem | null`
- `slotNumber: 1-6`
- `onSelect: () => void`
- `locked: boolean`

**Features:**
- Square aspect ratio (matches 2x3 grid)
- Large centered icon area
- Compact name (truncated if needed)
- Quantity badge
- Distinct styling for brewed items (subtle green tint)
- Uses `ItemTooltip` wrapper

### Step 3: Update `WeaponSlots.tsx`
**Path:** `src/components/character/WeaponSlots.tsx`

**Changes:**
- Replace current wide text boxes with `WeaponSlotCard` components
- Apply grimoire/sepia/bronze palette throughout
- Keep 2-column layout (Right Hand / Left Hand)
- 3 slots per hand in vertical stack
- Selection panel: grimoire-950 background, sepia borders
- Compact overall dimensions
- Add `compact?: boolean` prop for profile page usage

**Structure:**
```
Right Hand          Left Hand
┌──────────┐       ┌──────────┐
│ Slot 1 ● │       │ Slot 1   │
├──────────┤       ├──────────┤
│ Slot 2   │       │ Slot 2   │
├──────────┤       ├──────────┤
│ Slot 3   │       │ Slot 3   │
└──────────┘       └──────────┘
```

### Step 4: Update `QuickSlots.tsx`
**Path:** `src/components/character/QuickSlots.tsx`

**Changes:**
- Change from 1x6 row to 2x3 grid layout
- Replace current slot buttons with `QuickSlotCell` components
- Apply grimoire/sepia/bronze palette
- Update item selector modal to grimoire styling
- More compact overall dimensions
- Add `compact?: boolean` prop

**Layout:**
```
┌────┬────┬────┐
│ 1  │ 2  │ 3  │
├────┼────┼────┤
│ 4  │ 5  │ 6  │
└────┴────┴────┘
```

### Step 5: Update `ArmorDiagram.tsx`
**Path:** `src/components/ArmorDiagram.tsx`

**Changes:**
- Apply grimoire/sepia/bronze palette
- Container: `bg-grimoire-900`, `border-sepia-700`
- Keep silhouette layout intact
- Update slot buttons to match new aesthetic
- AC display: bronze medallion style
- Add `compact?: boolean` prop

### Step 6: Update `ItemTooltip.tsx`
**Path:** `src/components/ui/ItemTooltip.tsx`

**Changes:**
- Update tooltip background: `bg-zinc-900` → `bg-grimoire-900`
- Update borders: `border-zinc-600` → `border-sepia-600`
- Update modal: same palette shift
- Keep functionality intact

### Step 7: Create `EquipmentWeaponsPanel.tsx` (NEW)
**Path:** `src/components/character/EquipmentWeaponsPanel.tsx`

Wrapper combining armor diagram and weapon slots:
```
┌─────────────────────────────────────────────┐
│ ⚔ Equipment                         [🔒]   │
├───────────────────────┬─────────────────────┤
│                       │  Right    Left      │
│   [Armor Diagram]     │  [Wpn]    [Wpn]     │
│                       │  [Wpn]    [Wpn]     │
│                       │  [Wpn]    [Wpn]     │
└───────────────────────┴─────────────────────┘
```

**Features:**
- Single header "Equipment" with shared lock toggle
- Horizontal layout: Armor diagram | Weapon slots
- Responsive: stack vertically on mobile
- Both sections distinct but visually unified

### Step 8: Update Profile Page
**Path:** `src/app/profile/page.tsx`

**Changes:**
- Replace separate ArmorDiagram + WeaponSlots with `EquipmentWeaponsPanel`
- Replace QuickSlots with updated 2x3 version
- Ensure proper spacing with new layout

---

### Icon Mapping (Placeholders)

**Weapon Types:**
| Type | Emoji |
|------|-------|
| Sword | ⚔️ |
| Dagger | 🗡️ |
| Axe | 🪓 |
| Bow | 🏹 |
| Staff | 🪄 |
| Mace/Hammer | 🔨 |
| Spear | 🔱 |
| Shield | 🛡️ |

**Item Types:**
| Type | Emoji |
|------|-------|
| Elixir/Potion | 🧪 |
| Bomb | 💣 |
| Oil | 🫗 |
| Scroll | 📜 |
| Rope | 🪢 |
| Torch | 🔦 |
| Other | 📦 |

---

### Data Available (from types.ts)

**CharacterWeapon:**
- Hero: `name`, `weapon_type`, `damage_dice` + `damage_type`, `material`
- Tooltip: `properties`, `notes`, `is_magical`, `is_two_handed`

**CharacterItem:**
- Hero: `name`, `category`, `quantity`
- Tooltip: template description, notes

**CharacterBrewedItem:**
- Hero: `type` (elixir/bomb/oil), `quantity`
- Tooltip: `computed_description`, `effects`

---

## Current Component Analysis (from exploration)

### ArmorDiagram.tsx (296 lines)
- **Location:** `src/components/ArmorDiagram.tsx`
- **Current styling:** `bg-zinc-800`, `border-zinc-700`, level-specific colors
- **Layout:** 3-column flex (slots | silhouette | slots)
- **Sub-components:** SlotButton, Option
- **Props:** armor, armorSlots, locked, onToggleLock, onSetArmor, totalAC, armorLevel, strengthScore

### WeaponSlots.tsx (404 lines)
- **Location:** `src/components/character/WeaponSlots.tsx`
- **Current styling:** `bg-zinc-800`, cyan selection states
- **Layout:** 2-column grid (Right/Left hands)
- **Sub-components:** HandColumn, WeaponSlotCard, WeaponSelectionPanel, WeaponOption
- **Props:** characterId, weaponSlots, weapons, onUpdate

### QuickSlots.tsx (403 lines)
- **Location:** `src/components/character/QuickSlots.tsx`
- **Current styling:** `bg-zinc-800`, 6-column grid
- **Layout:** 1x6 row (needs to become 2x3)
- **Sub-components:** QuickSlotButton, ItemSelectorModal
- **Props:** characterId, quickSlots, items, brewedItems, onUpdate

### ItemTooltip.tsx (351 lines)
- **Location:** `src/components/ui/ItemTooltip.tsx`
- **Current styling:** `bg-zinc-900`, `border-zinc-600`
- **Features:** Hover tooltip + click modal
- **Props:** name, icon, details, children, clickOnly

---

## Color Palette Reference

| Name | Purpose | Values |
|------|---------|--------|
| Grimoire | Dark backgrounds | 950:`#0d0c0a`, 900:`#151311`, 850:`#1a1815`, 800:`#211e1a` |
| Vellum | Text colors | 50:`#f5f0e6`, 100:`#e8e0d0`, 300:`#b8a890` |
| Sepia | Borders | 700:`#3d342a`, 600:`#4a3f32` |
| Bronze | Accents | muted:`#8b7355`, bright:`#c9a66b`, glow:`#a68952` |

---

## Design Philosophy
- NOT minimalist - "beauty in simple detail"
- Elegant + sleek - retro fantasy meets modern
- Natural flow - all elements balanced
- Closer to Baldur's Gate 3 aesthetic
- Video game-inspired item displays

---

## Phase 4 Summary (COMPLETED 2025-12-30)

### Changes Made:
1. **Created WeaponSlotCard.tsx** - Compact weapon card with grimoire palette, emoji icons
2. **Created QuickSlotCell.tsx** - Square item cell for 2x3 grid layout
3. **Updated ItemTooltip.tsx** - Migrated from zinc to grimoire/sepia/vellum palette
4. **Updated WeaponSlots.tsx** - Uses new WeaponSlotCard, grimoire palette, bronze accents
5. **Updated QuickSlots.tsx** - 2x3 grid layout (was 1x6), uses QuickSlotCell
6. **Updated ArmorDiagram.tsx** - Grimoire palette, kept silhouette layout
7. **Created EquipmentWeaponsPanel.tsx** - Combines armor + weapons with unified header/lock
8. **Updated profile page** - Uses EquipmentWeaponsPanel instead of separate components
9. **Updated barrel exports** - Added new component exports

### Fixed Pre-existing Issues:
- Fixed naming collision in edit-character page (setCharacterArmor → saveCharacterArmor)
- Fixed Error type conversion in profile page

---

## Phases 1-3 Summary (COMPLETED)

### Phase 1: Decorative Foundation
- Created `OrnateFrame.tsx`, `Divider.tsx`
- Added CSS utilities (text-embossed, glow-bronze, medallion, etc.)
- Updated `GrimoireCard.tsx` with variants

### Phase 2 & 3: Character Banner & Stats
- Created `CharacterPortrait.tsx`, `CharacterBanner.tsx`
- Created `StatBlock.tsx`, `AbilityScorePanel.tsx`, `VitalsPanel.tsx`
- Integrated into profile page

---

## Phase 5: Supporting Sections (FUTURE)

- Update `CoinPurse.tsx` - Currently using zinc palette, needs grimoire (has sophisticated metallic gradients - needs careful treatment)
- Redesign skills badge display - Currently basic emerald badges
- Style appearance section - Currently plain italic text

---

## Phase 6: Final Polish (FUTURE)

- Responsive testing across breakpoints
- Animation/transition polish
- Any remaining visual inconsistencies

---

## Original Plan Reference

Full 6-phase plan: `C:\Users\User\.claude\plans\harmonic-giggling-wigderson.md`

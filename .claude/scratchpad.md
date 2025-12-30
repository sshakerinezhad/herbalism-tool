# Scratchpad

## Current Task: Profile Page Complete Overhaul

**Date:** 2025-12-30
**Branch:** knights-of-belyar
**Status:** Phases 1-4 COMPLETE + Banner Consolidation - Tweaks Needed

---

## Next Session: Immediate TODO

### 1. CharacterBanner Formatting Tweaks
**File:** `src/components/character/CharacterBanner.tsx`

Current layout works but formatting needs refinement. User feedback: "not sitting perfectly right yet"

Current structure:
```
┌────────────────────────────────────────────────────────────────┐
│ [Portrait] │ Name                     │ HP ████████ 24/32     │
│            │ Level Class • Order      │ [AC 14]  [Init +2]    │
│            │ Race • Background • Voc  │ STR DEX CON INT...HON │
└────────────────────────────────────────────────────────────────┘
```

Things to potentially adjust:
- Spacing/gaps between sections
- Text sizes (currently using `banner` variant for stats)
- Vitals column width (`md:w-64 lg:w-72`)
- HP bar height (`h-4`)
- AC/Initiative box sizing

### 2. QuickSlots Overhaul
**File:** `src/components/character/QuickSlots.tsx`

User feedback: "super clunky"

Current state:
- 2x3 grid layout
- Uses QuickSlotCell component
- Item selector modal

Needs complete rethink - likely too busy or hard to use.

---

## Session Summary: Banner Consolidation (2025-12-30)

### What Changed:

1. **CharacterBanner now includes vitals + stats**
   - HP bar, AC box, Initiative box
   - All 7 ability scores in a row (using new `banner` variant)
   - VitalsPanel and AbilityScorePanel no longer used on profile page

2. **New StatBlock `banner` variant**
   - Larger than `compact`, smaller than `default`
   - Honor stat gets amber/gold styling
   - Located in `src/components/character/StatBlock.tsx`

3. **PageLayout now supports `headerActions` prop**
   - Edit Character + Sign out buttons moved to top-right
   - Inline with Home link
   - Located in `src/components/ui/PageLayout.tsx`

4. **Profile page simplified**
   - Removed separate VitalsPanel/AbilityScorePanel grid
   - Banner handles all character identity + stats
   - Actions in PageLayout header

### Files Modified This Session:
- `src/components/character/CharacterBanner.tsx` - Major restructure
- `src/components/character/StatBlock.tsx` - Added `banner` variant
- `src/components/ui/PageLayout.tsx` - Added `headerActions` prop
- `src/app/profile/page.tsx` - Simplified, uses new banner props

---

## Color Palette Reference

| Name | Purpose | Values |
|------|---------|--------|
| Grimoire | Dark backgrounds | 950:`#0d0c0a`, 900:`#151311`, 850:`#1a1815`, 800:`#211e1a` |
| Vellum | Text colors | 50:`#f5f0e6`, 100:`#e8e0d0`, 300:`#b8a890` |
| Sepia | Borders | 700:`#3d342a`, 600:`#4a3f32` |
| Bronze | Accents | muted:`#8b7355`, bright:`#c9a66b`, glow:`#a68952` |

---

## Phase 5: Supporting Sections (FUTURE)

- Update `CoinPurse.tsx` - Currently using zinc palette
- Redesign skills badge display
- Style appearance section

---

## Phase 6: Final Polish (FUTURE)

- Responsive testing
- Animation/transition polish
- Visual consistency pass

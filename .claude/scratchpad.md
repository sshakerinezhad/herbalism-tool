# Scratchpad

## Current Task: Profile Page Complete Overhaul

**Date:** 2025-12-30
**Branch:** knights-of-belyar
**Status:** Phases 1-3 COMPLETE - Ready for Phase 4

---

## Session 2 Summary (2025-12-30)

### What Was Accomplished This Session

Successfully implemented **Phases 1-3** of the profile page redesign plus initial page integration:

#### Phase 1: Decorative Foundation - COMPLETE

**New UI Components Created:**

1. **`src/components/ui/OrnateFrame.tsx`**
   - Decorative frame with CSS gradient borders
   - Variants: `default`, `bronze`, `gold`, `subtle`
   - Corner flourishes via absolute-positioned spans
   - Padding presets: `none`, `sm`, `md`, `lg`
   - Props: `variant`, `corners`, `padding`, `className`

2. **`src/components/ui/Divider.tsx`**
   - Section separator component
   - Variants: `default`, `ornate`, `subtle`, `bronze`
   - Supports horizontal/vertical orientation
   - Optional center ornament (diamond character)
   - Uses CSS gradients for fade-in/fade-out effect

**CSS Utilities Added to `globals.css`:**
```css
.text-embossed        /* Text shadow for engraved effect */
.text-bronze-gradient /* Metallic gradient text fill */
.glow-inner-bronze    /* Inset box-shadow glow */
.glow-outer-bronze    /* Outer box-shadow glow */
.glow-bronze          /* Combined inner + outer glow */
.texture-paper        /* SVG noise texture overlay */
.border-ornate        /* Double border with box-shadow */
.medallion            /* Circular stat container style */
.modifier-positive    /* Green for +modifiers */
.modifier-negative    /* Red for -modifiers */
.modifier-neutral     /* Muted for 0 modifiers */
```

**Updated `GrimoireCard.tsx`:**
- Added `variant` prop with 5 options:
  - `default` - Standard grimoire-900 background
  - `raised` - Slightly elevated with grimoire-850
  - `inset` - Recessed with grimoire-950
  - `bronze` - Bronze border with glow effect
  - `subtle` - Minimal styling, semi-transparent
- Added `padding` prop: `none`, `sm`, `md`, `lg`
- Added `corners` prop for bronze corner flourishes

---

#### Phase 2 & 3: Character Banner & Stats - COMPLETE

**New Character Components Created:**

1. **`src/components/character/CharacterPortrait.tsx`**
   - Bronze-framed portrait display
   - Size variants: `sm` (64x80), `md` (96x128), `lg` (128x160)
   - Uses Next.js Image component for artwork_url
   - Placeholder silhouette emoji when no image
   - Corner flourishes with bronze-bright color
   - Subtle vignette overlay for depth

2. **`src/components/character/CharacterBanner.tsx`**
   - Hero banner combining portrait + identity info
   - Displays: Name, Level, Class, Order, Race, Subrace, Background, Vocation
   - Uses CharacterPortrait component
   - Integrated Edit Character link and Sign Out button
   - Responsive layout (desktop shows full actions, mobile compact)
   - Shows user email via Divider separator
   - Uses CLASSES, KNIGHT_ORDERS, RACES, etc. from constants

3. **`src/components/character/StatBlock.tsx`**
   - Medallion-style individual stat display
   - Shows stat abbreviation, score, and modifier
   - Variants: `default`, `honor` (gold/amber styling), `compact`
   - Color-coded modifiers (emerald positive, red negative)
   - Uses getAbilityModifier from constants

4. **`src/components/character/AbilityScorePanel.tsx`**
   - Horizontal layout for all 6 core stats
   - STR, DEX, CON, INT, WIS, CHA in a row
   - HON (Honor) centered below with decorative gradient lines
   - Wraps in GrimoireCard with SectionHeader
   - Uses StatBlock components internally

5. **`src/components/character/VitalsPanel.tsx`**
   - Compact panel for HP, AC, Initiative
   - HP bar with gradient fill and color states:
     - Green (>50%), Amber (25-50%), Red (<25%)
   - Inner shine effect on HP bar
   - AC display with shield emoji and armor level label
   - Initiative display with lightning emoji
   - Uses getAbilityModifier for initiative calculation

---

#### Profile Page Integration - COMPLETE

**Changes to `src/app/profile/page.tsx`:**

1. **Imports updated:**
   - Added: `CharacterBanner`, `AbilityScorePanel`, `VitalsPanel`
   - Removed unused: `RACES`, `HUMAN_CULTURES`, `CLASSES`, `BACKGROUNDS`, `KNIGHT_ORDERS`, `ABILITY_NAMES` (now handled by child components)

2. **CharacterView restructured:**
   - Replaced 40+ lines of header/auth markup with single `<CharacterBanner>` component
   - Replaced cramped 4x2 stats grid with `<VitalsPanel>` + `<AbilityScorePanel>` side-by-side
   - Root container now uses `space-y-6` for consistent vertical rhythm
   - Removed redundant wrapper `<div className="mt-6">` elements
   - Skills and Coin Purse now in 2-column grid

3. **New layout structure:**
   ```
   CharacterBanner (portrait + identity + actions)
   ├─ VitalsPanel (240px) │ AbilityScorePanel (flex)
   ├─ Skills Card │ Coin Purse Card
   ├─ ArmorDiagram
   ├─ WeaponSlots
   ├─ QuickSlots
   ├─ Appearance (conditional)
   └─ Herbalism Settings (conditional)
   ```

**Barrel Exports Updated:**
- `src/components/ui/index.ts` - Added OrnateFrame, Divider exports
- `src/components/character/index.ts` - Added CharacterPortrait, CharacterBanner, StatBlock, AbilityScorePanel, VitalsPanel exports

---

### Build Status

- **Compilation:** SUCCESS
- **TypeScript:** Pre-existing error in `edit-character/page.tsx:190` (unrelated to this work)
  - `setCharacterArmor` returns `void` but code expects `{ error }`
  - This should be fixed separately

---

## Files Modified This Session

| File | Changes |
|------|---------|
| `src/app/globals.css` | Added 12 new CSS utility classes |
| `src/components/ui/OrnateFrame.tsx` | NEW - Decorative frame component |
| `src/components/ui/Divider.tsx` | NEW - Section separator component |
| `src/components/ui/GrimoireCard.tsx` | Added variant, padding, corners props |
| `src/components/ui/index.ts` | Added OrnateFrame, Divider exports |
| `src/components/character/CharacterPortrait.tsx` | NEW - Portrait with frame |
| `src/components/character/CharacterBanner.tsx` | NEW - Hero banner |
| `src/components/character/StatBlock.tsx` | NEW - Medallion stat display |
| `src/components/character/AbilityScorePanel.tsx` | NEW - Stats horizontal layout |
| `src/components/character/VitalsPanel.tsx` | NEW - HP/AC/Init panel |
| `src/components/character/index.ts` | Added 5 new exports |
| `src/app/profile/page.tsx` | Integrated new components, simplified imports |

---

## Next Session: Phase 4 - Equipment Unification

The profile page now has a proper hero banner and stats display. The next phase focuses on unifying the three equipment sections (Armor, Weapons, Quick Slots) with consistent grimoire styling.

### Files to Explore First
These components need to be read before planning changes:
- `src/components/ArmorDiagram.tsx` - Current armor silhouette diagram
- `src/components/character/WeaponSlots.tsx` - Main/Off hand weapon slots
- `src/components/character/QuickSlots.tsx` - 6 quick access item slots

### Planned Changes (from original plan)

**Phase 4: Equipment Unification**
- Update `ArmorDiagram.tsx`:
  - Apply grimoire/sepia/bronze palette
  - Add compact mode prop for tighter layout
  - Ensure AC display matches VitalsPanel styling
- Update `WeaponSlots.tsx`:
  - Apply grimoire palette
  - Consider vertical layout option
  - Compact mode for profile page
- Update `QuickSlots.tsx`:
  - Apply grimoire palette
  - 2x3 grid layout option (currently unknown layout)
  - Compact mode
- Consider `EquipmentPanel.tsx`:
  - Unified wrapper with shared "Equipment" header
  - Contains all three sections in responsive grid

**Phase 5: Supporting Sections**
- Update `CoinPurse.tsx` - Currently using zinc palette, needs grimoire
- Redesign skills badge display - Currently basic emerald badges
- Style appearance section - Currently plain italic text

**Phase 6: Final Polish**
- Responsive testing across breakpoints
- Animation/transition polish
- Any remaining visual inconsistencies

---

## Design Reference (Carried Forward)

### Color Palette
| Name | Purpose | Values |
|------|---------|--------|
| Grimoire | Dark backgrounds | 950:`#0d0c0a`, 900:`#151311`, 850:`#1a1815`, 800:`#211e1a` |
| Vellum | Text colors | 50:`#f5f0e6`, 100:`#e8e0d0`, 300:`#b8a890` |
| Sepia | Borders | 700:`#3d342a`, 600:`#4a3f32` |
| Bronze | Accents | muted:`#8b7355`, bright:`#c9a66b`, glow:`#a68952` |

### Design Philosophy
- NOT minimalist - "beauty in simple detail"
- Elegant + sleek - retro fantasy meets modern
- Natural flow - all elements balanced
- Closer to Baldur's Gate 3 aesthetic

---

## Original Plan Reference

Full 6-phase plan: `C:\Users\User\.claude\plans\harmonic-giggling-wigderson.md`

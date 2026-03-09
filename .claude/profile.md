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

# Design System 2.0 — Dark Fantasy Retro Pulp Fiction

**Piece:** 2.0 from Wave 2
**Date:** 2026-03-11
**Status:** Design approved (individual sections), pending final sign-off + implementation plan

## Aesthetic Direction

Dark fantasy retro pulp fiction with Apple-level polish. NOT generic fantasy, NOT clean minimalism, NOT AI slop. Gemstone-quality accents. Material surfaces with depth. Elegant typography.

## Typography Stack

| Role | Font | Weight | Min Size | Use |
|------|------|--------|----------|-----|
| **Display** | Grenze Gotisch | 600-900 | 1.2rem | Page titles, section headings, card titles |
| **Body** | Almendra | 400, 700 | 0.95rem | Paragraphs, descriptions, nav tab text, button text |
| **UI Chrome** | Cinzel | 400 (light) | 0.75rem | Stat badges, labels, element chips, small-caps UI |
| **Mono** | Geist Mono (keep) | 400-500 | 0.8rem | Dice rolls, numeric values where alignment matters |

**Sizing floor:** Nothing below 0.75rem (12px).

## Color System

### Base Palette (evolved from flat to material)

Keep the 4 existing families (grimoire, vellum, sepia, bronze) but evolve treatment:

- **Grimoire** (surfaces): Directional gradients (`linear-gradient(160deg, ...)`) instead of flat colors. Top-edge bronze highlight (1px gradient) on all cards.
- **Vellum** (text): 4-tier hierarchy — `vellum-50` primary → `vellum-100` secondary → `vellum-300` tertiary → `vellum-400` muted
- **Sepia** (borders): Gradient-fade borders (`linear-gradient(90deg, transparent, sepia, transparent)`) instead of solid lines
- **Bronze** (accents): Active states, button fills, highlights. System accent color.

### Elevation System (replaces arbitrary shadows)

| Level | Use | Treatment |
|-------|-----|-----------|
| **Base** | Page background, recessed areas | Darkest, inset shadow |
| **Raised** | Standard cards, content sections | Subtle lift, gentle shadow, top highlight |
| **Elevated** | Active/focused sections, hover | Clear lift, medium shadow, brighter highlight |
| **Floating** | Modals, tooltips, dropdowns | Strong lift, deep shadow, brightest highlight |

Each level: directional gradient background + `inset 0 1px 0 rgba(255,255,255, N)` top highlight + layered `box-shadow`.

### Element Accents — Illuminated Gemstone Technique

Each element uses 4 visual layers. NOT flat colors — they're *illuminated*.

| Element | Emoji | Color Family | Feeling |
|---------|-------|-------------|---------|
| Fire | 🔥 | Ember orange-crimson | Looking into a forge |
| Cold | ❄️ | Crystalline ice blue | Frosted window |
| Poison | ☠️ | Acidic green | Toxic and alive |
| Light | 🔆 | Radiant gold | Sunlight through stained glass |
| Dark | 🌑 | Amethyst purple | Gem containing a universe |
| Lightning | ⚡ | Electric indigo | Charged air |

**4-layer technique per element:**
1. Background gradient (dark → color-tinted → dark)
2. Inner glow (inset box-shadow)
3. Outer glow (ambient light spill)
4. Text glow (text-shadow)

**On hover:** All intensities increase + shimmer sweep (`::before` sliding gradient).

**Chips (inline):** Same colors at reduced intensity for stat badges. Subtle border + background tint + tiny glow.

## Components

### Buttons — Pill-shaped, 3 tiers

```
Primary:   border-radius: 999px, bronze gradient fill, dark text, inset highlight
Secondary: border-radius: 999px, subtle fill (12% opacity) + thin border
Text:      color only, no chrome, no border
```

Font: Almendra bold for primary, Almendra regular for secondary/text.

### Navigation Tabs — Arcane Glow

```
Active:   bronze text, upward gradient glow, text-shadow, bottom border bronze
Inactive: muted bronze text (#6b5d4a), bottom border sepia
```

Font: Almendra. Transition: 300ms ease on color, background, text-shadow, border-color.

### Cards — Evolved GrimoireCard

Replace flat backgrounds with directional gradients. Add top-edge bronze gradient highlight. Use elevation system for variants. Keep existing `corners` decoration option.

### Forms (inferred from aesthetic)

- **Inputs:** Dark grimoire background, sepia border, bronze glow on focus, Almendra text
- **Selects:** Same treatment, custom dropdown at floating elevation
- **Checkboxes:** Bronze fill when checked, subtle sepia border unchecked

### Modals — Floating elevation

- Backdrop: `rgba(0,0,0,0.7)` with subtle blur
- Surface: Floating-level card (deepest shadows, brightest surface)
- Top-edge bronze highlight
- Smooth scale-in animation

### Dividers — Gradient fade

Replace solid borders with `linear-gradient(90deg, transparent, sepia-700/50, transparent)`. Optional center ornament (✧ or ◆).

### Skeletons & Loading — Themed

Replace zinc colors with grimoire palette. Warm pulse animation (bronze tones).

### Error/Warning Displays — Integrated

Keep red/amber semantics but integrate with grimoire surface treatment.

## Animation Philosophy

**Magical but restrained.** Every animation feels like it belongs in a grimoire.

- **Hover:** Element shimmer sweep (CSS `::before` sliding gradient)
- **Focus/Active:** Arcane glow brightening (shadow intensity increase)
- **Transitions:** 200-300ms ease, never jarring
- **Loading:** Warm pulse (bronze tones, not gray)

## Early Rename (from Wave 2 kickoff)

positive/negative → **Light/Dark** with 🔆/🌑 emojis. Applied as part of this piece since it touches the element system.

## Files to Modify

**Existing:**
- `src/app/globals.css` — evolved palette, new CSS vars, utility classes, animation keyframes
- `src/app/layout.tsx` — replace Geist fonts with Grenze Gotisch + Almendra + Cinzel + keep Geist Mono
- `src/components/ui/GrimoireCard.tsx` — material surfaces, elevation variants
- `src/components/ui/OrnateFrame.tsx` — align with evolved palette
- `src/components/ui/Divider.tsx` — gradient fade
- `src/components/ui/SectionHeader.tsx` — Cinzel font, updated styling
- `src/components/ui/PageLayout.tsx` — updated defaults
- `src/components/ui/Skeleton.tsx` — grimoire-themed (replace zinc)
- `src/components/ui/LoadingState.tsx` — grimoire-themed
- `src/components/ui/ErrorDisplay.tsx` — integrate with palette
- `src/components/ui/WarningDisplay.tsx` — integrate with palette
- `src/components/elements/ElementBadge.tsx` — rewrite with illuminated accents

**New:**
- `src/components/ui/Button.tsx` — pill button component (3 tiers)
- `src/components/ui/Modal.tsx` — floating elevation modal
- `src/components/ui/Tabs.tsx` — arcane glow tabs
- `src/components/ui/Input.tsx` — themed form input
- `src/components/ui/Select.tsx` — themed select
- `src/components/ui/Checkbox.tsx` — themed checkbox
- `src/components/ui/ElementChip.tsx` — inline element chip

## Visual References

Mockups saved in `.superpowers/brainstorm/6248-1773275198/`:
- `dazzle-accents.html` — approved element accent treatment
- `palette-evolution.html` — approved material surface evolution
- `nav-and-buttons.html` — approved nav + button styles
- `sleek-ui.html` — UI styling exploration
- `typography-fantasy.html`, `typography-pairings.html`, `body-font-options.html` — typography explorations

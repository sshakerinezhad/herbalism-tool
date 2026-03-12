# Scratchpad

**Branch:** `knights-of-belyar`
**Last session:** 2026-03-11

## What was done

### Piece 2.0 Design System brainstorm — COMPLETE

Full design spec written to `docs/superpowers/specs/2026-03-11-design-system-evolution.md`.

**Key decisions (all approved individually by user):**
- **Typography:** Grenze Gotisch (titles) + Almendra (body) + Cinzel Light (UI chrome) + Geist Mono (numbers)
- **Nav tabs:** Arcane Glow — active tab has gradient up-glow + text-shadow
- **Buttons:** Pill-shaped (border-radius: 999px), 3 tiers: bronze gradient primary, subtle secondary, text-only tertiary
- **Element accents:** Illuminated gemstone technique — 4 layers (gradient bg, inner glow, outer glow, text glow) + shimmer on hover. Fire/Cold/Poison/Light/Dark/Lightning.
- **Palette evolution:** Material surfaces (directional gradients, not flat), top-edge bronze highlights, gradient-fade dividers
- **Elevation system:** Base → Raised → Elevated → Floating (replaces arbitrary shadows)
- **Min text size:** 0.75rem (12px) — the Cinzel labels were too small before
- **Early rename:** positive/negative → Light/Dark with 🔆/🌑

**Visual mockups** saved in `.superpowers/brainstorm/6248-1773275198/` — especially `dazzle-accents.html` and `palette-evolution.html` which are the approved reference designs.

### Previous: Kickoff brainstorm (complete)
See `.claude/wave2.md` for the 6 cross-cutting decisions.

## Current state

- **Wave 1 complete and deployed**
- **Build passes cleanly**
- **Supabase linked locally**
- **Kickoff brainstorm complete**
- **2.0 Design brainstorm complete** — spec doc written, user approved all pieces individually

## Key context for next agent

- **Design spec is the source of truth:** `docs/superpowers/specs/2026-03-11-design-system-evolution.md`
- **User's taste:** Apple-level polish + dark fantasy. "Tasteful but dazzling." Wants gemstone-quality accents, not flat colors.
- **User hates clunky UI:** Rejected uppercase heavy nav tabs multiple times. Wants lithe, graceful, stylish. Arcane flair but simple.
- **Profile type is `{ name: string }`** — all modifiers computed from `characterUtils.ts`
- **Tailwind v4:** No `tailwind.config.ts` — uses `@theme inline` in `globals.css`
- **No component libraries:** Pure Tailwind, no Radix/Headless UI

## Next steps

1. ~~Kickoff brainstorm~~ ✓
2. ~~Brainstorm Piece 2.0~~ ✓
3. **Get final sign-off on full design** ← NEXT (user approved each piece but needs formal "yes" on the combined doc)
4. Write implementation plan (invoke `writing-plans` skill)
5. Run `/verify` to generate tests
6. Execute plan for Piece 2.0

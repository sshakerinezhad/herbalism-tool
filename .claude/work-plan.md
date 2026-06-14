# Work Plan

Active: **Wave 2C — Weapons, Combat Gear & Brew Correctness**

- Design spec: `docs/superpowers/specs/2026-06-14-wave2c-weapons-combat-design.md` (brainstormed + approved)
- 2C is split into 5 dependency-ordered, independently-shippable pieces (see spec).

## Status

- [x] **Piece 1 — Brew correctness** — plan: `docs/superpowers/plans/2026-06-14-2c-brew-correctness.md`
      - batch-DC now per-brew (not batch total); stable selected-herb key; optional table-side
        d20 entry (localStorage `brew:manualRoll`); failed-batch-waste note. tsc clean.
      - Needs human browser verify (container blocks Google Fonts so `next build` can't finish here).
- [ ] **Piece 2 — Weapon data model + property checkboxes** (migration `014`: make_tier, shield fields)
- [ ] **Piece 3 — Equip overhaul** (Equipped Weapons list off `is_equipped`; retire `character_weapon_slots`)
- [ ] **Piece 4 — Ammo, special arrows (brew-time fusion) & raw add-to-inventory**
- [ ] **Piece 5 — AC/shield integration + grimoire visual pass**

## Open item to confirm

`brew/page.tsx` still gates brewing on `vocation === 'herbalist'` (now ~line 340), contradicting
Wave 2B's "recipe-based access" decision and likely causing the backlog "Brew option not available"
bug. Confirm before changing access control.

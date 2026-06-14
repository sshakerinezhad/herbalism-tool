# Work Plan

Active: **Wave 2C — Weapons, Combat Gear & Brew Correctness**

- Design spec: `docs/superpowers/specs/2026-06-14-wave2c-weapons-combat-design.md` (brainstormed + approved)
- 2C is split into 5 dependency-ordered, independently-shippable pieces (see spec).

## Status

- [x] **Piece 1 — Brew correctness** — plan: `docs/superpowers/plans/2026-06-14-2c-brew-correctness.md`
      - batch-DC now per-brew (not batch total); stable selected-herb key; optional table-side
        d20 entry (localStorage `brew:manualRoll`); failed-batch-waste note. tsc clean.
      - Needs human browser verify (container blocks Google Fonts so `next build` can't finish here).
- [x] **Piece 2 — Weapon data model + property checkboxes** — plan:
      `docs/superpowers/plans/2026-06-14-2c-weapon-data-model.md`
      - Migration `014` (make_tier + shield cols + CHECK); `CharacterWeapon`/`database.types.ts` updated;
        pure `src/lib/weapons.ts` (`computeWeaponModifiers`, make rules, die-stepping, canonical-10).
      - Add/Edit weapon modals → property checkbox grid + make-tier select + shield fields; range
        reveals for Thrown OR Ammunition; WeaponCard shows computed attack/damage + make/shield badges.
      - tsc clean. **User must run `npm run db:push && npm run db:types`** to apply 014 + regen types.
      - WeaponCard still uses legacy zinc palette — grimoire restyle happens in Piece 5.
- [ ] **Piece 3 — Equip overhaul** (Equipped Weapons list off `is_equipped`; retire `character_weapon_slots`)
- [ ] **Piece 4 — Ammo, special arrows (brew-time fusion) & raw add-to-inventory**
- [ ] **Piece 5 — AC/shield integration + grimoire visual pass**

## Open item to confirm

`brew/page.tsx` still gates brewing on `vocation === 'herbalist'` (now ~line 340), contradicting
Wave 2B's "recipe-based access" decision and likely causing the backlog "Brew option not available"
bug. Confirm before changing access control.

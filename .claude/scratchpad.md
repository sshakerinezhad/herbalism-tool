# Scratchpad

**Branch worked on:** `claude/current-state-check-96qvio` (merged into `main`; both at `277d3a5`)
**Session date:** 2026-06-14
**Wave:** 2C — Weapons, Combat Gear & Brew Correctness

## What this session did

Brainstormed Wave 2C (brainstorming skill), wrote the design spec, then planned + executed
Pieces 1 and 2 of 5. All committed and merged to `main`.

**Design spec (source of truth):** `docs/superpowers/specs/2026-06-14-wave2c-weapons-combat-design.md`

### Piece 1 — Brew correctness  (DONE) — plan: `docs/superpowers/plans/2026-06-14-2c-brew-correctness.md`
- Fixed batch-DC inflation: DC now uses per-brew herb count (`6 + 2*herbs-per-brew`), not the
  batch total. (`src/app/(app)/brew/page.tsx`)
- Added optional "roll the d20 myself" checkbox (default off; persists in localStorage
  `brew:manualRoll`). When on, prompts for the player's d20 and computes success — app still does
  the math, just doesn't roll.
- Hardened the selected-herbs React key (`HerbSelector.tsx`, was the duplicate-key console bug).
- Added "ingredients used up" note for failed batch attempts (`ResultPhase.tsx`).
- Verified the element-pairing toggle bug was already fixed (index-based selection).
- Removed the herbalist-only brew gate -> brewing is now recipe-based (Wave 2B intent);
  non-herbalists brew on INT alone; added a "no recipes" empty state. Fixes the
  "brew not available" backlog bug.

### Piece 2 — Weapon data model + property checkboxes  (DONE) — plan: `docs/superpowers/plans/2026-06-14-2c-weapon-data-model.md`
- Migration `supabase/migrations/014_weapon_make_and_shields.sql`: adds `make_tier`, `is_shield`,
  `ac_bonus`, `str_requirement`, `shield_active` + a make_tier CHECK constraint.
- Updated `src/lib/types.ts` (`CharacterWeapon`); `src/lib/database.types.ts` was regenerated
  from the live schema after the migration was applied (see below).
- New pure helper `src/lib/weapons.ts`: `WEAPON_PROPERTIES` (canonical 10), `MAKE_TIERS` +
  `MAKE_TIER_INFO`, `computeWeaponModifiers(weapon, material?)`, `stepDamageDie`, `formatBonus`.
- Add/Edit weapon modals: comma-text properties -> checkbox grid; make-tier select; shield fields.
  Range inputs reveal for Thrown OR Ammunition (fixed a subagent regression that hid range
  for bows/crossbows). `WeaponCard` shows computed attack/damage + make/shield badges + caveats.

### Key decisions (confirmed with user)
- Invariant: app rolls dice only for downtime (forage/brew); combat is always table-side.
  No attack/damage resolution is built — make/material/ammo/AC are tracked & displayed only.
- Equip model (Piece 3): kill the 6-slot/hands system. Profile shows a curated "Equipped
  Weapons" list off the existing `is_equipped` flag. Retire `character_weapon_slots`. No
  active/inactive — player decides what they're using at the table.
- Make/materials: data + computed display only; NO live durability/honing (that's Wave 3B).
- Special arrows: crafted at BREW time (brew output fused onto base arrows), not a weapon-side UI.
- Everything addable raw to inventory (gifts/DM awards/purchases) — generic "Add item" path.
- Shields are weapons in the weapons list; a shield marked "active" adds its specific AC bonus.

## DB / deploy status
- Migration `014` is APPLIED to the remote DB and recorded in `supabase_migrations.schema_migrations`
  (version `014 / weapon_make_and_shields`). Applied via the Supabase Management API SQL endpoint
  because this container's egress blocks direct Postgres (`db push` timed out on the pooler);
  Management API over HTTPS worked. `database.types.ts` was regenerated from the live schema and
  committed. Prod DB and `main` are aligned — weapon add/edit works against prod.
- SECURITY: a Supabase personal access token (`sbp_…`) and the DB password were pasted in chat this
  session. User was asked to rotate the DB password and revoke the access token. Confirm/rotate.
- `next build` could NOT complete in-container (Google Fonts egress blocked) — verify with a real
  build / `npm run dev` on a normal machine. tsc (`npx tsc --noEmit`) is clean across all changes;
  lint clean on touched files (repo has pre-existing lint errors in untouched files —
  `useBrewState.ts`, `profile.tsx`, `characters.ts`).
- Still-open browser verification (couldn't run the app here): brew batch DC + roll-myself checkbox;
  weapon Add/Edit modals + WeaponCard computed modifiers.

## What to do next (next session: use superpowers — writing-plans per piece; spec exists so brainstorming likely unneeded)
- Piece 3 — Equip overhaul: Equipped Weapons list off `is_equipped`; retire
  `character_weapon_slots` (drop table + its hand UI: `WeaponSlots.tsx`, `WeaponSlotCard.tsx`,
  rework `EquipmentWeaponsPanel.tsx`); add a `toggleEquipped` mutation; drop slot fetch/equip hooks.
- Piece 4 — Ammo + special arrows + raw add-to-inventory: arrow-type catalog + quantities;
  brew-time special-arrow fusion; generic raw "Add item" path for all categories.
- Piece 5 — AC/shield integration + grimoire visual pass: shield-active AC math + icon;
  apply the 2.0 design system to weapon list/cards/ammo (WeaponCard still uses legacy zinc palette).

See `.claude/work-plan.md` for the live checklist.

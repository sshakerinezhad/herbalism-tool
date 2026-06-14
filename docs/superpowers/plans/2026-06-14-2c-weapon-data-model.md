# Wave 2C · Piece 2 — Weapon Data Model + Property Checkboxes

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans. Steps use `- [ ]`.

**Goal:** Store weapon **make-tier** + **shield** attributes, compute & display the resulting
attack/damage modifiers, and replace the comma-text weapon-properties field with a checkbox grid
of the canonical 10 properties.

**Architecture:** Additive migration `014` on `character_weapons` (no data loss; new nullable/defaulted
columns). A pure `src/lib/weapons.ts` helper computes *displayed* modifiers from make-tier + material
(no dice resolution, mirrors the `characterUtils.ts` computed-modifier pattern). Add/Edit weapon modals
gain make-tier select, shield fields, and a property checkbox grid.

**Tech Stack:** Next.js 16, Supabase (Postgres), React Query, Tailwind v4. Verify with `tsc --noEmit`
+ `npm run lint`. DB push/type-gen happen on the user's machine (`npm run db:push && npm run db:types`).

**Spec:** `docs/superpowers/specs/2026-06-14-wave2c-weapons-combat-design.md`

---

### Task 1: Migration 014 — make-tier + shield columns

**Files:** Create `supabase/migrations/014_weapon_make_and_shields.sql`

- [ ] Add columns + make_tier CHECK constraint (see committed SQL).
- [ ] User runs `npm run db:push && npm run db:types` to apply + regenerate types.

### Task 2: Hand-update types to match (until user regenerates)

**Files:** `src/lib/types.ts` (CharacterWeapon), `src/lib/database.types.ts` (character_weapons Row/Insert/Update)

- [ ] Add `make_tier: string`, `is_shield: boolean`, `ac_bonus: number | null`,
  `str_requirement: number | null`, `shield_active: boolean`.

### Task 3: Pure make/material modifier helper

**Files:** Create `src/lib/weapons.ts`

- [ ] `WEAPON_PROPERTIES` canonical-10 const; `MAKE_TIERS` const with labels/notes.
- [ ] `computeWeaponModifiers(weapon, material?)` → `{ attackBonus, damageBonus, effectiveDamageDice,
  makeLabel, makeNote, noProficiency, disadvantageOnAttack }`. Make-tier rules: Master = +2 atk/dmg
  + die step; Artisan = die step; Standard = none; Dusted = noProficiency; Busted = clamp positive
  bonuses to 0; Broke = clamp + disadvantage. Die step: d4→d6→d8→d10→d12→2d6.

### Task 4: Weapon modal checkboxes + make/shield fields (delegated to subagent)

**Files:** `src/components/inventory/modals/AddWeaponModal.tsx`, `EditWeaponModal.tsx`,
`src/components/inventory/equipment/WeaponCard.tsx` (display computed modifiers)

- [ ] Replace comma-text properties with a checkbox grid (WEAPON_PROPERTIES). Versatile → alt-die
  input; Thrown → range_normal/range_long inputs.
- [ ] Add make-tier `<select>` and shield fields (is_shield → reveals ac_bonus + str_requirement).
- [ ] WeaponCard shows `computeWeaponModifiers` output (attack/damage + make label).

### Verification
`npx tsc --noEmit` clean; `npm run lint` no new errors. After user db:push: add a weapon with each
make-tier + a shield; confirm card shows correct computed modifiers and properties persist.

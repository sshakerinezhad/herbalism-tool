# Scratchpad

**Branch worked on:** `claude/new-session-hnqg10` (Wave 2C Pieces 3–5 + review fixes); being merged into `main`.
**Session date:** 2026-06-22
**Wave:** 2C — Weapons, Combat Gear & Brew Correctness — ✓ COMPLETE (all 5 pieces)

## What this session did

Executed Wave 2C **Pieces 3–5** (Pieces 1–2 shipped in the 2026-06-14 session). Brainstormed the
remaining mechanics, wrote `docs/superpowers/plans/2026-06-22-2c-pieces-345.md`, then implemented via
subagent-driven development (implementer + spec/quality review per piece + a final holistic review).

- **P3 Equip overhaul** (migration `015`): retired `character_weapon_slots`; equipped weapons now
  driven by `is_equipped`. New `EquippedWeaponsList`, `toggleEquipped` mutation, equip toggle +
  "On hand" badge on `WeaponCard`. `initialize_character_slots()` rewritten to keep seeding quick
  slots. Removed dead slot hooks/mutations/types.
- **P4 Ammo, special arrows & raw-add** (migrations `016` + `017`): `fuse_bombs_to_arrows` RPC —
  1 bomb + 1 base arrow → 1 special arrow, atomic, **consumes across all base-arrow stacks** (017
  fixed a single-stack bug found in review). Special arrows = `character_items` ammo with
  `properties.source='fused_bomb'`. `FuseArrowsModal` on bomb cards (cap = min(bombs, base arrows)).
  Raw-add reuses the EXISTING `AddHerbModal` + `AddElixirModal` — a redundant/inferior `AddBrewedModal`
  was built then reverted (AddElixirModal already has potency/template/choice handling).
- **P5 AC/shield + visual pass**: `setActiveShield` (one active at a time; clears stale `shield_active`
  on unequip). Shield bonus shown as a **secondary `+N` bubble** beside AC — base AC math UNCHANGED.
  "Wield" toggle on equipped shields. `WeaponCard` + weapon modals + `WeaponsTab` restyled grimoire 2.0.

## Key decisions (confirmed with user this session)
- Special arrows are AMMO items (not weapon-side); fusion is an inventory action on a BOMB only;
  ratio 1 bomb = 1 base arrow = 1 special arrow.
- Raw-add covers herbs + brewed + any item (DM/player gifts) — herbs/brewed already had modals.
- One active shield at a time; shield AC is a secondary bubble, never summed into the main AC number.

## DB / deploy status
- Migrations `015`/`016`/`017` APPLIED to prod (`cliiijgqzwkiknukfgqc`) via the Supabase Management API
  SQL endpoint (HTTPS) — direct Postgres/pooler egress is blocked in-container. Recorded in
  `supabase_migrations.schema_migrations`. `database.types.ts` regenerated + committed. Prod aligned.
  - The `SUPABASE_ACCESS_TOLEN` env var (note the typo) holds the access token but with a LEADING SPACE
    — trim it (`tr -d '[:space:]'`) and set `SUPABASE_ACCESS_TOKEN` from it for the CLI/API.
- `npx tsc --noEmit` clean; lint clean on touched files (pre-existing lint errors remain in untouched
  files: `brew/page.tsx`, `useBrewState.ts`, `.claude/skills/` scripts). `npm run build` only fails on
  blocked Google-Fonts egress (Cinzel/Geist Mono/Grenze Gotisch) — verify build on a normal machine.
- 🔐 SECURITY: a Supabase access token (`sbp_…`) and the DB password were pasted in chat this session.
  Kept out of all commits/files. **User should rotate both.**

## Browser verification still open (couldn't run the app here)
- P3: equip/unequip from inventory → equipped list + "On hand" badge update; no hand slots on profile.
- P4: add base arrows → brew/own a bomb → fuse → counts decrement, special-arrow stack appears;
  raw-add a herb and a recipe-brewed item.
- P5: equip+wield a shield → secondary `+N` bubble appears; wielding a second shield deactivates first.

## Deferred / out of scope (noted, not done)
- Item-UI restyle: `ItemCard`/`AddItemModal`/`ItemsTab` still use zinc (this wave's visual pass was
  weapon-focused).
- Stale `character_weapon_slots` mention in `src/lib/ARCHITECTURE.md` (docs only).

## Wave 2 remaining after this
- **Deferred 2A visual pass** [needs its own brainstorm] — spec
  `docs/superpowers/specs/2026-03-12-profile-navigation-restructure.md`: character bar (trait modals,
  skill proficiencies), mobile nav collapse, character-creation wizard restyle, design-system polish on
  profile/settings/creation page content.
After that, Wave 2 is complete. (Wave 3+ e.g. 3B Martial Mastery is future.)

See `.claude/wave2.md` (2C section now ✓ COMPLETE) and `.claude/work-plan.md`.

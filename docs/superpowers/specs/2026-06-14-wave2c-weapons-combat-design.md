# Wave 2C — Weapons, Combat Gear & Brew Correctness (Design Spec)

## Context

Wave 2 rebuilds each subsystem with functional fixes + the grimoire design system in one pass.
2.0/2A/2B are done. 2C is the weapons & combat-gear piece. The existing weapon equip system
(6 Elden-Ring-style hand slots in `character_weapon_slots`) is the loudest complaint in
`improvements/backlog.md`, custom-weapon properties are a fragile comma-text field, ammo isn't
tracked, and special arrows (a herbalism cross-over) don't exist. Separately, the brew flow —
which special arrows ride on — has a real batch-DC bug.

Produced via the brainstorming skill; every scope decision below was confirmed with the user.

## Guiding invariant

The app tracks and computes everything; it rolls dice only for **downtime** (forage/brew).
**Combat / live play is always table-side** — the app shows bonuses + which dice, the player
rolls. No attack-roll/damage resolution is built here. Make-tiers, materials, shields, ammo, and
AC are *tracked and displayed*, never *resolved*.

## Locked decisions

| Area | Decision |
|---|---|
| Equip model | Remove hands/slots/active-inactive. Profile shows a curated **Equipped Weapons** list off the legacy `character_weapons.is_equipped` flag. Retire `character_weapon_slots` + hand UI. |
| Make & materials | Store `make_tier` + `material_id`; **compute & display** attack/damage modifiers; make-tier set manually. **No live durability counter** (→ 3B). |
| Ammo & special arrows | Full tracking + arrow-type catalog. **Special arrows crafted at brew time** (a brew output fused onto base arrows). |
| Add raw to inventory | Everything (weapons, ammo, special arrows, brewed, herbs) addable to inventory **without** foraging/brewing. |
| Shields | Are weapons → live in the weapons list, addable to Equipped. AC panel shows base AC + subtle shield icon; a shield marked **active** adds *its* specific bonus (+1/+2/+3). |
| Weapon properties | Canonical 10 as checkboxes: Light, Finesse, Heavy, Reach, Two-Handed, Versatile, Ammunition, Loading, Thrown, Special. Versatile → alt-die; Thrown → normal/long range. |
| Brewing dice | System rolls by default (downtime). Optional **"roll it myself"** checkbox: shows DC + modifier + what to roll, player enters result. |
| Batch failure | Failed batch brews consume their herbs (intentional waste); surfaced clearly in result copy. |

## Out of scope (→ Wave 3B / later)

Live durability/honing; Martial Mastery engine (stamina dice, techniques, stances, crits,
lingering injuries); attack/damage resolution; alchemy; multiclass. The 10-property taxonomy is
built to be the future prerequisite data for 3B techniques.

## Pieces (dependency order — each independently shippable)

1. **Brew correctness** — batch-DC fix, optional live-roll checkbox, duplicate-key fix, verify
   pairing toggle, batch-waste copy. (No migration.) *Unblocks special arrows.*
2. **Weapon data model + property checkboxes** — migration `014`: `make_tier`, shield fields;
   pure `weapons.ts` helper computing displayed attack/damage modifiers; checkbox-grid properties.
3. **Equip overhaul** — Equipped Weapons list off `is_equipped`; retire `character_weapon_slots`.
4. **Ammo, special arrows & raw add-to-inventory** — arrow catalog + quantities; brew-time
   special-arrow fusion; generic "Add item" path.
5. **AC/shield integration + grimoire visual pass.**

## Open item to confirm

`brew/page.tsx:329` still gates brewing on `vocation === 'herbalist'`, contradicting Wave 2B's
"recipe-based access" decision and likely causing the backlog "Brew option not available" bug.
Confirm whether removing this gate belongs in 2C.

## Verification

`npm run build` + `npm run lint` after each piece (repo convention; `/verify` optional). Manual
end-to-end per piece (see each plan). After migrations: `npm run db:push` then `npm run db:types`.

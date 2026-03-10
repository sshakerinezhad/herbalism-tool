# Shared Systems Specification

## Source Documents
- **Elros Player's Guide (EPG):** Weapons (lines 1110-1278), Materials (lines 1279-1400), Armor (lines 1402-1456), Resting (lines 2304-2360), Dull Casting (lines 2386-2398), Long Tests (lines 2380-2385)
- **Martial Mastery Expansion 2 (MM2):** Armor Revision (lines 8-47), Shield Changes (lines 48-62), Resting (lines 111-147)
- **Authoritative on conflicts:** MM2 supersedes EPG wherever they overlap

## Overview
Shared systems are the cross-cutting game mechanics that multiple Wave 3 features depend on. This includes the weapon data table, weapon materials and their "make" (quality tier), the armor system, shield types, resting/recovery rules, and foundational concepts like Long Tests and Dull Casting. These systems are prerequisites for martial mastery, archemancy, spellcasting, and vocations.

---

## Core Mechanics

### 1. Weapons Table

- **What it does:** Defines all weapon types available in Elros with their stats
- **Rules:**
  1. Weapons are categorized as Simple Melee, Simple Ranged, Martial Melee, or Martial Ranged
  2. Each weapon has: damage dice, damage type, properties, weight (lb), and cost
  3. Properties include: Light, Finesse, Heavy, Reach, Thrown (range), Two-Handed, Versatile (alt dice), Ammunition (range), Loading, Special
- **Inputs/Outputs:** Weapon type selection → damage dice, damage type, properties, weight, cost

#### Full Weapons Table (from EPG lines 1116-1225)

| Weapon | Damage | Type | Properties | Weight | Cost |
|--------|--------|------|------------|--------|------|
| **Simple Melee** | | | | | |
| Club | 1d4 | Bludgeoning | Light | 2 | 1 SP |
| Dagger | 1d4 | Piercing | Finesse, Light, Thrown (20/60) | 1 | 2 GP |
| Greatclub | 1d8 | Bludgeoning | Two-Handed | 10 | 2 SP |
| Handaxe | 1d6 | Slashing | Light, Thrown (20/60) | 2 | 5 GP |
| Javelin | 1d6 | Piercing | Thrown (30/120) | 2 | 5 SP |
| Light Hammer | 1d4 | Bludgeoning | Light, Thrown | 2 | 2 GP |
| Mace | 1d6 | Bludgeoning | — | 4 | 5 GP |
| Quarterstaff | 1d6 | Bludgeoning | Versatile (1d8) | 4 | 2 SP |
| Sickle | 1d4 | Slashing | Light | 2 | 1 GP |
| Spear | 1d6 | Piercing | Thrown (20/60), Versatile (1d8) | 3 | 1 GP |
| **Simple Ranged** | | | | | |
| Light Crossbow | 1d8 | Piercing | Ammunition, Range (80/320), Loading, Two-Handed | 5 | 25 GP |
| Dart | 1d4 | Piercing | Finesse, Thrown (20/60) | 0.25 | 5 CP |
| Shortbow | 1d6 | Piercing | Ammunition, Range (80/320), Two-Handed | 2 | 25 GP |
| Sling | 1d4 | Bludgeoning | Ammunition, Range (30/120) | — | 1 SP |
| **Martial Melee** | | | | | |
| Battleaxe | 1d8 | Slashing | Versatile (1d10) | 4 | 10 GP |
| Bladed Hurley | 1d8 | Slashing/Bludgeoning | Versatile (1d10) | 4 | 15 GP |
| Flail | 1d8 | Bludgeoning | — | 2 | 10 GP |
| Glaive | 1d10 | Slashing | Heavy, Reach, Two-Handed | 6 | 20 GP |
| Greataxe | 1d12 | Slashing | Heavy, Two-Handed | 7 | 30 GP |
| Greatsword | 2d6 | Slashing | Heavy, Two-Handed | 6 | 50 GP |
| Halberd | 1d10 | Slashing | Heavy, Reach, Two-Handed | 6 | 20 GP |
| Lance | 1d10 | Piercing | Heavy, Reach, Two-Handed (unless mounted) | 6 | 10 GP |
| Longsword | 1d8 | Slashing | Versatile (1d10) | 3 | 15 GP |
| Maul | 2d6 | Bludgeoning | Heavy, Two-Handed | 10 | 10 GP |
| Morningstar | 1d8 | Piercing | — | 4 | 15 GP |
| Pike | 1d10 | Piercing | Heavy, Reach, Two-Handed | 18 | 5 GP |
| Billhook | 1d10 | Slashing/Piercing | Heavy, Reach, Two-Handed | 24 | 8 GP |
| Rapier | 1d8 | Piercing | Finesse | 2 | 25 GP |
| Scimitar | 1d6 | Slashing | Finesse, Light | 3 | 25 GP |
| Shield | 1d6 | Bludgeoning | Light, Thrown (20/35), AC bonus from 1 shield at a time | 5 | 10 GP |
| Shortsword | 1d6 | Slashing | Finesse, Light | 2 | 10 GP |
| Trident | 1d8 | Piercing | Thrown (20/60), Versatile (1d10) | 4 | 5 GP |
| Warpick | 1d8 | Piercing/Bludgeoning | Versatile (1d10) | 2 | 5 GP |
| Warhammer | 1d8 | Bludgeoning | Versatile (1d10) | 2 | 15 GP |
| Whip | 1d6 | — | Finesse, Reach | 3 | 2 GP |
| **Martial Ranged** | | | | | |
| Blowgun | 1 | Piercing | Ammunition (25/100), Loading | 1 | 10 GP |
| Hand Crossbow | 1d6 | Piercing | Ammunition (30/120), Light, Loading | 3 | 75 GP |
| Heavy Crossbow | 1d10 | Piercing | Ammunition (100/400), Heavy, Loading, Two-Handed | 18 | 50 GP |
| Longbow | 1d8 | Piercing | Ammunition (150/600), Heavy, Two-Handed | 2 | 50 GP |

#### Projectiles Table (from EPG lines 1227-1277)

| Arrow Type | Effect | Cost (20) |
|------------|--------|-----------|
| Regular | — | 1 GP |
| Blunthead | Deals Bludgeoning damage | 1 GP |
| Bodkin | Attack bonus vs armored (Light +1, Medium +2, Heavy +3) | 3 GP |
| Broadhead | Bleeding on crit: 1d12/turn until healed, Medicine DC 15, or CON save | 5 GP |
| Corkscrew | Fires normally into water | 2 GP |
| Whistling | Marks path, audible within 120 ft | 1 GP |
| Elixir | Attached Herbalist bomb effect | — |
| Other Metals | Metal type effect (3 coins of material per arrow tip) | — |

---

### 2. Weapon Make System (from EPG lines 1279-1331)

- **What it does:** Defines weapon quality tiers that affect attack and damage
- **Rules:**
  1. Every melee weapon has a Make (quality tier) and a Material
  2. Make degrades through deterioration; only a Blacksmith reforging can restore it
  3. Honing during a short rest provides a buffer of 1 extra deterioration point
- **Make Tiers (best to worst):**

| Make | Mechanical Effect |
|------|-------------------|
| **Master Forged** | Increased damage dice again, +2 to all rolls |
| **Artisan Forged** | Increase one damage die step (if d12, add d4) |
| **Standard Forged** | Weapon is used as normal |
| **Dusted** | No proficiency bonus to attack rolls |
| **Busted** | No positive bonuses to attack and damage rolls |
| **Broke** | Same as Busted, plus disadvantage on attack rolls |

- **Deterioration:** When a weapon attack roll is a natural value within the material's "deteriorate conditions" range, the weapon takes a deterioration point. Accumulate enough points and the weapon drops one make tier.

---

### 3. Weapon Materials Table (from EPG lines 1333-1400, Vital Alloys from EPG lines 850-1043)

- **What it does:** Defines special properties and deterioration rules for each material
- **Rules:**
  1. Material determines special combat properties (e.g., Iron overcomes Fey resistance)
  2. Material determines deterioration conditions (which natural roll values cause deterioration, and how many points before degrading)
  3. Material determines GP Modifier for Smithing (used by Blacksmiths to calculate forging labor)

#### Mundane Materials

| Material | Attributes | Deteriorate Conditions | GP Modifier |
|----------|-----------|----------------------|-------------|
| Wood | Max Make: Dusted (slash/pierce), Standard (bludgeon); cannot be honed | 1 Natural 1-2 (must be mended) | N/A |
| Brass | — | 1 Natural 1-2 | PHB - 5 (Min 3) |
| Copper | Double damage to Animated Plants; more easily enchanted | 1 Natural 1-3 | PHB - 5 (Min 3) |
| Iron | Overcomes resistances of Fey | 1 Natural 1 | PHB × 1.5 |
| Steel | — | 2 Natural 1s | PHB × 1 |
| Silver | Overcomes resistances of Shapeshifters, Monstrosities | 1 Natural 1 | PHB × 2 |
| Gold | Overcomes resistances of Fiends; more easily enchanted | 1 Natural 1-3 | PHB × 4 |
| Platinum | Double B/S/P damage on lingering injury to Dragons; +1 crit range vs Dragons (melee) | 2 Natural 1s | PHB × 5 |
| Aero Crystal | Any weapon is Finesse | 1 Natural 1 | PHB × 4 |
| Adamantine | Overcomes resistances of Aberrations; Siege Weapon; more easily enchanted | N/A | PHB × 50 |
| Fomorian Steel | Each kill increases magical ability (can cast spells) | 1 Natural 1 | Cannot be made anew |

#### Vital Alloys (Mundane Metal + Vital Mineral → Special Material)

| Alloy | Base Metal | Vital Mineral | Attributes | Deteriorate | GP Mod |
|-------|-----------|---------------|-----------|-------------|--------|
| Galvanic Copper | Copper | Lightning Shards | Harpoon/pinned targets take double lightning damage | 1 Natural 1-3 | PHB |
| Yarkian Brass | Brass | Lightning Shards | Critical hit grants extra attack | 1 Natural 1 | PHB |
| Salinized Brass | Brass | Salt Shards | Fiends within 60ft: disadvantage on initiative, perception, concentration; overcomes fiend resistances CR 9 and below | 1 Natural 1 | PHB |
| LeadIron | Iron | Lead Shards | Overcomes Celestial/Construct resistances; crit → Poisoned (CON DC 16, 1 min) | 1 Natural 1 | PHB |
| Violode Steel | Steel | Living Water | Invisible when concealed; Undead CON DC 16 or burst into radiant flames (1d? radiant/round, 1 min) | 2 Natural 1s | PHB |
| Conspicuous Silver | Silver | Lead Shards | Double damage to Beasts; overcomes Plant resistance; crit reverts Shapeshifter to natural form | 1 Natural 1 | PHB |
| Heartgold | Gold | Sulfur Shards | Lingering injury banishes Fiend to Hell; visible Heartgold gives advantage vs Fiend charm/fear | 2 Natural 1s | PHB |
| Mithral | — | Lucid Shards | Weight -1 class, all melee are Finesse; enchantable; usable in dreams; overcomes Lycanthrope/Fey/Undead/Monstrosity/Somni resistances | 3 Natural 1s | PHB |
| Antediluvian Platinum | Platinum | Varies | Energy damage based on mineral type (Sulfur→Fire, Frost→Cold, Mercury→Acid, Lightning→Lightning, Lead→Poison); damage scales with shards per pound (1-5 shards → 1d4-1d12) | 2 Natural 1s | PHB |

---

### 4. Armor System (MM2 Authoritative — lines 8-47)

- **What it does:** Calculates AC from base value + DEX modifier + individual armor pieces
- **Rules:**
  1. Determine base AC by armor weight class: Light = 6, Medium = 8, Heavy = 0
  2. Apply DEX bonus by weight class: Light = full DEX, Medium = DEX max +2, Heavy = no DEX
  3. Add individual piece bonuses from the armor table
  4. Character is considered as heavily armored as their heaviest worn piece
  5. Heavy armor requires STR 13+; heavy armor gives disadvantage on Stealth
  6. Any individual armor piece can be Runed (one attunement at a time)
  7. **Rended armor** (from critical hit): piece loses AC bonus; fixable during short rest (1 piece) or long rest (proficiency bonus pieces)
  8. **Broken armor** (from lingering injury): must be reforged by a Blacksmith

#### MM2 Armor Piece Table

| Light Armor (6 base) | AC | Medium Armor (8 base) | AC | Heavy Armor (0 base) | AC |
|---|---|---|---|---|---|
| Add full DEX mod | | Add DEX mod (max +2), Min STR 13 | | Stealth disadvantage, Min STR 15 | |
| (1) Helm | +2 | (1) Helm | +2 | (1) Helm | +2 |
| | | | | (2) Gorget | +2 |
| (2) Padded Armor or Hide | +1 | (2) Breastplate | +2 | (3) Breastplate | +2 |
| | | | | (4) Left Pauldron | +2 |
| | | | | (5) Right Pauldron | +2 |
| (3) Left Bracer | +1 | (3) Left Bracer | +1 | (6) Left Gauntlet | +2 |
| (4) Right Bracer | +1 | (4) Right Bracer | +1 | (7) Right Gauntlet | +2 |
| | | | | (8) Tasset | +2 |
| | | | | (9) Left Poleyn | +1 |
| | | | | (10) Right Poleyn | +1 |
| (5) Left Greive | +1 | (5) Left Greive | +1 | (11) Left Greive | +1 |
| (6) Right Greive | +1 | (6) Right Greive | +1 | (12) Right Greive | +1 |

**Piece counts:** Light = 6 pieces (max +7 AC), Medium = 6 pieces (max +8 AC), Heavy = 12 pieces (max +20 AC)

**Max AC by weight class:**
- Light: 6 + DEX + 7 = 13 + DEX
- Medium: 8 + 2 (DEX cap) + 8 = 18
- Heavy: 0 + 0 + 20 = 20

---

### 5. Shield Types (MM2 lines 48-62)

- **What it does:** Defines shield varieties with AC bonus, requirements, and special properties
- **Rules:**
  1. Must be proficient in shields AND meet STR requirement to benefit from AC
  2. Wooden shields require the Mending spell to fix; metal shields fix like rended armor
  3. Some shields can be painted with Knight's Arms (bonus to Honor score)

| Shield Type | Material | AC Bonus | STR Req. | Reparable? | Painted? | Price | Weight |
|-------------|----------|----------|----------|-----------|----------|-------|--------|
| Buckler | Metal | +1 | — | Yes | — | 10 GP | 2 lbs |
| Pine Heater | Pine | +1 | — | — | HON +1 | 5 GP | 4 lbs |
| Oak Heater | Oak | +2 | STR 13 | Yes | HON +1 | 12 GP | 5 lbs |
| Oak Targe | Oak | +2 | STR 13 | Yes | — | 10 GP | 5 lbs |
| Tower Shield | Metal | +3 | STR 15 | Yes | HON +1 | 50 GP | 15 lbs |

---

### 6. Resting & Recovery (MM2 Authoritative — lines 111-147)

- **What it does:** Defines three rest tiers with healing, recovery, and downtime rules
- **Rules:**

#### Short Rest (30 minutes)
1. Can complete a light vocation activity, hone weapon, or fix rended armor (1 piece)
2. Roll hit dice to heal: up to **2 × proficiency bonus** hit dice (cannot exceed stored)
3. For each hit die rolled, add **Recovery skill modifier** to HP gained

#### Long Rest (8 hours)
1. Sleep at least 6 hours; light activity for remaining 2
2. Recover half of hit dice
3. Roll as many hit dice as desired, adding **Recovery skill modifier**
4. Fix rended armor: proficiency bonus pieces

#### Hiatus (3 days)
1. Sleep at least 6 hours, at least 3 times
2. First two sleeps treated as normal Long Rests
3. Fail if: combat for 3+ total turns per day, or particularly taxing physical activity before third Long Rest
4. **Benefits on completion:**
   - Regain all expended hit dice + additional hit dice equal to proficiency bonus
   - Regain all lost hit points
   - Gain temporary HP equal to half hit point maximum
   - Advantage on disease saving throws until next long rest
   - Recover all exhaustion levels
5. **Lingering Injury Healing:** Must be healed each day by amount on Recovery Table (or Medicine/Recovery Long Test). CON save Long Test to complete healing. Failure extends Hiatus by one day.

#### Recovery Table (for Hiatus Lingering Injury healing)

| Lingering Injury | Amount to Heal Per Day | CON Save DC |
|-----------------|----------------------|-------------|
| Horrific Scar | 8 HP/day | DC 10 |
| Bloody Mouth | 12 HP/day | DC 12 |
| Break a Wrist | 10 HP/day | DC 13 |
| Lose a Finger | 8 HP/day per finger | DC 15 |
| Break a Rib | 15 HP/day | DC 15 |
| Break a Leg | 20 HP/day | DC 15 |

---

### 7. Long Tests (EPG lines 2380-2385)

- **What it does:** Abstracts extended-duration skill checks
- **Rules:**
  1. Long Tests are skill checks over a long period of time
  2. Cannot be buffed by effects shorter than the duration (e.g., Bless cantrip can't buff a 4-hour Long Test)
  3. Used by: Blacksmith forging (4 hours), Herbalism brewing (4 hours), Scholar language learning, Spellscribe scroll crafting (4 hours), MMP training (1 hour)

### 8. Dull Casting (EPG lines 2386-2398)

- **What it does:** Allows cantrip-like effects from specific magic schools by expending a spell slot
- **Rules:**
  1. A spellcaster expends any spell slot (or Sorcerer mana) to cast a spell
  2. The effect must be cantrip-level in power
  3. The caster describes how the effect suits the school of magic of the chosen spell
  4. Cannot produce effects requiring attack rolls or saving throws
  5. The spell selected only determines the school of magic — nothing else about the effect
  6. Wizard subclasses associated with a particular school get familiarity benefits
- **Four types relevant to Archemancy:**
  - **Abjuration:** Extract vital minerals from plant ingredients or creature essences (CR 3+)
  - **Transmutation:** Combine vital minerals (one complex + two simpler → two copies of complex)
  - **Conjuration (Duplication):** Copy a vital mineral
  - **Chronurgy (Decomposition):** Break down a complex mineral into its simpler components

---

## Data Model Implications

### Existing Tables/Types to Extend

- **`weapon_templates`** — Already exists with: name, category, damage_dice, damage_type, properties, range, weight, cost. Matches EPG weapons table well.
  - **Gap:** No `damage_type_secondary` for dual-type weapons (Bladed Hurley: Slashing/Bludgeoning, Billhook: Slashing/Piercing, Warpick: Piercing/Bludgeoning)
  - **Gap:** Missing Elros-specific weapons: Bladed Hurley, Billhook (not in standard 5e)
  - **Action needed:** Verify weapon_templates seed data against EPG list; add missing weapons

- **`materials`** — Already exists with: name, tier, damage_bonus, attack_bonus, ac_bonus, properties (JSON), cost_multiplier.
  - **Gap:** No `deteriorate_range` (which natural rolls cause deterioration)
  - **Gap:** No `deteriorate_threshold` (how many deterioration points before degrading)
  - **Gap:** No `gp_modifier_for_smithing` (separate from cost_multiplier)
  - **Gap:** No `attributes_text` (the special combat properties like "overcomes Fey resistance")
  - **Gap:** Vital Alloys not represented — need `vital_mineral_id` reference
  - **Action needed:** Add deterioration fields, expand properties, seed Vital Alloys

- **`character_weapons`** — Already has: material, material_id, template_id, properties, is_magical.
  - **Gap:** No `make` field (Master/Artisan/Standard/Dusted/Busted/Broke)
  - **Gap:** No `deterioration_points` (current accumulation toward next degradation)
  - **Gap:** No `is_honed` (short rest buffer)
  - **Action needed:** Add make, deterioration_points, is_honed columns

- **`armor_slots`** — Already exists with 12 slots, has columns for each weight class (light_available, light_piece_name, light_bonus, etc.)
  - **Analysis:** The existing 12 slots likely map to the 12 heavy armor pieces from MM2. Light (6 pieces) and Medium (6 pieces) use a subset.
  - **Key alignment:** This may already partially match MM2's structure. Need to verify slot_key values and bonus values against MM2 table.
  - **Action needed:** Verify existing seed data matches MM2; adjust if needed

- **`character_armor`** — Already has: slot_id, armor_type, material, is_magical, properties.
  - **Gap:** No `condition` field (normal/rended/broken)
  - **Action needed:** Add condition column (enum: 'normal', 'rended', 'broken')

### New Entities Needed

- **Vital Minerals reference table** — 14 minerals (Fire, Water, Earth, Air, Salt, Lead, Sulfur, Mercury, Frost, Lightning, Living Water, Black Sulfur, Lucid, Quintessence) with: name, type (cardinal/complex), elements array, description. (See archemancy-spec for full details.)

- **Shield types reference table** — 5 shield types with: name, material, ac_bonus, str_requirement, reparable, paintable, price, weight. (Or extend weapon_templates with a 'shield' category.)

- **Projectile types reference table** — Arrow/bolt variants with: name, effect description, cost_per_20.

### New Properties on Existing Entities

- **`character_weapons.make`** — Enum: master, artisan, standard, dusted, busted, broke
- **`character_weapons.deterioration_points`** — Integer, current points toward next degradation
- **`character_weapons.is_honed`** — Boolean, provides +1 deterioration point buffer
- **`character_armor.condition`** — Enum: normal, rended, broken

---

## UI Components Needed

- **Weapon details panel:** Show make tier, material properties, deterioration status, honing state
- **Armor condition indicators:** Visual state for each armor piece (normal/rended/broken) on the existing armor diagram
- **Shield slot:** Separate from armor pieces; shows shield type, material, condition
- **Rest interface:** Short/Long/Hiatus buttons with hit dice roller, armor repair options, weapon honing
- **Weapon honing toggle:** Short rest activity to apply/show honing buffer

---

## Dependencies on Existing Systems

- **`src/lib/types.ts`:** CharacterWeapon needs make, deterioration_points, is_honed; CharacterArmorPiece needs condition
- **`src/lib/constants.ts`:** May need WEAPON_MAKE_TIERS, SHIELD_TYPES, PROJECTILE_TYPES constants
- **`src/lib/database.types.ts`:** Will need regeneration after schema changes
- **Character profile page:** Armor diagram already exists; needs condition indicators
- **Character weapons UI:** Already exists; needs make/deterioration display
- **Cross-references:** → archemancy-spec (vital minerals, vital alloys, dull casting), → martial-mastery-spec (lingering injuries cause armor broken state), → vocations-spec (Blacksmith forging uses materials/make, short rest honing)

---

## What Wave 2C Needs to Know

These items affect decisions being made in Wave 2C (current development):

1. **Armor condition states:** The existing armor system should be aware that pieces can become "rended" or "broken" — even if the mechanic isn't implemented yet, the data model should be extensible
2. **Weapon make field:** character_weapons may need a `make` column added; current weapons should default to 'standard'
3. **Materials expansion:** The existing `materials` table will grow significantly with Vital Alloys and missing deterioration fields
4. **Shield as separate entity:** Shields in MM2 are distinct from armor pieces — they aren't armor slots, they're held items with AC bonus

---

## Open Questions

1. **"Recovery skill modifier" (MM2 resting):** MM2 says hit dice add "Recovery skill modifier" instead of CON modifier. What skill is "Recovery"? Is this a new skill, or an existing skill renamed? EPG uses CON modifier. This needs clarification from the game designer.
2. **Unarmored AC formula mismatch:** EPG says unarmored = 10 + DEX. MM2 doesn't address unarmored. Is the 10 + DEX formula still correct under the MM2 armor system?
3. **Base AC discrepancy context:** MM2 Heavy armor base AC 0 means ALL AC comes from pieces (max 20). This makes Heavy armor the strongest but most piece-dependent. Is this intentional?
4. **Weapon weight for Billhook (24 lbs) and Pike (18 lbs):** These are extremely heavy. Are these weights intentional or typos?
5. **Dual damage types:** How do Bladed Hurley (Slashing/Bludgeoning), Billhook (Slashing/Piercing), Warpick (Piercing/Bludgeoning) work mechanically? Does the player choose? Does the first listed type apply?
6. **Fomorian Steel "cannot be made anew":** Is this a material that only exists as found loot? Does it have a tier?
7. **Shield as weapon:** EPG lists Shield as a Martial Melee weapon (1d6 Bludgeoning). Does this mean shields can be used offensively while providing AC? How does this interact with the MM2 shield types table?

---

## Conflict Resolution Log

### Armor System
| Topic | EPG Says | MM2 Says | This Spec Uses |
|-------|----------|----------|---------------|
| **Base AC** | 8 + armor bonuses + modifier by weight class | Light=6, Medium=8, Heavy=0; each piece has individual bonus | **MM2** — fundamentally different piece-by-piece system |
| **Armor zones** | 3 zones (Arms, Head & Body, Legs) with flat bonuses per weight | 6/6/12 individual pieces with per-piece bonuses | **MM2** — more granular, each piece tracked individually |
| **Heavy armor STR req** | 13, 15, 17 for 1, 2, 3 heavy pieces | STR 15 (flat) | **MM2** — simpler flat requirement |
| **Heavy armor stealth** | Not explicitly stated per-piece | Disadvantage on Stealth | **MM2** |
| **Rended armor** | Not described | Critical hit → piece loses AC; fixable during rest | **MM2** — new mechanic |
| **Broken armor** | Lingering injury → permanent -1 to nearest piece | Lingering injury → piece broken (must reforge) | **MM2** — more severe (complete loss vs -1) |

### Resting System
| Topic | EPG Says | MM2 Says | This Spec Uses |
|-------|----------|----------|---------------|
| **Short Rest hit dice** | 2 × proficiency bonus (same) | 2 × proficiency bonus (same) | Both agree |
| **Hit dice modifier** | Add CON modifier | Add "Recovery skill modifier" | **MM2** — but flagged as Open Question |
| **Long Rest recovery** | Recover half hit dice, then roll with CON mod | Recover half hit dice, then roll with Recovery modifier | **MM2** — same Open Question |
| **Hiatus benefits** | Same as MM2 | Regain all + prof bonus hit dice, all HP, temp HP, disease advantage, exhaustion recovery | Both agree |
| **Hiatus lingering injury healing** | Medicine (WIS) Long Test, CON save Long Test | Recovery Long Test (no skill specified), Medicine Long Test, CON save Long Test | **MM2** — adds "Recovery Long Test" option |

### Existing Schema Alignment
| Existing | MM2 | Alignment |
|----------|-----|-----------|
| `armor_slots` has 12 rows | Heavy has 12 pieces, Light has 6, Medium has 6 | **Likely aligned** — existing 12 slots probably represent all possible heavy armor slots, with light/medium using subsets via `light_available`, `medium_available` flags |
| `armor_slots` has `slot_key` | MM2 names: Helm, Gorget, Breastplate, Pauldrons, Gauntlets, Tasset, Poleyns, Greives | **Needs verification** — check if existing slot_key values match MM2 piece names |
| `character_armor` lacks condition | MM2 has normal/rended/broken states | **Gap** — needs condition column |
| `character_weapons` lacks make | MM2 has 6 make tiers | **Gap** — needs make column |
| `materials` lacks deterioration | MM2 has deteriorate conditions per material | **Gap** — needs deterioration fields |

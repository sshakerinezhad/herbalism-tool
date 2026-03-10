# Vocations Specification

## Source Documents
- **Primary (authoritative):** `improvements/Elros_Players_Guide.md` (lines 74-738) -- all 7 vocations. EPG is the sole source for vocation mechanics.
- **Existing code:** `src/lib/constants.ts` (VOCATIONS constant, lines 265-273), `src/lib/types.ts` (Vocation type, line 110)
- **Cross-reference specs:**
  - `improvements/specs/shared-systems-spec.md` -- Weapons table, materials, weapon make, GP modifiers for smithing, Long Tests, resting/downtime
  - `improvements/specs/archemancy-spec.md` -- Vital minerals, Dull Casting, creature essence extraction, vocation integrations
  - `improvements/specs/martial-mastery-spec.md` -- Weapon make tiers, lingering injuries (Blacksmith repairs broken armor/weapons)
  - `improvements/specs/spellcasting-spec.md` -- Wizard mana/KP system, spell scrolls (Spellscribe interaction)

## Overview

Vocations are an optional character feature selected at 1st level, granting specialized crafting, knowledge, or ritual abilities. Each character may have only one vocation (or a feat instead). Vocations provide downtime activities, unique proficiencies, and access to crafting systems that produce consumable items, equipment, or information for the party. All 7 vocations are: Alchemist, Blacksmith, Herbalist, Priest/Priestess, Runeseeker, Scholar, and Spellscribe.

---

## Core Mechanics

### 1. The Alchemist

- **What it does:** Brews potions from the archemantic essences (organs) of slain creatures. Potions are powerful consumables tied to creature type and CR.
- **Prerequisites:** Must possess Alchemy Supplies, 30 gallons of fresh water, a potion bottle, and the correct creature essences matching the recipe.
- **Proficiencies:** Proficient in Alchemy Supplies checks (INT-based).
- **Core Mechanic:** Potion brewing via a Long Test over the recipe's listed duration. The Alchemist makes an Alchemy Supplies check (INT) against the recipe's Brewing DC. On failure, roll on the Failed Alchemy Table (d12).
- **Progression:** Access to more recipes as creature essences of higher CR are obtained. No explicit level-gated progression in the EPG.
- **Downtime Activities:** Brew potions (Long Test over recipe duration, typically 4+ hours).
- **Dependencies:** -> archemancy-spec (vital minerals can substitute for creature essences to meet type requirements, but do NOT contribute CR value; creature essences of CR 3+ can be distilled into vital minerals); -> shared-systems-spec (Long Tests).

#### Recipe Structure

Each potion recipe specifies:
- **Potion Name** -- the resulting item
- **Component Types** -- which creature essence types are required (e.g., Aberration Bile, Beast Heart)
- **CR Total Required** -- the minimum sum of creature CRs whose essences are included
- **Brewing Time** -- duration of the Long Test
- **Brewing DC** -- the DC for the Alchemy Supplies (INT) check

One essence type per potion may be substituted with a Shapechanger essence.

#### Failed Alchemy Table (d12)

| Roll | Outcome |
|------|---------|
| 1-3 | Nothing happens; the potion is inert and useless |
| 4-6 | A Wild Magic Surge occurs centered on the potion |
| 7-12 | The potion becomes a Black Pudding and spills out of the bottle |

#### Creature Essences Table

| Creature Type | Essence Name | Essences per Creature |
|---------------|-------------|----------------------|
| Aberration | Bile | Half the CR of the creature |
| Beast | Heart | 1 |
| Celestial | Blood | 1 |
| Dragon | Heart | 1 |
| Elemental | Dragon's Breath Gland | 1 |
| Elemental (alt) | Magic Seal* | 1 |
| Fey | Eyes | 2 |
| Fiend | Magic Seal* | 1 |
| Giant | Thumbs | Up to 2 |
| Monstrosity | Liver | 1 |
| Ooze | Slime | Half the CR of the creature |
| Plant | Root | 1 |
| Plant (alt) | Magic Seal* | 1 |
| Shapechanger | Tongue | 1 |
| Somni | Star | 1 |
| Corporeal Undead | Jaw | 1 |
| Incorporeal Undead | Magic Seal* | 1 |

*Magic Seal is a ritual spell used to bind the essence of certain creatures. Spell description found in EPG pg. 57. The Priest/Priestess vocation also has access to Magic Seal.

---

### 2. The Blacksmith

- **What it does:** Forges weapons from raw materials, progressing through a forging table to determine the weapon's quality (make).
- **Prerequisites:** Sufficient raw material (by weight, from Weapons Table) in the desired material. Access to an active forge.
- **Proficiencies:** Proficient in Smithing Tools checks (DEX-based).
- **Core Mechanic:** GP Target calculation and the Forging Table. The Blacksmith multiplies the weapon's base cost by the material's "GP Modifier For Smithing" to determine the GP Target. Forging is a 4-hour Long Test using Smithing Tools (DEX), where each check's result determines progress on the Forging Table.
- **Progression:** Weapon quality (make) is determined by final position on the Forging Table. Master Forged is achievable only via a natural 20 on the final check while in Artisan Flow.
- **Downtime Activities:** Forge weapons (4-hour Long Test sessions). Can forge twice per day; additional attempts cause exhaustion.
- **Dependencies:** -> shared-systems-spec (weapon materials, GP modifiers, weapon make tiers, weapon cost/weight); -> archemancy-spec (vital alloys created by adding vital mineral shards during forging, Demiurgic tools from Lucid shards); -> martial-mastery-spec (weapon make determines combat bonuses/penalties, Blacksmith reforges to fix degraded make, repairs broken armor from lingering injuries).

#### GP Target Calculation

1. Look up weapon base cost from the Weapons Table (shared-systems-spec)
2. Look up material's "GP Modifier For Smithing" from the Materials Table (shared-systems-spec)
3. GP Target = weapon base cost x GP Modifier For Smithing
4. This total represents the total labor (in GP of progress) required to complete the weapon

#### Forging Table

The Blacksmith starts at "Keeping Pace" and moves left or right based on roll results:

| Column | Make Result | GP Progress |
|--------|------------|-------------|
| Failure | Dusted | 0 GP |
| Critical Error | X (destroyed) | 2 GP |
| Delayed Pace | Standard | 2 GP |
| Keeping Pace | Standard | 5 GP |
| Accelerated Pace | Standard | 8 GP |
| Exceptional Pace | Standard | 10 GP |
| Artisan Flow | Artisan | 15 GP |

**Movement rules:**
- Roll 15-20: remain in Keeping Pace (or stay in current column), progress the listed GP
- Roll 14 or below: move one column to the left
- Roll above 20: move one column to the right
- Natural 1: move 3 columns to the left
- Natural 20: move 3 columns to the right

**Make determination:**
- The weapon's make is determined by the column the Blacksmith finishes in (listed in the second row of the table)
- **Master Forged exception:** Only achieved if the Blacksmith rolls a Natural 20 on the final check while already in the Artisan Flow column
- The weapon's position on the table is retained between forging sessions

**Exhaustion:** After forging twice in a day, any additional attempts incur exhaustion.

---

### 3. The Herbalist

- **What it does:** Forages for plants in the wild and brews elixirs from their elemental essences. Elixirs are minor consumables with customizable effects based on ingredient element combinations.
- **Prerequisites:** Must possess Herbalism Supplies (implied). Must have access to foraged plant ingredients.
- **Proficiencies:** Proficient in Herbalism checks (WIS-based).
- **Core Mechanic:** Brewing is a 4-hour Long Test using a Herbalism check (WIS). The DC equals 6 + (2 x number of ingredients included). Each ingredient contributes its element(s) to produce effects from the Elixir Effects Table.
- **Progression:** No explicit level-gated progression. Access to rarer herbs in more dangerous biomes expands available combinations.
- **Downtime Activities:** Forage for plants (see EPG foraging rules, pg. 55); brew elixirs (4-hour Long Test).
- **Dependencies:** -> archemancy-spec (vital minerals can serve as herbalism ingredients; compound minerals contribute multiple elements, lowering effective DC; cardinal minerals substitute directly for plant essences).

#### Brewing DC Formula

DC = 6 + (2 x number of ingredients)

Examples:
- 2 ingredients: DC 10
- 3 ingredients: DC 12
- 4 ingredients: DC 14
- 5 ingredients: DC 16
- 6 ingredients: DC 18

#### Elixir Effects Table

Each effect requires a pair of elements. The notation [Bomb], [Balm], or [Elixir] indicates the activation method:
- **Bomb:** Thrown or smashed (simple weapon STR/DEX attack roll)
- **Balm:** Applied to a surface
- **Elixir:** Drunk

Save DC for forced saving throws = 8 + WIS modifier + proficiency bonus.

| Element Pair | Type | Effect |
|-------------|------|--------|
| Water + Water | Elixir | Heals 1d4 + 1 |
| Fire + Fire | Bomb | Deals 1d4 fire damage on contact |
| Air + Air | Bomb | Deals 1d4 lightning damage on contact |
| Earth + Earth | Bomb | 1d4 piercing damage to all in 5ft radius (DEX save) |
| Light + Light | Elixir | Antitoxin; reaction to reroll a saving throw against poison |
| Dark + Dark | Balm | Apply creature essence; weapon acts as + against that type for 4 hours |
| Fire + Earth | Bomb | Deals 1d4 acid damage on contact |
| Fire + Light | Bomb | Deals 1d6 radiant damage on contact |
| Fire + Dark | Bomb | Deals 1d6 necrotic damage on contact |
| Fire + Air | Bomb | Deals 1d4 force damage on contact |
| Water + Air | Elixir | Breathe without oxygen for 1 minute |
| Water + Fire | Bomb | Dense fog in 15ft sphere, blocks vision for 1d4 turns |
| Water + Earth | Bomb | 1d4 cold damage to all in 5ft radius (DEX save) |
| Water + Light | Bomb | Slippery oil in 10ft radius; creatures moving through must DEX save or fall prone |
| Water + Dark | Bomb | 1d4 poison damage on contact; CON save or poisoned for 1 round |
| Air + Light | Bomb | Bright light in 10ft sphere; DEX save or blinded for 2 rounds |
| Air + Dark | Bomb | 1d4 thunder damage to all in 10ft; CON save or deafened 1d4 rounds |
| Air + Earth | Bomb | 1d4 magical bludgeoning damage on contact |
| Earth + Light | Elixir | Resistance to bludgeoning, piercing, or slashing for 1 minute (chosen at creation) |
| Earth + Dark | Elixir | Resistance to cold, fire, or lightning for 1 minute (chosen at creation) |
| Light + Dark | Balm | Magic Gloss; spread onto shield to reflect magic (see EPG pg. 54) |

**Note on element naming:** The EPG uses "Light" and "Dark" for the 5th and 6th elements. The app currently uses "positive" and "negative" internally. See archemancy-spec Open Question #2 for the naming mismatch.

#### Herbalist Gap Analysis (App vs. EPG)

**What the app already implements:**

| Feature | App Status | EPG Alignment |
|---------|-----------|---------------|
| Foraging system (biome selection, nature/survival check, herb discovery) | Implemented | Matches EPG foraging rules (biome-based, DC 13 check) |
| Herb inventory per character | Implemented | Aligned -- herbs stored per character_id |
| Brewing system (element matching, effects) | Implemented | See DC comparison below |
| Recipe book (known recipes, secret recipes with unlock codes) | Implemented | **App extension** -- EPG has no concept of "secret recipes" or "unlock codes" |
| Brew types: elixir, bomb, oil | Implemented | EPG has elixir, bomb, balm (not "oil") -- see naming note below |
| Element system | Implemented (6 elements) | Matches EPG's 6 elements (Fire, Water, Earth, Air, Light, Dark) |
| Herb rarity tiers | Implemented (common through preternatural) | Aligned |
| Max herbs per brew: 6 | Implemented | Not explicitly stated in EPG; reasonable cap |

**DC formula discrepancy:**

| | Formula | DC for 2 herbs | DC for 3 herbs | DC for 4 herbs |
|--|---------|---------------|---------------|---------------|
| **EPG** | 6 + (2 x ingredients) | 10 | 12 | 14 |
| **App** | Flat DC 15 | 15 | 15 | 15 |

The app uses a **flat BREWING_DC of 15** (defined in `src/lib/constants.ts` line 108), while the EPG uses a **scaling formula** of 6 + (2 x number of ingredients). This is a significant divergence:
- For 2-4 ingredients, the app is harder than the EPG
- For 5 ingredients, the app matches the EPG (DC 16 vs 15)
- For 6 ingredients, the EPG is harder (DC 18 vs 15)

**Naming discrepancy: "Oil" vs "Balm":**
- The app uses `RECIPE_TYPES = ['elixir', 'bomb', 'oil']` (constants.ts line 116)
- The EPG uses "elixir", "bomb", and "balm" -- not "oil"
- These appear to describe the same activation method (applied to a surface)

**Features in the EPG that the app does NOT implement:**
1. The 4-hour Long Test for brewing -- the app does a single check roll, not a sustained multi-roll Long Test
2. Ingredient-to-effect pairing logic where "each ingredient can contribute to producing only one effect" with one other ingredient -- the app may handle this differently
3. The explicit save DC formula for bomb effects (8 + WIS + proficiency bonus)
4. Multiple effects per elixir -- the EPG says if many ingredients are included, one elixir can carry multiple effects

**Features the app has that the EPG does NOT mention:**
1. Secret recipes with unlock codes
2. The "oil" type (EPG uses "balm")
3. Biome-specific herb weighting tables (EPG references foraging but the app's granular biome-herb-weight system is an implementation detail)
4. Recipe text and lore fields

---

### 4. The Priest & The Priestess

- **What it does:** Provides divine blessings during rest and access to holy ritual spells. A support-oriented vocation focused on party buffs and information gathering.
- **Prerequisites:** Devotion to a deity of the realm (narrative).
- **Proficiencies:** Proficient in Religion checks. If already proficient, gains Expertise instead.
- **Core Mechanic:** Two features: Blessing of the Pious (short rest party buff) and Holy Rituals (daily ritual casting).
- **Progression:** Ritual uses per day scale with proficiency bonus (which increases with level).
- **Downtime Activities:** Pray with party during short rest (Blessing of the Pious); perform holy rituals.
- **Dependencies:** Mostly standalone (divine mechanics). Magic Seal ritual connects to creature essence extraction (used by Alchemist and Scholar). -> shared-systems-spec (short rest timing).

#### Blessing of the Pious

During a short rest, the Priest/Priestess prays with the party, granting ALL party members one of the following boons (Priest/Priestess's choice):

1. **Temporary HP:** Each party member rolls their hit dice and adds the Priest/Priestess's WIS modifier, gaining the total as temporary hit points
2. **Inspiration:** Each party member gains a d8 inspiration die that expires upon use or their next rest

#### Holy Rituals

The Priest/Priestess has access to 7 rituals (castable a number of times per day equal to their proficiency bonus):

| Ritual | Material Component Changes |
|--------|---------------------------|
| Ceremony | Reduced to 10 GP worth of powdered silver |
| Create or Destroy Water | Standard |
| Divination | Standard |
| Exorcism | Standard |
| Fire Truth | Any candle is useable (loosened component) |
| Magic Seal | Some vessel required, but powdered silver NOT required. Targets have disadvantage on their saving throw |
| Speak With Dead | Standard |

**Ritual Save DC** = 8 + WIS or CHA modifier + proficiency bonus

---

### 5. The Runeseeker

- **What it does:** Grants proficiency in Giant language and Masonry Tools, an extra attunement slot for runestones, and the ability to create runestones via the Runic Ignition ritual.
- **Prerequisites:** None specified beyond selecting the vocation.
- **Proficiencies:** Proficient in Giant (language) and Masonry Tools.
- **Core Mechanic:** Additional attunement slot usable for 1 Greater Runestone or 3 Minor Runestones. Runeseekers unlock Rune Mastery Powers of Lesser Runestones and complex properties of Greater Runestones. The Runic Ignition ritual allows creation of custom runestones.
- **Progression:** Rune Powers unlock at level thresholds (e.g., 4th level minimum for Rune Power, 8th level minimum for Rune Mastery Power on the sample Wunjo rune).
- **Downtime Activities:** Runic Ignition ritual (create runestones); study and attune to found runestones.
- **Dependencies:** -> archemancy-spec (Quintessence vital mineral can be crushed into Synthetic Empyrean Dust, which serves as the material component for the Runic Ignition ritual).

#### Sample Runestone: Wunjo (Lesser, requires attunement)

Theme: Happiness and joy

| Feature | Level Req. | Effect |
|---------|-----------|--------|
| Rune Bonus | -- | 20% chance to retain Inspiration after use (for one additional use, no more) |
| Rune Power | 4th level | Trace wunjo on ground/boulder as 1 action; acts as Animal Friendship spell for 24 hours |
| Rune Mastery Power | 8th level | 1 action to sketch wunjo on a held object; allies within 120ft get advantage on saves against fear, charm, or domination. Concentration, up to 10 minutes |

**Note:** The EPG only provides this one sample runestone. A full runestone reference table would need to be sourced from the game designer or supplemental materials.

---

### 6. The Scholar

- **What it does:** Excels at gathering knowledge -- learning languages, extracting information from foraged plants, and studying creatures to learn their statistics and weaknesses.
- **Prerequisites:** None specified beyond selecting the vocation.
- **Proficiencies:** Expertise in any Intelligence-based skill of the Scholar's choice.
- **Core Mechanic:** Three distinct sub-systems: Language Learning, Foraging Information, and Dreadful-spesimen-ology (creature study).
- **Progression:** Monstrous Familiarity grants Ranger's Favored Enemy after studying 10 species of the same creature type.
- **Downtime Activities:** Study languages during short rest (Long Test); study creatures (1 minute sight / 1 hour essence or lair).
- **Dependencies:** -> archemancy-spec (creature essences consumed when used for Dreadful-spesimen-ology study); -> shared-systems-spec (Short rest for language study).

#### Language Learning ("Sprechen Sie Everything?")

- **When:** During a short rest
- **Mechanic:** Intelligence check Long Test
- **DC:** 15 for common languages, 20 for exotic languages
- **Successes required:** 15 for common languages, 25 for exotic languages
- **Source material required:** A book in the language with translation means, or an ally willing to teach

#### Foraging Information ("Do these leaves look a little green to you?")

When a Scholar forages for plants, the elemental essences of found plants reveal regional information:

| Element | Information Revealed |
|---------|---------------------|
| Fire | Presence and direction of humanoids within 6 miles |
| Air | Upcoming weather events over 24 hours |
| Earth | Presence and direction of large natural features within 6 miles |
| Water | Presence and direction of a body of water within 6 miles |
| Light | Presence and direction of magic on the land within 6 miles |
| Dark | Presence and direction of unnatural predators within 6 miles |

#### Dreadful-spesimen-ology (Creature Study)

**Study methods:**
- **Sight (1 minute):** Observe a creature within 60ft, outside combat (greater range with ocular equipment)
- **Essence/Lair (1 hour):** Study a creature's essence (which is consumed) or its lair

**Check:** Investigation check, DC = CR of the creature

**On success:** Learn a number of pieces of information equal to the Scholar's Intelligence bonus, chosen from:
1. Species name and type(s)
2. AC of the creature
3. Immunity, resistance, or vulnerability to two damage types of Scholar's choice (selectable multiple times)
4. Condition immunities
5. Whether the creature can communicate with language
6. Whether the creature can cast spells
7. Expertise on Survival checks to track this creature in the future

#### Monstrous Familiarity

After successfully completing Dreadful-spesimen-ology on **10 different species** within the same creature type (e.g., 10 different sorts of Fey), the Scholar gains the Ranger feature "Favored Enemy" for that creature type.

**Exception:** Does not apply to Shapechangers (due to their definitional diversity).

---

### 7. The Spellscribe

- **What it does:** Gains enhanced ritual casting ability (any class, any mental ability score, learn during short rest) and the ability to craft spell scrolls at an expedited rate.
- **Prerequisites:** None specified beyond selecting the vocation. Must obtain a spell copy or have an ally cast the spell to begin scroll crafting.
- **Proficiencies:** Proficient in Arcana (INT) checks for scroll crafting.
- **Core Mechanic:** Scrollcraft -- 4-hour block Long Check using Arcana (INT), DC = 10 + spell level. Beat DC = 1 block progress; beat DC by 10 = 2 blocks progress. Blocks measure time and material investment per the Scrollcraft Table.
- **Progression:** Second-Hand Scribe reduces crafting time for repeat scrolls. Access to higher-level spells expands scroll options.
- **Downtime Activities:** Craft spell scrolls (4-hour blocks); learn ritual spells during short rest (Enhanced Ritual Casting).
- **Dependencies:** -> archemancy-spec (Lucid vital mineral crushed into Piquant Ink reduces scroll crafting blocks; reduction equals blocks required for a spell one level lower, minimum 1 block; does NOT stack with Second-Hand Scribe); -> spellcasting-spec (spells as source material; Wizards can harvest spell scroll blueprints for KP instead of copying them).

#### Enhanced Ritual Casting

- Gains benefits of the Ritual Caster feat from the PHB
- **Not** limited to rituals of any one class
- **Not** limited by the level of rituals they can learn (though starts with level-appropriate spells)
- Can pick **any mental ability score** (INT, WIS, or CHA) as spellcasting ability for this vocation
- Can learn ritual spells found on adventures over the course of a **short rest**

#### Scrollcraft

**Process:**
1. Obtain a copy of the spell or have an ally willing to cast it
2. Work in 4-hour blocks, making an Arcana (INT) Long Check each block
3. DC = 10 + spell level. Spellscribe has proficiency in this check.
4. Beat DC: 1 block of progress
5. Beat DC by 10 (DC 20 + spell level): 2 blocks of progress
6. If a block is attempted but left unfinished, the rare ink is consumed but no progress is made

**Exhaustion:** 2 blocks per long rest without penalty. Each additional block incurs a point of exhaustion at the start of the block.

#### Scrollcraft Table

| Spell Level | Blocks Required | Gold Cost |
|-------------|----------------|-----------|
| Cantrip (0) | 1 block | 15 GP |
| 1st | 1 block | 20 GP |
| 2nd | 3 blocks | 10 GP + 20 GP per block |
| 3rd | 7 blocks | 10 GP + 30 GP per block |
| 4th | 14 blocks | 10 GP + 40 GP per block |
| 5th | 24 blocks | 10 GP + 50 GP per block |
| 6th | 48 blocks | 10 GP + 60 GP per block |
| 7th | 112 blocks | 10 GP + 70 GP per block |
| 8th | 224 blocks | 10 GP + 80 GP per block |
| 9th | 336 blocks | 10 GP + 90 GP per block |

#### Second-Hand Scribe

When crafting a scroll of a spell the Spellscribe has **already created before**, reduce the blocks required by the number of blocks required for a spell one level lower (minimum 1 block).

Examples:
- 3rd-level scroll (7 blocks), already crafted before: reduce by 3 (2nd-level blocks) = 4 blocks
- 2nd-level scroll (3 blocks), already crafted before: reduce by 1 (1st-level blocks) = 2 blocks
- 1st-level scroll (1 block), already crafted before: reduce by 1 (cantrip blocks) = minimum 1 block

**Note:** Piquant Ink (from Lucid vital mineral, archemancy-spec) provides the same reduction but does NOT stack with Second-Hand Scribe.

#### Spell Scroll Usage

Any character can attempt to use a spell scroll:
- **Check:** Arcana check, DC = spell level + 10
- **On failure:** GM rolls on the Spell Scroll Mishap Table and the scroll is destroyed

#### Spell Scroll Mishap Table (d12)

| Roll | Effect |
|------|--------|
| 1-2 | Surge of magical energy deals 1d6 force damage per spell level to the caster |
| 3-4 | Spell affects the caster or a random ally instead of intended target (or random nearby target if caster was intended) |
| 5-6 | Spell affects a random location within range |
| 7-8 | Spell effect is contrary to normal (neither harmful nor beneficial, e.g., fireball produces harmless cold) |
| 9-10 | Caster suffers a minor bizarre effect related to the spell, lasting the spell's duration or 1d10 minutes |
| 11-12 | Spell activates after 1d12 hours; takes effect normally on intended target or in general direction |

---

## Data Model Implications

### New Entities

- **Creature Essences Inventory** -- Per character, tracks harvested creature essences.
  - Properties: character_id, creature_type (string matching the 17 types in the table), essence_name, quantity, total_cr_value (the CR contribution of the stored essences)
  - Relationship: character_id -> characters

- **Potion Recipes Reference** -- Seed data for all alchemist potion recipes.
  - Properties: id, name, rarity, component_types (array of creature types required), cr_total_required, brewing_time, brewing_dc, effect_description
  - Note: Full potion list is on EPG pg. 58 (not included in the lines read for this spec; needs sourcing)

- **Blacksmith Forging State** -- Per character, tracks in-progress weapon forging.
  - Properties: character_id, weapon_template_id, material_id, gp_target, gp_progress, forging_table_position (enum: failure | critical_error | delayed | keeping | accelerated | exceptional | artisan), forges_today (int, for exhaustion tracking)
  - Relationship: character_id -> characters, weapon_template_id -> weapon_templates, material_id -> materials

- **Runestone Inventory** -- Per character, tracks owned/attuned runestones.
  - Properties: character_id, runestone_id (FK to reference), is_attuned, attunement_slot_type (greater | minor)
  - Relationship: character_id -> characters, runestone_id -> runestones reference table

- **Runestones Reference** -- Seed data for all runestones.
  - Properties: id, name, theme, tier (lesser | greater), rune_bonus_description, rune_power_level, rune_power_description, rune_mastery_level, rune_mastery_description
  - Note: Only one sample runestone (Wunjo) is provided in the EPG; full list needs sourcing

- **Scholar Language Progress** -- Per character, tracks language learning Long Test state.
  - Properties: character_id, language_name, language_type (common | exotic), successes_so_far, successes_required (15 or 25), is_completed
  - Relationship: character_id -> characters

- **Scholar Creature Study Log** -- Per character, tracks creatures studied via Dreadful-spesimen-ology.
  - Properties: character_id, creature_name, creature_type, study_successful (bool), info_learned (JSON array of discovered facts)
  - Used for Monstrous Familiarity tracking (count distinct species per type)
  - Relationship: character_id -> characters

- **Spellscribe Scroll Progress** -- Per character, tracks in-progress scroll crafting.
  - Properties: character_id, spell_name, spell_level, blocks_required, blocks_completed, gold_spent, blocks_today (for exhaustion tracking)
  - Relationship: character_id -> characters

- **Spellscribe Known Scrolls** -- Per character, tracks which spell scrolls have been previously completed (for Second-Hand Scribe).
  - Properties: character_id, spell_name, spell_level, times_crafted
  - Relationship: character_id -> characters

- **Spell Scroll Inventory** -- Per character, tracks completed spell scrolls.
  - Properties: character_id, spell_name, spell_level, quantity
  - Relationship: character_id -> characters

- **Priest Ritual Usage** -- Per character, tracks daily ritual usage.
  - Properties: character_id, rituals_used_today (int), max_rituals_per_day (= proficiency bonus)
  - Relationship: character_id -> characters

### New Properties on Existing Entities

- **`characters` table:** `vocation` field already exists (nullable string, type Vocation). No additional columns needed on the characters table itself -- vocation-specific state is tracked in the new related entities above.

### New Reference Data to Seed

- 17 creature essence types (from Creature Essences Table)
- Potion recipes (from EPG pg. 58 -- not in the spec source lines, needs sourcing)
- Runestone definitions (only 1 sample provided; full list needs sourcing)
- 7 Priest/Priestess ritual descriptions (from EPG pg. 56-57)
- Elixir Effects Table (21 element pair combinations -- already partially seeded as recipes in the app)

### Relationships to Existing Tables

- All vocation-specific entities -> `characters` (via character_id FK)
- Blacksmith forging -> `weapon_templates`, `materials` (from shared-systems-spec)
- Creature essences -> (new reference table; also used by Scholar and referenced by archemancy-spec)
- Spell scroll inventory -> spells reference table (from spellcasting-spec)

---

## UI Components Needed

### Pages / Tabs

- **Vocation Hub Page** -- A vocation-specific page/tab on the character sheet that dynamically shows content based on the character's selected vocation. Alternatively, separate pages per vocation.

### Per-Vocation UI

#### Alchemist
- **Creature Essence Inventory** -- Grid showing owned essences by creature type, quantities, and CR values
- **Potion Recipe Browser** -- List of known potion recipes with required components, CR totals, and DCs
- **Brew Potion interface** -- Select essences, verify recipe requirements met, roll Alchemy Supplies check, handle success/failure (including Failed Alchemy Table roll)

#### Blacksmith
- **Forging Calculator** -- Select weapon template + material -> compute GP Target
- **Forging Session tracker** -- Visual representation of Forging Table position, GP progress bar toward target, roll input for each 4-hour block
- **Forge History** -- List of completed and in-progress forgings
- **Daily forge counter** -- Show forges used today and exhaustion warning

#### Herbalist
- **Already implemented:** Forage page, Brew page, Inventory page, Recipes page
- **Potential updates:** Implement scaling DC formula (6 + 2 x ingredients), rename "oil" to "balm" for EPG alignment, support multi-effect elixirs

#### Priest/Priestess
- **Blessing of the Pious interface** -- During short rest, choose between temp HP or inspiration for party
- **Ritual tracker** -- List of 7 available rituals, daily usage counter (max = proficiency bonus), ritual save DC display
- **Ritual descriptions** -- Expandable cards with full ritual text

#### Runeseeker
- **Runestone Inventory** -- List of owned runestones with attunement status
- **Attunement Slot Manager** -- Show the extra attunement slot; toggle between 1 Greater or 3 Minor configuration
- **Runic Ignition interface** -- Ritual to create runestones (requires Synthetic Empyrean Dust from Quintessence)

#### Scholar
- **Language Learning tracker** -- Per-language progress bar showing successes toward proficiency (15/25 needed)
- **Foraging Information display** -- When foraging, show region info based on plant elements found
- **Creature Study log** -- List of studied creatures with learned information
- **Monstrous Familiarity tracker** -- Per creature type, count of distinct species studied (10 needed for Favored Enemy)

#### Spellscribe
- **Scroll Crafting interface** -- Select spell, show blocks required and gold cost, track block-by-block progress with Arcana check rolls
- **Second-Hand Scribe indicator** -- Show reduced block count for previously crafted spells
- **Scroll Inventory** -- List of completed spell scrolls with quantities
- **Enhanced Ritual Casting** -- Ritual spell list (not class-limited), with short rest learning interface
- **Daily block counter** -- Show blocks used today and exhaustion warning

---

## Dependencies on Existing Systems

### Affected Tables / Hooks / Components

- **`src/lib/types.ts`:** The `Vocation` type already exists (line 110). Will need new types for each vocation's entities: `CreatureEssence`, `PotionRecipe`, `ForgingState`, `Runestone`, `LanguageProgress`, `CreatureStudy`, `ScrollProgress`, etc.
- **`src/lib/constants.ts`:** `VOCATIONS` constant already exists (lines 265-273) with name and description for all 7 vocations. Will need additional constants: `CREATURE_ESSENCE_TYPES`, `FORGING_TABLE_COLUMNS`, `SCROLLCRAFT_TABLE`, `PRIEST_RITUALS`.
- **`src/lib/constants.ts`:** `BREWING_DC = 15` (line 108) diverges from EPG formula `6 + 2*ingredients`. This needs to be updated if EPG alignment is desired.
- **`src/lib/constants.ts`:** `RECIPE_TYPES = ['elixir', 'bomb', 'oil']` (line 116) -- "oil" should potentially be renamed to "balm" per EPG terminology.
- **`src/lib/hooks/queries.ts`:** Will need new React Query hooks for all vocation-specific data.
- **`src/app/brew/page.tsx`:** Currently uses flat `BREWING_DC` -- would need update to scaling formula.
- **`src/app/forage/page.tsx`:** Already implemented; may need Scholar foraging information overlay.

### Cross-References to Other Specs

- **-> shared-systems-spec:**
  - Blacksmith uses materials table and GP Modifier For Smithing (section 3)
  - Blacksmith determines weapon make from Forging Table (section 2)
  - All vocations use short rest downtime for light activities (section 6)
  - Long Tests used by Alchemist (brewing), Blacksmith (forging), Herbalist (brewing), Scholar (language learning), Spellscribe (scrollcraft) (section 7)

- **-> archemancy-spec:**
  - Alchemist: vital minerals substitute for creature essence type requirements but not CR (section 5a)
  - Blacksmith: vital mineral shards create vital alloys during forging; Lucid shard creates Demiurgic tools (section 5b)
  - Herbalist: vital minerals serve as herb ingredients with compound minerals contributing multiple elements (section 5c)
  - Runeseeker: Quintessence crushed into Synthetic Empyrean Dust for Runic Ignition (section 5d)
  - Scholar: creature essences consumed during Dreadful-spesimen-ology (section 4, creature essence extraction)
  - Spellscribe: Lucid crushed into Piquant Ink reduces scroll crafting blocks (section 5d)

- **-> martial-mastery-spec:**
  - Blacksmith reforges weapons to fix degraded make (make tiers from section 2)
  - Blacksmith repairs broken armor from lingering injuries (section 5)
  - Short rest honing of weapons (shared-systems-spec section 2)

- **-> spellcasting-spec:**
  - Spellscribe creates spell scrolls; Wizards can harvest scroll blueprints for KP (section 5c)
  - Spellscribe Enhanced Ritual Casting interacts with the spell reference system (section 8, Logician)
  - Scholar may identify spells via creature study or general knowledge

---

## Open Questions

1. **Potion recipes list:** The EPG references potion recipes on pg. 58, which is outside the lines read for this spec (lines 74-738). The full potion recipe list needs to be sourced to seed the potion recipes reference table.

2. **Runestone definitions:** Only one sample runestone (Wunjo) is provided in the EPG. A full list of Lesser and Greater runestones with their Rune Bonus, Rune Power, and Rune Mastery Power effects is needed from the game designer or supplemental materials.

3. **Priest ritual descriptions:** The EPG references spell descriptions on pg. 56-57. Full text for Ceremony, Create/Destroy Water, Divination, Exorcism, Fire Truth, Magic Seal, and Speak With Dead needs sourcing.

4. **Brewing DC alignment:** Should the app's flat `BREWING_DC = 15` be changed to the EPG's scaling formula `6 + 2 * ingredients`? This is a gameplay balance decision that needs user input.

5. **"Oil" vs "Balm" naming:** Should the app rename the "oil" recipe type to "balm" to match EPG terminology? This requires a data migration of existing `character_brewed` records and recipe seed data.

6. **Alchemist CR tracking:** How should creature essence CR values be tracked? Is it per individual essence (e.g., "this Heart came from a CR 5 Beast") or pooled (e.g., "I have 8 CR worth of Beast Hearts")? The EPG says the CR total must match the recipe requirement.

7. **Blacksmith Forging Table movement details:** When the text says "roll 14 or below, move left," does this mean always move exactly one space left? And "roll above 20" means exactly one space right? Natural 1/20 override with 3-space movement. But what about the starting position? The EPG says "start at Keeping Pace" -- does this mean the first check uses Keeping Pace rules regardless of the roll result?

8. **Runeseeker attunement slot:** The Runeseeker gains "an additional attunement slot" for runestones. Is this in addition to the standard 3 attunement slots (making 4 total), or does it replace one?

9. **Scholar Dreadful-spesimen-ology -- creature CR limits:** The Investigation DC equals the creature's CR. For very high CR creatures (e.g., CR 20+), is the DC capped, or can it truly require a 20+ Investigation check?

10. **Spellscribe spell sources:** The Spellscribe needs "a copy of the spell or an ally who is willing to cast the spell." What constitutes a "copy"? A spell scroll? A spellbook? A written description?

11. **Multi-effect elixirs:** The EPG says one elixir can carry multiple effects if many ingredients are included. Each ingredient contributes to only one effect with one other ingredient. Does the app need to support this pairing logic (ingredient A pairs with ingredient B for effect 1, ingredient C pairs with ingredient D for effect 2, all in the same brew)?

12. **Magic Seal ritual cross-vocation access:** The Priest/Priestess has Magic Seal as a ritual. The Alchemist needs Magic Seal to bind essences from Elementals, Fiends, Plants, and Incorporeal Undead. Can a Priest/Priestess who is NOT an Alchemist cast Magic Seal for an Alchemist party member? The EPG implies yes (the ritual just needs to be performed; the essence harvesting is separate).

---

## Conflict Resolution Log

### Brewing DC: App vs. EPG

| Context | App Says | EPG Says | Status |
|---------|----------|----------|--------|
| Brewing difficulty check | Flat DC 15 (`BREWING_DC` in constants.ts) | DC = 6 + (2 x number of ingredients) | **DIVERGENCE** -- App uses a simplified flat DC. EPG uses a scaling formula. Flagged as Open Question #4. |

### Recipe Type Naming: App vs. EPG

| Context | App Says | EPG Says | Status |
|---------|----------|----------|--------|
| Third brew type | "oil" (RECIPE_TYPES in constants.ts) | "balm" | **NAMING MISMATCH** -- Same concept (applied to a surface), different name. Flagged as Open Question #5. |

### Element Naming: App vs. EPG

| Context | App Says | EPG Says | Status |
|---------|----------|----------|--------|
| 5th element | "positive" | "Light" | **MISMATCH** -- Documented in archemancy-spec Open Question #2 |
| 6th element | "negative" | "Dark" | **MISMATCH** -- Documented in archemancy-spec Open Question #2 |

### Herbalist Long Test: App vs. EPG

| Context | App Says | EPG Says | Status |
|---------|----------|----------|--------|
| Brewing process | Single roll check against flat DC | 4-hour Long Test (sustained multi-roll) against scaling DC | **SIMPLIFICATION** -- App simplified to a single roll. EPG specifies a Long Test. This is an implementation tradeoff (single roll is simpler UX but doesn't match EPG's sustained effort mechanic). |

### Existing Vocation Type Alignment

| Code Definition | EPG Definition | Status |
|----------------|----------------|--------|
| `'alchemist'` | The Alchemist | Aligned |
| `'blacksmith'` | The Blacksmith | Aligned |
| `'herbalist'` | The Herbalist | Aligned |
| `'priest'` | The Priest & The Priestess | Aligned (code uses gender-neutral key) |
| `'runeseeker'` | The Runeseeker | Aligned |
| `'scholar'` | The Scholar | Aligned |
| `'spellscribe'` | The Spellscribe | Aligned |

All 7 vocations in the `Vocation` type (src/lib/types.ts line 110) and `VOCATIONS` constant (src/lib/constants.ts lines 265-273) match the EPG definitions.

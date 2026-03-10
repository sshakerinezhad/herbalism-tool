# Spellcasting Expansion Specification

## Source Documents
- **Elros Player's Guide (EPG):** Spellcasting Expansion (lines 1985-2059), Sorcerer Revision (lines 2060-2106), Logician Subclass (lines 2107-2282)
- **Wizard Update (WU):** All 162 lines — Mana & Discipline, Knowledge Points, Arcane Perks, Mana Cost Table, KP Progression Table
- **Shared Systems Spec:** Cross-reference for resting (long rest triggers disciplining) and Dull Casting definition
- **src/lib/types.ts:** Character type (has `class: string`, `level: number`; no existing spell/mana/KP fields)
- **Authoritative on conflicts:** Wizard Update supersedes EPG for all wizard mana and KP mechanics. EPG is authoritative for Sorcerer mechanics and the three class-agnostic Spellcasting Options.

## Overview
The Spellcasting Expansion adds three universal casting options (Emphasized, Exhausted, Eager) available to any spellcaster, a full Sorcerer revision replacing spell slots with a unified Mana pool, a Wizard mana and discipline system where mana and Knowledge Points are earned through ritual practice, and the Logician wizard subclass which manipulates schools of magic through formal logic. Together these systems replace the standard 5e spellcasting resource model with a mana-based economy that differs by class in how mana is acquired and spent.

---

## Core Mechanics

### 1. Emphasized Spellcasting (Class-Agnostic)

- **What it does:** Allows any spellcaster to spend two turns casting a single spell for significantly increased power. The spell is "charged" on turn one and released on turn two.
- **Rules:**
  1. On the first turn, the caster selects a spell, spell level, and expends all components as normal (action). The spell does not take effect.
  2. The caster begins concentrating on the spell. Their speed is halved, and they cannot cast other spells while concentrating this way.
  3. If concentration breaks, the spell is lost (slot and components consumed).
  4. The caster may drop concentration freely at any time (e.g., to cast a reaction/action/bonus action spell on their next turn instead).
  5. The spell **cannot be counterspelled** on the first turn.
  6. Between turns, the spell is visibly being cast. It can be identified via Identify spell or Arcana (INT) check DC = 10 + spell level (bonus action). Dispel Magic attempts during this period are made with disadvantage, and the spell level needed to auto-succeed Dispel Magic is increased by 1.
  7. On the caster's next turn, they use their action to release the spell, choosing target/area of effect.
  8. On release: spell attack rolls are made with **advantage**; targets make saving throws with **disadvantage**; Counterspell checks against the spell are made with **disadvantage**.
  9. For purposes of Counterspell, damage, and all other effects, the spell is treated as if cast at **one level higher** than the slot expended.
- **Inputs/Outputs:**
  - Input: Spell selection, spell slot, components, two consecutive actions
  - Output: Empowered spell effect (advantage on attacks, disadvantage on saves, +1 effective level)

### 2. Exhausted Spellcasting (Class-Agnostic)

- **What it does:** Allows a spellcaster to reuse an already-expended spell slot at the cost of exhaustion.
- **Rules:**
  1. The caster selects a spell using a spell slot (or mana equivalent) they have already expended.
  2. The spell must have a casting time of one action, reaction, or bonus action.
  3. The caster makes a **CON check** with DC = 10 + spell slot level.
  4. **On success:** The spell is cast. The caster gains exhaustion levels equal to **spell level / 2** (rounded down implied by context).
  5. **On failure:** The spell is not cast. The caster gains exhaustion levels equal to **the spell's level**.
  6. All material components are consumed normally regardless of success or failure.
- **Inputs/Outputs:**
  - Input: Expended spell slot, CON check, material components
  - Output: Spell effect (on success) + exhaustion (always)

### 3. Eager Spellcasting (Class-Agnostic)

- **What it does:** Allows a spellcaster to attempt to cast a spell they don't yet have access to — a spell they would learn at a higher level. Extremely risky.
- **Rules:**
  1. The caster selects a spell available to them at a future level in a class they have at least one level in.
  2. They must expend their **highest available spell slot** and all proper material components.
  3. The caster makes an ability check with their **spellcasting ability score** (no advantage, no Portent, no Lucky feat — this roll cannot be altered in any way).
  4. DC = 8 + spell level + (number of class levels needed to access the spell).
  5. **Exception:** Wizards whose subclass is bound to a particular school may add their **proficiency bonus** to the roll if the spell belongs to that school.
  6. **On success:** The spell is cast. The caster gains exhaustion levels equal to **spell level / 2**.
  7. **On failure:** The caster suffers the **Law of Equivalent Exchange**: subtract the spell level from an ability score determined by the spell's school of magic (instant death if it drops to 0), and suffer a random **major curse** also determined by the spell's school.
  8. Specific curse/ability score details are deliberately hidden — must be discovered through in-game research or experimentation.
- **Inputs/Outputs:**
  - Input: Spell selection (future spell), highest spell slot, components, spellcasting ability check
  - Output: Spell effect (on success) or ability score loss + major curse (on failure) + exhaustion (on success)

---

### 4. Sorcerer Revision

#### 4a. Sorcerer Mana

- **What it does:** Replaces spell slots entirely with a single Mana pool that also absorbs Sorcery Points. Sorcerers use one unified resource for spellcasting, Metamagic, and Font of Magic.
- **Rules:**
  1. Sorcerer mana = Spell Points (per DMG variant rules) + Sorcery Points merged into a single pool.
  2. **One-use-per-rest rule:** If a Sorcerer at a particular level typically has only one spell slot of a given level, they can only spend mana to cast a spell of that level once per Long Rest. Example: A level 9 Sorcerer can only cast one 5th-level spell per Long Rest.
  3. Mana costs follow the Mana Cost Table (see Section 7).
- **Inputs/Outputs:**
  - Input: Character level (determines mana total + slot restrictions)
  - Output: Available mana, restricted spell levels

#### 4b. Natural Mages

- **What it does:** Sorcerers cast magic innately without material components or focuses.
- **Rules:**
  1. Sorcerers do not need material components to cast spells **unless a GP amount is listed** for the component.
  2. Sorcerers do not require a casting focus.
- **Inputs/Outputs:**
  - Input: Spell component list
  - Output: Whether the Sorcerer needs the component (only if GP-valued)

#### 4c. Metamagic Changes

- **What it does:** Expands Metamagic access and modifies several options.
- **Rules:**
  1. Sorcerers gain an **additional Metamagic option** whenever they receive a Sorcerous Origin feature (starting at level 6).
  2. At **level 20**, the Sorcerer gains access to **all** Metamagic options.
  3. **Overchannel** (replaces Empowered Spell): Spend sorcery points equal to the spell's level to deal **maximum damage** on the first damage roll. The caster takes **1d6 necrotic damage per spell level** that cannot be reduced or avoided.
  4. **Careful Spell (altered):** Selected creatures take **no damage** from the spell (instead of standard PHB behavior of auto-saving).
  5. **Gratuitous Spellcasting (new):** Reduce a spell's material component GP cost by **20 GP per sorcery point** expended.
  6. **Transmuted Cantrip:** Starting at level 3, if a Sorcerer has Transmuted Spell, they can use it on **Firebolt** for free (no mana cost).

---

### 5. Wizard Mana & Discipline System (Wizard Update — Authoritative)

#### 5a. Base Mana

- **What it does:** Defines how a Wizard's mana pool is initially calculated and how they earn more.
- **Rules:**
  1. A Wizard's spell slots are determined by class level (standard 5e table).
  2. **Base mana** = the total mana cost required to expend all spell slots (calculated using the Mana Cost Table).
  3. Additional mana is earned through the **disciplining** process (see 5b).
  4. Mana determines the **power** of a spell. A Wizard expends a leveled spell slot (minimum level required by the spell's base level) but pours mana to determine the effective casting level.
- **Upcasting with Mana:**
  1. A spell requires a minimum spell slot equal to the spell's base level.
  2. The caster can spend additional mana beyond the base cost to upcast. Example: Witch Bolt (1st level) can be upcast to 2nd level by spending 3 mana (2nd-level cost) while only requiring a 1st-level spell slot.
- **Inputs/Outputs:**
  - Input: Class level (determines spell slots), disciplining results (adds mana)
  - Output: Total mana pool, spell slots available

#### 5b. Disciplining

- **What it does:** A ritual practice performed at the end of a rest where a Wizard restricts spell slots to a specific school or essence in exchange for mana and Knowledge Points.
- **Rules:**
  1. At the end of a rest, a Wizard selects any number of spells and disciplines them, restricting each to one **school of magic** OR one **archemantic essence**.
  2. **Material requirement:** For schools of magic, a **signet ring** of the correct material with the school's sigil. For archemantic essences, a **vital mineral** of that essence.
  3. **Progressive roll-down:** For each spell slot disciplined, the Wizard rolls to get a 1 on progressively smaller dice: d20 → d12 → d10 → d8 → d6 → d4 → automatic success. On success, the sequence resets to d20 for the next slot.
  4. **On success (rolling a 1):** The Wizard gains **Knowledge Points** AND **Mana**, both equal to their **proficiency bonus**.
  5. On failure (not rolling a 1), the die steps down and the Wizard disciplines the next slot.
- **Signet Ring Materials (by school):**

  | School | Ring Material |
  |--------|--------------|
  | Transmutation | Calcified Mercury |
  | Graviturgy | Stone |
  | Conjuration | Gold |
  | Evocation | Brass |
  | Illusion | Silver |
  | Necromancy | Lead |
  | Chronomancy | Mithral |
  | Divination | Platinum |
  | Abjuration | Iron |
  | Enchantment | Fool's Gold |

- **School matching bonus:** If the Wizard disciplines a spell slot for the school of magic that matches their **subclass**, the success threshold is **1-3** (instead of just 1), and they earn **double Knowledge Points** on success.
- **Inputs/Outputs:**
  - Input: Spell slots to discipline, school/essence selection, required materials, d20 roll sequence
  - Output: KP earned (per school or essence), mana earned, disciplined (restricted) spell slots

#### 5c. Knowledge Points (KP)

- **What it does:** Tracks a Wizard's mastery of magic schools and archemantic essences. Spent to learn spells and unlock Arcane Perks.
- **Rules:**
  1. KP is tracked **per school** (10 schools) and **per archemantic essence** (14 essences) = 24 separate KP pools.
  2. **Learning spells:** Costs KP equal to the spell's level in **both** the spell's school AND the spell's archemantic essence. Example: Fireball (3rd level, Evocation school, Fire essence) costs 3 Evocation KP + 3 Fire KP.
  3. **Unlocking Arcane Perks:** 1 KP spent into a school or essence unlocks that Arcane Perk for spells of that school or essence (see Section 6).
  4. **Alternative acquisition:** When a Wizard finds a spell scroll blueprint, they can choose to either copy it into their book OR harvest KP equal to the spell's level, distributed between the spell's school and essence pools.
- **The 10 Schools:**
  Transmutation, Graviturgy, Conjuration, Evocation, Illusion, Necromancy, Chronomancy, Divination, Abjuration, Enchantment
- **The 14 Archemantic Essences:**
  Fire, Water, Earth, Air, Salt, Frost, Lead, Mercury, Lightning, Sulfur, Black Sulfur, Living Water, Lucid, Quintessence
- **Inputs/Outputs:**
  - Input: Disciplining results, spell scroll harvesting choices
  - Output: KP balances per school/essence, spells learned, perks unlocked

#### KP Progression Table Structure

The KP Progression Table is a grid with:
- **Rows:** 10 schools + 14 essences = 24 rows
- **Columns:** KP balance + 10 Arcane Perk unlock checkboxes (one per perk)

Each cell in the perk columns is a checkbox indicating whether that perk has been unlocked for that school/essence. KP balance is a running total.

---

### 6. Arcane Perks (Wizard Metamagic via Mana)

- **What it does:** Metamagic-like abilities available to Wizards, unlocked by spending KP and activated by spending mana.
- **Rules:**
  1. Unlock requirement: Spend **1 KP** in a school or essence to unlock that perk for that school/essence.
  2. Mana cost to use: **spell effect level × metamagic modifier (MM)**. Cantrips count as spell level 0 (so cost = 0 × MM = 0 unless noted otherwise).
  3. Each perk is available per-school and per-essence independently.

#### Arcane Perks Table

| Perk | MM | Effect |
|------|-----|--------|
| **Careful Spell** | 2 | Choose creatures up to spellcasting modifier (min 1). Those creatures auto-succeed on save and take no damage from the spell. |
| **Distant Spell** | 2 | Range 5ft+ → double range. Touch → 30ft range. |
| **Extended Spell** | 3 | Duration 1 min+ → double duration (max 24 hours). |
| **Heightened Spell** | 3 | One target has disadvantage on its first saving throw against the spell. |
| **Quickened Spell** | 3 | Casting time of 1 action → 1 bonus action. |
| **Seeking Spell** | 2 | On a missed spell attack roll, reroll the d20 (must use new roll). |
| **Subtle Spell** | 3 | Cast without somatic or verbal components. |
| **Transmuted Spell** | 1.5 | Change damage type to another in: acid, cold, fire, lightning, poison, thunder. |
| **Twinned Spell** | 2 | Single-target spell (not self-range) → target a second creature in range. Cantrip cost = 2 mana. Spell must be incapable of targeting multiple creatures at current level. |
| **Overchannel** | 3 (Special) | Deal maximum damage on first damage roll. Take 1d6 necrotic per spell effect level (cannot be reduced/avoided). |

- **Inputs/Outputs:**
  - Input: KP spent (to unlock), mana spent (to activate), spell being cast
  - Output: Metamagic effect applied to spell

---

### 7. Mana Cost Table (Wizard Update — Authoritative)

| Spell Level | Mana Cost |
|-------------|-----------|
| 1st | 1 |
| 2nd | 3 |
| 3rd | 7 |
| 4th | 13 |
| 5th | 20 |
| 6th | 29 |
| 7th | 39 |
| 8th | 51 |
| 9th | 64 |

This table is used by both Wizards and Sorcerers to determine mana expenditure for a given spell level effect. Sorcerers use it directly (their mana replaces spell slots). Wizards use it to determine upcast costs and base mana calculation.

---

### 8. The Logician (Wizard Subclass)

- **What it does:** A wizard subclass that manipulates the logical relationships between schools of magic. By deriving schools from observed magical effects, the Logician can cast unknown spells, negate hostile magic, and even create anti-magic zones.

#### 2nd Level — Strings & Derivations (Basics of the First Order)

- **Rules:**
  1. When the Logician is aware of a magical effect of an identifiable school within **30 feet**, they may use a **bonus action** to begin concentrating on a **String** (as if concentrating on a spell).
  2. **Dual concentration:** The Logician can concentrate on both a String and a spell simultaneously. On a failed concentration check while holding both, they may choose to drop only the spell (keeping the String).
  3. The triggering effect must have a duration longer than "Instantaneous" and be active on the Logician's turn.
  4. A String is a series of lines (Derivations), each naming a school of magic.
  5. The first line is always the school of the triggering magical effect.
  6. Successive lines are added via bonus actions (introducing observed effects or manipulating existing Derivations).
  7. A Derivation remains on the String even if its source effect ends or leaves range.
  8. String duration: **up to 1 minute** (doubles at 10th level).
  9. Uses per rest: **proficiency bonus** times, regained on short or long rest.
  10. When concentration on the String ends, all Derivations are lost.
  11. **Casting from Derivations:** If a school of magic has been derived, the Logician can use an **action** to cast any Wizard spell of that school, provided: the spell has a casting time of one action, they expend the relevant spell slot and components, and the spell need not be known/prepared.

#### 2nd Level — Mana Ponens

- **Rules:**
  1. While concentrating on a String, the Logician can use a **bonus action** to perform a Mana Ponens.
  2. Mana Ponens derives the school **downstream** (counterclockwise / red arrows) from an existing Derivation on the Logician's Circle.
  3. Example: Nc (Necromancy) → derives Ch (Chronomancy).

#### 2nd Level — Conjunction

- **Rules:**
  1. The Logician can use a **bonus action** to perform a Conjunction, creating a Derivation that combines two schools on one line.
  2. Typically this has no immediate effect (but gains significance at higher levels).
  3. **Danger:** If the two schools hold **contradictory energy** (opposing pairs on the Circle, shown by blue arrows), the Conjunction creates a **contradiction** and triggers a **wild magic surge** centered on the Logician.

#### 6th Level — Negation

- **Rules:**
  1. The Logician can use a **bonus action** to derive a **Negation** from an existing Derivation.
  2. Using the opposing school pairs (blue arrows), the Logician writes a new line that is the opposing school, negated (prefixed with ~). Example: Co (Conjuration) → derives ~Dv (~Divination), because Conjuration and Divination are opposed.
  3. **Using a Negation (reaction):** The Logician targets a spell effect within **60 feet** (at least part of the effect must be in range) and rolls an **Arcana (INT) check**, adding the **number of Derivations** on their current String as a bonus, against the caster's **spell save DC**.
  4. **On success:** The Logician ignores all effects of the targeted spell (though they are still aware of them).
  5. **On failure:** The Negation contacts the spell itself, causing a **wild magic surge** centered on the Logician.
  6. Negated terms can be manipulated by Mana Ponens (and at 6th level, Mana Tollens). The results are also negated. Example: ~Il (~Illusion) → Mana Ponens → ~Nc (~Necromancy).
  7. Additional contradiction sources: Conjunction of a term and its own negation (e.g., En & ~En), or two opposed negations (e.g., ~Gr & ~Ch).

#### 6th Level — Mana Tollens

- **Rules:**
  1. While concentrating on a String with a **Negated** school, the Logician can use a **bonus action** to perform Mana Tollens.
  2. Mana Tollens derives the school **upstream** (clockwise) from the negated term on the Logician's Circle.
  3. Example: ~Il (~Illusion) → Mana Tollens → ~Ev (~Evocation).
  4. This gives the Logician bidirectional movement around the Circle. Combined with Negation, the Logician can reach any school in a few bonus actions. Example: Aj → derive ~Ev (Negation) → ~Co (Mana Tollens) → derive Dv (Negation of ~Co) — three bonus actions to traverse from Abjuration to Divination.

#### 10th Level — Demogorgon's Law & Second Order Strings

- **Rules:**
  1. If the Logician performs a Conjunction on **two Negated schools** (that does not result in a contradiction), they can use an **action** to invoke Demogorgon's Law.
  2. Effect: Creates a **20-foot anti-magic cone** directed in a direction of the Logician's choosing.
  3. Duration: **1d4 + 1 rounds** (increases to **2d4 + 1 rounds** at 16th level).
  4. The Logician can change the cone's direction at the end of their successive turns (but not the turn it was created).
  5. The cone ends if the Logician chooses to end it (like dropping concentration) or if they lose concentration on their String.
  6. At 10th level, the **range and maximum duration** of the Logician's String doubles (range becomes 60 feet, duration becomes 2 minutes).

#### 14th Level — Principle of Explosion

- **Rules:**
  1. **Once per long rest**, the Logician can perform a Conjunction that would normally create a contradiction **without triggering the wild magic surge**.
  2. As an action, the Logician focuses on the contradiction Derivation and casts a spell with a casting time of 1 action from **any spell list** (not just Wizard).
  3. The spell requires relevant components but **no spell slot**.
  4. The spell is cast at the **highest level the Logician can normally cast**.
  5. After casting, the contradiction Derivation is destroyed and the Logician's current String ends.

#### The Logician's Circle

The 10 schools of magic are arranged in a circle. Movement follows two arrow types:

**Order (clockwise):** Tr → Gr → Co → Ev → Il → Nc → Ch → Dv → Aj → En → (back to Tr)

**Red arrows (downstream / Mana Ponens direction):** Follow the clockwise order above.

**Blue arrows (opposing pairs / Negation):** Connect schools that hold contradictory energy. The opposing pairs are:

| School | Opposing School |
|--------|----------------|
| Transmutation (Tr) | Necromancy (Nc) |
| Graviturgy (Gr) | Chronomancy (Ch) |
| Conjuration (Co) | Divination (Dv) |
| Evocation (Ev) | Abjuration (Aj) |
| Illusion (Il) | Enchantment (En) |

*(Each pair is bidirectional — Co opposes Dv and Dv opposes Co.)*

---

## Data Model Implications

### New Entities

- **`character_mana`** — Tracks mana for spellcasting characters.
  - Properties: `character_id`, `current_mana` (int), `max_mana` (int), `base_mana` (int, calculated from spell slots).
  - Applies to both Sorcerers and Wizards (and potentially other casters).

- **`character_kp`** — Tracks Knowledge Points per school and per essence for Wizards.
  - Properties: `character_id`, `category_type` (enum: 'school' | 'essence'), `category_name` (e.g., 'Evocation', 'Fire'), `kp_balance` (int).
  - 24 rows per Wizard character (10 schools + 14 essences).

- **`character_arcane_perks`** — Tracks which Arcane Perks are unlocked per school/essence.
  - Properties: `character_id`, `category_type` ('school' | 'essence'), `category_name`, `perk_name` (e.g., 'Careful Spell'), `is_unlocked` (boolean).
  - Or alternatively: per-row boolean flags for each of the 10 perks (matching the Progression Table layout).

- **`character_spells_known`** — Tracks spells a character has learned.
  - Properties: `character_id`, `spell_id` (FK to spell reference), `source` (e.g., 'class_level', 'kp_learned', 'scroll_copied').
  - Note: The spell itself would need a reference table (see below).

- **`character_spell_slots`** — Tracks spell slot usage and disciplining state for Wizards.
  - Properties: `character_id`, `slot_level` (1-9), `total` (int), `expended` (int), `disciplined_school` (nullable string), `disciplined_essence` (nullable string).
  - Wizards need to track which slots are disciplined and to what school/essence.

- **`character_metamagic`** — Tracks Sorcerer-specific Metamagic selections.
  - Properties: `character_id`, `metamagic_name`, `unlocked_at_level`.

### New Reference Data (Seed Tables)

- **`spells`** — Master spell list. Properties: `id`, `name`, `level` (0-9), `school` (one of 10 schools), `essence` (one of 14 essences), `casting_time`, `range`, `components` (V/S/M with GP cost if any), `duration`, `description`, `class_lists` (which classes can learn it).
  - This is a large reference table sourced from the linked spell spreadsheet.

- **`schools_of_magic`** — 10 schools with: `id`, `name`, `abbreviation`, `signet_ring_material`, `opposing_school_id`, `circle_position` (0-9 for ordering on the Logician's Circle).

- **`archemantic_essences`** — 14 essences with: `id`, `name`, `type` (cardinal/complex). (See archemancy-spec for detailed essence data.)

### New Properties on Existing Entities

- **`Character`** — No direct changes needed. The `class` field already supports arbitrary strings including 'sorcerer' and 'wizard'. The `level` field is already present. Mana and KP are tracked in separate related entities.

### Relationships

- `character_mana` → `characters` (one-to-one, FK on character_id)
- `character_kp` → `characters` (one-to-many, 24 rows per wizard)
- `character_kp` → `schools_of_magic` or `archemantic_essences` (FK via category_name)
- `character_arcane_perks` → `character_kp` (conceptually — perks are unlocked per school/essence)
- `character_spells_known` → `characters` + `spells` (many-to-many join)
- `character_spell_slots` → `characters` (one-to-many, one row per slot level)
- `character_metamagic` → `characters` (one-to-many, Sorcerer only)

---

## UI Components Needed

### Pages / Tabs

- **Spellcasting Page** — Central hub for spell management, accessible from character profile.
  - **Mana display:** Current / Max mana with visual bar.
  - **Spell Slots display:** Grid showing slots per level, with expended/available/disciplined states.
  - **Spells Known list:** Filterable by school, essence, level. Each spell shows school, essence, level, casting time.
  - **Cast Spell interface:** Select a spell → choose slot/mana expenditure → apply metamagic/perks → confirm.

### Interactive Elements

- **Disciplining interface (Wizard):** End-of-rest flow.
  1. Select spell slots to discipline.
  2. Choose school or essence for each.
  3. Roll sequence visualizer (d20 → d12 → ... → auto success) with success/failure feedback.
  4. KP and mana earned summary.

- **KP Progression Table (Wizard):** Interactive grid matching the source document layout.
  - 24 rows (10 schools + 14 essences) × 11 columns (KP balance + 10 perk checkboxes).
  - Clicking a perk checkbox spends 1 KP to unlock it (with confirmation).
  - KP balance is editable for spending on spells.

- **Metamagic selector (Sorcerer):** When casting, show available Metamagic options with mana costs.

- **Arcane Perks selector (Wizard):** When casting, show unlocked perks for the spell's school and essence, with mana cost calculation (spell level × MM).

- **Emphasized/Exhausted/Eager buttons:** Available in the casting interface for any spellcaster. Each opens a modal with the specific flow (e.g., Exhausted shows CON check DC and exhaustion consequences).

### Logician-Specific UI

- **String builder:** Visual representation of the current String as a list of Derivations.
  - Each Derivation shows: school name, abbreviation, negation state (~).
  - Buttons for: Add Observed Effect, Mana Ponens, Conjunction, Negation, Mana Tollens.
  - Contraindication warnings (e.g., "This Conjunction would create a contradiction!").

- **Logician's Circle diagram:** Visual circle of 10 schools with red (downstream) and blue (opposing) arrows. Highlights currently derived schools.

---

## Dependencies on Existing Systems

### Affected Types / Code

- **`src/lib/types.ts`:** Will need new types: `CharacterMana`, `CharacterKP`, `CharacterArcanePerks`, `CharacterSpellSlot`, `CharacterSpellKnown`, `CharacterMetamagic`, `Spell`, `SchoolOfMagic`, `ArchemanticEssence`.
- **`src/lib/hooks/queries.ts`:** New React Query hooks for all spell-related data fetching.
- **`src/lib/constants.ts`:** New constants for schools of magic, archemantic essences, arcane perk definitions, mana cost table.
- **`src/lib/database.types.ts`:** Regenerate after schema changes.

### Cross-References to Other Specs

- **→ shared-systems-spec:** Resting system (long rest triggers Wizard disciplining; short rest does not grant KP). Dull Casting uses spell slots/mana and references schools of magic.
- **→ archemancy-spec:** Vital minerals serve as disciplining materials for archemantic essences. The 14 archemantic essences are shared between archemancy and the KP system. Dull Casting subtypes (Abjuration extraction, Transmutation combining, Conjuration duplication, Chronurgy decomposition) interact with wizard mana costs.
- **→ vocations-spec:** Spellscribe vocation creates spell scrolls, which Wizards can harvest for KP. Spell scroll blueprints are an alternative KP source.

### Integration Points

- **Character creation:** If class is 'sorcerer', initialize mana pool (Spell Points + Sorcery Points). If class is 'wizard', initialize base mana from spell slots, empty KP table (24 rows), empty arcane perks.
- **Level up:** Recalculate max mana, update spell slot totals, potentially unlock new Metamagic (Sorcerer) or expand String uses (Logician proficiency bonus).
- **Rest flow:** Long rest → offer Wizard disciplining step. Mana recovery rules (likely full recovery on long rest, but source doesn't explicitly state — see Open Questions).

---

## Open Questions

1. **Exhaustion rounding (Exhausted/Eager Spellcasting):** "Spell level divided by 2" — is this rounded down, rounded up, or a minimum of 1? EPG doesn't specify. Assumed floor division, but needs confirmation.
2. **Mana recovery on rest:** The Wizard Update describes earning mana through disciplining but does not explicitly state whether mana fully recovers on a long rest (like spell slots do in standard 5e). Does base mana reset on long rest, with disciplined mana as a bonus? Or is mana only recovered through disciplining?
3. **Sorcerer mana recovery:** Standard DMG Spell Points recover on a long rest. Does Sorcerer mana follow the same rule? What about the Sorcery Points portion — do they also recover on long rest as a unified pool?
4. **Eager Spellcasting — school-to-ability-score mapping:** The spec says failure subtracts the spell level from "an ability score determined by the school of magic." The mapping is intentionally hidden in-game, but do we need to encode it in the tool (DM-facing), or leave it fully narrative?
5. **Eager Spellcasting — major curse list:** Similarly, the major curse per school is hidden. Does the tool need a reference table for DMs, or is this purely adjudicated?
6. **Wizard disciplining — when exactly?** "At the end of a rest" — does this mean at the end of any rest (short or long), or only long rests? The shared-systems-spec references long rest for disciplining.
7. **Sorcerer Overchannel vs Wizard Overchannel:** Both exist. The Sorcerer version costs "sorcery points equal to the spell's level." The Wizard version (Arcane Perk) costs "spell effect level × 3 mana." Are these the same ability accessed differently, or distinct features that could stack?
8. **Careful Spell conflict:** EPG Sorcerer version says "take no damage." Wizard Update version says "auto-succeed on save and take no damage." The Wizard Update version is more detailed. Do Sorcerers get the simpler version (just no damage) or the fuller version (auto-succeed + no damage)?
9. **Logician's Circle opposing pairs:** The EPG lists the 10 schools in circle order and mentions blue arrows for opposing pairs, but does not explicitly list every pair. The spec above infers 5 opposing pairs from the circle structure (each school opposes the one 5 positions away). This needs confirmation.
10. **Spell reference data:** The Wizard Update links to a Google Sheets spell list. Is this the authoritative source for the spells table seed data? Does it include school AND essence tags for every spell?
11. **KP distribution from scroll harvesting:** "Distributed between the spell's essence and school" — is this evenly split (e.g., 3 KP spell → 1 or 2 to school, remainder to essence)? Or does the Wizard choose?
12. **Logician String range at 10th level:** Source says "range and maximum duration doubles." Does this mean the 30ft awareness range for triggering a String doubles to 60ft, AND the Negation reaction range (60ft) doubles to 120ft? Or just the String trigger range?

---

## Conflict Resolution Log

### Wizard Mana System
| Topic | EPG Says | Wizard Update Says | This Spec Uses |
|-------|----------|-------------------|---------------|
| **Wizard mana acquisition** | Not detailed for wizards | Disciplining system: roll-down dice, earn mana + KP equal to proficiency bonus | **Wizard Update** — comprehensive system not present in EPG |
| **Knowledge Points** | Not mentioned | Full KP system: per-school, per-essence, spend to learn spells and unlock perks | **Wizard Update** — entirely new system |
| **Arcane Perks / Metamagic for Wizards** | Not detailed | 10 Arcane Perks with MM modifiers, unlocked via KP, paid via mana | **Wizard Update** — authoritative |
| **Mana Cost Table** | Not present | Full table: 1st=1, 2nd=3, ... 9th=64 | **Wizard Update** — only source |

### Careful Spell
| Topic | EPG (Sorcerer) Says | Wizard Update (Arcane Perk) Says | This Spec Uses |
|-------|---------------------|--------------------------------|---------------|
| **Careful Spell effect** | "Take no damage" (no mention of saving throw) | "Auto-succeed on saving throw and take no damage" | **Both preserved as written** — Sorcerer version from EPG (simpler), Wizard perk version from WU (more detailed). Flagged as Open Question #8. |

### Overchannel
| Topic | EPG (Sorcerer) Says | Wizard Update (Arcane Perk) Says | This Spec Uses |
|-------|---------------------|--------------------------------|---------------|
| **Overchannel cost** | Sorcery points equal to spell's level | Mana = spell effect level × 3 (MM 3) | **Both preserved** — different resource systems, same concept. Sorcerer pays in sorcery points (part of mana pool), Wizard pays in mana via MM formula. |
| **Overchannel necrotic damage** | 1d6 per spell level | 1d6 per spell effect level | **Both agree** — identical mechanic, different wording |

### School Names
| Topic | EPG Says | Wizard Update Says | This Spec Uses |
|-------|----------|-------------------|---------------|
| **Chronomancy vs Chronurgy** | Uses "Chronurgy" in Logician section (line 2167) and "Chronomancy" in the Circle (line 2223) | Uses "Chronomancy" (line 21) | **Chronomancy** — used consistently in both WU and the Logician's Circle. "Chronurgy" appears to be an alternate name used once in EPG narrative text. |

### Sorcerer vs Wizard Mana
| Topic | Description | Resolution |
|-------|-------------|------------|
| **Same resource name, different acquisition** | Sorcerers get mana from class level (Spell Points + Sorcery Points). Wizards get base mana from spell slots and earn more via disciplining. | **Complementary, not conflicting.** A multiclass Sorcerer/Wizard would need rules for combining pools — flagged for future resolution. Both use the same Mana Cost Table for spending. |

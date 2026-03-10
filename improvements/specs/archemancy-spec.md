# Archemancy Specification

## Source Documents
- **Elros Player's Guide (EPG):** Archemancy overview (lines 740-755), Vital Mineral manipulation (lines 757-803), Using Vital Minerals / Vocation integrations (lines 804-1104), Dull Casting formal table (lines 2386-2421)
- **EPG** is the sole authoritative source for all archemancy content (no conflicting documents)
- **Cross-reference:** `shared-systems-spec.md` — Vital Alloys table, Dull Casting definition, weapon materials

## Overview

Archemancy is the foundational magic system in Elros that connects herbalism, alchemy, blacksmithing, runecrafting, and spellcasting through a shared elemental substrate called Vital Minerals. Players extract these gemstone-like shards from plant ingredients or creature essences, then combine, duplicate, or decompose them using Dull Casting. The resulting minerals serve as versatile crafting ingredients, weapon-forging components, and spell materials across nearly every vocation.

---

## Core Mechanics

### 1. Vital Minerals

- **What it does:** Vital Minerals are small precious gemstones — concentrated shards of pure elemental essence — that form the connective tissue between Elros's crafting and magic systems.
- **Rules:**
  1. There are **4 Cardinal (Simple) Vital Minerals** derived directly from the 6 herbalism elements (Fire, Water, Earth, Air). These correspond 1:1 with plant ingredient essences.
  2. There are **10 Complex (Compound) Vital Minerals** that combine multiple elemental essences: Salt, Lead, Sulfur, Mercury, Frost, Lightning, Living Water, Black Sulfur, Lucid, and Quintessence.
  3. Total: **14 Vital Minerals.**
  4. Cardinal minerals are obtained by Abjuration (Distillation) Dull Casting on herbalism plant ingredients.
  5. Complex minerals are initially obtained by Abjuration (Distillation) Dull Casting on a creature essence of CR 3 or higher. Which creature essence yields which complex mineral is up to player discovery.
  6. Once a complex mineral is obtained, it can be duplicated via Transmutation (Duplication) Dull Casting using the Archemancer's Web combination rules.
  7. Complex minerals can be broken down into simpler components via Chronurgy (Decomposition) Dull Casting.
  8. All Vital Minerals retain their elemental potency and can be used as herbalism ingredients.

#### Complete Vital Minerals Reference

| # | Mineral | Type | Component Elements | Known Uses |
|---|---------|------|--------------------|------------|
| 1 | Fire | Cardinal | Fire | Herb essence; Conjure Forge spell component |
| 2 | Water | Cardinal | Water | Herb essence |
| 3 | Earth | Cardinal | Earth | Herb essence |
| 4 | Air | Cardinal | Air | Herb essence |
| 5 | Salt | Complex | *(See Web — inferred from position)* | Salinized Brass (vital alloy) |
| 6 | Lead | Complex | Air, Earth, Earth *(EPG line 1054)* | Binding Chalk; LeadIron & Conspicuous Silver (vital alloys); Antediluvian Platinum (Poison damage) |
| 7 | Sulfur | Complex | *(See Web — fire-associated)* | Devil's Gate Chalk; Heartgold (vital alloy); Antediluvian Platinum (Fire damage) |
| 8 | Mercury | Complex | Water, Earth *(EPG line 768)* | Antediluvian Platinum (Acid damage) |
| 9 | Frost | Complex | *(See Web — cold-associated)* | Antediluvian Platinum (Cold damage) |
| 10 | Lightning | Complex | Fire, Air *(EPG line 778)* | Galvanic Copper & Yarkian Brass (vital alloys); Antediluvian Platinum (Lightning damage); substitute for Incorporeal Undead essence in Alchemy |
| 11 | Living Water | Complex | *(See Web)* | Living Dust (reduces healing spell cost by 25 GP/measure); Violode Steel (vital alloy) |
| 12 | Black Sulfur | Complex | *(See Web)* | Demon's Gate Chalk |
| 13 | Lucid | Complex | *(See Web)* | Demiurgic Smithing Tools; Piquant Ink (reduces spell scroll crafting time); Mithral (vital alloy) |
| 14 | Quintessence | Complex | *(See Web)* | Synthetic Empyrean Dust (for Runic Ignition ritual) |

---

### 2. The Archemancer's Web

- **What it does:** A graph structure that encodes how Vital Minerals relate to each other — specifically, which simpler minerals combine to produce each complex mineral.
- **Rules:**
  1. The 4 Cardinal elements form the base nodes, arranged clockwise from the top: **Fire, Earth, Water, Air**
  2. Complex minerals are intermediate and outer nodes; each is produced by combining two simpler minerals that "point into" it
  3. Transmutation Dull Casting on **one complex mineral + its two simpler component minerals** yields **two copies of the complex mineral**
  4. Chronurgy Dull Casting reverses this: a complex mineral decomposes into its simpler components
  5. The Web is depicted as a visual diagram on EPG page 16 (not reproducible from text alone)

#### Confirmed Web Edges (from explicit text)

| Complex Mineral | Component 1 | Component 2 | Source |
|----------------|-------------|-------------|--------|
| Mercury | Water | Earth | EPG line 768: "a Water Shard and an Earth Shard can be combined with a Mercury Shard" |
| Lightning | Fire | Air | EPG line 777-780: "a Lightning Shard may be Decomposed... into an Air Shard and a Fire Shard" |

#### Inferred Web Edges (from elemental composition and damage associations)

| Complex Mineral | Likely Components | Reasoning |
|----------------|-------------------|-----------|
| Sulfur | Fire + Earth | Sulfur yields Fire damage (EPG line 1018); adjacent pair in clockwise arrangement |
| Frost | Water + Air | Frost yields Cold damage (EPG line 1019); adjacent pair in clockwise arrangement |
| Salt | Fire + Water | Opposite cardinal pair; Salt is used against Fiends (Salinized Brass, line 908-916) |
| Lead | Earth + Air | Opposite cardinal pair; however, EPG line 1054 says Lead contains "air, and twice of earth" — the "twice of earth" may indicate Lead is a second-tier compound composed of Earth + Mercury(Water+Earth), or the herbalism contribution counts elements with multiplicity |

#### Unresolvable from Text Alone

The following 4 complex minerals cannot be placed on the Web from textual evidence. The Archemancer's Web diagram (EPG page 16) is required:

- **Living Water** — No explicit components given. Used to create Violode Steel and Living Dust.
- **Black Sulfur** — No explicit components given. Used to create Demon's Gate Chalk.
- **Lucid** — No explicit components given. Used to create Mithral, Demiurgic Smithing Tools, and Piquant Ink.
- **Quintessence** — No explicit components given. Used to create Synthetic Empyrean Dust.

These are likely **second-tier or third-tier compounds** formed by combining first-tier complex minerals (or a mix of cardinal + first-tier). The naming suggests:
- Black Sulfur likely involves Sulfur as a component
- Living Water likely involves Water (or Frost/Mercury) as a component
- Quintessence (literally "fifth essence") is likely the apex mineral, possibly requiring other complex minerals

**This is the highest-priority Open Question for Wave 3 brainstorming — the full Web must be obtained from the game designer or the EPG page 16 image.**

---

### 3. Dull Casting (Archemantic Applications)

- **What it does:** Dull Casting is a general spellcasting mechanic (see `shared-systems-spec.md` section 8) that produces cantrip-level effects by expending a spell slot. Archemancy defines 4 specific Dull Casting applications for manipulating Vital Minerals.
- **Rules:**
  1. A spellcaster expends any spell slot (or Sorcerer mana) to perform the casting
  2. The spell selected determines the school of magic — nothing else
  3. Cannot produce effects requiring attack rolls or saving throws
  4. Wizard subclasses associated with the relevant school can perform their school's Dull Castings as a cantrip (no spell slot cost)

#### Archemantic Dull Casting Table (EPG lines 2406-2420)

| Name | School of Magic | Effect |
|------|----------------|--------|
| **Definition** | Divination | Reveals the effects of the other Dull Castings on a selected Vital Mineral (i.e., shows what a mineral can be combined with or decomposed into) |
| **Distillation** | Abjuration | Produces a Vital Mineral Shard from the redirected energies latent in targeted objects (creature essences, herbalism ingredients) |
| **Duplication** | Transmutation | Duplicates a Compound Vital Mineral by transforming the more basic component Vital Minerals into a copy of the Compound (1 complex + 2 simpler → 2 copies of complex) |
| **Decomposition** | Chronurgy | Stimulates a reversal of a Distillation or Duplication (breaks complex mineral into its simpler components) |

**Note on naming:** The archemancy section body text (lines 757-780) uses different labels than the formal table (lines 2406-2420):
- Body text calls extraction "Abjuration Dull Casting" → formal table calls it "Distillation" (school: Abjuration)
- Body text calls combining "Transmutation Dull Casting" → formal table calls it "Duplication" (school: Transmutation)
- Body text calls breakdown "Chronurgy Dull Casting" → formal table calls it "Decomposition" (school: Chronurgy)
- Body text does not mention "Definition" (Divination) at all — this only appears in the formal table

The formal table (lines 2406-2420) should be treated as canonical for naming.

---

### 4. Creature Essence Extraction

- **What it does:** Converts creature essences (from killed/harvested creatures) into Vital Mineral Shards.
- **Rules:**
  1. Creature must be **CR 3 or higher** to yield a Vital Mineral
  2. The extraction is performed via **Distillation** (Abjuration Dull Casting) on the creature essence
  3. Which creature essence maps to which Vital Mineral element is **up to the player to discover** — the EPG provides hints but does not give a complete mapping
  4. This is the primary method for obtaining the initial copy of a complex Vital Mineral (before it can be duplicated via the Web)
- **Inputs/Outputs:** Creature Essence (CR 3+) + Abjuration spell slot → 1 Vital Mineral Shard (element determined by creature type)

---

### 5. Vocation Integrations

#### 5a. Archemantic Alchemy (EPG lines 812-829)

- **What it does:** Vital Minerals can substitute for creature essences as potion ingredients in Alchemy.
- **Rules:**
  1. Vital Minerals meet part of the **Creature Type requirement** in potion brewing (e.g., a Lightning Shard can substitute for Incorporeal Undead essence)
  2. Vital Minerals do **NOT** contribute to the total **CR target** of the brewed potion — only real creature essences contribute CR value
  3. Vital Minerals associated with **Shapeshifter** creature essences **cannot** be used as a substitute for non-Shapeshifter creature types
- **Example:** To brew a Potion of Invisibility requiring Incorporeal Undead Essences, an Alchemist could meet the CR 14 requirement with Fey eyes and then add a Lightning Shard to satisfy the Incorporeal Undead type requirement.

#### 5b. Archemantic Blacksmithing (EPG lines 831-848)

- **What it does:** Vital Minerals enable creation of Demiurgic Smithing Tools and Vital Alloy weapons.
- **Rules:**
  1. Including a **Lucid Shard** when forging Smithing Tools creates **Demiurgic Smithing Tools** — a required material component for the Iqbal's Conjure Forge spell
  2. A **Fire Shard** is the other required material component for Iqbal's Conjure Forge (consumed on casting)
  3. When forging a weapon, the Blacksmith adds **1 Shard of a Vital Mineral per pound of the weapon** being forged
  4. The resulting weapon is made from a **Vital Alloy** — acquiring special attributes and bonuses (see `shared-systems-spec.md` section 3, Vital Alloys table)
  5. Vital Alloys retain all attributes of the mundane metal they were created from, plus gain additional features from the mineral

#### 5c. Archemantic Herbalism (EPG lines 1045-1063)

- **What it does:** Vital Minerals serve as herbalism ingredients, with compound minerals contributing multiple elements.
- **Rules:**
  1. The 4 Cardinal Vital Minerals (Fire, Water, Earth, Air) **directly correspond** to herb essences and can substitute as regular Plant Essence ingredients
  2. Compound Vital Minerals contribute **all of their component elements** to a brew. Example: a Lead Shard (containing Air + Earth + Earth) adds three essences to a brew using only one ingredient slot — thus lowering the Herbalism DC
  3. Compound Vital Minerals can be **Decomposed** via Chronurgy Dull Casting into more basic Vital Minerals, allowing a Herbalist to convert creature essences into specific herb essences they need

#### 5d. Other Archemantic Uses (EPG lines 1065-1104)

Special conversions for specific complex minerals:

| Vital Mineral | Crushed Product | Use |
|--------------|----------------|-----|
| **Sulfur** | Devil's Gate Chalk (1 measure) | Material component for summoning devils; used in relevant spells |
| **Black Sulfur** | Demon's Gate Chalk (1 measure) | Material component for summoning demons; used in relevant spells |
| **Lead** | Binding Chalk (1 measure) | Material component for creating magical barriers and protective fields; used in relevant spells |
| **Living Water** | Living Dust (1 measure) | Reduces the cost of healing spells (spells whose only/primary effect is healing creatures) by **25 GP per measure** expended |
| **Lucid** | Piquant Ink (1 measure, mixed with common ink) | Used by Spellscribes to reduce spell scroll crafting time: reduces the number of blocks required by the number of blocks needed for a spell one level lower (minimum 1 block). Does NOT stack with Second-Hand Scribe feature. |
| **Quintessence** | Synthetic Empyrean Dust (1 measure) | Can be used as Empyrean Dust for the **Runic Ignition Ritual** used by Runeseekers |

---

## Data Model Implications

### New Entities

- **Vital Minerals reference table** — 14 rows. Properties: `id`, `name`, `type` (cardinal | complex), `component_elements` (array of element strings, e.g. `["fire", "air"]` for Lightning), `tier` (1 = cardinal, 2+ = tier in Web graph), `description`, `crushed_product` (nullable — name of what it becomes when crushed), `crushed_product_description` (nullable)

- **Archemancer's Web edges** — Graph structure encoding which minerals combine into which. Options:
  - **Option A (edge table):** `id`, `result_mineral_id` (FK to vital minerals), `component_1_id` (FK), `component_2_id` (FK). Each row represents one combination rule.
  - **Option B (embed in minerals table):** Add `component_mineral_ids` (array of FKs) to the vital minerals table. Simpler, but less flexible for querying.
  - **Recommendation:** Option A — it cleanly represents the directed graph and enables efficient traversal queries for both duplication and decomposition.

- **Character mineral inventory** — Per character, quantity of each mineral held. Properties: `id`, `character_id` (FK), `mineral_id` (FK to vital minerals), `quantity` (integer). Similar in structure to `character_herbs`.

- **Dull Casting log** (optional) — Tracks dull casting activities for a character. Properties: `id`, `character_id`, `casting_type` (definition | distillation | duplication | decomposition), `input_mineral_ids` (array), `output_mineral_ids` (array), `source_description` (nullable — e.g., creature name for distillation), `created_at`. This is nice-to-have for tracking discovery and history but not strictly necessary for core functionality.

### New Properties on Existing Entities

- **`herbs` table:** No changes needed. The existing `elements` array already stores elemental composition; Vital Minerals extend this concept without modifying the herb data model.
- **`materials` table:** Already has a `vital_mineral_id` concept identified in `shared-systems-spec.md` for Vital Alloys. Confirm FK reference points to the new Vital Minerals table.

### New Reference Data to Seed

- 14 vital mineral records (4 cardinal + 10 complex)
- Web edge records (one per combination rule — at least 10 edges for 10 complex minerals, assuming each has exactly 2 components)
- Crushed product descriptions for 6 minerals (Sulfur, Black Sulfur, Lead, Living Water, Lucid, Quintessence)

### Relationships

- `character_mineral_inventory.character_id` → `characters.id`
- `character_mineral_inventory.mineral_id` → `vital_minerals.id`
- `web_edges.result_mineral_id` → `vital_minerals.id`
- `web_edges.component_1_id` → `vital_minerals.id`
- `web_edges.component_2_id` → `vital_minerals.id`
- `materials.vital_mineral_id` → `vital_minerals.id` (for Vital Alloys)

---

## UI Components Needed

### Archemancer's Web Visualization
- Interactive graph/diagram showing all 14 minerals and their relationships
- Nodes colored by element type (reuse existing `ELEMENT_COLORS` from `constants.ts`)
- Edges showing combination paths (directional — simpler minerals point into complex ones)
- Click/tap on a node to see mineral details, uses, and available actions
- Highlight available combinations based on character's current mineral inventory

### Mineral Inventory Page
- Grid or list view of all minerals a character possesses, with quantities
- Grouped by type (Cardinal vs. Complex)
- Quick actions: Duplicate, Decompose, Crush (for applicable minerals)
- Element symbols/colors consistent with herbalism UI

### Dull Casting Interface
- **Distillation form:** Select a plant ingredient or creature essence → show resulting mineral → confirm to extract
- **Duplication form:** Select a complex mineral + its two required components from inventory → confirm to duplicate → show result (2 copies of complex, components consumed)
- **Decomposition form:** Select a complex mineral → show what it breaks down into → confirm
- **Definition form:** Select a mineral → show its Web connections (what it combines with, what it decomposes into)
- All forms should validate against current inventory before allowing action
- Wizard subclass users should see Dull Casting as cantrip (no slot cost) for their school

### Integration with Existing Pages
- **Brew page:** When selecting ingredients, show Vital Minerals alongside herbs as available ingredients. Display compound minerals with all their contributing elements.
- **Character profile/inventory:** New tab or section for mineral inventory

---

## Dependencies on Existing Systems

### Affected Tables/Hooks/Components
- **`src/lib/constants.ts`:** Will need `VITAL_MINERALS`, `MINERAL_TYPES`, and possibly `DULL_CASTING_TYPES` constants. Element naming (positive/negative vs. light/dark) will need a resolution strategy.
- **`src/lib/types.ts`:** Will need `VitalMineral`, `WebEdge`, `CharacterMineral`, and `DullCastingLog` type definitions. The existing `Herb` type's `elements` array concept extends naturally to minerals.
- **`src/lib/hooks/queries.ts`:** Will need new React Query hooks: `useVitalMinerals()`, `useCharacterMinerals()`, `useWebEdges()`, and mutation hooks for dull casting operations.
- **Brew page components:** Must accept Vital Minerals as valid ingredient inputs, contributing their component elements to the brew.
- **Character profile:** Needs a new inventory section for minerals.

### Cross-References to Other Specs
- **`shared-systems-spec.md`:** Vital Alloys table (section 3) — Vital Alloys are created by combining mundane metals with Vital Mineral shards during forging. The `materials` table needs `vital_mineral_id` FK.
- **`shared-systems-spec.md`:** Dull Casting definition (section 8) — General Dull Casting rules apply to all 4 archemantic applications.
- **vocations-spec** (future): Alchemist (mineral substitution for creature essences), Blacksmith (Vital Alloy forging, Demiurgic tools), Herbalist (mineral-as-ingredient, decomposition for conversion), Runeseeker (Quintessence → Synthetic Empyrean Dust for Runic Ignition), Spellscribe (Lucid → Piquant Ink for scroll crafting).
- **spellcasting-spec** (future): Wizard KP system uses archemantic essences; Wizard subclass Dull Casting as cantrip.

### Integration Points
- **Herbalism brew logic:** The brew calculation engine must accept Vital Minerals as ingredients. Cardinal minerals count as 1 element; compound minerals contribute all their component elements. This affects DC calculation (more elements per ingredient slot = lower DC).
- **Creature essence system:** When an alchemy/creature-essence system is built, it must support distillation into Vital Minerals (CR 3+ gate).
- **Foraging system:** Does not directly interact — minerals come from dull casting, not foraging.

---

## Open Questions

1. **CRITICAL — Archemancer's Web full graph:** The EPG page 16 diagram is not reproducible from text alone. Only 2 of 10 complex mineral compositions are explicitly stated (Mercury = Water + Earth; Lightning = Fire + Air). The remaining 8 complex minerals' compositions must be obtained from the game designer or the original diagram. Without this, duplication and decomposition mechanics cannot be fully implemented.

2. **CRITICAL — Element naming mismatch (Light/Dark vs. Positive/Negative):**
   - The app currently uses **"positive"** and **"negative"** as element names (see `ELEMENT_SYMBOLS`, `ELEMENT_COLORS`, and `ELEMENT_ORDER` in `src/lib/constants.ts`)
   - The EPG uses **"Light"** (🔆) and **"Dark"** (🌑) as element names (EPG line 318)
   - These map to the same concepts but use different terminology
   - **Decision needed:** Do we rename the app's internal values from positive/negative to light/dark? Or maintain a mapping layer? Or keep positive/negative as internal names and display Light/Dark in the UI?
   - **Impact:** The `elements` column in the `herbs` database table currently stores "positive" and "negative". Renaming would require a data migration. A display-only mapping is simpler but introduces a persistent mismatch.

3. **Cardinal minerals and Light/Dark:** The EPG only names 4 cardinal minerals (Fire, Water, Earth, Air) but the herbalism system has 6 elements (adding Light/Dark or Positive/Negative). Are there Light and Dark cardinal Vital Minerals? The archemancy section does not mention them, but they exist as herb essences. Clarification needed.

4. **Lead's "twice of earth" composition:** EPG line 1054 states Lead "contains the essences of air, and twice of earth." In the Web, each complex mineral is formed from exactly two simpler minerals. If Lead's components are two cardinal elements (Earth + Air), that accounts for only one Earth — not "twice of earth." This suggests Lead may be a second-tier compound formed from Earth + another complex mineral that already contains Earth (e.g., Mercury = Water+Earth or Sulfur = Fire+Earth?). The exact composition depends on the Web diagram.

5. **Conjuration Dull Casting discrepancy:** The task description mentions "Conjuration (Duplication)" as one of the 4 types, but the EPG formal table (line 2416) lists Duplication under **Transmutation**, not Conjuration. The EPG is authoritative — Duplication is Transmutation school. Is there a separate Conjuration dull casting application?

6. **Mineral quantity from Distillation:** When performing Distillation on a creature essence or plant ingredient, how many mineral shards are produced? The text says "a Vital Mineral Shard" (singular) from "an object" — implying 1 shard per casting. Confirm.

7. **Decomposition output quantities:** When decomposing a complex mineral, how many of each component are produced? If Lightning = Fire + Air, does decomposing 1 Lightning yield 1 Fire + 1 Air? Or different quantities? The text says "reversal of the creation" which implies mirroring the duplication input.

8. **Duplication's initial complex mineral — consumed or preserved?** The rule says "one complex Vital Mineral + two simpler Vital Minerals → two copies of the complex." Does this mean the original complex mineral is consumed (net gain = 1 complex, net loss = 2 simpler)? Or preserved (net gain = 2 complex, net loss = 2 simpler)? The text says "duplicating it with the addition of the simpler Minerals" which suggests the original is transformed into two copies alongside the simpler minerals being consumed. Net: -1 complex -2 simpler +2 complex = +1 complex -2 simpler.

9. **Shapeshifter restriction scope:** The text says minerals from Shapeshifter creature essences cannot substitute for non-Shapeshifter types. Which specific minerals are associated with Shapeshifters? The Lead/Conspicuous Silver connection (Conspicuous Silver reverts Shapeshifters) may hint that Lead is the Shapeshifter-associated mineral, but this is not explicit.

---

## Conflict Resolution Log

### Element Naming: App vs. EPG

| Context | App Uses | EPG Uses | Status |
|---------|----------|----------|--------|
| 5th element | `positive` | `Light` (🔆) | **MISMATCH — needs resolution (Open Question #2)** |
| 6th element | `negative` | `Dark` (🌑) | **MISMATCH — needs resolution (Open Question #2)** |
| 5th element emoji | ✨ | 🔆 | Different emoji representations |
| 6th element emoji | 💀 | 🌑 | Different emoji representations |

**Files affected:**
- `src/lib/constants.ts` — `ELEMENT_SYMBOLS`, `ELEMENT_COLORS`, `ELEMENT_ORDER` all use "positive"/"negative"
- Database: `herbs.elements` column stores "positive"/"negative" values
- `src/lib/types.ts` — `Herb.elements` typed as `string[]`

### Dull Casting Naming: Body Text vs. Formal Table

| Body Text (lines 757-780) | Formal Table (lines 2406-2420) | This Spec Uses |
|---------------------------|-------------------------------|----------------|
| "Abjuration Dull Casting" (extraction) | **Distillation** (school: Abjuration) | **Formal table** — "Distillation" |
| "Transmutation Dull Casting" (combining) | **Duplication** (school: Transmutation) | **Formal table** — "Duplication" |
| "Chronurgy Dull Casting" (breakdown) | **Decomposition** (school: Chronurgy) | **Formal table** — "Decomposition" |
| *(not mentioned)* | **Definition** (school: Divination) | **Formal table** — "Definition" |

The formal table at lines 2406-2420 is treated as canonical. The body text uses informal shorthand (school name as the operation name).

### No Inter-Document Conflicts

Archemancy has only one source document (EPG). There are no conflicts between documents to resolve — only the internal naming inconsistencies noted above and the naming mismatch with the existing app codebase.

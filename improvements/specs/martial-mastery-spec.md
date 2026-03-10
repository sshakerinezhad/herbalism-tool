# Martial Mastery Specification

## Source Documents
- **Primary (authoritative):** `improvements/Martial Mastery Expansion 2.md` (all 448 lines) — the newer revision. Supersedes EPG on all conflicts.
- **Secondary (context only):** `improvements/Elros_Players_Guide.md` (lines 1110-1957) — the older martial combat expansion. Used for historical context and conflict identification.
- **Cross-reference:** `improvements/specs/shared-systems-spec.md` — covers armor, shields, weapon make/materials, and resting rules that this system depends on.

---

## Overview

Martial Mastery is the progression and combat enhancement system for martial (non-magical) characters. Players earn Martial Mastery Points (MMP) through combat achievements and training, which they spend to learn Expert Techniques (special combat maneuvers powered by Stamina Dice), Martial Stances (persistent combat modes with ranked upgrades), weapon proficiencies, and feats. The system also governs critical hits, lingering injuries, and custom combat conditions.

---

## Core Mechanics

### 1. Stamina Dice (MM2 lines 149-175)

- **What it does:** Provides a semi-random resource pool each turn that martial characters spend to perform Expert Techniques. Replaces the EPG "Technique Dice" system (see Conflict Resolution Log).
- **Rules:**
  1. A creature has a **maximum** number of Stamina Dice equal to their **proficiency bonus**
  2. A creature **recovers one expended Stamina Die each turn**, unless they took damage between the beginning and end of their previous turn
  3. At the **start of each turn** of combat, the creature rolls all of their Stamina Dice
  4. Any dice showing **odd numbers** are set aside as **inactive** (unusable this round, but not expended)
  5. Any dice showing **even numbers** are kept as **active** (available for use)
  6. To perform an Expert Technique, a character **declares their intention**, then **rolls all Active Stamina Dice** (re-rolling the active pool)
  7. The character selects any combination of rolled Active Stamina Dice whose **values sum to or exceed** the Technique Point (TP) cost of the chosen technique
  8. **On success:** the selected dice are expended, and the technique is performed
  9. **On failure** (cannot reach the TP cost): the character gains the **Reeling** condition and does not perform the technique
- **Inputs/Outputs:**
  - Input: proficiency bonus (determines max dice), damage taken last turn (determines recovery)
  - Output: active/inactive dice pool, technique success/failure
- **Formulas:**
  - Max Stamina Dice = Proficiency Bonus
  - Recovery: +1 expended die per turn (if no damage taken previous turn)
  - Activation: roll all dice → even = active, odd = inactive
  - Spending: select active dice where sum of VALUES >= TP cost

### 2. Martial Mastery Points (MMP) (MM2 lines 277-309)

- **What it does:** Experience currency specifically for martial advancement. Earned through combat prowess and training.
- **Rules:**
  1. MMP are acquired when:
     - A creature rolls a **Natural 20** on an attack roll against an enemy using a melee martial weapon
     - A creature rolls a **Natural 1** on an Athletics Check for training with martial weapons (1-hour Long Test, once per long rest)
  2. Training uses the **progressive endeavor** system: roll d20 on first check; on failure, roll d12 next time; then d10, d8, d6, d4; if d4 fails, auto-succeed. On any success, reset to d20 and gain 1 MMP.
  3. MMP may be spent during training on the following:

| Expenditure | Cost |
|-------------|------|
| Weapon type proficiency (e.g., glaives, daggers) | 1 MMP |
| Expert Technique | Listed per technique (1-3 MMP) |
| Esoteric Technique | Listed per technique (requires trainer who knows it) |
| Martial Stance (per rank) | 1 MMP per rank attained |
| Eligible Feat | 5 MMP |

- **Inputs/Outputs:**
  - Input: natural 20 on melee martial attack, natural 1 on Athletics training check (progressive endeavor)
  - Output: MMP balance, unlocked techniques/stances/proficiencies/feats

### 3. Expert Techniques (MM2 lines 176-276)

- **What it does:** Special combat maneuvers that require specific weapon types, MMP investment to learn, and Stamina Dice expenditure to perform.
- **Rules:**
  1. Each technique has three tags: Prerequisites (weapon type), Cost (MMP to learn), TP (Technique Points to perform)
  2. Techniques must be unlocked by spending MMP before they can be used
  3. Performing a technique requires expending Active Stamina Dice whose values sum to the TP cost

#### Complete Expert Techniques Table

| # | Technique | Prerequisites | MMP Cost | TP Cost | Effect Summary |
|---|-----------|--------------|----------|---------|----------------|
| 1 | **Shield Batter** | Shield | 1 | 2 | Bonus action or attack: attack roll vs target, no damage, push target. Distance = 5 ft if STR bonus <= 0, otherwise ((STR bonus / 2) rounded up) * 5 ft |
| 2 | **Pinning Attack** | Dagger | 1 | 2 | Melee attack vs prone target: no damage, target grappled + prone until dagger removed (bonus action, STR check DC = attacker's STR/DEX score). Pinned target treats incoming attacks as the dagger's metal type |
| 3 | **Parry** | Shortsword, Longsword, Glaive, Scimitar, Rapier, or Greatsword | 1 | 3 | Reaction before attack dice rolled: +AC equal to half proficiency bonus until start of next turn or weapon dropped |
| 4 | **Puncture Attack** | Spear, Halberd, Javelin, Trident, or Pike (made into Harpoon) | 1 | 3 | On hit within 30 ft, reroll attack vs AC. Success: target punctured, cannot move >30 ft from attacker while rope held. Target can contest (STR check as action). Removal by others: weapon damage dice again (no bonuses). Self-removal: damage rolled twice |
| 5 | **Push Attack** | Bludgeoning Weapon | 1 | 3 | On melee hit, move target 10 ft to unoccupied space (target max one size larger) |
| 6 | **Slash Attack** | Slashing Weapon | 1 | 3 | Melee attack targets all creatures in cone with range = weapon's reach. Single attack roll, full damage to all hit |
| 7 | **Slowing Attack** | Shortsword, Longsword, Glaive, Billhook, Scimitar, Rapier, or Greatsword | 1 | 3 | On opportunity attack hit, reduce target's speed by (5 * proficiency bonus) ft |
| 8 | **Snatch** | Whip | 1 | 3 | Instead of attack: grab item <= 5 lbs. Attack roll DC 16. If held by creature, contested STR/DEX saving throw |
| 9 | **Tripping Attack** | Flail, Morningstar, or Whip | 1 | 3 | On opportunity attack, target makes DEX save (DC 8 + prof bonus + STR/DEX mod) or knocked prone. Targets 1+ size larger have advantage |
| 10 | **Evading Attack** | Billhook, Flail, Morningstar, Whip | 1 | 3 | On attack, ignore AC from shields or weapons |
| 11 | **Longer Attack** | Spear, Halberd, Javelin, Trident, or Pike | 1 | 3 | Bonus action: increase melee range by 5 ft (max 15 ft) until start of next turn |
| 12 | **Lunge Attack** | Piercing Weapon | 1 | 4 | Attack all creatures in a line (weapon reach + 5 ft max). Expend movement = line distance. Full damage to all hit. After attack, move line length + 5 ft in attack direction (no opportunity attacks from targets hit) |
| 13 | **Position Control** | Tower Shield | 2 | 3 | No action/reaction: prevent one target from making opportunity attacks against you |
| 14 | **Trap Blade** | Wooden Shield | 2 | 4 | Reaction when piercing/slashing attack misses (would have hit without shield): STR check (with prof if shield-proficient) vs attack roll total. Success: disarm attacker, toss weapon 10 ft. Pine shield: advantage on STR check |
| 15 | **Shield Breaker** | Bludgeoning Weapon | 2 | 4 | Attack opponent's shield. If attack meets AC: wood shield loses all AC bonus, metal shield loses 1 AC bonus |
| 16 | **Whittle Away** | Any Martial Weapon | 2 | 4 | On hit vs target with damaged armor (rended/broken): forgo damage, instead rend an armor piece adjacent to already-damaged piece |
| 17 | **The Best Defense** | Any Martial Weapon | 2 | 4 | Reaction when "just missed" by attack: target gains Staggered condition |
| 18 | **Spin Attack** | Slashing Weapon | 2 | 4 | Requires Dodge action. Reaction: attack all creatures in melee range. Damage + extra dice = highest physical damage die. Dodge ends |
| 19 | **Knock 'em Reeling** | Any Martial Weapon | 2 | 5 | On last attack of attack action: if hit, half damage, target gains Reeling condition until end of your next turn |
| 20 | **Arresting Attack** | Piercing Weapon | 2 | 5 | Requires Dodge action. Reaction: if hit, choose one: target speed = 0 until their next turn OR target cannot take attack action until their next turn. No damage. Dodge ends |
| 21 | **Defensive Attack** | Billhook, Spear, Halberd, Javelin, Trident, or Pike | 2 | 5 | Requires Dodge action. Reaction: melee attack with advantage. On hit, extra damage die = highest physical damage die. Dodge ends |
| 22 | **Toppling Attack** | Warhammer, Warpick, Maul, Battleaxe, Greataxe, or Greatsword | 2 | 5 | On melee hit, target STR save (DC 8 + prof bonus + STR mod) or knocked prone. 1 size larger: advantage. 2+ sizes larger: auto-succeed |
| 23 | **Opening Attack** | Bludgeoning Weapon (Heavy) | 2 | 5 | Requires Dodge action. Reaction: if hit, no damage. Roll the Stamina Dice expended for this technique; reduce target's AC by total rolled until end of their next turn. Dodge ends |
| 24 | **Struggle** | Any Martial Weapon | 3 | Special | On "just miss" (miss by 1): add total of active stamina dice to attack roll. Defender can roll active stamina dice to subtract from new total. If new total < AC: miss + Staggered until start of next turn |
| 25 | **Superior Strike** | Any Weapon | 3 | 7 | When making attack roll, roll with advantage |

**Total: 25 Expert Techniques**

### 4. Martial Stances (MM2 lines 310-426)

- **What it does:** Persistent combat modes that grant passive and active benefits, entered as a bonus action. Each stance has 3 ranks unlockable with MMP.
- **Rules:**
  1. Entering a stance costs a **bonus action**
  2. A stance lasts for **1 minute** (or until knocked prone, petrified, incapacitated, or speed reduced to 0)
  3. A creature can enter only **one stance at a time**
  4. A creature can enter a stance a number of times equal to their **proficiency bonus** (per rest/day — not specified)
  5. Most stances create a **damage susceptibility**: attacks of that damage type are made with **advantage** against the creature in the stance
  6. Ranks are cumulative (Rank 2 retains all Rank 1 features)
  7. Rank 3 of each susceptible stance **removes the damage susceptibility**

#### Precision Stance (Slashing Susceptibility)

| Rank | Features |
|------|----------|
| **1** | Once per turn, make a Precision Strike: +1d6 + proficiency bonus extra damage (declare before rolling). Target gains Bleeding condition (1d4 damage/turn start). Bleeding ends if: healed, Medicine Check DC 15 (action, ally within 5 ft), or CON save DC (STR or DEX mod + prof bonus + 6) at end of turn |
| **2** | When rolling Stamina Dice, may reroll one die. Bleeding from Precision Strike increases to 2d4 |
| **3** | Precision Strike damage increases to 2d6 + proficiency bonus. On Precision Strike hit, expend an active stamina die to rend a chosen armor piece. Slashing susceptibility removed |

#### Steady Stance (Piercing Susceptibility)

| Rank | Features |
|------|----------|
| **1** | On melee weapon miss, expend an active Stamina Die and add its roll to attack total. +2 bonus to concentration checks and saving throws against losing stance |
| **2** | When rolling Stamina Dice, may reroll one die once per turn. Crit range with melee weapons increases by 1 |
| **3** | When attempting Superior Strike, may roll an inactive stamina die and add it to TP total. Rerolled missed attack (Rank 1) gains +1d12 damage on hit. Piercing susceptibility removed |

#### Strider Stance (Piercing Susceptibility)

| Rank | Features |
|------|----------|
| **1** | Movement speed +5 ft. Once per turn, may Roll (move 5 ft without opportunity attacks) |
| **2** | Movement speed +5 ft (total +10). Gain one additional Stamina Die while in stance |
| **3** | Gain an additional bonus action. Piercing susceptibility removed |

#### Duelist Stance (Bludgeoning Susceptibility)

| Rank | Features |
|------|----------|
| **1** | Reaction: when enemy within melee weapon range makes a melee attack, make a melee weapon attack against them first |
| **2** | Once per round, target hit with melee weapon suffers Bleeding condition (1d6). Gain one additional Stamina Die while in stance |
| **3** | Gain an additional reaction. Reaction melee attacks (Rank 1) are made with advantage. Bludgeoning susceptibility removed |

#### Dual Wielder Stance (Bludgeoning Susceptibility)

| Rank | Features |
|------|----------|
| **1** | Add skill bonus to off-hand weapon attacks. Only off-hand weapon needs Light property (main weapon cannot have Heavy) |
| **2** | Once per turn, make off-hand attack without expending bonus action |
| **3** | Whenever making a weapon attack, can always make off-hand attack without bonus action. Bludgeoning susceptibility removed |

#### Obstinance Stance (No Susceptibility)

| Rank | Features |
|------|----------|
| **1** | Speed -10 ft. +1 AC and physical saving throws |
| **2** | When hit with melee weapon attack, make opportunity attack as reaction with +1d12 damage on hit |
| **3** | Additional +1 AC and physical saving throws (total +2) |

#### Arcane Resistance Stance (Melee Weapon Damage Susceptibility)

| Rank | Features |
|------|----------|
| **1** | Bonus to saving throws against spell effects equal to proficiency bonus |
| **2** | When hitting a spellcaster with melee weapon, they have disadvantage on resulting concentration checks |
| **3** | Bonus to saving throws against spell effects equals double proficiency bonus. Melee weapon damage susceptibility removed |

### 5. Critical Hits and Lingering Injuries (MM2 lines 64-110)

- **What it does:** Governs what happens when attacks are devastating — critical damage, armor degradation, and lasting bodily harm.

#### Critical Hits

- **Rules:**
  1. A critical hit occurs when the attack roll die shows a number within the creature's **crit range** (usually only Natural 20)
  2. On critical hit, **double the values rolled on all damage dice** for the initial impact
  3. After rolling the critical hit, the attacker rolls a **Crit Confirm**: repeat the attack roll (no advantage/disadvantage) against the original AC
  4. **Crit Confirm success:** proceed to Lingering Injuries before dealing critical damage. On a Natural 20 Crit Confirm, attacker **chooses** which lingering injury to inflict
  5. **Crit Confirm failure:** hit is still critical, but if target wears armor, one piece is **Rended** (loses AC bonus). Target may sacrifice their shield to save the armor piece

#### Lingering Injuries

- **Rules:**
  1. A creature suffers a lingering injury if any of these occur:
     - Takes damage equal to **half hit point maximum in one hit**
     - Hit with an attack while **incapacitated**
     - Hit with a successfully **Crit Confirmed** attack
  2. Injury is determined by rolling **two d12s**

- **First d12: Body Location (12 locations)**

| Roll | Location |
|------|----------|
| 1 | Head |
| 2 | Neck |
| 3 | Chest |
| 4 | Left Shoulder |
| 5 | Right Shoulder |
| 6 | Left Wrist |
| 7 | Right Wrist |
| 8 | Groin |
| 9 | Left Leg |
| 10 | Right Leg |
| 11 | Left Foot |
| 12 | Right Foot |

  3. If the target wears armor at that location, the armor piece is **immediately broken**
  4. If caused by a **Crit Confirm**: the injury only applies if the armor piece was already rended or broken (or absent). If intact armor covers the location, no lingering injury occurs — the armor breaks instead
  5. **Second d12: Injury Type** — varies by body location (see table below)

#### Lingering Injury Distribution by Body Location

| Location | Injury Type Ranges (d12 roll → Injury Letter) |
|----------|-----------------------------------------------|
| 1 - Head | B:1, C:2-4, D:5-7, E:8-10, F:11-12 |
| 2 - Neck | B:1-3, C:4-8, D:9-12 |
| 3 - Chest | A:1-3, B:4, D:5-8, G:9-12 |
| 4 - Left Shoulder | B:1-2, D:3-7, G:8-10, K:11-12 |
| 5 - Right Shoulder | B:1-2, D:3-7, G:8-10, K:11-12 |
| 6 - Left Wrist | B:1, D:2-3, H:4-9, K:10-12 |
| 7 - Right Wrist | B:1, D:2-3, H:4-9, K:10-12 |
| 8 - Groin | B:1, D:3-6, I:7-11, L:12 |
| 9 - Left Leg | B:1-3, D:4-9, I:10-12 |
| 10 - Right Leg | B:1-3, D:4-9, I:10-12 |
| 11 - Left Foot | B:1-3, D:4-7, I:8-12 |
| 12 - Right Foot | B:1-3, D:4-7, I:8-12 |

#### Injury Types (A-L)

| Code | Injury | (!) | Effect |
|------|--------|-----|--------|
| **A** | Mortal Wound | — | Dying; hole in heart. Roll death saves but count no successes. Healable only by 6th-level+ magic (heal, regenerate). Cannot be staggered or frightened |
| **B** | Minor Scar | — | No adverse effect. Cosmetic only |
| **C** | Horrific Scar | (!) | Disadvantage on Persuasion, advantage on Intimidation |
| **D** | Guttering Wound | (!) | Bleeding condition (2d12). Ends if: healed by magic >= amount, tended by Heal action DC = most recent bleeding/initial damage, or natural 20 on death save. Neck injury: cannot speak until healed |
| **E** | Bloody Mouth | — | First time: teeth knocked out — verbal spell component fails on d20 roll of 1. Second time: lose tongue, cannot speak |
| **F** | Lose an Eye | (!) | Disadvantage on sight-based Perception and ranged attack rolls. If no eyes remain: blinded |
| **G** | Break a Rib | (!) | Can take either action or bonus action per turn, not both. Heals with magic or hiatus |
| **H** | Break a Wrist | (!) | Cannot hold items with two hands; can hold only one object. Both wrists broken: no somatic spell components |
| **I** | Break a Leg | (!) | Walking speed halved (unless cane/crutch). Fall prone after Dash. Disadvantage on Dexterity balance checks |
| **J** | Lose a Finger | — | Disadvantage on Sleight of Hand and fine tool Dexterity checks |
| **K** | Lose a Hand | (!) | Cannot hold items with two hands; can hold only one object. Both hands lost: no somatic spell components |
| **L** | Lose a Foot | (!) | Walking speed halved (unless cane/crutch). Fall prone after Dash. Disadvantage on Dexterity balance checks |

- **(!) Injuries:** Injuries marked with (!) give the wounded the **Staggered condition** each round until they receive enough healing to reach their **hit point maximum**.
- **DM determines** if an injury can be suffered twice concurrently (e.g., each hand can typically only be lost once). Reroll if inappropriate.

#### Festering Wound Mechanic (MM2 lines 106-109)

- **Rules:**
  1. If the wounded has **not reached their hit point maximum 8 hours** after receiving a lingering injury, they must make a CON Save DC = (hit point maximum - current hit points)
  2. On failure: receive a **Festering Wound**
  3. On success: re-roll the same save (adjusted for current HP) every hour until at max HP
  4. **Festering Wound effect:** Cannot typically take a Long Rest or Hiatus. Hit point maximum reduced by (22 - CON Score, minimum 1) every 24 hours. If HP max drops to 0, death. Requires serious medical attention to heal (successful hiatus).

#### Recovery Table (for Hiatus healing of Lingering Injuries)

Documented in shared-systems-spec. Cross-reference: `shared-systems-spec.md` → Section 6 (Resting & Recovery) → Recovery Table.

| Lingering Injury | Amount to Heal Per Day | CON Save DC |
|-----------------|----------------------|-------------|
| Horrific Scar | 8 HP/day | DC 10 |
| Bloody Mouth | 12 HP/day | DC 12 |
| Break a Wrist | 10 HP/day | DC 13 |
| Lose a Finger | 8 HP/day per finger | DC 15 |
| Break a Rib | 15 HP/day | DC 15 |
| Break a Leg | 20 HP/day | DC 15 |

### 6. Custom Conditions (MM2 lines 427-448)

- **What it does:** Four new conditions used by the Martial Mastery system.

#### Reeling

- A reeling creature can take **no actions or reactions** (except the reaction to end it on itself)
- Once an attacker has rolled against a reeling target (before result announced), they may expend one active stamina die, rolling it and adding or subtracting the total to/from their attack roll
- Reeling creatures hit with attack rolls that were **subtracted from**, or hit with **critical hits**, become **Staggered** after the attack resolves
- **Ending:** use a reaction to expend an active stamina die

#### Staggered

- When a melee attack hits a staggered target, attacker may expend an active stamina die to reroll their attack as a **crit confirm**. If the reroll hits, the attack is treated as a **critical hit**
- Staggered creatures have their **speed set to 0**
- **Ending:** take the Dodge action and expend an active stamina die (forgoing dodge benefit). Also clears Reeling

#### Bleeding

- Takes damage at the start of each turn equal to an amount specified by the source of the condition
- Creatures are not vulnerable, resistant, or immune unless they have a specific feature granting it

#### Dodging

- Any creature missed by an attack while dodging **regains one expended stamina die**
- Standard 5e Dodge rules also apply: attack rolls against have disadvantage (if attacker visible), DEX saves with advantage. Lost if incapacitated or speed drops to 0

### 7. Armor System

Cross-reference: `shared-systems-spec.md` → Section 4 (Armor System). Fully documented there including the MM2 piece-by-piece AC table, rended/broken states, and weight class rules.

### 8. Shield Types

Cross-reference: `shared-systems-spec.md` → Section 5 (Shield Types). Fully documented there including 5 shield variants with AC bonus, STR requirements, repair rules, and paintability.

---

## Data Model Implications

*Entity-level descriptions only. No SQL DDL — schema design is deferred to Wave 3.*

### New Entities

- **Character MMP Tracker** — Tracks each character's current MMP balance and progressive endeavor training state
  - Properties: character_id, current_mmp, training_die_size (d20/d12/d10/d8/d6/d4/auto — for progressive endeavor tracking)

- **Character Known Techniques** — Tracks which Expert Techniques a character has unlocked
  - Properties: character_id, technique_id
  - Relationship: references a technique reference table

- **Character Known Stances** — Tracks which Martial Stances a character has unlocked and at what rank
  - Properties: character_id, stance_id, current_rank (1-3)
  - Relationship: references a stance reference table

- **Character Lingering Injuries** — Tracks active injuries on a character
  - Properties: character_id, injury_type (A-L), body_location (1-12), acquired_date, is_festering, notes
  - Relationship: character_id → characters table

- **Expert Techniques Reference** — Seed data for all 25 techniques
  - Properties: id, name, prerequisites (weapon types), mmp_cost, tp_cost, effect_description
  - Note: "Special" TP cost for Struggle needs handling (may store as null or -1 with business logic)

- **Martial Stances Reference** — Seed data for all 7 stances with 3 ranks each
  - Properties: id, name, susceptibility_type, rank_1_description, rank_2_description, rank_3_description

### New Properties on Existing Entities

- **characters** (or a related profile table):
  - `mmp_balance` — integer, current MMP available to spend
  - `training_die` — enum/string, current progressive endeavor die size (d20, d12, d10, d8, d6, d4, auto)

- **character_weapons** (already noted in shared-systems-spec):
  - `make` field already flagged as needed

### Entities That May NOT Need Persistence

- **Stamina Dice state** — Active/inactive dice, expended dice count. This is combat-only, resets each turn, and is likely tracked client-side or in-session only. No database table needed unless combat state persistence is required.
- **Conditions (Reeling, Staggered, Bleeding, Dodging)** — Combat-only transient states. Unlikely to need database tracking unless the app tracks live combat state.
- **Stance activation state** — Whether a character is currently in a stance is a combat-only state. The *knowledge* of stances and their ranks is persistent.

### New Reference Data to Seed

- 25 Expert Techniques (names, prerequisites, costs, effects)
- 7 Martial Stances (names, susceptibility types, 3 ranks of effects each)
- 12 Injury Types (A-L, with names, (!) flag, effect descriptions)
- 12 Body Locations (names, armor slot mapping, injury type probability distributions)

### Relationships to Existing Tables

- Character Techniques → characters (character_id)
- Character Stances → characters (character_id)
- Character Injuries → characters (character_id), armor_slots (body location maps to armor slot for broken armor)
- Expert Techniques prerequisites → weapon_templates (weapon types / damage types)
- Lingering Injuries body location → armor_slots (same 12-slot system used in shared-systems-spec)

---

## UI Components Needed

### Pages/Tabs

- **Martial Mastery tab** on character sheet — Shows MMP balance, known techniques, known stances, training status
- **Lingering Injuries panel** — List of active injuries with body location, type, acquired date, festering status

### Interactive Elements

- **Stamina Dice roller** (combat utility) — Roll all dice, display active/inactive, select dice to spend on techniques. This may be a modal or sidebar tool during combat.
- **Technique Point calculator** — Given active dice values, show which techniques are affordable
- **MMP training interface** — Roll progressive endeavor die, track die size progression, spend MMP on unlocks
- **Stance selector** — Choose active stance, show rank features, display susceptibility warning

### Input Forms and Displays

- **Learn Technique form** — Select from available techniques (prerequisites met), spend MMP
- **Learn Stance Rank form** — Select stance, upgrade rank (1 MMP per rank), show cumulative features
- **Injury tracker form** — Roll or input body location + injury type, add to character, track festering timeline
- **MMP transaction log** — History of MMP earned (combat nat 20s, training) and spent (techniques, stances, proficiencies, feats)

---

## Dependencies on Existing Systems

### Affected Tables/Hooks/Components

- **`src/lib/types.ts`** — CharacterWeapon type already exists. Will need new types: CharacterTechnique, CharacterStance, CharacterInjury, MartialMasteryState
- **`character_weapons`** — Techniques reference weapon types; prerequisite checking needs weapon template data
- **`armor_slots`** — Lingering injury body locations map 1:1 to the 12 heavy armor slots. Injuries cause armor broken state.
- **`character_armor`** — Needs `condition` field (from shared-systems-spec) for rended/broken tracking triggered by crits and injuries
- **Proficiency bonus** — Core input for Stamina Dice max, MMP training, bleeding DCs, multiple technique effects. Must be derivable from character data.

### Cross-References to Other Specs

- **shared-systems-spec:**
  - Armor rended/broken states (triggered by crits and lingering injuries documented here)
  - Weapon make deterioration (separate mechanic but interacts with combat)
  - Resting: short rest honing, hiatus injury healing (Recovery Table)
  - Shield types (referenced by Shield Batter, Position Control, Trap Blade, Shield Breaker techniques)
- **vocations-spec (future):**
  - Blacksmith reforges weapons (fixes make degradation from deterioration)
  - Blacksmith repairs broken armor
- **archemancy-spec (future):**
  - Healing magic interacts with lingering injuries (6th-level+ for Mortal Wound, general healing for festering wounds)

### Integration Points

- Combat flow: Critical Hit → Crit Confirm → Lingering Injury → Armor Break → shared-systems armor condition update
- Character sheet: MMP balance, techniques known, stances known, active injuries all display alongside existing character data
- Rest flow: Hiatus triggers lingering injury healing (shared-systems Recovery Table)

---

## Open Questions

1. **Stance usage limit reset:** MM2 says stances can be entered "a number of times equal to proficiency bonus" but does not specify when this resets. Per short rest? Long rest? Hiatus? Needs clarification.

2. **"Skill bonus" in Dual Wielder Rank 1:** MM2 says "add your skill bonus to the off hand weapon attack." What is "skill bonus"? Is this the ability modifier (STR/DEX), proficiency bonus, or something else? EPG uses the same wording.

3. **Esoteric Techniques:** MM2 mentions spending MMP on "Esoteric Techniques" (line 302-304) with a prerequisite of training with someone who knows the technique, but no Esoteric Techniques are listed in the document. Are these a future addition? Are they distinct from Expert Techniques?

4. **Progressive Endeavor die on Natural 1:** MM2 says MMP is earned when rolling a "Natural 1" on the Athletics training check. This seems counterintuitive — typically natural 1s are failures. Is this intentional (representing a "breakthrough through failure") or should it be "when the check succeeds under the progressive endeavor system"? The progressive endeavor paragraph implies success at any die size grants MMP, and the nat 1 line may just mean "rolling the target number" (which is always 1, regardless of die size). Needs clarification.

5. **Technique Point cost for Struggle:** Struggle's TP cost is listed as "Special" — the character adds the total of all active stamina dice to their attack roll. This is not a standard TP expenditure. How should this interact with the stamina dice system? Are the dice expended even on failure?

6. **Eligible Feats:** MM2 mentions spending 5 MMP to gain "one of the eligible Feats" but does not list which feats are eligible. Needs a defined list.

7. **Bleeding condition DC variance:** Precision Stance Rank 1 sets Bleeding end-condition CON save DC = STR/DEX mod + prof bonus + 6. But the generic Bleeding condition (Section 6) has no DC — it just says damage is specified by the source. Are there other sources of Bleeding with different end conditions?

8. **Stamina Dice die type:** MM2 never explicitly states the die type for Stamina Dice (d6? d8? d10?). EPG uses d6 for Technique Dice. If Stamina Dice are also d6, the maximum active die value is 6 (even: 2, 4, 6), making high-TP techniques very hard to achieve with few dice. Needs confirmation of die type.

9. **"Just missed" definition:** The Best Defense and Struggle both reference being "just missed" by an attack. Struggle defines it as "miss by one." Is this also the definition for The Best Defense? Needs confirmation.

10. **Groin location (roll 8) missing from d12 value 2:** The injury table for Groin shows B:1, D:3-6, I:7-11, L:12 — roll value 2 is not covered. Is this a typo? Should D start at 2 instead of 3?

---

## Conflict Resolution Log

### Technique Dice vs Stamina Dice (Fundamental Mechanic Change)

| Topic | EPG Says | MM2 Says | This Spec Uses |
|-------|----------|----------|---------------|
| **System name** | Technique Dice | Stamina Dice | **MM2: Stamina Dice** |
| **Die type** | d6 (explicitly stated) | Not explicitly stated | **MM2** (flagged as Open Question #8) |
| **Activation** | Roll prof-bonus d6s; count **number of even results** = Technique Points (binary: each die is 0 or 1 TP) | Roll all dice; **odd = inactive, even = active**; active dice form a VALUE pool | **MM2: value-based pool** — fundamentally different. EPG counts evens as discrete points; MM2 uses the actual numeric values |
| **Spending** | Spend N Technique Points (reduce dice count next turn by N) | Select active dice whose VALUES sum to TP cost; those dice are expended | **MM2: value-sum spending** |
| **Recovery** | Reduce dice by points spent; +1 die if no damage taken | Recover 1 expended die per turn if no damage taken | **MM2** |
| **Failure** | Cannot perform technique if insufficient TP | Gain Reeling condition | **MM2: adds Reeling penalty** |

### MMP Acquisition

| Topic | EPG Says | MM2 Says | This Spec Uses |
|-------|----------|----------|---------------|
| **Combat earning** | Critical Hit on attack roll (any crit) | **Natural 20** on attack roll (specifically nat 20) | **MM2: Natural 20 only** |
| **Training earning** | Natural 20 on Athletics Check | **Natural 1** on Athletics Check (progressive endeavor) | **MM2: Natural 1 with progressive endeavor** |
| **Training system** | Simple: roll d20, need nat 20 | Progressive endeavor: d20 → d12 → d10 → d8 → d6 → d4 → auto | **MM2: progressive endeavor** |

### MMP Spending Costs

| Topic | EPG Says | MM2 Says | This Spec Uses |
|-------|----------|----------|---------------|
| **Expert Technique cost** | 1 MMP per TP cost of the technique (so a 3 TP technique costs 3 MMP) | Listed individually per technique (1-3 MMP, independent of TP cost) | **MM2: individual costs** |
| **Feat cost** | 3 MMP | 5 MMP | **MM2: 5 MMP** |
| **Esoteric Techniques** | Not mentioned | Listed as MMP expenditure option (requires trainer) | **MM2** |

### Expert Technique TP Costs

| Technique | EPG TP Cost | MM2 TP Cost | This Spec Uses |
|-----------|-------------|-------------|---------------|
| Evading Attack | 1 | 3 | **MM2: 3** |
| Longer Attack | 1 | 3 | **MM2: 3** |
| Lunge Attack | 1 | 4 | **MM2: 4** |
| Parry | 1 | 3 | **MM2: 3** |
| Pinning Attack | 1 | 2 | **MM2: 2** |
| Puncture Attack | 1 | 3 | **MM2: 3** |
| Push Attack | 1 | 3 | **MM2: 3** |
| Slash Attack | 1 | 3 | **MM2: 3** |
| Slowing Attack | 1 | 3 | **MM2: 3** |
| Snatch | 1 | 3 | **MM2: 3** |
| Tripping Attack | 1 | 3 | **MM2: 3** |
| Arresting Attack | 2 | 5 | **MM2: 5** |
| Defensive Attack | 2 | 5 | **MM2: 5** |
| Opening Attack | 2 | 5 | **MM2: 5** |
| Spin Attack | 2 | 4 | **MM2: 4** |
| Toppling Attack | 2 | 5 | **MM2: 5** |
| Superior Strike | 3 | 7 | **MM2: 7** |

*Note: TP costs are universally higher in MM2 because the spending mechanic changed — EPG counted even dice (0 or 1 per die), while MM2 uses die values (2, 4, or 6 per die). Higher TP costs are needed to balance the higher resource pool.*

### New Techniques in MM2 (not in EPG)

Shield Batter, Position Control, Trap Blade, Shield Breaker, Whittle Away, The Best Defense, Knock 'em Reeling, Struggle — these 8 techniques are new in MM2 with no EPG equivalent.

### Expert Technique Effect Changes

| Technique | EPG Effect | MM2 Effect | Difference |
|-----------|-----------|-----------|------------|
| **Evading Attack** | Bonus action to prepare, lasts until end of turn, ignores shield/arm armor/weapons AC | No action type specified, ignores shield/weapons AC | **MM2 removes arm armor from bypass, simplifies action economy** |
| **Snatch** | Attack roll DC 12 | Attack roll DC 16 | **MM2: harder DC** |
| **Opening Attack** | Roll "Technique Dice spent" to reduce AC | Roll "Stamina Dice expended" to reduce AC | **MM2: terminology update, mechanically equivalent under new system** |

### Lingering Injuries

| Topic | EPG Says | MM2 Says | This Spec Uses |
|-------|----------|----------|---------------|
| **Injury determination** | Single d12 → 12 injury types (flat list) | Two d12s: first = body location (12 locations), second = injury type per location (A-L with varying probabilities) | **MM2: two-roll system** — far more granular |
| **Armor interaction** | Injury → permanent -1 to nearest armor piece | Injury → armor piece at location immediately broken | **MM2: more severe** |
| **Crit Confirm + armor** | Not specified | Crit Confirm only causes injury if armor at location is already rended/broken/absent | **MM2: armor provides additional protection layer** |
| **Festering Wound** | HP max reduced by level per 24 hours | HP max reduced by (22 - CON Score, min 1) per 24 hours | **MM2: CON-based reduction** |
| **Stagger from injuries** | Not mentioned | (!) injuries cause Staggered each round until HP max reached | **MM2: new mechanic** |

### Martial Stances — Steady Stance Rank 1

| Topic | EPG Says | MM2 Says | This Spec Uses |
|-------|----------|----------|---------------|
| **Miss reroll** | Expend a Technique Point to reroll as reaction | Expend an active Stamina Die, adding its roll to total | **MM2: adds die value to existing roll rather than full reroll** |

### Martial Stances — Steady Stance Rank 3

| Topic | EPG Says | MM2 Says | This Spec Uses |
|-------|----------|----------|---------------|
| **Superior Strike enhancement** | Treat an odd Technique Die as even (still costs 3 fewer dice next turn) | Roll an inactive stamina die and add to TP total | **MM2: different mechanism, same intent (more resources for Superior Strike)** |

### Martial Stances — Duelist Stance Rank 2

| Topic | EPG Says | MM2 Says | This Spec Uses |
|-------|----------|----------|---------------|
| **Extra dice** | Gain additional Technique Die | Gain additional Stamina Die | **MM2: terminology update** |
| **Dice reroll** | May reroll one Technique Die once per turn | Not mentioned at Rank 2 | **MM2: removes Rank 2 reroll** |

### Martial Stances — Strider Stance Rank 2

| Topic | EPG Says | MM2 Says | This Spec Uses |
|-------|----------|----------|---------------|
| **Extra dice** | Gain additional Technique Die | Gain additional Stamina Die | **MM2: terminology update** |

### Martial Stances Duration

| Topic | EPG Says | MM2 Says | This Spec Uses |
|-------|----------|----------|---------------|
| **Duration** | Up to 10 rounds | 1 minute | **MM2: "1 minute"** (functionally equivalent to 10 rounds in most cases, but MM2 wording is authoritative) |

### Conditions

| Topic | EPG Says | MM2 Says | This Spec Uses |
|-------|----------|----------|---------------|
| **Reeling** | Not defined | Full condition definition (no actions/reactions, attackers can modify rolls, leads to Staggered) | **MM2: new condition** |
| **Staggered** | Not defined | Full condition definition (speed 0, attackers can crit-confirm, dodge to clear) | **MM2: new condition** |
| **Bleeding** | Not defined as standalone condition | Standalone condition (damage per turn from source, special immunity rules) | **MM2: new condition** |
| **Dodging** | Not defined | Regain expended stamina die when missed by attack while dodging | **MM2: new condition** |

### Precision Stance Rank 1 — Bleeding End Condition

| Topic | EPG Says | MM2 Says | This Spec Uses |
|-------|----------|----------|---------------|
| **CON save DC** | DC Constitution Saving Throw (no formula given) | DC = STR or DEX mod + proficiency bonus + 6 | **MM2: explicit formula** |

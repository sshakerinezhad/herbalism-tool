# Knights of Belyar - Planning Document

> A comprehensive character tracking system for the Knights of Belyar homebrew setting in the world of Iridia.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Principles](#architecture-principles)
3. [Character Data Model](#character-data-model)
4. [Armor System](#armor-system)
5. [Skills System](#skills-system)
6. [Reference Data](#reference-data)
7. [Database Schema](#database-schema)
8. [UI/UX Structure](#uiux-structure)
9. [Implementation Phases](#implementation-phases)
10. [Open Questions](#open-questions)

---

## Overview

### What is a Knight of Belyar?

A Knight of Belyar is a warrior sworn to taming the wild lands surrounding the Vacovian Ocean. Knights travel from place to place, earning coin and bettering themselves, until they meet their end at the hands of some gruesome monster.

### App Purpose

This app will serve as:
- **Character sheet** for tracking stats, HP, AC, equipment
- **Inventory manager** for armor, weapons, items, and money
- **Downtime activity hub** for foraging and vocation-specific activities
- **Vocation toolkit** (Herbalism brewing, future: Blacksmithing, Alchemy, etc.)

### Key Constraint

- **1 character per user account**
- Character deletion happens on death (with confirmation safeguards)

---

## Architecture Principles

> *"Clean, smart, best practice, holistic. No spaghetti code."*

### File Organization

```
src/
├── app/                    # Next.js pages (App Router)
│   ├── (auth)/            # Auth-required routes (grouped)
│   │   ├── character/     # Character summary (new home)
│   │   ├── equipment/     # Equipment management
│   │   └── downtime/      # Downtime activities
│   │       ├── foraging/  # Foraging (all users)
│   │       └── herbalism/ # Herbalism (vocation-gated)
│   ├── create-character/  # Character creation wizard
│   └── login/             # Auth pages
├── components/            # Reusable UI components
│   ├── character/         # Character-specific components
│   ├── equipment/         # Armor, weapons, inventory components
│   ├── ui/                # Generic UI (buttons, inputs, modals)
│   └── layout/            # Navigation, headers, etc.
├── lib/                   # Business logic & utilities
│   ├── db/                # Database operations (organized by entity)
│   │   ├── characters.ts
│   │   ├── armor.ts
│   │   ├── weapons.ts
│   │   ├── skills.ts
│   │   └── herbalism.ts
│   ├── calculations/      # Pure functions for game math
│   │   ├── ac.ts          # AC calculation
│   │   ├── stats.ts       # Modifiers, HP, etc.
│   │   └── proficiency.ts # Proficiency bonus, skill checks
│   ├── constants/         # Static data (races, classes, etc.)
│   ├── types/             # TypeScript type definitions
│   └── hooks/             # Custom React hooks
└── contexts/              # React contexts (auth, character)
```

### Code Principles

1. **Single Responsibility**
   - Each file/function does ONE thing well
   - Database operations separate from UI logic
   - Calculations in pure functions (easy to test)

2. **Type Safety**
   - Strict TypeScript throughout
   - Database types generated from schema
   - No `any` types (use `unknown` if truly needed)

3. **Consistent Patterns**
   - All DB operations return `{ data, error }` pattern
   - All forms use controlled components
   - All async operations have loading/error states

4. **DRY (Don't Repeat Yourself)**
   - Shared components for common UI patterns
   - Shared hooks for common data fetching
   - Constants for magic numbers/strings

5. **Separation of Concerns**
   ```
   Page Component (UI + layout)
        ↓
   Custom Hook (data fetching + state)
        ↓
   DB Functions (Supabase queries)
        ↓
   Database (Supabase)
   ```

6. **Error Handling**
   - Graceful degradation
   - User-friendly error messages
   - Console logging for debugging (dev only)

### Database Principles

1. **Normalized where sensible** - Reference tables for static data
2. **Denormalized for performance** - Calculated fields stored when expensive
3. **RLS everywhere** - Row-level security on all tables
4. **Consistent naming** - `snake_case` for columns, descriptive names

### Component Principles

1. **Composition over inheritance**
2. **Props for configuration, children for content**
3. **Collocate related code** - Styles, types, helpers near components
4. **Accessible by default** - Proper ARIA, keyboard navigation

---

## Character Data Model

### Identity

| Field | Type | Notes |
|-------|------|-------|
| name | text | Character name |
| race | enum | See [Races](#races) |
| subrace | text | Cultural group for humans, subrace for others |
| class | text | Starting: Fighter, Blood Hunter, Ranger, Rogue, Barbarian. Others unlocked via DM |
| level | int | Manually updated, determines proficiency bonus |
| background | enum | `native_knight` or `initiate` |
| previous_profession | text | Only for Initiates |
| order | enum | See [Knight Orders](#knight-orders) |
| vocation | enum | Optional, see [Vocations](#vocations) |
| feat | text | If no vocation selected (DM approved) |
| touched_by_fate | text | Optional DM-assigned rare lineage |
| appearance | text | Physical description |
| artwork_url | text | Optional character portrait |

### Statistics (7 Core Stats)

| Stat | Abbr | Range | Notes |
|------|------|-------|-------|
| Strength | STR | 1-20+ | Standard ability score |
| Dexterity | DEX | 1-20+ | Standard ability score |
| Constitution | CON | 1-20+ | Standard ability score |
| Intelligence | INT | 1-20+ | Standard ability score |
| Wisdom | WIS | 1-20+ | Standard ability score |
| Charisma | CHA | 1-20+ | Standard ability score |
| Honor | HON | 8+ | **Always starts at 8**, only increased by DM award |

### Combat Stats

| Field | Type | Calculation |
|-------|------|-------------|
| hp_max | int | `26 + (4 × CON modifier)` + custom_hp_modifier |
| hp_current | int | User-editable, ≤ hp_max |
| custom_hp_modifier | int | For special circumstances (default 0) |
| hit_dice_max | int | `2 + proficiency_bonus` |
| hit_dice_current | int | User-editable, ≤ hit_dice_max |
| ac | int | **Calculated** from armor system |

### Money

| Currency | Abbr |
|----------|------|
| Platinum | PP |
| Gold | GP |
| Silver | SP |
| Copper | CP |

**Starting money** (rolled): 1d12 GP, 4d8 SP, 8d4 CP

---

## Armor System

### The 12 Body Slots

The body has 12 armor slots. Different armor types (Light/Medium/Heavy) have different pieces available for each slot.

| # | Slot Name | Light | Medium | Heavy |
|---|-----------|-------|--------|-------|
| 1 | Head | Helm (+2) | Helm (+2) | Helm (+2) |
| 2 | Neck | — | — | Gorget (+2) |
| 3 | Chest | Padded/Hide (+1) | Breastplate (+2) | Breastplate (+2) |
| 4 | Left Shoulder | — | — | Left Pauldron (+2) |
| 5 | Right Shoulder | — | — | Right Pauldron (+2) |
| 6 | Left Hand | Left Bracer (+1) | Left Bracer (+1) | Left Gauntlet (+2) |
| 7 | Right Hand | Right Bracer (+1) | Right Bracer (+1) | Right Gauntlet (+2) |
| 8 | Groin | — | — | Tasset (+2) |
| 9 | Left Knee | — | — | Left Poleyn (+1) |
| 10 | Right Knee | — | — | Right Poleyn (+1) |
| 11 | Left Foot | Left Greave (+1) | Left Greave (+1) | Left Greave (+1) |
| 12 | Right Foot | Right Greave (+1) | Right Greave (+1) | Right Greave (+1) |

### Armor Level Determination

Your **armor level** is determined by the **heaviest piece** you're wearing:
- Wearing ANY heavy piece → Heavy armor mode
- Wearing medium (no heavy) → Medium armor mode
- Wearing only light → Light armor mode

### AC Calculation

| Armor Level | Base AC | Piece Bonuses | DEX Modifier | Requirements |
|-------------|---------|---------------|--------------|--------------|
| Light | 6 | Sum of equipped | Full DEX mod | None |
| Medium | 8 | Sum of equipped | DEX mod (max +2) | STR 13 |
| Heavy | 0 | Sum of equipped | None | STR 15, disadvantage on Stealth |

**Example**: Full heavy armor = 0 + 20 (all pieces) = AC 20

### Armor Properties

Each armor piece can have:
- **Material** (mundane, special)
- **Magical properties** (enchantments)
- **Mechanical modifications** (from Blacksmith)
- **Runes** (from Runeseeker)

---

## Skills System

### Skill List by Stat

| Stat | Skills |
|------|--------|
| STR | Athletics |
| DEX | Acrobatics, Initiative, Sleight of Hand, Stealth |
| CON | Fortitude, Recovery |
| INT | Arcana, Geography, History, Nature, Religion |
| WIS | Animal Handling, Healing, Insight, Perception, Survival |
| CHA | Deception, Intimidation, Persuasion, Performance |
| HON | Chivalry, Favor, Courtesy, Notions, Poetry |

**Total: 27 skills**

### Proficiency & Expertise

- **Background** grants 2 skill proficiencies
- **Knight Order** grants expertise in INT checks about their creature type
- **Class features** may grant additional proficiencies

---

## Reference Data

### Races

| Race | Subraces/Cultures | Notes |
|------|-------------------|-------|
| Human | Yornic, Rolla, Kordian, Lu'Ski, Evarni, Icinni, Joton | Most common |
| High Elf | — | Live among Rolla, not hated |
| Dwarf | — | Well-loved, common |
| Gnome | — | Integrated in human societies |
| Halfling | — | Integrated in human societies |
| Goliath | — | Giant-kin, mountainous regions |
| Firbolg | — | Giant-kin, often inter-marry with Goliaths |
| Orc | — | Seafarers from Estierian Kingdoms |
| Half-Orc | — | Seafarers from Estierian Kingdoms |
| Goblin | Various types | "They are cool" |

### Classes

**Starting Classes** (available at character creation):

| Class | Background Req | Skill Proficiencies | Total with Background |
|-------|---------------|---------------------|----------------------|
| Barbarian | None | Any 2 | 4 |
| Blood Hunter | Native-Knight | Any 3 | 5 |
| Fighter | None | Any 2 | 4 |
| Ranger | None | Any 3 | 5 |
| Rogue | None | Any 4 | 6 |

*All characters get 2 proficiencies from background + class proficiencies*

**Secret Classes** (unlocked via DM):
- Stored as free text, awarded during gameplay
- Proficiency count determined by DM

### Backgrounds

| Background | Description | Blood Hunter? |
|------------|-------------|---------------|
| Native-Knight | Born/adopted into Knights, enhanced by charnel magics | ✅ Yes |
| Initiate | Joined as adult, had previous profession | ❌ No |

### Knight Orders

| Order | Creature Focus | Notable Traits |
|-------|---------------|----------------|
| Fiendwreathers | Fiends (devils, demons) | Golden weapons, hand-signs, experts on Demonrot |
| Ghastbreakers | Undead (ghouls, ghosts) | Smell of garlic, use Skein drug, often wealthy |
| Beastwarks | Monstrosities, Dragons | Most common, may have cultivated lycanthropy |
| Angelflayers | Celestials (angels) | Work for free, blood sacrifice, distrusted, long-lived |
| Dreamwalkers | Somni (mind creatures) | New order, venture into silver dreams, not well regarded |

### Vocations

| Vocation | Description | In App? |
|----------|-------------|---------|
| Alchemist | Brew potions from monster organs | Future |
| Blacksmith | Craft weapons, modify equipment | Future |
| Herbalist | Brew elixirs from plants/herbs | ✅ Existing |
| Priest/Priestess | Divine boons and blessings | Future |
| Runeseeker | Giant magic, rune crafting | Future |
| Scholar | Knowledge gathering, languages | Future |
| Spellscribe | Craft spell scrolls | Future |
| *(None - Feat)* | Take a feat instead | — |

---

## Database Schema

### New Tables

```sql
-- Core character data
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE, -- 1:1 with user
  
  -- Identity
  name TEXT NOT NULL,
  race TEXT NOT NULL,
  subrace TEXT, -- Culture for humans, subrace for others
  class TEXT NOT NULL,
  level INT NOT NULL DEFAULT 1,
  background TEXT NOT NULL, -- 'native_knight' or 'initiate'
  previous_profession TEXT, -- Only for initiates
  knight_order TEXT NOT NULL,
  vocation TEXT, -- NULL if they took a feat
  feat TEXT, -- NULL if they have a vocation
  touched_by_fate TEXT, -- DM-assigned lineage
  
  -- Stats
  str INT NOT NULL DEFAULT 10,
  dex INT NOT NULL DEFAULT 10,
  con INT NOT NULL DEFAULT 10,
  int INT NOT NULL DEFAULT 10,
  wis INT NOT NULL DEFAULT 10,
  cha INT NOT NULL DEFAULT 10,
  hon INT NOT NULL DEFAULT 8, -- Always starts at 8
  
  -- Combat
  hp_current INT NOT NULL,
  hp_custom_modifier INT NOT NULL DEFAULT 0,
  hit_dice_current INT NOT NULL,
  
  -- Money
  platinum INT NOT NULL DEFAULT 0,
  gold INT NOT NULL DEFAULT 0,
  silver INT NOT NULL DEFAULT 0,
  copper INT NOT NULL DEFAULT 0,
  
  -- Flavor
  appearance TEXT,
  artwork_url TEXT,
  
  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reference: Armor slots definition
CREATE TABLE armor_slots (
  id SERIAL PRIMARY KEY,
  slot_order INT NOT NULL,
  name TEXT NOT NULL, -- 'head', 'neck', 'chest', etc.
  display_name TEXT NOT NULL, -- 'Head', 'Neck', 'Chest', etc.
  
  -- Which armor types can use this slot
  light_available BOOLEAN NOT NULL DEFAULT FALSE,
  medium_available BOOLEAN NOT NULL DEFAULT FALSE,
  heavy_available BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Piece names per type
  light_piece_name TEXT, -- 'Helm', 'Padded Armor', etc.
  medium_piece_name TEXT,
  heavy_piece_name TEXT,
  
  -- AC bonuses per type
  light_bonus INT,
  medium_bonus INT,
  heavy_bonus INT
);

-- Character's equipped armor
CREATE TABLE character_armor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID REFERENCES characters NOT NULL,
  slot_id INT REFERENCES armor_slots NOT NULL,
  armor_type TEXT NOT NULL, -- 'light', 'medium', 'heavy'
  
  -- Custom piece details
  custom_name TEXT, -- For named/special pieces
  material TEXT,
  is_magical BOOLEAN NOT NULL DEFAULT FALSE,
  properties JSONB, -- Enchantments, runes, modifications
  notes TEXT,
  
  UNIQUE(character_id, slot_id) -- One piece per slot
);

-- Reference: Skills
CREATE TABLE skills (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  stat TEXT NOT NULL, -- 'str', 'dex', 'con', 'int', 'wis', 'cha', 'hon'
  display_order INT NOT NULL
);

-- Character's skill proficiencies
CREATE TABLE character_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID REFERENCES characters NOT NULL,
  skill_id INT REFERENCES skills NOT NULL,
  is_proficient BOOLEAN NOT NULL DEFAULT FALSE,
  is_expertise BOOLEAN NOT NULL DEFAULT FALSE, -- For order-specific expertise
  
  UNIQUE(character_id, skill_id)
);

-- Character's weapons
CREATE TABLE character_weapons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID REFERENCES characters NOT NULL,
  name TEXT NOT NULL,
  weapon_type TEXT, -- 'martial', 'simple', etc.
  material TEXT NOT NULL DEFAULT 'Steel',
  damage_dice TEXT, -- '1d8', '2d6', etc.
  damage_type TEXT, -- 'slashing', 'piercing', 'bludgeoning'
  properties JSONB, -- Versatile, two-handed, reach, etc.
  attachments JSONB, -- Blacksmith modifications
  is_magical BOOLEAN NOT NULL DEFAULT FALSE,
  is_equipped BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT
);

-- Character's general inventory
CREATE TABLE character_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID REFERENCES characters NOT NULL,
  name TEXT NOT NULL,
  category TEXT, -- 'scroll', 'potion', 'gear', 'vocation_kit', etc.
  quantity INT NOT NULL DEFAULT 1,
  properties JSONB,
  is_quick_access BOOLEAN NOT NULL DEFAULT FALSE, -- Pinned for easy access
  notes TEXT
);
```

### Modified Existing Tables

The herbalism tables (`user_inventory`, `user_brewed`, `user_recipes`) will need:
- Change `user_id` to `character_id` (or add character_id alongside)
- Migration path for existing data

---

## UI/UX Structure

### Navigation

```
┌─────────────────────────────────────────────────────────────┐
│  ⚔️ KNIGHTS OF BELYAR                    [Character Name]  │
├─────────────────────────────────────────────────────────────┤
│  [Character]  [Equipment]  [Downtime]  [Settings]          │
└─────────────────────────────────────────────────────────────┘
```

### Page: Character (Main)

The primary view showing all essential character info:

```
┌─────────────────────────────────────────────────────────────┐
│ CHARACTER NAME                                              │
│ Level X Human (Yornic) Fighter · Native-Knight              │
│ Order of Beastwarks · Herbalist                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐   ┌─────────────────────────────────────┐ │
│  │  PORTRAIT   │   │  HP: ████████░░ 28/34               │ │
│  │             │   │  AC: 14                              │ │
│  │             │   │  Hit Dice: ●●●○ 3/4                 │ │
│  └─────────────┘   └─────────────────────────────────────┘ │
│                                                             │
│  ┌── STATS ──────────────────────────────────────────────┐ │
│  │ STR  DEX  CON  INT  WIS  CHA  HON                     │ │
│  │ 16   14   14   10   12   8    8                       │ │
│  │ +3   +2   +2   +0   +1   -1   -1                      │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌── ARMOR (Heavy) ──────────────────────────────────────┐ │
│  │ [Visual representation of 12 slots]                   │ │
│  │ Base 0 + Pieces 14 + DEX 0 = AC 14                    │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌── WEAPONS ────────────────────────────────────────────┐ │
│  │ ⚔️ Steel Longsword (1d8 slashing)                     │ │
│  │ 🗡️ Silver Dagger (1d4 piercing)                       │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌── QUICK EQUIPMENT ────────────────────────────────────┐ │
│  │ 🧪 Healing Elixir (2)  📜 Scroll of Identify         │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌── MONEY ──────────────────────────────────────────────┐ │
│  │ 💰 0 PP · 12 GP · 18 SP · 24 CP                       │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Page: Equipment

Full inventory management:
- Armor (with 12-slot visual)
- Weapons
- Items (with quick-access toggle)
- Vocation items (herb inventory for Herbalists, etc.)

### Page: Downtime

```
┌─────────────────────────────────────────────────────────────┐
│ DOWNTIME ACTIVITIES                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌── GENERAL ────────────────────────────────────────────┐ │
│  │ 🌿 Foraging           [Available to all]              │ │
│  │ 🏕️ Rest & Recovery    [Future]                        │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌── YOUR VOCATION: HERBALIST ───────────────────────────┐ │
│  │ 🌿 Herb Inventory                                     │ │
│  │ ⚗️ Brewing                                            │ │
│  │ 📖 Recipes                                            │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Character Creation Wizard

Step-by-step guided flow:

1. **Name & Appearance** - Name, optional portrait
2. **Race** - Select race (with lore snippets)
3. **Background** - Native-Knight or Initiate (+ previous profession)
4. **Class** - Select starting class
5. **Order** - Select Knight Order
6. **Stats** - Point buy or input (custom calculator)
7. **Skills** - Select proficiencies (2 from background)
8. **Vocation** - Select vocation or feat
9. **Equipment** - Starting gear (armor to AC 14, weapons, money roll)
10. **Review & Create**

---

## Implementation Phases

### Phase 0: Planning ✅ (Complete)
- [x] Document requirements
- [x] Design data model
- [x] Review and refine with user
- [x] Finalize schema

### Phase 1: Database & Foundation
- [ ] Create new Supabase tables (characters, armor_slots, skills, etc.)
- [ ] Seed reference data (skills, armor slots, races, classes, orders, vocations)
- [ ] Set up RLS policies for new tables
- [ ] Create TypeScript types for all new entities
- [ ] Create database utility functions (CRUD for characters)

### Phase 2: Auth & Guest Mode Removal
- [ ] Remove guest mode from auth context
- [ ] Remove "Continue as Guest" UI
- [ ] Add character existence check to app flow
- [ ] Create "no character" redirect logic
- [ ] Update login page (signup required)

### Phase 3: Character Creation Wizard
- [ ] Step 1: Name & Appearance
- [ ] Step 2: Race selection (with lore)
- [ ] Step 3: Background (Native-Knight / Initiate)
- [ ] Step 4: Class selection
- [ ] Step 5: Knight Order selection
- [ ] Step 6: Stats input/calculator
- [ ] Step 7: Skills selection (2 background + class)
- [ ] Step 8: Vocation or Feat
- [ ] Step 9: Equipment (armor presets + custom, weapons, money roll)
- [ ] Step 10: Review & Create
- [ ] Migrate existing herb data on character creation

### Phase 4: Character Summary Page (New Home)
- [ ] Main character display (identity, portrait)
- [ ] Stats & modifiers display
- [ ] Skills list with proficiency indicators
- [ ] HP bar & Hit Dice tracker
- [ ] AC display with armor breakdown
- [ ] Equipped weapons
- [ ] Quick-access equipment
- [ ] Money display & editor

### Phase 5: Equipment Management
- [ ] Full armor slot editor (12-slot visual)
- [ ] AC calculation engine (all rules)
- [ ] Armor piece CRUD (add/edit/remove)
- [ ] Weapon management
- [ ] General inventory
- [ ] Quick-access toggle for items

### Phase 6: Downtime & Herbalism Integration
- [ ] New navigation structure (Character | Equipment | Downtime)
- [ ] Downtime hub page
- [ ] Move Foraging to Downtime (available to all)
- [ ] Herbalism vocation section (if vocation = Herbalist)
  - [ ] Herb inventory (migrated from old system)
  - [ ] Brewing
  - [ ] Recipes
- [ ] "Add to equipment" for brewed items

### Phase 7: Database Migration & Cleanup
- [ ] Rename user_inventory → character_herbs
- [ ] Rename user_brewed → character_brewed  
- [ ] Rename user_recipes → character_recipes
- [ ] Migrate all existing data to character_id
- [ ] Remove old user_id columns
- [ ] Clean up profiles table (remove herbalism fields)
- [ ] Update all queries to use character-based tables

### Phase 8: Polish & Future
- [ ] Character deletion flow (with safeguards)
- [ ] Skill check calculator/roller
- [ ] Export character sheet (PDF?)
- [ ] Level up flow
- [ ] Groundwork for other vocations (Alchemist, Blacksmith, etc.)

---

## Open Questions

### Resolved ✅

1. ~~HP calculation~~ → `26 + (4 × CON mod)` + optional custom modifier
2. ~~Level mechanics~~ → Just a number, determines proficiency bonus
3. ~~Currency~~ → Standard D&D (CP, SP, GP, PP)
4. ~~Starting armor~~ → Pieces totaling AC 14 (including DEX)
5. ~~Character creation flow~~ → Guided wizard
6. ~~Multi-character~~ → 1:1, character deleted on death

7. ~~Armor selection~~ → Presets + custom picker. Grey out options based on STR (heavy needs 15, medium needs 13)
8. ~~Skill proficiencies~~ → Choose any 2 from all 27 + class proficiencies
9. ~~Initiative~~ → Yes, it's a proficiency-able DEX skill
10. ~~Guest profiles~~ → **Removed**. Must sign up to use the app. Character required.
11. ~~Herb data~~ → Tied to character. Existing data migrates when character is created.

12. ~~Class proficiencies~~ → See table below
13. ~~Order expertise~~ → Display as note only, no mechanical tracking

### All Questions Resolved ✅

---

## Database Migration Strategy

### Key Changes

The app is transitioning from:
- **Before**: User → Profile → Herb Inventory (guest mode allowed)
- **After**: User → Character → Everything (no guests, character required)

### Migration Plan

#### Phase 1: Schema Changes

```sql
-- 1. Add character requirement
-- The characters table already has UNIQUE constraint on user_id (1:1)

-- 2. Migrate herbalism tables to use character_id
ALTER TABLE user_inventory ADD COLUMN character_id UUID REFERENCES characters;
ALTER TABLE user_brewed ADD COLUMN character_id UUID REFERENCES characters;
ALTER TABLE user_recipes ADD COLUMN character_id UUID REFERENCES characters;

-- 3. After migration, make character_id NOT NULL and drop user_id
-- (Do this after all data is migrated)
```

#### Phase 2: Data Migration

For existing users with herb data:
1. User logs in
2. If no character exists → forced to Character Creation Wizard
3. On character creation, existing `user_inventory`, `user_brewed`, `user_recipes` rows are updated with `character_id`
4. App now works with character-based queries

#### Phase 3: Remove Guest Mode

**Files to modify:**

| File | Changes |
|------|---------|
| `src/lib/profiles.ts` | Remove `GUEST_ID_KEY`, `getGuestId()`, guest ID fallback logic |
| `src/lib/profile.tsx` | Remove `getGuestId` import and usage, require authenticated user |
| `src/lib/auth.tsx` | Remove localStorage guest ID cleanup in `signOut()` |
| `src/app/login/page.tsx` | Remove "Continue as guest" link |
| `src/app/page.tsx` | Remove guest mode warning banner |
| `src/app/profile/page.tsx` | Remove guest mode display section |
| `README.md` | Update documentation to reflect no guest mode |
| `docs/ARCHITECTURE.md` | Remove guest vs authenticated user section |

**localStorage keys to remove:**
- `herbalism-guest-id`

#### Phase 4: Enforce Character Requirement

New app flow:
1. User visits app → Must be logged in (redirect to login if not)
2. Logged in but no character → Redirect to Character Creation Wizard
3. Has character → Normal app access

### Tables Summary

| Current Table | Change |
|--------------|--------|
| `profiles` | Keep for account-level data (username, settings). Remove herbalism-specific fields (`is_herbalist`, `herbalism_modifier`, `foraging_modifier`, `max_foraging_sessions`) - these move to character |
| `user_inventory` | Rename to `character_herbs`, change `user_id` to `character_id` |
| `user_brewed` | Rename to `character_brewed`, change `user_id` to `character_id` |
| `user_recipes` | Rename to `character_recipes`, change `user_id` to `character_id` |

### New Tables

| Table | Purpose |
|-------|---------|
| `characters` | Core character data (identity, stats, combat, money) |
| `armor_slots` | Reference data for the 12 body slots |
| `character_armor` | Equipped armor pieces |
| `skills` | Reference data for all 27 skills |
| `character_skills` | Skill proficiencies and expertise |
| `character_weapons` | Owned/equipped weapons |
| `character_items` | General inventory (scrolls, potions, gear) |

---

## Appendix

### Proficiency Bonus by Level

| Level | Proficiency Bonus |
|-------|-------------------|
| 1-4 | +2 |
| 5-8 | +3 |
| 9-12 | +4 |
| 13-16 | +5 |
| 17-20 | +6 |

### AC Calculation Examples

**Example 1: Full Light Armor, DEX 16 (+3)**
- Base: 6
- Pieces: Helm (+2) + Padded (+1) + L.Bracer (+1) + R.Bracer (+1) + L.Greave (+1) + R.Greave (+1) = +7
- DEX: +3
- **Total: 6 + 7 + 3 = AC 16**

**Example 2: Mixed (Medium breastplate + Light bracers), DEX 14 (+2)**
- Armor level: Medium (heaviest piece)
- Base: 8
- Pieces: Breastplate (+2) + L.Bracer (+1) + R.Bracer (+1) = +4
- DEX: +2 (capped)
- **Total: 8 + 4 + 2 = AC 14**

**Example 3: Full Heavy Armor, STR 16**
- Base: 0
- Pieces: All 12 pieces = +20
- DEX: +0 (none added)
- **Total: 0 + 20 = AC 20**


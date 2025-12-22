# Database Schema Reference

Quick reference for the Supabase PostgreSQL database.

**Supabase URL:** `https://cliiijgqzwkiknukfgqc.supabase.co`

---

## Tables

### `profiles`

User profile data (legacy - will be migrated to `characters` table).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | User ID (from auth.users) |
| `username` | text | | Character name |
| `is_herbalist` | boolean | default false | Can brew? |
| `foraging_modifier` | integer | default 0 | Added to foraging rolls |
| `herbalism_modifier` | integer | default 0 | Added to brewing rolls |
| `max_foraging_sessions` | integer | default 3 | Sessions per long rest |
| `created_at` | timestamptz | default now() | Account creation time |

**App Field Mapping:**
- `username` → `profile.name`
- `herbalism_modifier` → `profile.brewingModifier`

**Note:** Authentication is now required. Guest mode has been removed.

---

### `herbs`

Master list of all herbs in the game.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | bigint | PK, auto | Herb ID |
| `name` | text | not null | Herb name |
| `rarity` | text | | common, uncommon, rare, etc. |
| `elements` | text[] | | Array: fire, water, earth, air, positive, negative |
| `description` | text | nullable | Flavor text |

---

### `biomes`

Locations where herbs can be foraged.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | bigint | PK, auto | Biome ID |
| `name` | text | not null | Biome name |
| `description` | text | nullable | Flavor text |

---

### `biome_herbs`

Junction table linking herbs to biomes with spawn weights.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | bigint | PK, auto | Row ID |
| `biome_id` | bigint | FK → biomes | Which biome |
| `herb_id` | bigint | FK → herbs | Which herb |
| `weight` | integer | | Higher = more common |

**Usage:** When foraging in a biome, select herbs weighted by this value.

---

### `recipes`

All brewing recipes (effects from element pairs).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | bigint | PK, auto | Recipe ID |
| `name` | text | not null | Recipe name |
| `elements` | text[] | | Element pair [elem1, elem2] |
| `type` | text | | elixir, bomb, or oil |
| `description` | text | | Effect with {n} for potency |
| `recipe_text` | text | nullable | Crafting instructions |
| `lore` | text | nullable | Background story |
| `is_secret` | boolean | default false | Requires unlock code |
| `unlock_code` | text | nullable | Code to unlock (uppercase) |

---

### `user_inventory`

Herbs owned by users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | bigint | PK, auto | Row ID |
| `user_id` | uuid | FK → profiles | Owner |
| `herb_id` | bigint | FK → herbs | Which herb |
| `quantity` | integer | | How many owned |

**Unique constraint:** One row per (user_id, herb_id) pair.

---

### `user_brewed`

Brewed items (elixirs, bombs, oils) owned by users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | bigint | PK, auto | Row ID |
| `user_id` | uuid | FK → profiles | Owner |
| `type` | text | | elixir, bomb, or oil |
| `effects` | text[] | | Array of effect names |
| `quantity` | integer | | How many of this exact item |
| `choices` | jsonb | nullable | User selections for variables |
| `computed_description` | text | nullable | Final effect text |
| `created_at` | timestamptz | default now() | When brewed |

---

### `user_recipes`

Recipes known by users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | bigint | PK, auto | Row ID |
| `user_id` | uuid | FK → profiles | Who knows it |
| `recipe_id` | bigint | FK → recipes | Which recipe |

**Note:** Users get all non-secret recipes on profile creation.

---

## Relationships Diagram

```
profiles (1) ──────< (N) user_inventory (N) >────── (1) herbs
    │                                                    │
    │                                                    │
    └────< user_brewed                                   │
    │                                                    │
    └────< user_recipes (N) >────── (1) recipes          │
                                                         │
                                        biome_herbs (N) >┘
                                              │
                                    biomes (1)┘
```

---

## Common Queries

### Get user's inventory with herb details

```sql
SELECT ui.*, h.*
FROM user_inventory ui
JOIN herbs h ON h.id = ui.herb_id
WHERE ui.user_id = 'user-uuid-here';
```

### Get herbs available in a biome

```sql
SELECT h.*, bh.weight
FROM biome_herbs bh
JOIN herbs h ON h.id = bh.herb_id
WHERE bh.biome_id = 1
ORDER BY bh.weight DESC;
```

### Get user's known recipes

```sql
SELECT r.*
FROM user_recipes ur
JOIN recipes r ON r.id = ur.recipe_id
WHERE ur.user_id = 'user-uuid-here';
```

### Add herb to inventory (upsert)

```sql
INSERT INTO user_inventory (user_id, herb_id, quantity)
VALUES ('user-uuid', 1, 5)
ON CONFLICT (user_id, herb_id)
DO UPDATE SET quantity = user_inventory.quantity + EXCLUDED.quantity;
```

---

## Knights of Belyar Tables (New)

These tables support the expanded character system.

### `characters`

Core character data for Knights of Belyar.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | Character ID |
| `user_id` | uuid | FK → auth.users, UNIQUE | Owner (1:1 with user) |
| `name` | text | not null | Character name |
| `race` | text | not null | Race (Human, Elf, Dwarf, etc.) |
| `subrace` | text | nullable | Culture/subrace |
| `class` | text | not null | Class (Fighter, Rogue, etc.) |
| `level` | int | default 1 | Character level |
| `background` | text | not null | 'native_knight' or 'initiate' |
| `previous_profession` | text | nullable | For initiates only |
| `knight_order` | text | not null | Order (fiendwreathers, etc.) |
| `vocation` | text | nullable | Vocation (herbalist, etc.) |
| `feat` | text | nullable | If no vocation |
| `str`, `dex`, `con`, `int`, `wis`, `cha` | int | default 10 | Core stats |
| `hon` | int | default 8 | Honor stat |
| `hp_current` | int | not null | Current HP |
| `hp_custom_modifier` | int | default 0 | Custom HP adjustment |
| `hit_dice_current` | int | not null | Current hit dice |
| `platinum`, `gold`, `silver`, `copper` | int | default 0 | Money |
| `appearance` | text | nullable | Physical description |
| `artwork_url` | text | nullable | Character portrait |

### `skills`

Reference table: 26 skills across 7 stats.

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial | PK |
| `name` | text | Skill name (unique) |
| `stat` | text | Governing stat (str/dex/con/int/wis/cha/hon) |
| `display_order` | int | Sort order |

### `armor_slots`

Reference table: 12 body armor slots.

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial | PK |
| `slot_key` | text | Unique key (head, neck, chest, etc.) |
| `display_name` | text | Display name |
| `slot_order` | int | Sort order (1-12) |
| `light_available` | bool | Can equip light armor? |
| `light_piece_name` | text | Light piece name |
| `light_bonus` | int | Light AC bonus |
| `medium_*` | ... | Same for medium |
| `heavy_*` | ... | Same for heavy |

### `character_skills`

Junction table: skill proficiencies.

| Column | Type | Description |
|--------|------|-------------|
| `character_id` | uuid | FK → characters |
| `skill_id` | int | FK → skills |
| `is_proficient` | bool | Has proficiency? |
| `is_expertise` | bool | Has expertise? |

### `character_armor`

Equipped armor pieces.

| Column | Type | Description |
|--------|------|-------------|
| `character_id` | uuid | FK → characters |
| `slot_id` | int | FK → armor_slots |
| `armor_type` | text | 'light', 'medium', 'heavy' |
| `custom_name` | text | Named/magical piece |
| `material` | text | Material type |
| `is_magical` | bool | Is magical? |
| `properties` | jsonb | Enchantments, runes |

### `character_weapons`, `character_items`

Similar structure for weapons and general inventory.

---

## Row Level Security

**Status:** RLS is enabled on all Knights of Belyar tables.

### Active Policies

**Reference tables** (`skills`, `armor_slots`): Public read for authenticated users.

**Character tables** (`characters`, `character_*`): Owner-only access via `auth.uid()`.

**Legacy tables** (`profiles`, `user_inventory`, etc.): RLS still OFF (pending migration).

---

## Migrations

SQL migrations are stored in `supabase/migrations/`:

| File | Purpose |
|------|---------|
| `001_characters_foundation.sql` | Character system tables |
| `002_seed_reference_data.sql` | Skills and armor slots data |
| `003_rls_policies.sql` | RLS policies |

Run in Supabase SQL Editor in order.

---

*Last updated: December 2024*


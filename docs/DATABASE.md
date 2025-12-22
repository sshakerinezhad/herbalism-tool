# Database Schema Reference

Quick reference for the Supabase PostgreSQL database.

**Supabase URL:** `https://cliiijgqzwkiknukfgqc.supabase.co`

---

## Tables

### `profiles`

User/character data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | User ID (from auth or guest UUID) |
| `username` | text | | Character name |
| `is_herbalist` | boolean | default false | Can brew? |
| `foraging_modifier` | integer | default 0 | Added to foraging rolls |
| `herbalism_modifier` | integer | default 0 | Added to brewing rolls |
| `max_foraging_sessions` | integer | default 3 | Sessions per long rest |
| `created_at` | timestamptz | default now() | Account creation time |

**App Field Mapping:**
- `username` → `profile.name`
- `herbalism_modifier` → `profile.brewingModifier`

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

## Row Level Security

**Current Status:** RLS is OFF on all tables.

### Recommended Policies

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_brewed ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_recipes ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only access their own
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Similar for other user_* tables
CREATE POLICY "Users can view own inventory"
  ON user_inventory FOR SELECT
  USING (auth.uid() = user_id);

-- etc.
```

**Note:** Guest users don't have auth.uid(), so policies need to handle that case (possibly using a custom claim or allowing public read of specific tables).

---

## Migrations

No formal migration system is in place. Schema changes are made directly in Supabase dashboard.

**Recommended:** Set up Supabase CLI for migrations:

```bash
supabase init
supabase db diff --use-migra -f initial_schema
supabase db push
```

---

*Last updated: December 2024*


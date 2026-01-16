# Library Architecture

## Directory Structure

```
src/lib/
├── db/                      # Database operations
│   ├── characters.ts        # Character CRUD, equipment, slots
│   ├── characterInventory.ts # Herbs, brewed items, recipes (NEW)
│   └── index.ts             # Barrel export
├── hooks/                   # React Query hooks
│   ├── queries.ts           # All data fetching hooks
│   └── index.ts             # Barrel export
├── auth.tsx                 # Supabase auth context
├── profile.tsx              # Profile context
├── supabase.ts              # Supabase client
├── types.ts                 # TypeScript types
├── constants.ts             # App constants
├── dice.ts                  # Dice rolling utilities
├── brewing.ts               # Brewing logic (PARTIAL LEGACY)
├── inventory.ts             # DEPRECATED - use characterInventory
├── profiles.ts              # Profile operations
└── recipes.ts               # DEPRECATED - use characterInventory
```

## Data Architecture

### New System (Character-Based)
All inventory is tied to `characters.id`:

```
characters (1:1 with auth.users)
├── character_herbs      → herbs (reference)
├── character_brewed     → Effects stored directly
├── character_recipes    → recipes (reference)
├── character_weapons    → weapon_templates + materials (reference)
├── character_items      → item_templates (reference)
├── character_armor      → armor configuration
├── character_skills     → skills (reference)
├── character_weapon_slots → equipped weapons
└── character_quick_slots  → quick access items
```

### Legacy System (User-Based) - DEPRECATED
Tied to `profiles.id` (same as `auth.uid()`):

```
profiles
├── user_inventory → herbs (DEPRECATED - use character_herbs)
├── user_brewed    → brewed items (DEPRECATED - use character_brewed)
└── user_recipes   → recipes (DEPRECATED - use character_recipes)
```

## Migration Status

| Page | Status | Notes |
|------|--------|-------|
| Inventory | ✅ MIGRATED | Uses character_herbs, character_brewed |
| Profile | ✅ MIGRATED | Uses character-based hooks |
| Brew | ❌ LEGACY | Still uses user_inventory, user_brewed |
| Recipes | ❌ LEGACY | Still uses user_recipes |
| Forage | ❌ LEGACY | Still uses user_inventory |

## React Query Hooks

### Preferred (New System)
```typescript
// Character-based - use these
useCharacterHerbs(characterId)
useCharacterBrewedItems(characterId)
useCharacterRecipesNew(characterId)
useCharacterWeapons(characterId)
useCharacterItems(characterId)
```

### Deprecated (Legacy)
```typescript
// Profile-based - avoid, migrate away
useInventory(profileId)      // → useCharacterHerbs
useBrewedItems(profileId)    // → useCharacterBrewedItems
useUserRecipes(profileId)    // → useCharacterRecipesNew
```

## Database Functions

### New (src/lib/db/characterInventory.ts)
```typescript
fetchCharacterHerbs(characterId)
addCharacterHerbs(characterId, herbId, quantity)
removeCharacterHerbs(characterId, herbId, quantity)
fetchCharacterBrewedItems(characterId)
addCharacterBrewedItem(characterId, type, effects, ...)
useCharacterBrewedItem(brewedId, quantity)
```

### Legacy (src/lib/inventory.ts) - DEPRECATED
```typescript
getInventory(userId)
addHerbsToInventory(userId, herbs)
removeHerbsFromInventory(userId, removals)
```

## Key Patterns

### 1. Reference Tables vs Ownership Tables
- **Reference tables** (herbs, weapon_templates, etc.): Shared, read-only
- **Ownership tables** (character_herbs, character_weapons, etc.): Per-character data

### 2. Template Pattern
Weapons and items can be:
- **Template-based**: `template_id` references a template, properties inherited
- **Custom**: `template_id = NULL`, properties stored directly on the row

### 3. Error Handling
All DB functions return: `{ data?, error: string | null }`
UI should handle errors gracefully and display to user.

### 4. React Query Keys
Hierarchical keys for proper cache invalidation:
```typescript
['character', characterId]
['characterHerbs', characterId]
['characterBrewedItems', characterId]
```


# Changelog

All notable changes to the herbalism-tool project.

---

## [Unreleased]

### Added
- **Knights of Belyar character system foundation:**
  - New database tables: `characters`, `skills`, `armor_slots`, `character_skills`, `character_armor`, `character_weapons`, `character_items`
  - 26 skills across 7 stats (STR, DEX, CON, INT, WIS, CHA, HON)
  - 12 armor slot system with light/medium/heavy armor support
  - SQL migrations in `supabase/migrations/`
  - RLS policies for all new tables
  - Planning document: `docs/PLANNING-KNIGHTS.md`
- **ArmorDiagram component** (`src/components/ArmorDiagram.tsx`):
  - Visual armor slot editor with character silhouette
  - 12 slots split into left/right columns
  - Lock/unlock editing mode
  - AC and armor level display
  - Strength requirement validation
- **CoinPurse component** (`src/components/character/CoinPurse.tsx`):
  - Coin management with ±1/±10/±100 increment controls
  - Lock/unlock editing mode (matches ArmorDiagram pattern)
  - Optimistic updates with error rollback
  - Metallic gradient styling per coin type (platinum, gold, silver, copper)
  - Config-driven for easy extension
- **WeaponSlots component** (`src/components/character/WeaponSlots.tsx`):
  - Elden Ring-style weapon equipment (3 slots per hand)
  - Active weapon cycling during combat
  - Two-handed weapon support (locks off-hand)
  - Lock/unlock editing mode
  - Weapon selector modal
- **QuickSlots component** (`src/components/character/QuickSlots.tsx`):
  - 6 combat quick-access slots for potions, scrolls, bombs
  - Supports both regular items and brewed items
  - Category icons per item type
  - Lock/unlock editing mode
  - Item selector modal with category grouping
- **Equipment page** (`src/app/equipment/page.tsx`):
  - Full inventory management for weapons and items
  - Weapons tab with search and add/delete
  - Items tab with category filtering and quantity management
  - Add Weapon modal with full property support
  - Add Item modal with category selection
- **ItemTooltip component** (`src/components/ui/ItemTooltip.tsx`):
  - Hover tooltips showing item quick stats
  - Click to open full detail modal
  - Works with weapons, items, and brewed items
  - Escape key closes modal
- **Equipment database tables:**
  - `character_weapon_slots` - 3 slots per hand with active tracking
  - `character_quick_slots` - 6 slots for combat items
  - Support for brewed items in quick slots (`brewed_item_id`)
  - Auto-initialization trigger for new characters
  - RLS policies for all new tables
- **Shared slot types** (`src/lib/types.ts`):
  - `WeaponSlotNumber` (1 | 2 | 3)
  - `QuickSlotNumber` (1 | 2 | 3 | 4 | 5 | 6)
  - `BrewedItem` type consolidated from duplicates
- Comprehensive documentation suite:
  - `README.md` - Complete project overview and quick start
  - `docs/ARCHITECTURE.md` - Technical deep-dive
  - `docs/CONTRIBUTING.md` - Development guidelines
  - `docs/DATABASE.md` - Schema reference

### Changed
- **Authentication now required (guest mode removed):**
  - `getOrCreateProfile()` now requires authenticated user ID
  - Home page (`/`) redirects to `/login` if not authenticated
  - Profile page (`/profile`) requires authentication
  - Removed "Continue as guest" option from login page
  - Removed `getGuestId()` function and guest ID localStorage handling
- **Inventory operations optimized for scale:**
  - `addHerbsToInventory`: Batched SELECT + INSERT + chunked parallel UPDATEs
  - `removeHerbsFromInventory`: Batched SELECT + DELETE + chunked parallel UPDATEs
  - Configurable limits: `MAX_CONCURRENT_REQUESTS` (20), `MAX_IN_CLAUSE_SIZE` (500)
  - Handles hundreds of herbs without hitting rate limits or query size limits

### Fixed
- Auth gracefully handles expired/invalid refresh tokens instead of throwing console errors
- Login page redirect now uses `useEffect` (fixes React render-phase state update error)
- Duplicate `RecipeType` definition consolidated (now defined in `constants.ts`, re-exported from `types.ts`)
- Missing `recipe_text` field in brewing query
- TypeScript errors with Supabase query builder return types in chunked operations

### Migration Notes
- Existing herbalism tables (`user_inventory`, `user_brewed`, `user_recipes`) now have `character_id` column (nullable, for future migration)
- Guest profiles in database will become orphaned - users must sign up to continue using the app

---

## [1.1.0] - 2024-12-22

### Major Refactor

Complete codebase cleanup for scalability and maintainability.

### Changed

**Component Extraction:**
- Extracted brewing components from monolithic page:
  - `HerbSelector` - Inventory selection interface
  - `PairingPhase` - Element pairing UI
  - `ChoicesPhase` - Effect variable selection
  - `ResultPhase` - Brew results display
  - `RecipeSelector` - Recipe-first brewing mode
- Extracted inventory components:
  - `HerbRow` - Single herb display
  - `BrewedItemCard` - Brewed item display
  - `ElementSummary` - Element totals view
- Extracted recipe components:
  - `RecipeCard` - Recipe display with lore
- Created shared UI components:
  - `PageLayout` - Consistent page wrapper
  - `LoadingState` - Loading indicators
  - `ErrorDisplay` - Error message display
  - `HomeLink` - Navigation component
- Created element display components:
  - `ElementBadge` - Single element emoji
  - `ElementList` - Multiple element row

**Constants Consolidation:**
- Created `src/lib/constants.ts` with all shared constants:
  - `ELEMENT_SYMBOLS` - Element to emoji mapping
  - `ELEMENT_COLORS` - Element color schemes
  - `ELEMENT_ORDER` - Sorting order
  - `RARITY_ORDER` - Rarity tier ordering
  - `FORAGING_DC` (13) - Foraging difficulty
  - `BREWING_DC` (15) - Brewing difficulty
  - `MAX_HERBS_PER_BREW` (6) - Brewing limit
  - `RECIPE_TYPES` - Valid recipe types
- Removed duplicate constant definitions from 5 page files

**File Renaming:**
- Renamed `guest.ts` → `profiles.ts` (more accurate name)
- Updated all imports across the codebase

**Code Quality:**
- Reduced `brew/page.tsx` from ~1935 lines to ~560 lines
- Reduced `inventory/page.tsx` from ~600 lines to ~300 lines
- Added JSDoc comments to all extracted components
- Added barrel exports (`index.ts`) for clean imports
- Removed "legacy exports" warnings

### Fixed
- Type inconsistencies with Supabase query results
- Orphaned imports after component extraction

### Known Issues (Deferred)
- `Recipe.type` is `'elixir' | 'bomb' | string` (effectively just `string`)
- Field name mismatch: `brewingModifier` vs `herbalism_modifier`
- RLS not configured on Supabase tables

---

## [1.0.0] - 2024-12 (Initial)

### Features

**Core Gameplay:**
- Foraging system with biome selection
- Weighted herb spawning
- Dice rolling with modifiers
- Multi-session foraging

**Brewing System:**
- Two brewing modes: By Herbs and By Recipe
- Element pooling from selected herbs
- Element pairing to recipes
- Potency stacking for repeated pairs
- Choice variables in effect descriptions
- Batch brewing for multiple items
- Success/failure based on DC 15

**Inventory Management:**
- Herb inventory with quantities
- Brewed item tracking
- Sorting by element or rarity
- Search with relevance scoring
- Individual item deletion

**Recipe System:**
- Recipe book with tabs (Elixir/Bomb/Oil)
- Secret recipe unlocking with codes
- Recipe lore and descriptions
- Recipe statistics

**User Management:**
- Guest mode with localStorage UUID
- Email/password authentication
- Magic link authentication
- Character profile settings
- Foraging session tracking
- Long rest reset

**UI/UX:**
- Dark theme with amber accents
- Element emoji and color coding
- Responsive design
- Loading states
- Error displays
- Browser back button support in multi-step flows

### Technical

- Next.js 16 with App Router
- React 19
- Tailwind CSS v4
- Supabase for database and auth
- TypeScript throughout
- Client-side rendering

---

## Version History

| Version | Date | Summary |
|---------|------|---------|
| 1.1.0 | 2025-12-22 | Major refactor, documentation |
| 1.0.0 | 2025-12 | Initial release |

---

*Format based on [Keep a Changelog](https://keepachangelog.com/)*


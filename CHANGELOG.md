# Changelog

All notable changes to the herbalism-tool project.

---

## [Unreleased]

### Added
- Comprehensive documentation suite:
  - `README.md` - Complete project overview and quick start
  - `docs/ARCHITECTURE.md` - Technical deep-dive
  - `docs/CONTRIBUTING.md` - Development guidelines
  - `docs/DATABASE.md` - Schema reference

### Fixed
- Auth gracefully handles expired/invalid refresh tokens instead of throwing console errors

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
| 1.1.0 | 2024-12-22 | Major refactor, documentation |
| 1.0.0 | 2024-12 | Initial release |

---

*Format based on [Keep a Changelog](https://keepachangelog.com/)*


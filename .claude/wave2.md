## Wave 2: Design System + System Overhauls

**Goal:** Establish visual identity, then rebuild each subsystem with both functional improvements AND the new aesthetic applied in a single pass.

**Execution:** Sequential pieces (2.0 → 2A → 2B → 2C). Each piece follows: brainstorm → write plan → verify → execute → test → update masterplan.

**Decisions made:**
- Multiclass deferred — zero existing DB/type infrastructure, needs its own design cycle
- Weapon editing already complete (Wave 1) — removed from 2C scope
- Cross-cutting naming decisions (oil vs balm, positive/negative vs Light/Dark elements, herbalism DC formula) resolved in kickoff brainstorm before any piece starts

### Kickoff Brainstorm ✓ COMPLETE

| # | Decision | Resolution | Implemented In |
|---|----------|-----------|---------------|
| 1 | Oil → **Balm** | Rename everywhere to match EPG | 2B ✓ |
| 2 | positive/negative → **Light/Dark** | Rename elements + emojis (🔆/🌑) | 2.0 (early) |
| 3 | Brewing DC → **6 + 2×ingredients** | Replace flat DC 15 with scaled formula | Interstitial (session 13) |
| 4 | Brewing ability → **Keep INT** | Deliberate EPG divergence (EPG says WIS) | No change |
| 5 | Access → **Recipe-based** | Remove herbalist-only gate. Anyone with recipes can brew. Herbalists get full library + can learn more. Non-herbalists get Order-based recipes (future wave). Empty state message for no recipes. | 2B |
| 6 | Alchemy → **Separate system, deferred** | Completely different system (creature organs, own interface). Not Wave 2. | Future wave |

### 2.0 — Design System Evolution ✓ COMPLETE

Evolved the grimoire-themed foundation into a polished dark fantasy design system.

**What shipped (9 commits on `knights-of-belyar`):**
- **Typography:** Grenze Gotisch (headings), Almendra (body), Cinzel (UI labels) replace Geist Sans
- **Elevation system:** 4-tier material surfaces (base → raised → elevated → floating) with top-edge bronze highlights
- **Element accents:** Illuminated gemstone technique — 6 elements with gradient bg, inner/outer glow, text glow, shimmer hover
- **Element rename:** positive→light (🔆), negative→dark (🌑). Air upgraded from zinc to indigo. DB migration pushed.
- **Component evolution:** GrimoireCard/OrnateFrame → elevation classes, SectionHeader → Cinzel, Divider → gradient-fade, Skeletons/Loading/Error/Warning → grimoire palette (no more zinc)
- **New components:** Button (pill, 3 tiers), Modal (floating portal), Tabs (composable context API), Input, Select, Checkbox, ElementChip
- **CSS foundation:** Animation keyframes, button/tab utility classes, element badge/chip classes

**Plan:** `.claude/work-plan.md` | **Spec:** `docs/superpowers/specs/2026-03-11-design-system-evolution.md`

### 2A — Profile & Navigation Restructure (PARTIAL — navigation done, visual pass deferred)

Replaced hub-and-spoke navigation with persistent Ember & Silence nav bar and profile-as-home. The structural/routing work is done but several originally-scoped items were deferred during brainstorm.

**What shipped:**
- **NavBar:** Persistent Ember & Silence nav bar with bonfire active indicators (bronze for Profile, green for Herbalism), locked tab tooltips, HP breathing dot, gear icon → settings
- **Route group `(app)/`:** Centralized auth guard + NavBar layout, persists across navigations
- **Profile home at `/`:** Sub-tabs (Character | Inventory | Journal) using extracted panel components
- **Herbalism hub at `/herbalism`:** Overview with foraging sessions, recent brews, quick links
- **Settings at `/settings`:** Replaces /edit-character with editable identity fields (race, class, background, order, vocation) + confirmation modal, CON→HP auto-adjust, sign out, delete character flow
- **Delete character:** Type-DELETE confirmation modal with cascade delete
- **Forage/Brew:** Moved into route group (auth guards stripped, nav bar inherited)
- **Link cleanup:** All stale route references updated (/profile→/, /inventory→/, /recipes→/, /edit-character→/settings)

**Still in 2A scope but deferred (needs separate brainstorm):**
- Character bar improvements (trait modals, skill proficiencies)
- Mobile responsive nav collapse
- Character creation wizard restyling
- Design system application to profile/settings/character creation page content (pages moved as-is, no visual polish yet)

**Plan:** `.claude/work-plan.md` | **Spec:** `docs/superpowers/specs/2026-03-12-profile-navigation-restructure.md` | **Nav mockup:** `.claude/ember-refined-v3.html`

### Interstitial — Bug Fixes + Character Sheet Polish ✓ COMPLETE

Targeted fixes and UI improvements between 2A and 2B. Not a formal wave piece — driven by user-reported issues.

**What shipped (sessions 11–13):**
- **Brewing bug fix:** `useBrewState.ts` — removed `count * batchCount` that multiplied potency by batch count (DB layer already handles repetition)
- **CoinPurse debounce:** `CoinPurse.tsx` — added `pendingCoin` state guard to serialize async mutations and prevent race conditions from rapid clicks
- **AddElixirModal:** New modal to manually add brewed items from known recipes — potency picker (I–IV), template variable choices, quantity. Wired into HerbalismSection Brewed tab.
- **SkillsPanel redesign:** View mode now 2-column grid with tighter spacing (~50% less vertical space). Edit mode unchanged.
- **CoinPurse → CharacterBanner:** Moved CoinPurse from standalone GrimoireCard into the banner's identity column. Rewritten as compact metallic pills with inline expanding edit tray (CSS Grid `0fr→1fr` height animation). No popover/portal — stays within DOM flow, avoids `overflow-hidden` clipping.
- **Dynamic Brewing DC:** Replaced `BREWING_DC = 15` constant with `getBrewingDC(herbCount)` → `herbCount * 2 + 6`. Updated all 3 DC check sites in brew page + result display components. Aligns with EPG formula (kickoff decision #3).

### 2B — Herbalism & Inventory ✓ COMPLETE

Applied grimoire design system to all herbalism pages. Added herb info modals, stackable effect highlights, brewed inventory redesign, and recipe→brew navigation.

**What shipped (sessions 16–21, 12 commits):**
- **CoinPurse redesign:** Portal popover with debounced auto-save (`595c203`, `6b8763b`)
- **Oil → Balm rename:** DB, types, and UI (`a4a4112`)
- **Utility layer:** `toRoman()`, `parseStackableText()`, `fetchHerbBiomes()`, `useHerbBiomes` hook, `.stackable-value` CSS
- **HerbInfoModal:** Ancient scroll metaphor (wooden dowels, parchment body, dark-ink text). Sections: icon+name+rarity, element pills, description, property (conditional), found-in biomes. Universal component reused across inventory.
- **Herb list redesign:** Element color suffusion sections, ✦ icon placeholder slots, tappable herb names (dotted underline → scroll modal), bronze quantity, grimoire search/sort
- **Brewed items redesign:** Type = color (blue/red/amber gradients + left accent bar). Potency as Roman numeral identity ("Healing Elixir III"). Effect text always visible via stackable parsing. Click to expand → flavor + Use/Expend actions.
- **Inventory container:** Grimoire sub-tabs (Herbs/Brewed), AddHerbModal/AddElixirModal → Modal component, ElementSummary → element-chip styling
- **Recipe cards:** Stackable `*...*` highlights parsed to bold type-colored text with tooltip, lore in parchment style, "Brew This →" button linking to `/brew?recipe={id}`
- **JournalPanel:** Grimoire sub-tabs, recipe stats in Cinzel, unlock modal → Modal component
- **Forage page:** Grimoire heading, elevation panels, grimoire buttons throughout
- **Brew page:** `?recipe={id}` URL param with auto-select on mount, grimoire styling across all sub-components
- **InventoryPanel:** Equipment/Herbalism grimoire sub-tabs, grimoire skeleton

**Minor deferred items:**
- HerbInfoModal integration in forage ResultsPhase (tappable herb names in results)
- HerbInfoModal integration in brew HerbSelector (tappable herb names during herb selection)
- FilterButton component cleanup (replaced by inline TypeTab in BrewedTabContent)

**Plan:** `.claude/changelog/2026-04-11-wave2b-workplan.md` | **Spec:** `docs/superpowers/specs/2026-04-11-herbalism-inventory-design.md` (content in plan) | **Mockups:** `.superpowers/brainstorm/2b-brainstorm/`

### 2C — Weapons & Combat

**Functional:**
- Weapon equip system overhaul (DB slots at `character_weapon_slots` exist but have no UI)
- Two-handed slot behavior (grey out off-hand but still allow adding weapons)
- Custom weapon properties → checkboxes (currently comma-separated text)
- Better equipped weapons organization
- Ammo tracking
- Special arrows (combine arrows + bomb/elixir — depends on 2B herbalism being done)

**Visual:** Apply design system to weapon slots, equipment panel, combat items

**Note:** Consider `martial-mastery-spec.md` during brainstorm — weapon/armor decisions here affect Wave 3B

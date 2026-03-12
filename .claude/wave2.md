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
| 1 | Oil → **Balm** | Rename everywhere to match EPG | 2B |
| 2 | positive/negative → **Light/Dark** | Rename elements + emojis (🔆/🌑) | 2.0 (early) |
| 3 | Brewing DC → **6 + 2×ingredients** | Replace flat DC 15 with scaled formula | 2B |
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

### 2A — Profile & Navigation Restructure ✓ COMPLETE

Replaced hub-and-spoke navigation with persistent Ember & Silence nav bar and profile-as-home.

**What shipped:**
- **NavBar:** Persistent Ember & Silence nav bar with bonfire active indicators (bronze for Profile, green for Herbalism), locked tab tooltips, HP breathing dot, gear icon → settings
- **Route group `(app)/`:** Centralized auth guard + NavBar layout, persists across navigations
- **Profile home at `/`:** Sub-tabs (Character | Inventory | Journal) using extracted panel components
- **Herbalism hub at `/herbalism`:** Overview with foraging sessions, recent brews, quick links
- **Settings at `/settings`:** Replaces /edit-character with editable identity fields (race, class, background, order, vocation) + confirmation modal, CON→HP auto-adjust, sign out, delete character flow
- **Delete character:** Type-DELETE confirmation modal with cascade delete
- **Forage/Brew:** Moved into route group (auth guards stripped, nav bar inherited)
- **Link cleanup:** All stale route references updated (/profile→/, /inventory→/, /recipes→/, /edit-character→/settings)

**Deferred (brainstorm separately):**
- Character bar improvements (trait modals, skill proficiencies)
- Mobile responsive nav collapse
- Character creation wizard restyling
- Design system application to existing page content

**Plan:** `.claude/work-plan.md` | **Spec:** `docs/superpowers/specs/2026-03-12-profile-navigation-restructure.md` | **Nav mockup:** `.claude/ember-refined-v3.html`

### 2B — Herbalism & Inventory

**Functional:**
- Inventory system style and function cleanup
- Better brewed inventory organization
- Herb info modal on selection
- Stackable effects → highlighted with hover info modal (replace asterisks in recipe text)
- Recipe page → "brew this" navigation link
- Apply naming decisions from kickoff brainstorm

**Visual:** Apply design system to forage, brew, inventory, recipes pages

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

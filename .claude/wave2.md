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

### 2.0 — Design System Evolution

The app already has a grimoire-themed foundation (CSS custom properties for grimoire/vellum/sepia/bronze palettes, GrimoireCard component, decorative utilities like `.text-embossed`, `.border-ornate`, `.texture-paper`). This piece evolves it — not starts from scratch.

- **Aesthetic direction:** Dark fantasy retro pulp fiction. NOT generic fantasy, NOT clean modern minimalism, NOT AI slop.
- **Deliverables:** Color palette, typography system, component library (buttons, cards, modals, form elements, navigation), animation patterns, layout grid
- **Tool:** Use `frontend-design` skill for distinctive, high-quality output
- **Scope:** `src/components/ui/`, `src/app/globals.css`, Tailwind config, fonts in `src/app/layout.tsx`

### 2A — Profile & Navigation Restructure

The app's navigation model changes: home page becomes the profile/character sheet with a tab system for subsystems. This defines WHERE content lives for all subsequent pieces.

**Functional:**
- Profile becomes the main page (replaces current home hub at `/`)
- Tab system for subsystems (exact tabs determined during brainstorm — initial thinking: inventory, herbalism, alchemy, martial mastery, archemancy, with Wave 3 tabs as placeholders)
- Settings page overhaul (back button, proper styling, all options)
- Allow changing race/class/background/order/vocation in settings
- Remove armor editing from settings (keep in character sheet only)
- Character bar improvements (animation/modal popups explaining traits)
- Skill proficiencies in character bar
- Reset character feature

**Visual:** Apply design system to profile, settings, character creation wizard, edit character

**Open questions for brainstorm:**
- What happens to standalone pages (`/forage`, `/brew`, `/recipes`)? Stay as pages or become sub-views within tabs?
- How do placeholder tabs for Wave 3 systems look?

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

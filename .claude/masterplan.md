# Backlog Attack Plan — Knights of Belyar Companion

## Context

The codebase just completed a major cleanup ("Scorched Earth") and is structurally clean. There are ~36 items across bugs, UX overhauls, enhancements, and entirely new game systems that need to ship before an upcoming D&D session. The user also wants a full visual overhaul — dark fantasy retro pulp fiction aesthetic with Apple-level UX polish.

**Strategy:** Hybrid approach — stabilize everything first with a bug-fix wave, then go system-by-system for overhauls + visual redesign + enhancements, then build new game systems. Doc parsing for new systems starts in parallel with Wave 1.

---

## Parallel Track: Doc Parsing ✅ COMPLETE

**Completed 2026-03-10.** All source docs parsed into 5 structured specs organized by game system.

| Spec File | Lines | Primary Source |
|-----------|-------|---------------|
| `improvements/specs/shared-systems-spec.md` | 395 | EPG + MM2 (weapons, armor, materials, resting) |
| `improvements/specs/martial-mastery-spec.md` | 565 | MM2 (authoritative) + EPG (stamina dice, techniques, stances, injuries, conditions) |
| `improvements/specs/archemancy-spec.md` | 322 | EPG (vital minerals, Archemancer's Web, dull casting) |
| `improvements/specs/spellcasting-spec.md` | 475 | EPG + Wizard Update (mana, KP, arcane perks, Logician subclass) |
| `improvements/specs/vocations-spec.md` | 639 | EPG (all 7 vocations, Herbalist gap analysis) |

**Key findings affecting later waves:**
- **Herbalist DC mismatch (affects Wave 1 Bug 1-7):** App uses flat DC 15; EPG specifies `6 + 2 × ingredients`. Decision needed.
- **Element naming (affects Wave 3A):** App uses "positive"/"negative"; EPG uses "Light"/"Dark". Needs resolution before archemancy.
- **Recovery skill modifier (affects Wave 3B):** MM2 resting uses undefined "Recovery skill modifier" instead of CON mod. Needs designer input.
- **Archemancer's Web incomplete (affects Wave 3A):** Only 2 of ~14 graph edges are explicitly described in text. Visual diagram from EPG page 16 needed for the rest.
- **Oil vs Balm naming (affects Wave 2B):** App calls the third brew type "oil"; EPG calls it "balm". Small but needs reconciliation.

---

## Wave 1: Stabilization (Bug Fixes)

**Goal:** Make everything that exists work correctly. No visual changes — just fix broken behavior.

Each bug gets its own workplan step with verification.

### Herbalism Cluster
| # | Bug | Key Files |
|---|-----|-----------|
| 1 | Brew option not available for herbalists | `src/app/brew/page.tsx`, profile/vocation checks |
| 2 | Element selection duplicates when pairing | `src/components/brew/PairingPhase.tsx`, `useBrewState.ts` |
| 3 | Deleting herbs doesn't update UI | `src/lib/db/characterInventory.ts`, cache invalidation |
| 4 | Brewing error message wrong ("bombs and elixirs" → "cannot mix multiple types") | `src/lib/brewing.ts` or brew components |
| 5 | Foraging modifier → should use nature skill roll, not herbalism modifier | `src/components/forage/`, foraging logic |
| 6 | Max foraging sessions → should equal INT modifier (min 1) | Foraging session logic, profile settings |
| 7 | Add herbs without foraging (DM awards, trades, purchases) | New UI + `addCharacterHerbs()` integration |

### Character Cluster
| # | Bug | Key Files |
|---|-----|-----------|
| 8 | Fresh profile says "make new knight" (stale state) | `src/app/page.tsx` or profile page, cache/state check |
| 9 | CON update → max HP changes but current HP unchanged | `src/app/edit-character/page.tsx`, character update logic |
| 10 | Edit profile save → should navigate back to profile | `src/app/edit-character/page.tsx`, router.push |
| 11 | Character identity formatting (like_native_Knight) | Display formatting in profile/character components |

### Weapon Cluster
| # | Bug | Key Files |
|---|-----|-----------|
| 12 | Custom weapon: `range_long` column missing from schema | DB migration or schema, `character_weapons` table |
| 13 | Can't edit weapons | Weapon components in inventory |

---

## Wave 2: Design System + System Overhauls

**Goal:** Establish visual identity, then rebuild each subsystem with both functional improvements AND the new aesthetic applied in a single pass.

### 2.0 — Design System Foundation

Before touching any subsystem, establish the visual language:

- **Aesthetic:** Dark fantasy retro pulp fiction — think aged parchment meets pulp illustration, heavy contrast, atmospheric lighting, textured surfaces. NOT generic fantasy, NOT clean modern minimalism, NOT AI slop.
- **Deliverables:** Color palette, typography system, component library (buttons, cards, modals, form elements, navigation), animation patterns, layout grid
- **Tool:** Use `frontend-design` skill for distinctive, high-quality output
- **Scope:** Design system lives in shared components (`src/components/ui/`) and Tailwind config

### 2A — Character & Profile System
**Functional:**
- Settings page overhaul (back button, proper styling, all options)
- Allow changing race/class/background/order/vocation in settings
- Remove armor editing from settings (keep it in character sheet only)
- Profile → main page with tabs (inventory, vocation, archemancy, martial mastery, spellcasting)
- Character bar items → animation/modal popups explaining each trait
- Skill proficiencies → character bar
- Reset character feature
- Multiclass support

**Visual:** Apply design system to profile, settings, character creation wizard, edit character

### 2B — Herbalism & Inventory System
**Functional:**
- Inventory system style and function cleanup
- Better brewed inventory organization
- Herb info modal on selection
- Stackable effects → highlighted with hover info modal (not asterisks)
- Recipe page → "brew this" navigation link

**Visual:** Apply design system to forage, brew, inventory, recipes pages

### 2C — Weapons & Combat System
**Functional:**
- Weapon equip system overhaul + simplification
- Two-handed slot behavior (grey out but still allow adding weapons)
- Custom weapon properties → checkboxes
- Better equipped weapons organization
- Weapon editing capability
- Ammo tracking
- Special arrows (combine arrows + bomb/elixir)

**Visual:** Apply design system to weapon slots, equipment panel, combat items

---

## Wave 3: New Game Systems

Each system follows: **parsed spec → brainstorm with user → design → implement → verify**

Specs should be ready from the parallel doc-parsing track.

### 3A — Archemancy
Source: EPG. Described as "a cooperative puzzle, pulling parties together to each contribute their part in the shared power of the group. Granting magical value to almost everything in the world."
- **Spec:** Ready at `improvements/specs/archemancy-spec.md`
- New DB tables, new page/tab, new game mechanics
- Likely the largest new system

### 3B — Martial Mastery
Source: Martial Mastery Expansion 2. Covers: revised armor, lingering injuries, resting, stamina dice (renamed from technique dice), expert techniques, new conditions.
- **Spec:** Ready at `improvements/specs/martial-mastery-spec.md`
- Overlaps with existing weapon/armor system — extends rather than replaces
- May affect Wave 2C decisions (design armor/weapon UI to accommodate this)

### 3C — Spellcasting Expansion
Source: EPG spellcasting additions + Wizard Update (mana/discipline system, knowledge points, arcane perks).
- **Spec:** Ready at `improvements/specs/spellcasting-spec.md`
- New mana tracking system
- Knowledge points and spell learning progression
- School/essence specialization

---

## Execution Model

Each wave produces its own workplan (`workplan.md`) with:
- Numbered steps with specific file changes
- Verification tests via `__verify__/`
- Checkpoint gates between clusters

**Within each wave:** Items are tackled sequentially within a cluster, but clusters within a wave can potentially be parallelized across agents (using worktrees for isolation).

**Between waves:** Each wave's workplan is designed, verified, and completed before starting the next. The user and I brainstorm together at the start of each wave/sub-wave for design decisions.

---

## Verification

- Every bug fix: manual test in browser + automated verify script
- Every UI change: visual check in browser at multiple viewport sizes
- Every new system: end-to-end test of the complete user flow
- Build check (`npm run build`) after each cluster completes

---

## What's NOT in this plan

These were considered and intentionally excluded or deferred:
- **Database migrations for new systems** — designed during Wave 3 brainstorming, not upfront
- ~~**Detailed specs for archemancy/martial mastery/spellcasting** — produced by doc-parsing track~~ ✅ Done
- **Detailed design system mockups** — produced at start of Wave 2 using frontend-design skill

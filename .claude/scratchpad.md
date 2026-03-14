# Scratchpad

**Branch:** `main`
**Last session:** 2026-03-12 (session 14)

## Current state

- On `main`, **uncommitted changes** from session 13 still need committing (CoinPurse + dynamic DC)
- Build passing
- Wave 2B brainstorm complete — first chunk scoped and spec'd

## Session 14 — what was done

### 2B Brainstorm: Scoped first chunk as Oil → Balm rename

Brainstormed Wave 2B (Herbalism & Inventory). Full 2B scope is too large for one piece, so we broke it into chunks:
1. **Oil → Balm rename** ← doing this first
2. Inventory UX improvements (herb info modal, brewed organization, stackable effects)
3. Visual pass on herbalism pages
4. Recipe → Brew link + recipe polish

### Key decisions
- **Full rename** through DB + code + UI (not UI-only mapping)
- **Icon:** 🫗/⚔️/🗡️ → 🩸 (drop of blood) everywhere balm appears
- **Color scheme stays amber** — still fits weapon-coating balms
- **Big bang approach** — one commit, no two-phase migration (personal project, no rolling deploy risk)

### Artifacts produced
- **Spec:** `docs/superpowers/specs/2026-03-12-oil-to-balm-rename.md` (reviewed, approved)
- **Work plan:** `.claude/work-plan.md` (7 steps)
- Blast radius: 46 references across 16 files

## What the next session needs to do

1. **Commit session 13 changes first** (CoinPurse + dynamic DC — still uncommitted)
2. **Execute oil → balm rename** following `.claude/work-plan.md`:
   - Step 1: DB migration (new file, push, regenerate types)
   - Steps 2-6: TypeScript types, style mappings, UI labels, type assertions, comments
   - Step 7: Update wave2.md to mark decision #1 as implemented
3. **Verify:** `npm run build`
4. **After rename:** Continue 2B brainstorm for next chunk (inventory UX improvements)

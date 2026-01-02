# Inventory Refactor - Batch 2: Equipment Components
**Date:** 2026-01-02
**Feature:** Extracted equipment components from monolithic page.tsx (1455 → 901 lines)

## 3 Key Software Concepts

### 1. Component Extraction & Single Responsibility Principle
We broke a 1455-line page into focused components (EquipmentSection, WeaponsTab, ItemsTab, WeaponCard, ItemCard). Each component now has one job: EquipmentSection orchestrates tabs and modals, WeaponsTab manages weapon display and search, WeaponCard renders a single weapon. This makes code easier to test, debug, and modify. When you need to change how weapons are displayed, you only touch WeaponCard—not the entire inventory page. The key is identifying natural boundaries: cards display data, tabs manage collections, sections coordinate subsystems.

**Resource:** [Thinking in React - Component Hierarchy](https://react.dev/learn/thinking-in-react#step-1-break-the-ui-into-a-component-hierarchy)

### 2. Barrel Exports & Module Organization
We created `equipment/index.ts` that re-exports all equipment components. This pattern (called a "barrel export") provides a clean public API: consumers import from `@/components/inventory` instead of reaching into nested folders. It reduces coupling—if you reorganize files inside `equipment/`, consumers don't break. It also makes imports cleaner: `import { EquipmentSection, WeaponCard } from '@/components/inventory'` vs five separate import statements. The tradeoff: barrel files add indirection and can impact tree-shaking in some bundlers, but modern tools like Next.js handle this well.

**Resource:** [TypeScript Module Resolution - Barrel Pattern](https://www.typescriptlang.org/docs/handbook/modules.html#re-exports)

### 3. Props-Down, Events-Up (Unidirectional Data Flow)
Parent components (page.tsx) own state and data-fetching, child components (WeaponsTab, WeaponCard) receive data via props and notify parents via callback functions (`onWeaponDeleted`, `onDelete`). This creates predictable data flow: state lives high in the tree, UI components lower down are "dumb" renderers. When a weapon is deleted, WeaponCard calls `onDelete()` → WeaponsTab calls `onWeaponDeleted()` → page.tsx invalidates the query → React Query refetches → new data flows back down. This pattern prevents scattered state mutations and makes the app easier to reason about.

**Resource:** [React Docs - Sharing State Between Components](https://react.dev/learn/sharing-state-between-components)

## Transferable Patterns

1. **Incremental Refactoring:** We didn't rewrite everything at once. Batch 1 extracted types/modals, Batch 2 equipment, Batch 3 will do herbalism. Each batch is independently verifiable with `npm run build`. Apply this to any large refactor: identify batches that can ship independently.

2. **Bottom-Up Extraction:** Start with leaf nodes (WeaponCard, ItemCard) that have no dependencies, then extract their containers (WeaponsTab, ItemsTab), then extract the orchestrator (EquipmentSection). This sequence minimizes breaking changes—you're always extracting complete, working units.

3. **Type Safety as Guardrails:** TypeScript caught every missing prop, wrong import, and interface mismatch during extraction. The pattern: extract code → fix type errors → build passes → you're done. No manual testing needed until the end. This scales to any typed codebase.

4. **Barrel Exports for Growing Codebases:** As component folders grow (3 files → 10 files → 20 files), barrel exports keep the public API stable. Start this pattern early—it's easier than retrofitting later.

5. **Local State, Lifted Handlers:** Components own UI-only state (search queries, confirmation dialogs) but call parent handlers for mutations. This keeps components reusable—WeaponCard doesn't know about React Query or your API, it just renders data and calls `onDelete`. You could drop it into a different app tomorrow.

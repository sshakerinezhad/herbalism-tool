# Learning: Inventory Modal Extraction (Batch 1)

**Date:** 2026-01-02
**Feature:** Extracted modals and types from 2333-line inventory page to modular components

---

## 3 Most Important Software Concepts

### 1. Component Extraction and the Single Responsibility Principle

When a file grows beyond ~300-400 lines, it's a signal that multiple responsibilities are being handled in one place. We extracted two large modal components (AddWeaponModal: 467 lines, AddItemModal: 365 lines) that each had a single, clear purpose: managing the workflow for adding a specific type of inventory item. The key insight is that each modal component is completely self-contained with its own state, validation logic, and UI - it only needs props for external data (templates, materials) and callbacks for success/failure. This separation makes the code easier to test, modify, and reason about because each component has clear boundaries.

**Resource:** "Clean Code" by Robert C. Martin, Chapter 3 (Functions) - discusses the Single Responsibility Principle in depth.

### 2. Barrel Exports and Module Organization

We created a hierarchical folder structure with barrel exports (`index.ts` files) that re-export components from subdirectories. This pattern provides a clean public API for the `inventory/` module - consumers import from `@/components/inventory` rather than navigating deep paths like `@/components/inventory/modals/AddWeaponModal`. The barrel export acts as a façade that hides implementation details and makes refactoring easier - we can reorganize files within the module without breaking imports elsewhere. The key is to group related functionality (modals, types, equipment, herbalism) and export them through a single entry point.

**Resource:** "Node.js Design Patterns" by Mario Casciaro, Chapter 2 (The Module System) - covers module organization patterns including barrel exports.

### 3. Shared Type Extraction and DRY Principle

Instead of defining types inline where they're used, we extracted shared types (`MainTab`, `SortMode`, `WeaponModalMode`, etc.) and helper functions (`getCategoryIcon`, `formatCategory`) to a central `types.ts` file. This follows the DRY (Don't Repeat Yourself) principle and creates a single source of truth for domain concepts. When types are shared across multiple components, centralizing them prevents drift where the same concept is defined slightly differently in different places. Helper functions similarly centralize business logic that multiple components need - formatting a category name should happen the same way everywhere.

**Resource:** "Refactoring" by Martin Fowler, Chapter 7 (Extract Class) - discusses when and how to extract shared concerns into separate modules.

---

## Transferable Patterns

1. **Incremental Refactoring Strategy**: Breaking a large refactor into batches (Batch 1: Modals, Batch 2: Equipment, Batch 3: Herbalism) with verification after each step. This minimizes risk and provides rollback points if something breaks.

2. **Bottom-Up Component Extraction**: Start by extracting the leaf components (modals) that have the fewest dependencies, then work your way up to container components. This ensures that when you extract higher-level components, their dependencies are already modularized.

3. **Barrel Export Hierarchy**: Use `index.ts` files to create clean module boundaries. Structure: `module/feature/Component.tsx` → `module/feature/index.ts` → `module/index.ts` → consumers import from `module`.

4. **Type Co-location with Components**: Keep types close to where they're used but extract to a shared file when multiple components need them. The types file becomes the domain model for that feature.

5. **Build-Driven Development**: Run `npm run build` after each significant change to catch TypeScript errors early. The build is your safety net during refactoring.

---

## Metrics

- **Before**: 2333 lines in single file
- **After Batch 1**: 1455 lines (-878 lines, -38%)
- **Files Created**: 4 new component files + 1 types file + 2 barrel exports
- **Build Status**: Passing
- **Next**: Batches 2 and 3 will extract equipment and herbalism components

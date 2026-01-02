# Learning: Batch 1 - Brew UI Extraction (2026-01-02)

## 3 Core Software Concepts from This Work

### 1. Barrel Exports & Module Organization

**Explanation:** A barrel export (index.ts) aggregates multiple modules into a single public API, reducing import paths from `./RecipeRequirements`, `./ModeToggle`, `./types` to a clean `@/components/brew`. This improves maintainability by centralizing what's "exported" from a module, making refactoring easier when internal structure changes. It also creates a clear boundary between public and private code—users import from the barrel, not internal files.

**Resource:** [JavaScript Module Pattern - Barrel Exports](https://javascript.info/import-export#re-export) (ES6 modules documentation)

---

### 2. Type Extraction as Documentation

**Explanation:** Moving types to a dedicated `types.ts` file serves dual purposes: it documents the expected shape of data flowing through components (BrewMode, BrewPhase, InventoryItem), and it decouples type definitions from implementation. This makes types reusable across multiple components and pages without creating circular imports. It also signals to future developers "these are the contracts this feature uses."

**Resource:** [TypeScript Best Practices - Type Organization](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html)

---

### 3. Incremental Component Extraction with Test Verification

**Explanation:** Rather than extracting all logic at once, Batch 1 started with UI extraction (RecipeRequirements, ModeToggle) before attempting the risky state/hook extraction. Each extraction was verified with `npm run build` to catch type errors immediately. This reduces risk by proving the refactor works at each stage, making debugging easier if something breaks.

**Resource:** [Refactoring Safely - Kent C. Dodds](https://kentcdodds.com/blog/common-mistakes-with-react-hooks) (principles apply to any refactoring)

---

## Transferable Patterns to Future Projects

1. **Barrel exports first** - When creating any feature folder (`components/X/`, `lib/hooks/`, etc.), establish the public API via index.ts immediately. This makes it trivial to move internal files around later.

2. **Extract types early, not late** - If a component has rich internal types, extract them to `types.ts` as soon as they're stable. This prevents the "type soup" problem where types leak into 5 different files.

3. **Staged refactoring** - UI extraction → hook extraction → state management. Tackle cosmetic/structural refactors first, then state, then logic. Each stage can be verified independently.

4. **Build verification as checkpoint** - `npm run build` is your first-pass validation. It catches type errors and import mismatches instantly. Use it between each logical step, not just at the end.

5. **Document the "why" in plans** - The Batch 1 plan explained target line counts, extraction strategy, and risk assessment. This made execution straightforward and created a paper trail for future refactors.

---

## Next Steps (Batch 2 Context)

Batch 2 (hook extraction) is flagged as "high-risk" because it consolidates 8 useState + 11 useMemo + browser history logic. Follow the staged approach:
- **Step 2a:** Create hook shell with types only
- **Step 2b:** Move useState declarations
- **Step 2c:** Move useMemo computations
- **Step 2d:** Move browser history integration

Each step should pass build + manual testing before proceeding.

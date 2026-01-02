# Inventory Refactor Batch 3 - Key Learnings

**Date:** 2026-01-02
**Feature:** Extracted herbalism components (HerbalismSection, HerbsTabContent, BrewedTabContent, FilterButton)
**Result:** Reduced page.tsx from 2333 → 195 lines (91.6% reduction across 3 batches)

---

## 3 Most Important Software Concepts

### 1. **Component Extraction & Single Responsibility Principle (SRP)**

**Explanation:**
Breaking a 2333-line monolith into focused 150-400 line components means each file has *one job*: HerbalismSection manages state and handlers; HerbsTabContent renders the UI; FilterButton is a reusable utility. This makes code testable, maintainable, and debuggable. When something breaks, you know exactly which component is responsible. The principle scales: if a component grows beyond ~200 lines, it's a signal to extract again.

**Resource:** [React Docs: Extracting Components](https://react.dev/learn/thinking-in-react#step-1-break-the-ui-into-a-component-hierarchy) | [SOLID Principles - SRP](https://en.wikipedia.org/wiki/Single-responsibility_principle)

---

### 2. **State Locality & Prop Drilling Trade-offs**

**Explanation:**
We chose to keep all state (search, sort, filters, delete confirmations) in HerbalismSection and pass 18+ props to child components rather than introduce Context or Redux. This is a deliberate trade-off: prop drilling is visible (you see what data flows where), easier to debug, and avoids premature abstraction. The downside is maintenance cost if prop chains grow deeper. The lesson: prop drilling is acceptable for 2-3 levels; beyond that, Context or state management becomes justified. This avoids over-engineering but acknowledges when refactoring becomes necessary (Phase 4 plan notes this).

**Resource:** [React Props vs Context - When to Use What](https://kentcdodds.com/blog/how-to-use-react-context-effectively) | [The Prop Drilling Problem](https://www.patterns.dev/posts/prop-drilling)

---

### 3. **Barrel Exports for Scalable Module Organization**

**Explanation:**
Instead of importing from nested paths (`src/components/inventory/herbalism/HerbalismSection.tsx`), we created barrel exports (`src/components/inventory/herbalism/index.ts`) that re-export all public components. This provides a single import surface and makes future refactoring transparent: if we move FilterButton into a sub-folder, only the barrel changes. It also signals which components are "public" vs internal. This pattern scales to large codebases where import path predictability matters.

**Resource:** [ES6 Modules & Barrel Exports](https://developer.mozilla.org/en-US/docs/web/javascript/reference/statements/export) | [Barrel Exports Best Practices](https://basarat.gitbook.io/typescript/main-1/barrel)

---

## Transferable Patterns

### Pattern 1: **Systematic Three-Pass Refactoring**
We broke the inventory refactor into 3 batches: types+modals, equipment, herbalism. Each batch was planned, implemented, and verified independently. This pattern transfers to any large cleanup: plan atomic, testable slices; build incrementally; verify at each step. Reduces risk of one massive breaking change.

### Pattern 2: **Composition Over Configuration**
Rather than creating a generic `<Section>` component with 20+ props, we built specific components (EquipmentSection, HerbalismSection) that own their own state and handlers. This makes code easier to reason about and modify. When you need customization later, you duplicate the component rather than add more props—a healthier trade-off for maintainability.

### Pattern 3: **Preserve Behavior During Refactoring**
We never changed the actual feature while refactoring—no new buttons, no tweaked logic, just reorganization. This made it easy to verify: the build had to pass, and the UI had to work identically. Future refactors should follow the same discipline: separate refactoring commits from feature work.

### Pattern 4: **Document Decision Trade-offs in Code**
Comments explaining *why* we prop-drill instead of using Context, or why FilterButton is a standalone component, preserve intent. Future maintainers (or your future self) won't waste time second-guessing decisions.

---

## Next Steps (for future phases)

- **Phase 4:** Reduce prop drilling in HerbalismSection using React Context (acceptable now that the structure is clear)
- **Phase 4:** Consider lazy-loading modals with dynamic imports to reduce initial bundle size
- **Phase 3 continued:** Apply same pattern to brew, forage, and character pages

---

## Commit Messages (for reference)

Batch 1: Extract types and modals from inventory page
Batch 2: Extract equipment components (weapons, items) from inventory
Batch 3: Extract herbalism components (herbs, brewed items) from inventory

Each commit was focused, atomic, and verified with `npm run build`.

# Step 2c: Move useMemo Computations to useBrewState

## Summary

Implement all 11 useMemo computed values in `useBrewState.ts` that are currently stubbed. The page.tsx already destructures these values from the hook - we just need to make them compute real values instead of empty stubs.

## Current State

- `src/lib/hooks/useBrewState.ts`: 199 lines, 8 useState working, 11 computed values stubbed
- `src/app/brew/page.tsx`: 567 lines, already uses hook, expects computed values to work
- Build passes but brewing functionality is broken (stubs return empty values)

## Implementation Order

Respect dependency chains - implement in groups:

### Group 1: No memo dependencies
1. `recipes` - depends on `characterRecipes` param only

### Group 2: Depend on state + inventory
2. `selectedHerbs` - depends on `inventory`, `selectedHerbQuantities`
3. `totalHerbsSelected` - depends on `selectedHerbQuantities`
4. `elementPool` - depends on `selectedHerbQuantities`, `inventory`

### Group 3: Depend on Group 2
5. `remainingElements` - depends on `elementPool`, `assignedPairs`
6. `pairedEffects` - depends on `assignedPairs`, `recipes`

### Group 4: Depend on Group 3
7. `pairingValidation` - depends on `pairedEffects`
8. `requiredChoices` - depends on `pairedEffects`

### Group 5: Recipe mode (parallel to Groups 2-4)
9. `requiredElements` - depends on `selectedRecipes`, `batchCount`
10. `matchingHerbs` - depends on `inventory`, `requiredElements`
11. `herbsSatisfyRecipes` - depends on `selectedRecipes`, `selectedHerbQuantities`, `batchCount`, `inventory`, `requiredElements`

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/hooks/useBrewState.ts` | Replace 11 stub declarations with useMemo implementations |

## Implementation Details

### Imports to Add
```typescript
import { findRecipeForPair, canCombineEffects, parseTemplateVariables } from '@/lib/brewing'
```

### Each useMemo Implementation

**1. recipes**
```typescript
const recipes = useMemo(() => {
  return characterRecipes
    .filter((cr) => cr.recipes)
    .map((cr) => cr.recipes as unknown as Recipe)
    .sort((a, b) => a.name.localeCompare(b.name))
}, [characterRecipes])
```

**2. selectedHerbs**
```typescript
const selectedHerbs = useMemo(() => {
  const herbs: InventoryItem[] = []
  selectedHerbQuantities.forEach((qty, itemId) => {
    const item = inventory.find((i) => i.id === itemId)
    if (item) {
      for (let i = 0; i < qty; i++) herbs.push(item)
    }
  })
  return herbs
}, [inventory, selectedHerbQuantities])
```

**3. totalHerbsSelected**
```typescript
const totalHerbsSelected = useMemo(() => {
  let total = 0
  selectedHerbQuantities.forEach((qty) => (total += qty))
  return total
}, [selectedHerbQuantities])
```

**4. elementPool**
```typescript
const elementPool = useMemo(() => {
  const pool = new Map<string, number>()
  selectedHerbQuantities.forEach((qty, itemId) => {
    const item = inventory.find((i) => i.id === itemId)
    if (item?.herbs?.elements) {
      for (let i = 0; i < qty; i++) {
        item.herbs.elements.forEach((el) => {
          pool.set(el, (pool.get(el) || 0) + 1)
        })
      }
    }
  })
  return pool
}, [selectedHerbQuantities, inventory])
```

**5. remainingElements**
```typescript
const remainingElements = useMemo(() => {
  const remaining = new Map(elementPool)
  assignedPairs.forEach(([el1, el2]) => {
    remaining.set(el1, (remaining.get(el1) || 0) - 1)
    remaining.set(el2, (remaining.get(el2) || 0) - 1)
  })
  // Remove zeros
  remaining.forEach((count, el) => {
    if (count <= 0) remaining.delete(el)
  })
  return remaining
}, [elementPool, assignedPairs])
```

**6. pairedEffects**
```typescript
const pairedEffects = useMemo(() => {
  return assignedPairs.map(([el1, el2]) => {
    const recipe = findRecipeForPair(recipes, el1, el2)
    return {
      elements: [el1, el2] as [string, string],
      recipe: recipe || null,
    }
  })
}, [assignedPairs, recipes])
```

**7. pairingValidation**
```typescript
const pairingValidation = useMemo(() => canCombineEffects(pairedEffects), [pairedEffects])
```

**8. requiredChoices**
```typescript
const requiredChoices = useMemo(() => {
  const allChoices: { variable: string; options: string[] | null }[] = []
  pairedEffects.forEach(({ recipe }) => {
    if (recipe?.description) {
      const variables = parseTemplateVariables(recipe.description)
      variables.forEach((v) => {
        if (!allChoices.some((c) => c.variable === v.variable)) {
          allChoices.push(v)
        }
      })
    }
  })
  return allChoices
}, [pairedEffects])
```

**9. requiredElements**
```typescript
const requiredElements = useMemo(() => {
  const elements = new Map<string, number>()
  selectedRecipes.forEach(({ recipe }) => {
    const [el1, el2] = recipe.element_pair
    for (let i = 0; i < batchCount; i++) {
      elements.set(el1, (elements.get(el1) || 0) + 1)
      elements.set(el2, (elements.get(el2) || 0) + 1)
    }
  })
  return elements
}, [selectedRecipes, batchCount])
```

**10. matchingHerbs**
```typescript
const matchingHerbs = useMemo(() => {
  const neededElements = new Set(requiredElements.keys())
  return inventory.filter((item) =>
    item.herbs?.elements?.some((el) => neededElements.has(el))
  )
}, [inventory, requiredElements])
```

**11. herbsSatisfyRecipes** (most complex)
```typescript
const herbsSatisfyRecipes = useMemo(() => {
  if (selectedRecipes.length === 0) return false

  // Build element pool from selected herbs
  const available = new Map<string, number>()
  selectedHerbQuantities.forEach((qty, itemId) => {
    const item = inventory.find((i) => i.id === itemId)
    if (item?.herbs?.elements) {
      for (let i = 0; i < qty; i++) {
        item.herbs.elements.forEach((el) => {
          available.set(el, (available.get(el) || 0) + 1)
        })
      }
    }
  })

  // Check if we have enough of each required element
  let satisfied = true
  requiredElements.forEach((needed, el) => {
    if ((available.get(el) || 0) < needed) {
      satisfied = false
    }
  })

  return satisfied
}, [selectedRecipes, selectedHerbQuantities, batchCount, inventory, requiredElements])
```

## Known Issues to Fix

From gimp.md codex review:

1. **P1 (Regression):** Back-navigation from select-herbs-for-recipes should clear `selectedHerbQuantities`. Add `clearHerbSelections()` action or fix in page.tsx onClick.

2. **P3 (Cleanup):** Remove unused `useMemo` import if still present after implementing (it will be used after Step 2c).

## Verification

After implementation:
```bash
npm run build
```

Then manual testing:
- [ ] By-herbs: herbs show in selector, element pool displays correctly
- [ ] By-herbs: pairing works, validation shows errors for mixed types
- [ ] By-recipe: recipe requirements show needed elements
- [ ] By-recipe: herb selection enables Continue when requirements met

## Risk Assessment

**Medium risk** - Pure computation, no side effects. If a useMemo is wrong, it will show incorrect data but won't corrupt state. Each can be tested incrementally.

**Performance note:** `herbsSatisfyRecipes` has 5 dependencies and nested loops. Monitor for slowness during batch brewing. Could optimize with `inventory` Map lookup if needed.

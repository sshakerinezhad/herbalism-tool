/**
 * useBrewState Hook
 *
 * Manages all state for the brew page including:
 * - Mode and phase management
 * - Herb selection and element pairing
 * - Recipe selection (by-recipe mode)
 * - Browser history integration
 * - Computed values and validation
 */

import { useState, useMemo } from 'react'
import type { Recipe } from '@/lib/types'
import type {
  BrewMode,
  BrewPhase,
  SelectedRecipe,
  InventoryItem
} from '@/components/brew'
import type { PairedEffect } from '@/lib/brewing'
import { findRecipeForPair, canCombineEffects, parseTemplateVariables } from '@/lib/brewing'

// ============ Types ============

export type UseBrewStateParams = {
  inventory: InventoryItem[]
  characterRecipes: any[] // CharacterRecipe type
}

export type BrewProceedResult = {
  phase: BrewPhase
  pairedEffects: PairedEffect[]
  choices: Record<string, string>
}

export type BrewActions = {
  addHerb: (itemId: number) => void
  removeHerb: (itemId: number) => void
  addPair: (el1: string, el2: string) => void
  removePair: (index: number) => void
  setChoice: (variable: string, value: string) => void
  addRecipeSelection: (recipe: Recipe) => void
  removeRecipeSelection: (recipeId: number) => void
  setBatchCount: (count: number) => void
  clearHerbSelections: () => void
  switchBrewMode: (mode: BrewMode) => void
  proceedToPairing: () => void
  proceedToChoices: () => void
  proceedToHerbSelection: () => void
  proceedFromRecipeMode: () => BrewProceedResult | void
  reset: () => void
  setPhase: (phase: BrewPhase) => void
  setMutationError: (error: string | null) => void
}

export type UseBrewStateReturn = {
  // Core state
  brewMode: BrewMode
  phase: BrewPhase
  // Selection state
  selectedHerbQuantities: Map<number, number>
  assignedPairs: [string, string][]
  choices: Record<string, string>
  selectedRecipes: SelectedRecipe[]
  batchCount: number
  mutationError: string | null
  // Computed (by-herbs)
  selectedHerbs: InventoryItem[]
  totalHerbsSelected: number
  elementPool: Map<string, number>
  remainingElements: Map<string, number>
  pairedEffects: PairedEffect[]
  pairingValidation: { valid: boolean; type: string | null; error?: string }
  requiredChoices: { variable: string; options: string[] | null }[]
  recipes: Recipe[]
  // Computed (by-recipe)
  requiredElements: Map<string, number>
  matchingHerbs: InventoryItem[]
  herbsSatisfyRecipes: boolean
  // Actions
  actions: BrewActions
}

// ============ Hook ============

export function useBrewState({ inventory, characterRecipes }: UseBrewStateParams): UseBrewStateReturn {
  // ============ State (8 useState hooks from page.tsx lines 92-103) ============

  const [mutationError, setMutationError] = useState<string | null>(null)
  const [brewMode, setBrewMode] = useState<BrewMode>('by-herbs')
  const [phase, setPhase] = useState<BrewPhase>({ phase: 'select-herbs' })
  const [selectedHerbQuantities, setSelectedHerbQuantities] = useState<Map<number, number>>(new Map())
  const [assignedPairs, setAssignedPairs] = useState<[string, string][]>([])
  const [choices, setChoices] = useState<Record<string, string>>({})
  const [selectedRecipes, setSelectedRecipes] = useState<SelectedRecipe[]>([])
  const [batchCount, setBatchCount] = useState(1)

  // ============ Computed Values ============

  // Group 1: No memo dependencies
  const recipes = useMemo(() => {
    return characterRecipes
      .filter((cr) => cr.recipes)
      .map((cr) => cr.recipes as unknown as Recipe)
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [characterRecipes])

  // Group 2: Depend on state + inventory
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

  const totalHerbsSelected = useMemo(() => {
    let total = 0
    selectedHerbQuantities.forEach((qty) => (total += qty))
    return total
  }, [selectedHerbQuantities])

  const elementPool = useMemo(() => {
    const pool = new Map<string, number>()
    selectedHerbQuantities.forEach((qty, itemId) => {
      const item = inventory.find((i) => i.id === itemId)
      if (item?.herb?.elements) {
        for (let i = 0; i < qty; i++) {
          item.herb.elements.forEach((el) => {
            pool.set(el, (pool.get(el) || 0) + 1)
          })
        }
      }
    })
    return pool
  }, [selectedHerbQuantities, inventory])

  // Group 3: Depend on Group 2
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

  const pairedEffects = useMemo(() => {
    const effectCounts = new Map<string, { recipe: Recipe; count: number }>()
    for (const [el1, el2] of assignedPairs) {
      const recipe = findRecipeForPair(recipes, el1, el2)
      if (recipe) {
        const existing = effectCounts.get(recipe.name)
        if (existing) existing.count++
        else effectCounts.set(recipe.name, { recipe, count: 1 })
      }
    }
    return Array.from(effectCounts.values())
  }, [assignedPairs, recipes])

  // Group 4: Depend on Group 3
  const pairingValidation = useMemo(() => canCombineEffects(pairedEffects), [pairedEffects])

  const requiredChoices = useMemo(() => {
    const allChoices: { variable: string; options: string[] | null }[] = []
    const seen = new Set<string>()
    for (const effect of pairedEffects) {
      if (effect.recipe.description) {
        for (const v of parseTemplateVariables(effect.recipe.description)) {
          if (!seen.has(v.variable)) {
            seen.add(v.variable)
            allChoices.push(v)
          }
        }
      }
    }
    return allChoices
  }, [pairedEffects])

  // Group 5: Recipe mode (parallel to Groups 2-4)
  const requiredElements = useMemo(() => {
    const elements = new Map<string, number>()
    for (const { recipe, count } of selectedRecipes) {
      for (const element of recipe.elements) {
        elements.set(element, (elements.get(element) || 0) + (count * batchCount))
      }
    }
    return elements
  }, [selectedRecipes, batchCount])

  const matchingHerbs = useMemo(() => {
    const neededElements = new Set(requiredElements.keys())
    return inventory.filter((item) =>
      item.herb?.elements?.some((el) => neededElements.has(el))
    )
  }, [inventory, requiredElements])

  const herbsSatisfyRecipes = useMemo(() => {
    if (selectedRecipes.length === 0) return false

    // Build element pool from selected herbs
    const available = new Map<string, number>()
    selectedHerbQuantities.forEach((qty, itemId) => {
      const item = inventory.find((i) => i.id === itemId)
      if (item?.herb?.elements) {
        for (let i = 0; i < qty; i++) {
          item.herb.elements.forEach((el) => {
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

  // ============ Actions (stubs for now - Step 2d) ============

  const actions: BrewActions = {
    addHerb: (itemId: number) => {
      // Stub - will implement in Step 2d
    },
    removeHerb: (itemId: number) => {
      // Stub - will implement in Step 2d
    },
    addPair: (el1: string, el2: string) => {
      setAssignedPairs(prev => [...prev, [el1, el2]])
    },
    removePair: (index: number) => {
      setAssignedPairs(prev => prev.filter((_, i) => i !== index))
    },
    setChoice: (variable: string, value: string) => {
      setChoices(prev => ({ ...prev, [variable]: value }))
    },
    addRecipeSelection: (recipe: Recipe) => {
      // Stub - will implement in Step 2d
    },
    removeRecipeSelection: (recipeId: number) => {
      // Stub - will implement in Step 2d
    },
    setBatchCount: (count: number) => {
      setBatchCount(count)
    },
    clearHerbSelections: () => {
      setSelectedHerbQuantities(new Map())
    },
    switchBrewMode: (mode: BrewMode) => {
      setBrewMode(mode)
      setSelectedHerbQuantities(new Map())
      setAssignedPairs([])
      setChoices({})
      setSelectedRecipes([])
      setBatchCount(1)
      setPhase(mode === 'by-herbs' ? { phase: 'select-herbs' } : { phase: 'select-recipes' })
    },
    proceedToPairing: () => {
      // Stub - will implement in Step 2d
    },
    proceedToChoices: () => {
      // Stub - will implement in Step 2d
    },
    proceedToHerbSelection: () => {
      // Stub - will implement in Step 2d
    },
    proceedFromRecipeMode: () => {
      // Stub - will implement in Step 2d
    },
    reset: () => {
      setSelectedHerbQuantities(new Map())
      setAssignedPairs([])
      setChoices({})
      setSelectedRecipes([])
      setBatchCount(1)
      setMutationError(null)
      setPhase(brewMode === 'by-herbs' ? { phase: 'select-herbs' } : { phase: 'select-recipes' })
    },
    setPhase,
    setMutationError
  }

  // ============ Return ============

  return {
    // Core state
    brewMode,
    phase,
    // Selection state
    selectedHerbQuantities,
    assignedPairs,
    choices,
    selectedRecipes,
    batchCount,
    mutationError,
    // Computed (by-herbs)
    selectedHerbs,
    totalHerbsSelected,
    elementPool,
    remainingElements,
    pairedEffects,
    pairingValidation,
    requiredChoices,
    recipes,
    requiredElements,
    matchingHerbs,
    herbsSatisfyRecipes,
    // Actions
    actions
  }
}

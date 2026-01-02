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

  // ============ Computed Values (stubs for now - Step 2c) ============

  const selectedHerbs: InventoryItem[] = []
  const totalHerbsSelected = 0
  const elementPool = new Map<string, number>()
  const remainingElements = new Map<string, number>()
  const pairedEffects: PairedEffect[] = []
  const pairingValidation = { valid: false, type: null }
  const requiredChoices: { variable: string; options: string[] | null }[] = []
  const recipes: Recipe[] = []
  const requiredElements = new Map<string, number>()
  const matchingHerbs: InventoryItem[] = []
  const herbsSatisfyRecipes = false

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
    // Computed (stubs)
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

/**
 * Brew component types
 */

import type { Recipe } from '@/lib/types'
import type { PairedEffect } from '@/lib/brewing'
import type { CharacterHerb } from '@/lib/types'

// Adapt CharacterHerb to InventoryItem-like interface for component compatibility
// herb is always present when fetched with join
export type InventoryItem = CharacterHerb & { herb: NonNullable<CharacterHerb['herb']> }

export type BrewMode = 'by-herbs' | 'by-recipe'

export type BrewResult = {
  success: boolean
  roll: number
  total: number
}

export type SelectedRecipe = {
  recipe: Recipe
  count: number
}

export type BrewPhase =
  | { phase: 'select-herbs' }
  | { phase: 'pair-elements'; selectedHerbs: InventoryItem[] }
  | { phase: 'select-recipes' }
  | { phase: 'select-herbs-for-recipes'; selectedRecipes: SelectedRecipe[] }
  | { phase: 'make-choices'; selectedHerbs: InventoryItem[]; pairedEffects: PairedEffect[] }
  | { phase: 'brewing'; selectedHerbs: InventoryItem[]; pairedEffects: PairedEffect[]; choices: Record<string, string> }
  | { phase: 'result'; success: boolean; roll: number; total: number; type: string; description: string; selectedHerbs: InventoryItem[] }
  | { phase: 'batch-result'; results: BrewResult[]; type: string; description: string; successCount: number }

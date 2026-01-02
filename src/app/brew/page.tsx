'use client'

/**
 * Brew Page
 * 
 * Allows herbalists to combine herbs into elixirs, bombs, and oils.
 * Supports two modes:
 * - "By Herbs": Select herbs first, then pair elements to create effects
 * - "By Recipe": Select recipes first, then find matching herbs
 */                                       

import { useEffect, useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useProfile } from '@/lib/profile'
import { useAuth } from '@/lib/auth'
import {
  useCharacter,
  useCharacterHerbs,
  useCharacterRecipesNew,
  useInvalidateQueries,
  useBrewState,
} from '@/lib/hooks'
import {
  brewItems,
} from '@/lib/db/characterInventory'
import {
  findRecipeForPair,
  canCombineEffects,
  parseTemplateVariables,
  computeBrewedDescription,
  PairedEffect
} from '@/lib/brewing'
import type { CharacterHerb, CharacterRecipe } from '@/lib/types'
import { Recipe } from '@/lib/types'
import { rollD20 } from '@/lib/dice'
import { BREWING_DC, MAX_HERBS_PER_BREW } from '@/lib/constants'
import { PageLayout, ErrorDisplay, BrewSkeleton } from '@/components/ui'
import {
  HerbSelector,
  SelectedHerbsSummary,
  PairingPhase,
  ChoicesPhase,
  ResultPhase,
  BatchResultPhase,
  RecipeSelector,
  RecipeRequirements,
  ModeToggle,
  type BrewMode,
  type BrewPhase,
  type BrewResult,
  type SelectedRecipe,
  type InventoryItem
} from '@/components/brew'

// ============ Main Component ============

export default function BrewPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { profile, isLoaded: profileLoaded } = useProfile()
  const { invalidateCharacterHerbs, invalidateCharacterBrewedItems } = useInvalidateQueries()

  // Character data - herbalism is now character-based
  const { data: character, isLoading: characterLoading } = useCharacter(user?.id ?? null)
  const characterId = character?.id ?? null

  // React Query handles data fetching and caching (character-based)
  const {
    data: rawInventory = [],
    isLoading: inventoryLoading,
    error: inventoryError
  } = useCharacterHerbs(characterId)

  // Filter to only items with herb data (should always be present from join)
  const inventory = rawInventory.filter((item): item is InventoryItem => !!item.herb)

  const {
    data: characterRecipes = [],
    isLoading: recipesLoading,
    error: recipesError
  } = useCharacterRecipesNew(characterId)

  // Brew state hook (Step 2b: useState declarations moved to hook)
  const brewState = useBrewState({ inventory, characterRecipes })
  const {
    brewMode,
    phase,
    selectedHerbQuantities,
    assignedPairs,
    choices,
    selectedRecipes,
    batchCount,
    mutationError,
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
    actions
  } = brewState
  
  // Derived loading and error state
  const loading = !profileLoaded || inventoryLoading || recipesLoading
  const error = inventoryError?.message || recipesError?.message || mutationError

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [authLoading, user, router])

  // ============ Computed Values (moved to useBrewState hook) ============
  // selectedHerbs, totalHerbsSelected, elementPool, remainingElements, pairedEffects,
  // pairingValidation, requiredChoices, recipes, requiredElements, matchingHerbs,
  // herbsSatisfyRecipes - all provided by hook

  // ============ Browser Back Button (will move to hook in Step 2d) ============

  const handleBrowserBack = useCallback(() => {
    if (phase.phase === 'result' || phase.phase === 'batch-result') {
      reset()
    } else if (phase.phase === 'make-choices') {
      if (brewMode === 'by-recipe') {
        actions.setPhase({ phase: 'select-herbs-for-recipes', selectedRecipes })
      } else {
        actions.setPhase({ phase: 'pair-elements', selectedHerbs })
      }
    } else if (phase.phase === 'pair-elements') {
      actions.setPhase({ phase: 'select-herbs' })
    } else if (phase.phase === 'select-herbs-for-recipes') {
      // This will be handled by action in Step 2d
      actions.setPhase({ phase: 'select-recipes' })
    } else {
      return false
    }
    return true
  }, [phase, brewMode, selectedRecipes, selectedHerbs, actions])

  useEffect(() => {
    const isDeepPhase = phase.phase !== 'select-herbs' && phase.phase !== 'select-recipes'
    if (isDeepPhase) {
      window.history.pushState({ brewPhase: phase.phase }, '')
    }
  }, [phase.phase])

  useEffect(() => {
    const handlePopState = () => {
      const handled = handleBrowserBack()
      if (handled) window.history.pushState({ brewPhase: 'back' }, '')
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [handleBrowserBack])

  // ============ Actions (moved to useBrewState hook, wrapped here for side effects) ============

  function proceedToBrewing() {
    actions.setPhase({ phase: 'brewing', selectedHerbs, pairedEffects, choices })
    executeBrew()
  }

  async function executeBrew() {
    if (!characterId) return

    const roll = rollD20()
    const total = roll + profile.brewingModifier
    const success = total >= BREWING_DC
    const successCount = success ? 1 : 0

    const type = (pairingValidation.type || 'unknown') as 'elixir' | 'bomb' | 'oil'
    const description = computeBrewedDescription(pairedEffects, choices)
    const effectNames = pairedEffects.flatMap(e => Array(e.count).fill(e.recipe.name))

    // Build herbs to remove array
    const herbsToRemove: Array<{ herb_id: number; quantity: number }> = []
    for (const [itemId, qty] of selectedHerbQuantities.entries()) {
      if (qty > 0) {
        const item = inventory.find(i => i.id === itemId)
        if (item) {
          herbsToRemove.push({ herb_id: item.herb.id, quantity: qty })
        }
      }
    }

    // Atomically remove herbs and create brewed item if successful
    const { error } = await brewItems(
      characterId,
      herbsToRemove,
      type,
      effectNames,
      description,
      Object.keys(choices).length > 0 ? choices : {},
      successCount
    )

    if (error) {
      actions.setMutationError(`Failed to brew: ${error}`)
      return
    }

    // Invalidate caches
    invalidateCharacterHerbs(characterId)
    if (success) {
      invalidateCharacterBrewedItems(characterId)
    }

    actions.setPhase({ phase: 'result', success, roll, total, type, description, selectedHerbs })
  }

  // Wrapper for reset that includes invalidate side effect
  function reset() {
    actions.reset()
    // Invalidate inventory cache to get fresh data after brewing used herbs
    if (characterId) {
      invalidateCharacterHerbs(characterId)
    }
  }
  
  async function executeBrewWithEffects(effects: PairedEffect[], choicesData: Record<string, string>, batch: number = 1) {
    if (!characterId) return

    const validation = canCombineEffects(effects)
    const type = (validation.type || 'unknown') as 'elixir' | 'bomb' | 'oil'
    const description = computeBrewedDescription(effects, choicesData)
    const effectNames = effects.flatMap(e => Array(e.count).fill(e.recipe.name))

    // Build herbs to remove array
    const herbsToRemove: Array<{ herb_id: number; quantity: number }> = []
    for (const [itemId, qty] of selectedHerbQuantities.entries()) {
      if (qty > 0) {
        const item = inventory.find(i => i.id === itemId)
        if (item) {
          herbsToRemove.push({ herb_id: item.herb.id, quantity: qty })
        }
      }
    }

    if (batch === 1) {
      // Single brew: roll dice, then atomically brew
      const roll = rollD20()
      const total = roll + profile.brewingModifier
      const success = total >= BREWING_DC
      const successCount = success ? 1 : 0

      const { error } = await brewItems(
        characterId,
        herbsToRemove,
        type,
        effectNames,
        description,
        Object.keys(choicesData).length > 0 ? choicesData : {},
        successCount
      )

      if (error) {
        actions.setMutationError(`Failed to brew: ${error}`)
        return
      }

      // Invalidate caches
      invalidateCharacterHerbs(characterId)
      if (success) {
        invalidateCharacterBrewedItems(characterId)
      }

      actions.setPhase({ phase: 'result', success, roll, total, type, description, selectedHerbs })
      return
    }

    // Batch brewing: roll all dice first, count successes, then atomically brew
    const results: BrewResult[] = []
    let successCount = 0

    for (let i = 0; i < batch; i++) {
      const roll = rollD20()
      const total = roll + profile.brewingModifier
      const success = total >= BREWING_DC

      results.push({ success, roll, total })
      if (success) successCount++
    }

    // Atomically remove herbs and create all successful brews
    const { error } = await brewItems(
      characterId,
      herbsToRemove,
      type,
      effectNames,
      description,
      Object.keys(choicesData).length > 0 ? choicesData : {},
      successCount
    )

    if (error) {
      actions.setMutationError(`Failed to brew: ${error}`)
      return
    }

    // Invalidate caches
    invalidateCharacterHerbs(characterId)
    if (successCount > 0) {
      invalidateCharacterBrewedItems(characterId)
    }

    actions.setPhase({ phase: 'batch-result', results, type, description, successCount })
  }

  // ============ Render ============

  if (!profileLoaded || loading || authLoading || characterLoading) {
    return <BrewSkeleton />
  }

  // Gate: require character for herbalism
  if (!character) {
    return (
      <PageLayout>
        <h1 className="text-3xl font-bold mb-4">Brew</h1>
        <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-6">
          <p className="text-amber-200 mb-4">
            You need to create a character before you can brew elixirs and bombs.
          </p>
          <Link
            href="/profile"
            className="inline-block px-4 py-2 bg-amber-700 hover:bg-amber-600 rounded-lg text-sm font-medium transition-colors"
          >
            Create Character
          </Link>
        </div>
      </PageLayout>
    )
  }

  // Gate: require herbalist vocation for brewing
  if (character.vocation !== 'herbalist') {
    return (
      <PageLayout>
        <h1 className="text-3xl font-bold mb-4">Brew</h1>
        <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-6">
          <p className="text-amber-200">
            Only characters with the Herbalist vocation can brew elixirs and bombs.
          </p>
          <Link
            href="/profile"
            className="inline-block mt-4 px-4 py-2 bg-amber-700 hover:bg-amber-600 rounded-lg text-sm font-medium transition-colors"
          >
            View Profile
          </Link>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout maxWidth="max-w-3xl">
      <h1 className="text-3xl font-bold mb-1">⚗️ Brew</h1>
      <p className="text-zinc-500 text-sm mb-4">
        Brewing modifier: {profile.brewingModifier >= 0 ? '+' : ''}{profile.brewingModifier}
      </p>

      {/* Mode Toggle */}
      {(phase.phase === 'select-herbs' || phase.phase === 'select-recipes') && (
        <ModeToggle brewMode={brewMode} onModeChange={actions.switchBrewMode} />
      )}

      {error && <ErrorDisplay message={error} className="mb-6" />}

      {/* Phase: Select Herbs (by-herbs mode) */}
      {phase.phase === 'select-herbs' && (
        <div className="space-y-6">
          <SelectedHerbsSummary
            selectedHerbs={selectedHerbs}
            selectedQuantities={selectedHerbQuantities}
            elementPool={elementPool}
            totalSelected={totalHerbsSelected}
            maxHerbs={MAX_HERBS_PER_BREW}
            onRemove={actions.removeHerb}
          />

          <div>
            <h2 className="font-semibold mb-3">Your Inventory</h2>
            <HerbSelector
              inventory={inventory}
              selectedQuantities={selectedHerbQuantities}
              totalSelected={totalHerbsSelected}
              maxHerbs={MAX_HERBS_PER_BREW}
              onAdd={actions.addHerb}
              onRemove={actions.removeHerb}
            />
          </div>

          <button
            onClick={actions.proceedToPairing}
            disabled={totalHerbsSelected === 0}
            className="w-full py-3 bg-purple-700 hover:bg-purple-600 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg font-semibold transition-colors"
          >
            {totalHerbsSelected === 0
              ? 'Select Herbs to Continue'
              : `Continue with ${totalHerbsSelected} Herb${totalHerbsSelected > 1 ? 's' : ''}`
            }
          </button>
        </div>
      )}

      {/* Phase: Select Recipes (by-recipe mode) */}
      {phase.phase === 'select-recipes' && (
        <RecipeSelector
          recipes={recipes}
          selectedRecipes={selectedRecipes}
          batchCount={batchCount}
          requiredElements={requiredElements}
          onAddRecipe={actions.addRecipeSelection}
          onRemoveRecipe={actions.removeRecipeSelection}
          onBatchCountChange={actions.setBatchCount}
          onProceed={actions.proceedToHerbSelection}
        />
      )}

      {/* Phase: Select Herbs for Recipes (by-recipe mode) */}
      {phase.phase === 'select-herbs-for-recipes' && (
        <div className="space-y-6">
          {/* Requirements */}
          <RecipeRequirements
            selectedRecipes={selectedRecipes}
            requiredElements={requiredElements}
            selectedHerbQuantities={selectedHerbQuantities}
            inventory={inventory}
            batchCount={batchCount}
          />

          {/* Herb selector */}
          <div>
            <h2 className="font-semibold mb-3">Available Herbs</h2>
            <HerbSelector
              inventory={matchingHerbs}
              selectedQuantities={selectedHerbQuantities}
              totalSelected={totalHerbsSelected}
              maxHerbs={MAX_HERBS_PER_BREW * batchCount}
              onAdd={actions.addHerb}
              onRemove={actions.removeHerb}
              highlightElements={new Set(requiredElements.keys())}
            />
          </div>

          <div className="text-sm text-zinc-400 text-center">
            {totalHerbsSelected} / {MAX_HERBS_PER_BREW * batchCount} herbs selected
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => actions.setPhase({ phase: 'select-recipes' })}
              className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg font-medium transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={actions.proceedFromRecipeMode}
              disabled={!herbsSatisfyRecipes}
              className="flex-1 py-3 bg-purple-700 hover:bg-purple-600 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg font-semibold transition-colors"
            >
              {herbsSatisfyRecipes ? 'Brew!' : 'Select herbs to fulfill requirements'}
            </button>
          </div>
        </div>
      )}

      {/* Phase: Pair Elements */}
      {phase.phase === 'pair-elements' && (
        <PairingPhase
          elementPool={elementPool}
          remainingElements={remainingElements}
          assignedPairs={assignedPairs}
          pairedEffects={pairedEffects}
          recipes={recipes}
          pairingValidation={pairingValidation}
          onAddPair={actions.addPair}
          onRemovePair={actions.removePair}
          onProceed={actions.proceedToChoices}
          onBack={() => actions.setPhase({ phase: 'select-herbs' })}
        />
      )}

      {/* Phase: Make Choices */}
      {phase.phase === 'make-choices' && (
        <ChoicesPhase
          pairedEffects={phase.pairedEffects}
          choices={choices}
          onUpdateChoice={actions.setChoice}
          onProceed={() => {
            if (brewMode === 'by-recipe') {
              actions.setPhase({ phase: 'brewing', selectedHerbs: phase.selectedHerbs, pairedEffects: phase.pairedEffects, choices })
              executeBrewWithEffects(phase.pairedEffects, choices, batchCount)
            } else {
              proceedToBrewing()
            }
          }}
          onBack={() => {
            if (brewMode === 'by-recipe') {
              actions.setPhase({ phase: 'select-herbs-for-recipes', selectedRecipes })
            } else {
              actions.setPhase({ phase: 'pair-elements', selectedHerbs })
            }
          }}
        />
      )}

      {/* Phase: Brewing */}
      {phase.phase === 'brewing' && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            {mutationError ? (
              <>
                <div className="text-4xl mb-4">💥</div>
                <p className="text-xl text-red-400 mb-2">Brewing failed</p>
                <p className="text-sm text-stone-500 mb-4">{mutationError}</p>
                <button
                  onClick={reset}
                  className="px-4 py-2 bg-stone-700 hover:bg-stone-600 rounded-lg text-stone-200 transition-colors"
                >
                  Start Over
                </button>
              </>
            ) : (
              <>
                <div className="text-4xl mb-4">⚗️</div>
                <p className="text-xl">Brewing...</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Phase: Result */}
      {phase.phase === 'result' && (
        <ResultPhase
          success={phase.success}
          roll={phase.roll}
          total={phase.total}
          brewingMod={profile.brewingModifier}
          type={phase.type}
          description={phase.description}
          onReset={reset}
        />
      )}

      {/* Phase: Batch Result */}
      {phase.phase === 'batch-result' && (
        <BatchResultPhase
          results={phase.results}
          brewingMod={profile.brewingModifier}
          type={phase.type}
          description={phase.description}
          successCount={phase.successCount}
          onReset={reset}
        />
      )}
    </PageLayout>
  )
}

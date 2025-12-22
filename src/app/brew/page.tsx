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
import { useProfile } from '@/lib/profile'
import { getInventory, InventoryItem, removeHerbsFromInventory } from '@/lib/inventory'
import { 
  fetchUserRecipes,
  findRecipeForPair,
  canCombineEffects,
  parseTemplateVariables,
  computeBrewedDescription,
  saveBrewedItem,
  PairedEffect
} from '@/lib/brewing'
import { Recipe } from '@/lib/types'
import { rollD20 } from '@/lib/dice'
import { BREWING_DC, MAX_HERBS_PER_BREW, getElementSymbol } from '@/lib/constants'
import { PageLayout, LoadingState, ErrorDisplay } from '@/components/ui'
import { 
  HerbSelector, 
  SelectedHerbsSummary,
  PairingPhase, 
  ChoicesPhase, 
  ResultPhase, 
  BatchResultPhase,
  RecipeSelector 
} from '@/components/brew'

// ============ Types ============

type BrewMode = 'by-herbs' | 'by-recipe'

type BrewResult = {
  success: boolean
  roll: number
  total: number
}

type SelectedRecipe = {
  recipe: Recipe
  count: number
}

type BrewPhase = 
  | { phase: 'select-herbs' }
  | { phase: 'pair-elements'; selectedHerbs: InventoryItem[] }
  | { phase: 'select-recipes' }
  | { phase: 'select-herbs-for-recipes'; selectedRecipes: SelectedRecipe[] }
  | { phase: 'make-choices'; selectedHerbs: InventoryItem[]; pairedEffects: PairedEffect[] }
  | { phase: 'brewing'; selectedHerbs: InventoryItem[]; pairedEffects: PairedEffect[]; choices: Record<string, string> }
  | { phase: 'result'; success: boolean; roll: number; total: number; type: string; description: string; selectedHerbs: InventoryItem[] }
  | { phase: 'batch-result'; results: BrewResult[]; type: string; description: string; successCount: number }

// ============ Main Component ============

export default function BrewPage() {
  const { profile, profileId, isLoaded: profileLoaded } = useProfile()
  
  // Data state
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Mode and phase
  const [brewMode, setBrewMode] = useState<BrewMode>('by-herbs')
  const [phase, setPhase] = useState<BrewPhase>({ phase: 'select-herbs' })
  
  // Selection state
  const [selectedHerbQuantities, setSelectedHerbQuantities] = useState<Map<number, number>>(new Map())
  const [assignedPairs, setAssignedPairs] = useState<[string, string][]>([])
  const [choices, setChoices] = useState<Record<string, string>>({})
  const [selectedRecipes, setSelectedRecipes] = useState<SelectedRecipe[]>([])
  const [batchCount, setBatchCount] = useState(1)

  // Load data
  useEffect(() => {
    async function loadData() {
      if (!profileLoaded || !profileId) return

      const [invResult, recResult] = await Promise.all([
        getInventory(profileId),
        fetchUserRecipes(profileId)
      ])
      
      if (invResult.error) setError(invResult.error)
      else setInventory(invResult.items)
      
      if (recResult.error) setError(recResult.error)
      else setRecipes(recResult.recipes)
      
      setLoading(false)
    }
    loadData()
  }, [profileLoaded, profileId])

  // ============ Computed Values ============

  const selectedHerbs = useMemo(() => {
    const items: InventoryItem[] = []
    for (const [itemId, qty] of selectedHerbQuantities) {
      const item = inventory.find(i => i.id === itemId)
      if (item && qty > 0) items.push(item)
    }
    return items
  }, [inventory, selectedHerbQuantities])
  
  const totalHerbsSelected = useMemo(() => {
    let total = 0
    for (const qty of selectedHerbQuantities.values()) total += qty
    return total
  }, [selectedHerbQuantities])

  const elementPool = useMemo(() => {
    const pool = new Map<string, number>()
    for (const [itemId, qty] of selectedHerbQuantities) {
      const item = inventory.find(i => i.id === itemId)
      if (item && qty > 0) {
        for (const element of item.herb.elements) {
          pool.set(element, (pool.get(element) || 0) + qty)
        }
      }
    }
    return pool
  }, [selectedHerbQuantities, inventory])

  const remainingElements = useMemo(() => {
    const remaining = new Map(elementPool)
    for (const [el1, el2] of assignedPairs) {
      remaining.set(el1, (remaining.get(el1) || 0) - 1)
      remaining.set(el2, (remaining.get(el2) || 0) - 1)
    }
    for (const [el, count] of remaining) {
      if (count <= 0) remaining.delete(el)
    }
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

  // Recipe mode computed values
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
    if (requiredElements.size === 0) return []
    const requiredSet = new Set(requiredElements.keys())
    return inventory.filter(item => item.herb.elements.some(el => requiredSet.has(el)))
  }, [inventory, requiredElements])
  
  const herbsSatisfyRecipes = useMemo(() => {
    if (selectedRecipes.length === 0) return false
    
    // Check total elements
    const totalElements = new Map<string, number>()
    for (const [itemId, qty] of selectedHerbQuantities) {
      const item = inventory.find(i => i.id === itemId)
      if (item && qty > 0) {
        for (const element of item.herb.elements) {
          totalElements.set(element, (totalElements.get(element) || 0) + qty)
        }
      }
    }
    
    for (const [element, needed] of requiredElements) {
      if ((totalElements.get(element) || 0) < needed) return false
    }
    
    // Check instances per element for batch brewing
    const instancesWithElement = new Map<string, number>()
    for (const [itemId, qty] of selectedHerbQuantities) {
      const item = inventory.find(i => i.id === itemId)
      if (item && qty > 0) {
        for (const element of new Set(item.herb.elements)) {
          instancesWithElement.set(element, (instancesWithElement.get(element) || 0) + qty)
        }
      }
    }
    
    const recipeElements = new Set<string>()
    for (const { recipe } of selectedRecipes) {
      for (const el of recipe.elements) recipeElements.add(el)
    }
    
    for (const element of recipeElements) {
      if ((instancesWithElement.get(element) || 0) < batchCount) return false
    }
    
    return true
  }, [selectedHerbQuantities, inventory, requiredElements, selectedRecipes, batchCount])

  // ============ Browser Back Button ============

  const handleBrowserBack = useCallback(() => {
    if (phase.phase === 'result' || phase.phase === 'batch-result') {
      reset()
    } else if (phase.phase === 'make-choices') {
      if (brewMode === 'by-recipe') {
        setPhase({ phase: 'select-herbs-for-recipes', selectedRecipes })
      } else {
        setPhase({ phase: 'pair-elements', selectedHerbs })
      }
    } else if (phase.phase === 'pair-elements') {
      setPhase({ phase: 'select-herbs' })
    } else if (phase.phase === 'select-herbs-for-recipes') {
      setSelectedHerbQuantities(new Map())
      setPhase({ phase: 'select-recipes' })
    } else {
      return false
    }
    return true
  }, [phase, brewMode, selectedRecipes, selectedHerbs])

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

  // ============ Actions ============

  function addHerb(itemId: number) {
    const item = inventory.find(i => i.id === itemId)
    if (!item) return
    
    const currentQty = selectedHerbQuantities.get(itemId) || 0
    if (currentQty >= item.quantity) return
    
    const maxHerbs = brewMode === 'by-recipe' ? MAX_HERBS_PER_BREW * batchCount : MAX_HERBS_PER_BREW
    if (totalHerbsSelected >= maxHerbs) return
    
    setSelectedHerbQuantities(prev => new Map(prev).set(itemId, currentQty + 1))
  }
  
  function removeHerb(itemId: number) {
    const currentQty = selectedHerbQuantities.get(itemId) || 0
    if (currentQty <= 0) return
    
    setSelectedHerbQuantities(prev => {
      const next = new Map(prev)
      if (currentQty === 1) next.delete(itemId)
      else next.set(itemId, currentQty - 1)
      return next
    })
  }

  function addPair(el1: string, el2: string) {
    setAssignedPairs(prev => [...prev, [el1, el2]])
  }

  function removePair(index: number) {
    setAssignedPairs(prev => prev.filter((_, i) => i !== index))
  }

  function proceedToPairing() {
    if (selectedHerbs.length === 0) return
    setAssignedPairs([])
    setChoices({})
    setPhase({ phase: 'pair-elements', selectedHerbs })
  }

  function proceedToChoices() {
    if (!pairingValidation.valid || pairedEffects.length === 0) return
    
    if (requiredChoices.length > 0) {
      setPhase({ phase: 'make-choices', selectedHerbs, pairedEffects })
    } else {
      proceedToBrewing()
    }
  }

  function proceedToBrewing() {
    setPhase({ phase: 'brewing', selectedHerbs, pairedEffects, choices })
    executeBrew()
  }

  async function executeBrew() {
    if (!profileId) return

    const roll = rollD20()
    const total = roll + profile.brewingModifier
    const success = total >= BREWING_DC

    // Remove herbs
    const removals = Array.from(selectedHerbQuantities.entries())
      .filter(([, qty]) => qty > 0)
      .map(([itemId]) => {
        const item = inventory.find(i => i.id === itemId)
        return { herbId: item!.herb.id, quantity: selectedHerbQuantities.get(itemId)! }
      })
    
    await removeHerbsFromInventory(profileId, removals)

    const type = pairingValidation.type || 'unknown'
    const description = computeBrewedDescription(pairedEffects, choices)

    if (success) {
      const effectNames = pairedEffects.flatMap(e => Array(e.count).fill(e.recipe.name))
      await saveBrewedItem(profileId, type, effectNames, Object.keys(choices).length > 0 ? choices : null, description)
    }

    setPhase({ phase: 'result', success, roll, total, type, description, selectedHerbs })
  }

  function reset() {
    setSelectedHerbQuantities(new Map())
    setAssignedPairs([])
    setChoices({})
    setSelectedRecipes([])
    setBatchCount(1)
    setPhase(brewMode === 'by-herbs' ? { phase: 'select-herbs' } : { phase: 'select-recipes' })
    
    if (profileId) {
      getInventory(profileId).then(result => {
        if (!result.error) setInventory(result.items)
      })
    }
  }
  
  function switchBrewMode(mode: BrewMode) {
    setBrewMode(mode)
    setSelectedHerbQuantities(new Map())
    setAssignedPairs([])
    setChoices({})
    setSelectedRecipes([])
    setBatchCount(1)
    setPhase(mode === 'by-herbs' ? { phase: 'select-herbs' } : { phase: 'select-recipes' })
  }
  
  // Recipe mode actions
  function addRecipeSelection(recipe: Recipe) {
    setSelectedRecipes(prev => {
      const existing = prev.find(r => r.recipe.id === recipe.id)
      if (existing) {
        return prev.map(r => r.recipe.id === recipe.id ? { ...r, count: r.count + 1 } : r)
      }
      return [...prev, { recipe, count: 1 }]
    })
  }
  
  function removeRecipeSelection(recipeId: number) {
    setSelectedRecipes(prev => {
      const existing = prev.find(r => r.recipe.id === recipeId)
      if (existing && existing.count > 1) {
        return prev.map(r => r.recipe.id === recipeId ? { ...r, count: r.count - 1 } : r)
      }
      return prev.filter(r => r.recipe.id !== recipeId)
    })
  }
  
  function proceedToHerbSelection() {
    if (selectedRecipes.length === 0) return
    setSelectedHerbQuantities(new Map())
    setPhase({ phase: 'select-herbs-for-recipes', selectedRecipes })
  }
  
  function proceedFromRecipeMode() {
    if (!herbsSatisfyRecipes) return
    
    const effects: PairedEffect[] = selectedRecipes.map(({ recipe, count }) => ({ recipe, count }))
    
    // Check for choices
    const allChoices: { variable: string; options: string[] | null }[] = []
    const seen = new Set<string>()
    for (const { recipe } of selectedRecipes) {
      if (recipe.description) {
        for (const v of parseTemplateVariables(recipe.description)) {
          if (!seen.has(v.variable)) {
            seen.add(v.variable)
            allChoices.push(v)
          }
        }
      }
    }
    
    if (allChoices.length > 0) {
      setPhase({ phase: 'make-choices', selectedHerbs, pairedEffects: effects })
    } else {
      setChoices({})
      setPhase({ phase: 'brewing', selectedHerbs, pairedEffects: effects, choices: {} })
      executeBrewWithEffects(effects, {}, batchCount)
    }
  }
  
  async function executeBrewWithEffects(effects: PairedEffect[], choicesData: Record<string, string>, batch: number = 1) {
    if (!profileId) return

    const validation = canCombineEffects(effects)
    const type = validation.type || 'unknown'
    const description = computeBrewedDescription(effects, choicesData)

    // Remove herbs
    const removals = Array.from(selectedHerbQuantities.entries())
      .filter(([, qty]) => qty > 0)
      .map(([itemId]) => {
        const item = inventory.find(i => i.id === itemId)
        return { herbId: item!.herb.id, quantity: selectedHerbQuantities.get(itemId)! }
      })
    await removeHerbsFromInventory(profileId, removals)

    if (batch === 1) {
      const roll = rollD20()
      const total = roll + profile.brewingModifier
      const success = total >= BREWING_DC

      if (success) {
        const effectNames = effects.flatMap(e => Array(e.count).fill(e.recipe.name))
        await saveBrewedItem(profileId, type, effectNames, Object.keys(choicesData).length > 0 ? choicesData : null, description)
      }

      setPhase({ phase: 'result', success, roll, total, type, description, selectedHerbs })
      return
    }

    // Batch brewing
    const results: BrewResult[] = []
    let successCount = 0

    for (let i = 0; i < batch; i++) {
      const roll = rollD20()
      const total = roll + profile.brewingModifier
      const success = total >= BREWING_DC
      
      results.push({ success, roll, total })
      
      if (success) {
        successCount++
        const effectNames = effects.flatMap(e => Array(e.count).fill(e.recipe.name))
        await saveBrewedItem(profileId, type, effectNames, Object.keys(choicesData).length > 0 ? choicesData : null, description)
      }
    }

    setPhase({ phase: 'batch-result', results, type, description, successCount })
  }

  // ============ Render ============

  if (profileLoaded && !profile.isHerbalist) {
    return (
      <PageLayout>
        <h1 className="text-3xl font-bold mb-4">⚗️ Brew</h1>
        <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-6">
          <p className="text-amber-200">
            Only characters with the Herbalist vocation can brew elixirs and bombs.
          </p>
          <Link 
            href="/profile" 
            className="inline-block mt-4 px-4 py-2 bg-amber-700 hover:bg-amber-600 rounded-lg text-sm font-medium transition-colors"
          >
            Update Profile
          </Link>
        </div>
      </PageLayout>
    )
  }

  if (!profileLoaded || loading) {
    return <LoadingState />
  }

  return (
    <PageLayout maxWidth="max-w-3xl">
      <h1 className="text-3xl font-bold mb-1">⚗️ Brew</h1>
      <p className="text-zinc-500 text-sm mb-4">
        Brewing modifier: {profile.brewingModifier >= 0 ? '+' : ''}{profile.brewingModifier}
      </p>

      {/* Mode Toggle */}
      {(phase.phase === 'select-herbs' || phase.phase === 'select-recipes') && (
        <div className="flex gap-1 p-1 bg-zinc-800 rounded-lg mb-6 w-fit">
          <button
            onClick={() => switchBrewMode('by-herbs')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              brewMode === 'by-herbs' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            🌿 By Herbs
          </button>
          <button
            onClick={() => switchBrewMode('by-recipe')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              brewMode === 'by-recipe' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            📖 By Recipe
          </button>
        </div>
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
            onRemove={removeHerb}
          />

          <div>
            <h2 className="font-semibold mb-3">Your Inventory</h2>
            <HerbSelector
              inventory={inventory}
              selectedQuantities={selectedHerbQuantities}
              totalSelected={totalHerbsSelected}
              maxHerbs={MAX_HERBS_PER_BREW}
              onAdd={addHerb}
              onRemove={removeHerb}
            />
          </div>

          <button
            onClick={proceedToPairing}
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
          onAddRecipe={addRecipeSelection}
          onRemoveRecipe={removeRecipeSelection}
          onBatchCountChange={setBatchCount}
          onProceed={proceedToHerbSelection}
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
              onAdd={addHerb}
              onRemove={removeHerb}
              highlightElements={new Set(requiredElements.keys())}
            />
          </div>
          
          <div className="text-sm text-zinc-400 text-center">
            {totalHerbsSelected} / {MAX_HERBS_PER_BREW * batchCount} herbs selected
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => {
                setSelectedHerbQuantities(new Map())
                setPhase({ phase: 'select-recipes' })
              }}
              className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg font-medium transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={proceedFromRecipeMode}
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
          onAddPair={addPair}
          onRemovePair={removePair}
          onProceed={proceedToChoices}
          onBack={() => setPhase({ phase: 'select-herbs' })}
        />
      )}

      {/* Phase: Make Choices */}
      {phase.phase === 'make-choices' && (
        <ChoicesPhase
          pairedEffects={phase.pairedEffects}
          choices={choices}
          onUpdateChoice={(variable, value) => setChoices(prev => ({ ...prev, [variable]: value }))}
          onProceed={() => {
            if (brewMode === 'by-recipe') {
              setPhase({ phase: 'brewing', selectedHerbs: phase.selectedHerbs, pairedEffects: phase.pairedEffects, choices })
              executeBrewWithEffects(phase.pairedEffects, choices, batchCount)
            } else {
              proceedToBrewing()
            }
          }}
          onBack={() => {
            if (brewMode === 'by-recipe') {
              setPhase({ phase: 'select-herbs-for-recipes', selectedRecipes })
            } else {
              setPhase({ phase: 'pair-elements', selectedHerbs })
            }
          }}
        />
      )}

      {/* Phase: Brewing */}
      {phase.phase === 'brewing' && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="text-4xl mb-4">⚗️</div>
            <p className="text-xl">Brewing...</p>
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

// ============ Helper Components ============

function RecipeRequirements({
  selectedRecipes,
  requiredElements,
  selectedHerbQuantities,
  inventory,
  batchCount,
}: {
  selectedRecipes: SelectedRecipe[]
  requiredElements: Map<string, number>
  selectedHerbQuantities: Map<number, number>
  inventory: InventoryItem[]
  batchCount: number
}) {
  return (
    <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
      <h2 className="font-semibold mb-3">Brewing</h2>
      <div className="space-y-2">
        {selectedRecipes.map(({ recipe, count }) => (
          <div key={recipe.id} className="flex items-center gap-3 text-sm">
            <span>
              {recipe.elements.map((el, i) => (
                <span key={i}>{getElementSymbol(el)}</span>
              ))}
            </span>
            <span className="text-zinc-200">{recipe.name}</span>
            {count > 1 && <span className="text-purple-400">×{count}</span>}
          </div>
        ))}
      </div>
      
      {/* Element requirements with fulfillment status */}
      <div className="pt-3 mt-3 border-t border-zinc-700">
        <p className="text-zinc-400 text-sm mb-2">Required elements:</p>
        <div className="flex flex-wrap gap-2">
          {Array.from(requiredElements.entries()).map(([element, needed]) => {
            let totalHave = 0
            for (const [itemId, qty] of selectedHerbQuantities) {
              const item = inventory.find(i => i.id === itemId)
              if (item && qty > 0) {
                totalHave += item.herb.elements.filter(e => e === element).length * qty
              }
            }
            const fulfilled = totalHave >= needed
            
            return (
              <div 
                key={element}
                className={`px-2 py-1 rounded text-sm flex items-center gap-1 ${
                  fulfilled ? 'bg-green-900/50 border border-green-700' : 'bg-zinc-700 border border-zinc-600'
                }`}
              >
                <span>{getElementSymbol(element)}</span>
                <span className={fulfilled ? 'text-green-300' : 'text-zinc-300'}>
                  {totalHave}/{needed}
                </span>
                {fulfilled && <span className="text-green-400">✓</span>}
              </div>
            )
          })}
        </div>
        
        {/* Instance check for batch brewing */}
        {batchCount > 1 && (() => {
          const recipeElements = new Set<string>()
          for (const { recipe } of selectedRecipes) {
            for (const el of recipe.elements) recipeElements.add(el)
          }
          
          const instanceCheck: { element: string; have: number; need: number; ok: boolean }[] = []
          for (const element of recipeElements) {
            let instances = 0
            for (const [itemId, qty] of selectedHerbQuantities) {
              const item = inventory.find(i => i.id === itemId)
              if (item && qty > 0 && item.herb.elements.includes(element)) {
                instances += qty
              }
            }
            instanceCheck.push({ element, have: instances, need: batchCount, ok: instances >= batchCount })
          }
          
          if (instanceCheck.every(c => c.ok)) return null
          
          return (
            <div className="mt-2 pt-2 border-t border-zinc-600">
              <p className="text-amber-400 text-xs mb-1">
                ⚠️ Need {batchCount} herb instances per element for {batchCount} brews:
              </p>
              <div className="flex flex-wrap gap-2">
                {instanceCheck.filter(c => !c.ok).map(({ element, have, need }) => (
                  <span key={element} className="text-xs text-red-400">
                    {getElementSymbol(element)} {have}/{need} herbs
                  </span>
                ))}
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState, useMemo } from 'react'
import { useProfile } from '@/lib/profile'
import { getInventory, InventoryItem, removeHerbsFromInventory } from '@/lib/inventory'
import { 
  buildElementPool, 
  getTotalElements,
  fetchRecipes,
  findRecipeForPair,
  canCombineEffects,
  parseTemplateVariables,
  computeBrewedDescription,
  saveBrewedItem,
  PairedEffect
} from '@/lib/brewing'
import { Recipe, Herb } from '@/lib/types'
import { rollD20 } from '@/lib/dice'
import Link from 'next/link'

// Element display
const ELEMENT_SYMBOLS: Record<string, string> = {
  fire: '🔥',
  water: '💧',
  earth: '⛰️',
  air: '💨',
  positive: '✨',
  negative: '💀',
}

function getElementSymbol(element: string): string {
  return ELEMENT_SYMBOLS[element.toLowerCase()] || '●'
}

type BrewPhase = 
  | { phase: 'select-herbs' }
  | { phase: 'pair-elements'; selectedHerbs: InventoryItem[] }
  | { phase: 'make-choices'; selectedHerbs: InventoryItem[]; pairedEffects: PairedEffect[] }
  | { phase: 'brewing'; selectedHerbs: InventoryItem[]; pairedEffects: PairedEffect[]; choices: Record<string, string> }
  | { phase: 'result'; success: boolean; roll: number; total: number; type: string; description: string; selectedHerbs: InventoryItem[] }

export default function BrewPage() {
  const { profile, guestId, isLoaded: profileLoaded } = useProfile()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Selection state
  const [selectedHerbIds, setSelectedHerbIds] = useState<Set<number>>(new Set())
  const [phase, setPhase] = useState<BrewPhase>({ phase: 'select-herbs' })
  
  // Pairing state
  const [assignedPairs, setAssignedPairs] = useState<[string, string][]>([])
  const [choices, setChoices] = useState<Record<string, string>>({})

  // Load inventory and recipes
  useEffect(() => {
    async function loadData() {
      if (!profileLoaded || !guestId) return

      const [invResult, recResult] = await Promise.all([
        getInventory(guestId),
        fetchRecipes()
      ])
      
      if (invResult.error) {
        setError(invResult.error)
      } else {
        setInventory(invResult.items)
      }
      
      if (recResult.error) {
        setError(recResult.error)
      } else {
        setRecipes(recResult.recipes)
      }
      
      setLoading(false)
    }

    loadData()
  }, [profileLoaded, guestId])

  // Get selected herbs as full items
  const selectedHerbs = useMemo(() => 
    inventory.filter(item => selectedHerbIds.has(item.id)),
    [inventory, selectedHerbIds]
  )

  // Build element pool from selection
  const elementPool = useMemo(() => {
    const herbs = selectedHerbs.map(item => item.herb)
    return buildElementPool(herbs)
  }, [selectedHerbs])

  // Calculate remaining elements after pairing
  const remainingElements = useMemo(() => {
    const remaining = new Map(elementPool)
    for (const [el1, el2] of assignedPairs) {
      remaining.set(el1, (remaining.get(el1) || 0) - 1)
      remaining.set(el2, (remaining.get(el2) || 0) - 1)
    }
    // Remove zeros
    for (const [el, count] of remaining) {
      if (count <= 0) remaining.delete(el)
    }
    return remaining
  }, [elementPool, assignedPairs])

  // Get effects from assigned pairs
  const pairedEffects = useMemo(() => {
    const effectCounts = new Map<string, { recipe: Recipe; count: number }>()
    
    for (const [el1, el2] of assignedPairs) {
      const recipe = findRecipeForPair(recipes, el1, el2)
      if (recipe) {
        const existing = effectCounts.get(recipe.name)
        if (existing) {
          existing.count++
        } else {
          effectCounts.set(recipe.name, { recipe, count: 1 })
        }
      }
    }
    
    return Array.from(effectCounts.values())
  }, [assignedPairs, recipes])

  // Check if current pairing is valid
  const pairingValidation = useMemo(() => 
    canCombineEffects(pairedEffects),
    [pairedEffects]
  )

  // Get required choices from all effects
  const requiredChoices = useMemo(() => {
    const allChoices: { variable: string; options: string[] | null }[] = []
    const seen = new Set<string>()
    
    for (const effect of pairedEffects) {
      if (effect.recipe.description) {
        const vars = parseTemplateVariables(effect.recipe.description)
        for (const v of vars) {
          if (!seen.has(v.variable)) {
            seen.add(v.variable)
            allChoices.push(v)
          }
        }
      }
    }
    
    return allChoices
  }, [pairedEffects])

  // Toggle herb selection
  function toggleHerb(itemId: number) {
    setSelectedHerbIds(prev => {
      const next = new Set(prev)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        if (next.size < 6) { // Max 6 herbs
          next.add(itemId)
        }
      }
      return next
    })
  }

  // Add a pair
  function addPair(el1: string, el2: string) {
    setAssignedPairs(prev => [...prev, [el1, el2]])
  }

  // Remove a pair
  function removePair(index: number) {
    setAssignedPairs(prev => prev.filter((_, i) => i !== index))
  }

  // Move to pairing phase
  function proceedToPairing() {
    if (selectedHerbs.length === 0) return
    setAssignedPairs([])
    setChoices({})
    setPhase({ phase: 'pair-elements', selectedHerbs })
  }

  // Move to choices phase (or brewing if no choices needed)
  function proceedToChoices() {
    if (!pairingValidation.valid || pairedEffects.length === 0) return
    
    if (requiredChoices.length > 0) {
      setPhase({ phase: 'make-choices', selectedHerbs, pairedEffects })
    } else {
      proceedToBrewing()
    }
  }

  // Move to brewing
  function proceedToBrewing() {
    setPhase({ phase: 'brewing', selectedHerbs, pairedEffects, choices })
    executeBrew()
  }

  // Execute the brew
  async function executeBrew() {
    if (!guestId) return

    const dc = 15 // Brewing DC
    const roll = rollD20()
    const total = roll + profile.brewingModifier
    const success = total >= dc

    // Remove herbs from inventory regardless of success
    const herbRemovals = selectedHerbs.map(item => ({
      herbId: item.herb.id,
      quantity: 1
    }))
    
    await removeHerbsFromInventory(guestId, herbRemovals)

    // Calculate result
    const type = pairingValidation.type || 'unknown'
    const description = computeBrewedDescription(pairedEffects, choices)

    if (success) {
      // Save the brewed item
      const effectNames = pairedEffects.flatMap(e => 
        Array(e.count).fill(e.recipe.name)
      )
      
      await saveBrewedItem(
        guestId,
        type,
        effectNames,
        Object.keys(choices).length > 0 ? choices : null,
        description
      )
    }

    setPhase({
      phase: 'result',
      success,
      roll,
      total,
      type,
      description,
      selectedHerbs
    })
  }

  // Reset to start
  function reset() {
    setSelectedHerbIds(new Set())
    setAssignedPairs([])
    setChoices({})
    setPhase({ phase: 'select-herbs' })
    
    // Reload inventory
    if (guestId) {
      getInventory(guestId).then(result => {
        if (!result.error) {
          setInventory(result.items)
        }
      })
    }
  }

  // Check if user is herbalist
  if (profileLoaded && !profile.isHerbalist) {
    return (
      <div className="min-h-screen bg-zinc-900 text-zinc-100 p-8">
        <div className="max-w-2xl mx-auto">
          <Link href="/" className="text-zinc-400 hover:text-zinc-200 mb-4 inline-block">
            ← Back
          </Link>
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
        </div>
      </div>
    )
  }

  if (!profileLoaded || loading) {
    return (
      <div className="min-h-screen bg-zinc-900 text-zinc-100 p-8">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 p-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-zinc-400 hover:text-zinc-200 mb-4 inline-block">
          ← Back
        </Link>

        <h1 className="text-3xl font-bold mb-1">⚗️ Brew</h1>
        <p className="text-zinc-500 text-sm mb-6">
          Brewing modifier: {profile.brewingModifier >= 0 ? '+' : ''}{profile.brewingModifier}
        </p>

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Phase: Select Herbs */}
        {phase.phase === 'select-herbs' && (
          <div className="space-y-6">
            {/* Selection Summary */}
            <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-semibold">Selected Herbs</h2>
                <span className="text-zinc-400 text-sm">{selectedHerbs.length}/6</span>
              </div>
              
              {selectedHerbs.length === 0 ? (
                <p className="text-zinc-500 text-sm">Select herbs from your inventory below</p>
              ) : (
                <div className="space-y-2">
                  {/* Selected herbs list */}
                  <div className="flex flex-wrap gap-2">
                    {selectedHerbs.map(item => (
                      <button
                        key={item.id}
                        onClick={() => toggleHerb(item.id)}
                        className="px-3 py-1.5 bg-purple-900/50 border border-purple-700 rounded-lg text-sm flex items-center gap-2 hover:bg-purple-900/70 transition-colors"
                      >
                        <span>{item.herb.name}</span>
                        <span className="text-purple-400">×</span>
                      </button>
                    ))}
                  </div>
                  
                  {/* Element pool preview */}
                  <div className="pt-2 border-t border-zinc-700 mt-3">
                    <span className="text-zinc-400 text-sm mr-2">Elements:</span>
                    {Array.from(elementPool.entries()).map(([el, count]) => (
                      <span key={el} className="mr-2">
                        {Array(count).fill(0).map((_, i) => (
                          <span key={i} title={el}>{getElementSymbol(el)}</span>
                        ))}
                      </span>
                    ))}
                    <span className="text-zinc-500 text-sm ml-2">
                      ({getTotalElements(elementPool)} total)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Inventory */}
            <div>
              <h2 className="font-semibold mb-3">Your Inventory</h2>
              {inventory.length === 0 ? (
                <div className="bg-zinc-800/50 rounded-lg p-6 text-center">
                  <p className="text-zinc-400 mb-4">No herbs to brew with</p>
                  <Link
                    href="/forage"
                    className="inline-block px-4 py-2 bg-green-700 hover:bg-green-600 rounded-lg text-sm font-medium transition-colors"
                  >
                    🔍 Go Foraging
                  </Link>
                </div>
              ) : (
                <div className="space-y-1">
                  {inventory.map((item, idx) => {
                    const isSelected = selectedHerbIds.has(item.id)
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggleHerb(item.id)}
                        disabled={!isSelected && selectedHerbIds.size >= 6}
                        className={`w-full flex items-center justify-between py-2 px-3 rounded transition-colors text-left ${
                          isSelected
                            ? 'bg-purple-900/40 border border-purple-700'
                            : idx % 2 === 0
                              ? 'bg-zinc-800/50 hover:bg-zinc-800 border border-transparent'
                              : 'bg-zinc-800/20 hover:bg-zinc-800 border border-transparent'
                        } ${!isSelected && selectedHerbIds.size >= 6 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={isSelected ? 'text-purple-300' : 'text-zinc-100'}>
                            {item.herb.name}
                          </span>
                          <span className="text-sm">
                            {item.herb.elements.map((el, i) => (
                              <span key={i}>{getElementSymbol(el)}</span>
                            ))}
                          </span>
                          <span className="text-zinc-500 text-xs capitalize">
                            ({item.herb.rarity})
                          </span>
                        </div>
                        <span className="text-zinc-400 text-sm">×{item.quantity}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Proceed Button */}
            <button
              onClick={proceedToPairing}
              disabled={selectedHerbs.length === 0}
              className="w-full py-3 bg-purple-700 hover:bg-purple-600 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg font-semibold transition-colors"
            >
              {selectedHerbs.length === 0 
                ? 'Select Herbs to Continue'
                : `Continue with ${selectedHerbs.length} Herb${selectedHerbs.length > 1 ? 's' : ''}`
              }
            </button>
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
            pairedEffects={pairedEffects}
            requiredChoices={requiredChoices}
            choices={choices}
            onUpdateChoice={(variable, value) => setChoices(prev => ({ ...prev, [variable]: value }))}
            onProceed={proceedToBrewing}
            onBack={() => setPhase({ phase: 'pair-elements', selectedHerbs })}
          />
        )}

        {/* Phase: Brewing / Result */}
        {phase.phase === 'brewing' && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="text-4xl mb-4">⚗️</div>
              <p className="text-xl">Brewing...</p>
            </div>
          </div>
        )}

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
      </div>
    </div>
  )
}

// Pairing Phase Component
function PairingPhase({
  elementPool,
  remainingElements,
  assignedPairs,
  pairedEffects,
  recipes,
  pairingValidation,
  onAddPair,
  onRemovePair,
  onProceed,
  onBack
}: {
  elementPool: Map<string, number>
  remainingElements: Map<string, number>
  assignedPairs: [string, string][]
  pairedEffects: PairedEffect[]
  recipes: Recipe[]
  pairingValidation: { valid: boolean; type: string | null; error?: string }
  onAddPair: (el1: string, el2: string) => void
  onRemovePair: (index: number) => void
  onProceed: () => void
  onBack: () => void
}) {
  const [selectedFirst, setSelectedFirst] = useState<string | null>(null)

  const remainingArray = Array.from(remainingElements.entries())
    .flatMap(([el, count]) => Array(count).fill(el))

  function handleElementClick(element: string) {
    if (selectedFirst === null) {
      setSelectedFirst(element)
    } else {
      onAddPair(selectedFirst, element)
      setSelectedFirst(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Assigned Pairs */}
      <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
        <h2 className="font-semibold mb-3">Assigned Pairs</h2>
        {assignedPairs.length === 0 ? (
          <p className="text-zinc-500 text-sm">Click elements below to create pairs</p>
        ) : (
          <div className="space-y-2">
            {pairedEffects.map((effect, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between py-2 px-3 bg-zinc-700/50 rounded"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">
                    {effect.recipe.elements.map((el, i) => (
                      <span key={i}>{getElementSymbol(el)}</span>
                    ))}
                    {effect.count > 1 && (
                      <span className="text-zinc-400 text-sm ml-1">×{effect.count}</span>
                    )}
                  </span>
                  <span className="text-zinc-300">{effect.recipe.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    effect.recipe.type === 'elixir' 
                      ? 'bg-blue-900/50 text-blue-300' 
                      : 'bg-red-900/50 text-red-300'
                  }`}>
                    {effect.recipe.type}
                  </span>
                </div>
              </div>
            ))}
            
            {/* Individual pair removal buttons */}
            <div className="pt-2 border-t border-zinc-700 flex flex-wrap gap-2">
              {assignedPairs.map((pair, idx) => (
                <button
                  key={idx}
                  onClick={() => onRemovePair(idx)}
                  className="px-2 py-1 bg-zinc-700 hover:bg-red-900/50 rounded text-sm transition-colors"
                >
                  {getElementSymbol(pair[0])}{getElementSymbol(pair[1])} ×
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Validation message */}
        {assignedPairs.length > 0 && !pairingValidation.valid && (
          <p className="text-red-400 text-sm mt-2">{pairingValidation.error}</p>
        )}
      </div>

      {/* Remaining Elements */}
      <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
        <h2 className="font-semibold mb-3">
          Available Elements
          {selectedFirst && (
            <span className="text-purple-400 font-normal ml-2">
              — Select second element for {getElementSymbol(selectedFirst)}
            </span>
          )}
        </h2>
        
        {remainingArray.length === 0 ? (
          <p className="text-zinc-500 text-sm">All elements have been paired</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {remainingArray.map((el, idx) => {
              // Check what this would create if paired with selected
              let previewRecipe: Recipe | null = null
              if (selectedFirst) {
                previewRecipe = findRecipeForPair(recipes, selectedFirst, el)
              }
              
              return (
                <button
                  key={idx}
                  onClick={() => handleElementClick(el)}
                  className={`w-12 h-12 rounded-lg text-2xl flex items-center justify-center transition-all ${
                    selectedFirst === el && idx === remainingArray.indexOf(selectedFirst)
                      ? 'bg-purple-700 ring-2 ring-purple-400'
                      : selectedFirst
                        ? 'bg-zinc-700 hover:bg-purple-700/50'
                        : 'bg-zinc-700 hover:bg-zinc-600'
                  }`}
                  title={previewRecipe ? `Creates: ${previewRecipe.name}` : el}
                >
                  {getElementSymbol(el)}
                </button>
              )
            })}
          </div>
        )}
        
        {selectedFirst && (
          <button
            onClick={() => setSelectedFirst(null)}
            className="mt-3 text-zinc-400 hover:text-zinc-200 text-sm"
          >
            Cancel selection
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg font-medium transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={onProceed}
          disabled={!pairingValidation.valid || pairedEffects.length === 0}
          className="flex-1 py-3 bg-purple-700 hover:bg-purple-600 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg font-semibold transition-colors"
        >
          {pairedEffects.length === 0 
            ? 'Create at least one pair'
            : !pairingValidation.valid
              ? 'Fix pairing issues'
              : 'Continue to Brew'
          }
        </button>
      </div>
    </div>
  )
}

// Choices Phase Component
function ChoicesPhase({
  pairedEffects,
  requiredChoices,
  choices,
  onUpdateChoice,
  onProceed,
  onBack
}: {
  pairedEffects: PairedEffect[]
  requiredChoices: { variable: string; options: string[] | null }[]
  choices: Record<string, string>
  onUpdateChoice: (variable: string, value: string) => void
  onProceed: () => void
  onBack: () => void
}) {
  const allChoicesMade = requiredChoices.every(c => choices[c.variable])

  return (
    <div className="space-y-6">
      <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
        <h2 className="font-semibold mb-4">Make Choices</h2>
        <p className="text-zinc-400 text-sm mb-4">
          Some effects require you to make a choice at brewing time.
        </p>
        
        <div className="space-y-4">
          {requiredChoices.map((choice) => (
            <div key={choice.variable}>
              <label className="block text-sm font-medium mb-2 capitalize">
                {choice.variable.replace(/_/g, ' ')}
              </label>
              
              {choice.options ? (
                <div className="flex flex-wrap gap-2">
                  {choice.options.map(option => (
                    <button
                      key={option}
                      onClick={() => onUpdateChoice(choice.variable, option)}
                      className={`px-4 py-2 rounded-lg transition-colors capitalize ${
                        choices[choice.variable] === option
                          ? 'bg-purple-700 text-white'
                          : 'bg-zinc-700 hover:bg-zinc-600'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  type="text"
                  value={choices[choice.variable] || ''}
                  onChange={(e) => onUpdateChoice(choice.variable, e.target.value)}
                  placeholder={`Enter ${choice.variable.replace(/_/g, ' ')}`}
                  className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg focus:outline-none focus:border-purple-500"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
        <h3 className="text-sm font-medium text-zinc-400 mb-2">Preview</h3>
        <p className="text-zinc-200">
          {computeBrewedDescription(pairedEffects, choices)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg font-medium transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={onProceed}
          disabled={!allChoicesMade}
          className="flex-1 py-3 bg-purple-700 hover:bg-purple-600 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg font-semibold transition-colors"
        >
          {allChoicesMade ? 'Brew!' : 'Make all choices to continue'}
        </button>
      </div>
    </div>
  )
}

// Result Phase Component
function ResultPhase({
  success,
  roll,
  total,
  brewingMod,
  type,
  description,
  onReset
}: {
  success: boolean
  roll: number
  total: number
  brewingMod: number
  type: string
  description: string
  onReset: () => void
}) {
  return (
    <div className="space-y-6">
      <div className={`rounded-lg p-6 border ${
        success 
          ? 'bg-green-900/30 border-green-700' 
          : 'bg-red-900/30 border-red-700'
      }`}>
        <h2 className={`text-2xl font-bold mb-2 ${success ? 'text-green-300' : 'text-red-300'}`}>
          {success ? '✓ Brewing Successful!' : '✗ Brewing Failed'}
        </h2>
        
        <p className="text-zinc-300 mb-4">
          Roll: <strong>{roll}</strong> {brewingMod >= 0 ? '+' : ''}{brewingMod} = <strong>{total}</strong>
          {success ? ' ≥ 15 (DC)' : ' < 15 (DC)'}
        </p>

        {success ? (
          <div className="bg-zinc-900/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-sm px-2 py-0.5 rounded ${
                type === 'elixir' 
                  ? 'bg-blue-900/50 text-blue-300' 
                  : 'bg-red-900/50 text-red-300'
              }`}>
                {type}
              </span>
            </div>
            <p className="text-zinc-100">{description}</p>
          </div>
        ) : (
          <p className="text-zinc-400">
            The herbs were consumed but the brewing failed. Better luck next time!
          </p>
        )}
      </div>

      <div className="flex gap-4">
        <button
          onClick={onReset}
          className="flex-1 py-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg font-medium transition-colors"
        >
          Brew Again
        </button>
        {success && (
          <Link
            href="/inventory"
            className="flex-1 py-3 bg-purple-700 hover:bg-purple-600 rounded-lg font-semibold transition-colors text-center"
          >
            View Inventory
          </Link>
        )}
      </div>
    </div>
  )
}


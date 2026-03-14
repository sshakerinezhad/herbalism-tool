'use client'

import { useState, useMemo } from 'react'
import type { CharacterRecipe } from '@/lib/types'
import { addCharacterBrewedItem } from '@/lib/db/characterInventory'
import { useCharacterRecipesNew } from '@/lib/hooks/queries'
import { parseTemplateVariables, fillTemplate } from '@/lib/brewing'

export interface AddElixirModalProps {
  characterId: string
  onClose: () => void
  onSuccess: () => void
}

const POTENCY_LABELS = ['I', 'II', 'III', 'IV'] as const

export function AddElixirModal({ characterId, onClose, onSuccess }: AddElixirModalProps) {
  const { data: characterRecipes = [], isLoading } = useCharacterRecipesNew(characterId)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null)
  const [potency, setPotency] = useState(1)
  const [quantity, setQuantity] = useState(1)
  const [choices, setChoices] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastAdded, setLastAdded] = useState<string | null>(null)

  // Filter recipes with joined recipe data
  const recipesWithData = useMemo(() => {
    return characterRecipes.filter(
      (cr: CharacterRecipe) => cr.recipe != null
    )
  }, [characterRecipes])

  const filteredRecipes = useMemo(() => {
    if (!searchQuery.trim()) return recipesWithData
    const q = searchQuery.toLowerCase()
    return recipesWithData.filter((cr: CharacterRecipe) =>
      cr.recipe!.name.toLowerCase().includes(q) ||
      cr.recipe!.type.toLowerCase().includes(q)
    )
  }, [recipesWithData, searchQuery])

  const selectedCR = recipesWithData.find(
    (cr: CharacterRecipe) => cr.recipe_id === selectedRecipeId
  )
  const selectedRecipe = selectedCR?.recipe ?? null

  // Parse template variables when recipe changes
  const templateVars = useMemo(() => {
    if (!selectedRecipe?.description) return []
    return parseTemplateVariables(selectedRecipe.description)
  }, [selectedRecipe])

  // Check if all required choices are made
  const allChoicesMade = templateVars.every(v => choices[v.variable])

  // Preview the computed description
  const previewDescription = useMemo(() => {
    if (!selectedRecipe?.description) return null
    if (!allChoicesMade && templateVars.length > 0) return null
    return fillTemplate(selectedRecipe.description, potency, choices)
  }, [selectedRecipe, potency, choices, allChoicesMade, templateVars])

  async function handleAdd() {
    if (!selectedRecipe || !selectedRecipeId) return
    if (templateVars.length > 0 && !allChoicesMade) return

    setSaving(true)
    setError(null)

    // Build effects: recipe name repeated by potency
    const effects = Array.from({ length: potency }, () => selectedRecipe.name)

    // Compute description
    const computedDescription = selectedRecipe.description
      ? fillTemplate(selectedRecipe.description, potency, choices)
      : selectedRecipe.name

    const { error: addError } = await addCharacterBrewedItem(
      characterId,
      selectedRecipe.type,
      effects,
      computedDescription,
      choices,
      quantity
    )

    setSaving(false)

    if (addError) {
      setError(addError)
      return
    }

    setLastAdded(`Added ${quantity}x ${selectedRecipe.name} (potency ${potency})`)
    setSelectedRecipeId(null)
    setPotency(1)
    setQuantity(1)
    setChoices({})
    onSuccess()
  }

  function handleSelectRecipe(recipeId: number) {
    setSelectedRecipeId(recipeId)
    setLastAdded(null)
    setPotency(1)
    setChoices({})
  }

  const typeIcon: Record<string, string> = {
    elixir: '🧪',
    bomb: '💣',
    balm: '🩸',
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-xl border border-zinc-700 max-w-lg w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-700">
          <h2 className="text-lg font-semibold">Add Brewed Item</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-200">✕</button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-4 space-y-4">
          {/* Search */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search recipes..."
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-purple-600"
          />

          {/* Success message */}
          {lastAdded && (
            <div className="p-2 bg-purple-900/30 border border-purple-700 rounded-lg text-sm text-purple-300">
              {lastAdded}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-2 bg-red-900/30 border border-red-700 rounded-lg text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Recipe list */}
          {isLoading ? (
            <p className="text-zinc-500 text-sm">Loading recipes...</p>
          ) : (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {filteredRecipes.map((cr: CharacterRecipe) => {
                const recipe = cr.recipe!
                return (
                  <button
                    key={cr.recipe_id}
                    onClick={() => handleSelectRecipe(cr.recipe_id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedRecipeId === cr.recipe_id
                        ? 'bg-purple-900/40 border border-purple-700'
                        : 'bg-zinc-800 hover:bg-zinc-700 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-100 font-medium">
                        {typeIcon[recipe.type] || ''} {recipe.name}
                      </span>
                      <span className="text-xs text-zinc-400 capitalize">{recipe.type}</span>
                    </div>
                    {recipe.recipe_text && (
                      <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{recipe.recipe_text}</p>
                    )}
                  </button>
                )
              })}
              {filteredRecipes.length === 0 && (
                <p className="text-zinc-500 text-sm text-center py-4">
                  {recipesWithData.length === 0 ? 'No recipes unlocked yet' : 'No recipes found'}
                </p>
              )}
            </div>
          )}

          {/* Configuration (shown when recipe selected) */}
          {selectedRecipe && (
            <div className="space-y-3 pt-2 border-t border-zinc-700">
              {/* Potency picker */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-300">Potency</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map(p => (
                    <button
                      key={p}
                      onClick={() => setPotency(p)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        potency === p
                          ? 'bg-purple-700 text-white'
                          : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {POTENCY_LABELS[p - 1]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Template variable choices */}
              {templateVars.map(v => (
                <div key={v.variable} className="flex items-center justify-between gap-3">
                  <label className="text-sm text-zinc-300 capitalize">
                    {v.variable.replace(/_/g, ' ')}
                  </label>
                  {v.options ? (
                    <select
                      value={choices[v.variable] || ''}
                      onChange={(e) => setChoices(prev => ({ ...prev, [v.variable]: e.target.value }))}
                      className="px-2 py-1 bg-zinc-800 border border-zinc-600 rounded text-sm text-zinc-100 focus:outline-none focus:border-purple-600"
                    >
                      <option value="">Select...</option>
                      {v.options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={choices[v.variable] || ''}
                      onChange={(e) => setChoices(prev => ({ ...prev, [v.variable]: e.target.value }))}
                      placeholder={v.variable.replace(/_/g, ' ')}
                      className="w-32 px-2 py-1 bg-zinc-800 border border-zinc-600 rounded text-sm text-zinc-100 focus:outline-none focus:border-purple-600"
                    />
                  )}
                </div>
              ))}

              {/* Quantity */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-300">Quantity</span>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 px-2 py-1 bg-zinc-800 border border-zinc-600 rounded text-center text-sm focus:outline-none focus:border-purple-600"
                />
              </div>

              {/* Preview */}
              {previewDescription && (
                <div className="p-2 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                  <p className="text-xs text-zinc-400 mb-1">Preview</p>
                  <p className="text-sm text-zinc-200">{previewDescription}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-zinc-700">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleAdd}
            disabled={saving || !selectedRecipeId || (templateVars.length > 0 && !allChoicesMade)}
            className="flex-1 py-2 bg-purple-700 hover:bg-purple-600 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Adding...' : 'Add to Inventory'}
          </button>
        </div>
      </div>
    </div>
  )
}

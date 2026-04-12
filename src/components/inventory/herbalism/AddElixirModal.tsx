'use client'

import { useState, useMemo } from 'react'
import type { CharacterRecipe } from '@/lib/types'
import { addCharacterBrewedItem } from '@/lib/db/characterInventory'
import { useCharacterRecipesNew } from '@/lib/hooks/queries'
import { parseTemplateVariables, fillTemplate } from '@/lib/brewing'
import { Modal } from '@/components/ui/Modal'

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

  const inputStyle = {
    background: 'rgba(0,0,0,0.25)',
    border: '1px solid var(--sepia-700)',
    caretColor: 'var(--bronze-bright)',
  }

  return (
    <Modal open={true} onClose={onClose} title="Add Brewed Item">
      <div className="space-y-4">
        {/* Search */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search recipes..."
          className="w-full px-3 py-2 rounded-lg text-vellum-50 text-sm outline-none transition-colors"
          style={inputStyle}
        />

        {/* Success message */}
        {lastAdded && (
          <div className="p-2 rounded-lg text-sm" style={{ background: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.2)', color: 'var(--bronze-bright)' }}>
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
          <p className="text-vellum-400 text-sm">Loading recipes...</p>
        ) : (
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {filteredRecipes.map((cr: CharacterRecipe) => {
              const recipe = cr.recipe!
              return (
                <button
                  key={cr.recipe_id}
                  onClick={() => handleSelectRecipe(cr.recipe_id)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors border"
                  style={{
                    background: selectedRecipeId === cr.recipe_id ? 'rgba(201,169,110,0.08)' : 'rgba(0,0,0,0.15)',
                    borderColor: selectedRecipeId === cr.recipe_id ? 'rgba(201,169,110,0.3)' : 'transparent',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-vellum-50 font-medium">
                      {typeIcon[recipe.type] || ''} {recipe.name}
                    </span>
                    <span className="text-xs text-vellum-400 capitalize">{recipe.type}</span>
                  </div>
                  {recipe.recipe_text && (
                    <p className="text-xs text-vellum-400/50 mt-0.5 line-clamp-1">{recipe.recipe_text}</p>
                  )}
                </button>
              )
            })}
            {filteredRecipes.length === 0 && (
              <p className="text-vellum-400 text-sm text-center py-4">
                {recipesWithData.length === 0 ? 'No recipes unlocked yet' : 'No recipes found'}
              </p>
            )}
          </div>
        )}

        {/* Configuration (shown when recipe selected) */}
        {selectedRecipe && (
          <div className="space-y-3 pt-2" style={{ borderTop: '1px solid var(--sepia-700)' }}>
            {/* Potency picker */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-vellum-200">Potency</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4].map(p => (
                  <button
                    key={p}
                    onClick={() => setPotency(p)}
                    className="px-3 py-1 rounded text-sm font-medium transition-colors font-ui"
                    style={{
                      background: potency === p ? 'rgba(201,169,110,0.15)' : 'rgba(0,0,0,0.15)',
                      color: potency === p ? 'var(--bronze-bright)' : 'var(--vellum-400)',
                      border: potency === p ? '1px solid rgba(201,169,110,0.3)' : '1px solid transparent',
                    }}
                  >
                    {POTENCY_LABELS[p - 1]}
                  </button>
                ))}
              </div>
            </div>

            {/* Template variable choices */}
            {templateVars.map(v => (
              <div key={v.variable} className="flex items-center justify-between gap-3">
                <label className="text-sm text-vellum-200 capitalize">
                  {v.variable.replace(/_/g, ' ')}
                </label>
                {v.options ? (
                  <select
                    value={choices[v.variable] || ''}
                    onChange={(e) => setChoices(prev => ({ ...prev, [v.variable]: e.target.value }))}
                    className="px-2 py-1 rounded text-sm text-vellum-50 outline-none"
                    style={inputStyle}
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
                    className="w-32 px-2 py-1 rounded text-sm text-vellum-50 outline-none"
                    style={inputStyle}
                  />
                )}
              </div>
            ))}

            {/* Quantity */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-vellum-200">Quantity</span>
              <input
                type="number"
                min={1}
                max={99}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 px-2 py-1 rounded text-center text-sm text-vellum-50 outline-none"
                style={inputStyle}
              />
            </div>

            {/* Preview */}
            {previewDescription && (
              <div className="p-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid var(--sepia-800)' }}>
                <p className="text-xs text-vellum-400 mb-1">Preview</p>
                <p className="text-sm text-vellum-100">{previewDescription}</p>
              </div>
            )}
          </div>
        )}

        {/* Footer buttons */}
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="btn btn-secondary flex-1 py-2 rounded-lg text-sm">
            Close
          </button>
          <button
            onClick={handleAdd}
            disabled={saving || !selectedRecipeId || (templateVars.length > 0 && !allChoicesMade)}
            className="btn btn-primary flex-1 py-2 rounded-lg text-sm"
          >
            {saving ? 'Adding...' : 'Add to Inventory'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

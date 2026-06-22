'use client'

import { useState, useMemo } from 'react'
import type { CharacterRecipe } from '@/lib/types'
import { addBrewedItem } from '@/lib/db/characterInventory'
import { useCharacterRecipesNew } from '@/lib/hooks/queries'
import { Modal } from '@/components/ui/Modal'

export interface AddBrewedModalProps {
  characterId: string
  onClose: () => void
  onSuccess: () => void
}

export function AddBrewedModal({ characterId, onClose, onSuccess }: AddBrewedModalProps) {
  const { data: characterRecipes = [], isLoading } = useCharacterRecipesNew(characterId)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastAdded, setLastAdded] = useState<string | null>(null)

  const recipesWithData = useMemo(() => {
    return characterRecipes.filter((cr: CharacterRecipe) => cr.recipe != null)
  }, [characterRecipes])

  const filteredRecipes = useMemo(() => {
    if (!searchQuery.trim()) return recipesWithData
    const q = searchQuery.toLowerCase()
    return recipesWithData.filter((cr: CharacterRecipe) =>
      cr.recipe!.name.toLowerCase().includes(q) ||
      cr.recipe!.type.toLowerCase().includes(q)
    )
  }, [recipesWithData, searchQuery])

  const selectedCR = recipesWithData.find((cr: CharacterRecipe) => cr.recipe_id === selectedRecipeId)
  const selectedRecipe = selectedCR?.recipe ?? null

  async function handleAdd() {
    if (!selectedRecipe) return

    setSaving(true)
    setError(null)

    const { error: addError } = await addBrewedItem(characterId, selectedRecipe, quantity)

    setSaving(false)

    if (addError) {
      setError(addError)
      return
    }

    setLastAdded(`Added ${quantity}x ${selectedRecipe.name}`)
    setSelectedRecipeId(null)
    setQuantity(1)
    onSuccess()
  }

  const typeIcon: Record<string, string> = {
    elixir: '🧪',
    bomb: '💣',
    balm: '🩸',
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
          style={{
            background: 'rgba(0,0,0,0.25)',
            border: '1px solid var(--sepia-700)',
            caretColor: 'var(--bronze-bright)',
          }}
        />

        {/* Success message */}
        {lastAdded && (
          <div
            className="p-2 rounded-lg text-sm"
            style={{ background: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.2)', color: 'var(--bronze-bright)' }}
          >
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
          <div className="space-y-1 max-h-52 overflow-y-auto">
            {filteredRecipes.map((cr: CharacterRecipe) => {
              const recipe = cr.recipe!
              return (
                <button
                  key={cr.recipe_id}
                  onClick={() => {
                    setSelectedRecipeId(cr.recipe_id)
                    setLastAdded(null)
                  }}
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

        {/* Quantity (shown when recipe selected) */}
        {selectedRecipe && (
          <div
            className="flex items-center justify-between gap-3 pt-2"
            style={{ borderTop: '1px solid var(--sepia-700)' }}
          >
            <span className="text-sm text-vellum-200">{selectedRecipe.name}</span>
            <div className="flex items-center gap-2">
              <label className="text-xs text-vellum-400">Qty:</label>
              <input
                type="number"
                min={1}
                max={99}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 px-2 py-1 rounded text-center text-sm text-vellum-50 outline-none"
                style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid var(--sepia-700)' }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="btn btn-secondary flex-1 py-2 rounded-lg text-sm">
            Close
          </button>
          <button
            onClick={handleAdd}
            disabled={saving || !selectedRecipeId}
            className="btn btn-primary flex-1 py-2 rounded-lg text-sm"
          >
            {saving ? 'Adding...' : 'Add to Inventory'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

'use client'

import { useState, useMemo } from 'react'
import type { Herb } from '@/lib/types'
import { addCharacterHerbs } from '@/lib/db/characterInventory'
import { useAllHerbs } from '@/lib/hooks/queries'
import { getElementSymbol } from '@/lib/constants'

export interface AddHerbModalProps {
  characterId: string
  onClose: () => void
  onSuccess: () => void
}

export function AddHerbModal({ characterId, onClose, onSuccess }: AddHerbModalProps) {
  const { data: allHerbs = [], isLoading } = useAllHerbs()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedHerbId, setSelectedHerbId] = useState<number | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastAdded, setLastAdded] = useState<string | null>(null)

  const filteredHerbs = useMemo(() => {
    if (!searchQuery.trim()) return allHerbs
    const q = searchQuery.toLowerCase()
    return allHerbs.filter(h =>
      h.name.toLowerCase().includes(q) ||
      h.rarity.toLowerCase().includes(q) ||
      (h.elements || []).some(e => e.toLowerCase().includes(q))
    )
  }, [allHerbs, searchQuery])

  const selectedHerb = allHerbs.find(h => h.id === selectedHerbId)

  async function handleAdd() {
    if (!selectedHerbId) return

    setSaving(true)
    setError(null)

    const { error: addError } = await addCharacterHerbs(characterId, selectedHerbId, quantity)

    setSaving(false)

    if (addError) {
      setError(addError)
      return
    }

    setLastAdded(`Added ${quantity}x ${selectedHerb?.name}`)
    setSelectedHerbId(null)
    setQuantity(1)
    onSuccess()
  }

  const rarityColor: Record<string, string> = {
    common: 'text-zinc-400',
    uncommon: 'text-green-400',
    rare: 'text-blue-400',
    'very rare': 'text-purple-400',
    legendary: 'text-amber-400',
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-xl border border-zinc-700 max-w-lg w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-700">
          <h2 className="text-lg font-semibold">Add Herbs</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-200">✕</button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-4 space-y-4">
          {/* Search */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, element, or rarity..."
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-emerald-600"
          />

          {/* Success message */}
          {lastAdded && (
            <div className="p-2 bg-emerald-900/30 border border-emerald-700 rounded-lg text-sm text-emerald-300">
              {lastAdded}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-2 bg-red-900/30 border border-red-700 rounded-lg text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Herb list */}
          {isLoading ? (
            <p className="text-zinc-500 text-sm">Loading herbs...</p>
          ) : (
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {filteredHerbs.map((herb: Herb) => (
                <button
                  key={herb.id}
                  onClick={() => {
                    setSelectedHerbId(herb.id)
                    setLastAdded(null)
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedHerbId === herb.id
                      ? 'bg-emerald-900/40 border border-emerald-700'
                      : 'bg-zinc-800 hover:bg-zinc-700 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-100 font-medium">{herb.name}</span>
                    <span className={`text-xs capitalize ${rarityColor[herb.rarity.toLowerCase()] || 'text-zinc-400'}`}>
                      {herb.rarity}
                    </span>
                  </div>
                  {herb.elements && herb.elements.length > 0 && (
                    <div className="text-xs text-zinc-500 mt-0.5">
                      {herb.elements.map(e => getElementSymbol(e)).join(' ')} {herb.elements.join(', ')}
                    </div>
                  )}
                </button>
              ))}
              {filteredHerbs.length === 0 && (
                <p className="text-zinc-500 text-sm text-center py-4">No herbs found</p>
              )}
            </div>
          )}

          {/* Quantity selector (shown when herb selected) */}
          {selectedHerb && (
            <div className="flex items-center gap-3 pt-2 border-t border-zinc-700">
              <span className="text-sm text-zinc-300">
                {selectedHerb.name}
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <label className="text-xs text-zinc-400">Qty:</label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 px-2 py-1 bg-zinc-800 border border-zinc-600 rounded text-center text-sm focus:outline-none focus:border-emerald-600"
                />
              </div>
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
            disabled={saving || !selectedHerbId}
            className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-600 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Adding...' : 'Add to Inventory'}
          </button>
        </div>
      </div>
    </div>
  )
}

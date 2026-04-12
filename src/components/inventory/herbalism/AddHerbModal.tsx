'use client'

import { useState, useMemo } from 'react'
import type { Herb } from '@/lib/types'
import { addCharacterHerbs } from '@/lib/db/characterInventory'
import { useAllHerbs } from '@/lib/hooks/queries'
import { getElementSymbol } from '@/lib/constants'
import { Modal } from '@/components/ui/Modal'

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
    common: 'text-vellum-400',
    uncommon: 'text-green-400',
    rare: 'text-blue-400',
    'very rare': 'text-purple-400',
    legendary: 'text-amber-400',
  }

  return (
    <Modal open={true} onClose={onClose} title="Add Herbs">
      <div className="space-y-4">
        {/* Search */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, element, or rarity..."
          className="w-full px-3 py-2 rounded-lg text-vellum-50 text-sm outline-none transition-colors"
          style={{
            background: 'rgba(0,0,0,0.25)',
            border: '1px solid var(--sepia-700)',
            caretColor: 'var(--bronze-bright)',
          }}
        />

        {/* Success message */}
        {lastAdded && (
          <div className="p-2 rounded-lg text-sm" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#86efac' }}>
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
          <p className="text-vellum-400 text-sm">Loading herbs...</p>
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
                    ? 'border'
                    : 'border border-transparent hover:brightness-125'
                }`}
                style={{
                  background: selectedHerbId === herb.id ? 'rgba(201,169,110,0.08)' : 'rgba(0,0,0,0.15)',
                  borderColor: selectedHerbId === herb.id ? 'rgba(201,169,110,0.3)' : 'transparent',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-vellum-50 font-medium">{herb.name}</span>
                  <span className={`text-xs capitalize ${rarityColor[herb.rarity.toLowerCase()] || 'text-vellum-400'}`}>
                    {herb.rarity}
                  </span>
                </div>
                {herb.elements && herb.elements.length > 0 && (
                  <div className="text-xs text-vellum-400/50 mt-0.5">
                    {herb.elements.map(e => getElementSymbol(e)).join(' ')} {herb.elements.join(', ')}
                  </div>
                )}
              </button>
            ))}
            {filteredHerbs.length === 0 && (
              <p className="text-vellum-400 text-sm text-center py-4">No herbs found</p>
            )}
          </div>
        )}

        {/* Quantity selector (shown when herb selected) */}
        {selectedHerb && (
          <div className="flex items-center gap-3 pt-2" style={{ borderTop: '1px solid var(--sepia-700)' }}>
            <span className="text-sm text-vellum-200">
              {selectedHerb.name}
            </span>
            <div className="flex items-center gap-2 ml-auto">
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

        {/* Footer buttons */}
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="btn btn-secondary flex-1 py-2 rounded-lg text-sm">
            Close
          </button>
          <button
            onClick={handleAdd}
            disabled={saving || !selectedHerbId}
            className="btn btn-primary flex-1 py-2 rounded-lg text-sm"
          >
            {saving ? 'Adding...' : 'Add to Inventory'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

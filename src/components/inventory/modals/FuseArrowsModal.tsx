'use client'

import { useState } from 'react'
import type { CharacterBrewedItem } from '@/lib/types'
import { fuseBombsToArrows } from '@/lib/db/characterInventory'
import { formatBrewedEffects } from '@/components/inventory/BrewedItemCard'
import { Modal } from '@/components/ui/Modal'

export interface FuseArrowsModalProps {
  bomb: CharacterBrewedItem
  baseArrowCount: number
  characterId: string
  onClose: () => void
  onDone: () => void
}

export function FuseArrowsModal({ bomb, baseArrowCount, characterId, onClose, onDone }: FuseArrowsModalProps) {
  const max = Math.min(bomb.quantity, baseArrowCount)
  const [qty, setQty] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const bombName = formatBrewedEffects(bomb.effects)

  async function handleConfirm() {
    setSaving(true)
    setError(null)
    const { error: fuseError } = await fuseBombsToArrows(characterId, bomb.id, qty)
    setSaving(false)
    if (fuseError) {
      setError(fuseError)
      return
    }
    onDone()
    onClose()
  }

  return (
    <Modal open={true} onClose={onClose} title="Fuse Bomb to Arrows">
      <div className="space-y-4">
        {/* Bomb info */}
        <div
          className="rounded-lg p-3"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <p className="text-sm text-vellum-100 font-medium">💣 {bombName}</p>
          <p className="text-xs text-vellum-400 mt-0.5">{bomb.quantity} available</p>
        </div>

        {baseArrowCount === 0 ? (
          <p className="text-sm text-vellum-400 text-center py-2">
            You have no base arrows. Add some to your inventory first.
          </p>
        ) : (
          <>
            <div
              className="rounded-lg p-3"
              style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid var(--sepia-700)' }}
            >
              <p className="text-xs text-vellum-400 mb-1">Base arrows available</p>
              <p className="text-sm text-vellum-100 font-medium">{baseArrowCount} arrows</p>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-vellum-200">Fuse quantity</span>
              <input
                type="number"
                min={1}
                max={max}
                value={qty}
                onChange={(e) => setQty(Math.min(max, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-20 px-2 py-1 rounded text-center text-sm text-vellum-50 outline-none"
                style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid var(--sepia-700)' }}
              />
            </div>

            <p className="text-xs text-vellum-400">
              Fusing {qty} bomb{qty !== 1 ? 's' : ''} + {qty} base arrow{qty !== 1 ? 's' : ''} → {qty} special arrow{qty !== 1 ? 's' : ''}
            </p>
          </>
        )}

        {/* Error */}
        {error && (
          <div className="p-2 bg-red-900/30 border border-red-700 rounded-lg text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="btn btn-secondary flex-1 py-2 rounded-lg text-sm">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving || baseArrowCount === 0}
            className="btn btn-primary flex-1 py-2 rounded-lg text-sm"
          >
            {saving ? 'Fusing...' : 'Fuse'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

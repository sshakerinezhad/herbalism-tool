'use client'

import { useState } from 'react'
import type { CharacterItem } from '@/lib/types'
import { getCategoryIcon } from '../types'

interface ItemCardProps {
  item: CharacterItem
  isDeleting: boolean
  onUse: () => void
  onDeleteAll: () => void
}

export function ItemCard({ item, isDeleting, onUse, onDeleteAll }: ItemCardProps) {
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <div
      className={`bg-zinc-800 rounded-lg p-4 border border-zinc-700 transition-opacity ${
        isDeleting ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span>{getCategoryIcon(item.category)}</span>
            <h3 className="font-medium">{item.name}</h3>
            {item.quantity > 1 && (
              <span className="text-xs bg-zinc-700 text-zinc-300 px-1.5 py-0.5 rounded">
                ×{item.quantity}
              </span>
            )}
          </div>
          {item.notes && (
            <p className="text-xs text-zinc-500 mt-1">{item.notes}</p>
          )}
          {item.template?.effects && Object.keys(item.template.effects).length > 0 && (
            <div className="text-xs text-emerald-400 mt-1">
              {Object.entries(item.template.effects).map(([k, v]) => (
                <span key={k} className="mr-2">{k}: {String(v)}</span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 ml-4">
          {showConfirm ? (
            <>
              <button
                onClick={onDeleteAll}
                disabled={isDeleting}
                className="text-xs px-2 py-1 bg-red-700 hover:bg-red-600 rounded transition-colors"
              >
                Delete All
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="text-xs px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onUse}
                disabled={isDeleting}
                className="text-xs px-2 py-1 bg-blue-700 hover:bg-blue-600 rounded transition-colors"
                title="Use one"
              >
                Use
              </button>
              <button
                onClick={() => setShowConfirm(true)}
                className="text-xs px-2 py-1 text-zinc-400 hover:text-red-400 transition-colors"
              >
                🗑️
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

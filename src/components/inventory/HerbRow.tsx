/**
 * HerbRow - Display a single herb in the inventory list
 * 
 * Shows herb name, elements, quantity, and delete controls.
 */

import type { CharacterHerb } from '@/lib/types'
import { getElementSymbol } from '@/lib/constants'

type HerbRowProps = {
  item: CharacterHerb
  index: number
  colors: {
    row1: string
    row2: string
  }
  isDeleting: boolean
  isConfirming: boolean
  isConfirmingAll: boolean
  onDelete: () => void
  onDeleteAll: () => void
  onCancelConfirm: () => void
  onShowDeleteAll: () => void
}

export function HerbRow({
  item,
  index,
  colors,
  isDeleting,
  isConfirming,
  isConfirmingAll,
  onDelete,
  onDeleteAll,
  onCancelConfirm,
  onShowDeleteAll,
}: HerbRowProps) {
  if (!item.herb) return null
  
  const elements = item.herb.elements || []
  
  return (
    <div
      className={`flex items-center justify-between py-2 px-3 group ${
        index % 2 === 0 ? colors.row1 : colors.row2
      } ${isDeleting ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Herb name first */}
        <span className="text-zinc-100 truncate">{item.herb.name}</span>
        
        {/* Element symbols after name */}
        <span className="text-lg flex-shrink-0">
          {elements.map((el, i) => (
            <span key={i} title={el}>{getElementSymbol(el)}</span>
          ))}
        </span>
      </div>
      
      {/* Delete controls - show on hover or when confirming */}
      <div className={`flex items-center gap-2 ${isConfirming || isConfirmingAll ? '' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
        {isConfirmingAll ? (
          // Confirm delete all
          <>
            <span className="text-xs text-red-300">Delete all {item.quantity}?</span>
            <button
              onClick={onDeleteAll}
              disabled={isDeleting}
              className="px-2 py-1 bg-red-700 hover:bg-red-600 disabled:bg-red-900 rounded text-xs font-medium transition-colors"
            >
              Yes
            </button>
            <button
              onClick={onCancelConfirm}
              className="px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-xs transition-colors"
            >
              No
            </button>
          </>
        ) : isConfirming ? (
          // Initial delete options
          <>
            <button
              onClick={onDelete}
              disabled={isDeleting}
              className="px-2 py-1 bg-red-700 hover:bg-red-600 disabled:bg-red-900 rounded text-xs transition-colors"
              title="Confirm delete one"
            >
              −1
            </button>
            {item.quantity > 1 && (
              <button
                onClick={onShowDeleteAll}
                disabled={isDeleting}
                className="px-2 py-1 bg-red-700 hover:bg-red-600 disabled:bg-red-900 rounded text-xs transition-colors"
                title={`Delete all ${item.quantity}`}
              >
                All
              </button>
            )}
            <button
              onClick={onCancelConfirm}
              className="px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-xs transition-colors"
            >
              ✕
            </button>
          </>
        ) : (
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="px-2 py-1 bg-red-700/50 hover:bg-red-600 rounded text-xs transition-colors"
            title="Delete herb"
          >
            {isDeleting ? '...' : '−'}
          </button>
        )}
      </div>
      
      {/* Quantity on right */}
      <span className="text-zinc-400 font-medium tabular-nums flex-shrink-0 ml-4 min-w-[40px] text-right">
        ×{item.quantity}
      </span>
    </div>
  )
}

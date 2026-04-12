/**
 * HerbRow - Display a single herb in the inventory list
 *
 * Grid: icon-slot | tappable name + elements | delete (hover) | quantity (bronze)
 * Parent element section provides alternating row colors via CSS context.
 */

import type { CharacterHerb } from '@/lib/types'
import { getElementSymbol } from '@/lib/constants'

type HerbRowProps = {
  item: CharacterHerb
  onNameClick: () => void
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
  onNameClick,
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
      className={`flex items-center py-[7px] px-3 group cursor-pointer transition-[background] duration-100 ${
        isDeleting ? 'opacity-50' : ''
      }`}
    >
      {/* Icon placeholder */}
      <div
        className="w-[22px] h-[22px] rounded flex-shrink-0 mr-2 flex items-center justify-center"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px dashed rgba(255,255,255,0.06)',
          fontSize: 9,
          color: 'rgba(232,220,200,0.15)',
        }}
      >
        ✦
      </div>

      {/* Name + elements */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <button
          onClick={(e) => { e.stopPropagation(); onNameClick() }}
          className="text-sm text-vellum-50 truncate hover:text-bronze-bright transition-colors"
          style={{
            textDecoration: 'underline',
            textDecorationColor: 'rgba(201,169,110,0.15)',
            textUnderlineOffset: '3px',
            textDecorationStyle: 'dotted',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            textAlign: 'left',
          }}
        >
          {item.herb.name}
        </button>
        <span className="text-xs flex-shrink-0">
          {elements.map((el, i) => (
            <span key={i} title={el}>{getElementSymbol(el)}</span>
          ))}
        </span>
      </div>

      {/* Delete controls — show on hover or when confirming */}
      <div className={`flex items-center gap-1.5 ${isConfirming || isConfirmingAll ? '' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
        {isConfirmingAll ? (
          <>
            <span className="text-xs text-red-300 whitespace-nowrap">Delete all {item.quantity}?</span>
            <button
              onClick={onDeleteAll}
              disabled={isDeleting}
              className="px-2 py-0.5 bg-red-700 hover:bg-red-600 disabled:bg-red-900 rounded text-xs font-medium transition-colors"
            >
              Yes
            </button>
            <button
              onClick={onCancelConfirm}
              className="px-2 py-0.5 bg-sepia-700/60 hover:bg-sepia-600/60 rounded text-xs transition-colors"
            >
              No
            </button>
          </>
        ) : isConfirming ? (
          <>
            <button
              onClick={onDelete}
              disabled={isDeleting}
              className="px-2 py-0.5 bg-red-700 hover:bg-red-600 disabled:bg-red-900 rounded text-xs transition-colors"
              title="Confirm delete one"
            >
              −1
            </button>
            {item.quantity > 1 && (
              <button
                onClick={onShowDeleteAll}
                disabled={isDeleting}
                className="px-2 py-0.5 bg-red-700 hover:bg-red-600 disabled:bg-red-900 rounded text-xs transition-colors"
                title={`Delete all ${item.quantity}`}
              >
                All
              </button>
            )}
            <button
              onClick={onCancelConfirm}
              className="px-2 py-0.5 bg-sepia-700/60 hover:bg-sepia-600/60 rounded text-xs transition-colors"
            >
              ✕
            </button>
          </>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            disabled={isDeleting}
            className="opacity-0 group-hover:opacity-60 hover:!opacity-100 text-red-400 text-sm px-1 transition-opacity"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            title="Delete herb"
          >
            {isDeleting ? '...' : '−'}
          </button>
        )}
      </div>

      {/* Quantity — bronze, right-aligned */}
      <span
        className="font-ui tabular-nums flex-shrink-0 ml-auto pl-3 min-w-[36px] text-right"
        style={{ fontSize: 14, fontWeight: 500, color: 'var(--bronze-bright)' }}
      >
        ×{item.quantity}
      </span>
    </div>
  )
}

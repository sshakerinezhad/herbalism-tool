'use client'

/**
 * ItemTooltip Component
 * 
 * Shows item details on hover (tooltip) and click (modal).
 * Works with weapons, items, and brewed items.
 * 
 * @example
 * <ItemTooltip
 *   name="Longsword"
 *   category="weapon"
 *   details={{ damage: "1d8 slashing", notes: "Versatile" }}
 * >
 *   <button>Hover me</button>
 * </ItemTooltip>
 */

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

// ============ Types ============

interface ItemDetails {
  damage?: string
  damageType?: string
  quantity?: number
  category?: string
  material?: string
  isMagical?: boolean
  isTwoHanded?: boolean
  ammoType?: string
  notes?: string
  description?: string
  properties?: Record<string, unknown>
}

interface ItemTooltipProps {
  name: string
  icon?: string
  details: ItemDetails
  children: React.ReactNode
  /** Disable tooltip on hover (only show modal on click) */
  clickOnly?: boolean
}

// ============ Component ============

export function ItemTooltip({
  name,
  icon,
  details,
  children,
  clickOnly = false,
}: ItemTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)

  // Update tooltip position on hover
  useEffect(() => {
    if (!showTooltip || !triggerRef.current) return

    const rect = triggerRef.current.getBoundingClientRect()
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
    })
  }, [showTooltip])

  function handleMouseEnter() {
    if (!clickOnly) {
      setShowTooltip(true)
    }
  }

  function handleMouseLeave() {
    setShowTooltip(false)
  }

  function handleClick(e: React.MouseEvent) {
    // clickOnly=true means "don't show tooltip, let parent handle clicks"
    // clickOnly=false means "show tooltip on hover, open modal on click"
    if (clickOnly) {
      // Edit mode - don't intercept, let parent handle the click
      return
    }
    
    // View mode - open detail modal
    e.stopPropagation()
    setShowTooltip(false)
    setShowModal(true)
  }

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {children}
      </div>

      {/* Tooltip (on hover) */}
      {showTooltip && typeof window !== 'undefined' && createPortal(
        <TooltipContent
          name={name}
          icon={icon}
          details={details}
          position={tooltipPosition}
          showClickHint={!clickOnly}
        />,
        document.body
      )}

      {/* Modal (on click) */}
      {showModal && (
        <DetailModal
          name={name}
          icon={icon}
          details={details}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}

// ============ Tooltip Content ============

interface TooltipContentProps {
  name: string
  icon?: string
  details: ItemDetails
  position: { x: number; y: number }
  showClickHint?: boolean
}

function TooltipContent({ name, icon, details, position, showClickHint = true }: TooltipContentProps) {
  return (
    <div
      className="fixed z-[100] pointer-events-none"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <div className="bg-zinc-900 border border-zinc-600 rounded-lg shadow-xl px-3 py-2 max-w-xs">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          {icon && <span>{icon}</span>}
          <span className="font-medium text-sm">
            {details.isMagical && <span className="text-purple-400">✨ </span>}
            {name}
          </span>
        </div>

        {/* Quick stats */}
        <div className="text-xs text-zinc-400 space-y-0.5">
          {details.damage && (
            <div>
              <span className="text-red-400 font-mono">{details.damage}</span>
              {details.damageType && <span className="ml-1">{details.damageType}</span>}
            </div>
          )}
          {details.quantity && details.quantity > 1 && (
            <div>Quantity: ×{details.quantity}</div>
          )}
          {details.isTwoHanded && <div className="text-amber-400">Two-handed</div>}
          {details.ammoType && <div>Ammo: {details.ammoType}</div>}
        </div>

        {/* Notes preview */}
        {details.notes && (
          <div className="text-xs text-zinc-500 mt-1 line-clamp-2">
            {details.notes}
          </div>
        )}

        {/* Click hint - only shown in view mode */}
        {showClickHint && (
          <div className="text-[10px] text-zinc-600 mt-2 text-center">
            Click for details
          </div>
        )}

        {/* Arrow */}
        <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 bg-zinc-900 border-r border-b border-zinc-600 rotate-45" />
      </div>
    </div>
  )
}

// ============ Detail Modal ============

interface DetailModalProps {
  name: string
  icon?: string
  details: ItemDetails
  onClose: () => void
}

function DetailModal({ name, icon, details, onClose }: DetailModalProps) {
  // Close on escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-zinc-800 rounded-lg border border-zinc-700 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-700">
          <div className="flex items-center gap-3">
            {icon && <span className="text-2xl">{icon}</span>}
            <div>
              <h3 className="font-semibold text-lg">
                {details.isMagical && <span className="text-purple-400">✨ </span>}
                {name}
              </h3>
              {details.category && (
                <p className="text-xs text-zinc-500 capitalize">{details.category}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            {details.damage && (
              <StatBlock label="Damage" value={details.damage} highlight />
            )}
            {details.damageType && (
              <StatBlock label="Type" value={details.damageType} />
            )}
            {details.quantity !== undefined && details.quantity > 0 && (
              <StatBlock label="Quantity" value={`×${details.quantity}`} />
            )}
            {details.material && (
              <StatBlock label="Material" value={details.material} />
            )}
            {details.ammoType && (
              <StatBlock label="Ammo Type" value={details.ammoType} />
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {details.isMagical && (
              <span className="text-xs px-2 py-1 bg-purple-900/50 text-purple-300 rounded">
                ✨ Magical
              </span>
            )}
            {details.isTwoHanded && (
              <span className="text-xs px-2 py-1 bg-amber-900/50 text-amber-300 rounded">
                Two-Handed
              </span>
            )}
          </div>

          {/* Description/Notes */}
          {(details.notes || details.description) && (
            <div>
              <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2">
                Description
              </h4>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {details.description || details.notes}
              </p>
            </div>
          )}

          {/* Properties */}
          {details.properties && Object.keys(details.properties).length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2">
                Properties
              </h4>
              <div className="bg-zinc-900 rounded-lg p-3 text-sm">
                {Object.entries(details.properties).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-1">
                    <span className="text-zinc-400 capitalize">{key.replace(/_/g, ' ')}</span>
                    <span>{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-700">
          <button
            onClick={onClose}
            className="w-full py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ============ Stat Block ============

function StatBlock({ 
  label, 
  value, 
  highlight = false 
}: { 
  label: string
  value: string
  highlight?: boolean 
}) {
  return (
    <div className="bg-zinc-900 rounded-lg p-3">
      <div className="text-xs text-zinc-500 uppercase tracking-wide mb-1">{label}</div>
      <div className={`font-medium ${highlight ? 'text-red-400 font-mono' : ''}`}>
        {value}
      </div>
    </div>
  )
}

// ============ Exports ============

export type { ItemDetails, ItemTooltipProps }


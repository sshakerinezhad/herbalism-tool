/**
 * BrewedItemCard - Display a brewed item (elixir, bomb, oil) in inventory
 */

import { fillTemplate } from '@/lib/brewing'
import type { BrewedItem } from '@/lib/types'

type BrewedItemCardProps = {
  item: BrewedItem
  isDeleting: boolean
  isConfirming: boolean
  isConfirmingAll: boolean
  onExpend: () => void
  onExpendAll: () => void
  onCancelConfirm: () => void
  onShowExpendAll: () => void
}

// Type-based styling
const TYPE_STYLES = {
  elixir: {
    border: 'border-blue-800/50',
    bg: 'bg-blue-900/30',
    badge: 'bg-blue-900/50 text-blue-300',
    icon: '🧪',
  },
  bomb: {
    border: 'border-red-800/50',
    bg: 'bg-red-900/30',
    badge: 'bg-red-900/50 text-red-300',
    icon: '💣',
  },
  oil: {
    border: 'border-amber-800/50',
    bg: 'bg-amber-900/30',
    badge: 'bg-amber-900/50 text-amber-300',
    icon: '⚔️',
  },
} as const

/**
 * Get the potency (total number of stacked effects) from a brewed item
 */
function getBrewedPotency(effects: string[] | string): number {
  if (Array.isArray(effects)) {
    return effects.length
  } else if (typeof effects === 'string') {
    try {
      const parsed = JSON.parse(effects)
      return Array.isArray(parsed) ? parsed.length : 1
    } catch {
      return 1
    }
  }
  return 1
}

/**
 * Format brewed effects nicely: "Healing Elixir x3 + Fire Bomb x2"
 */
export function formatBrewedEffects(effects: string[] | string): string {
  let effectsArray: string[]
  
  if (Array.isArray(effects)) {
    effectsArray = effects
  } else if (typeof effects === 'string') {
    try {
      const parsed = JSON.parse(effects)
      effectsArray = Array.isArray(parsed) ? parsed : [effects]
    } catch {
      effectsArray = [effects]
    }
  } else {
    return 'Unknown Effect'
  }

  // Count occurrences of each effect
  const counts = new Map<string, number>()
  for (const effect of effectsArray) {
    counts.set(effect, (counts.get(effect) || 0) + 1)
  }

  return Array.from(counts.entries())
    .map(([effect, count]) => count > 1 ? `${effect} ×${count}` : effect)
    .join(' + ')
}

export function BrewedItemCard({
  item,
  isDeleting,
  isConfirming,
  isConfirmingAll,
  onExpend,
  onExpendAll,
  onCancelConfirm,
  onShowExpendAll,
}: BrewedItemCardProps) {
  const styles = TYPE_STYLES[item.type as keyof typeof TYPE_STYLES] || {
    border: 'border-zinc-700/50',
    bg: 'bg-zinc-800/30',
    badge: 'bg-zinc-700 text-zinc-300',
    icon: '📦',
  }

  const potency = getBrewedPotency(item.effects)

  return (
    <div
      className={`rounded-lg border overflow-hidden ${styles.border} ${isDeleting ? 'opacity-50' : ''}`}
    >
      <div className={`px-4 py-3 ${styles.bg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg">{styles.icon}</span>
            <div>
              <span className="font-medium text-zinc-100">
                {formatBrewedEffects(item.effects)}
              </span>
              <span className={`ml-2 text-xs px-2 py-0.5 rounded ${styles.badge}`}>
                {item.type}
              </span>
              {potency > 1 && (
                <span className="ml-2 text-xs text-zinc-500">
                  potency {potency}
                </span>
              )}
            </div>
          </div>
          
          {/* Quantity and Expend Controls */}
          <ExpendControls
            quantity={item.quantity}
            isDeleting={isDeleting}
            isConfirming={isConfirming}
            isConfirmingAll={isConfirmingAll}
            onExpend={onExpend}
            onExpendAll={onExpendAll}
            onCancelConfirm={onCancelConfirm}
            onShowExpendAll={onShowExpendAll}
          />
        </div>
        
        {/* Description */}
        {item.computedDescription && (
          <div className="text-sm text-zinc-400 mt-2 pl-8 space-y-1">
            {fillTemplate(item.computedDescription, potency, item.choices || {})
              .split('. ')
              .filter(Boolean)
              .map((sentence, i) => (
                <p key={i}>{sentence.trim()}{!sentence.endsWith('.') && '.'}</p>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Expend controls sub-component
function ExpendControls({
  quantity,
  isDeleting,
  isConfirming,
  isConfirmingAll,
  onExpend,
  onExpendAll,
  onCancelConfirm,
  onShowExpendAll,
}: {
  quantity: number
  isDeleting: boolean
  isConfirming: boolean
  isConfirmingAll: boolean
  onExpend: () => void
  onExpendAll: () => void
  onCancelConfirm: () => void
  onShowExpendAll: () => void
}) {
  if (isConfirmingAll) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-red-300">Expend all {quantity}?</span>
        <button
          onClick={onExpendAll}
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
      </div>
    )
  }

  if (isConfirming) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={onExpend}
          disabled={isDeleting}
          className="px-2 py-1 bg-orange-700 hover:bg-orange-600 disabled:bg-orange-900 rounded text-xs transition-colors"
          title="Use one"
        >
          Use 1
        </button>
        {quantity > 1 && (
          <button
            onClick={onShowExpendAll}
            disabled={isDeleting}
            className="px-2 py-1 bg-red-700 hover:bg-red-600 disabled:bg-red-900 rounded text-xs transition-colors"
            title={`Expend all ${quantity}`}
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
      </div>
    )
  }

  return (
    <>
      <button
        onClick={onExpend}
        disabled={isDeleting}
        className="px-2 py-1 bg-orange-700/50 hover:bg-orange-600 rounded text-xs transition-colors"
        title="Expend (use) this item"
      >
        {isDeleting ? '...' : 'Use'}
      </button>
      <span className="text-zinc-400 font-medium ml-2">×{quantity}</span>
    </>
  )
}


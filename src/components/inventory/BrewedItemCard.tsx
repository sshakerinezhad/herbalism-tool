'use client'

/**
 * BrewedItemCard - Grimoire-styled brewed item (elixir, bomb, balm)
 *
 * Design: type-colored gradient + left accent bar + ambient glow.
 * Potency Roman numeral is identity. Effect text always visible.
 * Expand on click → flavor text + Use/Expend All.
 */

import { useState } from 'react'
import { fillTemplate } from '@/lib/brewing'
import { toRoman } from '@/lib/utils/romanNumeral'
import { parseStackableText } from '@/lib/utils/stackableText'
import type { CharacterBrewedItem } from '@/lib/types'

type BrewedItemCardProps = {
  item: CharacterBrewedItem
  isDeleting: boolean
  isConfirming: boolean
  isConfirmingAll: boolean
  onExpend: () => void
  onExpendAll: () => void
  onCancelConfirm: () => void
  onShowExpendAll: () => void
}

// Type-based visual system (color = type, no badges)
const TYPE_STYLES = {
  elixir: {
    bg: 'linear-gradient(135deg, rgba(20,30,55,0.7) 0%, rgba(15,22,42,0.5) 100%)',
    border: 'rgba(59,130,246,0.12)',
    borderHover: 'rgba(59,130,246,0.25)',
    accent: 'linear-gradient(180deg, #60a5fa, #2563eb)',
    glow: 'radial-gradient(ellipse at 10% 50%, rgba(59,130,246,0.06) 0%, transparent 70%)',
    valueClass: 'text-sky-300',
    icon: '🧪',
  },
  bomb: {
    bg: 'linear-gradient(135deg, rgba(55,20,20,0.7) 0%, rgba(42,15,15,0.5) 100%)',
    border: 'rgba(239,68,68,0.12)',
    borderHover: 'rgba(239,68,68,0.25)',
    accent: 'linear-gradient(180deg, #f87171, #dc2626)',
    glow: 'radial-gradient(ellipse at 10% 50%, rgba(239,68,68,0.06) 0%, transparent 70%)',
    valueClass: 'text-red-300',
    icon: '💣',
  },
  balm: {
    bg: 'linear-gradient(135deg, rgba(55,40,15,0.7) 0%, rgba(42,30,10,0.5) 100%)',
    border: 'rgba(245,158,11,0.12)',
    borderHover: 'rgba(245,158,11,0.25)',
    accent: 'linear-gradient(180deg, #fbbf24, #d97706)',
    glow: 'radial-gradient(ellipse at 10% 50%, rgba(245,158,11,0.06) 0%, transparent 70%)',
    valueClass: 'text-amber-300',
    icon: '🩸',
  },
} as const

const DEFAULT_STYLE = TYPE_STYLES.elixir

/**
 * Format brewed effects nicely: "Healing Elixir x3 + Fire Bomb x2"
 */
export function formatBrewedEffects(effects: string[]): string {
  if (!effects || effects.length === 0) return 'Unknown Effect'

  const counts = new Map<string, number>()
  for (const effect of effects) {
    counts.set(effect, (counts.get(effect) || 0) + 1)
  }

  return Array.from(counts.entries())
    .map(([effect, count]) => count > 1 ? `${effect} ×${count}` : effect)
    .join(' + ')
}

/**
 * Split filled description into effect (mechanical) and flavor (atmospheric).
 * Heuristic: first sentence = effect, rest = flavor.
 */
function splitEffectAndFlavor(text: string): { effect: string; flavor: string } {
  // Split on first period followed by a space (avoid splitting on decimals like "2.5")
  const match = text.match(/^(.+?\.)(\s+.+)?$/)
  if (match) {
    return {
      effect: match[1].trim(),
      flavor: match[2]?.trim() || '',
    }
  }
  return { effect: text, flavor: '' }
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
  const [expanded, setExpanded] = useState(false)

  const styles = TYPE_STYLES[item.type as keyof typeof TYPE_STYLES] || DEFAULT_STYLE
  const potency = item.effects.length
  const name = formatBrewedEffects(item.effects)

  // Fill template and split into effect + flavor
  const filled = item.computed_description
    ? fillTemplate(item.computed_description, potency, item.choices || {})
    : ''
  const { effect, flavor } = splitEffectAndFlavor(filled)

  return (
    <div
      className={`rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
        isDeleting ? 'opacity-50' : ''
      }`}
      style={{
        background: styles.bg,
        border: `1px solid ${expanded ? styles.borderHover : styles.border}`,
        boxShadow: expanded ? `0 0 24px ${styles.border}` : 'none',
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="relative" style={{ padding: '12px 14px 12px 16px' }}>
        {/* Accent bar */}
        <div
          className="absolute left-0 top-0 bottom-0"
          style={{ width: 3, background: styles.accent }}
        />
        {/* Ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: styles.glow }}
        />

        {/* Header: icon + name/potency + qty */}
        <div className="relative z-[1] flex items-center gap-2.5">
          <span className="text-[22px] w-7 text-center flex-shrink-0">{styles.icon}</span>
          <div className="flex-1 min-w-0">
            <span className="font-bold text-vellum-50" style={{ fontSize: 16, lineHeight: 1.2 }}>
              {name}
            </span>
            {potency > 0 && (
              <span
                className="font-ui"
                style={{
                  fontWeight: 600,
                  fontSize: 14,
                  color: 'var(--bronze-bright)',
                  marginLeft: 5,
                  letterSpacing: '1px',
                }}
              >
                {toRoman(potency)}
              </span>
            )}
          </div>
          <span
            className="font-ui flex-shrink-0 min-w-[28px] text-right"
            style={{ fontSize: 14, color: 'var(--bronze-muted)' }}
          >
            ×{item.quantity}
          </span>
        </div>

        {/* Effect text — always visible */}
        {effect && (
          <div className="relative z-[1] mt-1 pl-[38px] text-sm text-vellum-200 leading-relaxed">
            {parseStackableText(effect, styles.valueClass)}
          </div>
        )}

        {/* Expanded: flavor + actions */}
        {expanded && (
          <div
            className="relative z-[1] pl-[38px] mt-2.5 pt-2"
            style={{ borderTop: '1px solid rgba(139,109,62,0.08)' }}
          >
            {flavor && (
              <p className="text-xs italic text-vellum-400/60 leading-relaxed mb-2.5">
                {flavor}
              </p>
            )}
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              {isConfirmingAll ? (
                <>
                  <span className="text-xs text-red-300 self-center">Expend all {item.quantity}?</span>
                  <button onClick={onExpendAll} disabled={isDeleting} className="btn-primary font-ui text-[10px] px-4 py-1.5 rounded-full">
                    Yes
                  </button>
                  <button onClick={onCancelConfirm} className="btn-secondary font-ui text-[10px] px-4 py-1.5 rounded-full">
                    No
                  </button>
                </>
              ) : isConfirming ? (
                <>
                  <button onClick={onExpend} disabled={isDeleting} className="btn-primary font-ui text-[10px] px-4 py-1.5 rounded-full">
                    Use 1
                  </button>
                  {item.quantity > 1 && (
                    <button onClick={onShowExpendAll} disabled={isDeleting} className="btn-secondary font-ui text-[10px] px-4 py-1.5 rounded-full">
                      Expend All
                    </button>
                  )}
                  <button onClick={onCancelConfirm} className="btn-secondary font-ui text-[10px] px-3 py-1.5 rounded-full">
                    ✕
                  </button>
                </>
              ) : (
                <>
                  <button onClick={onExpend} disabled={isDeleting} className="btn-primary font-ui text-[10px] px-4 py-1.5 rounded-full">
                    {isDeleting ? '...' : 'Use'}
                  </button>
                  {item.quantity > 1 && (
                    <button onClick={onShowExpendAll} disabled={isDeleting} className="btn-secondary font-ui text-[10px] px-4 py-1.5 rounded-full">
                      Expend All
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

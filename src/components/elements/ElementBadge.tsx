/**
 * ElementBadge — Illuminated gemstone element display
 *
 * Uses the 4-layer CSS technique (gradient bg, inner glow, outer glow, text glow)
 * with shimmer hover effect. All visual magic lives in globals.css .element-badge classes.
 */

import { getElementSymbol, getElementDisplayName } from '@/lib/constants'

type ElementBadgeProps = {
  /** Element identifier (fire, water, earth, air, light, dark) */
  element: string
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Show text label alongside emoji */
  showLabel?: boolean
  /** Optional additional classes */
  className?: string
}

const sizeClasses = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-base',
}

export function ElementBadge({
  element,
  size = 'md',
  showLabel = true,
  className = '',
}: ElementBadgeProps) {
  const symbol = getElementSymbol(element)
  const displayName = getElementDisplayName(element)
  const elClass = `element-${element.toLowerCase()}`

  return (
    <span
      className={`element-badge ${elClass} ${sizeClasses[size]} ${className}`}
      title={displayName}
    >
      <span className="relative z-10 inline-flex items-center gap-1.5">
        <span>{symbol}</span>
        {showLabel && (
          <span className="font-ui tracking-wider">{displayName}</span>
        )}
      </span>
    </span>
  )
}

type ElementListProps = {
  elements: string[]
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  gap?: 'sm' | 'md'
  className?: string
}

export function ElementList({
  elements,
  size = 'md',
  showLabel = false,
  gap = 'sm',
  className = '',
}: ElementListProps) {
  const gapClass = gap === 'sm' ? 'gap-1' : 'gap-2'
  return (
    <span className={`inline-flex items-center flex-wrap ${gapClass} ${className}`}>
      {elements.map((el, i) => (
        <ElementBadge key={i} element={el} size={size} showLabel={showLabel} />
      ))}
    </span>
  )
}

/**
 * ElementChip — Inline element indicator (subtle variant of ElementBadge)
 *
 * Use in stat badges, table cells, and inline text where full badges are too large.
 * Visual treatment in globals.css .element-chip class.
 */

import { getElementDisplayName } from '@/lib/constants'

type ElementChipProps = {
  /** Element identifier (fire, water, earth, air, light, dark) */
  element: string
  /** Optional additional classes */
  className?: string
}

export function ElementChip({ element, className = '' }: ElementChipProps) {
  const displayName = getElementDisplayName(element)
  return (
    <span className={`element-chip element-${element.toLowerCase()} ${className}`}>
      {displayName}
    </span>
  )
}

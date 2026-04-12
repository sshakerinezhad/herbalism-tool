/**
 * ElementSummary - Display total element counts from inventory
 * Grimoire-styled with bronze accents.
 */

import type { CharacterHerb } from '@/lib/types'
import { getElementSymbol } from '@/lib/constants'

type ElementSummaryProps = {
  characterHerbs: CharacterHerb[]
}

export function ElementSummary({ characterHerbs }: ElementSummaryProps) {
  const elementCounts = new Map<string, number>()
  for (const item of characterHerbs) {
    if (!item.herb) continue
    for (const element of item.herb.elements || []) {
      elementCounts.set(element, (elementCounts.get(element) || 0) + item.quantity)
    }
  }

  const sortedElements = Array.from(elementCounts.entries())
    .sort((a, b) => b[1] - a[1])

  if (sortedElements.length === 0) return null

  return (
    <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--sepia-800)' }}>
      <h3 className="font-ui text-[10px] uppercase tracking-widest text-vellum-400/40 mb-3">
        Element Totals
      </h3>
      <div className="flex flex-wrap gap-3">
        {sortedElements.map(([element, count]) => (
          <span
            key={element}
            className={`element-chip element-${element.toLowerCase()}`}
            style={{ gap: 4 }}
          >
            {getElementSymbol(element)} {count}
          </span>
        ))}
      </div>
    </div>
  )
}

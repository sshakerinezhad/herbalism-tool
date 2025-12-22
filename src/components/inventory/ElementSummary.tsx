/**
 * ElementSummary - Display total element counts from inventory
 */

import { InventoryItem } from '@/lib/inventory'
import { getElementSymbol } from '@/lib/constants'

type ElementSummaryProps = {
  inventory: InventoryItem[]
}

export function ElementSummary({ inventory }: ElementSummaryProps) {
  // Count elements across all inventory items
  const elementCounts = new Map<string, number>()
  for (const item of inventory) {
    for (const element of item.herb.elements) {
      const current = elementCounts.get(element) || 0
      elementCounts.set(element, current + item.quantity)
    }
  }

  const sortedElements = Array.from(elementCounts.entries())
    .sort((a, b) => b[1] - a[1])

  if (sortedElements.length === 0) return null

  return (
    <div className="mt-8 pt-6 border-t border-zinc-800">
      <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500 mb-3">
        Element Totals
      </h3>
      <div className="flex flex-wrap gap-4">
        {sortedElements.map(([element, count]) => (
          <span
            key={element}
            className="flex items-center gap-1.5 text-sm text-zinc-400"
          >
            <span>{getElementSymbol(element)}</span>
            <span>{count}</span>
          </span>
        ))}
      </div>
    </div>
  )
}


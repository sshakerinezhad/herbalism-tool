/**
 * HerbSelector - Select herbs from inventory for brewing
 * 
 * Displays inventory sorted by element/rarity with quantity controls.
 */

import Link from 'next/link'
import { InventoryItem } from '@/lib/inventory'
import { 
  getElementSymbol, 
  getElementColors, 
  getPrimaryElement, 
  getElementIndex,
  getRarityIndex 
} from '@/lib/constants'

type HerbSelectorProps = {
  inventory: InventoryItem[]
  selectedQuantities: Map<number, number>
  totalSelected: number
  maxHerbs: number
  onAdd: (itemId: number) => void
  onRemove: (itemId: number) => void
  /** Optional: highlight only useful elements */
  highlightElements?: Set<string>
}

export function HerbSelector({
  inventory,
  selectedQuantities,
  totalSelected,
  maxHerbs,
  onAdd,
  onRemove,
  highlightElements,
}: HerbSelectorProps) {
  if (inventory.length === 0) {
    return (
      <div className="bg-zinc-800/50 rounded-lg p-6 text-center">
        <p className="text-zinc-400 mb-4">No herbs to brew with</p>
        <Link
          href="/forage"
          className="inline-block px-4 py-2 bg-green-700 hover:bg-green-600 rounded-lg text-sm font-medium transition-colors"
        >
          🔍 Go Foraging
        </Link>
      </div>
    )
  }

  // Sort by element, then rarity
  const sortedInventory = [...inventory].sort((a, b) => {
    const aElement = getPrimaryElement(a.herb.elements) || 'zzz'
    const bElement = getPrimaryElement(b.herb.elements) || 'zzz'
    const elementCompare = getElementIndex(aElement) - getElementIndex(bElement)
    if (elementCompare !== 0) return elementCompare
    return getRarityIndex(a.herb.rarity) - getRarityIndex(b.herb.rarity)
  })

  return (
    <div className="space-y-1">
      {sortedInventory.map((item) => {
        const selectedQty = selectedQuantities.get(item.id) || 0
        const primaryElement = getPrimaryElement(item.herb.elements)
        const colors = primaryElement ? getElementColors(primaryElement) : getElementColors('')
        
        return (
          <div
            key={item.id}
            className={`flex items-center justify-between py-2 px-3 rounded border transition-colors ${
              selectedQty > 0
                ? 'bg-purple-900/40 border-purple-700'
                : `${colors.bg} ${colors.border}`
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={selectedQty > 0 ? 'text-purple-300' : colors.text}>
                {item.herb.name}
              </span>
              <span className="text-sm">
                {item.herb.elements.map((el, i) => (
                  <span 
                    key={i}
                    className={highlightElements && !highlightElements.has(el) ? 'opacity-40' : ''}
                  >
                    {getElementSymbol(el)}
                  </span>
                ))}
              </span>
              <span className="text-zinc-500 text-xs capitalize">
                ({item.herb.rarity})
              </span>
            </div>
            
            {/* Quantity controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onRemove(item.id)}
                disabled={selectedQty === 0}
                className="w-7 h-7 rounded bg-zinc-700 hover:bg-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-lg transition-colors"
              >
                −
              </button>
              <span className="w-8 text-center text-sm">
                {selectedQty}/{item.quantity}
              </span>
              <button
                onClick={() => onAdd(item.id)}
                disabled={selectedQty >= item.quantity || totalSelected >= maxHerbs}
                className="w-7 h-7 rounded bg-zinc-700 hover:bg-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-lg transition-colors"
              >
                +
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/**
 * SelectedHerbsSummary - Shows selected herbs with element pool
 */
type SelectedHerbsSummaryProps = {
  selectedHerbs: InventoryItem[]
  selectedQuantities: Map<number, number>
  elementPool: Map<string, number>
  totalSelected: number
  maxHerbs: number
  onRemove: (itemId: number) => void
}

export function SelectedHerbsSummary({
  selectedHerbs,
  selectedQuantities,
  elementPool,
  totalSelected,
  maxHerbs,
  onRemove,
}: SelectedHerbsSummaryProps) {
  const totalElements = Array.from(elementPool.values()).reduce((sum, n) => sum + n, 0)

  return (
    <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-semibold">Selected Herbs</h2>
        <span className="text-zinc-400 text-sm">{totalSelected}/{maxHerbs}</span>
      </div>
      
      {totalSelected === 0 ? (
        <p className="text-zinc-500 text-sm">Select herbs from your inventory below</p>
      ) : (
        <div className="space-y-2">
          {/* Selected herbs list */}
          <div className="flex flex-wrap gap-2">
            {selectedHerbs.map(item => {
              const qty = selectedQuantities.get(item.id) || 0
              return (
                <div
                  key={item.id}
                  className="px-3 py-1.5 bg-purple-900/50 border border-purple-700 rounded-lg text-sm flex items-center gap-2"
                >
                  <span>{item.herb.name}</span>
                  {qty > 1 && <span className="text-purple-300">×{qty}</span>}
                  <button 
                    onClick={() => onRemove(item.id)}
                    className="text-purple-400 hover:text-purple-200"
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </div>
          
          {/* Element pool preview */}
          <div className="pt-2 border-t border-zinc-700 mt-3">
            <span className="text-zinc-400 text-sm mr-2">Elements:</span>
            {Array.from(elementPool.entries()).map(([el, count]) => (
              <span key={el} className="mr-2">
                {Array(count).fill(0).map((_, i) => (
                  <span key={i} title={el}>{getElementSymbol(el)}</span>
                ))}
              </span>
            ))}
            <span className="text-zinc-500 text-sm ml-2">
              ({totalElements} total)
            </span>
          </div>
        </div>
      )}
    </div>
  )
}


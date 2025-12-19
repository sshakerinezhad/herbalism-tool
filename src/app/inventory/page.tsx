'use client'

import { useEffect, useState } from 'react'
import { useProfile } from '@/lib/profile'
import { getInventory, InventoryItem } from '@/lib/inventory'
import { getBrewedItems } from '@/lib/brewing'
import Link from 'next/link'

type SortMode = 'rarity' | 'element'
type ViewTab = 'herbs' | 'brewed'

type BrewedItem = {
  id: number
  type: string
  effects: string[]
  quantity: number
  computedDescription?: string
  choices?: Record<string, string>
}

// Element symbols
const ELEMENT_SYMBOLS: Record<string, string> = {
  fire: '🔥',
  water: '💧',
  earth: '⛰️',
  air: '💨',
  positive: '✨',
  negative: '💀',
}

// Element colors for section theming
const ELEMENT_COLORS: Record<string, { bg: string; border: string; header: string; row1: string; row2: string }> = {
  fire: {
    bg: 'bg-orange-950/20',
    border: 'border-orange-800/50',
    header: 'bg-orange-900/40',
    row1: 'bg-orange-950/30',
    row2: 'bg-orange-950/10',
  },
  water: {
    bg: 'bg-blue-950/20',
    border: 'border-blue-800/50',
    header: 'bg-blue-900/40',
    row1: 'bg-blue-950/30',
    row2: 'bg-blue-950/10',
  },
  earth: {
    bg: 'bg-amber-950/20',
    border: 'border-amber-800/50',
    header: 'bg-amber-900/40',
    row1: 'bg-amber-950/30',
    row2: 'bg-amber-950/10',
  },
  air: {
    bg: 'bg-cyan-950/20',
    border: 'border-cyan-800/50',
    header: 'bg-cyan-900/40',
    row1: 'bg-cyan-950/30',
    row2: 'bg-cyan-950/10',
  },
  positive: {
    bg: 'bg-yellow-950/20',
    border: 'border-yellow-800/50',
    header: 'bg-yellow-900/40',
    row1: 'bg-yellow-950/30',
    row2: 'bg-yellow-950/10',
  },
  negative: {
    bg: 'bg-purple-950/20',
    border: 'border-purple-800/50',
    header: 'bg-purple-900/40',
    row1: 'bg-purple-950/30',
    row2: 'bg-purple-950/10',
  },
  mixed: {
    bg: 'bg-zinc-800/20',
    border: 'border-zinc-700/50',
    header: 'bg-zinc-700/40',
    row1: 'bg-zinc-800/30',
    row2: 'bg-zinc-800/10',
  },
}

function getElementSymbol(element: string): string {
  return ELEMENT_SYMBOLS[element.toLowerCase()] || '●'
}

function getElementColors(element: string) {
  return ELEMENT_COLORS[element.toLowerCase()] || ELEMENT_COLORS.mixed
}

/**
 * Get the primary element of an herb (most common element)
 * Returns null if there's a tie (no clear primary)
 */
function getPrimaryElement(elements: string[]): string | null {
  if (elements.length === 0) return null
  
  const counts = new Map<string, number>()
  for (const el of elements) {
    counts.set(el, (counts.get(el) || 0) + 1)
  }
  
  const maxCount = Math.max(...counts.values())
  const topElements = Array.from(counts.entries())
    .filter(([, count]) => count === maxCount)
    .map(([el]) => el)
  
  if (topElements.length > 1) return null
  return topElements[0]
}

export default function InventoryPage() {
  const { guestId, isLoaded: profileLoaded, profile } = useProfile()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [brewedItems, setBrewedItems] = useState<BrewedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortMode, setSortMode] = useState<SortMode>('element')
  const [viewTab, setViewTab] = useState<ViewTab>('herbs')

  useEffect(() => {
    async function loadData() {
      if (!profileLoaded || !guestId) return

      const [invResult, brewedResult] = await Promise.all([
        getInventory(guestId),
        getBrewedItems(guestId)
      ])
      
      if (invResult.error) {
        setError(invResult.error)
      } else {
        setInventory(invResult.items)
      }
      
      if (brewedResult.error) {
        // Don't show error if table doesn't exist yet
        if (!brewedResult.error.includes('does not exist')) {
          console.warn('Brewed items:', brewedResult.error)
        }
      } else {
        setBrewedItems(brewedResult.items)
      }
      
      setLoading(false)
    }

    loadData()
  }, [profileLoaded, guestId])

  // Group inventory by rarity
  const groupedByRarity = inventory.reduce((acc, item) => {
    const rarity = item.herb.rarity
    if (!acc[rarity]) acc[rarity] = []
    acc[rarity].push(item)
    return acc
  }, {} as Record<string, InventoryItem[]>)

  const rarityOrder = ['common', 'uncommon', 'rare', 'very rare', 'legendary', 'preternatural']
  const sortedRarities = Object.keys(groupedByRarity).sort(
    (a, b) => rarityOrder.indexOf(a.toLowerCase()) - rarityOrder.indexOf(b.toLowerCase())
  )

  // Group inventory by primary element, then by rarity within each
  const groupedByElement = inventory.reduce((acc, item) => {
    const primary = getPrimaryElement(item.herb.elements) || 'Mixed'
    if (!acc[primary]) acc[primary] = {}
    
    const rarity = item.herb.rarity
    if (!acc[primary][rarity]) acc[primary][rarity] = []
    acc[primary][rarity].push(item)
    
    return acc
  }, {} as Record<string, Record<string, InventoryItem[]>>)

  const elementOrder = ['fire', 'water', 'earth', 'air', 'positive', 'negative', 'Mixed']
  const sortedElements = Object.keys(groupedByElement).sort(
    (a, b) => {
      const aIndex = elementOrder.indexOf(a.toLowerCase()) 
      const bIndex = elementOrder.indexOf(b.toLowerCase())
      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b)
      if (aIndex === -1) return b === 'Mixed' ? -1 : 1
      if (bIndex === -1) return a === 'Mixed' ? 1 : -1
      return aIndex - bIndex
    }
  )

  const totalHerbs = inventory.reduce((sum, item) => sum + item.quantity, 0)
  const uniqueHerbs = inventory.length

  if (!profileLoaded || loading) {
    return (
      <div className="min-h-screen bg-zinc-900 text-zinc-100 p-8">
        <p>Loading inventory...</p>
      </div>
    )
  }

  // Render herb row - compact list style
  const renderHerbRow = (item: InventoryItem, index: number, colors: typeof ELEMENT_COLORS.fire) => (
    <div
      key={item.id}
      className={`flex items-center justify-between py-2 px-3 ${
        index % 2 === 0 ? colors.row1 : colors.row2
      }`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Herb name first */}
        <span className="text-zinc-100 truncate">{item.herb.name}</span>
        
        {/* Element symbols after name */}
        <span className="text-sm flex-shrink-0">
          {item.herb.elements.map((el, i) => (
            <span key={i} title={el}>{getElementSymbol(el)}</span>
          ))}
        </span>
      </div>
      
      {/* Quantity on right */}
      <span className="text-zinc-400 font-medium tabular-nums flex-shrink-0 ml-4">
        ×{item.quantity}
      </span>
    </div>
  )

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 p-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-zinc-400 hover:text-zinc-200 mb-4 inline-block">
          ← Back
        </Link>

        <h1 className="text-3xl font-bold mb-4">🎒 Inventory</h1>

        {/* View Tabs */}
        <div className="flex gap-2 mb-6 border-b border-zinc-800 pb-4">
          <button
            onClick={() => setViewTab('herbs')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewTab === 'herbs'
                ? 'bg-green-700 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            🌿 Herbs
            <span className="ml-2 text-xs opacity-70">({totalHerbs})</span>
          </button>
          {profile.isHerbalist && (
            <button
              onClick={() => setViewTab('brewed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewTab === 'brewed'
                  ? 'bg-purple-700 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              ⚗️ Brewed
              <span className="ml-2 text-xs opacity-70">({brewedItems.reduce((s, i) => s + i.quantity, 0)})</span>
            </button>
          )}
        </div>

        {/* Herbs Tab Header */}
        {viewTab === 'herbs' && inventory.length > 0 && (
          <div className="flex justify-between items-center mb-4">
            <p className="text-zinc-500 text-sm">
              {totalHerbs} herb{totalHerbs !== 1 ? 's' : ''} • {uniqueHerbs} unique
            </p>
            
            {/* Sort Toggle */}
            <div className="flex gap-1 bg-zinc-800 rounded-lg p-1">
              <button
                onClick={() => setSortMode('element')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  sortMode === 'element'
                    ? 'bg-zinc-700 text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                By Element
              </button>
              <button
                onClick={() => setSortMode('rarity')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  sortMode === 'rarity'
                    ? 'bg-zinc-700 text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                By Rarity
              </button>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Empty State - Herbs */}
        {viewTab === 'herbs' && inventory.length === 0 && !error && (
          <div className="bg-zinc-800/50 rounded-lg p-8 text-center">
            <p className="text-zinc-400 mb-4">Your herb inventory is empty</p>
            <Link
              href="/forage"
              className="inline-block px-4 py-2 bg-green-700 hover:bg-green-600 rounded-lg text-sm font-medium transition-colors"
            >
              🔍 Start Foraging
            </Link>
          </div>
        )}

        {/* Empty State - Brewed */}
        {viewTab === 'brewed' && brewedItems.length === 0 && !error && (
          <div className="bg-zinc-800/50 rounded-lg p-8 text-center">
            <p className="text-zinc-400 mb-4">You haven't brewed anything yet</p>
            <Link
              href="/brew"
              className="inline-block px-4 py-2 bg-purple-700 hover:bg-purple-600 rounded-lg text-sm font-medium transition-colors"
            >
              ⚗️ Start Brewing
            </Link>
          </div>
        )}

        {/* Inventory List - By Rarity */}
        {viewTab === 'herbs' && inventory.length > 0 && sortMode === 'rarity' && (
          <div className="space-y-6">
            {sortedRarities.map((rarity) => {
              const colors = ELEMENT_COLORS.mixed
              const items = groupedByRarity[rarity]
                .sort((a, b) => a.herb.name.localeCompare(b.herb.name))
              
              return (
                <div 
                  key={rarity}
                  className={`rounded-lg border overflow-hidden ${colors.border}`}
                >
                  {/* Header */}
                  <div className={`px-4 py-2 ${colors.header}`}>
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-200">
                      {rarity}
                      <span className="text-zinc-400 font-normal ml-2">
                        ({items.reduce((sum, i) => sum + i.quantity, 0)})
                      </span>
                    </h2>
                  </div>
                  
                  {/* Items */}
                  <div>
                    {items.map((item, idx) => renderHerbRow(item, idx, colors))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Inventory List - By Element */}
        {viewTab === 'herbs' && inventory.length > 0 && sortMode === 'element' && (
          <div className="space-y-6">
            {sortedElements.map((element) => {
              const elementItems = groupedByElement[element]
              const colors = getElementColors(element)
              const totalInElement = Object.values(elementItems)
                .flat()
                .reduce((sum, i) => sum + i.quantity, 0)
              
              const elementSymbol = element === 'Mixed' ? '⚖️' : getElementSymbol(element)
              
              // Flatten all items for this element, sorted by rarity then name
              const allItemsFlat: { item: InventoryItem; rarity: string }[] = []
              Object.keys(elementItems)
                .sort((a, b) => {
                  const aIndex = rarityOrder.indexOf(a.toLowerCase())
                  const bIndex = rarityOrder.indexOf(b.toLowerCase())
                  if (aIndex === -1 && bIndex === -1) return a.localeCompare(b)
                  if (aIndex === -1) return 1
                  if (bIndex === -1) return -1
                  return aIndex - bIndex
                })
                .forEach(rarity => {
                  elementItems[rarity]
                    .sort((a, b) => a.herb.name.localeCompare(b.herb.name))
                    .forEach(item => allItemsFlat.push({ item, rarity }))
                })
              
              return (
                <div 
                  key={element}
                  className={`rounded-lg border overflow-hidden ${colors.border}`}
                >
                  {/* Element Header */}
                  <div className={`px-4 py-3 flex items-center gap-2 ${colors.header}`}>
                    <span className="text-xl">{elementSymbol}</span>
                    <h2 className="text-base font-semibold capitalize text-zinc-100">
                      {element}
                    </h2>
                    <span className="text-sm text-zinc-400">
                      ({totalInElement})
                    </span>
                  </div>
                  
                  {/* Items with rarity subheaders */}
                  <div>
                    {(() => {
                      let rowIndex = 0
                      let currentRarity = ''
                      
                      return allItemsFlat.map(({ item, rarity }) => {
                        const showRarityHeader = rarity !== currentRarity
                        if (showRarityHeader) {
                          currentRarity = rarity
                        }
                        
                        const row = (
                          <div key={item.id}>
                            {showRarityHeader && (
                              <div className={`px-4 py-1.5 ${colors.row1} border-t border-zinc-800/50`}>
                                <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                                  {rarity}
                                </span>
                              </div>
                            )}
                            {renderHerbRow(item, rowIndex, colors)}
                          </div>
                        )
                        
                        rowIndex++
                        return row
                      })
                    })()}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Brewed Items List */}
        {viewTab === 'brewed' && brewedItems.length > 0 && (
          <div className="space-y-3">
            {brewedItems.map((item, idx) => (
              <div
                key={item.id}
                className={`rounded-lg border overflow-hidden ${
                  item.type === 'elixir'
                    ? 'border-blue-800/50'
                    : item.type === 'bomb'
                      ? 'border-red-800/50'
                      : 'border-zinc-700/50'
                }`}
              >
                <div className={`px-4 py-3 ${
                  item.type === 'elixir'
                    ? 'bg-blue-900/30'
                    : item.type === 'bomb'
                      ? 'bg-red-900/30'
                      : 'bg-zinc-800/30'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">
                        {item.type === 'elixir' ? '🧪' : item.type === 'bomb' ? '💣' : '📦'}
                      </span>
                      <div>
                        <span className="font-medium text-zinc-100">
                          {item.effects.join(' + ')}
                        </span>
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                          item.type === 'elixir'
                            ? 'bg-blue-900/50 text-blue-300'
                            : item.type === 'bomb'
                              ? 'bg-red-900/50 text-red-300'
                              : 'bg-zinc-700 text-zinc-300'
                        }`}>
                          {item.type}
                        </span>
                      </div>
                    </div>
                    <span className="text-zinc-400 font-medium">×{item.quantity}</span>
                  </div>
                  
                  {item.computedDescription && (
                    <p className="text-sm text-zinc-400 mt-2 pl-8">
                      {item.computedDescription}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Element Summary */}
        {viewTab === 'herbs' && inventory.length > 0 && (
          <div className="mt-8 pt-6 border-t border-zinc-800">
            <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500 mb-3">
              Element Totals
            </h3>
            <div className="flex flex-wrap gap-4">
              {(() => {
                const elementCounts = new Map<string, number>()
                for (const item of inventory) {
                  for (const element of item.herb.elements) {
                    const current = elementCounts.get(element) || 0
                    elementCounts.set(element, current + item.quantity)
                  }
                }
                
                return Array.from(elementCounts.entries())
                  .sort((a, b) => b[1] - a[1])
                  .map(([element, count]) => (
                    <span
                      key={element}
                      className="flex items-center gap-1.5 text-sm text-zinc-400"
                    >
                      <span>{getElementSymbol(element)}</span>
                      <span>{count}</span>
                    </span>
                  ))
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

/**
 * HerbsTabContent Component
 *
 * Displays the herbs inventory with search and sorting capabilities.
 * Organized by either rarity or element groupings.
 */

import Link from 'next/link'
import type { CharacterHerb } from '@/lib/types'
import { getElementColors, getElementSymbol } from '@/lib/constants'
import { HerbRow, ElementSummary } from '@/components/inventory'
import type { SortMode } from '@/components/inventory/types'

interface HerbsTabContentProps {
  characterHerbs: CharacterHerb[]
  filteredInventory: CharacterHerb[]
  groupedByRarity: { rarity: string; items: CharacterHerb[] }[]
  groupedByElement: { element: string; raritySections: { rarity: string; items: CharacterHerb[] }[] }[]
  sortMode: SortMode
  setSortMode: (mode: SortMode) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  totalHerbs: number
  uniqueHerbs: number
  deletingHerbId: number | null
  deleteConfirmId: number | null
  deleteAllConfirmId: number | null
  onDeleteHerb: (herbId: number) => void
  onDeleteAllOfHerb: (herbId: number, quantity: number) => void
  onCancelConfirm: () => void
  onShowDeleteAll: (id: number) => void
  onCancelDeleteAll: () => void
}

export function HerbsTabContent(props: HerbsTabContentProps) {
  const {
    characterHerbs,
    filteredInventory,
    groupedByRarity,
    groupedByElement,
    sortMode,
    setSortMode,
    searchQuery,
    setSearchQuery,
    totalHerbs,
    uniqueHerbs,
    deletingHerbId,
    deleteConfirmId,
    deleteAllConfirmId,
    onDeleteHerb,
    onDeleteAllOfHerb,
    onCancelConfirm,
    onShowDeleteAll,
    onCancelDeleteAll,
  } = props

  if (characterHerbs.length === 0) {
    return (
      <div className="bg-zinc-800/50 rounded-lg p-8 text-center">
        <p className="text-zinc-400 mb-4">Your herb inventory is empty</p>
        <Link
          href="/forage"
          className="inline-block px-4 py-2 bg-green-700 hover:bg-green-600 rounded-lg text-sm font-medium transition-colors"
        >
          {"\u{1F50D} Start Foraging"}
        </Link>
      </div>
    )
  }

  return (
    <>
      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">{"\u{1F50D}"}</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search herbs by name, element, or rarity..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              {"\u2715"}
            </button>
          )}
        </div>
      </div>

      {/* Header with count and sort toggle */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-zinc-500 text-sm">
          {searchQuery
            ? `${filteredInventory.length} result${filteredInventory.length !== 1 ? 's' : ''}`
            : `${totalHerbs} herb${totalHerbs !== 1 ? 's' : ''} \u2022 ${uniqueHerbs} unique`
          }
        </p>

        <div className="flex gap-1 bg-zinc-800 rounded-lg p-1">
          <button
            onClick={() => setSortMode('element')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              sortMode === 'element' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            By Element
          </button>
          <button
            onClick={() => setSortMode('rarity')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              sortMode === 'rarity' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            By Rarity
          </button>
        </div>
      </div>

      {/* Herb List - By Rarity */}
      {sortMode === 'rarity' && (
        <div className="space-y-6">
          {groupedByRarity.map(({ rarity, items }) => {
            const colors = getElementColors('mixed')
            return (
              <div key={rarity} className={`rounded-lg border overflow-hidden ${colors.border}`}>
                <div className={`px-4 py-2 ${colors.header}`}>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-200">
                    {rarity}
                    <span className="text-zinc-400 font-normal ml-2">
                      ({items.reduce((sum, i) => sum + i.quantity, 0)})
                    </span>
                  </h2>
                </div>
                <div>
                  {items.filter(item => item.herb).map((item, idx) => (
                    <HerbRow
                      key={item.id}
                      item={item}
                      index={idx}
                      colors={colors}
                      isDeleting={deletingHerbId === item.herb_id}
                      isConfirming={deleteConfirmId === item.herb_id}
                      isConfirmingAll={deleteAllConfirmId === item.herb_id}
                      onDelete={() => onDeleteHerb(item.herb_id)}
                      onDeleteAll={() => onDeleteAllOfHerb(item.herb_id, item.quantity)}
                      onCancelConfirm={() => {
                        onCancelConfirm()
                        onCancelDeleteAll()
                      }}
                      onShowDeleteAll={() => onShowDeleteAll(item.herb_id)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Herb List - By Element */}
      {sortMode === 'element' && (
        <div className="space-y-6">
          {groupedByElement.map(({ element, raritySections }) => {
            const colors = getElementColors(element)
            const totalInElement = raritySections.flatMap(s => s.items).reduce((sum, i) => sum + i.quantity, 0)
            const elementSymbol = element === 'Mixed' ? '\u269B\uFE0F' : getElementSymbol(element)

            let rowIndex = 0

            return (
              <div key={element} className={`rounded-lg border overflow-hidden ${colors.border}`}>
                <div className={`px-4 py-3 flex items-center gap-2 ${colors.header}`}>
                  <span className="text-xl">{elementSymbol}</span>
                  <h2 className="text-base font-semibold capitalize text-zinc-100">{element}</h2>
                  <span className="text-sm text-zinc-400">({totalInElement})</span>
                </div>
                <div>
                  {raritySections.map(({ rarity, items }) => (
                    <div key={rarity}>
                      <div className="px-4 py-1.5 bg-zinc-900/80 border-y border-zinc-700/50">
                        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                          {rarity}
                        </span>
                      </div>
                      {items.filter(item => item.herb).map((item) => {
                        const currentIndex = rowIndex++
                        return (
                          <HerbRow
                            key={item.id}
                            item={item}
                            index={currentIndex}
                            colors={colors}
                            isDeleting={deletingHerbId === item.herb_id}
                            isConfirming={deleteConfirmId === item.herb_id}
                            isConfirmingAll={deleteAllConfirmId === item.herb_id}
                            onDelete={() => onDeleteHerb(item.herb_id)}
                            onDeleteAll={() => onDeleteAllOfHerb(item.herb_id, item.quantity)}
                            onCancelConfirm={() => {
                              onCancelConfirm()
                              onCancelDeleteAll()
                            }}
                            onShowDeleteAll={() => onShowDeleteAll(item.herb_id)}
                          />
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

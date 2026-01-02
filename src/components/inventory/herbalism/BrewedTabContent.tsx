'use client'

/**
 * BrewedTabContent Component
 *
 * Displays brewed items (elixirs, bombs, oils) with type filtering.
 */

import Link from 'next/link'
import type { CharacterBrewedItem } from '@/lib/types'
import { BrewedItemCard } from '@/components/inventory'
import type { BrewedTypeFilter } from '@/components/inventory/types'
import { FilterButton } from './FilterButton'

interface BrewedTabContentProps {
  brewedItems: CharacterBrewedItem[]
  filteredBrewedItems: CharacterBrewedItem[]
  brewedTypes: string[]
  brewedTypeFilter: BrewedTypeFilter
  setBrewedTypeFilter: (filter: BrewedTypeFilter) => void
  deletingBrewedId: number | null
  deleteBrewedConfirmId: number | null
  deleteAllBrewedConfirmId: number | null
  onExpend: (id: number) => void
  onExpendAll: (id: number, quantity: number) => void
  onCancelConfirm: () => void
  onShowExpendAll: (id: number) => void
  onCancelExpendAll: () => void
}

export function BrewedTabContent(props: BrewedTabContentProps) {
  const {
    brewedItems,
    filteredBrewedItems,
    brewedTypes,
    brewedTypeFilter,
    setBrewedTypeFilter,
    deletingBrewedId,
    deleteBrewedConfirmId,
    deleteAllBrewedConfirmId,
    onExpend,
    onExpendAll,
    onCancelConfirm,
    onShowExpendAll,
    onCancelExpendAll,
  } = props

  if (brewedItems.length === 0) {
    return (
      <div className="bg-zinc-800/50 rounded-lg p-8 text-center">
        <p className="text-zinc-400 mb-4">You haven't brewed anything yet</p>
        <Link
          href="/brew"
          className="inline-block px-4 py-2 bg-purple-700 hover:bg-purple-600 rounded-lg text-sm font-medium transition-colors"
        >
          ⚗️ Start Brewing
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Type Filter */}
      <div className="flex items-center justify-between">
        <p className="text-zinc-500 text-sm">
          {filteredBrewedItems.length} item{filteredBrewedItems.length !== 1 ? 's' : ''}
          {brewedTypeFilter !== 'all' && ` (${brewedTypeFilter}s)`}
        </p>
        <div className="flex gap-1 bg-zinc-800 rounded-lg p-1">
          <FilterButton active={brewedTypeFilter === 'all'} onClick={() => setBrewedTypeFilter('all')}>
            All
          </FilterButton>
          {brewedTypes.includes('elixir') && (
            <FilterButton active={brewedTypeFilter === 'elixir'} onClick={() => setBrewedTypeFilter('elixir')} activeClass="bg-blue-700">
              🧪 Elixirs
            </FilterButton>
          )}
          {brewedTypes.includes('bomb') && (
            <FilterButton active={brewedTypeFilter === 'bomb'} onClick={() => setBrewedTypeFilter('bomb')} activeClass="bg-red-700">
              💣 Bombs
            </FilterButton>
          )}
          {brewedTypes.includes('oil') && (
            <FilterButton active={brewedTypeFilter === 'oil'} onClick={() => setBrewedTypeFilter('oil')} activeClass="bg-amber-700">
              ⚗️ Oils
            </FilterButton>
          )}
        </div>
      </div>

      {/* Brewed Items */}
      <div className="space-y-3">
        {filteredBrewedItems.map((item) => (
          <BrewedItemCard
            key={item.id}
            item={item}
            isDeleting={deletingBrewedId === item.id}
            isConfirming={deleteBrewedConfirmId === item.id}
            isConfirmingAll={deleteAllBrewedConfirmId === item.id}
            onExpend={() => onExpend(item.id)}
            onExpendAll={() => onExpendAll(item.id, item.quantity)}
            onCancelConfirm={() => {
              onCancelConfirm()
              onCancelExpendAll()
            }}
            onShowExpendAll={() => onShowExpendAll(item.id)}
          />
        ))}
      </div>

      {/* Empty filter state */}
      {filteredBrewedItems.length === 0 && (
        <div className="bg-zinc-800/50 rounded-lg p-6 text-center">
          <p className="text-zinc-400">No {brewedTypeFilter}s in your inventory</p>
          <button
            onClick={() => setBrewedTypeFilter('all')}
            className="mt-2 text-sm text-zinc-500 hover:text-zinc-300"
          >
            Show all items
          </button>
        </div>
      )}
    </div>
  )
}

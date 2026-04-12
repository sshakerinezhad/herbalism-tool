'use client'

/**
 * BrewedTabContent Component
 *
 * Grimoire-styled brewed items with type filter tabs.
 */

import Link from 'next/link'
import type { CharacterBrewedItem } from '@/lib/types'
import { BrewedItemCard } from '@/components/inventory'
import type { BrewedTypeFilter } from '@/components/inventory/types'

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

const TYPE_TAB_META: Record<string, { label: string; icon: string }> = {
  elixir: { label: 'Elixirs', icon: '🧪' },
  bomb: { label: 'Bombs', icon: '💣' },
  balm: { label: 'Balms', icon: '🩸' },
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
      <div className="elevation-raised rounded-lg p-8 text-center">
        <p className="text-vellum-400 mb-4">You haven&apos;t brewed anything yet</p>
        <Link href="/brew" className="btn btn-primary px-5 py-2 text-sm">
          Start Brewing
        </Link>
      </div>
    )
  }

  // Count items per type
  const typeCounts: Record<string, number> = {}
  for (const item of brewedItems) {
    typeCounts[item.type] = (typeCounts[item.type] || 0) + item.quantity
  }

  return (
    <div>
      {/* Type filter tabs */}
      <div className="flex" style={{ borderBottom: '1px solid rgba(139,109,62,0.12)' }}>
        <TypeTab
          active={brewedTypeFilter === 'all'}
          onClick={() => setBrewedTypeFilter('all')}
          count={brewedItems.reduce((s, i) => s + i.quantity, 0)}
        >
          All
        </TypeTab>
        {brewedTypes.map((type) => {
          const meta = TYPE_TAB_META[type]
          if (!meta) return null
          return (
            <TypeTab
              key={type}
              active={brewedTypeFilter === type}
              onClick={() => setBrewedTypeFilter(type as BrewedTypeFilter)}
              count={typeCounts[type] || 0}
            >
              {meta.label}
            </TypeTab>
          )
        })}
      </div>

      {/* Items list */}
      <div className="p-2.5 space-y-2">
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
        <div className="elevation-raised rounded-lg p-6 text-center mx-2.5 mb-2.5">
          <p className="text-vellum-400">No {brewedTypeFilter}s in your inventory</p>
          <button
            onClick={() => setBrewedTypeFilter('all')}
            className="mt-2 text-sm text-vellum-400/50 hover:text-vellum-200 transition-colors"
          >
            Show all items
          </button>
        </div>
      )}
    </div>
  )
}

/** Type filter tab */
function TypeTab({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean
  onClick: () => void
  count: number
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 font-ui text-center relative transition-colors duration-200"
      style={{
        fontSize: 11,
        letterSpacing: '0.5px',
        padding: '12px 8px 10px',
        color: active ? 'var(--bronze-bright)' : '#6b5c42',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        textShadow: active ? '0 0 12px rgba(201,169,110,0.3)' : 'none',
      }}
    >
      {children}
      <span style={{ fontSize: 9, opacity: 0.5, marginLeft: 3 }}>{count}</span>
      {active && (
        <span
          className="absolute bottom-[-1px] left-[15%] right-[15%] h-[2px]"
          style={{ background: 'linear-gradient(90deg, transparent, #c9a96e, transparent)' }}
        />
      )}
    </button>
  )
}

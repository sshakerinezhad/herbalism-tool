'use client'

import { useState, useMemo } from 'react'
import { consumeCharacterItem, deleteCharacterItem } from '@/lib/db/characters'
import type { CharacterItem } from '@/lib/types'
import { ItemCard } from './ItemCard'
import { getCategoryIcon, formatCategory } from '../types'

interface ItemsTabProps {
  items: CharacterItem[]
  characterId: string
  onAddItem: () => void
  onItemChanged: () => void
  setError: (e: string | null) => void
}

export function ItemsTab({
  items,
  characterId,
  onAddItem,
  onItemChanged,
  setError,
}: ItemsTabProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredItems = useMemo(() => {
    let result = items

    if (categoryFilter !== 'all') {
      result = result.filter(i => i.category === categoryFilter)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        i =>
          i.name.toLowerCase().includes(q) ||
          i.category?.toLowerCase().includes(q)
      )
    }

    return result
  }, [items, searchQuery, categoryFilter])

  const categories = useMemo(() => {
    const cats = new Set(items.map(i => i.category).filter(Boolean))
    return Array.from(cats).sort()
  }, [items])

  async function handleUseOne(itemId: string) {
    if (!characterId) return

    setDeletingId(itemId)
    const { error } = await consumeCharacterItem(characterId, itemId, 1)
    setDeletingId(null)

    if (error) {
      setError(error)
    } else {
      onItemChanged()
    }
  }

  async function handleDeleteAll(itemId: string) {
    setDeletingId(itemId)
    const { error } = await deleteCharacterItem(itemId)
    setDeletingId(null)
    if (error) {
      setError(error)
    } else {
      onItemChanged()
    }
  }

  return (
    <div className="space-y-4">
      {/* Search and Add */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
          />
        </div>
        <button
          onClick={onAddItem}
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
        >
          + Add Item
        </button>
      </div>

      {/* Category Filter */}
      {categories.length > 1 && (
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              categoryFilter === 'all'
                ? 'bg-zinc-700 text-zinc-100'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat!)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                categoryFilter === cat
                  ? 'bg-zinc-700 text-zinc-100'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {getCategoryIcon(cat)} {formatCategory(cat!)}
            </button>
          ))}
        </div>
      )}

      {/* Empty State */}
      {items.length === 0 ? (
        <div className="bg-zinc-800/50 rounded-lg p-8 text-center">
          <p className="text-zinc-400 mb-4">No items in your inventory</p>
          <button
            onClick={onAddItem}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 rounded-lg text-sm font-medium transition-colors"
          >
            + Add Your First Item
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-2">
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                isDeleting={deletingId === item.id}
                onUse={() => handleUseOne(item.id)}
                onDeleteAll={() => handleDeleteAll(item.id)}
              />
            ))}
          </div>

          {filteredItems.length === 0 && (
            <p className="text-center text-zinc-500 py-4">No items match your filters</p>
          )}
        </>
      )}
    </div>
  )
}

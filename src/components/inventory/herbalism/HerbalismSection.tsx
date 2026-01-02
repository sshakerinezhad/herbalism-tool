'use client'

/**
 * HerbalismSection Component
 *
 * Main container for herbalism inventory management.
 * Handles all state, business logic, and data fetching for herbs and brewed items.
 * Contains herb/brewed item action handlers, search/sort/filter state, and grouping logic.
 */

import { useState, useMemo } from 'react'
import type { CharacterHerb, CharacterBrewedItem } from '@/lib/types'
import {
  removeCharacterHerbs,
  consumeCharacterBrewedItem,
} from '@/lib/db/characterInventory'
import { getPrimaryElement, ELEMENT_ORDER, RARITY_ORDER } from '@/lib/constants'
import { ElementSummary } from '@/components/inventory'
import type { ViewTab, SortMode, BrewedTypeFilter } from '@/components/inventory/types'
import { HerbsTabContent } from './HerbsTabContent'
import { BrewedTabContent } from './BrewedTabContent'

interface HerbalismSectionProps {
  characterHerbs: CharacterHerb[]
  characterBrewedItems: CharacterBrewedItem[]
  characterId: string | null
  isHerbalist: boolean
  onHerbsChanged: () => void
  onBrewedChanged: () => void
  setError: (e: string | null) => void
}

export function HerbalismSection({
  characterHerbs,
  characterBrewedItems,
  characterId,
  isHerbalist,
  onHerbsChanged,
  onBrewedChanged,
  setError,
}: HerbalismSectionProps) {
  // View state
  const [viewTab, setViewTab] = useState<ViewTab>('herbs')
  const [sortMode, setSortMode] = useState<SortMode>('element')
  const [searchQuery, setSearchQuery] = useState('')
  const [brewedTypeFilter, setBrewedTypeFilter] = useState<BrewedTypeFilter>('all')

  // Herb deletion state
  const [deletingHerbId, setDeletingHerbId] = useState<number | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [deleteAllConfirmId, setDeleteAllConfirmId] = useState<number | null>(null)

  // Brewed item deletion state
  const [deletingBrewedId, setDeletingBrewedId] = useState<number | null>(null)
  const [deleteBrewedConfirmId, setDeleteBrewedConfirmId] = useState<number | null>(null)
  const [deleteAllBrewedConfirmId, setDeleteAllBrewedConfirmId] = useState<number | null>(null)

  // ============ Herb Actions ============

  async function handleDeleteHerb(herbId: number) {
    if (!characterId) return

    if (deleteConfirmId !== herbId) {
      setDeleteConfirmId(herbId)
      return
    }

    setDeleteConfirmId(null)
    setDeletingHerbId(herbId)

    const { error: removeError } = await removeCharacterHerbs(characterId, herbId, 1)

    setDeletingHerbId(null)

    if (removeError) {
      setError(removeError)
    } else {
      onHerbsChanged()
    }
  }

  async function handleDeleteAllOfHerb(herbId: number, quantity: number) {
    if (!characterId) return

    setDeletingHerbId(herbId)
    setDeleteConfirmId(null)
    setDeleteAllConfirmId(null)

    const { error: removeError } = await removeCharacterHerbs(characterId, herbId, quantity)

    setDeletingHerbId(null)

    if (removeError) {
      setError(removeError)
    } else {
      onHerbsChanged()
    }
  }

  // ============ Brewed Item Actions ============

  async function handleExpendBrewedItem(brewedId: number) {
    if (!characterId) return

    if (deleteBrewedConfirmId !== brewedId) {
      setDeleteBrewedConfirmId(brewedId)
      setDeleteAllBrewedConfirmId(null)
      return
    }

    setDeleteBrewedConfirmId(null)
    setDeletingBrewedId(brewedId)

    const { error: removeError } = await consumeCharacterBrewedItem(brewedId, 1)

    setDeletingBrewedId(null)

    if (removeError) {
      setError(removeError)
    } else {
      onBrewedChanged()
    }
  }

  async function handleExpendAllBrewedItem(brewedId: number, quantity: number) {
    if (!characterId) return

    setDeletingBrewedId(brewedId)
    setDeleteBrewedConfirmId(null)
    setDeleteAllBrewedConfirmId(null)

    const { error: removeError } = await consumeCharacterBrewedItem(brewedId, quantity)

    setDeletingBrewedId(null)

    if (removeError) {
      setError(removeError)
    } else {
      onBrewedChanged()
    }
  }

  // ============ Search & Filtering ============

  const getSearchScore = (item: CharacterHerb, query: string): number => {
    if (!query || !item.herb) return 1
    const q = query.toLowerCase().trim()
    const name = item.herb.name.toLowerCase()
    const rarity = item.herb.rarity.toLowerCase()
    const elements = (item.herb.elements || []).map(e => e.toLowerCase())

    let score = 0

    if (name === q) return 100
    if (name.startsWith(q)) score += 50
    else if (name.includes(q)) score += 30

    for (const word of name.split(/\s+/)) {
      if (word.startsWith(q)) score += 40
      else if (word.includes(q)) score += 20
    }

    for (const el of elements) {
      if (el === q) score += 50
      else if (el.startsWith(q)) score += 35
    }

    if (rarity === q) score += 40
    else if (rarity.startsWith(q)) score += 25
    else if (rarity.includes(q)) score += 15

    return score
  }

  const filteredInventory = useMemo(() => {
    if (!searchQuery.trim()) return characterHerbs

    return characterHerbs
      .map(item => ({ item, score: getSearchScore(item, searchQuery) }))
      .filter(({ score }) => score >= 15)
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => item)
  }, [characterHerbs, searchQuery])

  // ============ Grouping ============

  const groupedByRarity = useMemo(() => {
    const grouped = filteredInventory.reduce((acc, item) => {
      if (!item.herb) return acc
      const rarity = item.herb.rarity
      if (!acc[rarity]) acc[rarity] = []
      acc[rarity].push(item)
      return acc
    }, {} as Record<string, CharacterHerb[]>)

    return Object.keys(grouped)
      .sort((a, b) => {
        const aIdx = RARITY_ORDER.indexOf(a.toLowerCase() as typeof RARITY_ORDER[number])
        const bIdx = RARITY_ORDER.indexOf(b.toLowerCase() as typeof RARITY_ORDER[number])
        return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx)
      })
      .map(rarity => ({
        rarity,
        items: grouped[rarity].sort((a, b) => (a.herb?.name ?? '').localeCompare(b.herb?.name ?? ''))
      }))
  }, [filteredInventory])

  const groupedByElement = useMemo(() => {
    const grouped = filteredInventory.reduce((acc, item) => {
      if (!item.herb) return acc
      const elements = item.herb.elements || []
      const primary = getPrimaryElement(elements) || 'Mixed'
      if (!acc[primary]) acc[primary] = {}

      const rarity = item.herb.rarity
      if (!acc[primary][rarity]) acc[primary][rarity] = []
      acc[primary][rarity].push(item)

      return acc
    }, {} as Record<string, Record<string, CharacterHerb[]>>)

    return Object.keys(grouped)
      .sort((a, b) => {
        const aIdx = ELEMENT_ORDER.indexOf(a.toLowerCase() as typeof ELEMENT_ORDER[number])
        const bIdx = ELEMENT_ORDER.indexOf(b.toLowerCase() as typeof ELEMENT_ORDER[number])
        if (aIdx === -1 && bIdx === -1) return a === 'Mixed' ? 1 : b === 'Mixed' ? -1 : a.localeCompare(b)
        if (aIdx === -1) return 1
        if (bIdx === -1) return -1
        return aIdx - bIdx
      })
      .map(element => ({
        element,
        raritySections: Object.keys(grouped[element])
          .sort((a, b) => {
            const aIdx = RARITY_ORDER.indexOf(a.toLowerCase() as typeof RARITY_ORDER[number])
            const bIdx = RARITY_ORDER.indexOf(b.toLowerCase() as typeof RARITY_ORDER[number])
            return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx)
          })
          .map(rarity => ({
            rarity,
            items: grouped[element][rarity].sort((a, b) => (a.herb?.name ?? '').localeCompare(b.herb?.name ?? ''))
          }))
      }))
  }, [filteredInventory])

  // ============ Brewed Items Filtering ============

  const brewedTypes = useMemo(() => {
    const types = new Set(characterBrewedItems.map(item => item.type))
    return Array.from(types).sort()
  }, [characterBrewedItems])

  const filteredBrewedItems = useMemo(() => {
    let items = characterBrewedItems
    if (brewedTypeFilter !== 'all') {
      items = items.filter(item => item.type === brewedTypeFilter)
    }
    return [...items].sort((a, b) => {
      if (b.quantity !== a.quantity) return b.quantity - a.quantity
      const aLen = Array.isArray(a.effects) ? a.effects.length : 1
      const bLen = Array.isArray(b.effects) ? b.effects.length : 1
      return bLen - aLen
    })
  }, [characterBrewedItems, brewedTypeFilter])

  // ============ Computed Values ============

  const totalHerbs = characterHerbs.reduce((sum, item) => sum + item.quantity, 0)
  const uniqueHerbs = characterHerbs.length

  return (
    <>
      {/* View Tabs */}
      <div className="flex gap-2 mb-6">
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
        {isHerbalist && (
          <button
            onClick={() => setViewTab('brewed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewTab === 'brewed'
                ? 'bg-purple-700 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            ⚗️ Brewed
            <span className="ml-2 text-xs opacity-70">
              ({characterBrewedItems.reduce((s: number, i: CharacterBrewedItem) => s + i.quantity, 0)})
            </span>
          </button>
        )}
      </div>

      {/* Herbs Tab */}
      {viewTab === 'herbs' && (
        <HerbsTabContent
          characterHerbs={characterHerbs}
          filteredInventory={filteredInventory}
          groupedByRarity={groupedByRarity}
          groupedByElement={groupedByElement}
          sortMode={sortMode}
          setSortMode={setSortMode}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          totalHerbs={totalHerbs}
          uniqueHerbs={uniqueHerbs}
          deletingHerbId={deletingHerbId}
          deleteConfirmId={deleteConfirmId}
          deleteAllConfirmId={deleteAllConfirmId}
          onDeleteHerb={handleDeleteHerb}
          onDeleteAllOfHerb={handleDeleteAllOfHerb}
          onCancelConfirm={() => setDeleteConfirmId(null)}
          onShowDeleteAll={(id) => {
            setDeleteConfirmId(null)
            setDeleteAllConfirmId(id)
          }}
          onCancelDeleteAll={() => setDeleteAllConfirmId(null)}
        />
      )}

      {/* Brewed Tab */}
      {viewTab === 'brewed' && (
        <BrewedTabContent
          brewedItems={characterBrewedItems}
          filteredBrewedItems={filteredBrewedItems}
          brewedTypes={brewedTypes}
          brewedTypeFilter={brewedTypeFilter}
          setBrewedTypeFilter={setBrewedTypeFilter}
          deletingBrewedId={deletingBrewedId}
          deleteBrewedConfirmId={deleteBrewedConfirmId}
          deleteAllBrewedConfirmId={deleteAllBrewedConfirmId}
          onExpend={handleExpendBrewedItem}
          onExpendAll={handleExpendAllBrewedItem}
          onCancelConfirm={() => setDeleteBrewedConfirmId(null)}
          onShowExpendAll={(id) => {
            setDeleteBrewedConfirmId(null)
            setDeleteAllBrewedConfirmId(id)
          }}
          onCancelExpendAll={() => setDeleteAllBrewedConfirmId(null)}
        />
      )}

      {/* Element Summary */}
      {viewTab === 'herbs' && characterHerbs.length > 0 && (
        <ElementSummary characterHerbs={characterHerbs} />
      )}
    </>
  )
}

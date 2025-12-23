'use client'

/**
 * Inventory Page
 * 
 * Displays the user's herb inventory and brewed items.
 * Supports sorting by element or rarity, search, and item management.
 */

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useProfile } from '@/lib/profile'
import { useInventory, useBrewedItems, useInvalidateQueries, InventoryItem } from '@/lib/hooks'
import { removeHerbsFromInventory } from '@/lib/inventory'
import { removeBrewedItem } from '@/lib/brewing'
import { 
  getElementSymbol, 
  getElementColors, 
  getPrimaryElement,
  ELEMENT_ORDER,
  RARITY_ORDER 
} from '@/lib/constants'
import { PageLayout, ErrorDisplay, InventorySkeleton } from '@/components/ui'
import { HerbRow, BrewedItemCard, ElementSummary } from '@/components/inventory'

// ============ Types ============

type SortMode = 'rarity' | 'element'
type ViewTab = 'herbs' | 'brewed'
type BrewedTypeFilter = 'all' | 'elixir' | 'bomb' | 'oil'

type BrewedItem = {
  id: number
  type: string
  effects: string[] | string
  quantity: number
  computedDescription?: string
  choices?: Record<string, string>
}

// ============ Main Component ============

export default function InventoryPage() {
  const { profileId, isLoaded: profileLoaded, profile } = useProfile()
  const { invalidateInventory, invalidateBrewedItems } = useInvalidateQueries()
  
  // React Query handles data fetching and caching
  const { 
    data: inventory = [], 
    isLoading: inventoryLoading, 
    error: inventoryError 
  } = useInventory(profileId)
  
  const { 
    data: brewedItems = [], 
    isLoading: brewedLoading, 
    error: brewedError 
  } = useBrewedItems(profileId)
  
  // UI state
  const [sortMode, setSortMode] = useState<SortMode>('element')
  const [viewTab, setViewTab] = useState<ViewTab>('herbs')
  const [searchQuery, setSearchQuery] = useState('')
  const [brewedTypeFilter, setBrewedTypeFilter] = useState<BrewedTypeFilter>('all')
  const [mutationError, setMutationError] = useState<string | null>(null)
  
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
    if (!profileId) return
    
    // First click shows confirm, second click deletes
    if (deleteConfirmId !== herbId) {
      setDeleteConfirmId(herbId)
      return
    }
    
    setDeleteConfirmId(null)
    setDeletingHerbId(herbId)
    setMutationError(null)
    
    const { error: removeError } = await removeHerbsFromInventory(profileId, [
      { herbId, quantity: 1 }
    ])
    
    setDeletingHerbId(null)
    
    if (removeError) {
      setMutationError(removeError)
    } else {
      // Invalidate cache to refetch updated data
      invalidateInventory(profileId)
    }
  }

  async function handleDeleteAllOfHerb(herbId: number, quantity: number) {
    if (!profileId) return
    
    setDeletingHerbId(herbId)
    setDeleteConfirmId(null)
    setDeleteAllConfirmId(null)
    setMutationError(null)
    
    const { error: removeError } = await removeHerbsFromInventory(profileId, [
      { herbId, quantity }
    ])
    
    setDeletingHerbId(null)
    
    if (removeError) {
      setMutationError(removeError)
    } else {
      invalidateInventory(profileId)
    }
  }

  // ============ Brewed Item Actions ============

  async function handleExpendBrewedItem(brewedId: number) {
    if (!profileId) return
    
    if (deleteBrewedConfirmId !== brewedId) {
      setDeleteBrewedConfirmId(brewedId)
      setDeleteAllBrewedConfirmId(null)
      return
    }
    
    setDeleteBrewedConfirmId(null)
    setDeletingBrewedId(brewedId)
    setMutationError(null)
    
    const { error: removeError } = await removeBrewedItem(brewedId, 1)
    
    setDeletingBrewedId(null)
    
    if (removeError) {
      setMutationError(removeError)
    } else {
      invalidateBrewedItems(profileId)
    }
  }

  async function handleExpendAllBrewedItem(brewedId: number, quantity: number) {
    if (!profileId) return
    
    setDeletingBrewedId(brewedId)
    setDeleteBrewedConfirmId(null)
    setDeleteAllBrewedConfirmId(null)
    setMutationError(null)
    
    const { error: removeError } = await removeBrewedItem(brewedId, quantity)
    
    setDeletingBrewedId(null)
    
    if (removeError) {
      setMutationError(removeError)
    } else {
      invalidateBrewedItems(profileId)
    }
  }

  // ============ Search & Filtering ============

  const getSearchScore = (item: InventoryItem, query: string): number => {
    if (!query) return 1
    const q = query.toLowerCase().trim()
    const name = item.herb.name.toLowerCase()
    const rarity = item.herb.rarity.toLowerCase()
    const elements = item.herb.elements.map(e => e.toLowerCase())
    
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
    if (!searchQuery.trim()) return inventory
    
    return inventory
      .map(item => ({ item, score: getSearchScore(item, searchQuery) }))
      .filter(({ score }) => score >= 15)
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => item)
  }, [inventory, searchQuery])

  // ============ Grouping ============

  const groupedByRarity = useMemo(() => {
    const grouped = filteredInventory.reduce((acc, item) => {
      const rarity = item.herb.rarity
      if (!acc[rarity]) acc[rarity] = []
      acc[rarity].push(item)
      return acc
    }, {} as Record<string, InventoryItem[]>)
    
    return Object.keys(grouped)
      .sort((a, b) => {
        const aIdx = RARITY_ORDER.indexOf(a.toLowerCase() as typeof RARITY_ORDER[number])
        const bIdx = RARITY_ORDER.indexOf(b.toLowerCase() as typeof RARITY_ORDER[number])
        return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx)
      })
      .map(rarity => ({
        rarity,
        items: grouped[rarity].sort((a, b) => a.herb.name.localeCompare(b.herb.name))
      }))
  }, [filteredInventory])

  const groupedByElement = useMemo(() => {
    const grouped = filteredInventory.reduce((acc, item) => {
      const primary = getPrimaryElement(item.herb.elements) || 'Mixed'
      if (!acc[primary]) acc[primary] = {}
      
      const rarity = item.herb.rarity
      if (!acc[primary][rarity]) acc[primary][rarity] = []
      acc[primary][rarity].push(item)
      
      return acc
    }, {} as Record<string, Record<string, InventoryItem[]>>)
    
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
            items: grouped[element][rarity].sort((a, b) => a.herb.name.localeCompare(b.herb.name))
          }))
      }))
  }, [filteredInventory])

  // ============ Brewed Items Filtering ============

  const brewedTypes = useMemo(() => {
    const types = new Set(brewedItems.map(item => item.type))
    return Array.from(types).sort()
  }, [brewedItems])

  const filteredBrewedItems = useMemo(() => {
    let items = brewedItems
    if (brewedTypeFilter !== 'all') {
      items = items.filter(item => item.type === brewedTypeFilter)
    }
    return [...items].sort((a, b) => {
      if (b.quantity !== a.quantity) return b.quantity - a.quantity
      const aLen = Array.isArray(a.effects) ? a.effects.length : 1
      const bLen = Array.isArray(b.effects) ? b.effects.length : 1
      return bLen - aLen
    })
  }, [brewedItems, brewedTypeFilter])

  // ============ Computed Values ============

  const totalHerbs = inventory.reduce((sum, item) => sum + item.quantity, 0)
  const uniqueHerbs = inventory.length
  const isLoading = !profileLoaded || inventoryLoading || brewedLoading
  const error = inventoryError?.message || brewedError?.message || mutationError

  if (isLoading) {
    return <InventorySkeleton />
  }

  return (
    <PageLayout>
      <h1 className="text-3xl font-bold mb-4">🎒 Inventory</h1>

      {/* View Tabs */}
      <div className="flex gap-2 mb-6 border-b border-zinc-800 pb-4">
        <TabButton 
          active={viewTab === 'herbs'} 
          onClick={() => setViewTab('herbs')}
          className="bg-green-700"
        >
          🌿 Herbs
          <span className="ml-2 text-xs opacity-70">({totalHerbs})</span>
        </TabButton>
        {profile.isHerbalist && (
          <TabButton 
            active={viewTab === 'brewed'} 
            onClick={() => setViewTab('brewed')}
            className="bg-purple-700"
          >
            ⚗️ Brewed
            <span className="ml-2 text-xs opacity-70">
              ({brewedItems.reduce((s, i) => s + i.quantity, 0)})
            </span>
          </TabButton>
        )}
      </div>

      {error && <ErrorDisplay message={error} className="mb-6" />}

      {/* Herbs Tab */}
      {viewTab === 'herbs' && (
        <HerbsTabContent
          inventory={inventory}
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
          brewedItems={brewedItems}
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
      {viewTab === 'herbs' && inventory.length > 0 && (
        <ElementSummary inventory={inventory} />
      )}
    </PageLayout>
  )
}

// ============ Sub-components ============

function TabButton({ 
  active, 
  onClick, 
  children, 
  className 
}: { 
  active: boolean
  onClick: () => void
  children: React.ReactNode
  className: string
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? `${className} text-white`
          : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
      }`}
    >
      {children}
    </button>
  )
}

// ============ Herbs Tab ============

type HerbsTabContentProps = {
  inventory: InventoryItem[]
  filteredInventory: InventoryItem[]
  groupedByRarity: { rarity: string; items: InventoryItem[] }[]
  groupedByElement: { element: string; raritySections: { rarity: string; items: InventoryItem[] }[] }[]
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

function HerbsTabContent(props: HerbsTabContentProps) {
  const {
    inventory,
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

  if (inventory.length === 0) {
    return (
      <div className="bg-zinc-800/50 rounded-lg p-8 text-center">
        <p className="text-zinc-400 mb-4">Your herb inventory is empty</p>
        <Link
          href="/forage"
          className="inline-block px-4 py-2 bg-green-700 hover:bg-green-600 rounded-lg text-sm font-medium transition-colors"
        >
          🔍 Start Foraging
        </Link>
      </div>
    )
  }

  return (
    <>
      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">🔍</span>
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
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Header with count and sort toggle */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-zinc-500 text-sm">
          {searchQuery 
            ? `${filteredInventory.length} result${filteredInventory.length !== 1 ? 's' : ''}`
            : `${totalHerbs} herb${totalHerbs !== 1 ? 's' : ''} • ${uniqueHerbs} unique`
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
                  {items.map((item, idx) => (
                    <HerbRow
                      key={item.id}
                      item={item}
                      index={idx}
                      colors={colors}
                      isDeleting={deletingHerbId === item.herb.id}
                      isConfirming={deleteConfirmId === item.herb.id}
                      isConfirmingAll={deleteAllConfirmId === item.herb.id}
                      onDelete={() => onDeleteHerb(item.herb.id)}
                      onDeleteAll={() => onDeleteAllOfHerb(item.herb.id, item.quantity)}
                      onCancelConfirm={() => {
                        onCancelConfirm()
                        onCancelDeleteAll()
                      }}
                      onShowDeleteAll={() => onShowDeleteAll(item.herb.id)}
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
            const elementSymbol = element === 'Mixed' ? '⚖️' : getElementSymbol(element)
            
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
                      {items.map((item) => {
                        const currentIndex = rowIndex++
                        return (
                          <HerbRow
                            key={item.id}
                            item={item}
                            index={currentIndex}
                            colors={colors}
                            isDeleting={deletingHerbId === item.herb.id}
                            isConfirming={deleteConfirmId === item.herb.id}
                            isConfirmingAll={deleteAllConfirmId === item.herb.id}
                            onDelete={() => onDeleteHerb(item.herb.id)}
                            onDeleteAll={() => onDeleteAllOfHerb(item.herb.id, item.quantity)}
                            onCancelConfirm={() => {
                              onCancelConfirm()
                              onCancelDeleteAll()
                            }}
                            onShowDeleteAll={() => onShowDeleteAll(item.herb.id)}
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

// ============ Brewed Tab ============

type BrewedTabContentProps = {
  brewedItems: BrewedItem[]
  filteredBrewedItems: BrewedItem[]
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

function BrewedTabContent(props: BrewedTabContentProps) {
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
              ⚔️ Oils
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

function FilterButton({ 
  active, 
  onClick, 
  children, 
  activeClass = 'bg-zinc-700' 
}: { 
  active: boolean
  onClick: () => void
  children: React.ReactNode
  activeClass?: string
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
        active ? `${activeClass} text-zinc-100` : 'text-zinc-400 hover:text-zinc-200'
      }`}
    >
      {children}
    </button>
  )
}

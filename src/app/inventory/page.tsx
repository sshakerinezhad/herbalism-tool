'use client'

/**
 * Unified Inventory Page
 * 
 * All character possessions in one place:
 * - Equipment (weapons, items)
 * - Herbalism (herbs, brewed items) - with beautiful element-colored UI
 */

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useProfile } from '@/lib/profile'
import { useAuth } from '@/lib/auth'
import { 
  useInvalidateQueries, 
  useCharacter,
  useCharacterWeapons,
  useCharacterItems,
  useWeaponTemplates,
  useMaterials,
  useItemTemplates,
  useCharacterHerbs,
  useCharacterBrewedItems,
} from '@/lib/hooks'
import {
  removeCharacterHerbs,
  consumeCharacterBrewedItem,
} from '@/lib/db/characterInventory'
import type { CharacterHerb, CharacterBrewedItem } from '@/lib/types'
import { 
  getElementSymbol, 
  getElementColors, 
  getPrimaryElement,
  ELEMENT_ORDER,
  RARITY_ORDER 
} from '@/lib/constants'
import { PageLayout, ErrorDisplay, InventorySkeleton } from '@/components/ui'
import {
  HerbRow,
  BrewedItemCard,
  ElementSummary,
  AddWeaponModal,
  AddItemModal,
  EquipmentSection,
  type MainTab,
  type EquipmentSubTab,
  type SortMode,
  type BrewedTypeFilter,
  type ViewTab,
  getCategoryIcon,
  formatCategory,
} from '@/components/inventory'

// ============ Main Component ============

export default function InventoryPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { profileId, isLoaded: profileLoaded, profile } = useProfile()
  const { 
    invalidateCharacterWeapons,
    invalidateCharacterItems,
    invalidateCharacterHerbs,
    invalidateCharacterBrewedItems,
  } = useInvalidateQueries()
  
  // Character data
  const { data: character, isLoading: characterLoading } = useCharacter(user?.id ?? null)
  
  // Equipment data
  const { data: weapons = [], isLoading: weaponsLoading } = useCharacterWeapons(character?.id ?? null)
  const { data: items = [], isLoading: itemsLoading } = useCharacterItems(character?.id ?? null)
  const { data: weaponTemplates = [], isLoading: templatesLoading } = useWeaponTemplates()
  const { data: materials = [], isLoading: materialsLoading } = useMaterials()
  const { data: itemTemplates = [], isLoading: itemTemplatesLoading } = useItemTemplates()
  
  // Herbalism data (NEW: character-based)
  const { 
    data: characterHerbs = [], 
    isLoading: herbsLoading, 
    error: herbsError 
  } = useCharacterHerbs(character?.id ?? null)
  
  const {
    data: characterBrewedItems = [],
    isLoading: brewedLoading,
    error: brewedError
  } = useCharacterBrewedItems(character?.id ?? null)

  // Derive herbalist status from character vocation
  const isHerbalist = character?.vocation === 'herbalist'

  // UI State
  const [mainTab, setMainTab] = useState<MainTab>('equipment')
  const [error, setError] = useState<string | null>(null)
  
  // Modal state
  const [showAddWeapon, setShowAddWeapon] = useState(false)
  const [showAddItem, setShowAddItem] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [authLoading, user, router])

  // Loading state
  const isLoading = !profileLoaded || authLoading || characterLoading || 
    herbsLoading || brewedLoading || weaponsLoading || itemsLoading ||
    templatesLoading || materialsLoading || itemTemplatesLoading

  if (isLoading) {
    return <InventorySkeleton />
  }

  // Gate: require character for inventory
  if (!character) {
    return (
      <PageLayout>
        <h1 className="text-3xl font-bold mb-4">Inventory</h1>
        <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-6">
          <p className="text-amber-200 mb-4">
            You need to create a character before you can view your inventory.
          </p>
          <Link
            href="/profile"
            className="inline-block px-4 py-2 bg-amber-700 hover:bg-amber-600 rounded-lg text-sm font-medium transition-colors"
          >
            Create Character
          </Link>
        </div>
      </PageLayout>
    )
  }

  const dataError = herbsError || brewedError || error
  
  // Calculate totals
  const totalWeapons = weapons.length
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalHerbs = characterHerbs.reduce((sum, h) => sum + h.quantity, 0)
  const totalBrewed = characterBrewedItems.reduce((sum, b) => sum + b.quantity, 0)

  return (
    <PageLayout maxWidth="max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">🎒 Inventory</h1>
      <p className="text-zinc-400 mb-6">All your possessions in one place.</p>

      {dataError && <ErrorDisplay message={dataError.toString()} className="mb-4" />}

      {/* Main Tabs */}
      <div className="flex gap-2 mb-6 border-b border-zinc-800 pb-4">
        <button
          onClick={() => setMainTab('equipment')}
          className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            mainTab === 'equipment'
              ? 'bg-red-700 text-white'
              : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          ⚔️ Equipment
          <span className="ml-2 text-xs opacity-70">({totalWeapons + totalItems})</span>
        </button>
        <button
          onClick={() => setMainTab('herbalism')}
          className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            mainTab === 'herbalism'
              ? 'bg-emerald-700 text-white'
              : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          🌿 Herbalism
          <span className="ml-2 text-xs opacity-70">({totalHerbs + totalBrewed})</span>
        </button>
      </div>

      {/* Equipment Section */}
      {mainTab === 'equipment' && (
        <EquipmentSection
          weapons={weapons}
          items={items}
          characterId={character?.id ?? null}
          weaponTemplates={weaponTemplates}
          materials={materials}
          itemTemplates={itemTemplates}
          showAddWeapon={showAddWeapon}
          setShowAddWeapon={setShowAddWeapon}
          showAddItem={showAddItem}
          setShowAddItem={setShowAddItem}
          onWeaponsChanged={() => character && invalidateCharacterWeapons(character.id)}
          onItemsChanged={() => character && invalidateCharacterItems(character.id)}
          setError={setError}
        />
      )}

      {/* Herbalism Section - Original Beautiful UI */}
      {mainTab === 'herbalism' && (
        <HerbalismSection
          characterHerbs={characterHerbs}
          characterBrewedItems={characterBrewedItems}
          characterId={character?.id ?? null}
          isHerbalist={isHerbalist}
          onHerbsChanged={() => character && invalidateCharacterHerbs(character.id)}
          onBrewedChanged={() => character && invalidateCharacterBrewedItems(character.id)}
          setError={setError}
        />
      )}
    </PageLayout>
  )
}

// ============ Herbalism Section - Original Beautiful UI ============

interface HerbalismSectionProps {
  characterHerbs: CharacterHerb[]
  characterBrewedItems: CharacterBrewedItem[]
  characterId: string | null
  isHerbalist: boolean
  onHerbsChanged: () => void
  onBrewedChanged: () => void
  setError: (e: string | null) => void
}

function HerbalismSection({
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

// ============ Herbs Tab Content ============

type HerbsTabContentProps = {
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

function HerbsTabContent(props: HerbsTabContentProps) {
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
            const elementSymbol = element === 'Mixed' ? '⚛️' : getElementSymbol(element)
            
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

// ============ Brewed Tab Content ============

type BrewedTabContentProps = {
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

'use client'

/**
 * Unified Inventory Page
 * 
 * All character possessions in one place:
 * - Equipment (weapons, items)
 * - Herbalism (herbs, brewed items) - with beautiful element-colored UI
 */

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
import { addWeaponFromTemplate, addItemFromTemplate, addCustomWeapon, addCustomItem, deleteCharacterWeapon, consumeCharacterItem, deleteCharacterItem } from '@/lib/db/characters'
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
import { HerbRow, BrewedItemCard, ElementSummary } from '@/components/inventory'
import type { CharacterWeapon, CharacterItem, WeaponTemplate, Material, ItemTemplate } from '@/lib/types'

// ============ Types ============

type MainTab = 'equipment' | 'herbalism'
type EquipmentSubTab = 'weapons' | 'items'
type SortMode = 'rarity' | 'element'
type BrewedTypeFilter = 'all' | 'elixir' | 'bomb' | 'oil'
type ViewTab = 'herbs' | 'brewed'

// ============ Helper Functions ============

function getCategoryIcon(category: string | null): string {
  const icons: Record<string, string> = {
    simple_melee: '🗡️',
    simple_ranged: '🏹',
    martial_melee: '⚔️',
    martial_ranged: '🎯',
    potion: '🧪',
    scroll: '📜',
    gear: '⚙️',
    ammo: '🏹',
    food: '🍖',
    tool: '🔧',
    container: '📦',
  }
  return icons[category || ''] || '📦'
}

function formatCategory(category: string): string {
  return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

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

// ============ Equipment Section ============

interface EquipmentSectionProps {
  weapons: CharacterWeapon[]
  items: CharacterItem[]
  characterId: string | null
  weaponTemplates: WeaponTemplate[]
  materials: Material[]
  itemTemplates: ItemTemplate[]
  showAddWeapon: boolean
  setShowAddWeapon: (show: boolean) => void
  showAddItem: boolean
  setShowAddItem: (show: boolean) => void
  onWeaponsChanged: () => void
  onItemsChanged: () => void
  setError: (e: string | null) => void
}

function EquipmentSection({
  weapons,
  items,
  characterId,
  weaponTemplates,
  materials,
  itemTemplates,
  showAddWeapon,
  setShowAddWeapon,
  showAddItem,
  setShowAddItem,
  onWeaponsChanged,
  onItemsChanged,
  setError,
}: EquipmentSectionProps) {
  const [subTab, setSubTab] = useState<EquipmentSubTab>('weapons')

  if (!characterId) {
    return (
      <div className="bg-zinc-800/50 rounded-lg p-8 text-center">
        <p className="text-zinc-400 mb-4">Create a character to manage equipment.</p>
        <Link
          href="/create-character"
          className="px-6 py-3 bg-emerald-700 hover:bg-emerald-600 rounded-lg font-medium transition-colors inline-block"
        >
          Create Character
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setSubTab('weapons')}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            subTab === 'weapons'
              ? 'bg-zinc-700 text-zinc-100'
              : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          ⚔️ Weapons ({weapons.length})
        </button>
        <button
          onClick={() => setSubTab('items')}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            subTab === 'items'
              ? 'bg-zinc-700 text-zinc-100'
              : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          🎒 Items ({items.reduce((s, i) => s + i.quantity, 0)})
        </button>
      </div>

      {subTab === 'weapons' && (
        <WeaponsTab
          weapons={weapons}
          characterId={characterId}
          onAddWeapon={() => setShowAddWeapon(true)}
          onWeaponDeleted={onWeaponsChanged}
          setError={setError}
        />
      )}

      {subTab === 'items' && (
        <ItemsTab
          items={items}
          characterId={characterId}
          onAddItem={() => setShowAddItem(true)}
          onItemChanged={onItemsChanged}
          setError={setError}
        />
      )}

      {/* Modals */}
      {showAddWeapon && (
        <AddWeaponModal
          characterId={characterId}
          templates={weaponTemplates}
          materials={materials}
          onClose={() => setShowAddWeapon(false)}
          onSuccess={() => {
            setShowAddWeapon(false)
            onWeaponsChanged()
          }}
          setError={setError}
        />
      )}

      {showAddItem && (
        <AddItemModal
          characterId={characterId}
          templates={itemTemplates}
          onClose={() => setShowAddItem(false)}
          onSuccess={() => {
            setShowAddItem(false)
            onItemsChanged()
          }}
          setError={setError}
        />
      )}
    </div>
  )
}

// ============ Weapons Tab ============

interface WeaponsTabProps {
  weapons: CharacterWeapon[]
  characterId: string
  onAddWeapon: () => void
  onWeaponDeleted: () => void
  setError: (e: string | null) => void
}

function WeaponsTab({
  weapons,
  characterId,
  onAddWeapon,
  onWeaponDeleted,
  setError,
}: WeaponsTabProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredWeapons = useMemo(() => {
    if (!searchQuery.trim()) return weapons
    const q = searchQuery.toLowerCase()
    return weapons.filter(
      w =>
        w.name.toLowerCase().includes(q) ||
        w.weapon_type?.toLowerCase().includes(q) ||
        w.damage_type?.toLowerCase().includes(q) ||
        w.material?.toLowerCase().includes(q)
    )
  }, [weapons, searchQuery])

  async function handleDelete(weaponId: string) {
    setDeletingId(weaponId)
    const { error } = await deleteCharacterWeapon(weaponId)
    setDeletingId(null)
    if (error) {
      setError(error)
    } else {
      onWeaponDeleted()
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
            placeholder="Search weapons..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
          />
        </div>
        <button
          onClick={onAddWeapon}
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
        >
          + Add Weapon
        </button>
      </div>

      {/* Empty State */}
      {weapons.length === 0 ? (
        <div className="bg-zinc-800/50 rounded-lg p-8 text-center">
          <p className="text-zinc-400 mb-4">No weapons in your inventory</p>
          <button
            onClick={onAddWeapon}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 rounded-lg text-sm font-medium transition-colors"
          >
            + Add Your First Weapon
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-2">
            {filteredWeapons.map((weapon) => (
              <WeaponCard
                key={weapon.id}
                weapon={weapon}
                isDeleting={deletingId === weapon.id}
                onDelete={() => handleDelete(weapon.id)}
              />
            ))}
          </div>

          {filteredWeapons.length === 0 && searchQuery && (
            <p className="text-center text-zinc-500 py-4">No weapons match your search</p>
          )}
        </>
      )}
    </div>
  )
}

// ============ Weapon Card ============

function WeaponCard({
  weapon,
  isDeleting,
  onDelete,
}: {
  weapon: CharacterWeapon
  isDeleting: boolean
  onDelete: () => void
}) {
  const [showConfirm, setShowConfirm] = useState(false)
  
  const materialName = weapon.material_ref?.name || weapon.material || 'Unknown'
  const materialTier = weapon.material_ref?.tier || 1

  return (
    <div
      className={`bg-zinc-800 rounded-lg p-4 border transition-opacity ${
        weapon.is_magical ? 'border-purple-700/50' : 'border-zinc-700'
      } ${isDeleting ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span>{getCategoryIcon(weapon.weapon_type)}</span>
            {weapon.is_magical && <span className="text-purple-400">✨</span>}
            <h3 className="font-medium">{weapon.name}</h3>
            {weapon.is_two_handed && (
              <span className="text-xs bg-zinc-700 text-zinc-300 px-1.5 py-0.5 rounded">2H</span>
            )}
            <span className={`text-xs px-1.5 py-0.5 rounded ${
              materialTier >= 4 ? 'bg-purple-900/50 text-purple-300' :
              materialTier >= 3 ? 'bg-blue-900/50 text-blue-300' :
              materialTier >= 2 ? 'bg-green-900/50 text-green-300' :
              'bg-zinc-700 text-zinc-400'
            }`}>
              {materialName}
            </span>
          </div>
          <div className="text-sm text-zinc-400 mt-1">
            {weapon.damage_dice && (
              <span className="text-red-400 font-mono">{weapon.damage_dice}</span>
            )}
            {weapon.damage_type && (
              <span className="ml-2">{weapon.damage_type}</span>
            )}
            {weapon.template?.properties && weapon.template.properties.length > 0 && (
              <span className="ml-2 text-zinc-500">
                • {weapon.template.properties.join(', ')}
              </span>
            )}
          </div>
          {weapon.notes && (
            <p className="text-xs text-zinc-500 mt-2">{weapon.notes}</p>
          )}
        </div>

        <div className="flex items-center gap-2 ml-4">
          {showConfirm ? (
            <>
              <button
                onClick={onDelete}
                disabled={isDeleting}
                className="text-xs px-2 py-1 bg-red-700 hover:bg-red-600 rounded transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="text-xs px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              className="text-xs px-2 py-1 text-zinc-400 hover:text-red-400 transition-colors"
            >
              🗑️
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ============ Items Tab ============

interface ItemsTabProps {
  items: CharacterItem[]
  characterId: string
  onAddItem: () => void
  onItemChanged: () => void
  setError: (e: string | null) => void
}

function ItemsTab({
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

// ============ Item Card ============

function ItemCard({
  item,
  isDeleting,
  onUse,
  onDeleteAll,
}: {
  item: CharacterItem
  isDeleting: boolean
  onUse: () => void
  onDeleteAll: () => void
}) {
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <div
      className={`bg-zinc-800 rounded-lg p-4 border border-zinc-700 transition-opacity ${
        isDeleting ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span>{getCategoryIcon(item.category)}</span>
            <h3 className="font-medium">{item.name}</h3>
            {item.quantity > 1 && (
              <span className="text-xs bg-zinc-700 text-zinc-300 px-1.5 py-0.5 rounded">
                ×{item.quantity}
              </span>
            )}
          </div>
          {item.notes && (
            <p className="text-xs text-zinc-500 mt-1">{item.notes}</p>
          )}
          {item.template?.effects && Object.keys(item.template.effects).length > 0 && (
            <div className="text-xs text-emerald-400 mt-1">
              {Object.entries(item.template.effects).map(([k, v]) => (
                <span key={k} className="mr-2">{k}: {String(v)}</span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 ml-4">
          {showConfirm ? (
            <>
              <button
                onClick={onDeleteAll}
                disabled={isDeleting}
                className="text-xs px-2 py-1 bg-red-700 hover:bg-red-600 rounded transition-colors"
              >
                Delete All
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="text-xs px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onUse}
                disabled={isDeleting}
                className="text-xs px-2 py-1 bg-blue-700 hover:bg-blue-600 rounded transition-colors"
                title="Use one"
              >
                Use
              </button>
              <button
                onClick={() => setShowConfirm(true)}
                className="text-xs px-2 py-1 text-zinc-400 hover:text-red-400 transition-colors"
              >
                🗑️
              </button>
            </>
          )}
        </div>
      </div>
    </div>
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

// ============ Add Weapon Modal (Template + Custom) ============

type WeaponModalMode = 'template' | 'custom'

interface AddWeaponModalProps {
  characterId: string
  templates: WeaponTemplate[]
  materials: Material[]
  onClose: () => void
  onSuccess: () => void
  setError: (e: string | null) => void
}

function AddWeaponModal({ characterId, templates, materials, onClose, onSuccess, setError }: AddWeaponModalProps) {
  const [mode, setMode] = useState<WeaponModalMode>('template')
  const [saving, setSaving] = useState(false)
  
  // Template mode state
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null)
  const [selectedMaterialId, setSelectedMaterialId] = useState<number>(
    materials.find(m => m.name === 'Steel')?.id || materials[0]?.id || 0
  )
  const [templateCustomName, setTemplateCustomName] = useState('')
  const [templateIsMagical, setTemplateIsMagical] = useState(false)
  const [templateNotes, setTemplateNotes] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Custom mode state
  const [customName, setCustomName] = useState('')
  const [customDamageDice, setCustomDamageDice] = useState('1d6')
  const [customDamageType, setCustomDamageType] = useState('slashing')
  const [customWeaponType, setCustomWeaponType] = useState('simple_melee')
  const [customProperties, setCustomProperties] = useState('')
  const [customRangeNormal, setCustomRangeNormal] = useState('')
  const [customRangeLong, setCustomRangeLong] = useState('')
  const [customIsTwoHanded, setCustomIsTwoHanded] = useState(false)
  const [customIsMagical, setCustomIsMagical] = useState(false)
  const [customNotes, setCustomNotes] = useState('')

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId)
  const selectedMaterial = materials.find(m => m.id === selectedMaterialId)

  const groupedTemplates = useMemo(() => {
    let filtered = templates
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(t => t.category === categoryFilter)
    }
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(t => t.name.toLowerCase().includes(q))
    }
    
    const groups: Record<string, WeaponTemplate[]> = {}
    for (const t of filtered) {
      if (!groups[t.category]) groups[t.category] = []
      groups[t.category].push(t)
    }
    return groups
  }, [templates, categoryFilter, searchQuery])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    if (mode === 'template') {
      if (!selectedTemplateId) {
        setError('Please select a weapon type')
        setSaving(false)
        return
      }

      const { error } = await addWeaponFromTemplate(
        characterId,
        selectedTemplateId,
        selectedMaterialId,
        {
          customName: templateCustomName.trim() || undefined,
          isMagical: templateIsMagical,
          notes: templateNotes.trim() || undefined,
        }
      )

      if (error) {
        setError(error)
        setSaving(false)
        return
      }
    } else {
      // Custom mode
      if (!customName.trim()) {
        setError('Please enter a weapon name')
        setSaving(false)
        return
      }
      if (!customDamageDice.trim()) {
        setError('Please enter damage dice')
        setSaving(false)
        return
      }

      const properties = customProperties.trim() 
        ? customProperties.split(',').map(p => p.trim().toLowerCase())
        : []

      const { error } = await addCustomWeapon(characterId, {
        name: customName.trim(),
        damage_dice: customDamageDice.trim(),
        damage_type: customDamageType,
        weapon_type: customWeaponType,
        properties,
        range_normal: customRangeNormal ? parseInt(customRangeNormal, 10) : undefined,
        range_long: customRangeLong ? parseInt(customRangeLong, 10) : undefined,
        is_two_handed: customIsTwoHanded,
        is_magical: customIsMagical,
        notes: customNotes.trim() || undefined,
      })

      if (error) {
        setError(error)
        setSaving(false)
        return
      }
    }

    setSaving(false)
    setError(null)
    onSuccess()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-800 rounded-lg border border-zinc-700 max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-zinc-700">
          <h3 className="font-medium text-lg">Add Weapon</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-200">✕</button>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-zinc-700">
          <button
            type="button"
            onClick={() => setMode('template')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              mode === 'template'
                ? 'bg-zinc-700 text-white border-b-2 border-emerald-500'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            📋 From Template
          </button>
          <button
            type="button"
            onClick={() => setMode('custom')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              mode === 'custom'
                ? 'bg-zinc-700 text-white border-b-2 border-purple-500'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            ✨ Custom Weapon
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {mode === 'template' ? (
              <>
                {/* Search and Filter */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search weapons..."
                    className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500"
                  />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500"
                  >
                    <option value="all">All Types</option>
                    <option value="simple_melee">Simple Melee</option>
                    <option value="simple_ranged">Simple Ranged</option>
                    <option value="martial_melee">Martial Melee</option>
                    <option value="martial_ranged">Martial Ranged</option>
                  </select>
                </div>

                {/* Weapon Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">Select Weapon Type *</label>
                  <div className="max-h-48 overflow-y-auto bg-zinc-900 rounded-lg border border-zinc-700 p-2 space-y-3">
                    {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
                      <div key={category}>
                        <div className="text-xs text-zinc-500 uppercase tracking-wide mb-1 px-2">
                          {getCategoryIcon(category)} {formatCategory(category)}
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          {categoryTemplates.map(template => (
                            <button
                              key={template.id}
                              type="button"
                              onClick={() => setSelectedTemplateId(template.id)}
                              className={`text-left p-2 rounded transition-colors ${
                                selectedTemplateId === template.id
                                  ? 'bg-emerald-700 text-white'
                                  : 'hover:bg-zinc-800'
                              }`}
                            >
                              <div className="text-sm font-medium">{template.name}</div>
                              <div className="text-xs text-zinc-400">
                                {template.damage_dice} {template.damage_type}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    {Object.keys(groupedTemplates).length === 0 && (
                      <p className="text-center text-zinc-500 py-4">No weapons match your search</p>
                    )}
                  </div>
                </div>

                {/* Selected Weapon Preview */}
                {selectedTemplate && (
                  <div className="bg-zinc-900 rounded-lg p-3 border border-emerald-700/50">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{getCategoryIcon(selectedTemplate.category)}</span>
                      <span className="font-medium">{selectedTemplate.name}</span>
                    </div>
                    <div className="text-sm text-zinc-400 grid grid-cols-2 gap-2">
                      <div>Damage: <span className="text-red-400">{selectedTemplate.damage_dice} {selectedTemplate.damage_type}</span></div>
                      {selectedTemplate.versatile_dice && (
                        <div>Versatile: <span className="text-amber-400">{selectedTemplate.versatile_dice}</span></div>
                      )}
                      {selectedTemplate.range_normal && (
                        <div>Range: {selectedTemplate.range_normal}/{selectedTemplate.range_long} ft</div>
                      )}
                      {selectedTemplate.properties.length > 0 && (
                        <div className="col-span-2">Properties: {selectedTemplate.properties.join(', ')}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Material Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">Material</label>
                  <select
                    value={selectedMaterialId}
                    onChange={(e) => setSelectedMaterialId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500"
                  >
                    {materials.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} {m.tier > 1 ? `(Tier ${m.tier})` : ''}
                        {m.damage_bonus > 0 ? ` +${m.damage_bonus} dmg` : ''}
                        {m.attack_bonus > 0 ? ` +${m.attack_bonus} atk` : ''}
                      </option>
                    ))}
                  </select>
                  {selectedMaterial?.description && (
                    <p className="text-xs text-zinc-500 mt-1">{selectedMaterial.description}</p>
                  )}
                </div>

                {/* Optional Fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Custom Name</label>
                    <input
                      type="text"
                      value={templateCustomName}
                      onChange={(e) => setTemplateCustomName(e.target.value)}
                      placeholder={selectedTemplate?.name || 'e.g., Oathkeeper'}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={templateIsMagical}
                        onChange={(e) => setTemplateIsMagical(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">✨ Magical</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    value={templateNotes}
                    onChange={(e) => setTemplateNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500 resize-none"
                    placeholder="Special properties, enchantments..."
                  />
                </div>
              </>
            ) : (
              /* Custom Mode */
              <>
                <p className="text-sm text-zinc-400 mb-2">
                  Create a fully custom weapon for homebrew, magical items, or unique gear.
                </p>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium mb-1">Weapon Name *</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g., Flame Tongue, Vorpal Blade"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500"
                  />
                </div>

                {/* Damage */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Damage Dice *</label>
                    <input
                      type="text"
                      value={customDamageDice}
                      onChange={(e) => setCustomDamageDice(e.target.value)}
                      placeholder="e.g., 1d8, 2d6"
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Damage Type</label>
                    <select
                      value={customDamageType}
                      onChange={(e) => setCustomDamageType(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500"
                    >
                      <option value="slashing">Slashing</option>
                      <option value="piercing">Piercing</option>
                      <option value="bludgeoning">Bludgeoning</option>
                      <option value="fire">Fire</option>
                      <option value="cold">Cold</option>
                      <option value="lightning">Lightning</option>
                      <option value="thunder">Thunder</option>
                      <option value="acid">Acid</option>
                      <option value="poison">Poison</option>
                      <option value="necrotic">Necrotic</option>
                      <option value="radiant">Radiant</option>
                      <option value="psychic">Psychic</option>
                      <option value="force">Force</option>
                    </select>
                  </div>
                </div>

                {/* Weapon Type */}
                <div>
                  <label className="block text-sm font-medium mb-1">Weapon Category</label>
                  <select
                    value={customWeaponType}
                    onChange={(e) => setCustomWeaponType(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500"
                  >
                    <option value="simple_melee">Simple Melee</option>
                    <option value="simple_ranged">Simple Ranged</option>
                    <option value="martial_melee">Martial Melee</option>
                    <option value="martial_ranged">Martial Ranged</option>
                    <option value="exotic">Exotic</option>
                    <option value="improvised">Improvised</option>
                  </select>
                </div>

                {/* Properties */}
                <div>
                  <label className="block text-sm font-medium mb-1">Properties</label>
                  <input
                    type="text"
                    value={customProperties}
                    onChange={(e) => setCustomProperties(e.target.value)}
                    placeholder="e.g., finesse, versatile, light (comma-separated)"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500"
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    Common: finesse, versatile, light, heavy, two-handed, thrown, reach, loading
                  </p>
                </div>

                {/* Range (for ranged weapons) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Range (Normal)</label>
                    <input
                      type="number"
                      value={customRangeNormal}
                      onChange={(e) => setCustomRangeNormal(e.target.value)}
                      placeholder="e.g., 80"
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Range (Long)</label>
                    <input
                      type="number"
                      value={customRangeLong}
                      onChange={(e) => setCustomRangeLong(e.target.value)}
                      placeholder="e.g., 320"
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                </div>

                {/* Flags */}
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customIsTwoHanded}
                      onChange={(e) => setCustomIsTwoHanded(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">🗡️ Two-Handed</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customIsMagical}
                      onChange={(e) => setCustomIsMagical(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">✨ Magical</span>
                  </label>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium mb-1">Description / Notes</label>
                  <textarea
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500 resize-none"
                    placeholder="Describe special properties, enchantments, lore..."
                  />
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-4 border-t border-zinc-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || (mode === 'template' && !selectedTemplateId) || (mode === 'custom' && !customName.trim())}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                mode === 'template' 
                  ? 'bg-emerald-700 hover:bg-emerald-600' 
                  : 'bg-purple-700 hover:bg-purple-600'
              }`}
            >
              {saving ? 'Adding...' : 'Add Weapon'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ============ Add Item Modal (Template + Custom) ============

type ItemModalMode = 'template' | 'custom'

interface AddItemModalProps {
  characterId: string
  templates: ItemTemplate[]
  onClose: () => void
  onSuccess: () => void
  setError: (e: string | null) => void
}

function AddItemModal({ characterId, templates, onClose, onSuccess, setError }: AddItemModalProps) {
  const [mode, setMode] = useState<ItemModalMode>('template')
  const [saving, setSaving] = useState(false)
  
  // Template mode state
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null)
  const [templateQuantity, setTemplateQuantity] = useState(1)
  const [templateCustomName, setTemplateCustomName] = useState('')
  const [templateNotes, setTemplateNotes] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Custom mode state
  const [customName, setCustomName] = useState('')
  const [customCategory, setCustomCategory] = useState('gear')
  const [customQuantity, setCustomQuantity] = useState(1)
  const [customDescription, setCustomDescription] = useState('')
  const [customAmmoType, setCustomAmmoType] = useState('')

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId)

  const categories = useMemo(() => {
    const cats = new Set(templates.map(t => t.category))
    return Array.from(cats).sort()
  }, [templates])

  const filteredTemplates = useMemo(() => {
    let result = templates
    
    if (categoryFilter !== 'all') {
      result = result.filter(t => t.category === categoryFilter)
    }
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(t => t.name.toLowerCase().includes(q))
    }
    
    return result
  }, [templates, categoryFilter, searchQuery])

  const groupedTemplates = useMemo(() => {
    const groups: Record<string, ItemTemplate[]> = {}
    for (const t of filteredTemplates) {
      if (!groups[t.category]) groups[t.category] = []
      groups[t.category].push(t)
    }
    return groups
  }, [filteredTemplates])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    if (mode === 'template') {
      if (!selectedTemplateId) {
        setError('Please select an item')
        setSaving(false)
        return
      }

      const { error } = await addItemFromTemplate(
        characterId,
        selectedTemplateId,
        templateQuantity,
        {
          customName: templateCustomName.trim() || undefined,
          notes: templateNotes.trim() || undefined,
        }
      )

      if (error) {
        setError(error)
        setSaving(false)
        return
      }
    } else {
      // Custom mode
      if (!customName.trim()) {
        setError('Please enter an item name')
        setSaving(false)
        return
      }

      const { error } = await addCustomItem(characterId, {
        name: customName.trim(),
        category: customCategory,
        quantity: customQuantity,
        description: customDescription.trim() || undefined,
        ammo_type: customAmmoType.trim() || undefined,
      })

      if (error) {
        setError(error)
        setSaving(false)
        return
      }
    }

    setSaving(false)
    setError(null)
    onSuccess()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-800 rounded-lg border border-zinc-700 max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-zinc-700">
          <h3 className="font-medium text-lg">Add Item</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-200">✕</button>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-zinc-700">
          <button
            type="button"
            onClick={() => setMode('template')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              mode === 'template'
                ? 'bg-zinc-700 text-white border-b-2 border-emerald-500'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            📋 From Template
          </button>
          <button
            type="button"
            onClick={() => setMode('custom')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              mode === 'custom'
                ? 'bg-zinc-700 text-white border-b-2 border-purple-500'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            ✨ Custom Item
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {mode === 'template' ? (
              <>
                {/* Search and Filter */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search items..."
                    className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500"
                  />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{formatCategory(cat)}</option>
                    ))}
                  </select>
                </div>

                {/* Item Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">Select Item *</label>
                  <div className="max-h-48 overflow-y-auto bg-zinc-900 rounded-lg border border-zinc-700 p-2 space-y-3">
                    {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
                      <div key={category}>
                        <div className="text-xs text-zinc-500 uppercase tracking-wide mb-1 px-2">
                          {getCategoryIcon(category)} {formatCategory(category)}
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          {categoryTemplates.map(template => (
                            <button
                              key={template.id}
                              type="button"
                              onClick={() => setSelectedTemplateId(template.id)}
                              className={`text-left p-2 rounded transition-colors ${
                                selectedTemplateId === template.id
                                  ? 'bg-emerald-700 text-white'
                                  : 'hover:bg-zinc-800'
                              }`}
                            >
                              <div className="text-sm font-medium">{template.name}</div>
                              {template.description && (
                                <div className="text-xs text-zinc-400 truncate">{template.description}</div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    {Object.keys(groupedTemplates).length === 0 && (
                      <p className="text-center text-zinc-500 py-4">No items match your search</p>
                    )}
                  </div>
                </div>

                {/* Selected Item Preview */}
                {selectedTemplate && (
                  <div className="bg-zinc-900 rounded-lg p-3 border border-emerald-700/50">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{getCategoryIcon(selectedTemplate.category)}</span>
                      <span className="font-medium">{selectedTemplate.name}</span>
                    </div>
                    {selectedTemplate.description && (
                      <p className="text-sm text-zinc-400">{selectedTemplate.description}</p>
                    )}
                    {selectedTemplate.effects && Object.keys(selectedTemplate.effects).length > 0 && (
                      <div className="text-sm text-emerald-400 mt-2">
                        {Object.entries(selectedTemplate.effects).map(([k, v]) => (
                          <span key={k} className="mr-3">{k}: {String(v)}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Quantity */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={templateQuantity}
                      onChange={(e) => setTemplateQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Custom Name</label>
                    <input
                      type="text"
                      value={templateCustomName}
                      onChange={(e) => setTemplateCustomName(e.target.value)}
                      placeholder={selectedTemplate?.name || ''}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    value={templateNotes}
                    onChange={(e) => setTemplateNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500 resize-none"
                    placeholder="Additional notes..."
                  />
                </div>
              </>
            ) : (
              /* Custom Mode */
              <>
                <p className="text-sm text-zinc-400 mb-2">
                  Create a fully custom item for homebrew, magical items, or unique gear.
                </p>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium mb-1">Item Name *</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g., Ring of Fire Resistance"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500"
                  />
                </div>

                {/* Category and Quantity */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <select
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500"
                    >
                      <option value="gear">Gear</option>
                      <option value="potion">Potion</option>
                      <option value="scroll">Scroll</option>
                      <option value="ammo">Ammunition</option>
                      <option value="tool">Tool</option>
                      <option value="food">Food</option>
                      <option value="container">Container</option>
                      <option value="magic_item">Magic Item</option>
                      <option value="misc">Miscellaneous</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={customQuantity}
                      onChange={(e) => setCustomQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                </div>

                {/* Ammo Type (for ammo category) */}
                {customCategory === 'ammo' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Ammo Type</label>
                    <select
                      value={customAmmoType}
                      onChange={(e) => setCustomAmmoType(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500"
                    >
                      <option value="">Select type...</option>
                      <option value="arrow">Arrows</option>
                      <option value="bolt">Bolts</option>
                      <option value="bullet">Bullets</option>
                      <option value="dart">Darts</option>
                      <option value="stone">Stones</option>
                    </select>
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500 resize-none"
                    placeholder="Describe the item, its properties, effects, lore..."
                  />
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-4 border-t border-zinc-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || (mode === 'template' && !selectedTemplateId) || (mode === 'custom' && !customName.trim())}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                mode === 'template' 
                  ? 'bg-emerald-700 hover:bg-emerald-600' 
                  : 'bg-purple-700 hover:bg-purple-600'
              }`}
            >
              {saving ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

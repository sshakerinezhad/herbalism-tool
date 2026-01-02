'use client'

/**
 * Unified Inventory Page
 * 
 * All character possessions in one place:
 * - Equipment (weapons, items)
 * - Herbalism (herbs, brewed items) - with beautiful element-colored UI
 */

import { useState, useEffect } from 'react'
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
import { PageLayout, ErrorDisplay, InventorySkeleton } from '@/components/ui'
import {
  HerbalismSection,
  AddWeaponModal,
  AddItemModal,
  EquipmentSection,
  type MainTab,
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

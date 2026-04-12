'use client'

/**
 * InventoryPanel — extracted from inventory page for embedding in profile.
 *
 * Receives a Character prop (parent owns auth + character loading).
 * Fetches equipment & herbalism data internally, renders tab UI + modals.
 */

import { useState } from 'react'
import {
  useInvalidateQueries,
  useCharacterWeapons,
  useCharacterItems,
  useWeaponTemplates,
  useMaterials,
  useItemTemplates,
  useCharacterHerbs,
  useCharacterBrewedItems,
} from '@/lib/hooks'
import { ErrorDisplay } from '@/components/ui'
import {
  HerbalismSection,
  EquipmentSection,
  type MainTab,
} from '@/components/inventory'
import type { Character } from '@/lib/types'

// ============ Types ============

interface InventoryPanelProps {
  character: Character
}

// ============ Internal skeleton for data loading ============

function InventoryDataSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex gap-2 mb-6 pb-4" style={{ borderBottom: '1px solid var(--sepia-800)' }}>
        <div className="h-10 w-32 rounded-lg" style={{ background: 'var(--grimoire-800)' }} />
        <div className="h-10 w-32 rounded-lg" style={{ background: 'var(--grimoire-800)' }} />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-16 rounded-lg" style={{ background: 'rgba(33,30,26,0.5)' }} />
      ))}
    </div>
  )
}

// ============ Main Component ============

export function InventoryPanel({ character }: InventoryPanelProps) {
  const {
    invalidateCharacterWeapons,
    invalidateCharacterItems,
    invalidateCharacterHerbs,
    invalidateCharacterBrewedItems,
  } = useInvalidateQueries()

  // Equipment data
  const { data: weapons = [], isLoading: weaponsLoading } = useCharacterWeapons(character.id)
  const { data: items = [], isLoading: itemsLoading } = useCharacterItems(character.id)
  const { data: weaponTemplates = [], isLoading: templatesLoading } = useWeaponTemplates()
  const { data: materials = [], isLoading: materialsLoading } = useMaterials()
  const { data: itemTemplates = [], isLoading: itemTemplatesLoading } = useItemTemplates()

  // Herbalism data
  const {
    data: characterHerbs = [],
    isLoading: herbsLoading,
    error: herbsError,
  } = useCharacterHerbs(character.id)

  const {
    data: characterBrewedItems = [],
    isLoading: brewedLoading,
    error: brewedError,
  } = useCharacterBrewedItems(character.id)

  // Derive herbalist status from character vocation
  const isHerbalist = character.vocation === 'herbalist'

  // UI State
  const [mainTab, setMainTab] = useState<MainTab>('equipment')
  const [error, setError] = useState<string | null>(null)

  // Modal state
  const [showAddWeapon, setShowAddWeapon] = useState(false)
  const [showAddItem, setShowAddItem] = useState(false)

  // Internal data loading
  const isDataLoading =
    weaponsLoading ||
    itemsLoading ||
    templatesLoading ||
    materialsLoading ||
    itemTemplatesLoading ||
    herbsLoading ||
    brewedLoading

  if (isDataLoading) {
    return <InventoryDataSkeleton />
  }

  const dataError = herbsError || brewedError || error

  // Calculate totals
  const totalWeapons = weapons.length
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalHerbs = characterHerbs.reduce((sum, h) => sum + h.quantity, 0)
  const totalBrewed = characterBrewedItems.reduce((sum, b) => sum + b.quantity, 0)

  return (
    <>
      {dataError && <ErrorDisplay message={dataError.toString()} className="mb-4" />}

      {/* Main Tabs — grimoire sub-tab styling */}
      <div className="flex gap-1 mb-6 pb-0" style={{ borderBottom: '1px solid var(--soot)' }}>
        <button
          onClick={() => setMainTab('equipment')}
          className={mainTab === 'equipment' ? 'sub-tab-active' : 'sub-tab-inactive'}
        >
          Equipment
          <span className="ml-1.5 font-ui text-[10px] opacity-50">({totalWeapons + totalItems})</span>
        </button>
        <button
          onClick={() => setMainTab('herbalism')}
          className={mainTab === 'herbalism' ? 'sub-tab-active' : 'sub-tab-inactive'}
        >
          Herbalism
          <span className="ml-1.5 font-ui text-[10px] opacity-50">({totalHerbs + totalBrewed})</span>
        </button>
      </div>

      {/* Equipment Section */}
      {mainTab === 'equipment' && (
        <EquipmentSection
          weapons={weapons}
          items={items}
          characterId={character.id}
          weaponTemplates={weaponTemplates}
          materials={materials}
          itemTemplates={itemTemplates}
          showAddWeapon={showAddWeapon}
          setShowAddWeapon={setShowAddWeapon}
          showAddItem={showAddItem}
          setShowAddItem={setShowAddItem}
          onWeaponsChanged={() => invalidateCharacterWeapons(character.id)}
          onItemsChanged={() => invalidateCharacterItems(character.id)}
          setError={setError}
        />
      )}

      {/* Herbalism Section */}
      {mainTab === 'herbalism' && (
        <HerbalismSection
          characterHerbs={characterHerbs}
          characterBrewedItems={characterBrewedItems}
          characterId={character.id}
          isHerbalist={isHerbalist}
          onHerbsChanged={() => invalidateCharacterHerbs(character.id)}
          onBrewedChanged={() => invalidateCharacterBrewedItems(character.id)}
          setError={setError}
        />
      )}
    </>
  )
}

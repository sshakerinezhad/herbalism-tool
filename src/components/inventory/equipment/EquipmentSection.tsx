'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { CharacterWeapon, CharacterItem, WeaponTemplate, Material, ItemTemplate } from '@/lib/types'
import { WeaponsTab } from './WeaponsTab'
import { ItemsTab } from './ItemsTab'
import { AddWeaponModal, AddItemModal } from '../modals'
import type { EquipmentSubTab } from '../types'

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

export function EquipmentSection({
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

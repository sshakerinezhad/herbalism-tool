'use client'

import { useState, useMemo } from 'react'
import { deleteCharacterWeapon } from '@/lib/db/characters'
import type { CharacterWeapon } from '@/lib/types'
import { WeaponCard } from './WeaponCard'

interface WeaponsTabProps {
  weapons: CharacterWeapon[]
  characterId: string
  onAddWeapon: () => void
  onWeaponDeleted: () => void
  setError: (e: string | null) => void
}

export function WeaponsTab({
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

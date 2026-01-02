'use client'

import { useState } from 'react'
import type { CharacterWeapon } from '@/lib/types'
import { getCategoryIcon } from '../types'

interface WeaponCardProps {
  weapon: CharacterWeapon
  isDeleting: boolean
  onDelete: () => void
}

export function WeaponCard({ weapon, isDeleting, onDelete }: WeaponCardProps) {
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

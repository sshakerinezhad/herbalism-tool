'use client'

import { useState } from 'react'
import type { CharacterWeapon } from '@/lib/types'
import { computeWeaponModifiers, formatBonus } from '@/lib/weapons'
import { getCategoryIcon } from '../types'

interface WeaponCardProps {
  weapon: CharacterWeapon
  isDeleting: boolean
  onEdit: () => void
  onDelete: () => void
  onToggleEquip: () => void
}

export function WeaponCard({ weapon, isDeleting, onEdit, onDelete, onToggleEquip }: WeaponCardProps) {
  const [showConfirm, setShowConfirm] = useState(false)

  const materialName = weapon.material_ref?.name || weapon.material || 'Unknown'
  const materialTier = weapon.material_ref?.tier || 1

  const mods = computeWeaponModifiers(weapon, weapon.material_ref)

  return (
    <div
      className={`bg-grimoire-850 top-edge-highlight rounded-lg p-4 border transition-opacity ${
        weapon.is_magical ? 'border-purple-700/50' : 'border-sepia-700'
      } ${isDeleting ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span>{getCategoryIcon(weapon.weapon_type)}</span>
            {weapon.is_magical && <span className="text-purple-400">✨</span>}
            <h3 className="font-medium">{weapon.name}</h3>
            {weapon.is_two_handed && (
              <span className="text-xs bg-grimoire-800 text-vellum-300 px-1.5 py-0.5 rounded border border-sepia-700">2H</span>
            )}
            {weapon.is_shield && (
              <span className="text-xs bg-sky-900/50 text-sky-300 px-1.5 py-0.5 rounded">🛡️ Shield</span>
            )}
            {weapon.is_equipped && (
              <span className="text-xs bg-bronze-muted/30 text-bronze-bright px-1.5 py-0.5 rounded">On hand</span>
            )}
            <span className="text-xs bg-amber-900/40 text-amber-300 px-1.5 py-0.5 rounded">{mods.makeLabel}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${
              materialTier >= 4 ? 'bg-purple-900/50 text-purple-300' :
              materialTier >= 3 ? 'bg-blue-900/50 text-blue-300' :
              materialTier >= 2 ? 'bg-green-900/50 text-green-300' :
              'bg-grimoire-800 text-vellum-400'
            }`}>
              {materialName}
            </span>
          </div>
          <div className="text-sm text-vellum-300 mt-1">
            {weapon.damage_dice && (
              <span className="text-red-400 font-mono">{weapon.damage_dice}</span>
            )}
            {weapon.damage_type && (
              <span className="ml-2">{weapon.damage_type}</span>
            )}
            {weapon.properties && weapon.properties.length > 0 && (
              <span className="ml-2 text-vellum-400">
                • {weapon.properties.join(', ')}
              </span>
            )}
            {weapon.versatile_dice && (
              <span className="ml-2 text-amber-400 font-mono">/ {weapon.versatile_dice}</span>
            )}
            {weapon.range_normal && (
              <span className="ml-2 text-vellum-400">
                — {weapon.range_normal}/{weapon.range_long || '—'} ft
              </span>
            )}
          </div>
          {/* Computed weapon contribution */}
          {weapon.is_shield ? (
            <div className="text-sm text-sky-400 mt-1">
              {weapon.ac_bonus != null && (
                <span className="font-mono">{formatBonus(weapon.ac_bonus)} AC</span>
              )}
              {weapon.str_requirement != null && (
                <span className="ml-2 text-vellum-400">Requires STR {weapon.str_requirement}</span>
              )}
            </div>
          ) : (
            <div className="text-sm text-vellum-400 mt-1">
              <span className="text-vellum-400">Attack</span>{' '}
              <span className="font-mono text-bronze-bright">{formatBonus(mods.attackBonus)}</span>
              <span className="ml-3 text-vellum-400">Damage</span>{' '}
              <span className="font-mono text-red-400">
                {mods.effectiveDamageDice || '—'} {formatBonus(mods.damageBonus)}
              </span>
            </div>
          )}

          {(mods.noProficiency || mods.disadvantageOnAttack) && (
            <p className="text-xs text-amber-400/80 mt-1">
              {mods.noProficiency && '⚠ No proficiency bonus to attacks. '}
              {mods.disadvantageOnAttack && '⚠ Disadvantage on attacks.'}
            </p>
          )}

          {weapon.notes && (
            <p className="text-xs text-vellum-400 mt-2">{weapon.notes}</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1 ml-4">
          <button
            onClick={onToggleEquip}
            className="text-xs px-2 py-1 rounded border border-sepia-700 text-vellum-400 hover:text-bronze-bright transition-colors"
            title={weapon.is_equipped ? 'Remove from on-hand' : 'Put on hand'}
          >
            {weapon.is_equipped ? 'Unequip' : 'Equip'}
          </button>
          <button
            onClick={onEdit}
            className="text-xs px-2 py-1 text-vellum-400 hover:text-bronze-bright transition-colors"
            title="Edit weapon"
          >
            ✏️
          </button>
          {showConfirm ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onDelete}
                disabled={isDeleting}
                className="text-xs px-2 py-1 bg-red-700 hover:bg-red-600 rounded transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="text-xs px-2 py-1 bg-grimoire-800 hover:bg-grimoire-700 border border-sepia-700 rounded transition-colors text-vellum-300"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              className="text-xs px-2 py-1 text-vellum-400 hover:text-red-400 transition-colors"
            >
              🗑️
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

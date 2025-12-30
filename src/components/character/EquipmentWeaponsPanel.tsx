/**
 * EquipmentWeaponsPanel Component
 *
 * Unified panel combining ArmorDiagram and WeaponSlots.
 * Single "Equipment" header with shared lock toggle.
 *
 * Layout (desktop):
 * ┌─────────────────────────────────────────────┐
 * │ ⚔ Equipment                         [🔒]   │
 * ├───────────────────────┬─────────────────────┤
 * │                       │  Right    Left      │
 * │   [Armor Diagram]     │  [Wpn]    [Wpn]     │
 * │                       │  [Wpn]    [Wpn]     │
 * │                       │  [Wpn]    [Wpn]     │
 * └───────────────────────┴─────────────────────┘
 *
 * Layout (mobile): Stacks vertically
 */

'use client'

import { useState } from 'react'
import type { ArmorSlot, ArmorType, CharacterWeaponSlot, CharacterWeapon } from '@/lib/types'
import { ArmorDiagram, type CharacterArmorData } from '@/components/ArmorDiagram'
import { WeaponSlots } from './WeaponSlots'

// ============ Types ============

interface EquipmentWeaponsPanelProps {
  // Armor props
  characterArmor: CharacterArmorData[]
  armorSlots: ArmorSlot[]
  totalAC: number
  armorLevel: 'none' | 'light' | 'medium' | 'heavy'
  strengthScore: number
  onSetArmor: (slotId: number, armorType: ArmorType | null) => void

  // Weapon props
  characterId: string
  weaponSlots: CharacterWeaponSlot[]
  weapons: CharacterWeapon[]
  onWeaponSlotsChanged: () => void
}

// ============ Component ============

export function EquipmentWeaponsPanel({
  characterArmor,
  armorSlots,
  totalAC,
  armorLevel,
  strengthScore,
  onSetArmor,
  characterId,
  weaponSlots,
  weapons,
  onWeaponSlotsChanged,
}: EquipmentWeaponsPanelProps) {
  const [locked, setLocked] = useState(true)

  return (
    <div className="bg-grimoire-850 rounded-lg border border-sepia-700 overflow-hidden">
      {/* Unified Header */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-sepia-700">
        <div className="flex items-center gap-3">
          <span className="text-base">⚔️</span>
          <span className="text-sm font-semibold text-vellum-200 uppercase tracking-wide">
            Equipment
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* AC Display */}
          <span className="text-sm font-bold text-bronze-bright">AC {totalAC}</span>

          {/* Lock Toggle */}
          <button
            onClick={() => setLocked(!locked)}
            aria-label={locked ? 'Unlock equipment editing' : 'Lock equipment editing'}
            className={`text-xs px-2 py-0.5 rounded transition-colors ${
              locked
                ? 'bg-grimoire-800 text-vellum-400 hover:bg-grimoire-700 border border-sepia-700'
                : 'bg-bronze-muted text-grimoire-950 hover:bg-bronze-bright'
            }`}
          >
            {locked ? '🔒' : '🔓'}
          </button>
        </div>
      </div>

      {/* Content: Armor + Weapons side by side */}
      <div className="flex flex-col md:flex-row">
        {/* Armor Diagram (compact mode - no header) */}
        <div className="flex-shrink-0 border-b md:border-b-0 md:border-r border-sepia-700/50">
          <ArmorDiagram
            armor={characterArmor}
            armorSlots={armorSlots}
            locked={locked}
            onToggleLock={() => setLocked(!locked)}
            onSetArmor={onSetArmor}
            totalAC={totalAC}
            armorLevel={armorLevel}
            strengthScore={strengthScore}
            compact={true}
          />
        </div>

        {/* Weapon Slots (compact mode - no header) */}
        <div className="flex-1 p-3">
          <WeaponSlots
            characterId={characterId}
            weaponSlots={weaponSlots}
            weapons={weapons}
            onUpdate={onWeaponSlotsChanged}
            compact={true}
          />
        </div>
      </div>
    </div>
  )
}

// ============ Exports ============

export type { EquipmentWeaponsPanelProps }

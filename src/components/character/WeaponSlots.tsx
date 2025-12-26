/**
 * WeaponSlots Component
 * 
 * Elden Ring-style weapon equipment with 3 slots per hand.
 * Players can cycle through equipped weapons during combat.
 * 
 * Features:
 * - 3 slots per hand (right/left)
 * - Active slot indicator
 * - Two-handed weapon support (locks off-hand)
 * - Lock toggle for editing
 * - Click slot to equip/change weapon
 * 
 * @example
 * <WeaponSlots
 *   characterId={character.id}
 *   weaponSlots={slots}
 *   weapons={allWeapons}
 *   onUpdate={() => invalidateWeaponSlots(characterId)}
 * />
 */

'use client'

import { useState } from 'react'
import type { CharacterWeaponSlot, CharacterWeapon, WeaponHand, WeaponSlotNumber } from '@/lib/types'
import { equipWeaponToSlot, setActiveWeaponSlot } from '@/lib/db/characters'

// ============ Types ============

interface WeaponSlotsProps {
  characterId: string
  weaponSlots: CharacterWeaponSlot[]
  weapons: CharacterWeapon[]
  onUpdate?: () => void
}

// ============ Component ============

export function WeaponSlots({
  characterId,
  weaponSlots,
  weapons,
  onUpdate,
}: WeaponSlotsProps) {
  const [locked, setLocked] = useState(true)
  const [selectingSlot, setSelectingSlot] = useState<{ hand: WeaponHand; slot: WeaponSlotNumber } | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Organize slots by hand
  const rightSlots = weaponSlots
    .filter(s => s.hand === 'right')
    .sort((a, b) => a.slot_number - b.slot_number)
  const leftSlots = weaponSlots
    .filter(s => s.hand === 'left')
    .sort((a, b) => a.slot_number - b.slot_number)

  // Check if off-hand is locked by a two-handed weapon
  const activeRightSlot = rightSlots.find(s => s.is_active)
  const offHandLocked = activeRightSlot?.weapon?.is_two_handed ?? false

  async function handleSlotClick(hand: WeaponHand, slotNumber: WeaponSlotNumber) {
    if (locked) {
      // When locked, clicking cycles the active slot
      const { error: err } = await setActiveWeaponSlot(characterId, hand, slotNumber)
      if (err) {
        setError(err)
      } else {
        setError(null)
        onUpdate?.()
      }
    } else {
      // When unlocked, open weapon selector
      setSelectingSlot({ hand, slot: slotNumber })
    }
  }

  async function handleEquipWeapon(weaponId: string | null) {
    if (!selectingSlot) return

    const { error: err } = await equipWeaponToSlot(
      characterId,
      selectingSlot.hand,
      selectingSlot.slot,
      weaponId
    )

    if (err) {
      setError(err)
    } else {
      setError(null)
      onUpdate?.()
    }
    setSelectingSlot(null)
  }

  return (
    <div className="bg-zinc-800 rounded-lg p-5 border border-zinc-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">Weapons</h2>
        <button
          onClick={() => setLocked(!locked)}
          aria-label={locked ? 'Unlock weapon editing' : 'Lock weapon editing'}
          className={`text-xs px-2 py-0.5 rounded transition-colors ${
            locked 
              ? 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600' 
              : 'bg-amber-600 text-white hover:bg-amber-500'
          }`}
        >
          {locked ? '🔒' : '🔓'}
        </button>
      </div>

      {error && (
        <div className="text-red-400 text-xs bg-red-900/20 border border-red-800 rounded px-2 py-1 mb-4">
          {error}
        </div>
      )}

      {/* Weapon Slots Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Right Hand */}
        <HandColumn
          label="Right Hand"
          slots={rightSlots}
          locked={locked}
          disabled={false}
          onSlotClick={(slot) => handleSlotClick('right', slot)}
        />

        {/* Left Hand */}
        <HandColumn
          label="Left Hand"
          slots={leftSlots}
          locked={locked}
          disabled={offHandLocked}
          disabledReason={offHandLocked ? 'Two-handed weapon equipped' : undefined}
          onSlotClick={(slot) => handleSlotClick('left', slot)}
        />
      </div>

      {/* Hint */}
      <p className="text-xs text-zinc-500 mt-4 text-center">
        {locked 
          ? 'Click a slot to set it as active • Unlock to change weapons'
          : 'Click a slot to equip a weapon'}
      </p>

      {/* Weapon Selector Modal */}
      {selectingSlot && (
        <WeaponSelectorModal
          weapons={weapons}
          equippedWeaponIds={weaponSlots.filter(s => s.weapon_id).map(s => s.weapon_id!)}
          currentWeaponId={
            weaponSlots.find(
              s => s.hand === selectingSlot.hand && s.slot_number === selectingSlot.slot
            )?.weapon_id ?? null
          }
          onSelect={handleEquipWeapon}
          onClose={() => setSelectingSlot(null)}
        />
      )}
    </div>
  )
}

// ============ Sub-components ============

interface HandColumnProps {
  label: string
  slots: CharacterWeaponSlot[]
  locked: boolean
  disabled: boolean
  disabledReason?: string
  onSlotClick: (slotNumber: WeaponSlotNumber) => void
}

function HandColumn({ label, slots, locked, disabled, disabledReason, onSlotClick }: HandColumnProps) {
  return (
    <div className={disabled ? 'opacity-50' : ''}>
      <div className="text-xs text-zinc-500 mb-2 text-center font-medium">{label}</div>
      {disabledReason && (
        <div className="text-[10px] text-amber-500 mb-2 text-center">{disabledReason}</div>
      )}
      <div className="space-y-2">
        {([1, 2, 3] as const).map(slotNum => {
          const slot = slots.find(s => s.slot_number === slotNum)
          return (
            <WeaponSlotButton
              key={slotNum}
              slot={slot}
              slotNumber={slotNum}
              locked={locked}
              disabled={disabled}
              onClick={() => !disabled && onSlotClick(slotNum)}
            />
          )
        })}
      </div>
    </div>
  )
}

interface WeaponSlotButtonProps {
  slot: CharacterWeaponSlot | undefined
  slotNumber: WeaponSlotNumber
  locked: boolean
  disabled: boolean
  onClick: () => void
}

function WeaponSlotButton({ slot, slotNumber, locked, disabled, onClick }: WeaponSlotButtonProps) {
  const weapon = slot?.weapon
  const isActive = slot?.is_active ?? false
  const isEmpty = !weapon

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full p-3 rounded-lg border-2 text-left transition-all
        ${isActive 
          ? 'border-amber-500 bg-amber-900/20' 
          : 'border-zinc-700 bg-zinc-900'
        }
        ${isEmpty ? 'border-dashed' : ''}
        ${!disabled && !locked ? 'hover:border-amber-400 hover:bg-zinc-800' : ''}
        ${!disabled && locked ? 'hover:bg-zinc-800 cursor-pointer' : ''}
        ${disabled ? 'cursor-not-allowed' : ''}
      `}
    >
      <div className="flex items-center gap-2">
        {/* Slot number indicator */}
        <span className={`
          text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center
          ${isActive ? 'bg-amber-500 text-black' : 'bg-zinc-700 text-zinc-400'}
        `}>
          {slotNumber}
        </span>

        {/* Weapon info */}
        <div className="flex-1 min-w-0">
          {weapon ? (
            <>
              <div className="text-sm font-medium truncate">
                {weapon.is_magical && <span className="text-purple-400">✨ </span>}
                {weapon.name}
              </div>
              <div className="text-xs text-zinc-500">
                {weapon.damage_dice} {weapon.damage_type}
                {weapon.is_two_handed && ' • Two-handed'}
              </div>
            </>
          ) : (
            <div className="text-sm text-zinc-500 italic">Empty</div>
          )}
        </div>

        {/* Active indicator */}
        {isActive && (
          <span className="text-amber-400 text-xs font-bold">●</span>
        )}
      </div>
    </button>
  )
}

// ============ Weapon Selector Modal ============

interface WeaponSelectorModalProps {
  weapons: CharacterWeapon[]
  equippedWeaponIds: string[]
  currentWeaponId: string | null
  onSelect: (weaponId: string | null) => void
  onClose: () => void
}

function WeaponSelectorModal({
  weapons,
  equippedWeaponIds,
  currentWeaponId,
  onSelect,
  onClose,
}: WeaponSelectorModalProps) {
  // Filter out weapons already equipped in other slots
  const availableWeapons = weapons.filter(
    w => w.id === currentWeaponId || !equippedWeaponIds.includes(w.id)
  )

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-800 rounded-lg border border-zinc-700 max-w-md w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-700">
          <h3 className="font-medium">Select Weapon</h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200"
          >
            ✕
          </button>
        </div>

        {/* Weapon List */}
        <div className="flex-1 overflow-y-auto p-2">
          {/* Empty option */}
          <button
            onClick={() => onSelect(null)}
            className={`
              w-full p-3 rounded-lg text-left mb-2 transition-colors
              ${currentWeaponId === null 
                ? 'bg-zinc-700 border border-zinc-600' 
                : 'bg-zinc-900 hover:bg-zinc-700 border border-transparent'
              }
            `}
          >
            <div className="text-sm text-zinc-400 italic">None (empty slot)</div>
          </button>

          {availableWeapons.length === 0 ? (
            <div className="text-center text-zinc-500 py-8">
              No weapons available
            </div>
          ) : (
            availableWeapons.map(weapon => (
              <button
                key={weapon.id}
                onClick={() => onSelect(weapon.id)}
                className={`
                  w-full p-3 rounded-lg text-left mb-2 transition-colors
                  ${currentWeaponId === weapon.id 
                    ? 'bg-amber-900/30 border border-amber-600' 
                    : 'bg-zinc-900 hover:bg-zinc-700 border border-transparent'
                  }
                `}
              >
                <div className="text-sm font-medium">
                  {weapon.is_magical && <span className="text-purple-400">✨ </span>}
                  {weapon.name}
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  {weapon.damage_dice} {weapon.damage_type}
                  {weapon.is_two_handed && ' • Two-handed'}
                  {weapon.material !== 'Steel' && ` • ${weapon.material}`}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-700">
          <button
            onClick={onClose}
            className="w-full py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ============ Exports ============

export type { WeaponSlotsProps }


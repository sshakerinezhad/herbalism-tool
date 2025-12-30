/**
 * WeaponSlots Component
 *
 * Diablo-style inline weapon equipment panel with 3 slots per hand.
 * Click a slot to expand the weapon selection list below.
 *
 * Features:
 * - 3 slots per hand (right/left)
 * - Inline weapon selection (no modal)
 * - Two-handed weapon support (locks off-hand)
 * - Diablo-style visual cards
 */

'use client'

import { useState } from 'react'
import type { CharacterWeaponSlot, CharacterWeapon, WeaponHand, WeaponSlotNumber } from '@/lib/types'
import { equipWeaponToSlot } from '@/lib/db/characters'

// ============ Types ============

interface WeaponSlotsProps {
  characterId: string
  weaponSlots: CharacterWeaponSlot[]
  weapons: CharacterWeapon[]
  onUpdate?: () => void
}

type SelectedSlot = { hand: WeaponHand; slot: WeaponSlotNumber } | null

// ============ Component ============

export function WeaponSlots({
  characterId,
  weaponSlots,
  weapons,
  onUpdate,
}: WeaponSlotsProps) {
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot>(null)
  const [error, setError] = useState<string | null>(null)

  // Organize slots by hand
  const rightSlots = weaponSlots
    .filter(s => s.hand === 'right')
    .sort((a, b) => a.slot_number - b.slot_number)
  const leftSlots = weaponSlots
    .filter(s => s.hand === 'left')
    .sort((a, b) => a.slot_number - b.slot_number)

  // Check if any right-hand slot has a two-handed weapon equipped
  const hasTwoHandedEquipped = rightSlots.some(s => s.weapon?.is_two_handed)

  function handleSlotClick(hand: WeaponHand, slotNumber: WeaponSlotNumber) {
    // Toggle selection: click same slot closes, click different slot opens
    if (selectedSlot?.hand === hand && selectedSlot?.slot === slotNumber) {
      setSelectedSlot(null)
    } else {
      setSelectedSlot({ hand, slot: slotNumber })
    }
    setError(null)
  }

  async function handleEquipWeapon(weaponId: string | null) {
    if (!selectedSlot) return

    const { error: err } = await equipWeaponToSlot(
      characterId,
      selectedSlot.hand,
      selectedSlot.slot,
      weaponId
    )

    if (err) {
      setError(err)
    } else {
      setError(null)
      setSelectedSlot(null)
      onUpdate?.()
    }
  }

  // Get weapons available for selection (not equipped elsewhere)
  const equippedWeaponIds = weaponSlots
    .filter(s => s.weapon_id)
    .map(s => s.weapon_id!)

  const currentSlotWeaponId = selectedSlot
    ? weaponSlots.find(
        s => s.hand === selectedSlot.hand && s.slot_number === selectedSlot.slot
      )?.weapon_id ?? null
    : null

  const availableWeapons = weapons.filter(
    w => w.id === currentSlotWeaponId || !equippedWeaponIds.includes(w.id)
  )

  return (
    <div className="bg-zinc-800 rounded-lg p-5 border border-zinc-700">
      {/* Header */}
      <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-4">
        Weapons
      </h2>

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
          hand="right"
          slots={rightSlots}
          selectedSlot={selectedSlot}
          disabled={false}
          onSlotClick={(slot) => handleSlotClick('right', slot)}
        />

        {/* Left Hand */}
        <HandColumn
          label="Left Hand"
          hand="left"
          slots={leftSlots}
          selectedSlot={selectedSlot}
          disabled={hasTwoHandedEquipped}
          disabledReason={hasTwoHandedEquipped ? 'Two-handed weapon equipped' : undefined}
          onSlotClick={(slot) => handleSlotClick('left', slot)}
        />
      </div>

      {/* Inline Weapon Selection Panel */}
      {selectedSlot && (
        <WeaponSelectionPanel
          hand={selectedSlot.hand}
          slotNumber={selectedSlot.slot}
          weapons={availableWeapons}
          currentWeaponId={currentSlotWeaponId}
          onSelect={handleEquipWeapon}
          onClose={() => setSelectedSlot(null)}
        />
      )}

      {/* Hint */}
      <p className="text-xs text-zinc-500 mt-4 text-center">
        Click a slot to change weapon
      </p>
    </div>
  )
}

// ============ Sub-components ============

interface HandColumnProps {
  label: string
  hand: WeaponHand
  slots: CharacterWeaponSlot[]
  selectedSlot: SelectedSlot
  disabled: boolean
  disabledReason?: string
  onSlotClick: (slotNumber: WeaponSlotNumber) => void
}

function HandColumn({
  label,
  hand,
  slots,
  selectedSlot,
  disabled,
  disabledReason,
  onSlotClick
}: HandColumnProps) {
  return (
    <div className={disabled ? 'opacity-40' : ''}>
      <div className="text-xs text-zinc-500 mb-2 text-center font-medium">{label}</div>
      {disabledReason && (
        <div className="text-[10px] text-amber-500 mb-2 text-center">{disabledReason}</div>
      )}
      <div className="space-y-2">
        {([1, 2, 3] as const).map(slotNum => {
          const slot = slots.find(s => s.slot_number === slotNum)
          const isSelected = selectedSlot?.hand === hand && selectedSlot?.slot === slotNum
          return (
            <WeaponSlotCard
              key={slotNum}
              slot={slot}
              slotNumber={slotNum}
              isSelected={isSelected}
              disabled={disabled}
              onClick={() => !disabled && onSlotClick(slotNum)}
            />
          )
        })}
      </div>
    </div>
  )
}

interface WeaponSlotCardProps {
  slot: CharacterWeaponSlot | undefined
  slotNumber: WeaponSlotNumber
  isSelected: boolean
  disabled: boolean
  onClick: () => void
}

function WeaponSlotCard({ slot, slotNumber, isSelected, disabled, onClick }: WeaponSlotCardProps) {
  const weapon = slot?.weapon
  const isEmpty = !weapon

  // Determine visual state styling
  let borderClass = 'border-zinc-700'
  let bgClass = 'bg-zinc-900'

  if (isSelected) {
    borderClass = 'border-cyan-500 ring-1 ring-cyan-500/50'
    bgClass = 'bg-cyan-900/20'
  } else if (!isEmpty) {
    borderClass = 'border-zinc-600'
    bgClass = 'bg-zinc-900'
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full p-3 rounded-lg text-left transition-all
        border-2 ${borderClass} ${bgClass}
        ${isEmpty ? 'border-dashed' : ''}
        ${!disabled ? 'hover:border-zinc-500 hover:bg-zinc-800 cursor-pointer' : 'cursor-not-allowed'}
      `}
    >
      <div className="flex items-center gap-3">
        {/* Slot number badge */}
        <span className={`
          text-xs font-bold w-6 h-6 rounded flex items-center justify-center shrink-0
          ${isSelected ? 'bg-cyan-500 text-black' : 'bg-zinc-700 text-zinc-400'}
        `}>
          {slotNumber}
        </span>

        {/* Weapon info */}
        {weapon ? (
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate flex items-center gap-1">
              <span className="text-zinc-400">⚔️</span>
              {weapon.is_magical && <span className="text-purple-400">✨</span>}
              <span>{weapon.name}</span>
            </div>
            <div className="text-xs text-zinc-500 mt-0.5">
              {weapon.damage_dice} {weapon.damage_type}
              {weapon.is_two_handed && (
                <span className="text-amber-500 ml-1">• 2H</span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 min-w-0">
            <div className="text-sm text-zinc-500 italic">Empty</div>
          </div>
        )}
      </div>
    </button>
  )
}

// ============ Weapon Selection Panel ============

interface WeaponSelectionPanelProps {
  hand: WeaponHand
  slotNumber: WeaponSlotNumber
  weapons: CharacterWeapon[]
  currentWeaponId: string | null
  onSelect: (weaponId: string | null) => void
  onClose: () => void
}

function WeaponSelectionPanel({
  hand,
  slotNumber,
  weapons,
  currentWeaponId,
  onSelect,
  onClose,
}: WeaponSelectionPanelProps) {
  const handLabel = hand === 'right' ? 'Right' : 'Left'

  return (
    <div
      className="mt-4 border border-zinc-600 rounded-lg overflow-hidden bg-zinc-900
                 animate-in slide-in-from-top-2 duration-200"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
        <span className="text-xs text-zinc-400 uppercase tracking-wide">
          {handLabel} Hand Slot {slotNumber}
        </span>
        <button
          onClick={onClose}
          className="text-zinc-500 hover:text-zinc-300 text-sm"
        >
          ✕
        </button>
      </div>

      {/* Weapon List */}
      <div className="max-h-48 overflow-y-auto p-2 space-y-1">
        {/* Clear slot option */}
        <WeaponOption
          label="None"
          sublabel="Clear this slot"
          isSelected={currentWeaponId === null}
          onClick={() => onSelect(null)}
        />

        {weapons.length === 0 ? (
          <div className="text-center text-zinc-500 py-4 text-sm">
            No weapons available
          </div>
        ) : (
          weapons.map(weapon => (
            <WeaponOption
              key={weapon.id}
              label={weapon.name}
              sublabel={`${weapon.damage_dice} ${weapon.damage_type}${weapon.is_two_handed ? ' • Two-handed' : ''}`}
              isMagical={weapon.is_magical}
              isTwoHanded={weapon.is_two_handed}
              isSelected={currentWeaponId === weapon.id}
              onClick={() => onSelect(weapon.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

interface WeaponOptionProps {
  label: string
  sublabel?: string
  isMagical?: boolean
  isTwoHanded?: boolean
  isSelected: boolean
  onClick: () => void
}

function WeaponOption({
  label,
  sublabel,
  isMagical,
  isTwoHanded,
  isSelected,
  onClick
}: WeaponOptionProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full px-3 py-2 rounded text-left transition-colors flex items-center gap-3
        ${isSelected
          ? 'bg-cyan-900/30 border border-cyan-600'
          : 'bg-zinc-800 border border-transparent hover:bg-zinc-700'
        }
      `}
    >
      {/* Radio indicator */}
      <span className={`
        w-3 h-3 rounded-full border-2 shrink-0
        ${isSelected
          ? 'border-cyan-500 bg-cyan-500'
          : 'border-zinc-500'
        }
      `} />

      {/* Weapon info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate flex items-center gap-1">
          {label !== 'None' && <span className="text-zinc-400">⚔️</span>}
          {isMagical && <span className="text-purple-400">✨</span>}
          <span className={label === 'None' ? 'text-zinc-400 italic' : ''}>{label}</span>
        </div>
        {sublabel && (
          <div className="text-xs text-zinc-500 truncate">{sublabel}</div>
        )}
      </div>

      {/* Currently equipped badge */}
      {isSelected && label !== 'None' && (
        <span className="text-[10px] text-cyan-400 bg-cyan-900/50 px-1.5 py-0.5 rounded shrink-0">
          Equipped
        </span>
      )}
    </button>
  )
}

// ============ Exports ============

export type { WeaponSlotsProps }

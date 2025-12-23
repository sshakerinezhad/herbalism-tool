'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import type { ArmorSlot, ArmorType } from '@/lib/types'

// ============ Types ============

export type CharacterArmorData = {
  id: string
  slot_id: number
  armor_type: ArmorType
  custom_name: string | null
  material: string | null
  is_magical: boolean
  slot: ArmorSlot
}

export type ArmorDiagramProps = {
  armor: CharacterArmorData[]
  armorSlots: ArmorSlot[]
  locked?: boolean
  onToggleLock: () => void
  onSetArmor: (slotId: number, armorType: ArmorType | null) => void
  totalAC: number
  armorLevel: 'none' | 'light' | 'medium' | 'heavy'
  strengthScore: number
}

// ============ Constants ============

const LEFT_KEYS = ['head', 'left_shoulder', 'chest', 'left_hand', 'left_knee', 'left_foot'] as const
const RIGHT_KEYS = ['neck', 'right_shoulder', 'groin', 'right_hand', 'right_knee', 'right_foot'] as const

const ARMOR_LEVEL_STYLES = {
  heavy: 'bg-zinc-600 text-zinc-100',
  medium: 'bg-blue-800 text-blue-200',
  light: 'bg-emerald-800 text-emerald-200',
  none: 'bg-zinc-700 text-zinc-400',
} as const

const STRENGTH_REQUIREMENTS = {
  light: 0,
  medium: 13,
  heavy: 15,
} as const

// ============ Main Component ============

export function ArmorDiagram({
  armor,
  armorSlots,
  locked = true,
  onToggleLock,
  onSetArmor,
  totalAC,
  armorLevel,
  strengthScore,
}: ArmorDiagramProps) {
  const [openSlot, setOpenSlot] = useState<number | null>(null)
  const [saving, setSaving] = useState<number | null>(null)

  const getSlot = useCallback(
    (key: string) => armorSlots.find(s => s.slot_key === key),
    [armorSlots]
  )

  const getPiece = useCallback(
    (slotId: number) => armor.find(a => a.slot_id === slotId),
    [armor]
  )

  const meetsStrengthReq = useCallback(
    (type: ArmorType): boolean => strengthScore >= STRENGTH_REQUIREMENTS[type],
    [strengthScore]
  )

  async function handleSelect(slotId: number, type: ArmorType | null) {
    setSaving(slotId)
    setOpenSlot(null)
    await onSetArmor(slotId, type)
    setSaving(null)
  }

  const closeDropdown = () => setOpenSlot(null)

  const renderSlotColumn = (keys: readonly string[]) =>
    keys.map(key => {
      const slot = getSlot(key)
      if (!slot) return null
      const piece = getPiece(slot.id)
      return (
        <SlotButton
          key={key}
          slot={slot}
          piece={piece}
          locked={locked}
          saving={saving === slot.id}
          isOpen={openSlot === slot.id}
          onToggle={() => setOpenSlot(openSlot === slot.id ? null : slot.id)}
          onSelect={(t) => handleSelect(slot.id, t)}
          meetsStrengthReq={meetsStrengthReq}
        />
      )
    })

  return (
    <div className="bg-zinc-800 w-fit rounded-lg border border-zinc-700">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-2 border-b border-zinc-700">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">
            Armor
          </span>
          <button
            onClick={onToggleLock}
            aria-label={locked ? 'Unlock armor editing' : 'Lock armor editing'}
            className={`text-xs px-2 py-0.5 rounded transition-colors ${
              locked ? 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600' : 'bg-amber-600 text-white hover:bg-amber-500'
            }`}
          >
            {locked ? '🔒' : '🔓'}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded ${ARMOR_LEVEL_STYLES[armorLevel]}`}>
            {armorLevel === 'none' ? 'None' : armorLevel.charAt(0).toUpperCase() + armorLevel.slice(1)}
          </span>
          <span className="text-sm font-bold text-sky-300">AC {totalAC}</span>
        </div>
      </div>

      {/* Body */}
      <div className="flex justify-center items-stretch gap-3 p-2">
        <div className="flex flex-col gap-1">{renderSlotColumn(LEFT_KEYS)}</div>

        <div className="relative w-28 flex-shrink-0">
          <Image
            src="/silhouette.png"
            alt="Character silhouette"
            fill
            className="object-contain opacity-50"
            priority
          />
        </div>

        <div className="flex flex-col gap-1">{renderSlotColumn(RIGHT_KEYS)}</div>
      </div>

      {/* Click-away backdrop */}
      {openSlot !== null && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={closeDropdown}
          aria-hidden="true"
        />
      )}
    </div>
  )
}

// ============ Slot Button ============

type SlotButtonProps = {
  slot: ArmorSlot
  piece: CharacterArmorData | undefined
  locked: boolean
  saving: boolean
  isOpen: boolean
  onToggle: () => void
  onSelect: (type: ArmorType | null) => void
  meetsStrengthReq: (type: ArmorType) => boolean
}

function SlotButton({
  slot,
  piece,
  locked,
  saving,
  isOpen,
  onToggle,
  onSelect,
  meetsStrengthReq,
}: SlotButtonProps) {
  const displayName = piece
    ? piece.custom_name || getDefaultPieceName(slot, piece.armor_type)
    : null

  const bgStyles = piece
    ? piece.armor_type === 'heavy'
      ? 'bg-zinc-700 border-zinc-500'
      : piece.armor_type === 'medium'
        ? 'bg-blue-900/70 border-blue-600'
        : 'bg-emerald-900/70 border-emerald-600'
    : 'bg-zinc-900 border-zinc-700 border-dashed'

  const isInteractive = !locked && !saving

  return (
    <div className="relative">
      <button
        onClick={() => isInteractive && onToggle()}
        disabled={saving}
        aria-expanded={isOpen}
        aria-label={`${slot.display_name}: ${displayName || 'Empty'}`}
        className={`w-28 h-12 px-2 rounded border text-left transition-all ${bgStyles} ${
          isInteractive ? 'hover:brightness-110 cursor-pointer' : 'cursor-default'
        } ${saving ? 'opacity-50' : ''}`}
      >
        <div className="text-[10px] uppercase text-zinc-400 font-medium truncate">
          {slot.display_name}
        </div>
        <div className="text-xs text-zinc-100 font-semibold truncate">
          {saving ? '...' : displayName || <span className="text-zinc-600">—</span>}
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full mt-1 left-0 w-40 bg-zinc-800 border border-zinc-600 rounded shadow-xl">
          <div className="p-1 space-y-0.5">
            <Option label="None" selected={!piece} onClick={() => onSelect(null)} />
            {slot.light_available && (
              <Option
                label={slot.light_piece_name || 'Light'}
                bonus={slot.light_bonus}
                selected={piece?.armor_type === 'light'}
                disabled={!meetsStrengthReq('light')}
                onClick={() => onSelect('light')}
              />
            )}
            {slot.medium_available && (
              <Option
                label={slot.medium_piece_name || 'Medium'}
                bonus={slot.medium_bonus}
                selected={piece?.armor_type === 'medium'}
                disabled={!meetsStrengthReq('medium')}
                requirement={!meetsStrengthReq('medium') ? 'STR 13' : undefined}
                onClick={() => onSelect('medium')}
              />
            )}
            {slot.heavy_available && (
              <Option
                label={slot.heavy_piece_name || 'Heavy'}
                bonus={slot.heavy_bonus}
                selected={piece?.armor_type === 'heavy'}
                disabled={!meetsStrengthReq('heavy')}
                requirement={!meetsStrengthReq('heavy') ? 'STR 15' : undefined}
                onClick={() => onSelect('heavy')}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ============ Option Button ============

type OptionProps = {
  label: string
  bonus?: number | null
  selected?: boolean
  disabled?: boolean
  requirement?: string
  onClick: () => void
}

function Option({ label, bonus, selected, disabled, requirement, onClick }: OptionProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left px-2 py-1 rounded text-sm transition-colors ${
        selected ? 'bg-zinc-600 text-white' : 'text-zinc-300 hover:bg-zinc-700'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      <span>{label}</span>
      {bonus != null && <span className="text-zinc-500 ml-1">+{bonus}</span>}
      {requirement && <span className="text-red-400 text-xs ml-1">({requirement})</span>}
    </button>
  )
}

// ============ Helpers ============

function getDefaultPieceName(slot: ArmorSlot, type: ArmorType): string | null {
  switch (type) {
    case 'light': return slot.light_piece_name
    case 'medium': return slot.medium_piece_name
    case 'heavy': return slot.heavy_piece_name
    default: return null
  }
}

export default ArmorDiagram

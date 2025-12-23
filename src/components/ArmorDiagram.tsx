'use client'

/**
 * ArmorDiagram - RPG-style equipment visualization
 * 
 * Displays a character silhouette with equipment slots positioned around it,
 * connected by lines. Fully responsive and interactive.
 * 
 * Architecture:
 * - SVG viewBox provides unified coordinate system (0-100 x 0-120)
 * - Silhouette rendered as SVG path
 * - Connection lines rendered as SVG with dots at endpoints
 * - Slot cards positioned using foreignObject for perfect alignment
 * - Everything scales together automatically
 */

import { useState } from 'react'
import type { ArmorSlot, ArmorType } from '@/lib/types'

// ============ Types ============

type CharacterArmorData = {
  id: string
  slot_id: number
  armor_type: ArmorType
  custom_name: string | null
  material: string | null
  is_magical: boolean
  slot: ArmorSlot
}

type SlotPosition = {
  // Card position (top-left corner)
  card: { x: number; y: number }
  // Body connection point
  body: { x: number; y: number }
  // Optional waypoint for angled lines
  waypoint?: { x: number; y: number }
}

// ============ Configuration ============

// All positions in viewBox units (0-100 width, 0-120 height)
const SLOT_POSITIONS: Record<string, SlotPosition> = {
  head: {
    card: { x: 38, y: 0 },
    body: { x: 50, y: 18 },
  },
  neck: {
    card: { x: 76, y: 8 },
    body: { x: 50, y: 24 },
    waypoint: { x: 66, y: 16 },
  },
  left_shoulder: {
    card: { x: 0, y: 18 },
    body: { x: 38, y: 30 },
    waypoint: { x: 22, y: 26 },
  },
  right_shoulder: {
    card: { x: 76, y: 28 },
    body: { x: 62, y: 30 },
    waypoint: { x: 78, y: 35 },
  },
  chest: {
    card: { x: 38, y: 38 },
    body: { x: 50, y: 42 },
  },
  left_hand: {
    card: { x: 0, y: 48 },
    body: { x: 34, y: 58 },
    waypoint: { x: 18, y: 55 },
  },
  right_hand: {
    card: { x: 76, y: 55 },
    body: { x: 66, y: 58 },
    waypoint: { x: 78, y: 62 },
  },
  groin: {
    card: { x: 0, y: 72 },
    body: { x: 50, y: 68 },
    waypoint: { x: 24, y: 72 },
  },
  left_knee: {
    card: { x: 0, y: 92 },
    body: { x: 44, y: 84 },
    waypoint: { x: 22, y: 92 },
  },
  right_knee: {
    card: { x: 76, y: 82 },
    body: { x: 56, y: 84 },
    waypoint: { x: 78, y: 88 },
  },
  left_foot: {
    card: { x: 22, y: 108 },
    body: { x: 44, y: 105 },
  },
  right_foot: {
    card: { x: 56, y: 108 },
    body: { x: 56, y: 105 },
  },
}

const CARD_WIDTH = 24
const CARD_HEIGHT = 16

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
}: {
  armor: CharacterArmorData[]
  armorSlots: ArmorSlot[]
  locked: boolean
  onToggleLock: () => void
  onSetArmor: (slotId: number, armorType: ArmorType | null) => void
  totalAC: number
  armorLevel: 'none' | 'light' | 'medium' | 'heavy'
  strengthScore: number
}) {
  const [savingSlot, setSavingSlot] = useState<number | null>(null)

  async function handleSetArmor(slotId: number, armorType: ArmorType | null) {
    if (locked) return
    setSavingSlot(slotId)
    await onSetArmor(slotId, armorType)
    setSavingSlot(null)
  }

  function meetsStrengthRequirement(type: ArmorType): boolean {
    if (type === 'light') return true
    if (type === 'medium') return strengthScore >= 13
    if (type === 'heavy') return strengthScore >= 15
    return true
  }

  return (
    <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">Armor</h2>
          <button
            onClick={onToggleLock}
            className={`p-1.5 rounded transition-colors ${
              locked 
                ? 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600' 
                : 'bg-amber-700/50 text-amber-300 hover:bg-amber-600/50'
            }`}
            title={locked ? 'Click to unlock and edit armor' : 'Click to lock armor'}
          >
            {locked ? '🔒' : '🔓'}
          </button>
          {!locked && (
            <span className="text-xs text-amber-400">Editing</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs px-2 py-1 rounded ${
            armorLevel === 'heavy' ? 'bg-zinc-600 text-zinc-200' :
            armorLevel === 'medium' ? 'bg-blue-900/50 text-blue-300' :
            armorLevel === 'light' ? 'bg-emerald-900/50 text-emerald-300' :
            'bg-zinc-700 text-zinc-400'
          }`}>
            {armorLevel === 'none' ? 'Unarmored' : `${armorLevel.charAt(0).toUpperCase() + armorLevel.slice(1)}`}
          </span>
          <div className="bg-blue-900/30 border border-blue-700 rounded px-3 py-1">
            <span className="text-blue-300 font-bold">AC {totalAC}</span>
          </div>
        </div>
      </div>

      {/* Diagram */}
      <div className="relative w-full max-w-lg mx-auto">
        <svg
          viewBox="0 0 100 120"
          className="w-full h-auto"
          style={{ maxHeight: '70vh' }}
        >
          {/* Background gradient */}
          <defs>
            <radialGradient id="bodyGlow" cx="50%" cy="40%" r="50%">
              <stop offset="0%" stopColor="rgba(100, 200, 255, 0.1)" />
              <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="1" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Subtle glow behind silhouette */}
          <ellipse cx="50" cy="55" rx="25" ry="45" fill="url(#bodyGlow)" />

          {/* Connection lines */}
          {armorSlots.map(slot => {
            const pos = SLOT_POSITIONS[slot.slot_key]
            if (!pos) return null

            const cardCenter = {
              x: pos.card.x + CARD_WIDTH / 2,
              y: pos.card.y + CARD_HEIGHT / 2,
            }

            // Build path: card -> waypoint (if exists) -> body
            let pathD: string
            if (pos.waypoint) {
              pathD = `M ${cardCenter.x} ${cardCenter.y} L ${pos.waypoint.x} ${pos.waypoint.y} L ${pos.body.x} ${pos.body.y}`
            } else {
              pathD = `M ${cardCenter.x} ${cardCenter.y} L ${pos.body.x} ${pos.body.y}`
            }

            const piece = armor.find(a => a.slot_id === slot.id)
            const lineColor = piece 
              ? piece.armor_type === 'heavy' ? '#71717a' 
                : piece.armor_type === 'medium' ? '#3b82f6' 
                : '#10b981'
              : '#3f3f46'

            return (
              <g key={slot.slot_key}>
                {/* Line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={lineColor}
                  strokeWidth="0.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={piece ? 0.8 : 0.4}
                />
                {/* Dot at body connection */}
                <circle
                  cx={pos.body.x}
                  cy={pos.body.y}
                  r="1.5"
                  fill={lineColor}
                  opacity={piece ? 1 : 0.5}
                />
                {/* Dot at waypoint if exists */}
                {pos.waypoint && (
                  <circle
                    cx={pos.waypoint.x}
                    cy={pos.waypoint.y}
                    r="0.8"
                    fill={lineColor}
                    opacity={piece ? 0.8 : 0.3}
                  />
                )}
              </g>
            )
          })}

          {/* Character Silhouette */}
          <g transform="translate(50, 60)" filter="url(#glow)">
            <Silhouette />
          </g>

          {/* Slot Cards (foreignObject for HTML) */}
          {armorSlots.map(slot => {
            const pos = SLOT_POSITIONS[slot.slot_key]
            if (!pos) return null

            const piece = armor.find(a => a.slot_id === slot.id)
            const isSaving = savingSlot === slot.id

            return (
              <foreignObject
                key={slot.slot_key}
                x={pos.card.x}
                y={pos.card.y}
                width={CARD_WIDTH}
                height={CARD_HEIGHT}
                className="overflow-visible"
              >
                <SlotCard
                  slot={slot}
                  piece={piece}
                  locked={locked}
                  saving={isSaving}
                  onSetArmor={(type) => handleSetArmor(slot.id, type)}
                  meetsStrengthRequirement={meetsStrengthRequirement}
                />
              </foreignObject>
            )
          })}
        </svg>
      </div>

      {/* Footer hint */}
      {!locked && (
        <p className="text-xs text-zinc-500 mt-3 text-center">
          Click slots to change armor • Changes save instantly
        </p>
      )}
    </div>
  )
}

// ============ Silhouette SVG ============

function Silhouette() {
  return (
    <g fill="none" stroke="#52525b" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round">
      {/* Head */}
      <ellipse cx="0" cy="-42" rx="6" ry="7" />
      
      {/* Neck */}
      <line x1="-2" y1="-35" x2="-2" y2="-32" />
      <line x1="2" y1="-35" x2="2" y2="-32" />
      
      {/* Shoulders */}
      <path d="M -2,-32 Q -8,-30 -14,-28" />
      <path d="M 2,-32 Q 8,-30 14,-28" />
      
      {/* Torso */}
      <path d="M -14,-28 L -12,-5 Q -10,8 -8,10" />
      <path d="M 14,-28 L 12,-5 Q 10,8 8,10" />
      
      {/* Arms */}
      <path d="M -14,-28 Q -18,-20 -20,-8 Q -22,2 -18,8" />
      <path d="M 14,-28 Q 18,-20 20,-8 Q 22,2 18,8" />
      
      {/* Hands */}
      <ellipse cx="-18" cy="10" rx="3" ry="4" />
      <ellipse cx="18" cy="10" rx="3" ry="4" />
      
      {/* Hips/Waist */}
      <path d="M -8,10 Q -10,14 -10,18" />
      <path d="M 8,10 Q 10,14 10,18" />
      
      {/* Legs */}
      <path d="M -10,18 L -8,38 Q -7,42 -7,48" />
      <path d="M 10,18 L 8,38 Q 7,42 7,48" />
      
      {/* Inner leg line */}
      <line x1="-4" y1="18" x2="-5" y2="48" />
      <line x1="4" y1="18" x2="5" y2="48" />
      
      {/* Feet */}
      <ellipse cx="-6" cy="50" rx="4" ry="2" />
      <ellipse cx="6" cy="50" rx="4" ry="2" />
      
      {/* Center line (subtle) */}
      <line x1="0" y1="-32" x2="0" y2="10" stroke="#3f3f46" strokeWidth="0.3" strokeDasharray="2,2" />
    </g>
  )
}

// ============ Slot Card Component ============

function SlotCard({
  slot,
  piece,
  locked,
  saving,
  onSetArmor,
  meetsStrengthRequirement,
}: {
  slot: ArmorSlot
  piece: CharacterArmorData | undefined
  locked: boolean
  saving: boolean
  onSetArmor: (type: ArmorType | null) => void
  meetsStrengthRequirement: (type: ArmorType) => boolean
}) {
  const [isOpen, setIsOpen] = useState(false)

  const pieceName = piece ? (
    piece.custom_name || (
      piece.armor_type === 'light' ? slot.light_piece_name :
      piece.armor_type === 'medium' ? slot.medium_piece_name :
      slot.heavy_piece_name
    ) || piece.armor_type
  ) : null

  const bgColor = piece 
    ? piece.armor_type === 'heavy' ? 'bg-zinc-700/90' 
      : piece.armor_type === 'medium' ? 'bg-blue-900/80' 
      : 'bg-emerald-900/80'
    : 'bg-zinc-900/80'

  const borderColor = piece
    ? piece.armor_type === 'heavy' ? 'border-zinc-500' 
      : piece.armor_type === 'medium' ? 'border-blue-600' 
      : 'border-emerald-600'
    : 'border-zinc-600 border-dashed'

  const glowClass = piece?.is_magical ? 'ring-1 ring-purple-400/60' : ''

  // Compact display for SVG foreignObject
  // Using very small text that scales with the diagram
  
  if (locked) {
    return (
      <div 
        className={`w-full h-full ${bgColor} ${borderColor} ${glowClass} border rounded flex flex-col items-center justify-center p-0.5 transition-all`}
        style={{ fontSize: '2.5px', lineHeight: 1.2 }}
      >
        <div className="text-zinc-400 font-medium truncate w-full text-center">
          {slot.display_name}
        </div>
        {piece ? (
          <div className="text-zinc-100 font-semibold truncate w-full text-center flex items-center justify-center gap-0.5">
            {piece.is_magical && <span className="text-purple-400">✦</span>}
            <span className="truncate">{pieceName}</span>
          </div>
        ) : (
          <div className="text-zinc-600">—</div>
        )}
      </div>
    )
  }

  // Editable mode
  return (
    <div className="relative w-full h-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={saving}
        className={`w-full h-full ${bgColor} ${borderColor} ${glowClass} border rounded flex flex-col items-center justify-center p-0.5 transition-all hover:brightness-110 disabled:opacity-50`}
        style={{ fontSize: '2.5px', lineHeight: 1.2 }}
      >
        <div className="text-zinc-400 font-medium truncate w-full text-center">
          {slot.display_name}
        </div>
        {saving ? (
          <div className="text-amber-400">...</div>
        ) : piece ? (
          <div className="text-zinc-100 font-semibold truncate w-full text-center">
            {pieceName}
          </div>
        ) : (
          <div className="text-amber-400/80">+ Add</div>
        )}
      </button>

      {/* Dropdown - positioned outside SVG coordinate system */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div 
            className="absolute z-50 left-1/2 top-full mt-1 -translate-x-1/2 bg-zinc-800 border border-zinc-600 rounded-lg shadow-xl p-2 min-w-[140px]"
            style={{ fontSize: '12px' }}
          >
            <div className="text-zinc-400 text-xs font-medium mb-2 px-1">
              {slot.display_name}
            </div>
            
            <button
              onClick={() => { onSetArmor(null); setIsOpen(false) }}
              className={`w-full text-left px-2 py-1.5 rounded text-sm hover:bg-zinc-700 ${!piece ? 'text-zinc-500' : 'text-zinc-300'}`}
            >
              None
            </button>

            {slot.light_available && (
              <button
                onClick={() => { onSetArmor('light'); setIsOpen(false) }}
                disabled={!meetsStrengthRequirement('light')}
                className={`w-full text-left px-2 py-1.5 rounded text-sm hover:bg-emerald-900/50 disabled:opacity-40 disabled:cursor-not-allowed ${piece?.armor_type === 'light' ? 'bg-emerald-900/50 text-emerald-300' : 'text-zinc-300'}`}
              >
                {slot.light_piece_name || 'Light'} 
                <span className="text-zinc-500 ml-1">+{slot.light_bonus}</span>
              </button>
            )}

            {slot.medium_available && (
              <button
                onClick={() => { onSetArmor('medium'); setIsOpen(false) }}
                disabled={!meetsStrengthRequirement('medium')}
                className={`w-full text-left px-2 py-1.5 rounded text-sm hover:bg-blue-900/50 disabled:opacity-40 disabled:cursor-not-allowed ${piece?.armor_type === 'medium' ? 'bg-blue-900/50 text-blue-300' : 'text-zinc-300'}`}
              >
                {slot.medium_piece_name || 'Medium'} 
                <span className="text-zinc-500 ml-1">+{slot.medium_bonus}</span>
                {!meetsStrengthRequirement('medium') && (
                  <span className="text-red-400 ml-1">(STR 13)</span>
                )}
              </button>
            )}

            {slot.heavy_available && (
              <button
                onClick={() => { onSetArmor('heavy'); setIsOpen(false) }}
                disabled={!meetsStrengthRequirement('heavy')}
                className={`w-full text-left px-2 py-1.5 rounded text-sm hover:bg-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed ${piece?.armor_type === 'heavy' ? 'bg-zinc-600 text-zinc-200' : 'text-zinc-300'}`}
              >
                {slot.heavy_piece_name || 'Heavy'} 
                <span className="text-zinc-500 ml-1">+{slot.heavy_bonus}</span>
                {!meetsStrengthRequirement('heavy') && (
                  <span className="text-red-400 ml-1">(STR 15)</span>
                )}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default ArmorDiagram


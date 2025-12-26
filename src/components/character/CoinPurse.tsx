/**
 * CoinPurse Component
 * 
 * Reusable coin management with increment/decrement controls.
 * Features:
 * - Lock toggle (locked by default, matching ArmorDiagram pattern)
 * - Configurable increments (1, 10, 100)
 * - Optimistic updates with error rollback
 * - Metallic gradient styling per coin type
 * 
 * @example
 * <CoinPurse
 *   characterId={character.id}
 *   coins={{ platinum: 0, gold: 12, silver: 18, copper: 24 }}
 *   onUpdate={() => invalidateCharacter(userId)}
 * />
 */

'use client'

import { useState } from 'react'
import { updateCharacterMoney } from '@/lib/db/characters'

// ============ Types ============

type CoinType = 'platinum' | 'gold' | 'silver' | 'copper'

type Coins = Record<CoinType, number>

interface CoinPurseProps {
  /** Character ID for database updates */
  characterId: string
  /** Current coin values */
  coins: Coins
  /** Callback after successful update (e.g., to invalidate cache) */
  onUpdate?: () => void
  /** Whether controls are disabled */
  disabled?: boolean
}

// ============ Configuration ============

/** 
 * Coin type display configuration with metallic effects
 * Uses gradient banding technique to simulate light reflecting off polished metal
 * 
 * Adjust BOX_OPACITY to control background transparency (text stays fully opaque)
 */
const BOX_OPACITY = 'opacity-75' // opacity-25, opacity-50, opacity-75, opacity-100

const COIN_CONFIG: Array<{ 
  type: CoinType
  label: string
  gradient: string
  textColor: string
  glow: string
}> = [
  { 
    type: 'platinum', 
    label: 'PP',
    // Brilliant platinum: white-silver with blue undertones
    gradient: 'bg-gradient-to-b from-[#e8e8f0] via-[#ffffff] via-30% via-[#b8b8c8] via-60% to-[#d0d0e0]',
    textColor: 'text-slate-800',
    glow: 'shadow-[0_0_12px_rgba(200,200,255,0.4)]',
  },
  { 
    type: 'gold', 
    label: 'GP',
    // Rich gold with warm highlights
    gradient: 'bg-gradient-to-b from-[#f0c850] via-[#ffe878] via-30% via-[#c8942c] via-60% to-[#daa520]',
    textColor: 'text-amber-950',
    glow: 'shadow-[0_0_12px_rgba(255,200,50,0.35)]',
  },
  { 
    type: 'silver', 
    label: 'SP',
    // Duller silver, less brilliant than platinum
    gradient: 'bg-gradient-to-b from-[#b8b8b8] via-[#d8d8d8] via-30% via-[#909090] via-60% to-[#a8a8a8]',
    textColor: 'text-zinc-800',
    glow: 'shadow-[0_0_8px_rgba(180,180,180,0.25)]',
  },
  { 
    type: 'copper', 
    label: 'CP',
    // Warm copper with tarnished depth
    gradient: 'bg-gradient-to-b from-[#cd7f32] via-[#daa06d] via-30% via-[#8b4513] via-60% to-[#b87333]',
    textColor: 'text-orange-950',
    glow: 'shadow-[0_0_8px_rgba(180,100,50,0.3)]',
  },
]

const INCREMENTS = [1, 10, 100] as const

// ============ Component ============

export function CoinPurse({ 
  characterId, 
  coins: initialCoins, 
  onUpdate,
  disabled = false,
}: CoinPurseProps) {
  const [coins, setCoins] = useState<Coins>(initialCoins)
  const [error, setError] = useState<string | null>(null)
  const [locked, setLocked] = useState(true)

  /**
   * Handle increment/decrement with optimistic update pattern:
   * 1. Update UI immediately
   * 2. Persist to DB in background  
   * 3. Revert on error
   */
  async function handleChange(coinType: CoinType, delta: number) {
    if (disabled) return

    const previousValue = coins[coinType]
    const newValue = Math.max(0, previousValue + delta)
    if (newValue === previousValue) return

    // Optimistic update
    setCoins(prev => ({ ...prev, [coinType]: newValue }))
    setError(null)

    // Persist to database
    const { error: err } = await updateCharacterMoney(characterId, { [coinType]: newValue })

    if (err) {
      // Revert on error
      setCoins(prev => ({ ...prev, [coinType]: previousValue }))
      setError(err)
    } else {
      onUpdate?.()
    }
  }

  const isDisabled = disabled || locked

  return (
    <div className="space-y-3">
      {/* Header with lock toggle */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500 uppercase tracking-wide">Money</span>
        <button
          onClick={() => setLocked(!locked)}
          aria-label={locked ? 'Unlock money editing' : 'Lock money editing'}
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
        <div className="text-red-400 text-xs bg-red-900/20 border border-red-800 rounded px-2 py-1">
          {error}
        </div>
      )}

      <div className="grid grid-cols-4 gap-3">
        {COIN_CONFIG.map(({ type, label, gradient, textColor, glow }) => (
          <CoinCell
            key={type}
            label={label}
            value={coins[type]}
            gradient={gradient}
            textColor={textColor}
            glow={glow}
            disabled={isDisabled}
            onChange={(delta) => handleChange(type, delta)}
          />
        ))}
      </div>
    </div>
  )
}

// ============ Sub-components ============

interface CoinCellProps {
  label: string
  value: number
  gradient: string
  textColor: string
  glow: string
  disabled: boolean
  onChange: (delta: number) => void
}

function CoinCell({ label, value, gradient, textColor, glow, disabled, onChange }: CoinCellProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      {/* Metallic coin display - layered so opacity only affects background */}
      <div className={`relative w-full rounded-lg ${glow}`}>
        {/* Background layer with opacity */}
        <div className={`absolute inset-0 rounded-lg ${gradient} ${BOX_OPACITY}`} />
        {/* Content layer - fully opaque */}
        <div className="relative px-2 py-1.5">
          <div className={`text-xl font-bold tabular-nums text-center ${textColor}`}>{value}</div>
          <div className={`text-[10px] text-center font-semibold opacity-70 ${textColor}`}>{label}</div>
        </div>
      </div>
      
      {/* Button columns with triangle indicators */}
      <div className="flex gap-1 w-full">
        {/* Decrement column */}
        <div className="flex-1 flex flex-col gap-1">
          <div className="text-red-500 text-[10px] text-center">▼</div>
          {INCREMENTS.map(n => (
            <Btn key={-n} label={String(n)} onClick={() => onChange(-n)} disabled={disabled || value < n} negative />
          ))}
        </div>
        
        {/* Increment column */}
        <div className="flex-1 flex flex-col gap-1">
          <div className="text-emerald-500 text-[10px] text-center">▲</div>
          {INCREMENTS.map(n => (
            <Btn key={n} label={String(n)} onClick={() => onChange(n)} disabled={disabled} />
          ))}
        </div>
      </div>
    </div>
  )
}

interface BtnProps {
  label: string
  onClick: () => void
  disabled: boolean
  negative?: boolean
}

function Btn({ label, onClick, disabled, negative }: BtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`${negative ? 'Subtract' : 'Add'} ${label}`}
      className={`
        h-7 w-full rounded text-xs font-medium select-none
        transition-all duration-75 active:scale-95
        ${negative 
          ? 'bg-red-900/60 hover:bg-red-800 text-red-200' 
          : 'bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200'
        }
        ${disabled ? 'opacity-30 cursor-not-allowed' : ''}
      `}
    >
      {label}
    </button>
  )
}

// ============ Exports ============

export type { CoinType, Coins, CoinPurseProps }


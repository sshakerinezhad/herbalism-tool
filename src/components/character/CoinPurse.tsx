/**
 * CoinPurse Component
 *
 * Compact coin pills with inline expanding edit tray.
 * Features:
 * - Horizontal row of metallic coin pills (value + label)
 * - Click a pill → edit tray slides open below with ±1/±10/±100 controls
 * - Click outside to dismiss
 * - Optimistic updates with error rollback
 * - No popover/portal — everything stays within DOM flow
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { updateCharacterMoney } from '@/lib/db/characters'

// ============ Types ============

type CoinType = 'platinum' | 'gold' | 'silver' | 'copper'

type Coins = Record<CoinType, number>

interface CoinPurseProps {
  characterId: string
  coins: Coins
  onUpdate?: () => void
  disabled?: boolean
}

// ============ Configuration ============

const COIN_CONFIG: Array<{
  type: CoinType
  label: string
  name: string
  gradient: string
  textColor: string
  glow: string
  pillBorder: string
  activeRing: string
}> = [
  {
    type: 'platinum',
    label: 'PP',
    name: 'Platinum',
    gradient: 'bg-gradient-to-b from-[#e8e8f0] via-[#ffffff] via-30% via-[#b8b8c8] via-60% to-[#d0d0e0]',
    textColor: 'text-slate-800',
    glow: 'shadow-[0_0_8px_rgba(200,200,255,0.3)]',
    pillBorder: 'border-slate-400/40',
    activeRing: 'ring-slate-300/60',
  },
  {
    type: 'gold',
    label: 'GP',
    name: 'Gold',
    gradient: 'bg-gradient-to-b from-[#f0c850] via-[#ffe878] via-30% via-[#c8942c] via-60% to-[#daa520]',
    textColor: 'text-amber-950',
    glow: 'shadow-[0_0_8px_rgba(255,200,50,0.25)]',
    pillBorder: 'border-amber-600/40',
    activeRing: 'ring-amber-400/50',
  },
  {
    type: 'silver',
    label: 'SP',
    name: 'Silver',
    gradient: 'bg-gradient-to-b from-[#b8b8b8] via-[#d8d8d8] via-30% via-[#909090] via-60% to-[#a8a8a8]',
    textColor: 'text-zinc-800',
    glow: 'shadow-[0_0_6px_rgba(180,180,180,0.2)]',
    pillBorder: 'border-zinc-400/40',
    activeRing: 'ring-zinc-300/50',
  },
  {
    type: 'copper',
    label: 'CP',
    name: 'Copper',
    gradient: 'bg-gradient-to-b from-[#cd7f32] via-[#daa06d] via-30% via-[#8b4513] via-60% to-[#b87333]',
    textColor: 'text-orange-950',
    glow: 'shadow-[0_0_6px_rgba(180,100,50,0.25)]',
    pillBorder: 'border-orange-700/40',
    activeRing: 'ring-orange-400/40',
  },
]

const INCREMENTS = [100, 10, 1] as const

// ============ Component ============

export function CoinPurse({
  characterId,
  coins: propCoins,
  onUpdate,
  disabled = false,
}: CoinPurseProps) {
  const [coins, setCoins] = useState<Coins>(propCoins)
  const [error, setError] = useState<string | null>(null)
  const [pendingCoin, setPendingCoin] = useState<CoinType | null>(null)
  const [openCoin, setOpenCoin] = useState<CoinType | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Sync local state with prop changes
  // Skip sync if a mutation is in-flight
  useEffect(() => {
    if (pendingCoin) return
    setCoins(propCoins)
  }, [propCoins.platinum, propCoins.gold, propCoins.silver, propCoins.copper, pendingCoin])

  // Close tray on click outside
  useEffect(() => {
    if (!openCoin) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenCoin(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [openCoin])

  async function handleChange(coinType: CoinType, delta: number) {
    if (disabled || pendingCoin) return

    const previousValue = coins[coinType]
    const newValue = Math.max(0, previousValue + delta)
    if (newValue === previousValue) return

    setPendingCoin(coinType)
    setCoins(prev => ({ ...prev, [coinType]: newValue }))
    setError(null)

    const { error: err } = await updateCharacterMoney(characterId, { [coinType]: newValue })

    if (err) {
      setCoins(prev => ({ ...prev, [coinType]: previousValue }))
      setError(err)
    } else {
      onUpdate?.()
    }

    setPendingCoin(null)
  }

  // Resolve active config — fallback to gold when collapsed (hidden anyway)
  const activeConfig = openCoin
    ? COIN_CONFIG.find(c => c.type === openCoin)!
    : COIN_CONFIG[1]

  return (
    <div ref={containerRef}>
      {error && (
        <div className="text-red-400 text-xs bg-red-900/20 border border-red-800 rounded px-2 py-1 mb-1">
          {error}
        </div>
      )}

      {/* Pill row */}
      <div className="flex gap-1.5 flex-wrap">
        {COIN_CONFIG.map((config) => {
          const isActive = openCoin === config.type
          const isPending = pendingCoin === config.type

          return (
            <button
              key={config.type}
              type="button"
              onClick={() => setOpenCoin(isActive ? null : config.type)}
              className={`
                relative rounded-md border transition-all duration-150 select-none
                ${config.glow} ${config.pillBorder}
                ${isActive ? `ring-1 ${config.activeRing} scale-105` : 'hover:scale-105'}
                ${isPending ? 'opacity-60' : ''}
              `}
            >
              <div className={`absolute inset-0 rounded-md ${config.gradient} opacity-80`} />
              <div className="relative flex items-center gap-1 px-2 py-0.5">
                <span className={`text-sm font-bold tabular-nums ${config.textColor}`}>
                  {coins[config.type]}
                </span>
                <span className={`text-[10px] font-semibold opacity-60 ${config.textColor}`}>
                  {config.label}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Inline edit tray — CSS Grid height animation (0fr → 1fr) */}
      <div
        className={`
          grid transition-[grid-template-rows] duration-200 ease-out
          ${openCoin ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}
        `}
      >
        <div className="overflow-hidden">
          <div className="pt-1.5">
            <div className="bg-grimoire-950/80 rounded-md border border-sepia-700/30 px-2 py-1.5">
              <div className="flex items-center justify-center gap-1">
                {/* Decrement: -100, -10, -1 */}
                {INCREMENTS.map(n => (
                  <StepBtn
                    key={-n}
                    label={`-${n}`}
                    onClick={() => handleChange(activeConfig.type, -n)}
                    disabled={disabled || !!pendingCoin || coins[activeConfig.type] < n}
                    negative
                  />
                ))}

                {/* Value display */}
                <div className="px-2 min-w-[56px] text-center">
                  <span className="text-base font-bold text-vellum-100 tabular-nums">
                    {coins[activeConfig.type]}
                  </span>
                  <span className="text-[10px] text-vellum-400 ml-1 font-medium">
                    {activeConfig.label}
                  </span>
                </div>

                {/* Increment: +1, +10, +100 */}
                {[...INCREMENTS].reverse().map(n => (
                  <StepBtn
                    key={n}
                    label={`+${n}`}
                    onClick={() => handleChange(activeConfig.type, n)}
                    disabled={disabled || !!pendingCoin}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============ Sub-components ============

interface StepBtnProps {
  label: string
  onClick: () => void
  disabled: boolean
  negative?: boolean
}

function StepBtn({ label, onClick, disabled, negative }: StepBtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        h-7 min-w-[2.25rem] px-1.5 rounded text-xs font-medium select-none
        transition-all duration-75 active:scale-95
        ${negative
          ? 'bg-red-900/50 hover:bg-red-800/70 text-red-200'
          : 'bg-emerald-900/50 hover:bg-emerald-800/70 text-emerald-200'
        }
        ${disabled ? 'opacity-25 cursor-not-allowed' : ''}
      `}
    >
      {label}
    </button>
  )
}

// ============ Exports ============

export type { CoinType, Coins, CoinPurseProps }

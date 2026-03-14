/**
 * CoinPurse Component
 *
 * Portal-based coin popover with save-on-close architecture.
 * Click a pill -> popover drops below with value input + stepper grid.
 * All edits are local -- one Supabase write fires on close.
 * Portal escapes CharacterBanner's overflow-hidden.
 */

'use client'

import { useState, useRef, useEffect, Fragment } from 'react'
import { createPortal } from 'react-dom'
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

const COIN_CONFIG = [
  {
    type: 'platinum' as CoinType,
    label: 'PP',
    name: 'Platinum',
    gradient: 'bg-gradient-to-b from-[#e8e8f0] via-[#ffffff] via-30% via-[#b8b8c8] via-60% to-[#d0d0e0]',
    textColor: 'text-slate-800',
    valueColor: 'text-[#e8e8f0]',
    glow: 'shadow-[0_0_8px_rgba(200,200,255,0.3)]',
    pillBorder: 'border-slate-400/40',
    activeRing: 'ring-slate-300/60',
  },
  {
    type: 'gold' as CoinType,
    label: 'GP',
    name: 'Gold',
    gradient: 'bg-gradient-to-b from-[#f0c850] via-[#ffe878] via-30% via-[#c8942c] via-60% to-[#daa520]',
    textColor: 'text-amber-950',
    valueColor: 'text-[#f0c850]',
    glow: 'shadow-[0_0_8px_rgba(255,200,50,0.25)]',
    pillBorder: 'border-amber-600/40',
    activeRing: 'ring-amber-400/50',
  },
  {
    type: 'silver' as CoinType,
    label: 'SP',
    name: 'Silver',
    gradient: 'bg-gradient-to-b from-[#b8b8b8] via-[#d8d8d8] via-30% via-[#909090] via-60% to-[#a8a8a8]',
    textColor: 'text-zinc-800',
    valueColor: 'text-[#c8c8c8]',
    glow: 'shadow-[0_0_6px_rgba(180,180,180,0.2)]',
    pillBorder: 'border-zinc-400/40',
    activeRing: 'ring-zinc-300/50',
  },
  {
    type: 'copper' as CoinType,
    label: 'CP',
    name: 'Copper',
    gradient: 'bg-gradient-to-b from-[#cd7f32] via-[#daa06d] via-30% via-[#8b4513] via-60% to-[#b87333]',
    textColor: 'text-orange-950',
    valueColor: 'text-[#cd7f32]',
    glow: 'shadow-[0_0_6px_rgba(180,100,50,0.25)]',
    pillBorder: 'border-orange-700/40',
    activeRing: 'ring-orange-400/40',
  },
]

const STEP_SIZES = [1, 10, 100] as const

// ============ Component ============

export function CoinPurse({
  characterId,
  coins,
  onUpdate,
  disabled = false,
}: CoinPurseProps) {
  const [openCoin, setOpenCoin] = useState<CoinType | null>(null)
  const [localCoins, setLocalCoins] = useState<Coins>(coins)
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null)
  const pillRefs = useRef<Record<CoinType, HTMLButtonElement | null>>({
    platinum: null, gold: null, silver: null, copper: null,
  })
  const snapshotRef = useRef<Coins>(coins)
  const localCoinsRef = useRef<Coins>(coins)

  // Keep ref in sync with state (for stale closure avoidance in saveCoin)
  localCoinsRef.current = localCoins

  // -- Save helper (fire-and-forget) --

  function saveCoin(coinType: CoinType) {
    const newValue = localCoinsRef.current[coinType]
    const oldValue = snapshotRef.current[coinType]
    if (newValue === oldValue) return
    updateCharacterMoney(characterId, { [coinType]: newValue })
      .then(({ error }) => { if (!error) onUpdate?.() })
  }

  // -- Open / close --

  function openPopover(type: CoinType) {
    if (disabled) return
    if (openCoin === type) {
      closePopover()
      return
    }
    // Save previous coin if switching directly between pills
    if (openCoin) saveCoin(openCoin)

    const el = pillRefs.current[type]
    if (!el) return
    const rect = el.getBoundingClientRect()
    setPopoverPos({
      top: rect.bottom + 8,
      left: Math.min(rect.left, window.innerWidth - 236), // 220px + 16px margin
    })
    snapshotRef.current = { ...coins }
    const snapshot = { ...coins }
    setLocalCoins(snapshot)
    localCoinsRef.current = snapshot
    setOpenCoin(type)
  }

  function closePopover() {
    if (!openCoin) return
    saveCoin(openCoin)
    setOpenCoin(null)
    setPopoverPos(null)
  }

  // Stable ref for closePopover (escape handler reads this to avoid stale closure)
  const closeRef = useRef(closePopover)
  closeRef.current = closePopover

  // -- Keyboard: Escape to close --

  useEffect(() => {
    if (!openCoin) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeRef.current()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [openCoin])

  // -- Stepper / direct input --

  function step(delta: number) {
    if (!openCoin) return
    setLocalCoins(prev => {
      const next = { ...prev, [openCoin]: Math.max(0, prev[openCoin] + delta) }
      localCoinsRef.current = next
      return next
    })
  }

  function setDirectValue(value: number) {
    if (!openCoin) return
    const clamped = Math.max(0, isNaN(value) ? 0 : value)
    setLocalCoins(prev => {
      const next = { ...prev, [openCoin]: clamped }
      localCoinsRef.current = next
      return next
    })
  }

  // Show local value for the coin being edited, prop value for others
  function displayValue(type: CoinType) {
    return openCoin === type ? localCoins[type] : coins[type]
  }

  const activeConfig = openCoin
    ? COIN_CONFIG.find(c => c.type === openCoin)!
    : null

  return (
    <>
      {/* Pill row */}
      <div className="flex gap-1.5 flex-wrap">
        {COIN_CONFIG.map(config => {
          const isActive = openCoin === config.type
          return (
            <button
              key={config.type}
              ref={el => { pillRefs.current[config.type] = el }}
              type="button"
              onClick={() => openPopover(config.type)}
              disabled={disabled}
              className={`
                relative rounded-md border transition-all duration-150 select-none
                ${config.glow} ${config.pillBorder}
                ${isActive ? `ring-1 ${config.activeRing} scale-105` : 'hover:scale-105'}
              `}
            >
              <div className={`absolute inset-0 rounded-md ${config.gradient} opacity-80`} />
              <div className="relative flex items-center gap-1 px-2 py-0.5">
                <span className={`text-sm font-bold tabular-nums ${config.textColor}`}>
                  {displayValue(config.type)}
                </span>
                <span className={`text-[10px] font-semibold opacity-60 ${config.textColor}`}>
                  {config.label}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Popover via portal */}
      {openCoin && activeConfig && popoverPos && createPortal(
        <div className="fixed inset-0 z-50" onClick={closePopover}>
          {/* Light backdrop */}
          <div className="absolute inset-0 bg-[rgba(5,4,3,0.4)]" />

          {/* Popover body */}
          <div
            className="absolute w-[220px] elevation-floating top-edge-highlight rounded-lg p-3.5 overflow-hidden animate-modal-in"
            style={{ top: popoverPos.top, left: popoverPos.left }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header: coin name + value input */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-vellum-300">
                {activeConfig.name}
              </span>
              <input
                type="number"
                value={localCoins[openCoin]}
                onChange={e => setDirectValue(e.target.valueAsNumber)}
                className={`
                  w-20 min-w-0 bg-transparent text-right font-heading text-2xl tabular-nums
                  ${activeConfig.valueColor} border-none outline-none
                  [appearance:textfield]
                  [&::-webkit-outer-spin-button]:appearance-none
                  [&::-webkit-inner-spin-button]:appearance-none
                `}
                min={0}
                autoFocus
              />
            </div>

            {/* Stepper grid */}
            <div className="grid grid-cols-2 gap-1.5">
              {STEP_SIZES.map(n => (
                <Fragment key={n}>
                  <button
                    type="button"
                    onClick={() => step(-n)}
                    disabled={localCoins[openCoin] < n}
                    className="h-8 rounded text-sm font-medium select-none
                      bg-red-900/40 hover:bg-red-800/60 text-red-200
                      active:scale-[0.94] transition-all duration-75
                      disabled:opacity-25 disabled:cursor-not-allowed"
                  >
                    {'\u2212'}{n}
                  </button>
                  <button
                    type="button"
                    onClick={() => step(n)}
                    className="h-8 rounded text-sm font-medium select-none
                      bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-200
                      active:scale-[0.94] transition-all duration-75"
                  >
                    +{n}
                  </button>
                </Fragment>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

// ============ Exports ============

export type { CoinType, Coins, CoinPurseProps }

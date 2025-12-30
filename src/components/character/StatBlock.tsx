'use client'

import { getAbilityModifier, ABILITY_NAMES } from '@/lib/constants'
import type { AbilityStat } from '@/lib/types'

type StatBlockProps = {
  stat: AbilityStat
  value: number
  variant?: 'default' | 'honor' | 'compact' | 'banner'
  className?: string
}

/**
 * StatBlock - Medallion-style ability score display
 *
 * Shows ability name, score, and modifier in a decorative container.
 * Honor stat gets special gold/bronze treatment.
 */
export function StatBlock({
  stat,
  value,
  variant = 'default',
  className = '',
}: StatBlockProps) {
  const modifier = getAbilityModifier(value)
  const modifierText = modifier >= 0 ? `+${modifier}` : `${modifier}`
  const statName = ABILITY_NAMES[stat] ?? stat.toUpperCase()

  const isHonor = stat === 'hon' || variant === 'honor'

  // Modifier color
  let modifierClass = 'text-vellum-300'
  if (modifier > 0) modifierClass = 'text-emerald-400'
  if (modifier < 0) modifierClass = 'text-red-400'

  if (variant === 'compact') {
    return (
      <div className={`text-center ${className}`}>
        <div className="text-[10px] uppercase tracking-wide text-vellum-400">{stat}</div>
        <div className="text-sm font-bold text-vellum-100">{value}</div>
        <div className={`text-xs ${modifierClass}`}>{modifierText}</div>
      </div>
    )
  }

  if (variant === 'banner') {
    return (
      <div className={`text-center min-w-[32px] ${className}`}>
        <div className={`text-[11px] uppercase tracking-wide font-medium ${isHonor ? 'text-amber-400' : 'text-vellum-400'}`}>
          {stat}
        </div>
        <div className={`text-base font-bold leading-tight ${isHonor ? 'text-amber-200' : 'text-vellum-100'}`}>
          {value}
        </div>
        <div className={`text-xs font-medium ${modifierClass}`}>{modifierText}</div>
      </div>
    )
  }

  return (
    <div
      className={`
        relative flex flex-col items-center justify-center
        w-14 h-16 sm:w-16 sm:h-18
        rounded
        ${isHonor
          ? 'bg-gradient-to-b from-amber-900/40 to-grimoire-900 border border-amber-700/50'
          : 'bg-gradient-to-b from-grimoire-800 to-grimoire-900 border border-sepia-700/50'
        }
        shadow-[inset_0_1px_0_rgba(255,255,255,0.05),inset_0_-1px_2px_rgba(0,0,0,0.2)]
        ${className}
      `}
    >
      {/* Stat abbreviation */}
      <span
        className={`
          text-[10px] sm:text-xs uppercase tracking-wider font-medium
          ${isHonor ? 'text-amber-400' : 'text-vellum-400'}
        `}
      >
        {stat}
      </span>

      {/* Score */}
      <span
        className={`
          text-lg sm:text-xl font-bold leading-tight
          ${isHonor ? 'text-amber-200' : 'text-vellum-100'}
        `}
      >
        {value}
      </span>

      {/* Modifier */}
      <span className={`text-xs sm:text-sm font-medium ${modifierClass}`}>
        {modifierText}
      </span>
    </div>
  )
}

'use client'

import { GrimoireCard } from '../ui'
import { getAbilityModifier } from '@/lib/constants'

type VitalsPanelProps = {
  currentHP: number
  maxHP: number
  armorClass: number
  armorLevel: 'none' | 'light' | 'medium' | 'heavy'
  dexScore: number
  className?: string
}

const armorLevelLabels: Record<string, string> = {
  none: 'Unarmored',
  light: 'Light',
  medium: 'Medium',
  heavy: 'Heavy',
}

/**
 * VitalsPanel - HP bar, AC display, and initiative
 *
 * Compact panel showing the character's vital combat stats.
 */
export function VitalsPanel({
  currentHP,
  maxHP,
  armorClass,
  armorLevel,
  dexScore,
  className = '',
}: VitalsPanelProps) {
  const hpPercentage = Math.max(0, Math.min(100, (currentHP / maxHP) * 100))
  const initiative = getAbilityModifier(dexScore)

  // HP bar color based on percentage
  let hpBarColor = 'bg-emerald-600'
  if (hpPercentage <= 25) hpBarColor = 'bg-red-600'
  else if (hpPercentage <= 50) hpBarColor = 'bg-amber-600'

  return (
    <GrimoireCard className={className} padding="sm">
      {/* HP */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs uppercase tracking-wide text-vellum-400 font-medium">
            Hit Points
          </span>
          <span className="text-sm font-bold text-vellum-100">
            {currentHP} / {maxHP}
          </span>
        </div>
        {/* HP Bar */}
        <div className="h-3 bg-grimoire-950 rounded-sm border border-sepia-800/50 overflow-hidden">
          <div
            className={`h-full ${hpBarColor} transition-all duration-300`}
            style={{ width: `${hpPercentage}%` }}
          >
            {/* Inner shine */}
            <div className="h-1/2 bg-white/10 rounded-t-sm" />
          </div>
        </div>
      </div>

      {/* AC and Initiative row */}
      <div className="flex gap-3">
        {/* Armor Class */}
        <div className="flex-1 bg-grimoire-850 rounded border border-sepia-700/40 p-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 flex items-center justify-center bg-grimoire-900 rounded border border-sepia-700/50">
              <span className="text-lg">&#x1F6E1;</span>
            </div>
            <div>
              <div className="text-xl font-bold text-vellum-100 leading-none">{armorClass}</div>
              <div className="text-[10px] text-vellum-400 uppercase">{armorLevelLabels[armorLevel]}</div>
            </div>
          </div>
        </div>

        {/* Initiative */}
        <div className="flex-1 bg-grimoire-850 rounded border border-sepia-700/40 p-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 flex items-center justify-center bg-grimoire-900 rounded border border-sepia-700/50">
              <span className="text-lg">&#x26A1;</span>
            </div>
            <div>
              <div className="text-xl font-bold text-vellum-100 leading-none">
                {initiative >= 0 ? '+' : ''}{initiative}
              </div>
              <div className="text-[10px] text-vellum-400 uppercase">Initiative</div>
            </div>
          </div>
        </div>
      </div>
    </GrimoireCard>
  )
}

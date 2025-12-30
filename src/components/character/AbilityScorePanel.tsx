'use client'

import { StatBlock } from './StatBlock'
import { GrimoireCard } from '../ui'
import { SectionHeader } from '../ui/SectionHeader'
import type { CharacterStats } from '@/lib/types'

type AbilityScorePanelProps = {
  stats: CharacterStats
  className?: string
}

const ABILITY_ORDER = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const

/**
 * AbilityScorePanel - Horizontal layout for all ability scores
 *
 * Displays the 6 core stats in a row with HON (Honor) centered below
 * with special gold accent treatment.
 */
export function AbilityScorePanel({ stats, className = '' }: AbilityScorePanelProps) {
  return (
    <GrimoireCard className={className} padding="sm">
      <SectionHeader className="mb-3">Ability Scores</SectionHeader>

      {/* Core 6 abilities */}
      <div className="flex justify-center gap-1.5 sm:gap-2">
        {ABILITY_ORDER.map(stat => (
          <StatBlock key={stat} stat={stat} value={stats[stat]} />
        ))}
      </div>

      {/* Honor - centered with special treatment */}
      <div className="flex justify-center mt-3">
        <div className="relative">
          {/* Decorative lines */}
          <div className="absolute inset-y-0 left-0 right-1/2 flex items-center pr-10">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-700/40" />
          </div>
          <div className="absolute inset-y-0 left-1/2 right-0 flex items-center pl-10">
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-700/40" />
          </div>

          <StatBlock stat="hon" value={stats.hon} variant="honor" />
        </div>
      </div>
    </GrimoireCard>
  )
}

'use client'

/**
 * SetupPhase — Forage setup UI
 *
 * Renders biome allocation controls, session counter, and start button.
 * Extracted from src/app/forage/page.tsx for maintainability.
 */

import Link from 'next/link'
import { Biome } from '@/lib/types'

// ============ Types ============

export type SetupPhaseProps = {
  profile: { name: string; maxForagingSessions: number }
  biomes: Biome[]
  biomeAllocations: Record<number, number>
  sessionsRemaining: number
  sessionsUsedToday: number
  totalAllocated: number
  canAllocateMore: boolean
  onIncrement: (biomeId: number) => void
  onDecrement: (biomeId: number) => void
  onClear: () => void
  onStart: () => void
  onLongRest: () => void
}

// ============ Component ============

export default function SetupPhase(props: SetupPhaseProps) {
  const {
    profile,
    biomes,
    biomeAllocations,
    sessionsRemaining,
    sessionsUsedToday,
    totalAllocated,
    canAllocateMore,
    onIncrement,
    onDecrement,
    onClear,
    onStart,
    onLongRest,
  } = props

  return (
    <div className="space-y-8">
      {/* Profile Warning */}
      {!profile.name && (
        <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-4">
          <p className="text-amber-200 text-sm">
            💡 Set up your <Link href="/profile" className="underline hover:text-amber-100">character profile</Link> to save your foraging modifier.
          </p>
        </div>
      )}

      {/* Session Counter */}
      <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-medium text-zinc-400 mb-1">Foraging Sessions</h3>
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold">
                <span className={sessionsRemaining === 0 ? 'text-red-400' : 'text-green-400'}>
                  {sessionsRemaining}
                </span>
                <span className="text-zinc-500">/{profile.maxForagingSessions}</span>
              </div>
              <span className="text-zinc-500 text-sm">remaining today</span>
            </div>
          </div>
          {sessionsUsedToday > 0 && (
            <button
              onClick={onLongRest}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded-lg text-sm transition-colors"
            >
              🌙 Long Rest
            </button>
          )}
        </div>
      </div>

      {/* Biome Selection */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Allocate Sessions to Biomes</h2>
          {totalAllocated > 0 && (
            <button onClick={onClear} className="text-zinc-400 hover:text-zinc-200 text-sm">
              Clear all
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {biomes.map((biome) => {
            const allocated = biomeAllocations[biome.id] || 0
            const isAllocated = allocated > 0

            return (
              <div
                key={biome.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  isAllocated
                    ? 'bg-green-900/30 border-green-500'
                    : 'bg-zinc-800 border-zinc-700'
                }`}
              >
                <h3 className="font-semibold">{biome.name}</h3>
                {biome.description && (
                  <p className="text-zinc-400 text-sm mt-1 mb-3">{biome.description}</p>
                )}

                <div className="flex items-center gap-2 mt-3">
                  {isAllocated && (
                    <button
                      onClick={() => onDecrement(biome.id)}
                      className="w-8 h-8 bg-zinc-700 hover:bg-zinc-600 rounded font-bold transition-colors"
                    >
                      −
                    </button>
                  )}

                  {isAllocated ? (
                    <span className="w-8 text-center font-bold text-green-400">{allocated}</span>
                  ) : (
                    <span className="text-zinc-500 text-sm">No sessions</span>
                  )}

                  <button
                    onClick={() => onIncrement(biome.id)}
                    disabled={!canAllocateMore}
                    className={`${isAllocated ? 'w-8 h-8' : 'px-3 h-8'} bg-green-700 hover:bg-green-600 disabled:bg-zinc-700 disabled:text-zinc-500 rounded font-bold transition-colors`}
                  >
                    {isAllocated ? '+' : '+ Add'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {biomes.length === 0 && (
          <p className="text-zinc-500">No biomes found. Add some in Supabase!</p>
        )}
      </div>

      {/* Allocation Summary */}
      {totalAllocated > 0 && (
        <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
          <h3 className="text-sm font-medium text-zinc-400 mb-2">Session Allocation</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(biomeAllocations).map(([biomeId, count]) => {
              const biome = biomes.find(b => b.id === parseInt(biomeId))
              if (!biome || count < 1) return null
              return (
                <span key={biomeId} className="px-3 py-1 bg-green-900/50 border border-green-700 rounded-full text-sm">
                  {biome.name}: {count}
                </span>
              )
            })}
          </div>
          <p className="text-zinc-500 text-sm mt-2">
            Total: {totalAllocated} session{totalAllocated !== 1 ? 's' : ''} ({totalAllocated} hour{totalAllocated !== 1 ? 's' : ''})
          </p>
        </div>
      )}

      {/* Start Button */}
      <button
        onClick={onStart}
        disabled={totalAllocated === 0 || sessionsRemaining === 0}
        className="w-full px-6 py-4 bg-green-700 hover:bg-green-600 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg font-semibold text-lg transition-colors"
      >
        {sessionsRemaining === 0
          ? 'No Sessions Remaining (Take a Long Rest)'
          : totalAllocated === 0
            ? 'Allocate Sessions to Biomes'
            : `Start Foraging (${totalAllocated} session${totalAllocated > 1 ? 's' : ''})`
        }
      </button>
    </div>
  )
}

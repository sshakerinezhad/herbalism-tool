'use client'

/**
 * ResultsPhase — displays foraging session results, herb cards, and removal actions
 *
 * Rendered after all foraging rolls complete. Shows per-session breakdown,
 * herbs added to inventory, and controls for removing herbs.
 */

import Link from 'next/link'
import type { SessionResult } from '@/lib/types'
import { getElementSymbol } from '@/lib/constants'
import type { ForagedHerb } from './types'

// ============ Types ============

export type ResultsPhaseProps = {
  sessionResults: SessionResult[]
  foragingMod: number
  foragedHerbs: ForagedHerb[]
  remainingHerbs: ForagedHerb[]
  removedCount: number
  removingHerb: string | null
  removingAll: boolean
  onRemoveHerb: (instanceId: string) => void
  onRemoveAll: () => void
  onReset: () => void
}

// ============ Component ============

export function ResultsPhase(props: ResultsPhaseProps) {
  const {
    sessionResults,
    foragingMod,
    foragedHerbs,
    remainingHerbs,
    removedCount,
    removingHerb,
    removingAll,
    onRemoveHerb,
    onRemoveAll,
    onReset,
  } = props

  const successfulSessions = sessionResults.filter(r => r.success).length
  const failedSessions = sessionResults.filter(r => !r.success).length
  const totalHerbsFound = sessionResults.reduce((sum, r) => sum + (r.herbsFound?.length || 0), 0)

  return (
    <div className="space-y-6">
      {/* Session Results Summary */}
      <div className="elevation-raised rounded-lg p-4">
        <h3 className="font-semibold mb-3">Session Results</h3>
        <div className="space-y-2">
          {sessionResults.map((result) => (
            <div key={result.sessionNumber} className="flex items-center gap-3 text-sm">
              <span className="w-6">{result.success ? '✅' : '❌'}</span>
              <span className="text-vellum-400 w-20">Session {result.sessionNumber}:</span>
              <span className="text-vellum-400/60 min-w-[80px]">{result.biome.name}</span>
              <span className="font-mono">
                {result.checkRoll} {foragingMod >= 0 ? '+' : ''}{foragingMod} = {result.checkTotal}
              </span>
              {result.success ? (
                <span className="text-green-400">
                  → {result.herbsFound?.length || 0} herb{(result.herbsFound?.length || 0) !== 1 ? 's' : ''}
                </span>
              ) : (
                <span className="text-red-400">→ failed</span>
              )}
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="mt-4 pt-4 border-t border-sepia-700/40 flex gap-6 text-sm">
          <span>
            <span className="text-vellum-400">Successful:</span>{' '}
            <span className="text-green-400 font-semibold">{successfulSessions}</span>
          </span>
          <span>
            <span className="text-vellum-400">Failed:</span>{' '}
            <span className="text-red-400 font-semibold">{failedSessions}</span>
          </span>
          <span>
            <span className="text-vellum-400">Total herbs:</span>{' '}
            <span className="text-green-400 font-semibold">{totalHerbsFound}</span>
          </span>
        </div>
      </div>

      {/* Herbs Found */}
      {foragedHerbs.length > 0 && (
        <div className="elevation-raised rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold">Herbs Added to Inventory</h3>
              <p className="text-vellum-400 text-sm">
                {remainingHerbs.length} herb{remainingHerbs.length !== 1 ? 's' : ''} in inventory
                {removedCount > 0 && (
                  <span className="text-red-400 ml-2">({removedCount} removed)</span>
                )}
              </p>
            </div>
            {remainingHerbs.length > 0 && (
              <button
                onClick={onRemoveAll}
                disabled={removingAll || removingHerb !== null}
                className="px-3 py-1.5 bg-red-700 hover:bg-red-600 disabled:bg-red-900 disabled:text-red-400 rounded text-sm transition-colors"
              >
                {removingAll ? 'Removing...' : 'Remove All'}
              </button>
            )}
          </div>

          <div className="space-y-2">
            {foragedHerbs.map((foragedHerb) => (
              <div
                key={foragedHerb.instanceId}
                className={`flex justify-between items-center py-2 border-b border-sepia-700/40 last:border-0 ${
                  foragedHerb.removed ? 'opacity-40' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  {foragedHerb.removed ? (
                    <span className="text-red-400 text-sm">✕</span>
                  ) : (
                    <button
                      onClick={() => onRemoveHerb(foragedHerb.instanceId)}
                      disabled={removingHerb === foragedHerb.instanceId || removingAll}
                      className="w-6 h-6 flex items-center justify-center bg-red-700/50 hover:bg-red-600 disabled:bg-sepia-800/50 rounded text-sm transition-colors"
                      title="Remove from inventory"
                    >
                      {removingHerb === foragedHerb.instanceId ? '...' : '✕'}
                    </button>
                  )}
                  <div>
                    <span className={`font-medium ${foragedHerb.removed ? 'line-through text-vellum-400/60' : ''}`}>
                      {foragedHerb.herb.name}
                    </span>
                    <span className="text-vellum-400 text-sm ml-2 capitalize">
                      ({foragedHerb.herb.rarity})
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  {foragedHerb.herb.elements.map((element, j) => (
                    <span
                      key={j}
                      className={`px-2 py-1 rounded text-xs capitalize ${
                        foragedHerb.removed ? 'bg-zinc-800 text-vellum-400/60' : 'bg-sepia-800/50'
                      }`}
                    >
                      {getElementSymbol(element)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="text-vellum-400/60 text-xs mt-4 italic">
            💡 Remove herbs if you gave them away to another player or foraged by mistake.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4 flex-wrap">
        <button
          onClick={onReset}
          className="px-6 py-3 btn-secondary rounded-lg font-medium transition-colors"
        >
          ← Forage Again
        </button>
        {remainingHerbs.length > 0 && (
          <Link
            href="/"
            className="px-6 py-3 btn-primary rounded-lg font-medium transition-colors"
          >
            View Inventory →
          </Link>
        )}
      </div>
    </div>
  )
}

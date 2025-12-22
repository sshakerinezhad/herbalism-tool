/**
 * ResultPhase - Display brewing results
 */

import Link from 'next/link'

type BrewResult = {
  success: boolean
  roll: number
  total: number
}

type ResultPhaseProps = {
  success: boolean
  roll: number
  total: number
  brewingMod: number
  type: string
  description: string
  onReset: () => void
}

export function ResultPhase({
  success,
  roll,
  total,
  brewingMod,
  type,
  description,
  onReset
}: ResultPhaseProps) {
  return (
    <div className="space-y-6">
      <div className={`rounded-lg p-6 border ${
        success 
          ? 'bg-green-900/30 border-green-700' 
          : 'bg-red-900/30 border-red-700'
      }`}>
        <h2 className={`text-2xl font-bold mb-2 ${success ? 'text-green-300' : 'text-red-300'}`}>
          {success ? '✓ Brewing Successful!' : '✗ Brewing Failed'}
        </h2>
        
        <p className="text-zinc-300 mb-4">
          Roll: <strong>{roll}</strong> {brewingMod >= 0 ? '+' : ''}{brewingMod} = <strong>{total}</strong>
          {success ? ' ≥ 15 (DC)' : ' < 15 (DC)'}
        </p>

        {success ? (
          <div className="bg-zinc-900/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-sm px-2 py-0.5 rounded ${
                type === 'elixir' 
                  ? 'bg-blue-900/50 text-blue-300' 
                  : type === 'bomb'
                    ? 'bg-red-900/50 text-red-300'
                    : 'bg-amber-900/50 text-amber-300'
              }`}>
                {type}
              </span>
            </div>
            <p className="text-zinc-100">{description}</p>
          </div>
        ) : (
          <p className="text-zinc-400">
            The herbs were consumed but the brewing failed. Better luck next time!
          </p>
        )}
      </div>

      <div className="flex gap-4">
        <button
          onClick={onReset}
          className="flex-1 py-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg font-medium transition-colors"
        >
          Brew Again
        </button>
        {success && (
          <Link
            href="/inventory"
            className="flex-1 py-3 bg-purple-700 hover:bg-purple-600 rounded-lg font-semibold transition-colors text-center"
          >
            View Inventory
          </Link>
        )}
      </div>
    </div>
  )
}

type BatchResultPhaseProps = {
  results: BrewResult[]
  brewingMod: number
  type: string
  description: string
  successCount: number
  onReset: () => void
}

export function BatchResultPhase({
  results,
  brewingMod,
  type,
  description,
  successCount,
  onReset
}: BatchResultPhaseProps) {
  const totalBrewed = results.length
  const failCount = totalBrewed - successCount

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className={`rounded-lg p-6 border ${
        successCount === totalBrewed 
          ? 'bg-green-900/30 border-green-700' 
          : successCount === 0
            ? 'bg-red-900/30 border-red-700'
            : 'bg-amber-900/30 border-amber-700'
      }`}>
        <h2 className={`text-2xl font-bold mb-2 ${
          successCount === totalBrewed 
            ? 'text-green-300' 
            : successCount === 0
              ? 'text-red-300'
              : 'text-amber-300'
        }`}>
          {successCount === totalBrewed 
            ? `✓ All ${totalBrewed} Brews Successful!`
            : successCount === 0
              ? `✗ All ${totalBrewed} Brews Failed`
              : `${successCount}/${totalBrewed} Brews Successful`
          }
        </h2>

        {/* What was brewed */}
        <div className="bg-zinc-900/50 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-sm px-2 py-0.5 rounded ${
              type === 'elixir' 
                ? 'bg-blue-900/50 text-blue-300' 
                : type === 'bomb'
                  ? 'bg-red-900/50 text-red-300'
                  : 'bg-amber-900/50 text-amber-300'
            }`}>
              {type}
            </span>
            {successCount > 0 && (
              <span className="text-green-400 text-sm">×{successCount} created</span>
            )}
          </div>
          <p className="text-zinc-100">{description}</p>
        </div>

        {/* Individual rolls */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-zinc-400">Roll Results (DC 15)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {results.map((result, idx) => (
              <div
                key={idx}
                className={`px-3 py-2 rounded text-sm ${
                  result.success 
                    ? 'bg-green-900/40 border border-green-700' 
                    : 'bg-red-900/40 border border-red-700'
                }`}
              >
                <span className="font-mono">
                  {result.roll} {brewingMod >= 0 ? '+' : ''}{brewingMod} = {result.total}
                </span>
                <span className="ml-2">{result.success ? '✓' : '✗'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats summary */}
        <div className="mt-4 pt-4 border-t border-zinc-700/50 flex gap-6 text-sm">
          <span>
            <span className="text-zinc-400">Successful:</span>{' '}
            <span className="text-green-400 font-semibold">{successCount}</span>
          </span>
          <span>
            <span className="text-zinc-400">Failed:</span>{' '}
            <span className="text-red-400 font-semibold">{failCount}</span>
          </span>
          <span>
            <span className="text-zinc-400">Herbs used:</span>{' '}
            <span className="text-zinc-300 font-semibold">All consumed</span>
          </span>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={onReset}
          className="flex-1 py-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg font-medium transition-colors"
        >
          Brew Again
        </button>
        {successCount > 0 && (
          <Link
            href="/inventory"
            className="flex-1 py-3 bg-purple-700 hover:bg-purple-600 rounded-lg font-semibold transition-colors text-center"
          >
            View Inventory
          </Link>
        )}
      </div>
    </div>
  )
}


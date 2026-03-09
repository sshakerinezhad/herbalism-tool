/**
 * BiomeCard — biome selection card for session allocation
 *
 * Displays a single biome with its name, description, and +/- controls
 * for allocating foraging sessions.
 */

import { Biome } from '@/lib/types'

type BiomeCardProps = {
  biome: Biome
  allocated: number
  canAllocateMore: boolean
  onIncrement: (biomeId: number) => void
  onDecrement: (biomeId: number) => void
}

export function BiomeCard({
  biome,
  allocated,
  canAllocateMore,
  onIncrement,
  onDecrement,
}: BiomeCardProps) {
  const isAllocated = allocated > 0

  return (
    <div
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
}

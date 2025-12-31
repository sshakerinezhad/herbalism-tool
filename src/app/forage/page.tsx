'use client'

/**
 * Forage Page
 * 
 * Allows players to allocate foraging sessions to biomes and roll for herbs.
 * Supports multi-biome session allocation and tracks daily session usage.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/lib/profile'
import { useAuth } from '@/lib/auth'
import { useBiomes, useInvalidateQueries, useCharacter } from '@/lib/hooks'
import { rollD20, rollHerbQuantity, weightedRandomSelect } from '@/lib/dice'
import { Biome, Herb, BiomeHerb, SessionResult, ForageState } from '@/lib/types'
import { addCharacterHerbs, removeCharacterHerbs } from '@/lib/db/characterInventory'
import { FORAGING_DC, getElementSymbol } from '@/lib/constants'
import { PageLayout, ErrorDisplay, ForageSkeleton } from '@/components/ui'

// ============ Types ============

type ForagedHerb = {
  instanceId: string
  herb: Herb
  removed: boolean
}

// ============ Main Component ============

export default function ForagePage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const {
    profile,
    isLoaded: profileLoaded,
    sessionsUsedToday,
    spendForagingSessions,
    longRest
  } = useProfile()
  const { invalidateCharacterHerbs } = useInvalidateQueries()

  // Character data - herbalism is now character-based
  const { data: character, isLoading: characterLoading } = useCharacter(user?.id ?? null)
  const characterId = character?.id ?? null
  
  // React Query handles biome data fetching and caching
  const { data: biomes = [], isLoading: biomesLoading, error: biomesError } = useBiomes()
  
  // Local error state for mutations
  const [mutationError, setMutationError] = useState<string | null>(null)
  
  // Foraging state
  const [biomeAllocations, setBiomeAllocations] = useState<Record<number, number>>({})
  const [state, setState] = useState<ForageState>({ phase: 'setup' })
  const [foragedHerbs, setForagedHerbs] = useState<ForagedHerb[]>([])
  
  // Removal state
  const [removingHerb, setRemovingHerb] = useState<string | null>(null)
  const [removingAll, setRemovingAll] = useState(false)

  // Computed values
  const sessionsRemaining = Math.max(0, profile.maxForagingSessions - sessionsUsedToday)
  const foragingMod = profile.foragingModifier
  const totalAllocated = Object.values(biomeAllocations).reduce((sum, n) => sum + n, 0)
  const canAllocateMore = totalAllocated < sessionsRemaining
  const error = biomesError?.message || mutationError

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [authLoading, user, router])

  // Reset allocations if sessions remaining decreases
  useEffect(() => {
    if (totalAllocated > sessionsRemaining) {
      setBiomeAllocations({})
    }
  }, [sessionsRemaining, totalAllocated])

  // ============ Allocation Actions ============

  function incrementBiome(biomeId: number) {
    if (!canAllocateMore) return
    setBiomeAllocations(prev => ({
      ...prev,
      [biomeId]: (prev[biomeId] || 0) + 1
    }))
  }

  function decrementBiome(biomeId: number) {
    setBiomeAllocations(prev => {
      const current = prev[biomeId] || 0
      if (current <= 1) {
        const { [biomeId]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [biomeId]: current - 1 }
    })
  }

  function clearAllocations() {
    setBiomeAllocations({})
  }

  // ============ Foraging Actions ============

  async function startForaging() {
    if (totalAllocated < 1 || totalAllocated > sessionsRemaining) return

    setMutationError(null)
    setState({ phase: 'rolling', totalSessions: totalAllocated, currentSession: 1 })

    const results: SessionResult[] = []
    let sessionNumber = 0

    // Process each biome's allocations
    for (const [biomeIdStr, count] of Object.entries(biomeAllocations)) {
      const biomeId = parseInt(biomeIdStr)
      const biome = biomes.find(b => b.id === biomeId)
      if (!biome || count < 1) continue

      // Get herbs available in this biome
      const { data: biomeHerbs, error: herbError } = await supabase
        .from('biome_herbs')
        .select('id, biome_id, herb_id, weight, herbs(*)')
        .eq('biome_id', biomeId)

      if (herbError) {
        setMutationError(`Failed to load herbs for ${biome.name}: ${herbError.message}`)
        setState({ phase: 'setup' })
        return
      }

      for (let i = 0; i < count; i++) {
        sessionNumber++
        const checkRoll = rollD20()
        const checkTotal = checkRoll + foragingMod
        const success = checkTotal >= FORAGING_DC

        if (!success) {
          results.push({
            sessionNumber,
            biome,
            success: false,
            checkRoll,
            checkTotal,
          })
        } else {
          // Success - roll for herbs
          const { total, rolls } = rollHerbQuantity()
          const herbsFound: Herb[] = []

          if (biomeHerbs && biomeHerbs.length > 0) {
            const typedBiomeHerbs = biomeHerbs.map(bh => ({
              ...bh,
              herbs: bh.herbs as unknown as Herb
            })) as BiomeHerb[]

            for (let j = 0; j < total; j++) {
              const selected = weightedRandomSelect(typedBiomeHerbs)
              herbsFound.push(selected.herbs)
            }
          }

          results.push({
            sessionNumber,
            biome,
            success: true,
            checkRoll,
            checkTotal,
            quantityRolls: rolls,
            herbsFound,
          })
        }

        setState({ phase: 'rolling', totalSessions: totalAllocated, currentSession: sessionNumber + 1 })
      }
    }

    // Mark sessions as used
    spendForagingSessions(totalAllocated)

    // Collect all herbs found
    const allHerbs = results.flatMap(r => r.herbsFound || [])
    const herbInstances: ForagedHerb[] = allHerbs.map((herb, i) => ({
      instanceId: `${Date.now()}-${i}`,
      herb,
      removed: false
    }))
    setForagedHerbs(herbInstances)

    // Auto-add to inventory (character-based)
    if (herbInstances.length > 0 && characterId) {
      // Group herbs by ID and add to character inventory
      const herbCounts = new Map<number, number>()
      for (const herb of allHerbs) {
        herbCounts.set(herb.id, (herbCounts.get(herb.id) || 0) + 1)
      }

      let addError: string | null = null
      for (const [herbId, quantity] of herbCounts) {
        const result = await addCharacterHerbs(characterId, herbId, quantity)
        if (result.error) {
          addError = result.error
          break
        }
      }

      if (addError) {
        setMutationError(`Herbs found but failed to add to inventory: ${addError}`)
      } else {
        // Invalidate inventory cache so it's fresh when user visits inventory page
        invalidateCharacterHerbs(characterId)
      }
    }

    setState({ phase: 'results', sessionResults: results })
  }

  function reset() {
    setBiomeAllocations({})
    setMutationError(null)
    setForagedHerbs([])
    setState({ phase: 'setup' })
  }

  // ============ Herb Removal Actions ============

  async function handleRemoveHerb(instanceId: string) {
    if (!characterId) return

    const herbToRemove = foragedHerbs.find(h => h.instanceId === instanceId)
    if (!herbToRemove || herbToRemove.removed) return

    setRemovingHerb(instanceId)
    const { error: removeError } = await removeCharacterHerbs(
      characterId,
      herbToRemove.herb.id,
      1
    )
    setRemovingHerb(null)

    if (removeError) {
      setMutationError(removeError)
    } else {
      setForagedHerbs(prev =>
        prev.map(h => h.instanceId === instanceId ? { ...h, removed: true } : h)
      )
      invalidateCharacterHerbs(characterId)
    }
  }

  async function handleRemoveAll() {
    if (!characterId) return

    const herbsToRemove = foragedHerbs.filter(h => !h.removed)
    if (herbsToRemove.length === 0) return

    setRemovingAll(true)

    // Group herbs by ID
    const herbCounts = new Map<number, number>()
    for (const { herb } of herbsToRemove) {
      herbCounts.set(herb.id, (herbCounts.get(herb.id) || 0) + 1)
    }

    // Remove each herb type from character inventory
    let removeError: string | null = null
    for (const [herbId, quantity] of herbCounts) {
      const result = await removeCharacterHerbs(characterId, herbId, quantity)
      if (result.error) {
        removeError = result.error
        break
      }
    }
    setRemovingAll(false)

    if (removeError) {
      setMutationError(removeError)
    } else {
      setForagedHerbs(prev => prev.map(h => ({ ...h, removed: true })))
      invalidateCharacterHerbs(characterId)
    }
  }

  // Computed values for results
  const remainingHerbs = foragedHerbs.filter(h => !h.removed)
  const removedCount = foragedHerbs.filter(h => h.removed).length

  if (biomesLoading || !profileLoaded || authLoading || characterLoading) {
    return <ForageSkeleton />
  }

  // Gate: require character for herbalism
  if (!character) {
    return (
      <PageLayout maxWidth="max-w-4xl">
        <h1 className="text-3xl font-bold mb-2">Forage for Herbs</h1>
        <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-6">
          <p className="text-amber-200 mb-4">
            You need to create a character before you can forage for herbs.
          </p>
          <Link
            href="/profile"
            className="inline-block px-4 py-2 bg-amber-700 hover:bg-amber-600 rounded-lg text-sm font-medium transition-colors"
          >
            Create Character
          </Link>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout maxWidth="max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">🔍 Forage for Herbs</h1>
      {profile.name && (
        <p className="text-zinc-400 mb-6">
          {profile.name} • Foraging: {foragingMod >= 0 ? '+' : ''}{foragingMod}
        </p>
      )}

      {error && <ErrorDisplay message={error} onDismiss={() => setMutationError(null)} className="mb-6" />}

      {/* Setup Phase */}
      {state.phase === 'setup' && (
        <SetupPhase
          profile={profile}
          biomes={biomes}
          biomeAllocations={biomeAllocations}
          sessionsRemaining={sessionsRemaining}
          sessionsUsedToday={sessionsUsedToday}
          totalAllocated={totalAllocated}
          canAllocateMore={canAllocateMore}
          onIncrement={incrementBiome}
          onDecrement={decrementBiome}
          onClear={clearAllocations}
          onStart={startForaging}
          onLongRest={longRest}
        />
      )}

      {/* Rolling Phase */}
      {state.phase === 'rolling' && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="text-4xl mb-4">🎲</div>
            <p className="text-xl">
              Rolling session {state.currentSession} of {state.totalSessions}...
            </p>
          </div>
        </div>
      )}

      {/* Results Phase */}
      {state.phase === 'results' && (
        <ResultsPhase
          sessionResults={state.sessionResults}
          foragingMod={foragingMod}
          foragedHerbs={foragedHerbs}
          remainingHerbs={remainingHerbs}
          removedCount={removedCount}
          removingHerb={removingHerb}
          removingAll={removingAll}
          onRemoveHerb={handleRemoveHerb}
          onRemoveAll={handleRemoveAll}
          onReset={reset}
        />
      )}
    </PageLayout>
  )
}

// ============ Setup Phase Component ============

type SetupPhaseProps = {
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

function SetupPhase(props: SetupPhaseProps) {
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

// ============ Results Phase Component ============

type ResultsPhaseProps = {
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

function ResultsPhase(props: ResultsPhaseProps) {
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
      <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
        <h3 className="font-semibold mb-3">Session Results</h3>
        <div className="space-y-2">
          {sessionResults.map((result) => (
            <div key={result.sessionNumber} className="flex items-center gap-3 text-sm">
              <span className="w-6">{result.success ? '✅' : '❌'}</span>
              <span className="text-zinc-400 w-20">Session {result.sessionNumber}:</span>
              <span className="text-zinc-500 min-w-[80px]">{result.biome.name}</span>
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
        <div className="mt-4 pt-4 border-t border-zinc-700 flex gap-6 text-sm">
          <span>
            <span className="text-zinc-400">Successful:</span>{' '}
            <span className="text-green-400 font-semibold">{successfulSessions}</span>
          </span>
          <span>
            <span className="text-zinc-400">Failed:</span>{' '}
            <span className="text-red-400 font-semibold">{failedSessions}</span>
          </span>
          <span>
            <span className="text-zinc-400">Total herbs:</span>{' '}
            <span className="text-green-400 font-semibold">{totalHerbsFound}</span>
          </span>
        </div>
      </div>

      {/* Herbs Found */}
      {foragedHerbs.length > 0 && (
        <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold">Herbs Added to Inventory</h3>
              <p className="text-zinc-400 text-sm">
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
                className={`flex justify-between items-center py-2 border-b border-zinc-700 last:border-0 ${
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
                      className="w-6 h-6 flex items-center justify-center bg-red-700/50 hover:bg-red-600 disabled:bg-zinc-700 rounded text-sm transition-colors"
                      title="Remove from inventory"
                    >
                      {removingHerb === foragedHerb.instanceId ? '...' : '✕'}
                    </button>
                  )}
                  <div>
                    <span className={`font-medium ${foragedHerb.removed ? 'line-through text-zinc-500' : ''}`}>
                      {foragedHerb.herb.name}
                    </span>
                    <span className="text-zinc-400 text-sm ml-2 capitalize">
                      ({foragedHerb.herb.rarity})
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  {foragedHerb.herb.elements.map((element, j) => (
                    <span
                      key={j}
                      className={`px-2 py-1 rounded text-xs capitalize ${
                        foragedHerb.removed ? 'bg-zinc-800 text-zinc-500' : 'bg-zinc-700'
                      }`}
                    >
                      {getElementSymbol(element)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <p className="text-zinc-500 text-xs mt-4 italic">
            💡 Remove herbs if you gave them away to another player or foraged by mistake.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4 flex-wrap">
        <button
          onClick={onReset}
          className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg font-medium transition-colors"
        >
          ← Forage Again
        </button>
        {remainingHerbs.length > 0 && (
          <Link
            href="/inventory"
            className="px-6 py-3 bg-blue-700 hover:bg-blue-600 rounded-lg font-medium transition-colors"
          >
            View Inventory →
          </Link>
        )}
      </div>
    </div>
  )
}

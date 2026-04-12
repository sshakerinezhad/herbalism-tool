'use client'

/**
 * Forage Page
 *
 * Allows players to allocate foraging sessions to biomes and roll for herbs.
 * Supports multi-biome session allocation and tracks daily session usage.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useProfile } from '@/lib/profile'
import { useAuth } from '@/lib/auth'
import { useBiomes, useInvalidateQueries, useCharacter, useCharacterSkills } from '@/lib/hooks'
import { rollD20, rollHerbQuantity, weightedRandomSelect } from '@/lib/dice'
import { Herb, SessionResult, ForageState } from '@/lib/types'
import { addCharacterHerbs, removeCharacterHerbs } from '@/lib/db/characterInventory'
import { fetchBiomeHerbs } from '@/lib/db/biomes'
import { FORAGING_DC } from '@/lib/constants'
import { computeMaxForagingSessions, computeForagingModifier } from '@/lib/characterUtils'
import { ErrorDisplay, ForageSkeleton } from '@/components/ui'
import { SetupPhase, ResultsPhase } from '@/components/forage'
import type { ForagedHerb } from '@/components/forage'

// ============ Main Component ============

export default function ForagePage() {
  const { user } = useAuth()
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

  // Character skills (for computing foraging modifier from Nature proficiency)
  const { data: characterSkills = [], isLoading: skillsLoading } = useCharacterSkills(character?.id ?? null)

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
  const maxForagingSessions = character ? computeMaxForagingSessions(character.int) : 1
  const sessionsRemaining = Math.max(0, maxForagingSessions - sessionsUsedToday)
  const natureSkill = characterSkills.find(s => s.skill.name.toLowerCase() === 'nature') ?? null
  const foragingMod = character ? computeForagingModifier(character.int, character.level, natureSkill) : 0
  const totalAllocated = Object.values(biomeAllocations).reduce((sum, n) => sum + n, 0)
  const canAllocateMore = totalAllocated < sessionsRemaining
  const error = biomesError?.message || mutationError

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
      const { data: biomeHerbs, error: herbError } = await fetchBiomeHerbs(biomeId)

      if (herbError) {
        setMutationError(`Failed to load herbs for ${biome.name}: ${herbError}`)
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
            for (let j = 0; j < total; j++) {
              const selected = weightedRandomSelect(biomeHerbs)
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

  if (biomesLoading || !profileLoaded || characterLoading || skillsLoading) {
    return <ForageSkeleton />
  }

  // Gate: require character for herbalism
  if (!character) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Forage for Herbs</h1>
          <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-6">
            <p className="text-amber-200 mb-4">
              You need to create a character before you can forage for herbs.
            </p>
            <Link
              href="/"
              className="inline-block px-4 py-2 bg-amber-700 hover:bg-amber-600 rounded-lg text-sm font-medium transition-colors"
            >
              Create Character
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-heading text-3xl text-bronze-bright mb-2">Forage for Herbs</h1>
        {profile.name && (
          <p className="font-ui text-[11px] text-vellum-400/50 tracking-wide mb-6">
            {profile.name} • Foraging: {foragingMod >= 0 ? '+' : ''}{foragingMod}
          </p>
        )}

        {error && <ErrorDisplay message={error} onDismiss={() => setMutationError(null)} className="mb-6" />}

        {/* Setup Phase */}
        {state.phase === 'setup' && (
          <SetupPhase
            profile={profile}
            maxForagingSessions={maxForagingSessions}
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
              <div className="text-4xl mb-4 animate-warm-pulse">🎲</div>
              <p className="text-xl text-vellum-100">
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
      </div>
    </div>
  )
}

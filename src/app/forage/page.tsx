'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/lib/profile'
import { rollD20, rollHerbQuantity, weightedRandomSelect } from '@/lib/dice'
import { Biome, Herb, BiomeHerb, SessionResult, ForageState } from '@/lib/types'
import { addHerbsToInventory } from '@/lib/inventory'
import Link from 'next/link'

export default function ForagePage() {
  const { profile, profileId, isLoaded: profileLoaded, sessionsUsedToday, spendForagingSessions, longRest } = useProfile()
  const [biomes, setBiomes] = useState<Biome[]>([])
  const [biomeAllocations, setBiomeAllocations] = useState<Record<number, number>>({})
  const [state, setState] = useState<ForageState>({ phase: 'setup' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addedToInventory, setAddedToInventory] = useState(false)
  const [addingToInventory, setAddingToInventory] = useState(false)

  const sessionsRemaining = Math.max(0, profile.maxForagingSessions - sessionsUsedToday)
  const foragingMod = profile.foragingModifier
  const totalAllocated = Object.values(biomeAllocations).reduce((sum, n) => sum + n, 0)
  const canAllocateMore = totalAllocated < sessionsRemaining

  // Fetch biomes on mount
  useEffect(() => {
    async function fetchBiomes() {
      const { data, error: fetchError } = await supabase
        .from('biomes')
        .select('*')
        .order('name')
      
      if (fetchError) {
        setError(`Failed to load biomes: ${fetchError.message}`)
        setLoading(false)
        return
      }
      
      setBiomes(data || [])
      setLoading(false)
    }
    fetchBiomes()
  }, [])

  // Adjust allocations if sessions remaining decreases
  useEffect(() => {
    if (totalAllocated > sessionsRemaining) {
      setBiomeAllocations({})
    }
  }, [sessionsRemaining, totalAllocated])

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

  // Start foraging with allocations
  async function startForaging() {
    if (totalAllocated < 1 || totalAllocated > sessionsRemaining) return

    setError(null)
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
        setError(`Failed to load herbs for ${biome.name}: ${herbError.message}`)
        setState({ phase: 'setup' })
        return
      }

      for (let i = 0; i < count; i++) {
        sessionNumber++
        const checkRoll = rollD20()
        const checkTotal = checkRoll + foragingMod
        const success = checkTotal >= 13

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
            // Transform the data to match our BiomeHerb type
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

        // Update current session display
        setState({ phase: 'rolling', totalSessions: totalAllocated, currentSession: sessionNumber + 1 })
      }
    }

    // Mark sessions as used
    spendForagingSessions(totalAllocated)

    // Show results
    setState({ phase: 'results', sessionResults: results })
  }

  // Reset to setup
  function reset() {
    setBiomeAllocations({})
    setError(null)
    setAddedToInventory(false)
    setState({ phase: 'setup' })
  }

  // Add all found herbs to inventory
  async function handleAddToInventory() {
    if (state.phase !== 'results' || !profileId) return
    
    const allHerbs = state.sessionResults.flatMap(r => r.herbsFound || [])
    if (allHerbs.length === 0) return

    setAddingToInventory(true)
    const { error: addError } = await addHerbsToInventory(profileId, allHerbs)
    setAddingToInventory(false)

    if (addError) {
      setError(addError)
    } else {
      setAddedToInventory(true)
    }
  }

  if (loading || !profileLoaded) {
    return (
      <div className="min-h-screen bg-zinc-900 text-zinc-100 p-8">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-zinc-400 hover:text-zinc-200 mb-4 inline-block">
          ← Back
        </Link>
        
        <h1 className="text-3xl font-bold mb-2">🔍 Forage for Herbs</h1>
        {profile.name && (
          <p className="text-zinc-400 mb-6">
            {profile.name} • Foraging: {foragingMod >= 0 ? '+' : ''}{foragingMod}
          </p>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6">
            <p className="text-red-300">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-200 text-sm mt-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Setup Phase */}
        {state.phase === 'setup' && (
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
                    onClick={longRest}
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded-lg text-sm transition-colors"
                  >
                    🌙 Long Rest
                  </button>
                )}
              </div>
            </div>

            {/* Biome Selection Grid with Allocations */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Allocate Sessions to Biomes</h2>
                {totalAllocated > 0 && (
                  <button
                    onClick={clearAllocations}
                    className="text-zinc-400 hover:text-zinc-200 text-sm"
                  >
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
                      
                      {/* Allocation Controls */}
                      <div className="flex items-center gap-2 mt-3">
                        {isAllocated && (
                          <button
                            onClick={() => decrementBiome(biome.id)}
                            className="w-8 h-8 bg-zinc-700 hover:bg-zinc-600 rounded font-bold transition-colors"
                          >
                            −
                          </button>
                        )}
                        
                        {isAllocated ? (
                          <span className="w-8 text-center font-bold text-green-400">
                            {allocated}
                          </span>
                        ) : (
                          <span className="text-zinc-500 text-sm">No sessions</span>
                        )}
                        
                        <button
                          onClick={() => incrementBiome(biome.id)}
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
              
              {biomes.length === 0 && !error && (
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
              onClick={startForaging}
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
          <div className="space-y-6">
            {/* Session Results - Compact */}
            <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
              <h3 className="font-semibold mb-3">Session Results</h3>
              <div className="space-y-2">
                {state.sessionResults.map((result) => (
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
                  <span className="text-green-400 font-semibold">
                    {state.sessionResults.filter(r => r.success).length}
                  </span>
                </span>
                <span>
                  <span className="text-zinc-400">Failed:</span>{' '}
                  <span className="text-red-400 font-semibold">
                    {state.sessionResults.filter(r => !r.success).length}
                  </span>
                </span>
                <span>
                  <span className="text-zinc-400">Total herbs:</span>{' '}
                  <span className="text-green-400 font-semibold">
                    {state.sessionResults.reduce((sum, r) => sum + (r.herbsFound?.length || 0), 0)}
                  </span>
                </span>
              </div>
            </div>

            {/* All Herbs Found - Combined List */}
            {(() => {
              const allHerbs = state.sessionResults.flatMap(r => r.herbsFound || [])
              if (allHerbs.length === 0) return null
              
              return (
                <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
                  <h3 className="font-semibold mb-3">Herbs Found</h3>
                  <div className="space-y-2">
                    {allHerbs.map((herb, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center py-2 border-b border-zinc-700 last:border-0"
                      >
                        <div>
                          <span className="font-medium">{herb.name}</span>
                          <span className="text-zinc-400 text-sm ml-2 capitalize">({herb.rarity})</span>
                        </div>
                        <div className="flex gap-1">
                          {herb.elements.map((element, j) => (
                            <span
                              key={j}
                              className="px-2 py-1 bg-zinc-700 rounded text-xs capitalize"
                            >
                              {element}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* Actions */}
            <div className="flex gap-4 flex-wrap">
              <button
                onClick={reset}
                className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg font-medium transition-colors"
              >
                ← Back to Setup
              </button>
              {state.sessionResults.flatMap(r => r.herbsFound || []).length > 0 && (
                addedToInventory ? (
                  <div className="px-6 py-3 bg-green-900/50 border border-green-700 rounded-lg font-medium text-green-300">
                    ✓ Added to Inventory
                  </div>
                ) : (
                  <button
                    onClick={handleAddToInventory}
                    disabled={addingToInventory}
                    className="px-6 py-3 bg-green-700 hover:bg-green-600 disabled:bg-green-800 rounded-lg font-medium transition-colors"
                  >
                    {addingToInventory ? 'Adding...' : 'Add All to Inventory'}
                  </button>
                )
              )}
              {addedToInventory && (
                <Link
                  href="/inventory"
                  className="px-6 py-3 bg-blue-700 hover:bg-blue-600 rounded-lg font-medium transition-colors"
                >
                  View Inventory →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

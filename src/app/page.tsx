'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useProfile } from '@/lib/profile'
import { useAuth } from '@/lib/auth'
import { useCharacter, usePrefetch } from '@/lib/hooks'
import { LoadingState, PrefetchLink } from '@/components/ui'

export default function Home() {
  const { profile, profileId, isLoaded } = useProfile()
  const { user, isLoading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const { data: character } = useCharacter(user?.id ?? null)
  const { prefetchForage, prefetchInventory, prefetchRecipes } = usePrefetch()

  // Derive herbalist status from character vocation
  const isHerbalist = character?.vocation === 'herbalist'

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [authLoading, user, router])

  // Prefetch common data once profile is loaded
  // This makes subsequent navigation instant
  useEffect(() => {
    if (isLoaded && profileId) {
      // Prefetch static data (biomes) immediately
      prefetchForage()
      
      // Prefetch user data after a short delay (lower priority)
      const timer = setTimeout(() => {
        prefetchInventory(profileId)
        prefetchRecipes(profileId)
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [isLoaded, profileId, prefetchForage, prefetchInventory, prefetchRecipes])

  // Show loading while checking auth
  if (authLoading || !user) {
    return <LoadingState message="Loading..." />
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">🌿 Herbalism Tool</h1>
            <p className="text-zinc-400">D&D Homebrew Herbalism System</p>
          </div>
          
          <div className="flex gap-2 items-center">
            <PrefetchLink
              href="/profile"
              prefetch="profile"
              userId={user.id}
              className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg px-4 py-2 text-sm transition-colors"
            >
              {isLoaded && profile.name ? (
                <span>👤 {profile.name}</span>
              ) : (
                <span>👤 Profile</span>
              )}
            </PrefetchLink>
            
            <button
              onClick={signOut}
              className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg px-4 py-2 text-sm transition-colors text-zinc-400"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Signed in confirmation */}
        <div className="bg-emerald-900/20 border border-emerald-700/50 rounded-lg p-4 mb-6">
          <p className="text-emerald-200 text-sm">
            ✓ Signed in as <strong>{user.email}</strong> — your profile syncs across all devices.
          </p>
        </div>

        {/* Profile Summary (if set) */}
        {isLoaded && profile.name && (
          <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700 mb-6">
            <div className="flex gap-6 text-sm">
              <span className="text-zinc-400">
                {isHerbalist ? (
                  <span className="text-green-400">🧪 Herbalist</span>
                ) : (
                  '⚔️ Adventurer'
                )}
              </span>
              <span className="text-zinc-400">
                Foraging: <span className="text-zinc-100">{profile.foragingModifier >= 0 ? '+' : ''}{profile.foragingModifier}</span>
              </span>
              {isHerbalist && (
                <span className="text-zinc-400">
                  Brewing: <span className="text-zinc-100">{profile.brewingModifier >= 0 ? '+' : ''}{profile.brewingModifier}</span>
                </span>
              )}
            </div>
          </div>
        )}

        <div className="grid gap-4">
          <PrefetchLink
            href="/forage"
            prefetch="forage"
            className="block bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 hover:border-green-600 rounded-lg p-6 transition-colors"
          >
            <h2 className="text-xl font-semibold text-green-400 mb-2">🔍 Forage</h2>
            <p className="text-zinc-400">
              Search a biome for herbs. Roll your foraging check and discover what you find.
            </p>
          </PrefetchLink>

          <PrefetchLink
            href="/inventory"
            prefetch="inventory"
            profileId={profileId}
            className="block bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 hover:border-blue-600 rounded-lg p-6 transition-colors"
          >
            <h2 className="text-xl font-semibold text-blue-400 mb-2">🎒 Inventory</h2>
            <p className="text-zinc-400">
              All your possessions: weapons, items, herbs, and brewed goods.
            </p>
          </PrefetchLink>

          {isHerbalist ? (
            <PrefetchLink
              href="/brew"
              prefetch="brew"
              profileId={profileId}
              className="block bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 hover:border-purple-600 rounded-lg p-6 transition-colors"
            >
              <h2 className="text-xl font-semibold text-purple-400 mb-2">⚗️ Brew</h2>
              <p className="text-zinc-400">
                Combine herbs to create elixirs and bombs.
              </p>
            </PrefetchLink>
          ) : (
            <div className="block bg-zinc-800 border border-zinc-700 rounded-lg p-6 opacity-50 cursor-not-allowed">
              <h2 className="text-xl font-semibold text-purple-400 mb-2">⚗️ Brew</h2>
              <p className="text-zinc-400">
                Combine herbs to create elixirs and bombs.
              </p>
              {isLoaded && (
                <span className="text-xs text-zinc-500 mt-2 inline-block">Herbalists only</span>
              )}
            </div>
          )}

          <PrefetchLink
            href="/recipes"
            prefetch="recipes"
            profileId={profileId}
            className="block bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 hover:border-amber-600 rounded-lg p-6 transition-colors"
          >
            <h2 className="text-xl font-semibold text-amber-400 mb-2">📖 Recipes</h2>
            <p className="text-zinc-400">
              View known recipes and unlock new ones.
            </p>
          </PrefetchLink>

        </div>
      </div>
    </div>
  )
}

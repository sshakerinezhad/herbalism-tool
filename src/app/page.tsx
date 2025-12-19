'use client'

import Link from 'next/link'
import { useProfile } from '@/lib/profile'

export default function Home() {
  const { profile, isLoaded } = useProfile()

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">🌿 Herbalism Tool</h1>
            <p className="text-zinc-400">D&D Homebrew Herbalism System</p>
          </div>
          
          <Link
            href="/profile"
            className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg px-4 py-2 text-sm transition-colors"
          >
            {isLoaded && profile.name ? (
              <span>👤 {profile.name}</span>
            ) : (
              <span>👤 Profile</span>
            )}
          </Link>
        </div>

        {/* Profile Summary (if set) */}
        {isLoaded && profile.name && (
          <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700 mb-6">
            <div className="flex gap-6 text-sm">
              <span className="text-zinc-400">
                {profile.isHerbalist ? (
                  <span className="text-green-400">🧪 Herbalist</span>
                ) : (
                  '⚔️ Adventurer'
                )}
              </span>
              <span className="text-zinc-400">
                Foraging: <span className="text-zinc-100">{profile.foragingModifier >= 0 ? '+' : ''}{profile.foragingModifier}</span>
              </span>
              {profile.isHerbalist && (
                <span className="text-zinc-400">
                  Brewing: <span className="text-zinc-100">{profile.brewingModifier >= 0 ? '+' : ''}{profile.brewingModifier}</span>
                </span>
              )}
            </div>
          </div>
        )}

        <div className="grid gap-4">
          <Link
            href="/forage"
            className="block bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 hover:border-green-600 rounded-lg p-6 transition-colors"
          >
            <h2 className="text-xl font-semibold text-green-400 mb-2">🔍 Forage</h2>
            <p className="text-zinc-400">
              Search a biome for herbs. Roll your foraging check and discover what you find.
            </p>
          </Link>

          <Link
            href="/inventory"
            className="block bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 hover:border-blue-600 rounded-lg p-6 transition-colors"
          >
            <h2 className="text-xl font-semibold text-blue-400 mb-2">🎒 Inventory</h2>
            <p className="text-zinc-400">
              View your collected herbs and crafted items.
            </p>
          </Link>

          <Link
            href="/brew"
            className={`block bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 hover:border-purple-600 rounded-lg p-6 transition-colors ${
              !profile.isHerbalist ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            <h2 className="text-xl font-semibold text-purple-400 mb-2">⚗️ Brew</h2>
            <p className="text-zinc-400">
              Combine herbs to create elixirs and bombs.
            </p>
            {!profile.isHerbalist && isLoaded && (
              <span className="text-xs text-zinc-500 mt-2 inline-block">Herbalists only</span>
            )}
          </Link>

          <Link
            href="/recipes"
            className="block bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 hover:border-amber-600 rounded-lg p-6 transition-colors opacity-50 pointer-events-none"
          >
            <h2 className="text-xl font-semibold text-amber-400 mb-2">📖 Recipes</h2>
            <p className="text-zinc-400">
              View known recipes and unlock new ones.
            </p>
            <span className="text-xs text-zinc-500 mt-2 inline-block">Coming soon</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

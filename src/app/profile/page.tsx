'use client'

import { useProfile } from '@/lib/profile'
import Link from 'next/link'

export default function ProfilePage() {
  const { profile, updateProfile, isLoaded, loadError, sessionsUsedToday, longRest } = useProfile()

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-zinc-900 text-zinc-100 p-8">
        <p>Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 p-8">
      <div className="max-w-xl mx-auto">
        <Link href="/" className="text-zinc-400 hover:text-zinc-200 mb-4 inline-block">
          ← Back
        </Link>

        <h1 className="text-3xl font-bold mb-6">👤 Character Profile</h1>

        {/* Error Display */}
        {loadError && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6">
            <p className="text-red-300">{loadError}</p>
            <p className="text-red-400 text-sm mt-1">Using local defaults. Changes may not persist.</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Character Name */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Character Name
            </label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => updateProfile({ name: e.target.value })}
              placeholder="Enter your character's name"
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
            />
          </div>

          {/* Is Herbalist */}
          <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={profile.isHerbalist}
                onChange={(e) => updateProfile({ isHerbalist: e.target.checked })}
                className="w-5 h-5 rounded bg-zinc-700 border-zinc-600 text-green-600 focus:ring-green-500 focus:ring-offset-zinc-800"
              />
              <div>
                <span className="font-medium">Herbalist</span>
                <p className="text-zinc-400 text-sm">
                  Check this if your character has the Herbalist vocation. Only herbalists can brew elixirs and bombs.
                </p>
              </div>
            </label>
          </div>

          {/* Max Foraging Sessions */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Max Foraging Sessions Per Day
            </label>
            <input
              type="number"
              min="1"
              value={profile.maxForagingSessions}
              onChange={(e) => updateProfile({ maxForagingSessions: Math.max(1, parseInt(e.target.value) || 1) })}
              className="w-24 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-500"
            />
            <p className="text-zinc-500 text-sm mt-1">
              Equal to your Intelligence modifier (minimum 1). Resets on long rest.
            </p>
          </div>

          {/* Foraging Modifier */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Foraging Modifier
            </label>
            <input
              type="number"
              value={profile.foragingModifier}
              onChange={(e) => updateProfile({ foragingModifier: parseInt(e.target.value) || 0 })}
              className="w-24 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-500"
            />
            <p className="text-zinc-500 text-sm mt-1">
              Your Nature or Survival bonus (whichever is higher). Used when foraging for herbs.
            </p>
          </div>

          {/* Brewing Modifier */}
          <div className={!profile.isHerbalist ? 'opacity-50' : ''}>
            <label className="block text-sm font-medium mb-2">
              Brewing Modifier
              {!profile.isHerbalist && (
                <span className="text-zinc-500 font-normal ml-2">(Herbalists only)</span>
              )}
            </label>
            <input
              type="number"
              value={profile.brewingModifier}
              onChange={(e) => updateProfile({ brewingModifier: parseInt(e.target.value) || 0 })}
              disabled={!profile.isHerbalist}
              className="w-24 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-500 disabled:cursor-not-allowed"
            />
            <p className="text-zinc-500 text-sm mt-1">
              Your herbalism check bonus. Used when brewing elixirs and bombs.
            </p>
          </div>
        </div>

        {/* Profile Summary */}
        <div className="mt-8 bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
          <h2 className="text-sm font-medium text-zinc-400 mb-3">Profile Summary</h2>
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-zinc-400">Name:</span>{' '}
              <span className="text-zinc-100">{profile.name || '(not set)'}</span>
            </p>
            <p>
              <span className="text-zinc-400">Vocation:</span>{' '}
              <span className={profile.isHerbalist ? 'text-green-400' : 'text-zinc-100'}>
                {profile.isHerbalist ? 'Herbalist' : 'Adventurer'}
              </span>
            </p>
            <p>
              <span className="text-zinc-400">Foraging Sessions:</span>{' '}
              <span className="text-zinc-100">{profile.maxForagingSessions}/day</span>
            </p>
            <p>
              <span className="text-zinc-400">Foraging:</span>{' '}
              <span className="text-zinc-100">
                {profile.foragingModifier >= 0 ? '+' : ''}{profile.foragingModifier}
              </span>
            </p>
            {profile.isHerbalist && (
              <p>
                <span className="text-zinc-400">Brewing:</span>{' '}
                <span className="text-zinc-100">
                  {profile.brewingModifier >= 0 ? '+' : ''}{profile.brewingModifier}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Long Rest Button */}
        {sessionsUsedToday > 0 && (
          <div className="mt-6 bg-blue-900/30 border border-blue-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200">
                  Foraging sessions used today: <strong>{sessionsUsedToday}</strong>
                </p>
              </div>
              <button
                onClick={longRest}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded-lg text-sm font-medium transition-colors"
              >
                🌙 Long Rest
              </button>
            </div>
          </div>
        )}

        <p className="text-zinc-500 text-sm mt-6">
          ✓ Changes are saved automatically to the database.
        </p>
      </div>
    </div>
  )
}

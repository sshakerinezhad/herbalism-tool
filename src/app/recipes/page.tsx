'use client'

import { useEffect, useState, useMemo } from 'react'
import { useProfile } from '@/lib/profile'
import { getUserRecipes, unlockRecipeWithCode, getRecipeStats, UserRecipe } from '@/lib/recipes'
import { Recipe } from '@/lib/types'
import Link from 'next/link'

// Element display
const ELEMENT_SYMBOLS: Record<string, string> = {
  fire: '🔥',
  water: '💧',
  earth: '⛰️',
  air: '💨',
  positive: '✨',
  negative: '💀',
}

function getElementSymbol(element: string): string {
  return ELEMENT_SYMBOLS[element.toLowerCase()] || '●'
}

type ViewTab = 'elixir' | 'bomb'

export default function RecipesPage() {
  const { profileId, isLoaded: profileLoaded } = useProfile()
  const [recipes, setRecipes] = useState<UserRecipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewTab, setViewTab] = useState<ViewTab>('elixir')
  
  // Unlock code state
  const [showUnlockModal, setShowUnlockModal] = useState(false)
  const [unlockCode, setUnlockCode] = useState('')
  const [unlockLoading, setUnlockLoading] = useState(false)
  const [unlockResult, setUnlockResult] = useState<{
    success: boolean
    message: string
    recipe?: Recipe
  } | null>(null)
  
  // Stats
  const [stats, setStats] = useState<{
    known: number
    totalBase: number
    secretsUnlocked: number
  } | null>(null)

  // Load recipes
  useEffect(() => {
    async function loadData() {
      if (!profileLoaded || !profileId) return

      const [recipesResult, statsResult] = await Promise.all([
        getUserRecipes(profileId),
        getRecipeStats(profileId)
      ])

      if (recipesResult.error) {
        setError(recipesResult.error)
      } else {
        setRecipes(recipesResult.recipes)
      }

      if (!statsResult.error) {
        setStats({
          known: statsResult.known,
          totalBase: statsResult.totalBase,
          secretsUnlocked: statsResult.secretsUnlocked,
        })
      }

      setLoading(false)
    }

    loadData()
  }, [profileLoaded, profileId])

  // Group recipes by type
  const elixirRecipes = useMemo(
    () => recipes.filter(r => r.type === 'elixir').sort((a, b) => a.name.localeCompare(b.name)),
    [recipes]
  )
  
  const bombRecipes = useMemo(
    () => recipes.filter(r => r.type === 'bomb').sort((a, b) => a.name.localeCompare(b.name)),
    [recipes]
  )

  const currentRecipes = viewTab === 'elixir' ? elixirRecipes : bombRecipes

  // Handle unlock attempt
  async function handleUnlock() {
    if (!profileId || !unlockCode.trim()) return

    setUnlockLoading(true)
    setUnlockResult(null)

    const result = await unlockRecipeWithCode(profileId, unlockCode)

    if (result.success && result.recipe) {
      setUnlockResult({
        success: true,
        message: `Recipe unlocked: ${result.recipe.name}!`,
        recipe: result.recipe,
      })
      
      // Reload recipes
      const recipesResult = await getUserRecipes(profileId)
      if (!recipesResult.error) {
        setRecipes(recipesResult.recipes)
      }
      
      // Reload stats
      const statsResult = await getRecipeStats(profileId)
      if (!statsResult.error) {
        setStats({
          known: statsResult.known,
          totalBase: statsResult.totalBase,
          secretsUnlocked: statsResult.secretsUnlocked,
        })
      }
    } else {
      setUnlockResult({
        success: false,
        message: result.error || 'Unknown error',
      })
    }

    setUnlockLoading(false)
  }

  function closeModal() {
    setShowUnlockModal(false)
    setUnlockCode('')
    setUnlockResult(null)
  }

  if (!profileLoaded || loading) {
    return (
      <div className="min-h-screen bg-zinc-900 text-zinc-100 p-8">
        <p>Loading recipes...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 p-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-zinc-400 hover:text-zinc-200 mb-4 inline-block">
          ← Back
        </Link>

        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-1">📖 Recipe Book</h1>
            {stats && (
              <p className="text-zinc-500 text-sm">
                {stats.known} recipe{stats.known !== 1 ? 's' : ''} known
                {stats.secretsUnlocked > 0 && (
                  <span className="text-amber-500 ml-2">
                    • {stats.secretsUnlocked} secret{stats.secretsUnlocked !== 1 ? 's' : ''} unlocked
                  </span>
                )}
              </p>
            )}
          </div>
          
          <button
            onClick={() => setShowUnlockModal(true)}
            className="px-4 py-2 bg-amber-700 hover:bg-amber-600 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <span>🔓</span>
            <span>Discover Recipe</span>
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Type Tabs */}
        <div className="flex gap-2 mb-6 border-b border-zinc-800 pb-4">
          <button
            onClick={() => setViewTab('elixir')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewTab === 'elixir'
                ? 'bg-blue-700 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            🧪 Elixirs
            <span className="ml-2 text-xs opacity-70">({elixirRecipes.length})</span>
          </button>
          <button
            onClick={() => setViewTab('bomb')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewTab === 'bomb'
                ? 'bg-red-700 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            💣 Bombs
            <span className="ml-2 text-xs opacity-70">({bombRecipes.length})</span>
          </button>
        </div>

        {/* Empty State */}
        {currentRecipes.length === 0 && (
          <div className="bg-zinc-800/50 rounded-lg p-8 text-center">
            <p className="text-zinc-400 mb-4">
              No {viewTab} recipes known yet
            </p>
          </div>
        )}

        {/* Recipe List */}
        <div className="space-y-4">
          {currentRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </div>

      {/* Unlock Modal */}
      {showUnlockModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-800 rounded-xl border border-zinc-700 max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>🔓</span>
              <span>Discover New Recipe</span>
            </h2>
            
            <p className="text-zinc-400 text-sm mb-4">
              Enter a secret code to unlock a hidden recipe. Codes are discovered through 
              gameplay, quests, or special discoveries in the world.
            </p>

            <div className="space-y-4">
              <input
                type="text"
                value={unlockCode}
                onChange={(e) => setUnlockCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                placeholder="Enter unlock code..."
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-amber-500 text-center font-mono tracking-wider"
                autoFocus
              />

              {/* Result Message */}
              {unlockResult && (
                <div className={`p-4 rounded-lg ${
                  unlockResult.success
                    ? 'bg-green-900/30 border border-green-700'
                    : 'bg-red-900/30 border border-red-700'
                }`}>
                  <p className={unlockResult.success ? 'text-green-300' : 'text-red-300'}>
                    {unlockResult.success ? '✓ ' : '✗ '}{unlockResult.message}
                  </p>
                  {unlockResult.recipe && (
                    <div className="mt-3 pt-3 border-t border-green-700/50">
                      <p className="text-zinc-300 text-sm">
                        <span className="mr-2">
                          {unlockResult.recipe.elements.map((el, i) => (
                            <span key={i}>{getElementSymbol(el)}</span>
                          ))}
                        </span>
                        <strong>{unlockResult.recipe.name}</strong>
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={closeModal}
                  className="flex-1 py-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg font-medium transition-colors"
                >
                  {unlockResult?.success ? 'Close' : 'Cancel'}
                </button>
                {!unlockResult?.success && (
                  <button
                    onClick={handleUnlock}
                    disabled={!unlockCode.trim() || unlockLoading}
                    className="flex-1 py-3 bg-amber-700 hover:bg-amber-600 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg font-semibold transition-colors"
                  >
                    {unlockLoading ? 'Checking...' : 'Unlock'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Recipe Card Component
function RecipeCard({ recipe }: { recipe: UserRecipe }) {
  // Parse description to show potency template
  const displayDescription = recipe.description
    ? recipe.description
        .replace(/\{n\}/g, '×')
        .replace(/\{n\*(\d+)\}/g, '×$1')
        .replace(/\{n\+(\d+)\}/g, '+$1')
        .replace(/\{([^:}]+):([^}]+)\}/g, '[$1]') // Replace choice templates with [variable]
    : null

  const isElixir = recipe.type === 'elixir'

  return (
    <div
      className={`relative rounded-lg overflow-hidden shadow-lg ${
        isElixir
          ? 'bg-gradient-to-br from-blue-950/80 via-blue-900/40 to-blue-950/60'
          : 'bg-gradient-to-br from-red-950/80 via-red-900/40 to-red-950/60'
      }`}
    >
      {/* Left accent bar */}
      <div 
        className={`absolute left-0 top-0 bottom-0 w-1 ${
          isElixir ? 'bg-blue-500' : 'bg-red-500'
        }`} 
      />
      
      <div className="pl-5 pr-4 py-4">
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Name and elements */}
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-zinc-100 text-lg leading-tight">
                {recipe.name}
              </h3>
              {/* Elements inline with name */}
              <div className="flex items-center gap-0.5">
                {recipe.elements.map((el, i) => (
                  <span 
                    key={i} 
                    title={el}
                    className={`text-base px-1.5 py-0.5 rounded ${
                      isElixir ? 'bg-blue-800/50' : 'bg-red-800/50'
                    }`}
                  >
                    {getElementSymbol(el)}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          {/* Secret badge */}
          {recipe.is_secret && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-medium">
              ✦ Secret
            </span>
          )}
        </div>

        {/* Effect box */}
        {displayDescription && (
          <div className={`rounded-md px-3 py-2.5 mb-2 ${
            isElixir 
              ? 'bg-zinc-900/80 border border-blue-600/40' 
              : 'bg-zinc-900/80 border border-red-600/40'
          }`}>
            <p className="text-zinc-100 text-sm leading-relaxed">
              <span className={`font-semibold uppercase text-xs tracking-wide mr-2 ${
                isElixir ? 'text-blue-400' : 'text-red-400'
              }`}>
                Effect:
              </span>
              {displayDescription}
            </p>
          </div>
        )}

        {/* Lore text - parchment scroll style */}
        {recipe.lore && (
          <div className="relative mt-3">
            {/* Scroll edges */}
            <div className="absolute -left-1 top-0 bottom-0 w-3 bg-gradient-to-r from-amber-900/40 to-transparent rounded-l-full" />
            <div className="absolute -right-1 top-0 bottom-0 w-3 bg-gradient-to-l from-amber-900/40 to-transparent rounded-r-full" />
            
            {/* Parchment body */}
            <div className="relative bg-gradient-to-b from-amber-100 to-amber-50 rounded px-4 py-2.5 shadow-inner">
              {/* Subtle texture overlay */}
              <div 
                className="absolute inset-0 opacity-[0.15] rounded pointer-events-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                }}
              />
              <p className="relative text-amber-950 text-sm italic leading-relaxed font-serif whitespace-pre-line">
                {recipe.lore}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


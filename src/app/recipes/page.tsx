'use client'

/**
 * Recipes Page
 * 
 * Displays the user's recipe book organized by type (elixirs, bombs, oils).
 * Allows unlocking secret recipes with codes.
 */

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { useCharacter, useCharacterRecipesNew, useCharacterRecipeStats, useInvalidateQueries } from '@/lib/hooks'
import { unlockCharacterRecipeWithCode } from '@/lib/db/characterInventory'
import { Recipe, CharacterRecipe } from '@/lib/types'
import { getElementSymbol } from '@/lib/constants'
import { PageLayout, ErrorDisplay, RecipesSkeleton } from '@/components/ui'
import { RecipeCard } from '@/components/recipes'

type ViewTab = 'elixir' | 'bomb' | 'oil'

// Tab configuration for recipe types
const RECIPE_TABS: { type: ViewTab; label: string; icon: string; activeClass: string }[] = [
  { type: 'elixir', label: 'Elixirs', icon: '🧪', activeClass: 'bg-blue-700' },
  { type: 'bomb', label: 'Bombs', icon: '💣', activeClass: 'bg-red-700' },
  { type: 'oil', label: 'Oils', icon: '🗡️', activeClass: 'bg-amber-600' },
]

// Type descriptions shown below tabs
const TYPE_DESCRIPTIONS: Record<ViewTab, { icon: string; text: string; className: string }> = {
  elixir: {
    icon: '🧪',
    text: 'Elixirs are consumables imbibed to grant beneficial effects to the drinker, such as healing or enhanced defenses.',
    className: 'bg-blue-950/40 border-blue-500 text-blue-200',
  },
  bomb: {
    icon: '💣',
    text: "Bombs are volatile concoctions that explode on impact, dealing damage or creating hazardous areas that affect enemies. A bomb's DC is 8 + your proficiency bonus + brewing modifier.\n\nBombs can also be fixed to arrows, replacing their normal damage with the effect of the bomb.",
    className: 'bg-red-950/40 border-red-500 text-red-200',
  },
  oil: {
    icon: '🗡️',
    text: 'Oils are applied to weapons to enhance them, adding damage, precision, or some other temporary effect.',
    className: 'bg-amber-950/40 border-amber-500 text-amber-200',
  },
}

export default function RecipesPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { invalidateCharacterRecipes } = useInvalidateQueries()

  // Character data - herbalism is now character-based
  const { data: character, isLoading: characterLoading } = useCharacter(user?.id ?? null)
  const characterId = character?.id ?? null

  // React Query handles data fetching and caching
  const {
    data: characterRecipes = [],
    isLoading: recipesLoading,
    error: recipesError
  } = useCharacterRecipesNew(characterId)

  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError
  } = useCharacterRecipeStats(characterId ?? undefined)

  // Map CharacterRecipe[] to Recipe[] for rendering (filter missing joins)
  const recipes = useMemo(() => {
    return characterRecipes
      .filter((cr: CharacterRecipe) => cr.recipe)
      .map((cr: CharacterRecipe) => cr.recipe as Recipe)
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [characterRecipes])
  
  const [viewTab, setViewTab] = useState<ViewTab>('elixir')
  
  // Unlock modal state
  const [showUnlockModal, setShowUnlockModal] = useState(false)
  const [unlockCode, setUnlockCode] = useState('')
  const [unlockLoading, setUnlockLoading] = useState(false)
  const [unlockResult, setUnlockResult] = useState<{
    success: boolean
    message: string
    recipe?: Recipe
  } | null>(null)
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [authLoading, user, router])

  // Derived loading and error state
  const loading = authLoading || characterLoading || recipesLoading || statsLoading
  const error = recipesError?.message || statsError?.message

  // Group recipes by type
  const recipesByType = useMemo(() => ({
    elixir: recipes.filter(r => r.type === 'elixir').sort((a, b) => a.name.localeCompare(b.name)),
    bomb: recipes.filter(r => r.type === 'bomb').sort((a, b) => a.name.localeCompare(b.name)),
    oil: recipes.filter(r => r.type === 'oil').sort((a, b) => a.name.localeCompare(b.name)),
  }), [recipes])

  const currentRecipes = recipesByType[viewTab]

  // Handle unlock attempt
  async function handleUnlock() {
    if (!characterId || !unlockCode.trim()) return

    setUnlockLoading(true)
    setUnlockResult(null)

    const result = await unlockCharacterRecipeWithCode(characterId, unlockCode)

    if (result.success && result.recipe) {
      setUnlockResult({
        success: true,
        message: `Recipe unlocked: ${result.recipe.name}!`,
        recipe: result.recipe,
      })

      // Invalidate recipes cache to show the new recipe
      invalidateCharacterRecipes(characterId)
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

  if (loading) {
    return <RecipesSkeleton />
  }

  // Show character requirement CTA if no character exists
  if (!character) {
    return (
      <PageLayout maxWidth="max-w-3xl">
        <div className="bg-zinc-800/50 rounded-lg p-8 text-center">
          <p className="text-zinc-400 mb-4">You need a character to access the recipe book</p>
          <a
            href="/profile"
            className="inline-block px-4 py-2 bg-emerald-700 hover:bg-emerald-600 rounded-lg text-sm font-medium transition-colors"
          >
            Create Character
          </a>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout maxWidth="max-w-3xl">
      {/* Header */}
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

      {error && <ErrorDisplay message={error} className="mb-6" />}

        {/* Type Tabs */}
        <div className="flex gap-2 mb-6 border-b border-zinc-800 pb-4">
        {RECIPE_TABS.map(tab => (
          <button
            key={tab.type}
            onClick={() => setViewTab(tab.type)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewTab === tab.type
                ? `${tab.activeClass} text-white`
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tab.icon} {tab.label}
            <span className="ml-2 text-xs opacity-70">({recipesByType[tab.type].length})</span>
          </button>
        ))}
        </div>

        {/* Type Description */}
      <TypeDescription type={viewTab} />

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

      {/* Unlock Modal */}
      {showUnlockModal && (
        <UnlockModal
          code={unlockCode}
          onCodeChange={setUnlockCode}
          onUnlock={handleUnlock}
          onClose={closeModal}
          loading={unlockLoading}
          result={unlockResult}
        />
      )}
    </PageLayout>
  )
}

// ============ Sub-components ============

function TypeDescription({ type }: { type: ViewTab }) {
  const config = TYPE_DESCRIPTIONS[type]
  
  return (
    <div className={`mb-6 rounded-lg px-4 py-3 border-l-4 ${config.className}`}>
      <div className="flex items-start gap-3">
        <span className="text-xl mt-0.5">{config.icon}</span>
        <p className="text-sm leading-relaxed whitespace-pre-line">
          {config.text}
        </p>
      </div>
    </div>
  )
}

type UnlockModalProps = {
  code: string
  onCodeChange: (code: string) => void
  onUnlock: () => void
  onClose: () => void
  loading: boolean
  result: { success: boolean; message: string; recipe?: Recipe } | null
}

function UnlockModal({ code, onCodeChange, onUnlock, onClose, loading, result }: UnlockModalProps) {
  return (
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
            value={code}
            onChange={(e) => onCodeChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onUnlock()}
                placeholder="Enter unlock code..."
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-amber-500 text-center font-mono tracking-wider"
                autoFocus
              />

              {/* Result Message */}
          {result && (
                <div className={`p-4 rounded-lg ${
              result.success
                    ? 'bg-green-900/30 border border-green-700'
                    : 'bg-red-900/30 border border-red-700'
                }`}>
              <p className={result.success ? 'text-green-300' : 'text-red-300'}>
                {result.success ? '✓ ' : '✗ '}{result.message}
                  </p>
              {result.recipe && (
                    <div className="mt-3 pt-3 border-t border-green-700/50">
                      <p className="text-zinc-300 text-sm">
                        <span className="mr-2">
                      {result.recipe.elements.map((el, i) => (
                            <span key={i}>{getElementSymbol(el)}</span>
                          ))}
                        </span>
                    <strong>{result.recipe.name}</strong>
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button
              onClick={onClose}
                  className="flex-1 py-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg font-medium transition-colors"
                >
              {result?.success ? 'Close' : 'Cancel'}
                </button>
            {!result?.success && (
                  <button
                onClick={onUnlock}
                disabled={!code.trim() || loading}
                    className="flex-1 py-3 bg-amber-700 hover:bg-amber-600 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg font-semibold transition-colors"
                  >
                {loading ? 'Checking...' : 'Unlock'}
                  </button>
                )}
              </div>
            </div>
      </div>
    </div>
  )
}

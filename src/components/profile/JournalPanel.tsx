'use client'

/**
 * JournalPanel — Recipe book panel for the profile page
 *
 * Displays the character's known recipes organized by type (elixirs, bombs, balms)
 * with an unlock modal for discovering secret recipes via codes.
 */

import { useState, useMemo } from 'react'
import { useCharacterRecipesNew, useCharacterRecipeStats, useInvalidateQueries } from '@/lib/hooks'
import { unlockCharacterRecipeWithCode } from '@/lib/db/characterInventory'
import { Recipe, CharacterRecipe, Character } from '@/lib/types'
import { getElementSymbol } from '@/lib/constants'
import { ErrorDisplay, RecipesSkeleton, Modal } from '@/components/ui'
import { RecipeCard } from '@/components/recipes'

type ViewTab = 'elixir' | 'bomb' | 'balm'

// Tab configuration for recipe types
const RECIPE_TABS: { type: ViewTab; label: string }[] = [
  { type: 'elixir', label: 'Elixirs' },
  { type: 'bomb', label: 'Bombs' },
  { type: 'balm', label: 'Balms' },
]

// Type descriptions shown below tabs
const TYPE_DESCRIPTIONS: Record<ViewTab, { text: string; color: string }> = {
  elixir: {
    text: 'Elixirs are consumables imbibed to grant beneficial effects to the drinker, such as healing or enhanced defenses.',
    color: 'rgba(59,130,246,0.15)',
  },
  bomb: {
    text: "Bombs are volatile concoctions that explode on impact, dealing damage or creating hazardous areas that affect enemies. A bomb's DC is 8 + your proficiency bonus + brewing modifier.\n\nBombs can also be fixed to arrows, replacing their normal damage with the effect of the bomb.",
    color: 'rgba(239,68,68,0.15)',
  },
  balm: {
    text: 'Balms are applied to weapons to enhance them, adding damage, precision, or some other temporary effect.',
    color: 'rgba(245,158,11,0.15)',
  },
}

type JournalPanelProps = {
  character: Character
}

export function JournalPanel({ character }: JournalPanelProps) {
  const characterId = character.id
  const { invalidateCharacterRecipes } = useInvalidateQueries()

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
  } = useCharacterRecipeStats(characterId)

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

  // Derived loading and error state
  const loading = recipesLoading || statsLoading
  const error = recipesError?.message || statsError?.message

  // Group recipes by type
  const recipesByType = useMemo(() => ({
    elixir: recipes.filter(r => r.type === 'elixir').sort((a, b) => a.name.localeCompare(b.name)),
    bomb: recipes.filter(r => r.type === 'bomb').sort((a, b) => a.name.localeCompare(b.name)),
    balm: recipes.filter(r => r.type === 'balm').sort((a, b) => a.name.localeCompare(b.name)),
  }), [recipes])

  const currentRecipes = recipesByType[viewTab]

  // Handle unlock attempt
  async function handleUnlock() {
    if (!unlockCode.trim()) return

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

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mb-5">
        <div>
          <h1 className="font-heading text-2xl text-bronze-bright mb-1">Recipe Book</h1>
          {stats && (
            <p className="font-ui text-[10px] text-vellum-400/50 tracking-wide">
              {stats.known} recipe{stats.known !== 1 ? 's' : ''} known
              {stats.secretsUnlocked > 0 && (
                <span className="text-bronze-bright/60 ml-2">
                  • {stats.secretsUnlocked} secret{stats.secretsUnlocked !== 1 ? 's' : ''}
                </span>
              )}
            </p>
          )}
        </div>

        <button
          onClick={() => setShowUnlockModal(true)}
          className="btn btn-secondary px-4 py-2 text-sm rounded-full"
        >
          Discover Recipe
        </button>
      </div>

      {error && <ErrorDisplay message={error} className="mb-6" />}

      {/* Type Tabs — grimoire sub-tabs */}
      <div className="flex items-center mb-5" style={{ borderBottom: '1px solid var(--soot)' }}>
        {RECIPE_TABS.map(tab => (
          <button
            key={tab.type}
            onClick={() => setViewTab(tab.type)}
            className={viewTab === tab.type ? 'sub-tab-active' : 'sub-tab-inactive'}
          >
            {tab.label}
            <span className="ml-1.5 font-ui text-[10px] opacity-50">({recipesByType[tab.type].length})</span>
          </button>
        ))}
      </div>

      {/* Type Description */}
      <TypeDescription type={viewTab} />

      {/* Empty State */}
      {currentRecipes.length === 0 && (
        <div className="elevation-raised rounded-lg p-8 text-center">
          <p className="text-vellum-400">
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
    </div>
  )
}

// ============ Sub-components ============

function TypeDescription({ type }: { type: ViewTab }) {
  const config = TYPE_DESCRIPTIONS[type]

  return (
    <div
      className="mb-5 rounded-lg px-4 py-3"
      style={{
        background: config.color,
        borderLeft: '2px solid rgba(201,169,110,0.2)',
      }}
    >
      <p className="text-sm text-vellum-200/70 leading-relaxed whitespace-pre-line">
        {config.text}
      </p>
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
    <Modal open={true} onClose={onClose} title="Discover New Recipe">
      <div className="space-y-4">
        <p className="text-vellum-400 text-sm">
          Enter a secret code to unlock a hidden recipe. Codes are discovered through
          gameplay, quests, or special discoveries in the world.
        </p>

        <input
          type="text"
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onUnlock()}
          placeholder="Enter unlock code..."
          className="w-full px-4 py-3 rounded-lg text-center font-mono tracking-wider text-vellum-50 outline-none"
          style={{
            background: 'rgba(0,0,0,0.25)',
            border: '1px solid var(--sepia-700)',
            caretColor: 'var(--bronze-bright)',
          }}
          autoFocus
        />

        {result && (
          <div className={`p-4 rounded-lg ${
            result.success
              ? 'border'
              : 'bg-red-900/30 border border-red-700'
          }`}
          style={result.success ? { background: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)' } : undefined}
          >
            <p className={result.success ? 'text-green-300' : 'text-red-300'}>
              {result.success ? '✓ ' : '✗ '}{result.message}
            </p>
            {result.recipe && (
              <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(34,197,94,0.2)' }}>
                <p className="text-vellum-200 text-sm">
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
          <button onClick={onClose} className="btn btn-secondary flex-1 py-3 rounded-lg">
            {result?.success ? 'Close' : 'Cancel'}
          </button>
          {!result?.success && (
            <button
              onClick={onUnlock}
              disabled={!code.trim() || loading}
              className="btn btn-primary flex-1 py-3 rounded-lg"
            >
              {loading ? 'Checking...' : 'Unlock'}
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}

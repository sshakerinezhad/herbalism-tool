/**
 * RecipeCard - Display a recipe with its elements, effects, and lore
 * 
 * Used in the recipes page to show recipe details in a styled card format.
 */

import { Recipe } from '@/lib/types'
import { getElementSymbol } from '@/lib/constants'

type RecipeCardProps = {
  recipe: Recipe & { userRecipeId?: number }
}

// Type-based styling configurations
const TYPE_STYLES = {
  elixir: {
    gradient: 'bg-gradient-to-br from-blue-950/80 via-blue-900/40 to-blue-950/60',
    accent: 'bg-blue-500',
    elementBg: 'bg-blue-800/50',
    effectBorder: 'border-blue-600/40',
    effectLabel: 'text-blue-400',
  },
  bomb: {
    gradient: 'bg-gradient-to-br from-red-950/80 via-red-900/40 to-red-950/60',
    accent: 'bg-red-500',
    elementBg: 'bg-red-800/50',
    effectBorder: 'border-red-600/40',
    effectLabel: 'text-red-400',
  },
  oil: {
    gradient: 'bg-gradient-to-br from-amber-950/80 via-amber-900/40 to-amber-950/60',
    accent: 'bg-amber-500',
    elementBg: 'bg-amber-800/50',
    effectBorder: 'border-amber-600/40',
    effectLabel: 'text-amber-400',
  },
} as const

export function RecipeCard({ recipe }: RecipeCardProps) {
  // Use recipe_text for clean display (no variable codes)
  const displayDescription = recipe.recipe_text || null
  const recipeType = recipe.type as keyof typeof TYPE_STYLES
  const styles = TYPE_STYLES[recipeType] || TYPE_STYLES.elixir

  return (
    <div className={`relative rounded-lg overflow-hidden shadow-lg ${styles.gradient}`}>
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${styles.accent}`} />
      
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
                    className={`text-base px-1.5 py-0.5 rounded ${styles.elementBg}`}
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
          <div className="mb-2">
            <div className={`rounded-md px-3 py-2.5 bg-zinc-900/80 border ${styles.effectBorder}`}>
              <p className="text-zinc-100 text-sm leading-relaxed">
                <span className={`font-semibold uppercase text-xs tracking-wide mr-2 ${styles.effectLabel}`}>
                  Effect:
                </span>
                {displayDescription}
              </p>
            </div>
            {displayDescription.includes('*') && (
              <p className="text-zinc-500 text-xs italic mt-1 pl-1">
                * indicates this portion of the effect is stackable
              </p>
            )}
          </div>
        )}

        {/* Lore text - parchment scroll style */}
        {recipe.lore && (
          <RecipeLore lore={recipe.lore} />
        )}
      </div>
    </div>
  )
}

/**
 * RecipeLore - Parchment-style lore text display
 */
function RecipeLore({ lore }: { lore: string }) {
  return (
    <div className="relative mt-3">
      {/* Scroll edges */}
      <div className="absolute -left-1 top-0 bottom-0 w-3 bg-gradient-to-r from-amber-900/40 to-transparent rounded-l-full" />
      <div className="absolute -right-1 top-0 bottom-0 w-3 bg-gradient-to-l from-amber-900/40 to-transparent rounded-r-full" />
      
      {/* Parchment body */}
      <div className="relative bg-gradient-to-b from-amber-100/70 to-amber-50/70 rounded px-4 py-2.5 shadow-inner">
        {/* Subtle texture overlay */}
        <div 
          className="absolute inset-0 opacity-[0.15] rounded pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
        <p className="relative text-amber-950 text-sm italic leading-relaxed font-serif whitespace-pre-line">
          {lore}
        </p>
      </div>
    </div>
  )
}


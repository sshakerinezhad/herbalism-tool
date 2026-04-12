/**
 * RecipeSelector - Select recipes for "By Recipe" brewing mode
 */

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { Recipe } from '@/lib/types'
import { getElementSymbol } from '@/lib/constants'

type SelectedRecipe = {
  recipe: Recipe
  count: number
}

type RecipeSelectorProps = {
  recipes: Recipe[]
  selectedRecipes: SelectedRecipe[]
  batchCount: number
  requiredElements: Map<string, number>
  initialRecipeId?: number
  onAddRecipe: (recipe: Recipe) => void
  onRemoveRecipe: (recipeId: number) => void
  onBatchCountChange: (count: number) => void
  onProceed: () => void
}

export function RecipeSelector({
  recipes,
  selectedRecipes,
  batchCount,
  requiredElements,
  initialRecipeId,
  onAddRecipe,
  onRemoveRecipe,
  onBatchCountChange,
  onProceed,
}: RecipeSelectorProps) {
  // Auto-select recipe from URL param on mount
  const autoSelected = useRef(false)
  useEffect(() => {
    if (initialRecipeId && !autoSelected.current && recipes.length > 0 && selectedRecipes.length === 0) {
      const recipe = recipes.find(r => r.id === initialRecipeId)
      if (recipe) {
        onAddRecipe(recipe)
        autoSelected.current = true
      }
    }
  }, [initialRecipeId, recipes, selectedRecipes.length, onAddRecipe])

  const elixirRecipes = recipes.filter(r => r.type === 'elixir')
  const bombRecipes = recipes.filter(r => r.type === 'bomb')
  const balmRecipes = recipes.filter(r => r.type === 'balm')

  // Get first selected type (to enforce single-type brewing)
  const firstType = selectedRecipes.length > 0 ? selectedRecipes[0].recipe.type : null

  return (
    <div className="space-y-6">
      {/* Selected Recipes Summary */}
      <SelectedRecipesSummary
        selectedRecipes={selectedRecipes}
        batchCount={batchCount}
        requiredElements={requiredElements}
        onRemove={onRemoveRecipe}
        onBatchCountChange={onBatchCountChange}
        onProceed={onProceed}
      />

      {/* Recipe Lists by Type */}
      <div>
        <h2 className="font-semibold mb-3">Your Recipe Book</h2>
        {recipes.length === 0 ? (
          <div className="elevation-base/50 rounded-lg p-6 text-center">
            <p className="text-vellum-400 mb-4">No recipes known</p>
            <Link
              href="/"
              className="inline-block px-4 py-2 bg-amber-700 hover:bg-amber-600 rounded-lg text-sm font-medium transition-colors"
            >
              📖 View Recipe Book
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <RecipeColumn
              title="Elixirs"
              icon="🧪"
              recipes={elixirRecipes}
              selectedRecipes={selectedRecipes}
              firstType={firstType}
              onAdd={onAddRecipe}
              columnStyle="text-blue-400 border-blue-900/50 bg-blue-950/30 hover:bg-blue-900/40"
            />
            <RecipeColumn
              title="Bombs"
              icon="💣"
              recipes={bombRecipes}
              selectedRecipes={selectedRecipes}
              firstType={firstType}
              onAdd={onAddRecipe}
              columnStyle="text-red-400 border-red-900/50 bg-red-950/30 hover:bg-red-900/40"
            />
            <RecipeColumn
              title="Balms"
              icon="🩸"
              recipes={balmRecipes}
              selectedRecipes={selectedRecipes}
              firstType={firstType}
              onAdd={onAddRecipe}
              columnStyle="text-amber-400 border-amber-900/50 bg-amber-950/30 hover:bg-amber-900/40"
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ============ Sub-components ============

function SelectedRecipesSummary({
  selectedRecipes,
  batchCount,
  requiredElements,
  onRemove,
  onBatchCountChange,
  onProceed,
}: {
  selectedRecipes: SelectedRecipe[]
  batchCount: number
  requiredElements: Map<string, number>
  onRemove: (recipeId: number) => void
  onBatchCountChange: (count: number) => void
  onProceed: () => void
}) {
  const totalEffects = selectedRecipes.reduce((sum, r) => sum + r.count, 0)

  return (
    <div className="elevation-base rounded-lg p-4 border border-sepia-700/40">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-semibold">Selected Recipes</h2>
        <span className="text-vellum-400 text-sm">
          {totalEffects} effect{totalEffects !== 1 ? 's' : ''}
        </span>
      </div>
      
      {selectedRecipes.length === 0 ? (
        <p className="text-vellum-400/60 text-sm">Select recipes from your recipe book below</p>
      ) : (
        <div className="space-y-2">
          {selectedRecipes.map(({ recipe, count }) => (
            <div 
              key={recipe.id}
              className="flex items-center justify-between py-2 px-3 bg-sepia-800/50/50 rounded"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">
                  {recipe.elements.map((el, i) => (
                    <span key={i}>{getElementSymbol(el)}</span>
                  ))}
                </span>
                <span className="text-vellum-100">{recipe.name}</span>
                {count > 1 && (
                  <span className="text-purple-400 text-sm">×{count}</span>
                )}
              </div>
              <button
                onClick={() => onRemove(recipe.id)}
                className="text-vellum-400 hover:text-red-400 transition-colors"
              >
                −
              </button>
            </div>
          ))}
          
          {/* Batch Count */}
          <div className="pt-3 border-t border-sepia-700/40 mt-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-vellum-200 text-sm font-medium">Brew Quantity</span>
                <p className="text-vellum-400/60 text-xs">Make multiple of this exact brew</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onBatchCountChange(Math.max(1, batchCount - 1))}
                  disabled={batchCount <= 1}
                  className="w-8 h-8 rounded btn-secondary disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-lg transition-colors"
                >
                  −
                </button>
                <span className="w-8 text-center font-bold text-purple-400">
                  {batchCount}
                </span>
                <button
                  onClick={() => onBatchCountChange(batchCount + 1)}
                  className="w-8 h-8 rounded btn-secondary flex items-center justify-center text-lg transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Required elements */}
          <div className="pt-3 border-t border-sepia-700/40 mt-3">
            <span className="text-vellum-400 text-sm mr-2">
              Required elements {batchCount > 1 && `(×${batchCount})`}:
            </span>
            {Array.from(requiredElements.entries()).map(([el, count]) => (
              <span key={el} className="mr-2">
                {count <= 6 ? (
                  Array(count).fill(0).map((_, i) => (
                    <span key={i} title={el}>{getElementSymbol(el)}</span>
                  ))
                ) : (
                  <span>{getElementSymbol(el)}×{count}</span>
                )}
              </span>
            ))}
          </div>
          
          {/* Proceed Button */}
          <button
            onClick={onProceed}
            className="w-full mt-4 py-3 btn-primary rounded-lg font-semibold transition-colors"
          >
            {batchCount > 1 
              ? `Find Herbs for ${batchCount} Brews →`
              : 'Find Matching Herbs →'
            }
          </button>
        </div>
      )}
    </div>
  )
}

function RecipeColumn({
  title,
  icon,
  recipes,
  selectedRecipes,
  firstType,
  onAdd,
  columnStyle,
}: {
  title: string
  icon: string
  recipes: Recipe[]
  selectedRecipes: SelectedRecipe[]
  firstType: string | null
  onAdd: (recipe: Recipe) => void
  columnStyle: string
}) {
  const [titleColor, borderColor, bgColor, hoverColor] = columnStyle.split(' ')

  return (
    <div className="space-y-2">
      <h3 className={`text-sm font-medium flex items-center gap-2 pb-2 border-b ${titleColor} ${borderColor}`}>
        <span>{icon}</span> {title}
      </h3>
      {recipes.map(recipe => {
        const selected = selectedRecipes.find(r => r.recipe.id === recipe.id)
        const isCompatible = !firstType || recipe.type === firstType
        
        return (
          <button
            key={recipe.id}
            onClick={() => isCompatible && onAdd(recipe)}
            disabled={!isCompatible}
            className={`w-full py-2 px-2 rounded text-left text-sm transition-colors ${
              selected
                ? 'bg-purple-900/40 border border-purple-700'
                : !isCompatible
                  ? 'elevation-base/20 opacity-30 cursor-not-allowed'
                  : `${bgColor} ${hoverColor} border border-transparent`
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-sm flex-shrink-0">
                  {recipe.elements.map((el, i) => (
                    <span key={i}>{getElementSymbol(el)}</span>
                  ))}
                </span>
                <span className={`truncate ${selected ? 'text-purple-300' : 'text-vellum-100'}`}>
                  {recipe.name}
                </span>
              </div>
              <span className={`${titleColor} flex-shrink-0`}>+</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}


/**
 * RecipeRequirements Component
 *
 * Displays selected recipes and element requirements with fulfillment status
 * Used in "by-recipe" mode to show progress towards brewing requirements
 */

import { getElementSymbol } from '@/lib/constants'
import type { SelectedRecipe, InventoryItem } from './types'

type RecipeRequirementsProps = {
  selectedRecipes: SelectedRecipe[]
  requiredElements: Map<string, number>
  selectedHerbQuantities: Map<number, number>
  inventory: InventoryItem[]
  batchCount: number
}

export function RecipeRequirements({
  selectedRecipes,
  requiredElements,
  selectedHerbQuantities,
  inventory,
  batchCount,
}: RecipeRequirementsProps) {
  return (
    <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
      <h2 className="font-semibold mb-3">Brewing</h2>
      <div className="space-y-2">
        {selectedRecipes.map(({ recipe, count }) => (
          <div key={recipe.id} className="flex items-center gap-3 text-sm">
            <span>
              {recipe.elements.map((el, i) => (
                <span key={i}>{getElementSymbol(el)}</span>
              ))}
            </span>
            <span className="text-zinc-200">{recipe.name}</span>
            {count > 1 && <span className="text-purple-400">×{count}</span>}
          </div>
        ))}
      </div>

      {/* Element requirements with fulfillment status */}
      <div className="pt-3 mt-3 border-t border-zinc-700">
        <p className="text-zinc-400 text-sm mb-2">Required elements:</p>
        <div className="flex flex-wrap gap-2">
          {Array.from(requiredElements.entries()).map(([element, needed]) => {
            let totalHave = 0
            for (const [itemId, qty] of selectedHerbQuantities) {
              const item = inventory.find(i => i.id === itemId)
              if (item && qty > 0) {
                totalHave += item.herb.elements.filter(e => e === element).length * qty
              }
            }
            const fulfilled = totalHave >= needed

            return (
              <div
                key={element}
                className={`px-2 py-1 rounded text-sm flex items-center gap-1 ${
                  fulfilled ? 'bg-green-900/50 border border-green-700' : 'bg-zinc-700 border border-zinc-600'
                }`}
              >
                <span>{getElementSymbol(element)}</span>
                <span className={fulfilled ? 'text-green-300' : 'text-zinc-300'}>
                  {totalHave}/{needed}
                </span>
                {fulfilled && <span className="text-green-400">✓</span>}
              </div>
            )
          })}
        </div>

        {/* Instance check for batch brewing */}
        {batchCount > 1 && (() => {
          const recipeElements = new Set<string>()
          for (const { recipe } of selectedRecipes) {
            for (const el of recipe.elements) recipeElements.add(el)
          }

          const instanceCheck: { element: string; have: number; need: number; ok: boolean }[] = []
          for (const element of recipeElements) {
            let instances = 0
            for (const [itemId, qty] of selectedHerbQuantities) {
              const item = inventory.find(i => i.id === itemId)
              if (item && qty > 0 && item.herb.elements.includes(element)) {
                instances += qty
              }
            }
            instanceCheck.push({ element, have: instances, need: batchCount, ok: instances >= batchCount })
          }

          if (instanceCheck.every(c => c.ok)) return null

          return (
            <div className="mt-2 pt-2 border-t border-zinc-600">
              <p className="text-amber-400 text-xs mb-1">
                ⚠️ Need {batchCount} herb instances per element for {batchCount} brews:
              </p>
              <div className="flex flex-wrap gap-2">
                {instanceCheck.filter(c => !c.ok).map(({ element, have, need }) => (
                  <span key={element} className="text-xs text-red-400">
                    {getElementSymbol(element)} {have}/{need} herbs
                  </span>
                ))}
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}

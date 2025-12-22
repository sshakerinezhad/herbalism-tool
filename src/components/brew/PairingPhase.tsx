/**
 * PairingPhase - Element pairing interface for brewing
 * 
 * Allows users to pair elements to create effects.
 */

import { useState } from 'react'
import { Recipe } from '@/lib/types'
import { PairedEffect, findRecipeForPair } from '@/lib/brewing'
import { getElementSymbol } from '@/lib/constants'

type PairingPhaseProps = {
  elementPool: Map<string, number>
  remainingElements: Map<string, number>
  assignedPairs: [string, string][]
  pairedEffects: PairedEffect[]
  recipes: Recipe[]
  pairingValidation: { valid: boolean; type: string | null; error?: string }
  onAddPair: (el1: string, el2: string) => void
  onRemovePair: (index: number) => void
  onProceed: () => void
  onBack: () => void
}

export function PairingPhase({
  remainingElements,
  assignedPairs,
  pairedEffects,
  recipes,
  pairingValidation,
  onAddPair,
  onRemovePair,
  onProceed,
  onBack
}: PairingPhaseProps) {
  const [selectedFirst, setSelectedFirst] = useState<string | null>(null)

  const remainingArray = Array.from(remainingElements.entries())
    .flatMap(([el, count]) => Array(count).fill(el))

  function handleElementClick(element: string) {
    if (selectedFirst === null) {
      setSelectedFirst(element)
    } else {
      onAddPair(selectedFirst, element)
      setSelectedFirst(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Assigned Pairs */}
      <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
        <h2 className="font-semibold mb-3">Assigned Pairs</h2>
        {assignedPairs.length === 0 ? (
          <p className="text-zinc-500 text-sm">Click elements below to create pairs</p>
        ) : (
          <div className="space-y-2">
            {pairedEffects.map((effect, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between py-2 px-3 bg-zinc-700/50 rounded"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">
                    {effect.recipe.elements.map((el, i) => (
                      <span key={i}>{getElementSymbol(el)}</span>
                    ))}
                    {effect.count > 1 && (
                      <span className="text-zinc-400 text-sm ml-1">×{effect.count}</span>
                    )}
                  </span>
                  <span className="text-zinc-300">{effect.recipe.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    effect.recipe.type === 'elixir' 
                      ? 'bg-blue-900/50 text-blue-300' 
                      : effect.recipe.type === 'bomb'
                        ? 'bg-red-900/50 text-red-300'
                        : 'bg-amber-900/50 text-amber-300'
                  }`}>
                    {effect.recipe.type}
                  </span>
                </div>
              </div>
            ))}
            
            {/* Pair removal buttons */}
            <div className="pt-2 border-t border-zinc-700 flex flex-wrap gap-2">
              {assignedPairs.map((pair, idx) => (
                <button
                  key={idx}
                  onClick={() => onRemovePair(idx)}
                  className="px-2 py-1 bg-zinc-700 hover:bg-red-900/50 rounded text-sm transition-colors"
                >
                  {getElementSymbol(pair[0])}{getElementSymbol(pair[1])} ×
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Validation message */}
        {assignedPairs.length > 0 && !pairingValidation.valid && (
          <p className="text-red-400 text-sm mt-2">{pairingValidation.error}</p>
        )}
      </div>

      {/* Remaining Elements */}
      <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
        <h2 className="font-semibold mb-3">
          Available Elements
          {selectedFirst && (
            <span className="text-purple-400 font-normal ml-2">
              — Select second element for {getElementSymbol(selectedFirst)}
            </span>
          )}
        </h2>
        
        {remainingArray.length === 0 ? (
          <p className="text-zinc-500 text-sm">All elements have been paired</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {remainingArray.map((el, idx) => {
              let previewRecipe: Recipe | null = null
              if (selectedFirst) {
                previewRecipe = findRecipeForPair(recipes, selectedFirst, el)
              }
              
              return (
                <button
                  key={idx}
                  onClick={() => handleElementClick(el)}
                  className={`w-12 h-12 rounded-lg text-2xl flex items-center justify-center transition-all ${
                    selectedFirst === el && idx === remainingArray.indexOf(selectedFirst)
                      ? 'bg-purple-700 ring-2 ring-purple-400'
                      : selectedFirst
                        ? 'bg-zinc-700 hover:bg-purple-700/50'
                        : 'bg-zinc-700 hover:bg-zinc-600'
                  }`}
                  title={previewRecipe ? `Creates: ${previewRecipe.name}` : el}
                >
                  {getElementSymbol(el)}
                </button>
              )
            })}
          </div>
        )}
        
        {selectedFirst && (
          <button
            onClick={() => setSelectedFirst(null)}
            className="mt-3 text-zinc-400 hover:text-zinc-200 text-sm"
          >
            Cancel selection
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg font-medium transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={onProceed}
          disabled={!pairingValidation.valid || pairedEffects.length === 0}
          className="flex-1 py-3 bg-purple-700 hover:bg-purple-600 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg font-semibold transition-colors"
        >
          {pairedEffects.length === 0 
            ? 'Create at least one pair'
            : !pairingValidation.valid
              ? 'Fix pairing issues'
              : 'Continue to Brew'
          }
        </button>
      </div>
    </div>
  )
}


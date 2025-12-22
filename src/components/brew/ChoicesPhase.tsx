/**
 * ChoicesPhase - Make brewing choices for variable effects
 */

import { useMemo } from 'react'
import { PairedEffect, parseTemplateVariables, computeBrewedDescription } from '@/lib/brewing'

type ChoicesPhaseProps = {
  pairedEffects: PairedEffect[]
  choices: Record<string, string>
  onUpdateChoice: (variable: string, value: string) => void
  onProceed: () => void
  onBack: () => void
}

export function ChoicesPhase({
  pairedEffects,
  choices,
  onUpdateChoice,
  onProceed,
  onBack
}: ChoicesPhaseProps) {
  // Get required choices from effects
  const requiredChoices = useMemo(() => {
    const allChoices: { variable: string; options: string[] | null }[] = []
    const seen = new Set<string>()
    
    for (const effect of pairedEffects) {
      if (effect.recipe.description) {
        const vars = parseTemplateVariables(effect.recipe.description)
        for (const v of vars) {
          if (!seen.has(v.variable)) {
            seen.add(v.variable)
            allChoices.push(v)
          }
        }
      }
    }
    
    return allChoices
  }, [pairedEffects])
  
  const allChoicesMade = requiredChoices.every(c => choices[c.variable])

  return (
    <div className="space-y-6">
      <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
        <h2 className="font-semibold mb-4">Make Choices</h2>
        <p className="text-zinc-400 text-sm mb-4">
          Some effects require you to make a choice at brewing time.
        </p>
        
        <div className="space-y-4">
          {requiredChoices.map((choice) => (
            <div key={choice.variable}>
              <label className="block text-sm font-medium mb-2 capitalize">
                {choice.variable.replace(/_/g, ' ')}
              </label>
              
              {choice.options ? (
                <div className="flex flex-wrap gap-2">
                  {choice.options.map(option => (
                    <button
                      key={option}
                      onClick={() => onUpdateChoice(choice.variable, option)}
                      className={`px-4 py-2 rounded-lg transition-colors capitalize ${
                        choices[choice.variable] === option
                          ? 'bg-purple-700 text-white'
                          : 'bg-zinc-700 hover:bg-zinc-600'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  type="text"
                  value={choices[choice.variable] || ''}
                  onChange={(e) => onUpdateChoice(choice.variable, e.target.value)}
                  placeholder={`Enter ${choice.variable.replace(/_/g, ' ')}`}
                  className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg focus:outline-none focus:border-purple-500"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
        <h3 className="text-sm font-medium text-zinc-400 mb-2">Preview</h3>
        <p className="text-zinc-200">
          {computeBrewedDescription(pairedEffects, choices)}
        </p>
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
          disabled={!allChoicesMade}
          className="flex-1 py-3 bg-purple-700 hover:bg-purple-600 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg font-semibold transition-colors"
        >
          {allChoicesMade ? 'Brew!' : 'Make all choices to continue'}
        </button>
      </div>
    </div>
  )
}


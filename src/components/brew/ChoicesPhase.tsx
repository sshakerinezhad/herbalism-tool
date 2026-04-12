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
      <div className="elevation-base rounded-lg p-4 border border-sepia-700/40">
        <h2 className="font-semibold mb-4">Make Choices</h2>
        <p className="text-vellum-400 text-sm mb-4">
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
                          : 'btn-secondary'
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
                  className="w-full px-4 py-2 bg-sepia-800/50 border border-sepia-700/40 rounded-lg focus:outline-none focus:border-purple-500"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="elevation-base/50 rounded-lg p-4 border border-sepia-700/40">
        <h3 className="text-sm font-medium text-vellum-400 mb-2">Preview</h3>
        <p className="text-vellum-100">
          {computeBrewedDescription(pairedEffects, choices)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="px-6 py-3 btn-secondary rounded-lg font-medium transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={onProceed}
          disabled={!allChoicesMade}
          className="flex-1 py-3 btn-primary disabled:bg-sepia-800/50 disabled:text-vellum-400/60 rounded-lg font-semibold transition-colors"
        >
          {allChoicesMade ? 'Brew!' : 'Make all choices to continue'}
        </button>
      </div>
    </div>
  )
}


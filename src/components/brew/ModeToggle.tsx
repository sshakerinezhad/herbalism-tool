/**
 * ModeToggle Component
 *
 * Toggle between "by-herbs" and "by-recipe" brewing modes
 */

import type { BrewMode } from './types'

type ModeToggleProps = {
  brewMode: BrewMode
  onModeChange: (mode: BrewMode) => void
}

export function ModeToggle({ brewMode, onModeChange }: ModeToggleProps) {
  return (
    <div className="flex gap-1 p-1 elevation-base rounded-lg mb-6 w-fit">
      <button
        onClick={() => onModeChange('by-herbs')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          brewMode === 'by-herbs' ? 'bg-purple-600 text-white' : 'text-vellum-400 hover:text-vellum-100'
        }`}
      >
        🌿 By Herbs
      </button>
      <button
        onClick={() => onModeChange('by-recipe')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          brewMode === 'by-recipe' ? 'bg-purple-600 text-white' : 'text-vellum-400 hover:text-vellum-100'
        }`}
      >
        📖 By Recipe
      </button>
    </div>
  )
}

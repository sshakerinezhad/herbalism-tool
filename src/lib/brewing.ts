import { Recipe } from './types'

export type PairedEffect = {
  recipe: Recipe
  count: number // How many times this pair appears (for potency)
}

/**
 * Find a recipe matching an element pair
 * Elements are sorted to ensure [fire, water] matches [water, fire]
 */
export function findRecipeForPair(
  recipes: Recipe[],
  element1: string,
  element2: string
): Recipe | null {
  const sortedPair = [element1.toLowerCase(), element2.toLowerCase()].sort()

  for (const recipe of recipes) {
    const recipeElements = recipe.elements.map(e => e.toLowerCase()).sort()
    if (recipeElements.length === 2 &&
        recipeElements[0] === sortedPair[0] &&
        recipeElements[1] === sortedPair[1]) {
      return recipe
    }
  }

  return null
}

/**
 * Check if a set of effects can be brewed together
 * (all must be same type - elixir or bomb)
 */
export function canCombineEffects(effects: PairedEffect[]): { valid: boolean; type: string | null; error?: string } {
  if (effects.length === 0) {
    return { valid: false, type: null, error: 'No effects selected' }
  }

  const types = new Set(effects.map(e => e.recipe.type))

  if (types.size > 1) {
    return {
      valid: false,
      type: null,
      error: 'Cannot mix elixirs and bombs in one brew'
    }
  }

  return { valid: true, type: effects[0].recipe.type }
}

/**
 * Parse template string and extract variables
 * e.g., "Deals {n}d6 damage" or "Resistance to {damage_type:cold|fire|lightning}"
 */
export function parseTemplateVariables(template: string): {
  variable: string
  options: string[] | null // null means free text input
}[] {
  const variables: { variable: string; options: string[] | null }[] = []
  const regex = /\{([^}]+)\}/g
  let match

  while ((match = regex.exec(template)) !== null) {
    const content = match[1]

    // Skip {n} - that's for potency
    if (content === 'n' || content.startsWith('n*') || content.startsWith('n+')) {
      continue
    }

    // Skip {n|singular|plural} - that's for potency-based pluralization
    // Format: starts with 'n|' followed by singular|plural
    if (content.startsWith('n|')) {
      continue
    }

    // Check for options (variable:opt1|opt2|opt3)
    if (content.includes(':')) {
      const [variable, optionsStr] = content.split(':')
      const options = optionsStr.split('|')
      variables.push({ variable, options })
    } else {
      // Free text input
      variables.push({ variable: content, options: null })
    }
  }

  return variables
}

/**
 * Fill template with values
 */
export function fillTemplate(
  template: string,
  potency: number,
  choices: Record<string, string>
): string {
  let result = template

  // Replace {n} with potency
  result = result.replace(/\{n\}/g, potency.toString())

  // Replace {n*X} with potency * X
  result = result.replace(/\{n\*(\d+)\}/g, (_, multiplier) => {
    return (potency * parseInt(multiplier)).toString()
  })

  // Replace {n+X} with potency + X
  result = result.replace(/\{n\+(\d+)\}/g, (_, addend) => {
    return (potency + parseInt(addend)).toString()
  })

  // Replace {n|singular|plural} with appropriate word based on potency
  result = result.replace(/\{n\|([^|]+)\|([^}]+)\}/g, (_, singular, plural) => {
    return potency === 1 ? singular : plural
  })

  // Replace choice variables
  for (const [variable, value] of Object.entries(choices)) {
    // Match both {variable} and {variable:options}
    const regex = new RegExp(`\\{${variable}(?::[^}]+)?\\}`, 'g')
    result = result.replace(regex, value)
  }

  return result
}

/**
 * Compute the final description for a brewed item
 */
export function computeBrewedDescription(
  effects: PairedEffect[],
  choices: Record<string, string>
): string {
  const descriptions: string[] = []

  for (const effect of effects) {
    if (effect.recipe.description) {
      const filled = fillTemplate(effect.recipe.description, effect.count, choices)
      descriptions.push(filled)
    } else {
      // Fallback to just the name with potency
      const potencyStr = effect.count > 1 ? ` (×${effect.count})` : ''
      descriptions.push(`${effect.recipe.name}${potencyStr}`)
    }
  }

  return descriptions.join(' ')
}

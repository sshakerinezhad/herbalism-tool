import { supabase } from './supabase'
import { Herb, Recipe } from './types'

export type ElementPool = Map<string, number>

export type PairedEffect = {
  recipe: Recipe
  count: number // How many times this pair appears (for potency)
}

export type BrewingResult = {
  success: boolean
  roll: number
  total: number
  dc: number
  type: 'elixir' | 'bomb' | string
  effects: PairedEffect[]
  computedDescription: string
  choices: Record<string, string>
}

/**
 * Build element pool from selected herbs
 */
export function buildElementPool(herbs: Herb[]): ElementPool {
  const pool = new Map<string, number>()
  for (const herb of herbs) {
    for (const element of herb.elements) {
      pool.set(element, (pool.get(element) || 0) + 1)
    }
  }
  return pool
}

/**
 * Get total element count from pool
 */
export function getTotalElements(pool: ElementPool): number {
  let total = 0
  for (const count of pool.values()) {
    total += count
  }
  return total
}

/**
 * Fetch all recipes from database (all recipes, for reference)
 * @deprecated Use fetchUserRecipes for brewing - only shows recipes the user knows
 */
export async function fetchRecipes(): Promise<{ recipes: Recipe[]; error: string | null }> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .order('name')

  if (error) {
    return { recipes: [], error: `Failed to load recipes: ${error.message}` }
  }

  return { recipes: data || [], error: null }
}

/**
 * Fetch recipes known by a specific user (from user_recipes)
 * This is what should be used for brewing
 */
export async function fetchUserRecipes(userId: string): Promise<{ recipes: Recipe[]; error: string | null }> {
  const { data, error } = await supabase
    .from('user_recipes')
    .select(`
      recipe_id,
      recipes (
        id,
        elements,
        type,
        name,
        description,
        is_secret,
        unlock_code
      )
    `)
    .eq('user_id', userId)

  if (error) {
    return { recipes: [], error: `Failed to load recipes: ${error.message}` }
  }

  // Extract the joined recipe data
  const recipes: Recipe[] = (data || [])
    .filter(row => row.recipes)
    .map(row => row.recipes as unknown as Recipe)
    .sort((a, b) => a.name.localeCompare(b.name))

  return { recipes, error: null }
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

/**
 * Save brewed item to database
 * Note: The user_brewed table needs these columns:
 * - user_id (uuid, FK to profiles)
 * - type (text) - 'elixir' or 'bomb'
 * - effects (text[]) - array of effect names
 * - quantity (int, default 1)
 * - choices (jsonb, nullable) - user choices at brew time
 * - computed_description (text, nullable) - final effect text
 */
export async function saveBrewedItem(
  userId: string,
  type: string,
  effects: string[], // Effect names, with duplicates for potency
  choices: Record<string, string> | null,
  computedDescription: string
): Promise<{ error: string | null }> {
  // Try inserting with all columns first
  const { error } = await supabase
    .from('user_brewed')
    .insert({
      user_id: userId,
      type,
      effects,
      choices: choices || null,
      computed_description: computedDescription,
      quantity: 1,
    })

  if (error) {
    // If we get a column not found error, try simpler insert
    if (error.message.includes('column') || error.code === '42703') {
      const { error: simpleError } = await supabase
        .from('user_brewed')
        .insert({
          user_id: userId,
          type,
          effects,
          quantity: 1,
        })
      
      if (simpleError) {
        return { error: `Failed to save brewed item: ${simpleError.message}` }
      }
      return { error: null }
    }
    
    return { error: `Failed to save brewed item: ${error.message}` }
  }

  return { error: null }
}

/**
 * Get all brewed items for a user
 */
export async function getBrewedItems(userId: string): Promise<{
  items: {
    id: number
    type: string
    effects: string[]
    quantity: number
    computedDescription?: string
    choices?: Record<string, string>
  }[]
  error: string | null
}> {
  const { data, error } = await supabase
    .from('user_brewed')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    return { items: [], error: `Failed to load brewed items: ${error.message}` }
  }

  const items = (data || []).map(row => ({
    id: row.id,
    type: row.type,
    effects: row.effects,
    quantity: row.quantity,
    computedDescription: row.computed_description,
    choices: row.choices,
  }))

  return { items, error: null }
}


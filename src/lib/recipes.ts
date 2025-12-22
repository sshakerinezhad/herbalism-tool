import { supabase } from './supabase'
import { Recipe } from './types'

export type UserRecipe = Recipe & {
  userRecipeId: number // The id from user_recipes table
}

/**
 * Get all recipes known by a user (from user_recipes joined with recipes)
 */
export async function getUserRecipes(userId: string): Promise<{
  recipes: UserRecipe[]
  error: string | null
}> {
  const { data, error } = await supabase
    .from('user_recipes')
    .select(`
      id,
      recipe_id,
      recipes (
        id,
        elements,
        type,
        name,
        description,
        lore,
        is_secret,
        unlock_code
      )
    `)
    .eq('user_id', userId)

  if (error) {
    return { recipes: [], error: `Failed to load recipes: ${error.message}` }
  }

  // Transform the joined data
  const recipes: UserRecipe[] = (data || [])
    .filter(row => row.recipes) // Filter out any rows with missing recipe data
    .map(row => {
      const recipe = row.recipes as unknown as Recipe
      return {
        ...recipe,
        userRecipeId: row.id,
      }
    })

  return { recipes, error: null }
}

/**
 * Initialize a user with all base (non-secret) recipes
 * Called when a new profile is created
 */
export async function initializeBaseRecipes(userId: string): Promise<{
  count: number
  error: string | null
}> {
  // First, get all non-secret recipes
  const { data: baseRecipes, error: fetchError } = await supabase
    .from('recipes')
    .select('id')
    .eq('is_secret', false)

  if (fetchError) {
    return { count: 0, error: `Failed to fetch base recipes: ${fetchError.message}` }
  }

  if (!baseRecipes || baseRecipes.length === 0) {
    return { count: 0, error: null } // No base recipes to add
  }

  // Check which recipes the user already has
  const { data: existingRecipes } = await supabase
    .from('user_recipes')
    .select('recipe_id')
    .eq('user_id', userId)

  const existingIds = new Set((existingRecipes || []).map(r => r.recipe_id))

  // Filter to only recipes they don't have
  const newRecipes = baseRecipes.filter(r => !existingIds.has(r.id))

  if (newRecipes.length === 0) {
    return { count: 0, error: null } // User already has all base recipes
  }

  // Insert the new recipes
  const { error: insertError } = await supabase
    .from('user_recipes')
    .insert(newRecipes.map(recipe => ({
      user_id: userId,
      recipe_id: recipe.id,
    })))

  if (insertError) {
    return { count: 0, error: `Failed to initialize recipes: ${insertError.message}` }
  }

  return { count: newRecipes.length, error: null }
}

/**
 * Attempt to unlock a secret recipe with a code
 */
export async function unlockRecipeWithCode(
  userId: string,
  code: string
): Promise<{
  success: boolean
  recipe: Recipe | null
  error: string | null
}> {
  // Normalize the code (trim whitespace, case-insensitive)
  const normalizedCode = code.trim().toLowerCase()

  if (!normalizedCode) {
    return { success: false, recipe: null, error: 'Please enter a code' }
  }

  // Find a secret recipe with this unlock code
  const { data: recipe, error: fetchError } = await supabase
    .from('recipes')
    .select('*')
    .eq('is_secret', true)
    .ilike('unlock_code', normalizedCode)
    .single()

  if (fetchError || !recipe) {
    return { success: false, recipe: null, error: 'Invalid code. No recipe found.' }
  }

  // Check if user already has this recipe
  const { data: existing } = await supabase
    .from('user_recipes')
    .select('id')
    .eq('user_id', userId)
    .eq('recipe_id', recipe.id)
    .single()

  if (existing) {
    return { 
      success: false, 
      recipe: recipe as Recipe, 
      error: 'You already know this recipe!' 
    }
  }

  // Add the recipe to user's collection
  const { error: insertError } = await supabase
    .from('user_recipes')
    .insert({
      user_id: userId,
      recipe_id: recipe.id,
    })

  if (insertError) {
    return { 
      success: false, 
      recipe: null, 
      error: `Failed to unlock recipe: ${insertError.message}` 
    }
  }

  return { success: true, recipe: recipe as Recipe, error: null }
}

/**
 * Get count of user's known recipes vs total available
 */
export async function getRecipeStats(userId: string): Promise<{
  known: number
  totalBase: number
  secretsUnlocked: number
  error: string | null
}> {
  // Get user's recipes with secret flag
  const { data: userRecipes, error: userError } = await supabase
    .from('user_recipes')
    .select(`
      recipe_id,
      recipes (is_secret)
    `)
    .eq('user_id', userId)

  if (userError) {
    return { known: 0, totalBase: 0, secretsUnlocked: 0, error: userError.message }
  }

  // Count base recipes available
  const { count: baseCount, error: baseError } = await supabase
    .from('recipes')
    .select('*', { count: 'exact', head: true })
    .eq('is_secret', false)

  if (baseError) {
    return { known: 0, totalBase: 0, secretsUnlocked: 0, error: baseError.message }
  }

  const known = userRecipes?.length || 0
  const secretsUnlocked = (userRecipes || []).filter(
    r => (r.recipes as unknown as { is_secret: boolean })?.is_secret
  ).length

  return {
    known,
    totalBase: baseCount || 0,
    secretsUnlocked,
    error: null,
  }
}


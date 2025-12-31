/**
 * Character Inventory Database Operations
 * 
 * Clean, normalized database operations for character-based inventory.
 * All inventory is tied to characters, not users.
 * 
 * Tables:
 * - character_herbs: Herb inventory (references herbs table)
 * - character_brewed: Brewed items (elixirs, bombs, oils)
 * - character_recipes: Known recipes (references recipes table)
 * - character_weapons: Weapons (references weapon_templates + materials)
 * - character_items: Items (references item_templates)
 */

import { supabase } from '../supabase'
import type {
  CharacterHerb,
  CharacterBrewedItem,
  CharacterRecipe,
  CharacterWeapon,
  CharacterItem,
  Herb,
  Recipe,
  WeaponTemplate,
  Material,
  ItemTemplate,
} from '../types'

// ============ Character Herbs ============

/**
 * Fetch all herbs owned by a character
 * Joins with herbs table to get herb details
 */
export async function fetchCharacterHerbs(characterId: string): Promise<{
  data: CharacterHerb[] | null
  error: string | null
}> {
  const { data, error } = await supabase
    .from('character_herbs')
    .select(`
      *,
      herbs (*)
    `)
    .eq('character_id', characterId)
    .order('herb_id')

  if (error) {
    return { data: null, error: error.message }
  }

  // Transform joined data
  const transformed = (data || []).map(row => ({
    ...row,
    herb: row.herbs as Herb,
    herbs: undefined,
  })) as CharacterHerb[]

  return { data: transformed, error: null }
}

/**
 * Add herbs to a character's inventory
 * Uses upsert to handle existing entries (adds to quantity)
 */
export async function addCharacterHerbs(
  characterId: string,
  herbId: number,
  quantity: number = 1
): Promise<{ error: string | null }> {
  // First check if they already have this herb
  const { data: existing } = await supabase
    .from('character_herbs')
    .select('id, quantity')
    .eq('character_id', characterId)
    .eq('herb_id', herbId)
    .single()

  if (existing) {
    // Update existing
    const { error } = await supabase
      .from('character_herbs')
      .update({ quantity: existing.quantity + quantity })
      .eq('id', existing.id)
    return { error: error?.message || null }
  } else {
    // Insert new
    const { error } = await supabase
      .from('character_herbs')
      .insert({ character_id: characterId, herb_id: herbId, quantity })
    return { error: error?.message || null }
  }
}

/**
 * Remove herbs from a character's inventory
 */
export async function removeCharacterHerbs(
  characterId: string,
  herbId: number,
  quantity: number = 1
): Promise<{ error: string | null }> {
  const { data: existing } = await supabase
    .from('character_herbs')
    .select('id, quantity')
    .eq('character_id', characterId)
    .eq('herb_id', herbId)
    .single()

  if (!existing) {
    return { error: 'Herb not found in inventory' }
  }

  if (existing.quantity <= quantity) {
    // Remove entire row
    const { error } = await supabase
      .from('character_herbs')
      .delete()
      .eq('id', existing.id)
    return { error: error?.message || null }
  } else {
    // Reduce quantity
    const { error } = await supabase
      .from('character_herbs')
      .update({ quantity: existing.quantity - quantity })
      .eq('id', existing.id)
    return { error: error?.message || null }
  }
}

// ============ Character Brewed Items ============

/**
 * Fetch all brewed items owned by a character
 */
export async function fetchCharacterBrewedItems(characterId: string): Promise<{
  data: CharacterBrewedItem[] | null
  error: string | null
}> {
  const { data, error } = await supabase
    .from('character_brewed')
    .select('*')
    .eq('character_id', characterId)
    .order('created_at', { ascending: false })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as CharacterBrewedItem[], error: null }
}

/**
 * Add a brewed item to a character's inventory
 */
export async function addCharacterBrewedItem(
  characterId: string,
  type: 'elixir' | 'bomb' | 'oil',
  effects: string[],
  computedDescription: string,
  choices: Record<string, string> = {},
  quantity: number = 1
): Promise<{ data: CharacterBrewedItem | null; error: string | null }> {
  const { data, error } = await supabase
    .from('character_brewed')
    .insert({
      character_id: characterId,
      type,
      effects,
      computed_description: computedDescription,
      choices,
      quantity,
    })
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as CharacterBrewedItem, error: null }
}

/**
 * Consume brewed items, reducing quantity
 */
export async function consumeCharacterBrewedItem(
  brewedId: number,
  quantity: number = 1
): Promise<{ error: string | null }> {
  const { data: existing } = await supabase
    .from('character_brewed')
    .select('id, quantity')
    .eq('id', brewedId)
    .single()

  if (!existing) {
    return { error: 'Brewed item not found' }
  }

  if (existing.quantity <= quantity) {
    // Remove entire row
    const { error } = await supabase
      .from('character_brewed')
      .delete()
      .eq('id', brewedId)
    return { error: error?.message || null }
  } else {
    // Reduce quantity
    const { error } = await supabase
      .from('character_brewed')
      .update({ quantity: existing.quantity - quantity })
      .eq('id', brewedId)
    return { error: error?.message || null }
  }
}

// ============ Character Recipes ============

/**
 * Fetch all recipes known by a character
 */
export async function fetchCharacterRecipes(characterId: string): Promise<{
  data: CharacterRecipe[] | null
  error: string | null
}> {
  const { data, error } = await supabase
    .from('character_recipes')
    .select(`
      *,
      recipes (*)
    `)
    .eq('character_id', characterId)

  if (error) {
    return { data: null, error: error.message }
  }

  // Transform joined data (match pattern from fetchCharacterHerbs)
  const transformed = (data || []).map(row => ({
    ...row,
    recipe: row.recipes as Recipe,
    recipes: undefined,
  })) as CharacterRecipe[]

  return { data: transformed, error: null }
}

/**
 * Unlock a recipe for a character
 */
export async function unlockCharacterRecipe(
  characterId: string,
  recipeId: number
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('character_recipes')
    .insert({ character_id: characterId, recipe_id: recipeId })

  if (error && error.code === '23505') {
    // Already unlocked (unique constraint violation)
    return { error: null }
  }

  return { error: error?.message || null }
}

/**
 * Initialize all base (non-secret) recipes for a character
 * Called during character creation for herbalist vocation
 */
export async function initializeBaseCharacterRecipes(
  characterId: string
): Promise<{ count: number; error: string | null }> {
  // 1. Fetch all non-secret recipe IDs
  const { data: baseRecipes, error: fetchError } = await supabase
    .from('recipes')
    .select('id')
    .eq('is_secret', false)

  if (fetchError) {
    return { count: 0, error: fetchError.message }
  }

  if (!baseRecipes || baseRecipes.length === 0) {
    return { count: 0, error: null }
  }

  // 2. Insert all base recipes for this character
  const { error: insertError } = await supabase
    .from('character_recipes')
    .insert(
      baseRecipes.map(recipe => ({
        character_id: characterId,
        recipe_id: recipe.id,
      }))
    )

  // UNIQUE constraint handles duplicates - treat as success
  if (insertError && insertError.code !== '23505') {
    return { count: 0, error: insertError.message }
  }

  return { count: baseRecipes.length, error: null }
}

// ============ Character Weapons (Clean Pattern) ============

/**
 * Fetch all weapons owned by a character
 * Joins with weapon_templates and materials for full details
 */
export async function fetchCharacterWeaponsClean(characterId: string): Promise<{
  data: CharacterWeapon[] | null
  error: string | null
}> {
  const { data, error } = await supabase
    .from('character_weapons')
    .select('*')
    .eq('character_id', characterId)
    .order('created_at', { ascending: false })

  if (error) {
    return { data: null, error: error.message }
  }

  if (!data || data.length === 0) {
    return { data: [], error: null }
  }

  // Fetch templates and materials for weapons that have them
  const templateIds = data.map(w => w.template_id).filter(Boolean)
  const materialIds = data.map(w => w.material_id).filter(Boolean)

  let templates: Record<number, WeaponTemplate> = {}
  let materials: Record<number, Material> = {}

  if (templateIds.length > 0) {
    const { data: templatesData } = await supabase
      .from('weapon_templates')
      .select('*')
      .in('id', templateIds)
    if (templatesData) {
      templates = Object.fromEntries(templatesData.map(t => [t.id, t]))
    }
  }

  if (materialIds.length > 0) {
    const { data: matsData } = await supabase
      .from('materials')
      .select('*')
      .in('id', materialIds)
    if (matsData) {
      materials = Object.fromEntries(matsData.map(m => [m.id, m]))
    }
  }

  // Transform with joined data
  const transformed = data.map(row => ({
    ...row,
    template: row.template_id ? (templates[row.template_id] as WeaponTemplate || null) : null,
    material_ref: row.material_id ? (materials[row.material_id] as Material || null) : null,
  })) as CharacterWeapon[]

  return { data: transformed, error: null }
}

/**
 * Add a weapon to a character from a template
 * This is the CORRECT way - just reference the template, don't copy data
 */
export async function addCharacterWeaponClean(
  characterId: string,
  templateId: number,
  materialId: number,
  options?: {
    customName?: string
    isMagical?: boolean
    notes?: string
  }
): Promise<{ data: CharacterWeapon | null; error: string | null }> {
  // Get template for is_two_handed check
  const { data: template } = await supabase
    .from('weapon_templates')
    .select('name, properties')
    .eq('id', templateId)
    .single()

  if (!template) {
    return { data: null, error: 'Template not found' }
  }

  const isTwoHanded = template.properties?.includes('two-handed') || false

  const { data, error } = await supabase
    .from('character_weapons')
    .insert({
      character_id: characterId,
      template_id: templateId,
      material_id: materialId,
      // Only store customizations, not duplicated template data
      name: options?.customName || template.name,  // Temporary - for backward compat
      is_magical: options?.isMagical || false,
      is_two_handed: isTwoHanded,
      notes: options?.notes || null,
    })
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as CharacterWeapon, error: null }
}

// ============ Character Items (Clean Pattern) ============

/**
 * Fetch all items owned by a character
 * Joins with item_templates for full details
 */
export async function fetchCharacterItemsClean(characterId: string): Promise<{
  data: CharacterItem[] | null
  error: string | null
}> {
  const { data, error } = await supabase
    .from('character_items')
    .select('*')
    .eq('character_id', characterId)
    .order('name')

  if (error) {
    return { data: null, error: error.message }
  }

  if (!data || data.length === 0) {
    return { data: [], error: null }
  }

  // Fetch templates for items that have them
  const templateIds = data.map(i => i.template_id).filter(Boolean)

  let templates: Record<number, ItemTemplate> = {}

  if (templateIds.length > 0) {
    const { data: templatesData } = await supabase
      .from('item_templates')
      .select('*')
      .in('id', templateIds)
    if (templatesData) {
      templates = Object.fromEntries(templatesData.map(t => [t.id, t]))
    }
  }

  // Transform with joined data
  const transformed = data.map(row => ({
    ...row,
    template: row.template_id ? (templates[row.template_id] as ItemTemplate || null) : null,
  })) as CharacterItem[]

  return { data: transformed, error: null }
}

/**
 * Add an item to a character from a template
 */
export async function addCharacterItemClean(
  characterId: string,
  templateId: number,
  quantity: number = 1,
  options?: {
    customName?: string
    notes?: string
  }
): Promise<{ data: CharacterItem | null; error: string | null }> {
  // Get template for default values
  const { data: template } = await supabase
    .from('item_templates')
    .select('name, category, ammo_type, description')
    .eq('id', templateId)
    .single()

  if (!template) {
    return { data: null, error: 'Template not found' }
  }

  const { data, error } = await supabase
    .from('character_items')
    .insert({
      character_id: characterId,
      template_id: templateId,
      // Only store customizations, not duplicated template data
      name: options?.customName || template.name,  // Temporary - for backward compat
      category: template.category,
      quantity,
      ammo_type: template.ammo_type,
      notes: options?.notes || template.description,
      is_quick_access: false,
    })
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as CharacterItem, error: null }
}


import { supabase } from './supabase'
import { Herb } from './types'

export type InventoryItem = {
  id: number
  herb: Herb
  quantity: number
}

/**
 * Get all herbs in a user's inventory
 */
export async function getInventory(userId: string): Promise<{
  items: InventoryItem[]
  error: string | null
}> {
  const { data, error } = await supabase
    .from('user_inventory')
    .select('id, quantity, herbs(*)')
    .eq('user_id', userId)
    .order('herbs(name)')

  if (error) {
    return { items: [], error: `Failed to load inventory: ${error.message}` }
  }

  const items: InventoryItem[] = (data || []).map(row => ({
    id: row.id,
    herb: row.herbs as unknown as Herb,
    quantity: row.quantity
  }))

  return { items, error: null }
}

/**
 * Add herbs to inventory (from foraging)
 * If herb already exists, increment quantity; otherwise create new row
 */
export async function addHerbsToInventory(
  userId: string, 
  herbs: Herb[]
): Promise<{ error: string | null }> {
  // Group herbs by ID and count quantities
  const herbCounts = new Map<number, number>()
  for (const herb of herbs) {
    herbCounts.set(herb.id, (herbCounts.get(herb.id) || 0) + 1)
  }

  // For each herb, upsert into inventory
  for (const [herbId, count] of herbCounts) {
    // Check if already in inventory
    const { data: existing } = await supabase
      .from('user_inventory')
      .select('id, quantity')
      .eq('user_id', userId)
      .eq('herb_id', herbId)
      .single()

    if (existing) {
      // Update quantity
      const { error } = await supabase
        .from('user_inventory')
        .update({ quantity: existing.quantity + count })
        .eq('id', existing.id)

      if (error) {
        return { error: `Failed to update inventory: ${error.message}` }
      }
    } else {
      // Insert new row
      const { error } = await supabase
        .from('user_inventory')
        .insert({
          user_id: userId,
          herb_id: herbId,
          quantity: count
        })

      if (error) {
        return { error: `Failed to add to inventory: ${error.message}` }
      }
    }
  }

  return { error: null }
}

/**
 * Remove herbs from inventory (for brewing)
 * Decrements quantity; removes row if quantity reaches 0
 */
export async function removeHerbsFromInventory(
  userId: string,
  herbRemovals: { herbId: number; quantity: number }[]
): Promise<{ error: string | null }> {
  for (const { herbId, quantity } of herbRemovals) {
    // Get current inventory row
    const { data: existing } = await supabase
      .from('user_inventory')
      .select('id, quantity')
      .eq('user_id', userId)
      .eq('herb_id', herbId)
      .single()

    if (!existing) {
      return { error: `Herb not found in inventory` }
    }

    if (existing.quantity < quantity) {
      return { error: `Not enough herbs in inventory` }
    }

    const newQuantity = existing.quantity - quantity

    if (newQuantity <= 0) {
      // Delete the row
      const { error } = await supabase
        .from('user_inventory')
        .delete()
        .eq('id', existing.id)

      if (error) {
        return { error: `Failed to remove from inventory: ${error.message}` }
      }
    } else {
      // Update quantity
      const { error } = await supabase
        .from('user_inventory')
        .update({ quantity: newQuantity })
        .eq('id', existing.id)

      if (error) {
        return { error: `Failed to update inventory: ${error.message}` }
      }
    }
  }

  return { error: null }
}

/**
 * Get total count of all herbs in inventory
 */
export async function getInventoryCount(userId: string): Promise<number> {
  const { data } = await supabase
    .from('user_inventory')
    .select('quantity')
    .eq('user_id', userId)

  if (!data) return 0
  return data.reduce((sum, row) => sum + row.quantity, 0)
}


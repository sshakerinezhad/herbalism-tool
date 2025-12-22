/**
 * Inventory Management
 * 
 * Handles user herb inventory operations with optimized batch queries.
 * Designed to scale for large inventory operations.
 */

import { supabase } from './supabase'
import { Herb } from './types'

// ============ Configuration ============

/** Max concurrent database requests to avoid rate limiting */
const MAX_CONCURRENT_REQUESTS = 20

/** Max items per IN clause to avoid query size limits */
const MAX_IN_CLAUSE_SIZE = 500

// ============ Types ============

export type InventoryItem = {
  id: number
  herb: Herb
  quantity: number
}

/** Database row type for user_inventory table */
type InventoryRow = {
  id: number
  herb_id: number
  quantity: number
}

/** Supabase mutation result type */
type MutationResult = {
  error: { message: string } | null
}

// ============ Utilities ============

/**
 * Execute async operations in chunks to avoid overwhelming the database.
 * Processes items in batches of `chunkSize`, waiting for each batch to complete.
 * 
 * @param items - Array of items to process
 * @param fn - Async function to apply to each item
 * @param chunkSize - Max concurrent operations (default: MAX_CONCURRENT_REQUESTS)
 * @returns Array of results in the same order as inputs
 */
async function chunkedParallel<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  chunkSize = MAX_CONCURRENT_REQUESTS
): Promise<R[]> {
  const results: R[] = []
  
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize)
    const chunkResults = await Promise.all(chunk.map(fn))
    results.push(...chunkResults)
  }
  
  return results
}

/**
 * Split an array into chunks for batch processing.
 * Used for large IN clauses or batch inserts.
 */
function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize))
  }
  return chunks
}

// ============ Public API ============

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

  const items: InventoryItem[] = (data || []).map((row: { id: number; quantity: number; herbs: unknown }) => ({
    id: row.id,
    herb: row.herbs as Herb,
    quantity: row.quantity
  }))

  return { items, error: null }
}

/**
 * Add herbs to inventory (from foraging)
 * If herb already exists, increment quantity; otherwise create new row
 * 
 * Optimized for scale:
 * - Batched SELECT with chunked IN clauses
 * - Batched INSERT for new items
 * - Chunked parallel UPDATEs for existing items
 */
export async function addHerbsToInventory(
  userId: string, 
  herbs: Herb[]
): Promise<{ error: string | null }> {
  if (herbs.length === 0) return { error: null }

  // Group herbs by ID and count quantities
  const herbCounts = new Map<number, number>()
  for (const herb of herbs) {
    herbCounts.set(herb.id, (herbCounts.get(herb.id) || 0) + 1)
  }

  const herbIds = Array.from(herbCounts.keys())

  // Fetch existing inventory items (chunked for large queries)
  const existingMap = new Map<number, InventoryRow>()
  
  for (const idChunk of chunkArray(herbIds, MAX_IN_CLAUSE_SIZE)) {
    const { data, error: fetchError } = await supabase
      .from('user_inventory')
      .select('id, herb_id, quantity')
      .eq('user_id', userId)
      .in('herb_id', idChunk)

    if (fetchError) {
      return { error: `Failed to check inventory: ${fetchError.message}` }
    }

    for (const item of (data || []) as InventoryRow[]) {
      existingMap.set(item.herb_id, item)
    }
  }

  // Separate into new items (insert) and existing items (update)
  const toInsert: { user_id: string; herb_id: number; quantity: number }[] = []
  const toUpdate: { id: number; quantity: number }[] = []

  for (const [herbId, count] of herbCounts) {
    const existingItem = existingMap.get(herbId)
    if (existingItem) {
      toUpdate.push({ 
        id: existingItem.id, 
        quantity: existingItem.quantity + count 
      })
    } else {
      toInsert.push({ 
        user_id: userId, 
        herb_id: herbId, 
        quantity: count 
      })
    }
  }

  // Batch insert new items (chunked for very large inserts)
  if (toInsert.length > 0) {
    for (const insertChunk of chunkArray(toInsert, MAX_IN_CLAUSE_SIZE)) {
      const { error: insertError } = await supabase
        .from('user_inventory')
        .insert(insertChunk)

      if (insertError) {
        return { error: `Failed to add to inventory: ${insertError.message}` }
      }
    }
  }

  // Update existing items (chunked parallel for rate limiting)
  if (toUpdate.length > 0) {
    const updateResults = await chunkedParallel<{ id: number; quantity: number }, MutationResult>(
      toUpdate,
      ({ id, quantity }) =>
        supabase
          .from('user_inventory')
          .update({ quantity })
          .eq('id', id)
    )

    for (const result of updateResults) {
      if (result.error) {
        return { error: `Failed to update inventory: ${result.error.message}` }
      }
    }
  }

  return { error: null }
}

/**
 * Remove herbs from inventory (for brewing)
 * Decrements quantity; removes row if quantity reaches 0
 * 
 * Optimized for scale:
 * - Batched SELECT with chunked IN clauses
 * - Batched DELETE for depleted items
 * - Chunked parallel UPDATEs for remaining items
 */
export async function removeHerbsFromInventory(
  userId: string,
  herbRemovals: { herbId: number; quantity: number }[]
): Promise<{ error: string | null }> {
  if (herbRemovals.length === 0) return { error: null }

  const herbIds = herbRemovals.map(r => r.herbId)

  // Fetch existing inventory items (chunked for large queries)
  const existingMap = new Map<number, InventoryRow>()
  
  for (const idChunk of chunkArray(herbIds, MAX_IN_CLAUSE_SIZE)) {
    const { data, error: fetchError } = await supabase
      .from('user_inventory')
      .select('id, herb_id, quantity')
      .eq('user_id', userId)
      .in('herb_id', idChunk)

    if (fetchError) {
      return { error: `Failed to check inventory: ${fetchError.message}` }
    }

    for (const item of (data || []) as InventoryRow[]) {
      existingMap.set(item.herb_id, item)
    }
  }

  // Validate all removals first (fail fast before any mutations)
  for (const { herbId, quantity } of herbRemovals) {
    const item = existingMap.get(herbId)
    if (!item) {
      return { error: `Herb not found in inventory` }
    }
    if (item.quantity < quantity) {
      return { error: `Not enough herbs in inventory` }
    }
  }

  // Separate into deletes (quantity reaches 0) and updates
  const toDelete: number[] = []
  const toUpdate: { id: number; quantity: number }[] = []

  for (const { herbId, quantity } of herbRemovals) {
    const item = existingMap.get(herbId)!
    const newQuantity = item.quantity - quantity

    if (newQuantity <= 0) {
      toDelete.push(item.id)
    } else {
      toUpdate.push({ id: item.id, quantity: newQuantity })
    }
  }

  // Batch delete items (chunked for large deletes)
  if (toDelete.length > 0) {
    for (const deleteChunk of chunkArray(toDelete, MAX_IN_CLAUSE_SIZE)) {
      const { error: deleteError } = await supabase
        .from('user_inventory')
        .delete()
        .in('id', deleteChunk)

      if (deleteError) {
        return { error: `Failed to remove from inventory: ${deleteError.message}` }
      }
    }
  }

  // Update remaining items (chunked parallel for rate limiting)
  if (toUpdate.length > 0) {
    const updateResults = await chunkedParallel<{ id: number; quantity: number }, MutationResult>(
      toUpdate,
      ({ id, quantity }) =>
        supabase
          .from('user_inventory')
          .update({ quantity })
          .eq('id', id)
    )

    for (const result of updateResults) {
      if (result.error) {
        return { error: `Failed to update inventory: ${result.error.message}` }
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
  return data.reduce((sum: number, row: { quantity: number }) => sum + row.quantity, 0)
}

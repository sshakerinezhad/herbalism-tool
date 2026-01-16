/**
 * Profile Management
 * 
 * Handles creating, loading, and updating user profiles.
 * Requires authenticated users (no guest mode).
 */

import { supabase } from './supabase'
import { Profile } from './types'

// Default profile values for new users
const DEFAULT_PROFILE: Profile = {
  name: '',
  isHerbalist: false,
  foragingModifier: 0,
  brewingModifier: 0,
  maxForagingSessions: 1,
}

/**
 * Get or create a user profile.
 * 
 * @param userId - Authenticated user ID (required)
 * @returns The profile ID, profile data, and any error
 */
export async function getOrCreateProfile(userId: string): Promise<{
  id: string
  profile: Profile
  error: string | null
}> {
  if (!userId) {
    return {
      id: '',
      profile: DEFAULT_PROFILE,
      error: 'User ID is required'
    }
  }

  // Try to fetch existing profile
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (data && !error) {
    return {
      id: userId,
      profile: mapDatabaseToProfile(data),
      error: null
    }
  }

  // Profile doesn't exist, create one
  return await createProfile(userId)
}

/**
 * Create a new profile with the given ID
 */
async function createProfile(id: string): Promise<{
  id: string
  profile: Profile
  error: string | null
}> {
  const { error } = await supabase
    .from('profiles')
    .insert({
      id,
      username: DEFAULT_PROFILE.name,
      is_herbalist: DEFAULT_PROFILE.isHerbalist,
      foraging_modifier: DEFAULT_PROFILE.foragingModifier,
      // Note: DB column is "herbalism_modifier" but app uses "brewingModifier"
      herbalism_modifier: DEFAULT_PROFILE.brewingModifier,
      max_foraging_sessions: DEFAULT_PROFILE.maxForagingSessions,
    })

  if (error) {
    return {
      id: '',
      profile: DEFAULT_PROFILE,
      error: `Failed to create profile: ${error.message}`
    }
  }

  return {
    id,
    profile: DEFAULT_PROFILE,
    error: null
  }
}

/**
 * Update a profile in the database
 * 
 * @param id - The profile ID to update
 * @param updates - Partial profile updates
 */
export async function updateProfile(
  id: string, 
  updates: Partial<Profile>
): Promise<{ error: string | null }> {
  const dbUpdates: Record<string, unknown> = {}
  
  if (updates.name !== undefined) dbUpdates.username = updates.name
  if (updates.isHerbalist !== undefined) dbUpdates.is_herbalist = updates.isHerbalist
  if (updates.foragingModifier !== undefined) dbUpdates.foraging_modifier = updates.foragingModifier
  // Note: DB column is "herbalism_modifier" but app uses "brewingModifier"
  if (updates.brewingModifier !== undefined) dbUpdates.herbalism_modifier = updates.brewingModifier
  if (updates.maxForagingSessions !== undefined) dbUpdates.max_foraging_sessions = updates.maxForagingSessions

  const { error } = await supabase
    .from('profiles')
    .update(dbUpdates)
    .eq('id', id)

  if (error) {
    return { error: `Failed to update profile: ${error.message}` }
  }

  return { error: null }
}

/**
 * Map database row to Profile type
 * 
 * Handles the field name mapping between database and app:
 * - DB "username" → App "name"
 * - DB "herbalism_modifier" → App "brewingModifier"
 */
function mapDatabaseToProfile(dbRow: {
  username: string
  is_herbalist: boolean
  foraging_modifier: number
  herbalism_modifier: number
  max_foraging_sessions: number
}): Profile {
  return {
    name: dbRow.username || '',
    isHerbalist: dbRow.is_herbalist ?? false,
    foragingModifier: dbRow.foraging_modifier ?? 0,
    brewingModifier: dbRow.herbalism_modifier ?? 0,
    maxForagingSessions: dbRow.max_foraging_sessions ?? 1,
  }
}


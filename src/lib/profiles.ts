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
}): Profile {
  return {
    name: dbRow.username || '',
  }
}


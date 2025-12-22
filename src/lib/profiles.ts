/**
 * Profile Management
 * 
 * Handles creating, loading, and updating user profiles.
 * Supports both authenticated users and guest users (via localStorage ID).
 */

import { supabase } from './supabase'
import { Profile } from './types'
import { initializeBaseRecipes } from './recipes'

const GUEST_ID_KEY = 'herbalism-guest-id'

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
 * @param userId - Optional authenticated user ID. If not provided, uses guest ID from localStorage.
 * @returns The profile ID, profile data, and any error
 */
export async function getOrCreateProfile(userId?: string): Promise<{
  id: string
  profile: Profile
  error: string | null
}> {
  // Determine which ID to use: authenticated user or guest
  const profileId = userId || localStorage.getItem(GUEST_ID_KEY)

  if (profileId) {
    // Try to fetch existing profile
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single()

    if (data && !error) {
      return {
        id: profileId,
        profile: mapDatabaseToProfile(data),
        error: null
      }
    }

    // If authenticated user but no profile exists, create one
    if (userId) {
      return await createProfile(userId)
    }

    // Guest profile not found (maybe deleted from DB), create a new one
    console.warn('Guest profile not found in DB, creating new one')
  }

  // Create new guest profile with random UUID
  const newGuestId = crypto.randomUUID()
  const result = await createProfile(newGuestId)
  
  if (!result.error) {
    // Store guest ID in localStorage for future sessions
    localStorage.setItem(GUEST_ID_KEY, newGuestId)
  }
  
  return result
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

  // Initialize the user with all base (non-secret) recipes
  const { error: recipeError } = await initializeBaseRecipes(id)
  if (recipeError) {
    console.warn('Failed to initialize base recipes:', recipeError)
    // Don't fail profile creation if recipe init fails
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
 * Get the current guest ID from localStorage (if exists)
 */
export function getGuestId(): string | null {
  return localStorage.getItem(GUEST_ID_KEY)
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


import { supabase } from './supabase'
import { Profile } from './types'

const GUEST_ID_KEY = 'herbalism-guest-id'

/**
 * Get or create a guest user profile.
 * - If a guest ID exists in localStorage, fetch that profile from DB
 * - If not, create a new guest profile in DB and store the ID
 */
export async function getOrCreateGuestProfile(): Promise<{
  guestId: string
  profile: Profile
  error: string | null
}> {
  const defaultProfile: Profile = {
    name: '',
    isHerbalist: false,
    foragingModifier: 0,
    brewingModifier: 0,
    maxForagingSessions: 1,
  }

  // Check for existing guest ID
  const existingGuestId = localStorage.getItem(GUEST_ID_KEY)

  if (existingGuestId) {
    // Try to fetch existing profile
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', existingGuestId)
      .single()

    if (data && !error) {
      return {
        guestId: existingGuestId,
        profile: dbProfileToLocal(data),
        error: null
      }
    }

    // Profile not found (maybe deleted), create a new one
    console.warn('Guest profile not found in DB, creating new one')
  }

  // Create new guest profile
  const newGuestId = crypto.randomUUID()

  const { error } = await supabase
    .from('profiles')
    .insert({
      id: newGuestId,
      username: '',
      is_herbalist: false,
      foraging_modifier: 0,
      herbalism_modifier: 0,  // This is the brewing modifier in your DB
      max_foraging_sessions: 1,
    })

  if (error) {
    return {
      guestId: '',
      profile: defaultProfile,
      error: `Failed to create guest profile: ${error.message}`
    }
  }

  // Store guest ID in localStorage
  localStorage.setItem(GUEST_ID_KEY, newGuestId)

  return {
    guestId: newGuestId,
    profile: defaultProfile,
    error: null
  }
}

/**
 * Update guest profile in database
 */
export async function updateGuestProfile(
  guestId: string, 
  updates: Partial<Profile>
): Promise<{ error: string | null }> {
  const dbUpdates: Record<string, unknown> = {}
  
  if (updates.name !== undefined) dbUpdates.username = updates.name
  if (updates.isHerbalist !== undefined) dbUpdates.is_herbalist = updates.isHerbalist
  if (updates.foragingModifier !== undefined) dbUpdates.foraging_modifier = updates.foragingModifier
  if (updates.brewingModifier !== undefined) dbUpdates.herbalism_modifier = updates.brewingModifier
  if (updates.maxForagingSessions !== undefined) dbUpdates.max_foraging_sessions = updates.maxForagingSessions

  const { error } = await supabase
    .from('profiles')
    .update(dbUpdates)
    .eq('id', guestId)

  if (error) {
    return { error: `Failed to update profile: ${error.message}` }
  }

  return { error: null }
}

/**
 * Get the current guest ID (if exists)
 */
export function getGuestId(): string | null {
  return localStorage.getItem(GUEST_ID_KEY)
}

/**
 * Convert database profile row to local Profile type
 */
function dbProfileToLocal(dbRow: {
  username: string
  is_herbalist: boolean
  foraging_modifier: number
  herbalism_modifier: number  // DB calls it herbalism, we call it brewing
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

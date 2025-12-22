'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { Profile } from './types'
import { getOrCreateProfile, updateProfile, getGuestId } from './guest'
import { useAuth } from './auth'

// Re-export the type for convenience
export type { Profile }

const DEFAULT_PROFILE: Profile = {
  name: '',
  isHerbalist: false,
  foragingModifier: 0,
  brewingModifier: 0,
  maxForagingSessions: 1,
}

type ProfileContextType = {
  profile: Profile
  profileId: string | null
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  isLoaded: boolean
  loadError: string | null
  // Session tracking (resets on long rest, stored in localStorage)
  sessionsUsedToday: number
  spendForagingSessions: (count: number) => void
  longRest: () => void
}

const ProfileContext = createContext<ProfileContextType | null>(null)

const SESSIONS_KEY = 'herbalism-sessions-used'

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth()
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [sessionsUsedToday, setSessionsUsedToday] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Load profile from database when auth state is ready
  useEffect(() => {
    // Don't load until we know the auth state
    if (authLoading) return

    async function initProfile() {
      // Use authenticated user ID if available, otherwise fall back to guest
      const { id, profile: loadedProfile, error } = await getOrCreateProfile(user?.id)
      
      if (error) {
        setLoadError(error)
        // Fall back to defaults
        setProfile(DEFAULT_PROFILE)
      } else {
        setProfileId(id)
        setProfile(loadedProfile)
      }

      // Load sessions from localStorage (these reset daily, no need for DB)
      const storedSessions = localStorage.getItem(SESSIONS_KEY)
      if (storedSessions) {
        try {
          setSessionsUsedToday(parseInt(storedSessions) || 0)
        } catch {
          // Invalid, use 0
        }
      }

      setIsLoaded(true)
    }

    // Reset state when auth changes
    setIsLoaded(false)
    setLoadError(null)
    
    initProfile()
  }, [user?.id, authLoading])

  // Save sessions to localStorage when it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(SESSIONS_KEY, sessionsUsedToday.toString())
    }
  }, [sessionsUsedToday, isLoaded])

  // Update profile in both state and database
  const updateProfileHandler = useCallback(async (updates: Partial<Profile>) => {
    // Optimistically update local state
    setProfile(prev => ({ ...prev, ...updates }))

    // Sync to database
    const currentId = profileId || getGuestId()
    if (currentId) {
      const { error } = await updateProfile(currentId, updates)
      if (error) {
        console.error('Failed to sync profile to database:', error)
        // Could revert optimistic update here, but for now just log
      }
    }
  }, [profileId])

  function spendForagingSessions(count: number) {
    setSessionsUsedToday(prev => prev + count)
  }

  function longRest() {
    setSessionsUsedToday(0)
  }

  return (
    <ProfileContext.Provider value={{ 
      profile, 
      profileId,
      updateProfile: updateProfileHandler, 
      isLoaded,
      loadError,
      sessionsUsedToday,
      spendForagingSessions,
      longRest
    }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const context = useContext(ProfileContext)
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider')
  }
  return context
}

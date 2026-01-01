/**
 * React Query Hooks
 * 
 * Centralized data fetching with automatic caching, deduplication,
 * and smart refetching. These hooks replace manual useEffect + useState
 * patterns throughout the app.
 * 
 * Usage:
 *   const { data, isLoading, error } = useInventory(profileId)
 * 
 * Benefits:
 *   - No refetch on tab switch (configurable)
 *   - Automatic caching across components
 *   - Request deduplication
 *   - Built-in loading/error states
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { getInventory, InventoryItem } from '../inventory'
import { getBrewedItems, fetchUserRecipes } from '../brewing'
import { getUserRecipes, getRecipeStats, UserRecipe } from '../recipes'
import { 
  fetchCharacter, 
  fetchCharacterSkills, 
  fetchCharacterArmor, 
  fetchArmorSlots,
  fetchSkills,
  fetchCharacterWeaponSlots,
  fetchCharacterQuickSlots,
  fetchCharacterWeapons,
  fetchCharacterItems,
  fetchWeaponTemplates,
  fetchMaterials,
  fetchItemTemplates,
} from '../db/characters'

import {
  fetchCharacterHerbs,
  fetchCharacterBrewedItems,
  fetchCharacterRecipes,
} from '../db/characterInventory'
import type { Biome, Skill, ArmorSlot, ArmorType, CharacterWeaponSlot, CharacterQuickSlot, CharacterWeapon, CharacterItem } from '../types'

// ============ Query Keys ============
// Centralized query keys for consistency and easy invalidation

export const queryKeys = {
  // Herbalism
  inventory: (profileId: string) => ['inventory', profileId] as const,
  brewedItems: (profileId: string) => ['brewedItems', profileId] as const,
  userRecipes: (profileId: string) => ['userRecipes', profileId] as const,
  recipeStats: (profileId: string) => ['recipeStats', profileId] as const,
  biomes: ['biomes'] as const,
  
  // Character
  character: (userId: string) => ['character', userId] as const,
  characterSkills: (characterId: string) => ['characterSkills', characterId] as const,
  characterArmor: (characterId: string) => ['characterArmor', characterId] as const,
  characterWeaponSlots: (characterId: string) => ['characterWeaponSlots', characterId] as const,
  characterQuickSlots: (characterId: string) => ['characterQuickSlots', characterId] as const,
  characterWeapons: (characterId: string) => ['characterWeapons', characterId] as const,
  characterItems: (characterId: string) => ['characterItems', characterId] as const,
  
  // Reference data (static, rarely changes)
  armorSlots: ['armorSlots'] as const,
  skills: ['skills'] as const,
  weaponTemplates: ['weaponTemplates'] as const,
  materials: ['materials'] as const,
  itemTemplates: ['itemTemplates'] as const,
  
  // Character-based inventory (new clean system)
  characterHerbs: (characterId: string) => ['characterHerbs', characterId] as const,
  characterBrewedItems: (characterId: string) => ['characterBrewedItems', characterId] as const,
  characterRecipesNew: (characterId: string) => ['characterRecipesNew', characterId] as const,
  characterRecipeStats: (characterId: string | undefined) => ['characterRecipeStats', characterId] as const,
}

// ============ Query Fetchers ============
// Shared fetcher functions used by both hooks and prefetch
// This avoids duplication and ensures consistency

const fetchers = {
  inventory: async (profileId: string) => {
    const result = await getInventory(profileId)
    if (result.error) throw new Error(result.error)
    return result.items
  },
  
  brewedItems: async (profileId: string) => {
    const result = await getBrewedItems(profileId)
    if (result.error) throw new Error(result.error)
    return result.items
  },
  
  userRecipesForBrewing: async (profileId: string) => {
    const result = await fetchUserRecipes(profileId)
    if (result.error) throw new Error(result.error)
    return result.recipes
  },
  
  userRecipesFull: async (profileId: string) => {
    const result = await getUserRecipes(profileId)
    if (result.error) throw new Error(result.error)
    return result.recipes
  },
  
  recipeStats: async (profileId: string) => {
    const result = await getRecipeStats(profileId)
    if (result.error) throw new Error(result.error)
    return {
      known: result.known,
      totalBase: result.totalBase,
      secretsUnlocked: result.secretsUnlocked,
    }
  },
  
  biomes: async () => {
    const { data, error } = await supabase
      .from('biomes')
      .select('*')
      .order('name')
    if (error) throw new Error(`Failed to load biomes: ${error.message}`)
    return (data || []) as Biome[]
  },
  
  character: async (userId: string) => {
    const result = await fetchCharacter(userId)
    if (result.error) throw new Error(result.error)
    return result.data
  },
  
  characterSkills: async (characterId: string) => {
    const result = await fetchCharacterSkills(characterId)
    if (result.error) throw new Error(result.error)
    return result.data || []
  },
  
  characterArmor: async (characterId: string) => {
    const result = await fetchCharacterArmor(characterId)
    if (result.error) throw new Error(result.error)
    return result.data || []
  },
  
  armorSlots: async () => {
    const result = await fetchArmorSlots()
    if (result.error) throw new Error(result.error)
    return result.data || []
  },
  
  skills: async () => {
    const result = await fetchSkills()
    if (result.error) throw new Error(result.error)
    return result.data || []
  },
  
  weaponTemplates: async () => {
    const result = await fetchWeaponTemplates()
    if (result.error) throw new Error(result.error)
    return result.data || []
  },
  
  materials: async () => {
    const result = await fetchMaterials()
    if (result.error) throw new Error(result.error)
    return result.data || []
  },
  
  itemTemplates: async () => {
    const result = await fetchItemTemplates()
    if (result.error) throw new Error(result.error)
    return result.data || []
  },
  
  // Character-based inventory (new clean system)
  characterHerbs: async (characterId: string) => {
    const result = await fetchCharacterHerbs(characterId)
    if (result.error) throw new Error(result.error)
    return result.data || []
  },
  
  characterBrewedItems: async (characterId: string) => {
    const result = await fetchCharacterBrewedItems(characterId)
    if (result.error) throw new Error(result.error)
    return result.data || []
  },
  
  characterRecipesNew: async (characterId: string) => {
    const result = await fetchCharacterRecipes(characterId)
    if (result.error) throw new Error(result.error)
    return result.data || []
  },

  characterRecipeStats: async (characterId: string) => {
    // Get all recipes known by the character
    const { data: characterRecipes, error: crError } = await supabase
      .from('character_recipes')
      .select('recipe_id')
      .eq('character_id', characterId)

    if (crError) throw new Error(crError.message)

    // Get all recipes to compute totals
    const { data: allRecipes, error: recipesError } = await supabase
      .from('recipes')
      .select('id, is_secret')

    if (recipesError) throw new Error(recipesError.message)

    const knownRecipeIds = new Set(characterRecipes?.map(cr => cr.recipe_id) || [])
    const totalBase = allRecipes?.filter(r => !r.is_secret).length || 0
    const secretsUnlocked = allRecipes?.filter(r => r.is_secret && knownRecipeIds.has(r.id)).length || 0

    return {
      known: knownRecipeIds.size,
      totalBase,
      secretsUnlocked,
    }
  },

  characterWeaponSlots: async (characterId: string) => {
    const result = await fetchCharacterWeaponSlots(characterId)
    if (result.error) throw new Error(result.error)
    return result.data || []
  },
  
  characterQuickSlots: async (characterId: string) => {
    const result = await fetchCharacterQuickSlots(characterId)
    if (result.error) throw new Error(result.error)
    return result.data || []
  },
  
  characterWeapons: async (characterId: string) => {
    const result = await fetchCharacterWeapons(characterId)
    if (result.error) throw new Error(result.error)
    return result.data || []
  },
  
  characterItems: async (characterId: string) => {
    const result = await fetchCharacterItems(characterId)
    if (result.error) throw new Error(result.error)
    return result.data || []
  },
}

// ============ Inventory Hooks ============

/**
 * @deprecated Use useCharacterHerbs with a character id instead.
 * Fetch user's herb inventory
 */
export function useInventory(profileId: string | null) {
  return useQuery({
    queryKey: queryKeys.inventory(profileId ?? ''),
    queryFn: () => fetchers.inventory(profileId!),
    enabled: !!profileId,
  })
}

/**
 * @deprecated Use useCharacterBrewedItems with a character id instead.
 * Fetch user's brewed items (elixirs, bombs, oils)
 */
export function useBrewedItems(profileId: string | null) {
  return useQuery({
    queryKey: queryKeys.brewedItems(profileId ?? ''),
    queryFn: () => fetchers.brewedItems(profileId!),
    enabled: !!profileId,
  })
}

// ============ Recipe Hooks ============

/**
 * @deprecated Use useCharacterRecipesNew with a character id instead.
 * Fetch recipes known by the user (for brewing)
 */
export function useUserRecipesForBrewing(profileId: string | null) {
  return useQuery({
    queryKey: queryKeys.userRecipes(profileId ?? ''),
    queryFn: () => fetchers.userRecipesForBrewing(profileId!),
    enabled: !!profileId,
  })
}

/**
 * @deprecated Use useCharacterRecipesNew with a character id instead.
 * Fetch recipes for the recipe book page (includes userRecipeId)
 */
export function useUserRecipes(profileId: string | null) {
  return useQuery({
    queryKey: [...queryKeys.userRecipes(profileId ?? ''), 'full'] as const,
    queryFn: () => fetchers.userRecipesFull(profileId!),
    enabled: !!profileId,
  })
}

/**
 * @deprecated Use useCharacterRecipeStats with a character id instead.
 * Fetch recipe statistics (known count, secrets unlocked)
 */
export function useRecipeStats(profileId: string | null) {
  return useQuery({
    queryKey: queryKeys.recipeStats(profileId ?? ''),
    queryFn: () => fetchers.recipeStats(profileId!),
    enabled: !!profileId,
  })
}

// ============ Biome Hooks ============

/**
 * Fetch all biomes (static reference data)
 */
export function useBiomes() {
  return useQuery({
    queryKey: queryKeys.biomes,
    queryFn: fetchers.biomes,
    // Biomes are static reference data - cache for longer
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}

// ============ Character Hooks ============

/**
 * Fetch the user's character
 */
export function useCharacter(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.character(userId ?? ''),
    queryFn: () => fetchers.character(userId!),
    enabled: !!userId,
  })
}

/**
 * Fetch character's skill proficiencies
 */
export function useCharacterSkills(characterId: string | null) {
  return useQuery({
    queryKey: queryKeys.characterSkills(characterId ?? ''),
    queryFn: () => fetchers.characterSkills(characterId!),
    enabled: !!characterId,
  })
}

/**
 * Fetch character's equipped armor
 */
export function useCharacterArmor(characterId: string | null) {
  return useQuery({
    queryKey: queryKeys.characterArmor(characterId ?? ''),
    queryFn: () => fetchers.characterArmor(characterId!),
    enabled: !!characterId,
  })
}

// ============ Reference Data Hooks ============

/**
 * Fetch all armor slots (static reference data)
 */
export function useArmorSlots() {
  return useQuery({
    queryKey: queryKeys.armorSlots,
    queryFn: fetchers.armorSlots,
    // Static reference data - cache indefinitely
    staleTime: Infinity,
  })
}

/**
 * Fetch all skills (static reference data)
 */
export function useSkills() {
  return useQuery({
    queryKey: queryKeys.skills,
    queryFn: fetchers.skills,
    // Static reference data - cache indefinitely
    staleTime: Infinity,
  })
}

/**
 * Fetch all weapon templates (static reference data)
 */
export function useWeaponTemplates() {
  return useQuery({
    queryKey: queryKeys.weaponTemplates,
    queryFn: fetchers.weaponTemplates,
    staleTime: Infinity,
  })
}

/**
 * Fetch all materials (static reference data)
 */
export function useMaterials() {
  return useQuery({
    queryKey: queryKeys.materials,
    queryFn: fetchers.materials,
    staleTime: Infinity,
  })
}

/**
 * Fetch all item templates (static reference data)
 */
export function useItemTemplates() {
  return useQuery({
    queryKey: queryKeys.itemTemplates,
    queryFn: fetchers.itemTemplates,
    staleTime: Infinity,
  })
}

// ============ Character-Based Inventory (New Clean System) ============

/**
 * Fetch character's herb inventory
 */
export function useCharacterHerbs(characterId: string | null) {
  return useQuery({
    queryKey: queryKeys.characterHerbs(characterId ?? ''),
    queryFn: () => fetchers.characterHerbs(characterId!),
    enabled: !!characterId,
  })
}

/**
 * Fetch character's brewed items
 */
export function useCharacterBrewedItems(characterId: string | null) {
  return useQuery({
    queryKey: queryKeys.characterBrewedItems(characterId ?? ''),
    queryFn: () => fetchers.characterBrewedItems(characterId!),
    enabled: !!characterId,
  })
}

/**
 * Fetch character's known recipes
 */
export function useCharacterRecipesNew(characterId: string | null) {
  return useQuery({
    queryKey: queryKeys.characterRecipesNew(characterId ?? ''),
    queryFn: () => fetchers.characterRecipesNew(characterId!),
    enabled: !!characterId,
  })
}

/**
 * Fetch character's recipe statistics (known count, secrets unlocked)
 */
export function useCharacterRecipeStats(characterId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.characterRecipeStats(characterId),
    queryFn: () => fetchers.characterRecipeStats(characterId!),
    enabled: !!characterId,
  })
}

// ============ Equipment Hooks ============

/**
 * Fetch character's weapon slots (with equipped weapons)
 */
export function useCharacterWeaponSlots(characterId: string | null) {
  return useQuery({
    queryKey: queryKeys.characterWeaponSlots(characterId ?? ''),
    queryFn: () => fetchers.characterWeaponSlots(characterId!),
    enabled: !!characterId,
  })
}

/**
 * Fetch character's quick slots (with assigned items)
 */
export function useCharacterQuickSlots(characterId: string | null) {
  return useQuery({
    queryKey: queryKeys.characterQuickSlots(characterId ?? ''),
    queryFn: () => fetchers.characterQuickSlots(characterId!),
    enabled: !!characterId,
  })
}

/**
 * Fetch all weapons owned by a character
 */
export function useCharacterWeapons(characterId: string | null) {
  return useQuery({
    queryKey: queryKeys.characterWeapons(characterId ?? ''),
    queryFn: () => fetchers.characterWeapons(characterId!),
    enabled: !!characterId,
  })
}

/**
 * Fetch all items owned by a character
 */
export function useCharacterItems(characterId: string | null) {
  return useQuery({
    queryKey: queryKeys.characterItems(characterId ?? ''),
    queryFn: () => fetchers.characterItems(characterId!),
    enabled: !!characterId,
  })
}

// ============ Cache Invalidation Helpers ============

/**
 * Hook to get cache invalidation functions
 * Use after mutations to refresh relevant data
 */
export function useInvalidateQueries() {
  const queryClient = useQueryClient()
  
  return {
    /** Invalidate inventory after adding/removing herbs */
    invalidateInventory: (profileId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory(profileId) })
    },
    
    /** Invalidate brewed items after brewing */
    invalidateBrewedItems: (profileId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.brewedItems(profileId) })
    },
    
    /** Invalidate recipes after unlocking a new recipe */
    invalidateRecipes: (profileId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userRecipes(profileId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.recipeStats(profileId) })
    },
    
    /** Invalidate character data after updates */
    invalidateCharacter: (userId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.character(userId) })
    },
    
    /** Invalidate character armor after equipping/removing */
    invalidateCharacterArmor: (characterId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.characterArmor(characterId) })
    },
    
    /** Invalidate weapon slots after equipping/removing weapons */
    invalidateWeaponSlots: (characterId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.characterWeaponSlots(characterId) })
    },
    
    /** Invalidate quick slots after assigning/removing items */
    invalidateQuickSlots: (characterId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.characterQuickSlots(characterId) })
    },
    
    /** Invalidate character weapons after adding/removing */
    invalidateCharacterWeapons: (characterId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.characterWeapons(characterId) })
    },
    
    /** Invalidate character items after adding/removing */
    invalidateCharacterItems: (characterId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.characterItems(characterId) })
    },
    
    /** Invalidate character herbs (new system) */
    invalidateCharacterHerbs: (characterId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.characterHerbs(characterId) })
    },
    
    /** Invalidate character brewed items (new system) */
    invalidateCharacterBrewedItems: (characterId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.characterBrewedItems(characterId) })
    },
    
    /** Invalidate character recipes (new system) */
    invalidateCharacterRecipesNew: (characterId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.characterRecipesNew(characterId) })
    },

    /** Invalidate character recipes and stats (new system) */
    invalidateCharacterRecipes: (characterId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.characterRecipesNew(characterId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.characterRecipeStats(characterId) })
    },

    /** Invalidate all user-specific data (e.g., on logout) */
    invalidateAllUserData: () => {
      // Legacy profile-based (keep until fully migrated)
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['brewedItems'] })
      queryClient.invalidateQueries({ queryKey: ['userRecipes'] })
      queryClient.invalidateQueries({ queryKey: ['recipeStats'] })

      // Character-based
      queryClient.invalidateQueries({ queryKey: ['character'] })
      queryClient.invalidateQueries({ queryKey: ['characterSkills'] })
      queryClient.invalidateQueries({ queryKey: ['characterArmor'] })
      queryClient.invalidateQueries({ queryKey: ['characterWeaponSlots'] })
      queryClient.invalidateQueries({ queryKey: ['characterQuickSlots'] })
      queryClient.invalidateQueries({ queryKey: ['characterWeapons'] })
      queryClient.invalidateQueries({ queryKey: ['characterItems'] })

      // Character-based herbalism (NEW)
      queryClient.invalidateQueries({ queryKey: ['characterHerbs'] })
      queryClient.invalidateQueries({ queryKey: ['characterBrewedItems'] })
      queryClient.invalidateQueries({ queryKey: ['characterRecipesNew'] })
      queryClient.invalidateQueries({ queryKey: ['characterRecipeStats'] })
    },
  }
}

// ============ Prefetching ============

/**
 * Hook to get prefetch functions for each page
 * Call these on link hover to preload data before navigation
 */
export function usePrefetch() {
  const queryClient = useQueryClient()
  
  return {
    /** Prefetch inventory page data */
    prefetchInventory: (profileId: string | null) => {
      if (!profileId) return
      
      queryClient.prefetchQuery({
        queryKey: queryKeys.inventory(profileId),
        queryFn: () => fetchers.inventory(profileId),
      })
      
      queryClient.prefetchQuery({
        queryKey: queryKeys.brewedItems(profileId),
        queryFn: () => fetchers.brewedItems(profileId),
      })
    },
    
    /** Prefetch forage page data */
    prefetchForage: () => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.biomes,
        queryFn: fetchers.biomes,
      })
    },
    
    /** Prefetch brew page data */
    prefetchBrew: (profileId: string | null) => {
      if (!profileId) return
      
      queryClient.prefetchQuery({
        queryKey: queryKeys.inventory(profileId),
        queryFn: () => fetchers.inventory(profileId),
      })
      
      queryClient.prefetchQuery({
        queryKey: queryKeys.userRecipes(profileId),
        queryFn: () => fetchers.userRecipesForBrewing(profileId),
      })
    },
    
    /** Prefetch recipes page data */
    prefetchRecipes: (profileId: string | null) => {
      if (!profileId) return
      
      queryClient.prefetchQuery({
        queryKey: [...queryKeys.userRecipes(profileId), 'full'],
        queryFn: () => fetchers.userRecipesFull(profileId),
      })
      
      queryClient.prefetchQuery({
        queryKey: queryKeys.recipeStats(profileId),
        queryFn: () => fetchers.recipeStats(profileId),
      })
    },
    
    /** Prefetch profile page data */
    prefetchProfile: (userId: string | null) => {
      if (!userId) return

      queryClient.prefetchQuery({
        queryKey: queryKeys.character(userId),
        queryFn: () => fetchers.character(userId),
      })

      queryClient.prefetchQuery({
        queryKey: queryKeys.armorSlots,
        queryFn: fetchers.armorSlots,
      })
    },

    /** Prefetch character herbalism data */
    prefetchCharacterHerbalism: (characterId: string | null) => {
      if (!characterId) return

      queryClient.prefetchQuery({
        queryKey: queryKeys.characterHerbs(characterId),
        queryFn: () => fetchers.characterHerbs(characterId),
      })
      queryClient.prefetchQuery({
        queryKey: queryKeys.characterBrewedItems(characterId),
        queryFn: () => fetchers.characterBrewedItems(characterId),
      })
      queryClient.prefetchQuery({
        queryKey: queryKeys.characterRecipesNew(characterId),
        queryFn: () => fetchers.characterRecipesNew(characterId),
      })
    },
  }
}

// ============ Type Exports ============

export type { InventoryItem } from '../inventory'
export type { UserRecipe } from '../recipes'
export type { 
  BrewedItem,
  LegacyBrewedItem,
  CharacterBrewedItem,
  CharacterHerb,
  CharacterRecipe,
  WeaponSlotNumber,
  QuickSlotNumber,
  CharacterWeaponSlot,
  CharacterQuickSlot,
  CharacterWeapon,
  CharacterItem,
  WeaponTemplate,
  Material,
  ItemTemplate,
  WeaponCategory,
  DamageType,
  WeaponProperty,
} from '../types'

// Re-export for convenience
export type CharacterSkillData = {
  skill: Skill
  is_proficient: boolean
  is_expertise: boolean
}

export type CharacterArmorData = {
  id: string
  slot_id: number
  armor_type: ArmorType
  custom_name: string | null
  material: string | null
  is_magical: boolean
  properties: Record<string, unknown> | null
  notes: string | null
  slot: ArmorSlot
}


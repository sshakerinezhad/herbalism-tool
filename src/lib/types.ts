/**
 * Shared type definitions for the herbalism tool
 * 
 * This file contains all the core types used throughout the application.
 * Types are organized by domain:
 * - Database Entities: Types that map to database tables
 * - User/Profile: Types related to user data
 * - Foraging: Types for the foraging system
 */

// ============ Database Entities ============

/** A herb that can be foraged and used in brewing */
export type Herb = {
  id: number
  name: string
  rarity: string
  elements: string[]
  description?: string | null
  property?: string | null
}

export type Biome = {
  id: number
  name: string
  description: string | null
}

/** Valid recipe/brew types */
export type RecipeType = 'elixir' | 'bomb' | 'oil'

export type Recipe = {
  id: number
  elements: string[]
  type: RecipeType
  name: string
  description: string | null
  recipe_text: string | null  // Clean text for recipe book display (no variable codes)
  lore: string | null
  is_secret: boolean
  unlock_code: string | null
}

export type BiomeHerb = {
  id: number
  biome_id: number
  herb_id: number
  weight: number // Decimal weight for foraging probability
  herbs: Herb // Joined data from herbs table
}

// ============ User/Profile Related ============

/**
 * User profile data
 * 
 * NOTE: Field name mapping to database:
 * - name → username
 * - brewingModifier → herbalism_modifier (historical naming)
 * 
 * See src/lib/profiles.ts for the mapping implementation.
 */
export type Profile = {
  /** Character name */
  name: string
  /** Whether the character has the Herbalist vocation (can brew) */
  isHerbalist: boolean
  /** Bonus to foraging checks (Nature/Survival) */
  foragingModifier: number
  /** Bonus to brewing checks (maps to herbalism_modifier in DB) */
  brewingModifier: number
  /** Max foraging sessions per day (resets on long rest) */
  maxForagingSessions: number
}

// ============ Foraging Related ============

export type SessionResult = {
  sessionNumber: number
  biome: Biome
  success: boolean
  checkRoll: number
  checkTotal: number
  quantityRolls?: string[]
  herbsFound?: Herb[]
}

export type ForageState = 
  | { phase: 'setup' }
  | { phase: 'rolling'; totalSessions: number; currentSession: number }
  | { phase: 'results'; sessionResults: SessionResult[] }


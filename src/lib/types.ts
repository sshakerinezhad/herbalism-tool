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

import { RecipeType } from './constants'

// Re-export for convenience
export type { RecipeType }

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

// ============ Knights of Belyar Character System ============

/** The 7 ability scores */
export type AbilityStat = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha' | 'hon'

/** Starting classes available at character creation */
export type StartingClass = 'barbarian' | 'blood_hunter' | 'fighter' | 'ranger' | 'rogue'

/** Background options */
export type Background = 'native_knight' | 'initiate'

/** Knight orders */
export type KnightOrder = 'fiendwreathers' | 'ghastbreakers' | 'beastwarks' | 'angelflayers' | 'dreamwalkers'

/** Available vocations */
export type Vocation = 'alchemist' | 'blacksmith' | 'herbalist' | 'priest' | 'runeseeker' | 'scholar' | 'spellscribe'

/** Armor weight categories */
export type ArmorType = 'light' | 'medium' | 'heavy'

/** Race options */
export type Race = 
  | 'human'
  | 'high_elf'
  | 'dwarf'
  | 'gnome'
  | 'halfling'
  | 'goliath'
  | 'firbolg'
  | 'orc'
  | 'half_orc'
  | 'goblin'

/** Human cultural groups (subraces) */
export type HumanCulture = 'yornic' | 'rolla' | 'kordian' | 'luski' | 'evarni' | 'icinni' | 'joton'

/** Core character stats (the 7 ability scores) */
export type CharacterStats = {
  str: number
  dex: number
  con: number
  int: number
  wis: number
  cha: number
  hon: number
}

/** Character money */
export type Money = {
  platinum: number
  gold: number
  silver: number
  copper: number
}

/** A skill from the skills reference table */
export type Skill = {
  id: number
  name: string
  stat: AbilityStat
  display_order: number
}

/** An armor slot from the armor_slots reference table */
export type ArmorSlot = {
  id: number
  slot_key: string
  display_name: string
  slot_order: number
  light_available: boolean
  light_piece_name: string | null
  light_bonus: number | null
  medium_available: boolean
  medium_piece_name: string | null
  medium_bonus: number | null
  heavy_available: boolean
  heavy_piece_name: string | null
  heavy_bonus: number | null
}

/** A piece of armor equipped by a character */
export type CharacterArmorPiece = {
  id: string
  character_id: string
  slot_id: number
  armor_type: ArmorType
  custom_name: string | null
  material: string | null
  is_magical: boolean
  properties: Record<string, unknown> | null
  notes: string | null
}

/** A weapon owned by a character */
export type CharacterWeapon = {
  id: string
  character_id: string
  name: string
  weapon_type: string | null
  material: string
  damage_dice: string | null
  damage_type: string | null
  properties: Record<string, unknown> | null
  attachments: Record<string, unknown> | null
  is_magical: boolean
  is_equipped: boolean
  notes: string | null
}

/** A general inventory item */
export type CharacterItem = {
  id: string
  character_id: string
  name: string
  category: string | null
  quantity: number
  properties: Record<string, unknown> | null
  is_quick_access: boolean
  notes: string | null
}

/** Full character data from database */
export type Character = {
  id: string
  user_id: string
  
  // Identity
  name: string
  race: Race
  subrace: string | null
  class: string  // Can be StartingClass or custom (secret classes)
  level: number
  background: Background
  previous_profession: string | null
  knight_order: KnightOrder
  vocation: Vocation | null
  feat: string | null
  touched_by_fate: string | null
  
  // Stats
  str: number
  dex: number
  con: number
  int: number
  wis: number
  cha: number
  hon: number
  
  // Combat
  hp_current: number
  hp_custom_modifier: number
  hit_dice_current: number
  
  // Money
  platinum: number
  gold: number
  silver: number
  copper: number
  
  // Flavor
  appearance: string | null
  artwork_url: string | null
  
  // Meta
  created_at: string
  updated_at: string
}

/** Character with related data (skills, armor, etc.) */
export type CharacterWithRelations = Character & {
  skills: Array<{
    skill: Skill
    is_proficient: boolean
    is_expertise: boolean
  }>
  armor: Array<CharacterArmorPiece & { slot: ArmorSlot }>
  weapons: CharacterWeapon[]
  items: CharacterItem[]
}

/** Data needed for character creation (subset of Character) */
export type CharacterCreationData = {
  name: string
  race: Race
  subrace: string | null
  class: StartingClass | string
  background: Background
  previous_profession: string | null
  knight_order: KnightOrder
  vocation: Vocation | null
  feat: string | null
  stats: CharacterStats
  skill_proficiencies: number[]  // Skill IDs
  appearance: string | null
  // Starting equipment will be separate
}

/** Armor preset for character creation */
export type ArmorPreset = {
  name: string
  description: string
  total_ac: number
  min_str: number
  pieces: Array<{
    slot_key: string
    armor_type: ArmorType
  }>
}


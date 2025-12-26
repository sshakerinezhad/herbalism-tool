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

/** Weapon categories */
export type WeaponCategory = 'simple_melee' | 'simple_ranged' | 'martial_melee' | 'martial_ranged'

/** Damage types */
export type DamageType = 
  | 'slashing' | 'piercing' | 'bludgeoning'
  | 'fire' | 'cold' | 'lightning' | 'acid' | 'poison'
  | 'necrotic' | 'radiant' | 'force' | 'psychic' | 'thunder'

/** Weapon properties */
export type WeaponProperty = 
  | 'light' | 'finesse' | 'heavy' | 'reach' | 'thrown' 
  | 'two-handed' | 'versatile' | 'ammunition' | 'loading' | 'special'

// ============ Reference Tables (Shared, Read-Only) ============

/** Material definition from materials reference table */
export type Material = {
  id: number
  name: string
  tier: number
  damage_bonus: number
  attack_bonus: number
  ac_bonus: number
  properties: Record<string, unknown>
  description: string | null
  cost_multiplier: number
}

/** Weapon template from weapon_templates reference table */
export type WeaponTemplate = {
  id: number
  name: string
  category: WeaponCategory
  damage_dice: string
  damage_type: DamageType
  versatile_dice: string | null
  properties: WeaponProperty[]
  range_normal: number | null
  range_long: number | null
  weight_lb: number | null
  base_cost_gp: number | null
  description: string | null
}

/** Item template from item_templates reference table */
export type ItemTemplate = {
  id: number
  name: string
  category: string
  uses: number | null
  ammo_type: string | null
  base_cost_gp: number | null
  weight_lb: number | null
  effects: Record<string, unknown>
  description: string | null
}

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
  is_two_handed: boolean
  notes: string | null
  // Template references (new architecture)
  template_id: number | null
  material_id: number | null
  // Joined data
  template?: WeaponTemplate | null
  material_ref?: Material | null
}

/** Hand type for weapon slots */
export type WeaponHand = 'right' | 'left'

/** A weapon slot (3 per hand, Elden Ring style) */
export type CharacterWeaponSlot = {
  id: string
  character_id: string
  hand: WeaponHand
  slot_number: WeaponSlotNumber
  weapon_id: string | null
  is_active: boolean
  selected_ammo_id: string | null
  // Joined data
  weapon?: CharacterWeapon | null
  selected_ammo?: CharacterItem | null
}

/** A quick slot for combat items */
export type CharacterQuickSlot = {
  id: string
  character_id: string
  slot_number: QuickSlotNumber
  item_id: string | null
  brewed_item_id: number | null  // References character_brewed.id (mapped from character_brewed_id)
  // Joined data
  item?: CharacterItem | null
  brewed_item?: CharacterBrewedItem | null
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
  ammo_type: string | null  // For ammo items: 'arrow', 'bolt', etc.
  notes: string | null
  // Template reference (new architecture)
  template_id: number | null
  // Joined data
  template?: ItemTemplate | null
}

// ============ Slot Number Types ============

/** Valid weapon slot numbers (3 per hand) */
export type WeaponSlotNumber = 1 | 2 | 3

/** Valid quick slot numbers (6 total) */
export type QuickSlotNumber = 1 | 2 | 3 | 4 | 5 | 6

// ============ Brewed Items ============

/** A brewed item (elixir, bomb, oil) from the herbalism system */
/** Legacy brewed item (from user_brewed) - DEPRECATED */
export type LegacyBrewedItem = {
  id: number
  type: string
  effects: string[] | string  // Can be array or JSON string from DB
  quantity: number
  computedDescription?: string
  choices?: Record<string, string>
}

/** Character's brewed item (from character_brewed) */
export type CharacterBrewedItem = {
  id: number
  character_id: string
  type: 'elixir' | 'bomb' | 'oil'
  effects: string[]  // Always array in new table (JSONB)
  choices: Record<string, string>
  computed_description: string | null
  quantity: number
  created_at: string
  updated_at: string
}

/** Character's herb inventory item (from character_herbs) */
export type CharacterHerb = {
  id: number
  character_id: string
  herb_id: number
  quantity: number
  herb?: Herb  // Joined from herbs table
}

/** Character's known recipe (from character_recipes) */
export type CharacterRecipe = {
  id: number
  character_id: string
  recipe_id: number
  unlocked_at: string
}

// Re-export for backward compatibility during migration
export type BrewedItem = LegacyBrewedItem

// ============ Character ============

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
  weapon_slots: CharacterWeaponSlot[]
  quick_slots: CharacterQuickSlot[]
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


// Shared type definitions for the herbalism tool

// ============ Database Entities ============

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

export type Recipe = {
  id: number
  elements: string[]
  type: 'elixir' | 'bomb' | string
  name: string
  description: string | null
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

export type Profile = {
  name: string
  isHerbalist: boolean
  foragingModifier: number
  brewingModifier: number
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


/**
 * Shared constants for the herbalism tool
 * 
 * This file contains all game-related constants that are used across multiple pages.
 * Centralizing these prevents duplication and makes updates easier.
 */

// ============ Element Display ============

/** Emoji symbols for each element type */
export const ELEMENT_SYMBOLS: Record<string, string> = {
  fire: '🔥',
  water: '💧',
  earth: '⛰️',
  air: '💨',
  positive: '✨',
  negative: '💀',
}

/** Color schemes for element-based styling */
export const ELEMENT_COLORS: Record<string, {
  bg: string
  border: string
  text: string
  header: string
  row1: string
  row2: string
}> = {
  fire: {
    bg: 'bg-red-950/30',
    border: 'border-red-800/50',
    text: 'text-red-200',
    header: 'bg-red-900/40',
    row1: 'bg-red-950/30',
    row2: 'bg-red-950/10',
  },
  water: {
    bg: 'bg-blue-600/20',
    border: 'border-blue-800/50',
    text: 'text-blue-200',
    header: 'bg-blue-600/40',
    row1: 'bg-blue-600/20',
    row2: 'bg-blue-600/5',
  },
  earth: {
    bg: 'bg-green-950/30',
    border: 'border-green-800/50',
    text: 'text-green-200',
    header: 'bg-green-900/40',
    row1: 'bg-green-950/30',
    row2: 'bg-green-950/10',
  },
  air: {
    bg: 'bg-zinc-400/30',
    border: 'border-zinc-500/50',
    text: 'text-zinc-200',
    header: 'bg-zinc-300/40',
    row1: 'bg-zinc-400/30',
    row2: 'bg-zinc-400/10',
  },
  positive: {
    bg: 'bg-yellow-400/20',
    border: 'border-yellow-400/50',
    text: 'text-yellow-200',
    header: 'bg-yellow-400/30',
    row1: 'bg-yellow-400/20',
    row2: 'bg-yellow-400/10',
  },
  negative: {
    bg: 'bg-purple-950/30',
    border: 'border-purple-800/50',
    text: 'text-purple-200',
    header: 'bg-purple-900/40',
    row1: 'bg-purple-950/30',
    row2: 'bg-purple-950/10',
  },
  mixed: {
    bg: 'bg-zinc-800/20',
    border: 'border-zinc-700/50',
    text: 'text-zinc-200',
    header: 'bg-zinc-700/40',
    row1: 'bg-zinc-800/30',
    row2: 'bg-zinc-800/10',
  },
}

/** Canonical order for sorting elements */
export const ELEMENT_ORDER = ['fire', 'water', 'earth', 'air', 'positive', 'negative'] as const

// ============ Rarity ============

/** Canonical order for sorting rarities (common → preternatural) */
export const RARITY_ORDER = [
  'common',
  'uncommon', 
  'rare',
  'very rare',
  'legendary',
  'preternatural',
] as const

// ============ Game Mechanics ============

/** Difficulty class for foraging checks */
export const FORAGING_DC = 13

/** Difficulty class for brewing checks */
export const BREWING_DC = 15

/** Maximum number of herbs that can be used in a single brew */
export const MAX_HERBS_PER_BREW = 6

// ============ Recipe Types ============

/** Valid recipe/brew types */
export const RECIPE_TYPES = ['elixir', 'bomb', 'oil'] as const
export type RecipeType = typeof RECIPE_TYPES[number]

// ============ Element Utilities ============

/**
 * Get the emoji symbol for an element
 * @param element - The element name (case-insensitive)
 * @returns The emoji symbol, or '●' for unknown elements
 */
export function getElementSymbol(element: string): string {
  return ELEMENT_SYMBOLS[element.toLowerCase()] || '●'
}

/**
 * Get the color scheme for an element
 * @param element - The element name (case-insensitive)
 * @returns Color scheme object with bg, border, text, etc.
 */
export function getElementColors(element: string) {
  return ELEMENT_COLORS[element.toLowerCase()] || ELEMENT_COLORS.mixed
}

/**
 * Get the primary (most common) element from an array of elements
 * @param elements - Array of element names
 * @returns The primary element, or the first element if tied, or null if empty
 */
export function getPrimaryElement(elements: string[] | undefined | null): string | null {
  if (!elements || elements.length === 0) return null
  
  const counts = new Map<string, number>()
  for (const el of elements) {
    counts.set(el, (counts.get(el) || 0) + 1)
  }
  
  const maxCount = Math.max(...counts.values())
  const topElements = Array.from(counts.entries())
    .filter(([, count]) => count === maxCount)
    .map(([el]) => el)
  
  // If tied, return the first element in the original array
  if (topElements.length > 1) {
    return elements[0]
  }
  
  return topElements[0]
}

/**
 * Get the sort index for a rarity
 * @param rarity - The rarity name (case-insensitive)
 * @returns Sort index (0 = common, higher = rarer), or 999 for unknown
 */
export function getRarityIndex(rarity: string): number {
  const idx = RARITY_ORDER.indexOf(rarity.toLowerCase() as typeof RARITY_ORDER[number])
  return idx === -1 ? 999 : idx
}

/**
 * Get the sort index for an element
 * @param element - The element name (case-insensitive)
 * @returns Sort index, or 999 for unknown elements
 */
export function getElementIndex(element: string): number {
  const idx = ELEMENT_ORDER.indexOf(element.toLowerCase() as typeof ELEMENT_ORDER[number])
  return idx === -1 ? 999 : idx
}

// ============ Knights of Belyar Character System ============

import type { Race, HumanCulture, StartingClass, Background, KnightOrder, Vocation, AbilityStat, ArmorPreset } from './types'

/** Race display info */
export const RACES: Record<Race, { name: string; hasSubrace: boolean }> = {
  human: { name: 'Human', hasSubrace: true },
  high_elf: { name: 'High Elf', hasSubrace: false },
  dwarf: { name: 'Dwarf', hasSubrace: false },
  gnome: { name: 'Gnome', hasSubrace: false },
  halfling: { name: 'Halfling', hasSubrace: false },
  goliath: { name: 'Goliath', hasSubrace: false },
  firbolg: { name: 'Firbolg', hasSubrace: false },
  orc: { name: 'Orc', hasSubrace: false },
  half_orc: { name: 'Half-Orc', hasSubrace: false },
  goblin: { name: 'Goblin', hasSubrace: false },
}

/** Human cultural groups with descriptions */
export const HUMAN_CULTURES: Record<HumanCulture, { name: string; region: string; religion: string; languages: string[] }> = {
  yornic: { name: 'Yornic', region: 'North of England', religion: 'Trinitarianism', languages: ['Rollo'] },
  rolla: { name: 'Rolla', region: 'South England/North France', religion: 'Trinitarianism', languages: ['Rollo'] },
  kordian: { name: 'Kordian', region: 'Germany', religion: 'Thalichurianism', languages: ['Rollo', 'Kordic'] },
  luski: { name: "Lu'Ski", region: 'Serbia', religion: 'Many Masks', languages: ['Evarni'] },
  evarni: { name: 'Evarni', region: 'Russia', religion: 'Trinitarianism', languages: ['Evarni'] },
  icinni: { name: 'Icinni', region: 'Scotland', religion: 'Regional closed religions', languages: ['Icinni'] },
  joton: { name: 'Joton', region: 'Norway', religion: 'Religion of the sea', languages: ['Icinni', 'Kordic'] },
}

/** Starting classes with proficiency counts */
export const CLASSES: Record<StartingClass, { name: string; proficiencies: number; requiresBackground?: Background }> = {
  barbarian: { name: 'Barbarian', proficiencies: 2 },
  blood_hunter: { name: 'Blood Hunter', proficiencies: 3, requiresBackground: 'native_knight' },
  fighter: { name: 'Fighter', proficiencies: 2 },
  ranger: { name: 'Ranger', proficiencies: 3 },
  rogue: { name: 'Rogue', proficiencies: 4 },
}

/** Background options */
export const BACKGROUNDS: Record<Background, { name: string; description: string }> = {
  native_knight: { 
    name: 'Native-Knight', 
    description: 'Born into the Knights of Belyar, enhanced by charnel magics. Can be a Blood Hunter.' 
  },
  initiate: { 
    name: 'Initiate', 
    description: 'Joined as an adult from another profession. Must complete three contracts.' 
  },
}

/** Knight orders with creature focus */
export const KNIGHT_ORDERS: Record<KnightOrder, { name: string; focus: string; description: string }> = {
  fiendwreathers: { 
    name: 'Order of Fiendwreathers', 
    focus: 'Fiends (devils, demons)',
    description: 'Hunt the devils and demons of hell. Noted by golden weapons and obscure hand-signs.'
  },
  ghastbreakers: { 
    name: 'Order of Ghastbreakers', 
    focus: 'Undead (ghouls, ghosts)',
    description: 'Hunt the restless dead. Noted by the smell of garlic and the drug Skein.'
  },
  beastwarks: { 
    name: 'Order of Beastwarks', 
    focus: 'Monstrosities, Dragons',
    description: 'The most common order. Generalists who hunt monstrosities and dragons.'
  },
  angelflayers: { 
    name: 'Order of Angelflayers', 
    focus: 'Celestials (angels)',
    description: 'Hunt angels and celestials. Work for free, deal in blood sacrifice. Not well trusted.'
  },
  dreamwalkers: { 
    name: 'Order of Dreamwalkers', 
    focus: 'Somni (mind creatures)',
    description: 'A new order. Hunt creatures of the mind, venture into silver dreams.'
  },
}

/** Vocations with descriptions */
export const VOCATIONS: Record<Vocation, { name: string; description: string }> = {
  alchemist: { name: 'Alchemist', description: 'Brew potions from monster organs.' },
  blacksmith: { name: 'Blacksmith', description: 'Craft weapons, modify equipment.' },
  herbalist: { name: 'Herbalist', description: 'Brew elixirs from plants and herbs.' },
  priest: { name: 'Priest/Priestess', description: 'Divine boons and blessings.' },
  runeseeker: { name: 'Runeseeker', description: 'Giant magic, rune crafting.' },
  scholar: { name: 'Scholar', description: 'Knowledge gathering, languages.' },
  spellscribe: { name: 'Spellscribe', description: 'Craft spell scrolls.' },
}

/** Ability score names */
export const ABILITY_NAMES: Record<AbilityStat, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
  hon: 'Honor',
}

/** Proficiency bonus by level */
export function getProficiencyBonus(level: number): number {
  if (level <= 4) return 2
  if (level <= 8) return 3
  if (level <= 12) return 4
  if (level <= 16) return 5
  return 6
}

/** Calculate ability modifier from score */
export function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

/** Calculate HP max: 26 + (4 × CON modifier) + custom modifier */
export function calculateMaxHP(conScore: number, customModifier: number = 0): number {
  const conMod = getAbilityModifier(conScore)
  return 26 + (4 * conMod) + customModifier
}

/** Calculate hit dice max: 2 + proficiency bonus */
export function calculateMaxHitDice(level: number): number {
  return 2 + getProficiencyBonus(level)
}

/** Armor presets that result in AC 14 */
export const ARMOR_PRESETS: ArmorPreset[] = [
  {
    name: 'Light Scout',
    description: 'Full light armor. Best for high DEX characters.',
    total_ac: 14, // Assumes DEX +1: 6 base + 7 pieces + 1 DEX = 14
    min_str: 0,
    pieces: [
      { slot_key: 'head', armor_type: 'light' },
      { slot_key: 'chest', armor_type: 'light' },
      { slot_key: 'left_hand', armor_type: 'light' },
      { slot_key: 'right_hand', armor_type: 'light' },
      { slot_key: 'left_foot', armor_type: 'light' },
      { slot_key: 'right_foot', armor_type: 'light' },
    ],
  },
  {
    name: 'Medium Fighter',
    description: 'Balanced medium armor. Good for most builds.',
    total_ac: 14, // 8 base + 4 pieces + 2 DEX (max) = 14
    min_str: 13,
    pieces: [
      { slot_key: 'chest', armor_type: 'medium' },
      { slot_key: 'left_hand', armor_type: 'medium' },
      { slot_key: 'right_hand', armor_type: 'medium' },
    ],
  },
  {
    name: 'Heavy Defender',
    description: 'Heavy armor pieces. Requires STR 15, no DEX bonus.',
    total_ac: 14, // 0 base + 14 pieces = 14
    min_str: 15,
    pieces: [
      { slot_key: 'head', armor_type: 'heavy' },
      { slot_key: 'chest', armor_type: 'heavy' },
      { slot_key: 'left_hand', armor_type: 'heavy' },
      { slot_key: 'right_hand', armor_type: 'heavy' },
      { slot_key: 'left_foot', armor_type: 'heavy' },
      { slot_key: 'right_foot', armor_type: 'heavy' },
    ],
  },
]


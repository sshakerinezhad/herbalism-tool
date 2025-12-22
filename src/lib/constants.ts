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
export function getPrimaryElement(elements: string[]): string | null {
  if (elements.length === 0) return null
  
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


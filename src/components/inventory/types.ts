/**
 * Shared types for inventory components
 */

// Tab navigation types
export type MainTab = 'equipment' | 'herbalism'
export type EquipmentSubTab = 'weapons' | 'items'
export type ViewTab = 'herbs' | 'brewed'

// Filter and sort types
export type SortMode = 'rarity' | 'element'
export type BrewedTypeFilter = 'all' | 'elixir' | 'bomb' | 'oil'

// Modal mode types
export type WeaponModalMode = 'template' | 'custom'
export type ItemModalMode = 'template' | 'custom'

// Helper functions
export function getCategoryIcon(category: string | null): string {
  const icons: Record<string, string> = {
    simple_melee: '🗡️',
    simple_ranged: '🏹',
    martial_melee: '⚔️',
    martial_ranged: '🎯',
    potion: '🧪',
    scroll: '📜',
    gear: '⚙️',
    ammo: '🏹',
    food: '🍖',
    tool: '🔧',
    container: '📦',
  }
  return icons[category || ''] || '📦'
}

export function formatCategory(category: string): string {
  return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

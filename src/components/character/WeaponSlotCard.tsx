/**
 * WeaponSlotCard Component
 *
 * Compact weapon display card with video game aesthetic.
 * Uses grimoire/sepia/bronze palette with ItemTooltip integration.
 *
 * Layout:
 * ┌─────────────────────────┐
 * │  [⚔️]  Longsword        │  ← Icon + Name
 * │  1d8 slashing • Steel   │  ← Damage + Material
 * └─────────────────────────┘
 */

'use client'

import type { CharacterWeapon, WeaponSlotNumber } from '@/lib/types'
import { ItemTooltip } from '@/components/ui/ItemTooltip'

// ============ Types ============

interface WeaponSlotCardProps {
  weapon: CharacterWeapon | null
  slotNumber: WeaponSlotNumber
  isSelected: boolean
  disabled: boolean
  /** In edit mode, clicking opens selection panel instead of tooltip */
  editMode?: boolean
  onClick: () => void
}

// ============ Icon Mapping ============

const WEAPON_ICONS: Record<string, string> = {
  // Swords
  longsword: '⚔️',
  shortsword: '⚔️',
  greatsword: '⚔️',
  rapier: '⚔️',
  scimitar: '⚔️',
  sword: '⚔️',

  // Daggers
  dagger: '🗡️',
  knife: '🗡️',

  // Axes
  handaxe: '🪓',
  battleaxe: '🪓',
  greataxe: '🪓',
  axe: '🪓',

  // Bows & Ranged
  shortbow: '🏹',
  longbow: '🏹',
  bow: '🏹',
  crossbow: '🏹',
  light_crossbow: '🏹',
  heavy_crossbow: '🏹',

  // Staves & Magical
  staff: '🪄',
  quarterstaff: '🪄',
  wand: '🪄',

  // Hammers & Maces
  mace: '🔨',
  hammer: '🔨',
  warhammer: '🔨',
  maul: '🔨',
  club: '🔨',
  flail: '🔨',
  morningstar: '🔨',

  // Polearms
  spear: '🔱',
  trident: '🔱',
  pike: '🔱',
  halberd: '🔱',
  glaive: '🔱',
  javelin: '🔱',
  lance: '🔱',

  // Shields
  shield: '🛡️',
}

function getWeaponIcon(weapon: CharacterWeapon | null): string {
  if (!weapon) return '〇'

  // Check weapon_type first
  if (weapon.weapon_type) {
    const typeKey = weapon.weapon_type.toLowerCase().replace(/\s+/g, '_')
    if (WEAPON_ICONS[typeKey]) return WEAPON_ICONS[typeKey]
  }

  // Fall back to name matching
  const nameLower = weapon.name.toLowerCase()
  for (const [key, icon] of Object.entries(WEAPON_ICONS)) {
    if (nameLower.includes(key.replace(/_/g, ' '))) {
      return icon
    }
  }

  // Default weapon icon
  return '⚔️'
}

// ============ Component ============

export function WeaponSlotCard({
  weapon,
  slotNumber,
  isSelected,
  disabled,
  editMode = false,
  onClick,
}: WeaponSlotCardProps) {
  const isEmpty = !weapon
  const icon = getWeaponIcon(weapon)

  // Determine visual state styling
  let borderClass = 'border-sepia-700'
  let bgClass = 'bg-grimoire-900'
  let ringClass = ''

  if (isSelected) {
    borderClass = 'border-bronze-bright'
    bgClass = 'bg-bronze-muted/10'
    ringClass = 'ring-1 ring-bronze-bright/50'
  } else if (!isEmpty) {
    borderClass = 'border-sepia-600'
  }

  const cardContent = (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full p-3 rounded-lg text-left transition-all
        border-2 ${borderClass} ${bgClass} ${ringClass}
        ${isEmpty ? 'border-dashed' : ''}
        ${!disabled ? 'hover:border-bronze-muted hover:bg-grimoire-850 cursor-pointer' : 'cursor-not-allowed'}
      `}
    >
      <div className="flex items-center gap-3">
        {/* Slot number badge */}
        <span className={`
          text-xs font-bold w-6 h-6 rounded flex items-center justify-center shrink-0
          ${isSelected
            ? 'bg-bronze-bright text-grimoire-950'
            : 'bg-grimoire-800 text-vellum-300 border border-sepia-700'
          }
        `}>
          {slotNumber}
        </span>

        {/* Weapon info */}
        {weapon ? (
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate flex items-center gap-1.5 text-vellum-100">
              <span className="text-base">{icon}</span>
              {weapon.is_magical && <span className="text-purple-400 text-xs">✨</span>}
              <span className="truncate">{weapon.name}</span>
            </div>
            <div className="text-xs text-vellum-400 mt-0.5 flex items-center gap-1">
              <span className="text-amber-400/80 font-mono">{weapon.damage_dice}</span>
              <span>{weapon.damage_type}</span>
              {weapon.material && (
                <>
                  <span className="text-sepia-600">•</span>
                  <span className="text-vellum-300">{weapon.material}</span>
                </>
              )}
              {weapon.is_two_handed && (
                <span className="text-amber-500 ml-1 text-[10px] bg-amber-900/30 px-1 rounded">2H</span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 min-w-0">
            <div className="text-sm text-vellum-400 italic">Empty</div>
          </div>
        )}
      </div>
    </button>
  )

  // In edit mode, don't wrap with tooltip (clicking opens selection panel)
  if (editMode || isEmpty) {
    return cardContent
  }

  // Wrap with ItemTooltip for view mode
  return (
    <ItemTooltip
      name={weapon.name}
      icon={icon}
      details={{
        damage: weapon.damage_dice ?? undefined,
        damageType: weapon.damage_type ?? undefined,
        material: weapon.material,
        isMagical: weapon.is_magical,
        isTwoHanded: weapon.is_two_handed,
        notes: weapon.notes ?? undefined,
        properties: weapon.properties ?? undefined,
        category: weapon.weapon_type ?? 'weapon',
      }}
      clickOnly={editMode}
    >
      {cardContent}
    </ItemTooltip>
  )
}

// ============ Exports ============

export type { WeaponSlotCardProps }
export { getWeaponIcon, WEAPON_ICONS }

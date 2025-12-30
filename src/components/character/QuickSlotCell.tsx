/**
 * QuickSlotCell Component
 *
 * Square item cell for quick slots with video game aesthetic.
 * Uses grimoire/sepia/bronze palette with ItemTooltip integration.
 *
 * Layout:
 * ┌──────────┐
 * │   [🧪]   │  ← Large centered icon
 * │  Elixir  │  ← Item type/name
 * │   ×3     │  ← Quantity (if > 1)
 * └──────────┘
 */

'use client'

import type { CharacterItem, CharacterBrewedItem, QuickSlotNumber } from '@/lib/types'
import { ItemTooltip } from '@/components/ui/ItemTooltip'
import { formatBrewedEffects } from '@/components/inventory'

// ============ Types ============

interface QuickSlotCellProps {
  item: CharacterItem | null
  brewedItem: CharacterBrewedItem | null
  slotNumber: QuickSlotNumber
  locked: boolean
  onClick: () => void
}

// ============ Category Icons ============

const CATEGORY_ICONS: Record<string, string> = {
  // Brewed types
  elixir: '🧪',
  bomb: '💣',
  oil: '🫗',

  // Item categories
  potion: '🧪',
  scroll: '📜',
  gear: '⚙️',
  tool: '🔧',
  food: '🍖',
  ammo: '🏹',
  magic: '🔮',
  rope: '🪢',
  torch: '🔦',
  default: '📦',
}

function getCategoryIcon(category: string | null | undefined): string {
  if (!category) return CATEGORY_ICONS.default
  return CATEGORY_ICONS[category.toLowerCase()] ?? CATEGORY_ICONS.default
}

// ============ Component ============

export function QuickSlotCell({
  item,
  brewedItem,
  slotNumber,
  locked,
  onClick,
}: QuickSlotCellProps) {
  const hasContent = item || brewedItem
  const isBrewed = !!brewedItem

  // Unified display values
  const displayName = item?.name ?? (brewedItem ? formatBrewedEffects(brewedItem.effects) : null)
  const displayCategory = item?.category ?? brewedItem?.type ?? null
  const displayQuantity = item?.quantity ?? brewedItem?.quantity ?? 1
  const displayNotes = item?.notes ?? brewedItem?.computed_description ?? null

  // Truncate name for display
  const truncatedName = displayName
    ? displayName.length > 10 ? displayName.slice(0, 9) + '…' : displayName
    : null

  // Styling based on state
  let borderClass = 'border-sepia-700'
  let bgClass = 'bg-grimoire-900'

  if (!hasContent) {
    borderClass = 'border-sepia-700/50 border-dashed'
    bgClass = 'bg-grimoire-950'
  } else if (isBrewed) {
    borderClass = 'border-emerald-700/50'
    bgClass = 'bg-emerald-900/10'
  }

  const cellContent = (
    <button
      type="button"
      onClick={onClick}
      disabled={locked && !hasContent}
      className={`
        aspect-square rounded-lg border-2 flex flex-col items-center justify-center
        transition-all p-1.5 w-full min-w-0
        ${borderClass} ${bgClass}
        ${!locked
          ? 'hover:border-bronze-muted hover:bg-grimoire-850 cursor-pointer'
          : hasContent
            ? 'cursor-pointer'
            : 'cursor-default'
        }
      `}
    >
      {hasContent && displayName ? (
        <>
          {/* Large icon */}
          <span className="text-xl">{getCategoryIcon(displayCategory)}</span>

          {/* Item name */}
          <span className="text-[10px] text-vellum-200 truncate w-full text-center mt-1 leading-tight">
            {truncatedName}
          </span>

          {/* Quantity badge */}
          {displayQuantity > 1 && (
            <span className="text-[9px] text-vellum-400 mt-0.5">×{displayQuantity}</span>
          )}
        </>
      ) : (
        <>
          {/* Empty state */}
          <span className="text-lg text-sepia-600/50">○</span>
          <span className="text-[10px] text-sepia-600/50">{slotNumber}</span>
        </>
      )}
    </button>
  )

  // Wrap with tooltip if slot has content (tooltip shows in both locked and unlocked)
  if (hasContent && displayName) {
    return (
      <ItemTooltip
        name={displayName}
        icon={getCategoryIcon(displayCategory)}
        details={{
          category: displayCategory ?? undefined,
          quantity: displayQuantity,
          notes: displayNotes ?? undefined,
          description: brewedItem?.computed_description ?? undefined,
        }}
        clickOnly={!locked} // In edit mode, clicks open selector, not tooltip modal
      >
        {cellContent}
      </ItemTooltip>
    )
  }

  return cellContent
}

// ============ Exports ============

export type { QuickSlotCellProps }
export { getCategoryIcon, CATEGORY_ICONS }

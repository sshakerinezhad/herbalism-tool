/**
 * QuickSlots Component
 * 
 * Combat inventory with 6 slots for quick-access items.
 * Used for potions, bombs, scrolls, and other frequently used items.
 * 
 * Features:
 * - 6 slots in a horizontal bar
 * - Shows item name, quantity, and category icon
 * - Lock toggle for editing
 * - Click slot to assign/change item
 * 
 * @example
 * <QuickSlots
 *   characterId={character.id}
 *   quickSlots={slots}
 *   items={allItems}
 *   onUpdate={() => invalidateQuickSlots(characterId)}
 * />
 */

'use client'

import { useState } from 'react'
import type { CharacterQuickSlot, CharacterItem, BrewedItem, QuickSlotNumber } from '@/lib/types'
import { setQuickSlotItem } from '@/lib/db/characters'
import { formatBrewedEffects } from '@/components/inventory'

// ============ Types ============

interface QuickSlotsProps {
  characterId: string
  quickSlots: CharacterQuickSlot[]
  items: CharacterItem[]
  brewedItems?: BrewedItem[]
  onUpdate?: () => void
}

// ============ Category Icons ============

const CATEGORY_ICONS: Record<string, string> = {
  potion: '🧪',
  elixir: '🧪',
  bomb: '💣',
  scroll: '📜',
  gear: '⚙️',
  tool: '🔧',
  food: '🍖',
  ammo: '🏹',
  magic: '🔮',
  default: '📦',
}

function getCategoryIcon(category: string | null): string {
  if (!category) return CATEGORY_ICONS.default
  return CATEGORY_ICONS[category.toLowerCase()] ?? CATEGORY_ICONS.default
}

// ============ Component ============

export function QuickSlots({
  characterId,
  quickSlots,
  items,
  brewedItems = [],
  onUpdate,
}: QuickSlotsProps) {
  const [locked, setLocked] = useState(true)
  const [selectingSlot, setSelectingSlot] = useState<QuickSlotNumber | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Sort slots by number
  const sortedSlots = [...quickSlots].sort((a, b) => a.slot_number - b.slot_number)
  
  // Convert brewed items to CharacterItem format for unified display
  const brewedAsItems: CharacterItem[] = brewedItems.map(b => ({
    id: `brewed:${b.id}`,
    character_id: characterId,
    name: formatBrewedEffects(b.effects),
    category: b.type,
    quantity: b.quantity,
    properties: null,
    is_quick_access: false,
    ammo_type: null,
    notes: b.computedDescription || null,
  }))
  
  // Combine regular items with brewed items
  const allItems = [...items, ...brewedAsItems]

  async function handleSlotClick(slotNumber: QuickSlotNumber) {
    if (locked) return
    setSelectingSlot(slotNumber)
  }

  async function handleAssignItem(itemId: string | null) {
    if (selectingSlot === null) return
    
    // Check if trying to assign a brewed item (starts with 'brewed:')
    if (itemId && itemId.startsWith('brewed:')) {
      setError('Brewed items cannot be assigned to quick slots yet. This feature is coming soon!')
      setSelectingSlot(null)
      return
    }

    const { error: err } = await setQuickSlotItem(characterId, selectingSlot, itemId)

    if (err) {
      setError(err)
    } else {
      setError(null)
      onUpdate?.()
    }
    setSelectingSlot(null)
  }

  return (
    <div className="bg-zinc-800 rounded-lg p-5 border border-zinc-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">Quick Slots</h2>
        <button
          onClick={() => setLocked(!locked)}
          aria-label={locked ? 'Unlock quick slot editing' : 'Lock quick slot editing'}
          className={`text-xs px-2 py-0.5 rounded transition-colors ${
            locked 
              ? 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600' 
              : 'bg-amber-600 text-white hover:bg-amber-500'
          }`}
        >
          {locked ? '🔒' : '🔓'}
        </button>
      </div>

      {error && (
        <div className="text-red-400 text-xs bg-red-900/20 border border-red-800 rounded px-2 py-1 mb-4">
          {error}
        </div>
      )}

      {/* Slots Grid */}
      <div className="grid grid-cols-6 gap-2">
        {([1, 2, 3, 4, 5, 6] as const).map(slotNum => {
          const slot = sortedSlots.find(s => s.slot_number === slotNum)
          return (
            <QuickSlotButton
              key={slotNum}
              slot={slot}
              slotNumber={slotNum}
              locked={locked}
              onClick={() => handleSlotClick(slotNum)}
            />
          )
        })}
      </div>

      {/* Hint */}
      <p className="text-xs text-zinc-500 mt-3 text-center">
        {locked ? 'Unlock to assign items to slots' : 'Click a slot to assign an item'}
      </p>

      {/* Item Selector Modal */}
      {selectingSlot !== null && (
        <ItemSelectorModal
          items={allItems}
          assignedItemIds={quickSlots.filter(s => s.item_id).map(s => s.item_id!)}
          currentItemId={
            quickSlots.find(s => s.slot_number === selectingSlot)?.item_id ?? null
          }
          onSelect={handleAssignItem}
          onClose={() => setSelectingSlot(null)}
        />
      )}
    </div>
  )
}

// ============ Sub-components ============

interface QuickSlotButtonProps {
  slot: CharacterQuickSlot | undefined
  slotNumber: QuickSlotNumber
  locked: boolean
  onClick: () => void
}

function QuickSlotButton({ slot, slotNumber, locked, onClick }: QuickSlotButtonProps) {
  const item = slot?.item
  const isEmpty = !item

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={locked}
      className={`
        aspect-square rounded-lg border-2 flex flex-col items-center justify-center
        transition-all p-1
        ${isEmpty 
          ? 'border-zinc-700 border-dashed bg-zinc-900' 
          : 'border-zinc-600 bg-zinc-900'
        }
        ${!locked ? 'hover:border-amber-400 hover:bg-zinc-800 cursor-pointer' : 'cursor-default'}
      `}
    >
      {item ? (
        <>
          <span className="text-lg">{getCategoryIcon(item.category)}</span>
          <span className="text-[10px] text-zinc-300 truncate w-full text-center mt-0.5">
            {item.name.length > 8 ? item.name.slice(0, 7) + '…' : item.name}
          </span>
          {item.quantity > 1 && (
            <span className="text-[9px] text-zinc-500">×{item.quantity}</span>
          )}
        </>
      ) : (
        <span className="text-xs text-zinc-600">{slotNumber}</span>
      )}
    </button>
  )
}

// ============ Item Selector Modal ============

interface ItemSelectorModalProps {
  items: CharacterItem[]
  assignedItemIds: string[]
  currentItemId: string | null
  onSelect: (itemId: string | null) => void
  onClose: () => void
}

function ItemSelectorModal({
  items,
  assignedItemIds,
  currentItemId,
  onSelect,
  onClose,
}: ItemSelectorModalProps) {
  // Filter out items already in other slots (but allow current selection)
  const availableItems = items.filter(
    item => item.id === currentItemId || !assignedItemIds.includes(item.id)
  )

  // Group by category
  const grouped = availableItems.reduce((acc, item) => {
    const cat = item.category || 'Other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {} as Record<string, CharacterItem[]>)

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-800 rounded-lg border border-zinc-700 max-w-md w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-700">
          <h3 className="font-medium">Select Item</h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200"
          >
            ✕
          </button>
        </div>

        {/* Item List */}
        <div className="flex-1 overflow-y-auto p-2">
          {/* Empty option */}
          <button
            onClick={() => onSelect(null)}
            className={`
              w-full p-3 rounded-lg text-left mb-2 transition-colors
              ${currentItemId === null 
                ? 'bg-zinc-700 border border-zinc-600' 
                : 'bg-zinc-900 hover:bg-zinc-700 border border-transparent'
              }
            `}
          >
            <div className="text-sm text-zinc-400 italic">None (empty slot)</div>
          </button>

          {Object.keys(grouped).length === 0 ? (
            <div className="text-center text-zinc-500 py-8">
              No items available
            </div>
          ) : (
            Object.entries(grouped).map(([category, categoryItems]) => (
              <div key={category} className="mb-4">
                <div className="text-xs text-zinc-500 uppercase tracking-wide mb-2 px-2">
                  {getCategoryIcon(category)} {category}
                </div>
                {categoryItems.map(item => {
                  const isBrewed = item.id.startsWith('brewed:')
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelect(item.id)}
                      className={`
                        w-full p-3 rounded-lg text-left mb-1 transition-colors
                        ${currentItemId === item.id 
                          ? 'bg-amber-900/30 border border-amber-600' 
                          : 'bg-zinc-900 hover:bg-zinc-700 border border-transparent'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <span>{getCategoryIcon(item.category)}</span>
                        <div className="flex-1">
                          <div className="text-sm font-medium">
                            {item.name}
                            {isBrewed && <span className="text-xs text-green-400 ml-2">(brewed)</span>}
                          </div>
                          {item.notes && (
                            <div className="text-xs text-zinc-500 truncate">{item.notes}</div>
                          )}
                        </div>
                        {item.quantity > 1 && (
                          <span className="text-xs text-zinc-400">×{item.quantity}</span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-700">
          <button
            onClick={onClose}
            className="w-full py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ============ Exports ============

export type { QuickSlotsProps }


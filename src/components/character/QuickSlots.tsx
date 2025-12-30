/**
 * QuickSlots Component
 *
 * Combat inventory with 6 slots for quick-access items.
 * Used for potions, bombs, scrolls, and other frequently used items.
 *
 * Features:
 * - 6 slots in a 2x3 grid layout
 * - Shows item name, quantity, and category icon
 * - Lock toggle for editing
 * - Click slot to assign/change item
 * - Grimoire/sepia/bronze palette
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
import type { CharacterQuickSlot, CharacterItem, CharacterBrewedItem, QuickSlotNumber } from '@/lib/types'
import { setQuickSlotItem, setQuickSlotBrewedItem } from '@/lib/db/characters'
import { formatBrewedEffects } from '@/components/inventory'
import { QuickSlotCell, getCategoryIcon } from './QuickSlotCell'

// ============ Types ============

interface QuickSlotsProps {
  characterId: string
  quickSlots: CharacterQuickSlot[]
  items: CharacterItem[]
  brewedItems?: CharacterBrewedItem[]
  onUpdate?: () => void
  /** Compact mode for embedded usage */
  compact?: boolean
}

// ============ Component ============

export function QuickSlots({
  characterId,
  quickSlots,
  items,
  brewedItems = [],
  onUpdate,
  compact = false,
}: QuickSlotsProps) {
  const [locked, setLocked] = useState(true)
  const [selectingSlot, setSelectingSlot] = useState<QuickSlotNumber | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Sort slots by number
  const sortedSlots = [...quickSlots].sort((a, b) => a.slot_number - b.slot_number)

  // Convert brewed items to unified format for the selector
  // We prefix IDs with 'brewed:' to distinguish them from regular items
  const brewedAsItems: CharacterItem[] = brewedItems.map(b => ({
    id: `brewed:${b.id}`,
    character_id: characterId,
    name: formatBrewedEffects(b.effects),
    category: b.type,
    quantity: b.quantity,
    properties: null,
    is_quick_access: false,
    ammo_type: null,
    notes: b.computed_description || null,
    template_id: null,
  }))

  // Combine regular items with brewed items for unified selection
  const allItems = [...items, ...brewedAsItems]

  // Track which items are already assigned (both regular and brewed)
  const assignedItemIds = quickSlots
    .filter(s => s.item_id)
    .map(s => s.item_id!)
  const assignedBrewedIds = quickSlots
    .filter(s => s.brewed_item_id)
    .map(s => `brewed:${s.brewed_item_id}`)
  const allAssignedIds = [...assignedItemIds, ...assignedBrewedIds]

  async function handleSlotClick(slotNumber: QuickSlotNumber) {
    if (locked) return
    setSelectingSlot(slotNumber)
  }

  async function handleAssignItem(itemId: string | null) {
    if (selectingSlot === null) return

    let err: string | null = null

    if (itemId === null) {
      // Clear the slot
      const result = await setQuickSlotItem(characterId, selectingSlot, null)
      err = result.error
    } else if (itemId.startsWith('brewed:')) {
      // Assign a brewed item
      const brewedId = parseInt(itemId.replace('brewed:', ''), 10)
      const result = await setQuickSlotBrewedItem(characterId, selectingSlot, brewedId)
      err = result.error
    } else {
      // Assign a regular item
      const result = await setQuickSlotItem(characterId, selectingSlot, itemId)
      err = result.error
    }

    if (err) {
      setError(err)
    } else {
      setError(null)
      onUpdate?.()
    }
    setSelectingSlot(null)
  }

  // Get current selection for the slot being edited
  function getCurrentSelection(slotNumber: QuickSlotNumber): string | null {
    const slot = quickSlots.find(s => s.slot_number === slotNumber)
    if (!slot) return null
    if (slot.brewed_item_id) return `brewed:${slot.brewed_item_id}`
    return slot.item_id
  }

  return (
    <div className={`bg-grimoire-850 rounded-lg border border-sepia-700 ${compact ? 'p-3' : 'p-5'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-vellum-300 uppercase tracking-wide">Quick Slots</h2>
        <button
          onClick={() => setLocked(!locked)}
          aria-label={locked ? 'Unlock quick slot editing' : 'Lock quick slot editing'}
          className={`text-xs px-2 py-0.5 rounded transition-colors ${
            locked
              ? 'bg-grimoire-800 text-vellum-400 hover:bg-grimoire-700 border border-sepia-700'
              : 'bg-bronze-muted text-grimoire-950 hover:bg-bronze-bright'
          }`}
        >
          {locked ? '🔒' : '🔓'}
        </button>
      </div>

      {error && (
        <div className="text-red-400 text-xs bg-red-900/20 border border-red-800/50 rounded px-2 py-1 mb-4">
          {error}
        </div>
      )}

      {/* 2x3 Slots Grid */}
      <div className="grid grid-cols-3 gap-2">
        {([1, 2, 3, 4, 5, 6] as const).map(slotNum => {
          const slot = sortedSlots.find(s => s.slot_number === slotNum)
          return (
            <QuickSlotCell
              key={slotNum}
              item={slot?.item ?? null}
              brewedItem={slot?.brewed_item ?? null}
              slotNumber={slotNum}
              locked={locked}
              onClick={() => handleSlotClick(slotNum)}
            />
          )
        })}
      </div>

      {/* Hint */}
      {!compact && (
        <p className="text-xs text-vellum-400 mt-3 text-center">
          {locked ? 'Unlock to assign items to slots' : 'Click a slot to assign an item'}
        </p>
      )}

      {/* Item Selector Modal */}
      {selectingSlot !== null && (
        <ItemSelectorModal
          items={allItems}
          assignedItemIds={allAssignedIds}
          currentItemId={getCurrentSelection(selectingSlot)}
          onSelect={handleAssignItem}
          onClose={() => setSelectingSlot(null)}
        />
      )}
    </div>
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
      <div className="bg-grimoire-850 rounded-lg border border-sepia-700 max-w-md w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-sepia-700">
          <h3 className="font-medium text-vellum-100">Select Item</h3>
          <button
            onClick={onClose}
            className="text-vellum-400 hover:text-vellum-100"
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
                ? 'bg-bronze-muted/20 border border-bronze-bright'
                : 'bg-grimoire-900 hover:bg-grimoire-800 border border-transparent hover:border-sepia-700'
              }
            `}
          >
            <div className="text-sm text-vellum-400 italic">None (empty slot)</div>
          </button>

          {Object.keys(grouped).length === 0 ? (
            <div className="text-center text-vellum-400 py-8">
              No items available
            </div>
          ) : (
            Object.entries(grouped).map(([category, categoryItems]) => (
              <div key={category} className="mb-4">
                <div className="text-xs text-vellum-400 uppercase tracking-wide mb-2 px-2">
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
                          ? 'bg-bronze-muted/20 border border-bronze-bright'
                          : 'bg-grimoire-900 hover:bg-grimoire-800 border border-transparent hover:border-sepia-700'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <span>{getCategoryIcon(item.category)}</span>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-vellum-100">
                            {item.name}
                            {isBrewed && <span className="text-xs text-emerald-400 ml-2">(brewed)</span>}
                          </div>
                          {item.notes && (
                            <div className="text-xs text-vellum-400 truncate">{item.notes}</div>
                          )}
                        </div>
                        {item.quantity > 1 && (
                          <span className="text-xs text-vellum-300">×{item.quantity}</span>
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
        <div className="p-4 border-t border-sepia-700">
          <button
            onClick={onClose}
            className="w-full py-2 bg-sepia-700 hover:bg-sepia-600 text-vellum-100 rounded-lg text-sm font-medium transition-colors"
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

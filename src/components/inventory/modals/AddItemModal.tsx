'use client'

import { useState, useMemo } from 'react'
import type { ItemTemplate } from '@/lib/types'
import { addItemFromTemplate, addCustomItem } from '@/lib/db/characters'
import { ItemModalMode, getCategoryIcon, formatCategory } from '../types'

export interface AddItemModalProps {
  characterId: string
  templates: ItemTemplate[]
  onClose: () => void
  onSuccess: () => void
  setError: (e: string | null) => void
}

export function AddItemModal({ characterId, templates, onClose, onSuccess, setError }: AddItemModalProps) {
  const [mode, setMode] = useState<ItemModalMode>('template')
  const [saving, setSaving] = useState(false)

  // Template mode state
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null)
  const [templateQuantity, setTemplateQuantity] = useState(1)
  const [templateCustomName, setTemplateCustomName] = useState('')
  const [templateNotes, setTemplateNotes] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Custom mode state
  const [customName, setCustomName] = useState('')
  const [customCategory, setCustomCategory] = useState('gear')
  const [customQuantity, setCustomQuantity] = useState(1)
  const [customDescription, setCustomDescription] = useState('')
  const [customAmmoType, setCustomAmmoType] = useState('')

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId)

  const categories = useMemo(() => {
    const cats = new Set(templates.map(t => t.category))
    return Array.from(cats).sort()
  }, [templates])

  const filteredTemplates = useMemo(() => {
    let result = templates

    if (categoryFilter !== 'all') {
      result = result.filter(t => t.category === categoryFilter)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(t => t.name.toLowerCase().includes(q))
    }

    return result
  }, [templates, categoryFilter, searchQuery])

  const groupedTemplates = useMemo(() => {
    const groups: Record<string, ItemTemplate[]> = {}
    for (const t of filteredTemplates) {
      if (!groups[t.category]) groups[t.category] = []
      groups[t.category].push(t)
    }
    return groups
  }, [filteredTemplates])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    if (mode === 'template') {
      if (!selectedTemplateId) {
        setError('Please select an item')
        setSaving(false)
        return
      }

      const { error } = await addItemFromTemplate(
        characterId,
        selectedTemplateId,
        templateQuantity,
        {
          customName: templateCustomName.trim() || undefined,
          notes: templateNotes.trim() || undefined,
        }
      )

      if (error) {
        setError(error)
        setSaving(false)
        return
      }
    } else {
      // Custom mode
      if (!customName.trim()) {
        setError('Please enter an item name')
        setSaving(false)
        return
      }

      const { error } = await addCustomItem(characterId, {
        name: customName.trim(),
        category: customCategory,
        quantity: customQuantity,
        description: customDescription.trim() || undefined,
        ammo_type: customAmmoType.trim() || undefined,
      })

      if (error) {
        setError(error)
        setSaving(false)
        return
      }
    }

    setSaving(false)
    setError(null)
    onSuccess()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-800 rounded-lg border border-zinc-700 max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-zinc-700">
          <h3 className="font-medium text-lg">Add Item</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-200">✕</button>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-zinc-700">
          <button
            type="button"
            onClick={() => setMode('template')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              mode === 'template'
                ? 'bg-zinc-700 text-white border-b-2 border-emerald-500'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            📋 From Template
          </button>
          <button
            type="button"
            onClick={() => setMode('custom')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              mode === 'custom'
                ? 'bg-zinc-700 text-white border-b-2 border-purple-500'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            ✨ Custom Item
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {mode === 'template' ? (
              <>
                {/* Search and Filter */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search items..."
                    className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500"
                  />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{formatCategory(cat)}</option>
                    ))}
                  </select>
                </div>

                {/* Item Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">Select Item *</label>
                  <div className="max-h-48 overflow-y-auto bg-zinc-900 rounded-lg border border-zinc-700 p-2 space-y-3">
                    {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
                      <div key={category}>
                        <div className="text-xs text-zinc-500 uppercase tracking-wide mb-1 px-2">
                          {getCategoryIcon(category)} {formatCategory(category)}
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          {categoryTemplates.map(template => (
                            <button
                              key={template.id}
                              type="button"
                              onClick={() => setSelectedTemplateId(template.id)}
                              className={`text-left p-2 rounded transition-colors ${
                                selectedTemplateId === template.id
                                  ? 'bg-emerald-700 text-white'
                                  : 'hover:bg-zinc-800'
                              }`}
                            >
                              <div className="text-sm font-medium">{template.name}</div>
                              {template.description && (
                                <div className="text-xs text-zinc-400 truncate">{template.description}</div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    {Object.keys(groupedTemplates).length === 0 && (
                      <p className="text-center text-zinc-500 py-4">No items match your search</p>
                    )}
                  </div>
                </div>

                {/* Selected Item Preview */}
                {selectedTemplate && (
                  <div className="bg-zinc-900 rounded-lg p-3 border border-emerald-700/50">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{getCategoryIcon(selectedTemplate.category)}</span>
                      <span className="font-medium">{selectedTemplate.name}</span>
                    </div>
                    {selectedTemplate.description && (
                      <p className="text-sm text-zinc-400">{selectedTemplate.description}</p>
                    )}
                    {selectedTemplate.effects && Object.keys(selectedTemplate.effects).length > 0 && (
                      <div className="text-sm text-emerald-400 mt-2">
                        {Object.entries(selectedTemplate.effects).map(([k, v]) => (
                          <span key={k} className="mr-3">{k}: {String(v)}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Quantity */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={templateQuantity}
                      onChange={(e) => setTemplateQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Custom Name</label>
                    <input
                      type="text"
                      value={templateCustomName}
                      onChange={(e) => setTemplateCustomName(e.target.value)}
                      placeholder={selectedTemplate?.name || ''}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    value={templateNotes}
                    onChange={(e) => setTemplateNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500 resize-none"
                    placeholder="Additional notes..."
                  />
                </div>
              </>
            ) : (
              /* Custom Mode */
              <>
                <p className="text-sm text-zinc-400 mb-2">
                  Create a fully custom item for homebrew, magical items, or unique gear.
                </p>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium mb-1">Item Name *</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g., Ring of Fire Resistance"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500"
                  />
                </div>

                {/* Category and Quantity */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <select
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500"
                    >
                      <option value="gear">Gear</option>
                      <option value="potion">Potion</option>
                      <option value="scroll">Scroll</option>
                      <option value="ammo">Ammunition</option>
                      <option value="tool">Tool</option>
                      <option value="food">Food</option>
                      <option value="container">Container</option>
                      <option value="magic_item">Magic Item</option>
                      <option value="misc">Miscellaneous</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={customQuantity}
                      onChange={(e) => setCustomQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                </div>

                {/* Ammo Type (for ammo category) */}
                {customCategory === 'ammo' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Ammo Type</label>
                    <select
                      value={customAmmoType}
                      onChange={(e) => setCustomAmmoType(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500"
                    >
                      <option value="">Select type...</option>
                      <option value="arrow">Arrows</option>
                      <option value="bolt">Bolts</option>
                      <option value="bullet">Bullets</option>
                      <option value="dart">Darts</option>
                      <option value="stone">Stones</option>
                    </select>
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500 resize-none"
                    placeholder="Describe the item, its properties, effects, lore..."
                  />
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-4 border-t border-zinc-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || (mode === 'template' && !selectedTemplateId) || (mode === 'custom' && !customName.trim())}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                mode === 'template'
                  ? 'bg-emerald-700 hover:bg-emerald-600'
                  : 'bg-purple-700 hover:bg-purple-600'
              }`}
            >
              {saving ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

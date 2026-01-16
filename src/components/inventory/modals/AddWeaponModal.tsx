'use client'

import { useState, useMemo } from 'react'
import type { WeaponTemplate, Material } from '@/lib/types'
import { addWeaponFromTemplate, addCustomWeapon } from '@/lib/db/characters'
import { WeaponModalMode, getCategoryIcon, formatCategory } from '../types'

export interface AddWeaponModalProps {
  characterId: string
  templates: WeaponTemplate[]
  materials: Material[]
  onClose: () => void
  onSuccess: () => void
  setError: (e: string | null) => void
}

export function AddWeaponModal({ characterId, templates, materials, onClose, onSuccess, setError }: AddWeaponModalProps) {
  const [mode, setMode] = useState<WeaponModalMode>('template')
  const [saving, setSaving] = useState(false)

  // Template mode state
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null)
  const [selectedMaterialId, setSelectedMaterialId] = useState<number>(
    materials.find(m => m.name === 'Steel')?.id || materials[0]?.id || 0
  )
  const [templateCustomName, setTemplateCustomName] = useState('')
  const [templateIsMagical, setTemplateIsMagical] = useState(false)
  const [templateNotes, setTemplateNotes] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Custom mode state
  const [customName, setCustomName] = useState('')
  const [customDamageDice, setCustomDamageDice] = useState('1d6')
  const [customDamageType, setCustomDamageType] = useState('slashing')
  const [customWeaponType, setCustomWeaponType] = useState('simple_melee')
  const [customProperties, setCustomProperties] = useState('')
  const [customRangeNormal, setCustomRangeNormal] = useState('')
  const [customRangeLong, setCustomRangeLong] = useState('')
  const [customIsTwoHanded, setCustomIsTwoHanded] = useState(false)
  const [customIsMagical, setCustomIsMagical] = useState(false)
  const [customNotes, setCustomNotes] = useState('')

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId)
  const selectedMaterial = materials.find(m => m.id === selectedMaterialId)

  const groupedTemplates = useMemo(() => {
    let filtered = templates

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(t => t.category === categoryFilter)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(t => t.name.toLowerCase().includes(q))
    }

    const groups: Record<string, WeaponTemplate[]> = {}
    for (const t of filtered) {
      if (!groups[t.category]) groups[t.category] = []
      groups[t.category].push(t)
    }
    return groups
  }, [templates, categoryFilter, searchQuery])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    if (mode === 'template') {
      if (!selectedTemplateId) {
        setError('Please select a weapon type')
        setSaving(false)
        return
      }

      const { error } = await addWeaponFromTemplate(
        characterId,
        selectedTemplateId,
        selectedMaterialId,
        {
          customName: templateCustomName.trim() || undefined,
          isMagical: templateIsMagical,
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
        setError('Please enter a weapon name')
        setSaving(false)
        return
      }
      if (!customDamageDice.trim()) {
        setError('Please enter damage dice')
        setSaving(false)
        return
      }

      const properties = customProperties.trim()
        ? customProperties.split(',').map(p => p.trim().toLowerCase())
        : []

      const { error } = await addCustomWeapon(characterId, {
        name: customName.trim(),
        damage_dice: customDamageDice.trim(),
        damage_type: customDamageType,
        weapon_type: customWeaponType,
        properties,
        range_normal: customRangeNormal ? parseInt(customRangeNormal, 10) : undefined,
        range_long: customRangeLong ? parseInt(customRangeLong, 10) : undefined,
        is_two_handed: customIsTwoHanded,
        is_magical: customIsMagical,
        notes: customNotes.trim() || undefined,
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
          <h3 className="font-medium text-lg">Add Weapon</h3>
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
            ✨ Custom Weapon
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
                    placeholder="Search weapons..."
                    className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500"
                  />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500"
                  >
                    <option value="all">All Types</option>
                    <option value="simple_melee">Simple Melee</option>
                    <option value="simple_ranged">Simple Ranged</option>
                    <option value="martial_melee">Martial Melee</option>
                    <option value="martial_ranged">Martial Ranged</option>
                  </select>
                </div>

                {/* Weapon Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">Select Weapon Type *</label>
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
                              <div className="text-xs text-zinc-400">
                                {template.damage_dice} {template.damage_type}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    {Object.keys(groupedTemplates).length === 0 && (
                      <p className="text-center text-zinc-500 py-4">No weapons match your search</p>
                    )}
                  </div>
                </div>

                {/* Selected Weapon Preview */}
                {selectedTemplate && (
                  <div className="bg-zinc-900 rounded-lg p-3 border border-emerald-700/50">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{getCategoryIcon(selectedTemplate.category)}</span>
                      <span className="font-medium">{selectedTemplate.name}</span>
                    </div>
                    <div className="text-sm text-zinc-400 grid grid-cols-2 gap-2">
                      <div>Damage: <span className="text-red-400">{selectedTemplate.damage_dice} {selectedTemplate.damage_type}</span></div>
                      {selectedTemplate.versatile_dice && (
                        <div>Versatile: <span className="text-amber-400">{selectedTemplate.versatile_dice}</span></div>
                      )}
                      {selectedTemplate.range_normal && (
                        <div>Range: {selectedTemplate.range_normal}/{selectedTemplate.range_long} ft</div>
                      )}
                      {selectedTemplate.properties.length > 0 && (
                        <div className="col-span-2">Properties: {selectedTemplate.properties.join(', ')}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Material Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">Material</label>
                  <select
                    value={selectedMaterialId}
                    onChange={(e) => setSelectedMaterialId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500"
                  >
                    {materials.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} {m.tier > 1 ? `(Tier ${m.tier})` : ''}
                        {m.damage_bonus > 0 ? ` +${m.damage_bonus} dmg` : ''}
                        {m.attack_bonus > 0 ? ` +${m.attack_bonus} atk` : ''}
                      </option>
                    ))}
                  </select>
                  {selectedMaterial?.description && (
                    <p className="text-xs text-zinc-500 mt-1">{selectedMaterial.description}</p>
                  )}
                </div>

                {/* Optional Fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Custom Name</label>
                    <input
                      type="text"
                      value={templateCustomName}
                      onChange={(e) => setTemplateCustomName(e.target.value)}
                      placeholder={selectedTemplate?.name || 'e.g., Oathkeeper'}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={templateIsMagical}
                        onChange={(e) => setTemplateIsMagical(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">✨ Magical</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    value={templateNotes}
                    onChange={(e) => setTemplateNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500 resize-none"
                    placeholder="Special properties, enchantments..."
                  />
                </div>
              </>
            ) : (
              /* Custom Mode */
              <>
                <p className="text-sm text-zinc-400 mb-2">
                  Create a fully custom weapon for homebrew, magical items, or unique gear.
                </p>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium mb-1">Weapon Name *</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g., Flame Tongue, Vorpal Blade"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500"
                  />
                </div>

                {/* Damage */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Damage Dice *</label>
                    <input
                      type="text"
                      value={customDamageDice}
                      onChange={(e) => setCustomDamageDice(e.target.value)}
                      placeholder="e.g., 1d8, 2d6"
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Damage Type</label>
                    <select
                      value={customDamageType}
                      onChange={(e) => setCustomDamageType(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500"
                    >
                      <option value="slashing">Slashing</option>
                      <option value="piercing">Piercing</option>
                      <option value="bludgeoning">Bludgeoning</option>
                      <option value="fire">Fire</option>
                      <option value="cold">Cold</option>
                      <option value="lightning">Lightning</option>
                      <option value="thunder">Thunder</option>
                      <option value="acid">Acid</option>
                      <option value="poison">Poison</option>
                      <option value="necrotic">Necrotic</option>
                      <option value="radiant">Radiant</option>
                      <option value="psychic">Psychic</option>
                      <option value="force">Force</option>
                    </select>
                  </div>
                </div>

                {/* Weapon Type */}
                <div>
                  <label className="block text-sm font-medium mb-1">Weapon Category</label>
                  <select
                    value={customWeaponType}
                    onChange={(e) => setCustomWeaponType(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500"
                  >
                    <option value="simple_melee">Simple Melee</option>
                    <option value="simple_ranged">Simple Ranged</option>
                    <option value="martial_melee">Martial Melee</option>
                    <option value="martial_ranged">Martial Ranged</option>
                    <option value="exotic">Exotic</option>
                    <option value="improvised">Improvised</option>
                  </select>
                </div>

                {/* Properties */}
                <div>
                  <label className="block text-sm font-medium mb-1">Properties</label>
                  <input
                    type="text"
                    value={customProperties}
                    onChange={(e) => setCustomProperties(e.target.value)}
                    placeholder="e.g., finesse, versatile, light (comma-separated)"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500"
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    Common: finesse, versatile, light, heavy, two-handed, thrown, reach, loading
                  </p>
                </div>

                {/* Range (for ranged weapons) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Range (Normal)</label>
                    <input
                      type="number"
                      value={customRangeNormal}
                      onChange={(e) => setCustomRangeNormal(e.target.value)}
                      placeholder="e.g., 80"
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Range (Long)</label>
                    <input
                      type="number"
                      value={customRangeLong}
                      onChange={(e) => setCustomRangeLong(e.target.value)}
                      placeholder="e.g., 320"
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                </div>

                {/* Flags */}
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customIsTwoHanded}
                      onChange={(e) => setCustomIsTwoHanded(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">🗡️ Two-Handed</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customIsMagical}
                      onChange={(e) => setCustomIsMagical(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">✨ Magical</span>
                  </label>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium mb-1">Description / Notes</label>
                  <textarea
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500 resize-none"
                    placeholder="Describe special properties, enchantments, lore..."
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
              {saving ? 'Adding...' : 'Add Weapon'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

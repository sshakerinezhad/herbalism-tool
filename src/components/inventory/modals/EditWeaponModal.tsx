'use client'

import { useState } from 'react'
import { updateCharacterWeapon } from '@/lib/db/characters'
import type { CharacterWeapon } from '@/lib/types'

export interface EditWeaponModalProps {
  weapon: CharacterWeapon
  onClose: () => void
  onSuccess: () => void
  setError: (e: string | null) => void
}

export function EditWeaponModal({ weapon, onClose, onSuccess, setError }: EditWeaponModalProps) {
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState(weapon.name)
  const [damageDice, setDamageDice] = useState(weapon.damage_dice || '')
  const [damageType, setDamageType] = useState(weapon.damage_type || 'slashing')
  const [weaponType, setWeaponType] = useState(weapon.weapon_type || 'simple_melee')
  const [properties, setProperties] = useState(weapon.properties?.join(', ') || '')
  const [rangeNormal, setRangeNormal] = useState(weapon.range_normal?.toString() || '')
  const [rangeLong, setRangeLong] = useState(weapon.range_long?.toString() || '')
  const [isTwoHanded, setIsTwoHanded] = useState(weapon.is_two_handed)
  const [isMagical, setIsMagical] = useState(weapon.is_magical)
  const [notes, setNotes] = useState(weapon.notes || '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setSaving(true)
    setError(null)

    const parsedProperties = properties
      .split(',')
      .map(p => p.trim().toLowerCase())
      .filter(Boolean)

    const { error } = await updateCharacterWeapon(weapon.id, {
      name: name.trim(),
      damage_dice: damageDice.trim() || null,
      damage_type: damageType,
      weapon_type: weaponType,
      properties: parsedProperties,
      range_normal: rangeNormal ? parseInt(rangeNormal) : null,
      range_long: rangeLong ? parseInt(rangeLong) : null,
      is_two_handed: isTwoHanded,
      is_magical: isMagical,
      notes: notes.trim() || null,
    })

    setSaving(false)

    if (error) {
      setError(error)
      return
    }

    onSuccess()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-zinc-900 rounded-xl border border-zinc-700 max-w-lg w-full max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-700">
          <h2 className="text-lg font-semibold">Edit Weapon</h2>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-200">✕</button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Weapon Name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500" />
          </div>

          {/* Damage */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Damage Dice</label>
              <input type="text" value={damageDice} onChange={e => setDamageDice(e.target.value)}
                placeholder="e.g., 1d8" className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Damage Type</label>
              <select value={damageType} onChange={e => setDamageType(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500">
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

          {/* Weapon Category */}
          <div>
            <label className="block text-sm font-medium mb-1">Weapon Category</label>
            <select value={weaponType} onChange={e => setWeaponType(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500">
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
            <input type="text" value={properties} onChange={e => setProperties(e.target.value)}
              placeholder="e.g., finesse, versatile, light (comma-separated)"
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500" />
            <p className="text-xs text-zinc-500 mt-1">
              Common: finesse, versatile, light, heavy, two-handed, thrown, reach, loading
            </p>
          </div>

          {/* Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Range (Normal)</label>
              <input type="number" value={rangeNormal} onChange={e => setRangeNormal(e.target.value)}
                placeholder="e.g., 80" className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Range (Long)</label>
              <input type="number" value={rangeLong} onChange={e => setRangeLong(e.target.value)}
                placeholder="e.g., 320" className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500" />
            </div>
          </div>
          <p className="text-xs text-zinc-500 -mt-2">
            For ranged or thrown weapons. Leave blank for melee-only.
          </p>

          {/* Flags */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isTwoHanded} onChange={e => setIsTwoHanded(e.target.checked)} className="rounded" />
              <span className="text-sm">Two-Handed</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isMagical} onChange={e => setIsMagical(e.target.checked)} className="rounded" />
              <span className="text-sm">Magical</span>
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1">Description / Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500 resize-none"
              placeholder="Special properties, enchantments, lore..." />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-zinc-700">
          <button type="button" onClick={onClose}
            className="flex-1 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg font-medium transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving || !name.trim()}
            className="flex-1 py-2 bg-blue-700 hover:bg-blue-600 rounded-lg font-medium transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}

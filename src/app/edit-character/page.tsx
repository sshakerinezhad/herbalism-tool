'use client'

/**
 * Edit Character Page
 * 
 * Allows editing of character details:
 * - Name & Appearance
 * - Level
 * - Stats (all 7)
 * - Current HP
 * - Money
 * 
 * Core identity (race, class, background, order, vocation) is fixed.
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { LoadingState, ErrorDisplay } from '@/components/ui'
import { 
  fetchCharacter,
  fetchCharacterArmor,
  fetchArmorSlots,
  setCharacterArmor,
  removeCharacterArmor,
} from '@/lib/db/characters'
import { supabase } from '@/lib/supabase'
import {
  ABILITY_NAMES,
  getAbilityModifier,
  calculateMaxHP,
} from '@/lib/constants'
import type { Character, CharacterStats, ArmorSlot, ArmorType } from '@/lib/types'

// Type for character armor data
type CharacterArmorData = {
  id: string
  slot_id: number
  armor_type: ArmorType
  custom_name: string | null
  material: string | null
  is_magical: boolean
  properties: Record<string, unknown> | null
  notes: string | null
  slot: ArmorSlot
}

type EditableFields = {
  name: string
  appearance: string
  level: number
  stats: CharacterStats
  hp_current: number
  hp_custom_modifier: number
  platinum: number
  gold: number
  silver: number
  copper: number
}

export default function EditCharacterPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()

  const [character, setCharacter] = useState<Character | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Editable form state
  const [form, setForm] = useState<EditableFields | null>(null)

  // Armor state
  const [characterArmor, setCharacterArmor] = useState<CharacterArmorData[]>([])
  const [allArmorSlots, setAllArmorSlots] = useState<ArmorSlot[]>([])
  const [armorSaving, setArmorSaving] = useState<number | null>(null) // slot_id being saved

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [authLoading, user, router])

  // Load character data
  useEffect(() => {
    async function loadCharacter() {
      if (!user) return

      setLoading(true)
      setLoadError(null)

      const { data, error } = await fetchCharacter(user.id)

      if (error) {
        setLoadError(error)
        setLoading(false)
        return
      }

      if (!data) {
        // No character - redirect to create
        router.push('/create-character')
        return
      }

      setCharacter(data)
      setForm({
        name: data.name,
        appearance: data.appearance || '',
        level: data.level,
        stats: {
          str: data.str,
          dex: data.dex,
          con: data.con,
          int: data.int,
          wis: data.wis,
          cha: data.cha,
          hon: data.hon,
        },
        hp_current: data.hp_current,
        hp_custom_modifier: data.hp_custom_modifier,
        platinum: data.platinum,
        gold: data.gold,
        silver: data.silver,
        copper: data.copper,
      })

      // Fetch armor data
      const [armorResult, slotsResult] = await Promise.all([
        fetchCharacterArmor(data.id),
        fetchArmorSlots(),
      ])
      
      if (armorResult.data) {
        setCharacterArmor(armorResult.data)
      }
      if (slotsResult.data) {
        setAllArmorSlots(slotsResult.data)
      }

      setLoading(false)
    }

    if (!authLoading && user) {
      loadCharacter()
    }
  }, [authLoading, user, router])

  // Update form field
  function updateField<K extends keyof EditableFields>(
    field: K,
    value: EditableFields[K]
  ) {
    if (!form) return
    setForm({ ...form, [field]: value })
    setSaveSuccess(false)
  }

  // Update stat
  function updateStat(stat: keyof CharacterStats, value: number) {
    if (!form) return
    setForm({
      ...form,
      stats: {
        ...form.stats,
        [stat]: Math.max(1, Math.min(30, value)),
      },
    })
    setSaveSuccess(false)
  }

  // Set armor for a slot
  async function handleSetArmor(slotId: number, armorType: ArmorType | null) {
    if (!character) return

    setArmorSaving(slotId)

    if (armorType === null) {
      // Remove armor
      const { error } = await removeCharacterArmor(character.id, slotId)
      if (!error) {
        setCharacterArmor(prev => prev.filter(a => a.slot_id !== slotId))
      }
    } else {
      // Set armor
      const { error } = await setCharacterArmor(character.id, slotId, armorType)
      if (!error) {
        // Refetch armor to get updated data with slot info
        const { data } = await fetchCharacterArmor(character.id)
        if (data) {
          setCharacterArmor(data)
        }
      }
    }

    setArmorSaving(null)
  }

  // Check if armor type is available for slot
  function isArmorAvailable(slot: ArmorSlot, type: ArmorType): boolean {
    if (type === 'light') return slot.light_available
    if (type === 'medium') return slot.medium_available
    if (type === 'heavy') return slot.heavy_available
    return false
  }

  // Check strength requirements
  function meetsStrengthRequirement(type: ArmorType): boolean {
    if (!form) return false
    if (type === 'light') return true
    if (type === 'medium') return form.stats.str >= 13
    if (type === 'heavy') return form.stats.str >= 15
    return true
  }

  // Save changes
  async function handleSave() {
    if (!character || !form) return

    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    // Build update object for the character table
    const updates = {
      name: form.name,
      appearance: form.appearance || null,
      level: form.level,
      str: form.stats.str,
      dex: form.stats.dex,
      con: form.stats.con,
      int: form.stats.int,
      wis: form.stats.wis,
      cha: form.stats.cha,
      hon: form.stats.hon,
      hp_current: form.hp_current,
      hp_custom_modifier: form.hp_custom_modifier,
      platinum: form.platinum,
      gold: form.gold,
      silver: form.silver,
      copper: form.copper,
    }

    const { error } = await supabase
      .from('characters')
      .update(updates)
      .eq('id', character.id)

    if (error) {
      setSaveError(error.message)
      setSaving(false)
      return
    }

    // Update local state
    setCharacter({ ...character, ...updates })
    setSaveSuccess(true)
    setSaving(false)
  }

  // Loading states
  if (authLoading || !user) {
    return <LoadingState message="Loading..." />
  }

  if (loading) {
    return <LoadingState message="Loading character..." />
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-zinc-900 text-zinc-100 p-8">
        <div className="max-w-2xl mx-auto">
          <ErrorDisplay message={loadError} />
          <Link href="/profile" className="text-emerald-400 hover:underline mt-4 inline-block">
            ← Back to Profile
          </Link>
        </div>
      </div>
    )
  }

  if (!character || !form) {
    return <LoadingState message="Loading..." />
  }

  const maxHP = calculateMaxHP(form.stats.con, form.hp_custom_modifier)

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100">
      {/* Header */}
      <div className="bg-zinc-800 border-b border-zinc-700 py-4 px-6">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">✏️ Edit Character</h1>
            <p className="text-zinc-400 text-sm mt-1">{character.name}</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/profile"
              className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        {saveError && (
          <div className="mb-6">
            <ErrorDisplay message={saveError} />
          </div>
        )}

        {saveSuccess && (
          <div className="mb-6 p-4 bg-emerald-900/30 border border-emerald-700 rounded-lg">
            <p className="text-emerald-300">✓ Changes saved successfully!</p>
          </div>
        )}

        <div className="space-y-8">
          {/* Basic Info */}
          <section className="bg-zinc-800 rounded-lg p-6 border border-zinc-700">
            <h2 className="text-lg font-semibold mb-4">Basic Info</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Character Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="w-full max-w-md px-4 py-2 bg-zinc-900 border border-zinc-600 rounded-lg text-zinc-100 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Level
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={form.level}
                  onChange={(e) => updateField('level', parseInt(e.target.value) || 1)}
                  className="w-24 px-4 py-2 bg-zinc-900 border border-zinc-600 rounded-lg text-zinc-100 text-center focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Appearance
                </label>
                <textarea
                  value={form.appearance}
                  onChange={(e) => updateField('appearance', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 bg-zinc-900 border border-zinc-600 rounded-lg text-zinc-100 focus:outline-none focus:border-emerald-600 resize-none"
                  placeholder="Physical description, distinctive features..."
                />
              </div>
            </div>
          </section>

          {/* Stats */}
          <section className="bg-zinc-800 rounded-lg p-6 border border-zinc-700">
            <h2 className="text-lg font-semibold mb-4">Statistics</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map(stat => (
                <div key={stat} className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
                  <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase">
                    {ABILITY_NAMES[stat]}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={form.stats[stat]}
                      onChange={(e) => updateStat(stat, parseInt(e.target.value) || 10)}
                      className="w-16 px-2 py-1 bg-zinc-800 border border-zinc-600 rounded text-center text-lg font-bold focus:outline-none focus:border-emerald-600"
                    />
                    <span className={`text-sm font-medium ${
                      getAbilityModifier(form.stats[stat]) >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {getAbilityModifier(form.stats[stat]) >= 0 ? '+' : ''}
                      {getAbilityModifier(form.stats[stat])}
                    </span>
                  </div>
                </div>
              ))}

              {/* Honor (special) */}
              <div className="bg-amber-900/20 rounded-lg p-4 border border-amber-700/50">
                <label className="block text-xs font-medium text-amber-400 mb-2 uppercase">
                  {ABILITY_NAMES.hon}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={form.stats.hon}
                    onChange={(e) => updateStat('hon', parseInt(e.target.value) || 8)}
                    className="w-16 px-2 py-1 bg-zinc-800 border border-amber-600/50 rounded text-center text-lg font-bold focus:outline-none focus:border-amber-500"
                  />
                  <span className={`text-sm font-medium ${
                    getAbilityModifier(form.stats.hon) >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {getAbilityModifier(form.stats.hon) >= 0 ? '+' : ''}
                    {getAbilityModifier(form.stats.hon)}
                  </span>
                </div>
                <p className="text-xs text-amber-400/60 mt-2">DM awards increases</p>
              </div>
            </div>
          </section>

          {/* HP */}
          <section className="bg-zinc-800 rounded-lg p-6 border border-zinc-700">
            <h2 className="text-lg font-semibold mb-4">Hit Points</h2>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Current HP
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.hp_current}
                  onChange={(e) => updateField('hp_current', parseInt(e.target.value) || 0)}
                  className="w-24 px-4 py-2 bg-zinc-900 border border-zinc-600 rounded-lg text-zinc-100 text-center text-lg font-bold focus:outline-none focus:border-emerald-600"
                />
                <p className="text-xs text-zinc-500 mt-1">
                  Max HP: {maxHP}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  HP Custom Modifier
                </label>
                <input
                  type="number"
                  value={form.hp_custom_modifier}
                  onChange={(e) => updateField('hp_custom_modifier', parseInt(e.target.value) || 0)}
                  className="w-24 px-4 py-2 bg-zinc-900 border border-zinc-600 rounded-lg text-zinc-100 text-center focus:outline-none focus:border-emerald-600"
                />
                <p className="text-xs text-zinc-500 mt-1">
                  Extra HP from feats, items, etc.
                </p>
              </div>
            </div>
          </section>

          {/* Money */}
          <section className="bg-zinc-800 rounded-lg p-6 border border-zinc-700">
            <h2 className="text-lg font-semibold mb-4">Coin Purse</h2>
            
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-amber-300 mb-2 uppercase">
                  Platinum
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.platinum}
                  onChange={(e) => updateField('platinum', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-600 rounded-lg text-zinc-100 text-center font-bold focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-yellow-400 mb-2 uppercase">
                  Gold
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.gold}
                  onChange={(e) => updateField('gold', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-600 rounded-lg text-zinc-100 text-center font-bold focus:outline-none focus:border-yellow-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-2 uppercase">
                  Silver
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.silver}
                  onChange={(e) => updateField('silver', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-600 rounded-lg text-zinc-100 text-center font-bold focus:outline-none focus:border-zinc-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-amber-600 mb-2 uppercase">
                  Copper
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.copper}
                  onChange={(e) => updateField('copper', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-600 rounded-lg text-zinc-100 text-center font-bold focus:outline-none focus:border-amber-600"
                />
              </div>
            </div>
          </section>

          {/* Armor */}
          <section className="bg-zinc-800 rounded-lg p-6 border border-zinc-700">
            <h2 className="text-lg font-semibold mb-4">Armor</h2>
            
            {/* Strength requirement warnings */}
            {!meetsStrengthRequirement('medium') && (
              <div className="mb-4 p-3 bg-amber-900/20 border border-amber-700/50 rounded-lg text-sm text-amber-300">
                ⚠️ STR 13 required for medium armor (current: {form.stats.str})
              </div>
            )}
            {!meetsStrengthRequirement('heavy') && meetsStrengthRequirement('medium') && (
              <div className="mb-4 p-3 bg-amber-900/20 border border-amber-700/50 rounded-lg text-sm text-amber-300">
                ⚠️ STR 15 required for heavy armor (current: {form.stats.str})
              </div>
            )}

            {allArmorSlots.length === 0 ? (
              <p className="text-zinc-500 text-sm">Loading armor slots...</p>
            ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {allArmorSlots.map(slot => {
                const currentArmor = (characterArmor || []).find(a => a.slot_id === slot.id)
                const isSaving = armorSaving === slot.id

                return (
                  <div 
                    key={slot.id} 
                    className={`rounded-lg p-3 border ${
                      currentArmor 
                        ? currentArmor.armor_type === 'heavy' 
                          ? 'bg-zinc-700/50 border-zinc-600' 
                          : currentArmor.armor_type === 'medium'
                            ? 'bg-blue-900/20 border-blue-800/50'
                            : 'bg-emerald-900/20 border-emerald-800/50'
                        : 'bg-zinc-900 border-zinc-700'
                    }`}
                  >
                    <div className="text-xs font-medium text-zinc-400 mb-2">{slot.display_name}</div>
                    
                    <select
                      value={currentArmor?.armor_type || ''}
                      onChange={(e) => handleSetArmor(
                        slot.id, 
                        e.target.value ? e.target.value as ArmorType : null
                      )}
                      disabled={isSaving}
                      className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-600 rounded text-sm focus:outline-none focus:border-emerald-600 disabled:opacity-50"
                    >
                      <option value="">None</option>
                      {isArmorAvailable(slot, 'light') && (
                        <option value="light" disabled={!meetsStrengthRequirement('light')}>
                          {slot.light_piece_name || 'Light'} (+{slot.light_bonus})
                        </option>
                      )}
                      {isArmorAvailable(slot, 'medium') && (
                        <option value="medium" disabled={!meetsStrengthRequirement('medium')}>
                          {slot.medium_piece_name || 'Medium'} (+{slot.medium_bonus})
                        </option>
                      )}
                      {isArmorAvailable(slot, 'heavy') && (
                        <option value="heavy" disabled={!meetsStrengthRequirement('heavy')}>
                          {slot.heavy_piece_name || 'Heavy'} (+{slot.heavy_bonus})
                        </option>
                      )}
                    </select>

                    {isSaving && (
                      <div className="text-xs text-zinc-500 mt-1">Saving...</div>
                    )}
                  </div>
                )
              })}
            </div>
            )}

            <p className="text-xs text-zinc-500 mt-4">
              Changes to armor are saved immediately. Light: full DEX bonus, Medium: max +2 DEX, Heavy: no DEX bonus.
            </p>
          </section>

          {/* Fixed Info (read-only) */}
          <section className="bg-zinc-800/50 rounded-lg p-6 border border-zinc-700">
            <h2 className="text-lg font-semibold mb-4 text-zinc-400">Character Identity (Fixed)</h2>
            <p className="text-zinc-500 text-sm mb-4">
              These values define your character&apos;s core identity and cannot be changed.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-zinc-500">Race:</span>{' '}
                <span className="text-zinc-300">{character.race}</span>
              </div>
              <div>
                <span className="text-zinc-500">Class:</span>{' '}
                <span className="text-zinc-300">{character.class}</span>
              </div>
              <div>
                <span className="text-zinc-500">Background:</span>{' '}
                <span className="text-zinc-300">{character.background}</span>
              </div>
              <div>
                <span className="text-zinc-500">Order:</span>{' '}
                <span className="text-zinc-300">{character.knight_order}</span>
              </div>
              <div>
                <span className="text-zinc-500">Vocation:</span>{' '}
                <span className="text-zinc-300">{character.vocation || character.feat}</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}


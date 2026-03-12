'use client'

/**
 * Settings Page
 *
 * Replaces the old edit-character page with reorganized sections:
 * 1. Identity — race, class, background, knight_order, vocation (now editable)
 * 2. Character — name, level, appearance
 * 3. Stats — STR, DEX, CON, INT, WIS, CHA, HON
 * 4. HP & Money — current HP, custom modifier, coins
 * 5. Account — sign out
 *
 * Identity changes show a confirmation modal before saving.
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { useCharacter, useCharacterSkills, useSkills, useInvalidateQueries } from '@/lib/hooks'
import {
  LoadingState,
  ErrorDisplay,
  GrimoireCard,
  SectionHeader,
  Select,
  Input,
  Textarea,
  Modal,
  Button,
} from '@/components/ui'
import { updateCharacter, deleteCharacter, upsertCharacterSkills } from '@/lib/db/characters'
import { SkillsPanel } from '@/components/character'
import {
  ABILITY_NAMES,
  getAbilityModifier,
  calculateMaxHP,
  getProficiencyBonus,
  VOCATIONS,
  RACES,
  CLASSES,
  BACKGROUNDS,
  KNIGHT_ORDERS,
} from '@/lib/constants'
import type {
  CharacterStats,
  Race,
  Background,
  KnightOrder,
  Vocation,
} from '@/lib/types'

// ============ Form State ============

type SkillState = { is_proficient: boolean; is_expertise: boolean }

type FormState = {
  // Identity
  race: Race
  class: string
  background: Background
  knight_order: KnightOrder
  vocation: Vocation | null
  // Character
  name: string
  level: number
  appearance: string
  // Stats
  stats: CharacterStats
  // Skills
  skillChanges: Map<number, SkillState>
  // HP & Money
  hp_current: number
  hp_custom_modifier: number
  platinum: number
  gold: number
  silver: number
  copper: number
}

const IDENTITY_FIELDS = ['race', 'class', 'background', 'knight_order', 'vocation'] as const

// ============ Component ============

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const { data: character, isLoading, error } = useCharacter(user?.id ?? null)
  const { data: characterSkills = [] } = useCharacterSkills(character?.id ?? null)
  const { data: allSkills = [] } = useSkills()
  const { invalidateCharacter, invalidateCharacterSkills, invalidateAllUserData } = useInvalidateQueries()

  const [form, setForm] = useState<FormState | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showIdentityConfirm, setShowIdentityConfirm] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  // Initialize form when character loads
  useEffect(() => {
    if (character && !form) {
      // Build skill state map from loaded character skills
      const skillMap = new Map<number, SkillState>()
      for (const cs of characterSkills) {
        skillMap.set(cs.skill.id, {
          is_proficient: cs.is_proficient,
          is_expertise: cs.is_expertise,
        })
      }

      setForm({
        race: character.race,
        class: character.class,
        background: character.background,
        knight_order: character.knight_order,
        vocation: character.vocation,
        name: character.name,
        level: character.level,
        appearance: character.appearance || '',
        stats: {
          str: character.str,
          dex: character.dex,
          con: character.con,
          int: character.int,
          wis: character.wis,
          cha: character.cha,
          hon: character.hon,
        },
        skillChanges: skillMap,
        hp_current: character.hp_current,
        hp_custom_modifier: character.hp_custom_modifier,
        platinum: character.platinum,
        gold: character.gold,
        silver: character.silver,
        copper: character.copper,
      })
    }
  }, [character, characterSkills, form])

  // ============ Helpers ============

  function adjustHpForMaxChange(
    currentForm: FormState,
    newConScore: number,
    newCustomMod: number
  ): number {
    const oldMax = calculateMaxHP(currentForm.stats.con, currentForm.hp_custom_modifier)
    const newMax = calculateMaxHP(newConScore, newCustomMod)

    if (newMax > oldMax) {
      return newMax
    } else if (currentForm.hp_current > newMax) {
      return newMax
    }
    return currentForm.hp_current
  }

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    if (!form) return
    setForm({ ...form, [field]: value })
  }

  function updateStat(stat: keyof CharacterStats, value: number) {
    if (!form) return
    const clamped = Math.max(1, Math.min(30, value))

    if (stat === 'con') {
      const newHp = adjustHpForMaxChange(form, clamped, form.hp_custom_modifier)
      setForm({
        ...form,
        stats: { ...form.stats, con: clamped },
        hp_current: newHp,
      })
    } else {
      setForm({
        ...form,
        stats: { ...form.stats, [stat]: clamped },
      })
    }
  }

  function updateHpCustomModifier(value: number) {
    if (!form) return
    const newHp = adjustHpForMaxChange(form, form.stats.con, value)
    setForm({ ...form, hp_custom_modifier: value, hp_current: newHp })
  }

  /** Check if any identity fields changed from the original character */
  function hasIdentityChanges(): boolean {
    if (!character || !form) return false
    return IDENTITY_FIELDS.some(
      (field) => form[field] !== character[field]
    )
  }

  // ============ Save ============

  function handleSaveClick() {
    if (hasIdentityChanges()) {
      setShowIdentityConfirm(true)
    } else {
      performSave()
    }
  }

  async function performSave() {
    if (!character || !form || !user) return

    setSaving(true)
    setSaveError(null)
    setShowIdentityConfirm(false)

    const updates = {
      // Identity
      race: form.race,
      class: form.class,
      background: form.background,
      knight_order: form.knight_order,
      vocation: form.vocation,
      // Character
      name: form.name,
      level: form.level,
      appearance: form.appearance || null,
      // Stats
      str: form.stats.str,
      dex: form.stats.dex,
      con: form.stats.con,
      int: form.stats.int,
      wis: form.stats.wis,
      cha: form.stats.cha,
      hon: form.stats.hon,
      // HP & Money
      hp_current: form.hp_current,
      hp_custom_modifier: form.hp_custom_modifier,
      platinum: form.platinum,
      gold: form.gold,
      silver: form.silver,
      copper: form.copper,
    }

    const { error } = await updateCharacter(character.id, updates)

    if (error) {
      setSaveError(error)
      setSaving(false)
      return
    }

    // Save skill changes
    const skillRows = Array.from(form.skillChanges.entries())
      .filter(([, state]) => state.is_proficient)
      .map(([skillId, state]) => ({
        skill_id: skillId,
        is_proficient: state.is_proficient,
        is_expertise: state.is_expertise,
      }))

    const { error: skillError } = await upsertCharacterSkills(character.id, skillRows)
    if (skillError) {
      setSaveError(`Character saved, but skills failed: ${skillError}`)
      setSaving(false)
      return
    }

    invalidateCharacter(user.id)
    invalidateCharacterSkills(character.id)
    router.push('/')
  }

  // ============ Delete Character ============

  async function handleDelete() {
    if (!character || deleteConfirmText !== 'DELETE') return
    setDeleting(true)
    const { error: deleteError } = await deleteCharacter(character.id)
    if (deleteError) {
      setSaveError(`Failed to delete: ${deleteError}`)
      setDeleting(false)
      return
    }
    invalidateAllUserData()
    router.push('/create-character')
  }

  // ============ Loading / Error States ============

  if (isLoading) return <LoadingState message="Loading character..." />

  if (error) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <ErrorDisplay message={error.message} />
      </div>
    )
  }

  if (!character || !form) return <LoadingState message="Loading..." />

  const maxHP = calculateMaxHP(form.stats.con, form.hp_custom_modifier)

  // ============ Render ============

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-2xl text-vellum-50">Settings</h1>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveClick}
            loading={saving}
          >
            Save Changes
          </Button>
        </div>

        {saveError && <ErrorDisplay message={saveError} />}

        {/* 1. Identity */}
        <GrimoireCard padding="lg">
          <SectionHeader>Identity</SectionHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Race"
              value={form.race}
              onChange={(e) => updateField('race', e.target.value as Race)}
            >
              {Object.entries(RACES).map(([key, r]) => (
                <option key={key} value={key}>{r.name}</option>
              ))}
            </Select>

            <Select
              label="Class"
              value={form.class}
              onChange={(e) => updateField('class', e.target.value)}
            >
              {Object.entries(CLASSES).map(([key, c]) => (
                <option key={key} value={key}>{c.name}</option>
              ))}
            </Select>

            <Select
              label="Background"
              value={form.background}
              onChange={(e) => updateField('background', e.target.value as Background)}
            >
              {Object.entries(BACKGROUNDS).map(([key, b]) => (
                <option key={key} value={key}>{b.name}</option>
              ))}
            </Select>

            <Select
              label="Knight Order"
              value={form.knight_order}
              onChange={(e) => updateField('knight_order', e.target.value as KnightOrder)}
            >
              {Object.entries(KNIGHT_ORDERS).map(([key, o]) => (
                <option key={key} value={key}>{o.name}</option>
              ))}
            </Select>

            <Select
              label="Vocation"
              value={form.vocation || ''}
              onChange={(e) => updateField('vocation', (e.target.value || null) as Vocation | null)}
            >
              <option value="">None</option>
              {Object.entries(VOCATIONS).map(([key, v]) => (
                <option key={key} value={key}>{v.name}</option>
              ))}
            </Select>
          </div>
          <p className="text-xs text-vellum-400 mt-3">
            Changing identity fields will prompt for confirmation before saving.
          </p>
        </GrimoireCard>

        {/* 2. Character */}
        <GrimoireCard padding="lg">
          <SectionHeader>Character</SectionHeader>
          <div className="space-y-4">
            <Input
              label="Name"
              type="text"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="max-w-md"
            />

            <Input
              label="Level"
              type="number"
              min={1}
              max={20}
              value={form.level}
              onChange={(e) => updateField('level', parseInt(e.target.value) || 1)}
              className="w-24 text-center"
            />

            <Textarea
              label="Appearance"
              value={form.appearance}
              onChange={(e) => updateField('appearance', e.target.value)}
              rows={3}
              placeholder="Physical description, distinctive features..."
            />
          </div>
        </GrimoireCard>

        {/* 3. Stats */}
        <GrimoireCard padding="lg">
          <SectionHeader>Statistics</SectionHeader>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map((stat) => (
              <div
                key={stat}
                className="elevation-base rounded-lg p-3"
              >
                <label className="block text-xs font-ui tracking-wider text-vellum-300 uppercase mb-2">
                  {ABILITY_NAMES[stat]}
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={form.stats[stat]}
                    onChange={(e) => updateStat(stat, parseInt(e.target.value) || 10)}
                    className="!w-16 !px-2 !py-1 text-center text-lg font-bold"
                  />
                  <span
                    className={`text-sm font-bold ${
                      getAbilityModifier(form.stats[stat]) >= 0
                        ? 'text-emerald-400'
                        : 'text-red-400'
                    }`}
                  >
                    {getAbilityModifier(form.stats[stat]) >= 0 ? '+' : ''}
                    {getAbilityModifier(form.stats[stat])}
                  </span>
                </div>
              </div>
            ))}

            {/* Honor (special styling) */}
            <div className="rounded-lg p-3 bg-amber-900/15 border border-amber-700/30">
              <label className="block text-xs font-ui tracking-wider text-amber-400 uppercase mb-2">
                {ABILITY_NAMES.hon}
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={form.stats.hon}
                  onChange={(e) => updateStat('hon', parseInt(e.target.value) || 8)}
                  className="!w-16 !px-2 !py-1 text-center text-lg font-bold !border-amber-700/40 focus:!border-amber-500"
                />
                <span
                  className={`text-sm font-bold ${
                    getAbilityModifier(form.stats.hon) >= 0
                      ? 'text-emerald-400'
                      : 'text-red-400'
                  }`}
                >
                  {getAbilityModifier(form.stats.hon) >= 0 ? '+' : ''}
                  {getAbilityModifier(form.stats.hon)}
                </span>
              </div>
              <p className="text-xs text-amber-400/60 mt-2">DM awards increases</p>
            </div>
          </div>
        </GrimoireCard>

        {/* 4. Skills */}
        <GrimoireCard padding="lg">
          <SectionHeader>Skills</SectionHeader>
          <p className="text-xs text-vellum-400 mb-4">
            Check proficiency, click EXP for expertise. Proficiency bonus: +{getProficiencyBonus(form.level)}.
          </p>
          <SkillsPanel
            mode="edit"
            skills={allSkills}
            skillStates={form.skillChanges}
            stats={form.stats}
            level={form.level}
            onChange={(skillId, state) => {
              setForm(prev => {
                if (!prev) return prev
                const newMap = new Map(prev.skillChanges)
                newMap.set(skillId, state)
                return { ...prev, skillChanges: newMap }
              })
            }}
          />
        </GrimoireCard>

        {/* 5. HP & Money */}
        <GrimoireCard padding="lg">
          <SectionHeader>HP &amp; Money</SectionHeader>

          {/* HP row */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <Input
                label="Current HP"
                type="number"
                min={0}
                value={form.hp_current}
                onChange={(e) => updateField('hp_current', parseInt(e.target.value) || 0)}
                className="!w-24 text-center text-lg font-bold"
              />
              <p className="text-xs text-vellum-400 mt-1">Max HP: {maxHP}</p>
            </div>

            <div>
              <Input
                label="HP Custom Modifier"
                type="number"
                value={form.hp_custom_modifier}
                onChange={(e) => updateHpCustomModifier(parseInt(e.target.value) || 0)}
                className="!w-24 text-center"
              />
              <p className="text-xs text-vellum-400 mt-1">Extra HP from feats, items, etc.</p>
            </div>
          </div>

          {/* Money row */}
          <div className="grid grid-cols-4 gap-3">
            <Input
              label="Platinum"
              type="number"
              min={0}
              value={form.platinum}
              onChange={(e) => updateField('platinum', parseInt(e.target.value) || 0)}
              className="text-center font-bold focus:!border-amber-500"
            />
            <Input
              label="Gold"
              type="number"
              min={0}
              value={form.gold}
              onChange={(e) => updateField('gold', parseInt(e.target.value) || 0)}
              className="text-center font-bold focus:!border-yellow-500"
            />
            <Input
              label="Silver"
              type="number"
              min={0}
              value={form.silver}
              onChange={(e) => updateField('silver', parseInt(e.target.value) || 0)}
              className="text-center font-bold focus:!border-zinc-400"
            />
            <Input
              label="Copper"
              type="number"
              min={0}
              value={form.copper}
              onChange={(e) => updateField('copper', parseInt(e.target.value) || 0)}
              className="text-center font-bold focus:!border-amber-600"
            />
          </div>
        </GrimoireCard>

        {/* 5. Account */}
        <GrimoireCard padding="lg">
          <SectionHeader>Account</SectionHeader>
          <div className="flex items-center gap-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => signOut()}
            >
              Sign Out
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowDeleteModal(true)}
              className="!border-red-800/50 !text-red-400 hover:!bg-red-900/20 hover:!border-red-700/60"
            >
              Delete Character
            </Button>
          </div>
        </GrimoireCard>
      </div>

      {/* Identity Change Confirmation Modal */}
      <Modal
        open={showIdentityConfirm}
        onClose={() => setShowIdentityConfirm(false)}
        title="Confirm Identity Change"
      >
        <p className="text-vellum-200 font-body mb-4">
          Changing your character&apos;s identity may affect other features. Continue?
        </p>
        <div className="flex gap-3 justify-end">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowIdentityConfirm(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={performSave}
            loading={saving}
          >
            Confirm
          </Button>
        </div>
      </Modal>

      {/* Delete Character Modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeleteConfirmText('') }}
        title="Delete Character"
      >
        <p className="text-vellum-200 font-body mb-2">
          This will <strong className="text-red-400">permanently delete</strong> your
          character and ALL associated data (inventory, recipes, herbs, weapons, equipment).
        </p>
        <p className="text-vellum-300 font-body text-sm mb-4">
          This cannot be undone.
        </p>
        <div className="mb-4">
          <Input
            label="Type DELETE to confirm"
            type="text"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="DELETE"
            className="!border-red-800/50 focus:!border-red-600"
          />
        </div>
        <div className="flex gap-3 justify-end">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => { setShowDeleteModal(false); setDeleteConfirmText('') }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleDelete}
            loading={deleting}
            disabled={deleteConfirmText !== 'DELETE'}
            className="!bg-red-700 hover:!bg-red-600"
          >
            Delete Forever
          </Button>
        </div>
      </Modal>
    </div>
  )
}

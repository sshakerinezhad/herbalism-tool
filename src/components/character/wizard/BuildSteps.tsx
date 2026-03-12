'use client'

import { useState, useMemo } from 'react'
import {
  ABILITY_NAMES,
  VOCATIONS,
  getAbilityModifier,
  calculateMaxHP,
} from '@/lib/constants'
import type {
  Vocation,
  Skill,
  CharacterStats,
} from '@/lib/types'
import type { StepProps } from './types'
import { Input, Button } from '@/components/ui'
import { SelectionCard } from './SelectionCard'

// ============ StepStats ============

export function StepStats({ data, setData }: StepProps) {
  const stats = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const

  function updateStat(stat: keyof CharacterStats, value: number) {
    setData(prev => ({
      ...prev,
      stats: { ...prev.stats, [stat]: Math.max(1, Math.min(20, value)) }
    }))
  }

  const maxHP = calculateMaxHP(data.stats.con)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl text-vellum-50">Set your statistics</h2>
        <p className="text-vellum-400 text-sm mt-1">
          Use your stat calculator and enter the values here. Honor always starts at 8.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map(stat => (
          <div key={stat} className="elevation-base rounded-lg p-4">
            <label className="block font-ui text-xs tracking-wider text-vellum-400 uppercase mb-2">
              {ABILITY_NAMES[stat]}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={data.stats[stat]}
                onChange={(e) => updateStat(stat, parseInt(e.target.value) || 10)}
                min={1}
                max={20}
                className="w-20 px-3 py-2 bg-grimoire-950 border border-sepia-700/50 text-vellum-50 rounded text-center text-lg font-bold focus:outline-none focus:border-bronze-muted"
              />
              <span className={`text-lg font-medium ${
                getAbilityModifier(data.stats[stat]) >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {getAbilityModifier(data.stats[stat]) >= 0 ? '+' : ''}
                {getAbilityModifier(data.stats[stat])}
              </span>
            </div>
          </div>
        ))}

        {/* Honor (fixed at 8) */}
        <div className="bg-amber-900/15 rounded-lg p-4 border border-amber-700/30">
          <label className="block font-ui text-xs tracking-wider text-amber-400 uppercase mb-2">
            {ABILITY_NAMES.hon}
          </label>
          <div className="flex items-center gap-2">
            <div className="w-20 px-3 py-2 bg-grimoire-950 border border-sepia-700/50 rounded text-center text-lg font-bold text-vellum-400">
              {data.stats.hon}
            </div>
            <span className="text-lg font-medium text-red-400">
              {getAbilityModifier(data.stats.hon)}
            </span>
          </div>
          <p className="text-xs text-amber-400/60 mt-1">Fixed at 8 (DM increases)</p>
        </div>
      </div>

      <div className="elevation-base rounded-lg p-4 mt-4">
        <div className="flex items-center justify-between">
          <span className="text-vellum-400">Calculated Max HP</span>
          <span className="text-2xl font-bold text-red-400">{maxHP}</span>
        </div>
        <p className="text-xs text-vellum-500 mt-1">
          26 + (4 × CON modifier) = 26 + (4 × {getAbilityModifier(data.stats.con)}) = {maxHP}
        </p>
      </div>
    </div>
  )
}

// ============ StepSkills ============

export function StepSkills({
  data,
  setData,
  skills,
  totalProficiencies,
}: StepProps & { skills: Skill[]; totalProficiencies: number }) {
  const skillsByAbility = useMemo(() => {
    const grouped: Record<string, Skill[]> = {}
    for (const skill of skills) {
      if (!grouped[skill.stat]) grouped[skill.stat] = []
      grouped[skill.stat].push(skill)
    }
    return grouped
  }, [skills])

  function toggleSkill(skillId: number) {
    setData(prev => {
      const newSet = new Set(prev.skillProficiencies)
      if (newSet.has(skillId)) {
        newSet.delete(skillId)
      } else if (newSet.size < totalProficiencies) {
        newSet.add(skillId)
      }
      return { ...prev, skillProficiencies: newSet }
    })
  }

  const remaining = totalProficiencies - data.skillProficiencies.size

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl text-vellum-50">Choose skill proficiencies</h2>
        <p className="text-vellum-400 text-sm mt-1">
          Select {totalProficiencies} skills (2 from background + {totalProficiencies - 2} from class).
          <span className={`ml-2 font-medium ${remaining > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {remaining > 0 ? `${remaining} remaining` : 'Complete'}
          </span>
        </p>
      </div>

      <div className="grid gap-6">
        {Object.entries(skillsByAbility).map(([ability, abilitySkills]) => (
          <div key={ability}>
            <h3 className="font-ui text-xs tracking-[0.12em] text-vellum-400 uppercase mb-2">
              {ABILITY_NAMES[ability as keyof typeof ABILITY_NAMES]}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {abilitySkills.map(skill => {
                const isSelected = data.skillProficiencies.has(skill.id)
                const isDisabled = !isSelected && remaining === 0

                return (
                  <button
                    key={skill.id}
                    onClick={() => toggleSkill(skill.id)}
                    disabled={isDisabled}
                    className={`px-3 py-2 rounded border text-sm text-left transition-all duration-200 ${
                      isSelected
                        ? 'bg-bronze-muted/15 border-bronze-muted/60 text-vellum-100'
                        : isDisabled
                          ? 'elevation-base border-sepia-800/30 text-vellum-500 cursor-not-allowed opacity-60'
                          : 'elevation-base border-sepia-700/30 text-vellum-200 hover:border-sepia-600/50'
                    }`}
                  >
                    {skill.name}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============ StepVocation ============

export function StepVocation({ data, setData }: StepProps) {
  const [mode, setMode] = useState<'vocation' | 'feat'>(data.vocation ? 'vocation' : 'feat')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl text-vellum-50">Choose a vocation or feat</h2>
        <p className="text-vellum-400 text-sm mt-1">
          A vocation grants special abilities. Alternatively, take a feat (DM approved).
        </p>
      </div>

      <div className="flex gap-2 mb-4">
        <Button
          variant={mode === 'vocation' ? 'primary' : 'secondary'}
          onClick={() => {
            setMode('vocation')
            setData(prev => ({ ...prev, feat: '' }))
          }}
        >
          Vocation
        </Button>
        <Button
          variant={mode === 'feat' ? 'primary' : 'secondary'}
          onClick={() => {
            setMode('feat')
            setData(prev => ({ ...prev, vocation: null }))
          }}
        >
          Feat
        </Button>
      </div>

      {mode === 'vocation' && (
        <div className="grid gap-3">
          {(Object.entries(VOCATIONS) as [Vocation, typeof VOCATIONS[Vocation]][]).map(([key, voc]) => (
            <SelectionCard
              key={key}
              selected={data.vocation === key}
              onClick={() => setData(prev => ({ ...prev, vocation: key }))}
            >
              <div className="font-medium text-vellum-100">{voc.name}</div>
              <div className="text-sm text-vellum-400 mt-1">{voc.description}</div>
            </SelectionCard>
          ))}
        </div>
      )}

      {mode === 'feat' && (
        <div>
          <label className="block text-sm font-medium text-vellum-200 mb-2">
            Enter your DM-approved feat
          </label>
          <Input
            value={data.feat}
            onChange={(e) => setData(prev => ({ ...prev, feat: e.target.value }))}
            placeholder="e.g., Alert, Tough, Shield Master..."
            className="max-w-md"
          />
          <p className="text-xs text-vellum-500 mt-2">
            Must be a non-magical feat approved by your DM.
          </p>
        </div>
      )}
    </div>
  )
}

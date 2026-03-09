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
        <h2 className="text-xl font-semibold">Set your statistics</h2>
        <p className="text-zinc-400 text-sm mt-1">
          Use your stat calculator and enter the values here. Honor always starts at 8.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map(stat => (
          <div key={stat} className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              {ABILITY_NAMES[stat]}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={data.stats[stat]}
                onChange={(e) => updateStat(stat, parseInt(e.target.value) || 10)}
                min={1}
                max={20}
                className="w-20 px-3 py-2 bg-zinc-800 border border-zinc-600 rounded text-center text-lg font-bold focus:outline-none focus:border-emerald-600"
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
        <div className="bg-zinc-900 rounded-lg p-4 border border-amber-700/50">
          <label className="block text-sm font-medium text-amber-400 mb-2">
            {ABILITY_NAMES.hon}
          </label>
          <div className="flex items-center gap-2">
            <div className="w-20 px-3 py-2 bg-zinc-800 border border-zinc-600 rounded text-center text-lg font-bold text-zinc-400">
              {data.stats.hon}
            </div>
            <span className="text-lg font-medium text-red-400">
              {getAbilityModifier(data.stats.hon)}
            </span>
          </div>
          <p className="text-xs text-amber-400/60 mt-1">Fixed at 8 (DM increases)</p>
        </div>
      </div>

      <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700 mt-4">
        <div className="flex items-center justify-between">
          <span className="text-zinc-400">Calculated Max HP</span>
          <span className="text-2xl font-bold text-red-400">{maxHP}</span>
        </div>
        <p className="text-xs text-zinc-500 mt-1">
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
        <h2 className="text-xl font-semibold">Choose skill proficiencies</h2>
        <p className="text-zinc-400 text-sm mt-1">
          Select {totalProficiencies} skills (2 from background + {totalProficiencies - 2} from class).
          <span className={`ml-2 font-medium ${remaining > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {remaining > 0 ? `${remaining} remaining` : '✓ Complete'}
          </span>
        </p>
      </div>

      <div className="grid gap-6">
        {Object.entries(skillsByAbility).map(([ability, abilitySkills]) => (
          <div key={ability}>
            <h3 className="text-sm font-medium text-zinc-400 mb-2 uppercase tracking-wide">
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
                    className={`px-3 py-2 rounded border text-sm text-left transition-colors ${
                      isSelected
                        ? 'bg-emerald-900/30 border-emerald-600 text-emerald-100'
                        : isDisabled
                          ? 'bg-zinc-900/50 border-zinc-800 text-zinc-500 cursor-not-allowed'
                          : 'bg-zinc-900 border-zinc-700 hover:border-zinc-500'
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
        <h2 className="text-xl font-semibold">Choose a vocation or feat</h2>
        <p className="text-zinc-400 text-sm mt-1">
          A vocation grants special abilities. Alternatively, take a feat (DM approved).
        </p>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => {
            setMode('vocation')
            setData(prev => ({ ...prev, feat: '' }))
          }}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            mode === 'vocation'
              ? 'bg-emerald-700 text-white'
              : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
          }`}
        >
          Vocation
        </button>
        <button
          onClick={() => {
            setMode('feat')
            setData(prev => ({ ...prev, vocation: null }))
          }}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            mode === 'feat'
              ? 'bg-emerald-700 text-white'
              : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
          }`}
        >
          Feat
        </button>
      </div>

      {mode === 'vocation' && (
        <div className="grid gap-3">
          {(Object.entries(VOCATIONS) as [Vocation, typeof VOCATIONS[Vocation]][]).map(([key, voc]) => (
            <button
              key={key}
              onClick={() => setData(prev => ({ ...prev, vocation: key }))}
              className={`p-4 rounded-lg border text-left transition-colors ${
                data.vocation === key
                  ? 'bg-emerald-900/30 border-emerald-600'
                  : 'bg-zinc-900 border-zinc-700 hover:border-zinc-500'
              }`}
            >
              <div className="font-medium">{voc.name}</div>
              <div className="text-sm text-zinc-400 mt-1">{voc.description}</div>
            </button>
          ))}
        </div>
      )}

      {mode === 'feat' && (
        <div>
          <label className="block text-sm font-medium mb-2">
            Enter your DM-approved feat
          </label>
          <input
            type="text"
            value={data.feat}
            onChange={(e) => setData(prev => ({ ...prev, feat: e.target.value }))}
            placeholder="e.g., Alert, Tough, Shield Master..."
            className="w-full max-w-md px-4 py-3 bg-zinc-900 border border-zinc-600 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-600"
          />
          <p className="text-xs text-zinc-500 mt-2">
            Must be a non-magical feat approved by your DM.
          </p>
        </div>
      )}
    </div>
  )
}

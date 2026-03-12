'use client'

/**
 * SkillsPanel - Shared skill display/edit component
 *
 * Used in Settings (edit mode) and Profile (view mode).
 * Groups all 27 skills by governing ability, shows bonus calculations.
 */

import { useMemo } from 'react'
import { Checkbox } from '@/components/ui'
import {
  ABILITY_NAMES,
  getAbilityModifier,
  getProficiencyBonus,
} from '@/lib/constants'
import type { Skill, AbilityStat, CharacterStats } from '@/lib/types'

// ============ Types ============

type SkillState = {
  is_proficient: boolean
  is_expertise: boolean
}

type SkillsPanelProps = {
  mode: 'view' | 'edit'
  /** All 27 skills from reference table */
  skills: Skill[]
  /** Map of skill_id → { is_proficient, is_expertise } */
  skillStates: Map<number, SkillState>
  /** Character's ability scores (for bonus calculation) */
  stats: CharacterStats
  /** Character level (for proficiency bonus) */
  level: number
  /** Called when a skill changes (edit mode only) */
  onChange?: (skillId: number, state: SkillState) => void
}

// Ability display order (exclude hon — no skills use it)
const ABILITY_ORDER: AbilityStat[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

// ============ Component ============

export function SkillsPanel({
  mode,
  skills,
  skillStates,
  stats,
  level,
  onChange,
}: SkillsPanelProps) {
  const profBonus = getProficiencyBonus(level)

  // Group skills by governing ability
  const grouped = useMemo(() => {
    const map = new Map<AbilityStat, Skill[]>()
    for (const ability of ABILITY_ORDER) {
      map.set(ability, [])
    }
    for (const skill of skills) {
      const list = map.get(skill.stat as AbilityStat)
      if (list) list.push(skill)
    }
    return map
  }, [skills])

  function getBonus(skill: Skill): number {
    const abilityMod = getAbilityModifier(stats[skill.stat as keyof CharacterStats])
    const state = skillStates.get(skill.id)
    if (!state?.is_proficient) return abilityMod
    return abilityMod + profBonus + (state.is_expertise ? profBonus : 0)
  }

  function formatBonus(n: number): string {
    return n >= 0 ? `+${n}` : `${n}`
  }

  if (mode === 'view') {
    return (
      <div className="grid grid-cols-2 gap-x-5 gap-y-2.5">
        {ABILITY_ORDER.map(ability => {
          const abilitySkills = grouped.get(ability)
          if (!abilitySkills || abilitySkills.length === 0) return null

          return (
            <div key={ability}>
              <h4 className="text-[10px] font-ui tracking-[0.14em] text-vellum-400/80 uppercase mb-1 pb-0.5 border-b border-sepia-800/40">
                {ABILITY_NAMES[ability]}
              </h4>
              <div>
                {abilitySkills.map(skill => {
                  const state = skillStates.get(skill.id) ?? { is_proficient: false, is_expertise: false }
                  const bonus = getBonus(skill)

                  return (
                    <div key={skill.id} className="flex items-center justify-between py-[3px] px-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          state.is_expertise
                            ? 'bg-amber-400'
                            : state.is_proficient
                              ? 'bg-bronze-muted'
                              : 'bg-sepia-800/40'
                        }`} />
                        <span className={`text-xs leading-tight ${
                          state.is_proficient ? 'text-vellum-200' : 'text-vellum-400/70'
                        }`}>
                          {skill.name}
                        </span>
                      </div>
                      <span className={`text-xs font-mono tabular-nums ml-2 ${
                        state.is_proficient ? 'text-vellum-200' : 'text-vellum-400/50'
                      }`}>
                        {formatBonus(bonus)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Edit mode — keep single column for usability
  return (
    <div className="space-y-4">
      {ABILITY_ORDER.map(ability => {
        const abilitySkills = grouped.get(ability)
        if (!abilitySkills || abilitySkills.length === 0) return null

        return (
          <div key={ability}>
            <h4 className="text-xs font-ui tracking-[0.12em] text-vellum-400 uppercase mb-2">
              {ABILITY_NAMES[ability]}
            </h4>
            <div className="space-y-1">
              {abilitySkills.map(skill => {
                const state = skillStates.get(skill.id) ?? { is_proficient: false, is_expertise: false }
                const bonus = getBonus(skill)

                return (
                  <div key={skill.id} className="flex items-center justify-between py-1 px-2 rounded hover:bg-grimoire-950/50">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={state.is_proficient}
                        onChange={() => {
                          const newProf = !state.is_proficient
                          onChange?.(skill.id, {
                            is_proficient: newProf,
                            is_expertise: newProf ? state.is_expertise : false,
                          })
                        }}
                      />
                      <span className={`text-sm ${
                        state.is_proficient ? 'text-vellum-100' : 'text-vellum-400'
                      }`}>
                        {skill.name}
                      </span>
                      {state.is_proficient && (
                        <button
                          type="button"
                          onClick={() => {
                            onChange?.(skill.id, {
                              ...state,
                              is_expertise: !state.is_expertise,
                            })
                          }}
                          className={`text-xs px-1.5 py-0.5 rounded border transition-colors ${
                            state.is_expertise
                              ? 'bg-amber-900/30 border-amber-600/50 text-amber-400'
                              : 'border-sepia-700/30 text-vellum-500 hover:border-sepia-600/50 hover:text-vellum-300'
                          }`}
                        >
                          EXP
                        </button>
                      )}
                    </div>
                    <span className={`text-sm font-mono tabular-nums ${
                      state.is_proficient ? 'text-vellum-100' : 'text-vellum-500'
                    }`}>
                      {formatBonus(bonus)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

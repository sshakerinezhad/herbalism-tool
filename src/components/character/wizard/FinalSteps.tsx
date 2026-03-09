'use client'

import {
  RACES,
  HUMAN_CULTURES,
  CLASSES,
  BACKGROUNDS,
  KNIGHT_ORDERS,
  VOCATIONS,
  ARMOR_PRESETS,
  getAbilityModifier,
  calculateMaxHP,
} from '@/lib/constants'
import type { Skill } from '@/lib/types'
import type { WizardData, StepProps } from './types'

// ============ StepEquipment ============

export function StepEquipment({
  data,
  setData,
  rollMoney,
}: StepProps & { rollMoney: () => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Starting Equipment</h2>
        <p className="text-zinc-400 text-sm mt-1">
          All Knights start with armor totaling AC 14 and some starting gold.
        </p>
      </div>

      {/* Armor Preset */}
      <div>
        <h3 className="text-lg font-medium mb-3">Armor Set</h3>
        <div className="grid gap-3">
          {ARMOR_PRESETS.map((preset, idx) => {
            const canUse = data.stats.str >= preset.min_str

            return (
              <button
                key={idx}
                onClick={() => canUse && setData(prev => ({ ...prev, armorPreset: preset }))}
                disabled={!canUse}
                className={`p-4 rounded-lg border text-left transition-colors ${
                  data.armorPreset === preset
                    ? 'bg-emerald-900/30 border-emerald-600'
                    : !canUse
                      ? 'bg-zinc-900/50 border-zinc-800 text-zinc-500 cursor-not-allowed'
                      : 'bg-zinc-900 border-zinc-700 hover:border-zinc-500'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{preset.name}</span>
                  <span className="text-sm">AC {preset.total_ac}</span>
                </div>
                <div className="text-sm text-zinc-400 mt-1">{preset.description}</div>
                {preset.min_str > 0 && (
                  <div className={`text-xs mt-1 ${canUse ? 'text-zinc-500' : 'text-red-400'}`}>
                    Requires STR {preset.min_str}
                    {!canUse && ` (You have ${data.stats.str})`}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Starting Money */}
      <div>
        <h3 className="text-lg font-medium mb-3">Starting Money</h3>
        <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
          {data.gold === 0 && data.silver === 0 && data.copper === 0 ? (
            <button
              onClick={rollMoney}
              className="w-full py-3 bg-amber-700 hover:bg-amber-600 rounded-lg font-medium transition-colors"
            >
              Roll Starting Money (1d12 GP, 4d8 SP, 8d4 CP)
            </button>
          ) : (
            <div className="text-center">
              <div className="text-2xl font-bold">
                <span className="text-yellow-400">{data.gold} GP</span>
                {' \u00b7 '}
                <span className="text-zinc-300">{data.silver} SP</span>
                {' \u00b7 '}
                <span className="text-amber-600">{data.copper} CP</span>
              </div>
              <button
                onClick={rollMoney}
                className="mt-3 text-sm text-zinc-400 hover:text-zinc-200 underline"
              >
                Roll again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============ StepReview ============

export function StepReview({ data, skills }: { data: WizardData; skills: Skill[] }) {
  const selectedSkills = skills.filter(s => data.skillProficiencies.has(s.id))
  const maxHP = calculateMaxHP(data.stats.con)

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Review Your Character</h2>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Identity */}
        <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
          <h3 className="font-medium text-zinc-400 mb-3">Identity</h3>
          <div className="space-y-2 text-sm">
            <div><span className="text-zinc-400">Name:</span> <span className="font-medium">{data.name}</span></div>
            <div><span className="text-zinc-400">Race:</span> {data.race && RACES[data.race].name}{data.subrace && ` (${HUMAN_CULTURES[data.subrace].name})`}</div>
            <div><span className="text-zinc-400">Background:</span> {data.background && BACKGROUNDS[data.background].name}</div>
            {data.previousProfession && (
              <div><span className="text-zinc-400">Previous:</span> {data.previousProfession}</div>
            )}
            <div><span className="text-zinc-400">Class:</span> {data.class && CLASSES[data.class].name}</div>
            <div><span className="text-zinc-400">Order:</span> {data.knightOrder && KNIGHT_ORDERS[data.knightOrder].name}</div>
            <div><span className="text-zinc-400">Vocation:</span> {data.vocation ? VOCATIONS[data.vocation].name : `Feat: ${data.feat}`}</div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
          <h3 className="font-medium text-zinc-400 mb-3">Statistics</h3>
          <div className="grid grid-cols-4 gap-2 text-center text-sm">
            {(['str', 'dex', 'con', 'int', 'wis', 'cha', 'hon'] as const).map(stat => (
              <div key={stat} className="bg-zinc-800 rounded p-2">
                <div className="text-xs text-zinc-500 uppercase">{stat}</div>
                <div className="font-bold">{data.stats[stat]}</div>
                <div className={`text-xs ${getAbilityModifier(data.stats[stat]) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {getAbilityModifier(data.stats[stat]) >= 0 ? '+' : ''}{getAbilityModifier(data.stats[stat])}
                </div>
              </div>
            ))}
            <div className="bg-red-900/30 rounded p-2">
              <div className="text-xs text-red-400 uppercase">HP</div>
              <div className="font-bold text-red-400">{maxHP}</div>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
          <h3 className="font-medium text-zinc-400 mb-3">Skill Proficiencies</h3>
          <div className="flex flex-wrap gap-2">
            {selectedSkills.map(skill => (
              <span key={skill.id} className="px-2 py-1 bg-emerald-900/30 border border-emerald-700 rounded text-sm">
                {skill.name}
              </span>
            ))}
          </div>
        </div>

        {/* Equipment */}
        <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
          <h3 className="font-medium text-zinc-400 mb-3">Starting Equipment</h3>
          <div className="space-y-2 text-sm">
            <div><span className="text-zinc-400">Armor:</span> {data.armorPreset?.name} (AC {data.armorPreset?.total_ac})</div>
            <div>
              <span className="text-zinc-400">Money:</span>{' '}
              <span className="text-yellow-400">{data.gold} GP</span>,{' '}
              <span className="text-zinc-300">{data.silver} SP</span>,{' '}
              <span className="text-amber-600">{data.copper} CP</span>
            </div>
          </div>
        </div>
      </div>

      {data.appearance && (
        <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
          <h3 className="font-medium text-zinc-400 mb-2">Appearance</h3>
          <p className="text-sm">{data.appearance}</p>
        </div>
      )}
    </div>
  )
}

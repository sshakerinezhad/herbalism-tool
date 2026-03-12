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
import { GrimoireCard, SectionHeader, Button } from '@/components/ui'
import { SelectionCard } from './SelectionCard'

// ============ StepEquipment ============

export function StepEquipment({
  data,
  setData,
  rollMoney,
}: StepProps & { rollMoney: () => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl text-vellum-50">Starting Equipment</h2>
        <p className="text-vellum-400 text-sm mt-1">
          All Knights start with armor totaling AC 14 and some starting gold.
        </p>
      </div>

      {/* Armor Preset */}
      <div>
        <h3 className="font-heading text-lg text-vellum-100 mb-3">Armor Set</h3>
        <div className="grid gap-3">
          {ARMOR_PRESETS.map((preset, idx) => {
            const canUse = data.stats.str >= preset.min_str

            return (
              <SelectionCard
                key={idx}
                selected={data.armorPreset === preset}
                disabled={!canUse}
                onClick={() => canUse && setData(prev => ({ ...prev, armorPreset: preset }))}
              >
                <div className="flex justify-between items-center">
                  <span className="text-vellum-100 font-medium">{preset.name}</span>
                  <span className="text-sm text-vellum-300">AC {preset.total_ac}</span>
                </div>
                <div className="text-sm text-vellum-400 mt-1">{preset.description}</div>
                {preset.min_str > 0 && (
                  <div className={`text-xs mt-1 ${canUse ? 'text-vellum-500' : 'text-red-400'}`}>
                    Requires STR {preset.min_str}
                    {!canUse && ` (You have ${data.stats.str})`}
                  </div>
                )}
              </SelectionCard>
            )
          })}
        </div>
      </div>

      {/* Starting Money */}
      <div>
        <h3 className="font-heading text-lg text-vellum-100 mb-3">Starting Money</h3>
        <div className="elevation-base rounded-lg p-4">
          {data.gold === 0 && data.silver === 0 && data.copper === 0 ? (
            <Button
              variant="primary"
              onClick={rollMoney}
              className="w-full"
            >
              Roll Starting Money (1d12 GP, 4d8 SP, 8d4 CP)
            </Button>
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
                className="mt-3 text-sm text-vellum-400 hover:text-vellum-200 underline"
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
      <h2 className="font-heading text-xl text-vellum-50">Review Your Character</h2>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Identity */}
        <GrimoireCard variant="inset" padding="md">
          <SectionHeader>Identity</SectionHeader>
          <div className="space-y-2 text-sm">
            <div><span className="text-vellum-400">Name:</span> <span className="text-vellum-100 font-medium">{data.name}</span></div>
            <div><span className="text-vellum-400">Race:</span> <span className="text-vellum-100 font-medium">{data.race && RACES[data.race].name}{data.subrace && ` (${HUMAN_CULTURES[data.subrace].name})`}</span></div>
            <div><span className="text-vellum-400">Background:</span> <span className="text-vellum-100 font-medium">{data.background && BACKGROUNDS[data.background].name}</span></div>
            {data.previousProfession && (
              <div><span className="text-vellum-400">Previous:</span> <span className="text-vellum-100 font-medium">{data.previousProfession}</span></div>
            )}
            <div><span className="text-vellum-400">Class:</span> <span className="text-vellum-100 font-medium">{data.class && CLASSES[data.class].name}</span></div>
            <div><span className="text-vellum-400">Order:</span> <span className="text-vellum-100 font-medium">{data.knightOrder && KNIGHT_ORDERS[data.knightOrder].name}</span></div>
            <div><span className="text-vellum-400">Vocation:</span> <span className="text-vellum-100 font-medium">{data.vocation ? VOCATIONS[data.vocation].name : `Feat: ${data.feat}`}</span></div>
          </div>
        </GrimoireCard>

        {/* Stats */}
        <GrimoireCard variant="inset" padding="md">
          <SectionHeader>Statistics</SectionHeader>
          <div className="grid grid-cols-4 gap-2 text-center text-sm">
            {(['str', 'dex', 'con', 'int', 'wis', 'cha', 'hon'] as const).map(stat => (
              <div key={stat} className="elevation-base rounded p-2">
                <div className="text-xs text-vellum-500 uppercase">{stat}</div>
                <div className="font-bold text-vellum-100">{data.stats[stat]}</div>
                <div className={`text-xs ${getAbilityModifier(data.stats[stat]) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {getAbilityModifier(data.stats[stat]) >= 0 ? '+' : ''}{getAbilityModifier(data.stats[stat])}
                </div>
              </div>
            ))}
            <div className="bg-red-900/20 rounded p-2">
              <div className="text-xs text-red-400 uppercase">HP</div>
              <div className="font-bold text-red-400">{maxHP}</div>
            </div>
          </div>
        </GrimoireCard>

        {/* Skills */}
        <GrimoireCard variant="inset" padding="md">
          <SectionHeader>Skill Proficiencies</SectionHeader>
          <div className="flex flex-wrap gap-2">
            {selectedSkills.map(skill => (
              <span key={skill.id} className="px-2 py-1 bg-bronze-muted/15 border border-bronze-muted/50 text-bronze-muted rounded text-sm">
                {skill.name}
              </span>
            ))}
          </div>
        </GrimoireCard>

        {/* Equipment */}
        <GrimoireCard variant="inset" padding="md">
          <SectionHeader>Starting Equipment</SectionHeader>
          <div className="space-y-2 text-sm">
            <div><span className="text-vellum-400">Armor:</span> <span className="text-vellum-100 font-medium">{data.armorPreset?.name} (AC {data.armorPreset?.total_ac})</span></div>
            <div>
              <span className="text-vellum-400">Money:</span>{' '}
              <span className="text-yellow-400">{data.gold} GP</span>,{' '}
              <span className="text-zinc-300">{data.silver} SP</span>,{' '}
              <span className="text-amber-600">{data.copper} CP</span>
            </div>
          </div>
        </GrimoireCard>
      </div>

      {data.appearance && (
        <GrimoireCard variant="inset" padding="md">
          <SectionHeader>Appearance</SectionHeader>
          <p className="text-sm text-vellum-200">{data.appearance}</p>
        </GrimoireCard>
      )}
    </div>
  )
}

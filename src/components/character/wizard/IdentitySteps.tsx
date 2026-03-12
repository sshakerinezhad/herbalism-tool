'use client'

/**
 * Identity step components for the character creation wizard.
 * Steps: Name, Race, Background, Class, Knight Order
 */

import type { StepProps } from './types'
import type {
  Race,
  HumanCulture,
  StartingClass,
  Background,
  KnightOrder,
} from '@/lib/types'
import {
  RACES,
  HUMAN_CULTURES,
  CLASSES,
  BACKGROUNDS,
  KNIGHT_ORDERS,
} from '@/lib/constants'
import { Input, Textarea } from '@/components/ui'
import { SelectionCard } from './SelectionCard'

// ============ Step 1: Name & Appearance ============

export function StepName({ data, setData }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl text-vellum-50 mb-4">What is your knight&apos;s name?</h2>
        <Input
          value={data.name}
          onChange={(e) => setData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter character name"
          className="max-w-md"
          autoFocus
        />
      </div>

      <div>
        <h2 className="font-heading text-xl text-vellum-50 mb-4">Describe your appearance (optional)</h2>
        <Textarea
          value={data.appearance}
          onChange={(e) => setData(prev => ({ ...prev, appearance: e.target.value }))}
          placeholder="Physical description, distinctive features, etc."
          rows={4}
        />
      </div>
    </div>
  )
}

// ============ Step 2: Race ============

export function StepRace({ data, setData }: StepProps) {
  const raceEntries = Object.entries(RACES) as [Race, { name: string; hasSubrace: boolean }][]

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl text-vellum-50">Choose your race</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {raceEntries.map(([key, { name }]) => (
          <SelectionCard
            key={key}
            selected={data.race === key}
            onClick={() => setData(prev => ({
              ...prev,
              race: key,
              subrace: key === 'human' ? prev.subrace : null
            }))}
          >
            <span className="font-medium text-vellum-100">{name}</span>
          </SelectionCard>
        ))}
      </div>

      {data.race === 'human' && (
        <div className="mt-6">
          <h3 className="font-heading text-lg text-vellum-100 mb-3">Choose your culture</h3>
          <div className="grid grid-cols-2 gap-3">
            {(Object.entries(HUMAN_CULTURES) as [HumanCulture, typeof HUMAN_CULTURES[HumanCulture]][]).map(([key, culture]) => (
              <SelectionCard
                key={key}
                selected={data.subrace === key}
                onClick={() => setData(prev => ({ ...prev, subrace: key }))}
              >
                <div className="font-medium text-vellum-100">{culture.name}</div>
                <div className="text-xs text-vellum-400 mt-1">
                  {culture.region} &bull; {culture.religion}
                </div>
              </SelectionCard>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ============ Step 3: Background ============

export function StepBackground({ data, setData }: StepProps) {
  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl text-vellum-50">Choose your background</h2>

      <div className="grid gap-4">
        {(Object.entries(BACKGROUNDS) as [Background, typeof BACKGROUNDS[Background]][]).map(([key, bg]) => (
          <SelectionCard
            key={key}
            selected={data.background === key}
            onClick={() => setData(prev => ({ ...prev, background: key }))}
          >
            <div className="text-vellum-100 font-medium text-lg">{bg.name}</div>
            <div className="text-vellum-400 text-sm mt-1">{bg.description}</div>
          </SelectionCard>
        ))}
      </div>

      {data.background === 'initiate' && (
        <div className="mt-6">
          <label className="block font-heading text-lg text-vellum-100 mb-2">
            What was your previous profession?
          </label>
          <Input
            value={data.previousProfession}
            onChange={(e) => setData(prev => ({ ...prev, previousProfession: e.target.value }))}
            placeholder="e.g., Blacksmith, Sailor, Scholar..."
            className="max-w-md"
          />
        </div>
      )}
    </div>
  )
}

// ============ Step 4: Class ============

export function StepClass({ data, setData }: StepProps) {
  const classEntries = Object.entries(CLASSES) as [StartingClass, typeof CLASSES[StartingClass]][]

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl text-vellum-50">Choose your class</h2>

      <div className="grid gap-3">
        {classEntries.map(([key, cls]) => {
          const isDisabled = cls.requiresBackground && data.background !== cls.requiresBackground

          return (
            <SelectionCard
              key={key}
              selected={data.class === key}
              disabled={isDisabled}
              onClick={() => !isDisabled && setData(prev => ({ ...prev, class: key }))}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium text-lg text-vellum-100">{cls.name}</span>
                <span className="text-sm text-vellum-400">
                  +{cls.proficiencies} skill proficiencies
                </span>
              </div>
              {cls.requiresBackground && (
                <div className="text-xs text-amber-400 mt-1">
                  Requires {BACKGROUNDS[cls.requiresBackground].name} background
                </div>
              )}
            </SelectionCard>
          )
        })}
      </div>
    </div>
  )
}

// ============ Step 5: Knight Order ============

export function StepOrder({ data, setData }: StepProps) {
  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl text-vellum-50">Choose your Knight Order</h2>
      <p className="text-vellum-400">
        Each order specializes in hunting a specific type of creature.
      </p>

      <div className="grid gap-3">
        {(Object.entries(KNIGHT_ORDERS) as [KnightOrder, typeof KNIGHT_ORDERS[KnightOrder]][]).map(([key, order]) => (
          <SelectionCard
            key={key}
            selected={data.knightOrder === key}
            onClick={() => setData(prev => ({ ...prev, knightOrder: key }))}
          >
            <div className="font-medium text-vellum-100">{order.name}</div>
            <div className="text-sm text-amber-400 mt-1">Focus: {order.focus}</div>
            <div className="text-sm text-vellum-400 mt-1">{order.description}</div>
          </SelectionCard>
        ))}
      </div>
    </div>
  )
}

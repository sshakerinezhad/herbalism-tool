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

// ============ Step 1: Name & Appearance ============

export function StepName({ data, setData }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">What is your knight&apos;s name?</h2>
        <input
          type="text"
          value={data.name}
          onChange={(e) => setData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter character name"
          className="w-full max-w-md px-4 py-3 bg-zinc-900 border border-zinc-600 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-600"
          autoFocus
        />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Describe your appearance (optional)</h2>
        <textarea
          value={data.appearance}
          onChange={(e) => setData(prev => ({ ...prev, appearance: e.target.value }))}
          placeholder="Physical description, distinctive features, etc."
          rows={4}
          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-600 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-600 resize-none"
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
      <h2 className="text-xl font-semibold">Choose your race</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {raceEntries.map(([key, { name }]) => (
          <button
            key={key}
            onClick={() => setData(prev => ({
              ...prev,
              race: key,
              subrace: key === 'human' ? prev.subrace : null
            }))}
            className={`p-4 rounded-lg border text-left transition-colors ${
              data.race === key
                ? 'bg-emerald-900/30 border-emerald-600 text-emerald-100'
                : 'bg-zinc-900 border-zinc-700 hover:border-zinc-500'
            }`}
          >
            <span className="font-medium">{name}</span>
          </button>
        ))}
      </div>

      {data.race === 'human' && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3">Choose your culture</h3>
          <div className="grid grid-cols-2 gap-3">
            {(Object.entries(HUMAN_CULTURES) as [HumanCulture, typeof HUMAN_CULTURES[HumanCulture]][]).map(([key, culture]) => (
              <button
                key={key}
                onClick={() => setData(prev => ({ ...prev, subrace: key }))}
                className={`p-4 rounded-lg border text-left transition-colors ${
                  data.subrace === key
                    ? 'bg-emerald-900/30 border-emerald-600'
                    : 'bg-zinc-900 border-zinc-700 hover:border-zinc-500'
                }`}
              >
                <div className="font-medium">{culture.name}</div>
                <div className="text-xs text-zinc-400 mt-1">
                  {culture.region} &bull; {culture.religion}
                </div>
              </button>
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
      <h2 className="text-xl font-semibold">Choose your background</h2>

      <div className="grid gap-4">
        {(Object.entries(BACKGROUNDS) as [Background, typeof BACKGROUNDS[Background]][]).map(([key, bg]) => (
          <button
            key={key}
            onClick={() => setData(prev => ({ ...prev, background: key }))}
            className={`p-4 rounded-lg border text-left transition-colors ${
              data.background === key
                ? 'bg-emerald-900/30 border-emerald-600'
                : 'bg-zinc-900 border-zinc-700 hover:border-zinc-500'
            }`}
          >
            <div className="font-medium text-lg">{bg.name}</div>
            <div className="text-zinc-400 text-sm mt-1">{bg.description}</div>
          </button>
        ))}
      </div>

      {data.background === 'initiate' && (
        <div className="mt-6">
          <label className="block text-lg font-medium mb-2">
            What was your previous profession?
          </label>
          <input
            type="text"
            value={data.previousProfession}
            onChange={(e) => setData(prev => ({ ...prev, previousProfession: e.target.value }))}
            placeholder="e.g., Blacksmith, Sailor, Scholar..."
            className="w-full max-w-md px-4 py-3 bg-zinc-900 border border-zinc-600 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-600"
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
      <h2 className="text-xl font-semibold">Choose your class</h2>

      <div className="grid gap-3">
        {classEntries.map(([key, cls]) => {
          const isDisabled = cls.requiresBackground && data.background !== cls.requiresBackground

          return (
            <button
              key={key}
              onClick={() => !isDisabled && setData(prev => ({ ...prev, class: key }))}
              disabled={isDisabled}
              className={`p-4 rounded-lg border text-left transition-colors ${
                data.class === key
                  ? 'bg-emerald-900/30 border-emerald-600'
                  : isDisabled
                    ? 'bg-zinc-900/50 border-zinc-800 text-zinc-500 cursor-not-allowed'
                    : 'bg-zinc-900 border-zinc-700 hover:border-zinc-500'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium text-lg">{cls.name}</span>
                <span className="text-sm text-zinc-400">
                  +{cls.proficiencies} skill proficiencies
                </span>
              </div>
              {cls.requiresBackground && (
                <div className="text-xs text-amber-400 mt-1">
                  Requires {BACKGROUNDS[cls.requiresBackground].name} background
                </div>
              )}
            </button>
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
      <h2 className="text-xl font-semibold">Choose your Knight Order</h2>
      <p className="text-zinc-400">
        Each order specializes in hunting a specific type of creature.
      </p>

      <div className="grid gap-3">
        {(Object.entries(KNIGHT_ORDERS) as [KnightOrder, typeof KNIGHT_ORDERS[KnightOrder]][]).map(([key, order]) => (
          <button
            key={key}
            onClick={() => setData(prev => ({ ...prev, knightOrder: key }))}
            className={`p-4 rounded-lg border text-left transition-colors ${
              data.knightOrder === key
                ? 'bg-emerald-900/30 border-emerald-600'
                : 'bg-zinc-900 border-zinc-700 hover:border-zinc-500'
            }`}
          >
            <div className="font-medium">{order.name}</div>
            <div className="text-sm text-amber-400 mt-1">Focus: {order.focus}</div>
            <div className="text-sm text-zinc-400 mt-1">{order.description}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

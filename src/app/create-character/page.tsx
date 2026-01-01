'use client'

/**
 * Character Creation Wizard
 * 
 * A 10-step guided wizard for creating a Knight of Belyar character.
 * Steps:
 * 1. Name & Appearance
 * 2. Race
 * 3. Background
 * 4. Class
 * 5. Knight Order
 * 6. Stats
 * 7. Skills
 * 8. Vocation/Feat
 * 9. Equipment (armor, weapons, money)
 * 10. Review & Create
 */

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { LoadingState, WarningDisplay } from '@/components/ui'
import {
  fetchSkills,
  fetchArmorSlots,
  createCharacter,
  hasCharacter,
  updateCharacterMoney,
  setCharacterArmorBatch,
} from '@/lib/db/characters'
import { initializeBaseCharacterRecipes } from '@/lib/db/characterInventory'
import {
  RACES,
  HUMAN_CULTURES,
  CLASSES,
  BACKGROUNDS,
  KNIGHT_ORDERS,
  VOCATIONS,
  ABILITY_NAMES,
  ARMOR_PRESETS,
  getAbilityModifier,
  calculateMaxHP,
} from '@/lib/constants'
import type {
  Race,
  HumanCulture,
  StartingClass,
  Background,
  KnightOrder,
  Vocation,
  CharacterStats,
  Skill,
  ArmorSlot,
  ArmorPreset,
} from '@/lib/types'

// ============ Types ============

type WizardStep = 
  | 'name'
  | 'race'
  | 'background'
  | 'class'
  | 'order'
  | 'stats'
  | 'skills'
  | 'vocation'
  | 'equipment'
  | 'review'

const STEPS: WizardStep[] = [
  'name', 'race', 'background', 'class', 'order', 
  'stats', 'skills', 'vocation', 'equipment', 'review'
]

const STEP_TITLES: Record<WizardStep, string> = {
  name: 'Name & Appearance',
  race: 'Race',
  background: 'Background',
  class: 'Class',
  order: 'Knight Order',
  stats: 'Statistics',
  skills: 'Skills',
  vocation: 'Vocation',
  equipment: 'Equipment',
  review: 'Review & Create',
}

type WizardData = {
  name: string
  appearance: string
  race: Race | null
  subrace: HumanCulture | null
  background: Background | null
  previousProfession: string
  class: StartingClass | null
  knightOrder: KnightOrder | null
  stats: CharacterStats
  skillProficiencies: Set<number>
  vocation: Vocation | null
  feat: string
  armorPreset: ArmorPreset | null
  // Starting money (rolled)
  gold: number
  silver: number
  copper: number
}

const DEFAULT_STATS: CharacterStats = {
  str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10, hon: 8
}

// ============ Main Component ============

export default function CreateCharacterPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()

  // Reference data
  const [skills, setSkills] = useState<Skill[]>([])
  const [armorSlots, setArmorSlots] = useState<ArmorSlot[]>([])
  const [loadingRef, setLoadingRef] = useState(true)

  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>('name')
  const [data, setData] = useState<WizardData>({
    name: '',
    appearance: '',
    race: null,
    subrace: null,
    background: null,
    previousProfession: '',
    class: null,
    knightOrder: null,
    stats: DEFAULT_STATS,
    skillProficiencies: new Set(),
    vocation: null,
    feat: '',
    armorPreset: null,
    gold: 0,
    silver: 0,
    copper: 0,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])

  // Character existence state
  const [hasExistingCharacter, setHasExistingCharacter] = useState<boolean | null>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [authLoading, user, router])

  // Check if user already has a character (but don't redirect)
  useEffect(() => {
    async function checkExisting() {
      if (!user) return
      const { exists } = await hasCharacter(user.id)
      setHasExistingCharacter(exists)
    }
    checkExisting()
  }, [user])

  // Load reference data
  useEffect(() => {
    async function loadReferenceData() {
      const [skillsResult, slotsResult] = await Promise.all([
        fetchSkills(),
        fetchArmorSlots(),
      ])

      if (skillsResult.data) setSkills(skillsResult.data)
      if (slotsResult.data) setArmorSlots(slotsResult.data)
      setLoadingRef(false)
    }
    loadReferenceData()
  }, [])

  // Calculate total skill proficiencies allowed
  const totalProficiencies = useMemo(() => {
    const backgroundBonus = 2 // Everyone gets 2 from background
    const classBonus = data.class ? CLASSES[data.class].proficiencies : 0
    return backgroundBonus + classBonus
  }, [data.class])

  // Navigation
  const currentStepIndex = STEPS.indexOf(currentStep)
  const canGoBack = currentStepIndex > 0
  const canGoNext = currentStepIndex < STEPS.length - 1

  function goBack() {
    if (canGoBack) {
      setCurrentStep(STEPS[currentStepIndex - 1])
    }
  }

  function goNext() {
    if (canGoNext && isStepValid(currentStep)) {
      setCurrentStep(STEPS[currentStepIndex + 1])
    }
  }

  function goToStep(step: WizardStep) {
    const targetIndex = STEPS.indexOf(step)
    // Can only go to steps we've completed or the next one
    if (targetIndex <= currentStepIndex + 1) {
      setCurrentStep(step)
    }
  }

  // Validation
  function isStepValid(step: WizardStep): boolean {
    switch (step) {
      case 'name':
        return data.name.trim().length > 0
      case 'race':
        return data.race !== null && (data.race !== 'human' || data.subrace !== null)
      case 'background':
        return data.background !== null && 
          (data.background !== 'initiate' || data.previousProfession.trim().length > 0)
      case 'class':
        // Blood Hunter requires Native-Knight
        if (data.class === 'blood_hunter' && data.background !== 'native_knight') {
          return false
        }
        return data.class !== null
      case 'order':
        return data.knightOrder !== null
      case 'stats':
        // All stats must be at least 1
        return Object.values(data.stats).every(v => v >= 1)
      case 'skills':
        return data.skillProficiencies.size === totalProficiencies
      case 'vocation':
        // Must have vocation OR feat
        return data.vocation !== null || data.feat.trim().length > 0
      case 'equipment':
        return data.armorPreset !== null
      case 'review':
        return true
      default:
        return false
    }
  }

  // Roll starting money
  function rollStartingMoney() {
    // 1d12 Gold, 4d8 Silver, 8d4 Copper
    const gold = Math.floor(Math.random() * 12) + 1
    const silver = Array.from({ length: 4 }, () => Math.floor(Math.random() * 8) + 1)
      .reduce((a, b) => a + b, 0)
    const copper = Array.from({ length: 8 }, () => Math.floor(Math.random() * 4) + 1)
      .reduce((a, b) => a + b, 0)
    
    setData(prev => ({ ...prev, gold, silver, copper }))
  }

  // Submit character
  async function handleSubmit() {
    if (!user || !isStepValid('review')) return
    
    setIsSubmitting(true)
    setSubmitError(null)

    const { data: character, error } = await createCharacter(user.id, {
      name: data.name,
      race: data.race!,
      subrace: data.race === 'human' ? data.subrace : null,
      class: data.class!,
      background: data.background!,
      previous_profession: data.background === 'initiate' ? data.previousProfession : null,
      knight_order: data.knightOrder!,
      vocation: data.vocation,
      feat: data.vocation ? null : data.feat,
      stats: data.stats,
      skill_proficiencies: Array.from(data.skillProficiencies),
      appearance: data.appearance || null,
    })

    if (error || !character) {
      setSubmitError(error || 'Failed to create character')
      setIsSubmitting(false)
      return
    }

    // Set starting money
    if (data.gold > 0 || data.silver > 0 || data.copper > 0) {
      const { error: moneyError } = await updateCharacterMoney(character.id, {
        gold: data.gold,
        silver: data.silver,
        copper: data.copper,
      })
      if (moneyError) {
        setWarnings(prev => [...prev, `Failed to set starting money: ${moneyError}`])
      }
    }

    // Set starting armor based on preset
    if (data.armorPreset && armorSlots.length > 0) {
      const { error: armorError } = await setCharacterArmorBatch(
        character.id,
        armorSlots.map(s => ({ id: s.id, slot_key: s.slot_key })),
        data.armorPreset.pieces
      )
      if (armorError) {
        setWarnings(prev => [...prev, `Failed to set starting armor: ${armorError}`])
      }
    }

    // Initialize base recipes for herbalists
    if (data.vocation === 'herbalist') {
      const { error: recipeError } = await initializeBaseCharacterRecipes(character.id)
      if (recipeError) {
        setWarnings(prev => [...prev, `Failed to initialize recipes: ${recipeError}`])
      }
    }

    // If there are warnings, show them before redirect
    if (warnings.length > 0) {
      setIsSubmitting(false)
      return
    }

    // Success! Redirect to profile to see the new character
    router.push('/profile')
  }

  // Loading states
  if (authLoading || !user) {
    return <LoadingState message="Loading..." />
  }

  if (loadingRef || hasExistingCharacter === null) {
    return <LoadingState message="Loading character options..." />
  }

  // If user already has a character, show message instead of wizard
  if (hasExistingCharacter) {
    return (
      <div className="min-h-screen bg-zinc-900 text-zinc-100 flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="text-6xl mb-4">⚔️</div>
          <h1 className="text-2xl font-bold mb-3">You Already Have a Knight</h1>
          <p className="text-zinc-400 mb-6">
            You&apos;ve already created a character. You can view and edit your knight from the profile page.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/profile"
              className="px-6 py-3 bg-emerald-700 hover:bg-emerald-600 rounded-lg font-medium transition-colors"
            >
              View My Knight
            </Link>
            <Link
              href="/"
              className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg font-medium transition-colors"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100">
      {/* Header */}
      <div className="bg-zinc-800 border-b border-zinc-700 py-4 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold">⚔️ Create Your Knight</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Step {currentStepIndex + 1} of {STEPS.length}: {STEP_TITLES[currentStep]}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-zinc-800/50 border-b border-zinc-700">
        <div className="max-w-4xl mx-auto px-6 py-3">
          <div className="flex gap-1">
            {STEPS.map((step, idx) => (
              <button
                key={step}
                onClick={() => goToStep(step)}
                disabled={idx > currentStepIndex + 1}
                className={`flex-1 h-2 rounded-full transition-colors ${
                  idx < currentStepIndex 
                    ? 'bg-emerald-600' 
                    : idx === currentStepIndex 
                      ? 'bg-emerald-500' 
                      : 'bg-zinc-700'
                } ${idx <= currentStepIndex + 1 ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed'}`}
                title={STEP_TITLES[step]}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Step Content */}
        <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6 min-h-[400px]">
          {currentStep === 'name' && (
            <StepName data={data} setData={setData} />
          )}
          {currentStep === 'race' && (
            <StepRace data={data} setData={setData} />
          )}
          {currentStep === 'background' && (
            <StepBackground data={data} setData={setData} />
          )}
          {currentStep === 'class' && (
            <StepClass data={data} setData={setData} />
          )}
          {currentStep === 'order' && (
            <StepOrder data={data} setData={setData} />
          )}
          {currentStep === 'stats' && (
            <StepStats data={data} setData={setData} />
          )}
          {currentStep === 'skills' && (
            <StepSkills 
              data={data} 
              setData={setData} 
              skills={skills}
              totalProficiencies={totalProficiencies}
            />
          )}
          {currentStep === 'vocation' && (
            <StepVocation data={data} setData={setData} />
          )}
          {currentStep === 'equipment' && (
            <StepEquipment 
              data={data} 
              setData={setData}
              rollMoney={rollStartingMoney}
            />
          )}
          {currentStep === 'review' && (
            <StepReview data={data} skills={skills} />
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button
            onClick={goBack}
            disabled={!canGoBack}
            className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            ← Back
          </button>

          {currentStep === 'review' ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !isStepValid('review')}
              className="px-8 py-3 bg-emerald-700 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
            >
              {isSubmitting ? 'Creating...' : '✓ Create Character'}
            </button>
          ) : (
            <button
              onClick={goNext}
              disabled={!isStepValid(currentStep)}
              className="px-6 py-3 bg-emerald-700 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
            >
              Next →
            </button>
          )}
        </div>

        {submitError && (
          <div className="mt-4 p-4 bg-red-900/30 border border-red-700 rounded-lg">
            <p className="text-red-300">{submitError}</p>
          </div>
        )}

        {warnings.length > 0 && (
          <div className="mt-4 space-y-2">
            {warnings.map((warning, idx) => (
              <WarningDisplay
                key={idx}
                message={warning}
                onDismiss={() => setWarnings(prev => prev.filter((_, i) => i !== idx))}
              />
            ))}
            <div className="flex justify-end mt-4">
              <button
                onClick={() => {
                  setWarnings([])
                  router.push('/profile')
                }}
                className="px-6 py-3 bg-emerald-700 hover:bg-emerald-600 rounded-lg font-medium transition-colors"
              >
                Continue to Profile →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ============ Step Components ============

type StepProps = {
  data: WizardData
  setData: React.Dispatch<React.SetStateAction<WizardData>>
}

function StepName({ data, setData }: StepProps) {
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

function StepRace({ data, setData }: StepProps) {
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
                  {culture.region} • {culture.religion}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StepBackground({ data, setData }: StepProps) {
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

function StepClass({ data, setData }: StepProps) {
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

function StepOrder({ data, setData }: StepProps) {
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

function StepStats({ data, setData }: StepProps) {
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

function StepSkills({ 
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

function StepVocation({ data, setData }: StepProps) {
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

function StepEquipment({ 
  data, 
  setData,
  rollMoney,
}: StepProps & { rollMoney: () => void }) {
  // Filter presets based on STR requirement
  const availablePresets = ARMOR_PRESETS.filter(
    preset => data.stats.str >= preset.min_str
  )

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
              🎲 Roll Starting Money (1d12 GP, 4d8 SP, 8d4 CP)
            </button>
          ) : (
            <div className="text-center">
              <div className="text-2xl font-bold">
                <span className="text-yellow-400">{data.gold} GP</span>
                {' · '}
                <span className="text-zinc-300">{data.silver} SP</span>
                {' · '}
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

function StepReview({ data, skills }: { data: WizardData; skills: Skill[] }) {
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


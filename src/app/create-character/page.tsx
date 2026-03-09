'use client'

/**
 * Character Creation Wizard
 *
 * A 10-step guided wizard for creating a Knight of Belyar character.
 * Orchestrates state, validation, navigation, and submission.
 * Step rendering is delegated to extracted components in @/components/character/wizard.
 */

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { useArmorSlots, useSkills } from '@/lib/hooks'
import { LoadingState, WarningDisplay } from '@/components/ui'
import {
  createCharacter,
  hasCharacter,
  updateCharacterMoney,
  setCharacterArmorBatch,
} from '@/lib/db/characters'
import { initializeBaseCharacterRecipes } from '@/lib/db/characterInventory'
import { CLASSES } from '@/lib/constants'
import type { CharacterStats } from '@/lib/types'
import type { WizardStep, WizardData } from '@/components/character/wizard'
import {
  StepName,
  StepRace,
  StepBackground,
  StepClass,
  StepOrder,
  StepStats,
  StepSkills,
  StepVocation,
  StepEquipment,
  StepReview,
} from '@/components/character/wizard'

// ============ Constants ============

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

const DEFAULT_STATS: CharacterStats = {
  str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10, hon: 8
}

// ============ Main Component ============

export default function CreateCharacterPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()

  // Reference data
  const { data: skills = [], isLoading: skillsLoading } = useSkills()
  const { data: armorSlots = [], isLoading: slotsLoading } = useArmorSlots()
  const loadingRef = skillsLoading || slotsLoading

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
          <div className="text-6xl mb-4">&#x2694;&#xFE0F;</div>
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
          <h1 className="text-2xl font-bold">&#x2694;&#xFE0F; Create Your Knight</h1>
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
            &larr; Back
          </button>

          {currentStep === 'review' ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !isStepValid('review')}
              className="px-8 py-3 bg-emerald-700 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
            >
              {isSubmitting ? 'Creating...' : '&#x2713; Create Character'}
            </button>
          ) : (
            <button
              onClick={goNext}
              disabled={!isStepValid(currentStep)}
              className="px-6 py-3 bg-emerald-700 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
            >
              Next &rarr;
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
                Continue to Profile &rarr;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

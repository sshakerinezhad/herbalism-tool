'use client'

/**
 * Character Creation Wizard
 *
 * A chapter-based guided wizard for creating a Knight of Belyar character.
 * Orchestrates state, validation, navigation, and submission.
 * Step rendering is delegated to extracted components in @/components/character/wizard.
 */

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { useArmorSlots, useSkills, useInvalidateQueries } from '@/lib/hooks'
import { LoadingState, WarningDisplay, GrimoireCard, Button, ErrorDisplay } from '@/components/ui'
import {
  createCharacter,
  hasCharacter,
  updateCharacterMoney,
  setCharacterArmorBatch,
} from '@/lib/db/characters'
import { initializeBaseCharacterRecipes } from '@/lib/db/characterInventory'
import { CLASSES } from '@/lib/constants'
import type { CharacterStats } from '@/lib/types'
import type { WizardStep, WizardData, WizardChapter } from '@/components/character/wizard'
import {
  ChapterProgress,
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

const CHAPTERS: WizardChapter[] = [
  { number: 'I',   title: 'Name Your Knight',      steps: ['name'] },
  { number: 'II',  title: 'Choose Your Heritage',   steps: ['race', 'background'] },
  { number: 'III', title: 'Choose Your Path',        steps: ['class', 'order'] },
  { number: 'IV',  title: 'Set Your Abilities',      steps: ['stats', 'skills'] },
  { number: 'V',   title: 'Choose Your Calling',     steps: ['vocation', 'equipment'] },
  { number: 'VI',  title: 'Review & Forge',          steps: ['review'] },
]

const DEFAULT_STATS: CharacterStats = {
  str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10, hon: 8
}

// ============ Main Component ============

export default function CreateCharacterPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { invalidateCharacter } = useInvalidateQueries()

  // Reference data
  const { data: skills = [], isLoading: skillsLoading } = useSkills()
  const { data: armorSlots = [], isLoading: slotsLoading } = useArmorSlots()
  const loadingRef = skillsLoading || slotsLoading

  // Chapter-based navigation state
  const [currentChapter, setCurrentChapter] = useState(0)
  const [currentSubStep, setCurrentSubStep] = useState(0)

  // Derive current step from chapter/substep
  const currentStep = CHAPTERS[currentChapter].steps[currentSubStep]

  // Wizard data state
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
  const isFirstStep = currentChapter === 0 && currentSubStep === 0
  const isLastStep = currentChapter === CHAPTERS.length - 1 &&
    currentSubStep === CHAPTERS[CHAPTERS.length - 1].steps.length - 1

  function goBack() {
    if (currentSubStep > 0) {
      setCurrentSubStep(currentSubStep - 1)
    } else if (currentChapter > 0) {
      const prevChapter = currentChapter - 1
      setCurrentChapter(prevChapter)
      setCurrentSubStep(CHAPTERS[prevChapter].steps.length - 1)
    }
  }

  function goNext() {
    if (!isStepValid(currentStep)) return

    const chapter = CHAPTERS[currentChapter]
    if (currentSubStep < chapter.steps.length - 1) {
      setCurrentSubStep(currentSubStep + 1)
    } else if (currentChapter < CHAPTERS.length - 1) {
      setCurrentChapter(currentChapter + 1)
      setCurrentSubStep(0)
    }
  }

  function goToStep(step: WizardStep) {
    // Find which chapter and substep this step is in
    for (let c = 0; c < CHAPTERS.length; c++) {
      const s = CHAPTERS[c].steps.indexOf(step)
      if (s !== -1) {
        // Flatten current position and target position to compare
        const currentFlat = flatIndex(currentChapter, currentSubStep)
        const targetFlat = flatIndex(c, s)
        // Can go to any step we've completed or the next one
        if (targetFlat <= currentFlat + 1) {
          setCurrentChapter(c)
          setCurrentSubStep(s)
        }
        return
      }
    }
  }

  // Helper to flatten chapter/substep into a single index for comparison
  function flatIndex(chapter: number, subStep: number): number {
    let idx = 0
    for (let c = 0; c < chapter; c++) {
      idx += CHAPTERS[c].steps.length
    }
    return idx + subStep
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
    invalidateCharacter(user.id)
    router.push('/')
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
      <div className="min-h-screen bg-grimoire-950 text-vellum-50 flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="text-6xl mb-4">&#x2694;&#xFE0F;</div>
          <h1 className="font-heading text-2xl mb-3">You Already Have a Knight</h1>
          <p className="text-vellum-400 mb-6">
            You&apos;ve already created a character. You can view and edit your knight from the profile page.
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="primary" onClick={() => router.push('/')}>
              View My Knight
            </Button>
            <Button variant="secondary" onClick={() => router.push('/')}>
              Go Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-grimoire-950 text-vellum-50">
      {/* Header with Chapter Progress */}
      <div className="max-w-4xl mx-auto px-6 pt-8">
        <ChapterProgress
          chapters={CHAPTERS}
          currentChapterIndex={currentChapter}
          currentSubStepIndex={currentSubStep}
        />
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* Step Content */}
        <GrimoireCard variant="raised" padding="lg" className="min-h-[400px]">
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
        </GrimoireCard>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="secondary"
            onClick={goBack}
            disabled={isFirstStep}
          >
            &larr; Back
          </Button>

          {currentStep === 'review' ? (
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={isSubmitting || !isStepValid('review')}
              loading={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Character'}
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={goNext}
              disabled={!isStepValid(currentStep)}
            >
              Next &rarr;
            </Button>
          )}
        </div>

        {submitError && (
          <ErrorDisplay message={submitError} className="mt-4" />
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
              <Button
                variant="primary"
                onClick={() => {
                  setWarnings([])
                  invalidateCharacter(user!.id)
                  router.push('/')
                }}
              >
                Continue to Profile &rarr;
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

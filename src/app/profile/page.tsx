'use client'

/**
 * Profile Page - Character Hub
 * 
 * The central hub for character management:
 * - If no character: Shows "Create Your Knight" CTA
 * - If character exists: Shows full character sheet with edit capability
 * 
 * Herbalism-specific settings are shown for characters with the Herbalist vocation.
 * Requires authentication.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useProfile } from '@/lib/profile'
import { useAuth } from '@/lib/auth'
import { PageLayout, LoadingState, ErrorDisplay } from '@/components/ui'
import { 
  fetchCharacter, 
  fetchCharacterSkills, 
  fetchCharacterArmor, 
  fetchArmorSlots,
  setCharacterArmor,
  removeCharacterArmor,
} from '@/lib/db/characters'
import { 
  RACES, 
  HUMAN_CULTURES, 
  CLASSES, 
  BACKGROUNDS, 
  KNIGHT_ORDERS, 
  VOCATIONS,
  ABILITY_NAMES,
  getAbilityModifier,
  calculateMaxHP,
} from '@/lib/constants'
import type { Character, Skill, ArmorSlot, ArmorType } from '@/lib/types'

// Type for character skill data
type CharacterSkillData = {
  skill: Skill
  is_proficient: boolean
  is_expertise: boolean
}

// Type for character armor data
type CharacterArmorData = {
  id: string
  slot_id: number
  armor_type: ArmorType
  custom_name: string | null
  material: string | null
  is_magical: boolean
  properties: Record<string, unknown> | null
  notes: string | null
  slot: ArmorSlot
}

// Calculate AC from armor pieces
function calculateArmorClass(
  armor: CharacterArmorData[],
  allSlots: ArmorSlot[],
  dexScore: number
): { totalAC: number; armorLevel: 'none' | 'light' | 'medium' | 'heavy' } {
  if (armor.length === 0) {
    // No armor: base AC 10 + DEX
    const dexMod = getAbilityModifier(dexScore)
    return { totalAC: 10 + dexMod, armorLevel: 'none' }
  }

  // Determine armor level (heaviest piece worn)
  let armorLevel: 'light' | 'medium' | 'heavy' = 'light'
  if (armor.some(a => a.armor_type === 'heavy')) {
    armorLevel = 'heavy'
  } else if (armor.some(a => a.armor_type === 'medium')) {
    armorLevel = 'medium'
  }

  // Calculate base AC by armor level
  let baseAC = 6 // Light base
  if (armorLevel === 'medium') baseAC = 8
  if (armorLevel === 'heavy') baseAC = 0

  // Sum armor bonuses
  let armorBonus = 0
  for (const piece of armor) {
    const slot = allSlots.find(s => s.id === piece.slot_id)
    if (!slot) continue

    // Get bonus based on armor type
    if (piece.armor_type === 'light' && slot.light_bonus) {
      armorBonus += slot.light_bonus
    } else if (piece.armor_type === 'medium' && slot.medium_bonus) {
      armorBonus += slot.medium_bonus
    } else if (piece.armor_type === 'heavy' && slot.heavy_bonus) {
      armorBonus += slot.heavy_bonus
    }
  }

  // Add DEX modifier based on armor level
  const dexMod = getAbilityModifier(dexScore)
  let dexBonus = 0
  if (armorLevel === 'light') {
    dexBonus = dexMod // Full DEX
  } else if (armorLevel === 'medium') {
    dexBonus = Math.min(2, dexMod) // Max +2
  }
  // Heavy: no DEX bonus

  return {
    totalAC: baseAC + armorBonus + dexBonus,
    armorLevel,
  }
}

export default function ProfilePage() {
  const { profile, updateProfile, isLoaded, loadError, sessionsUsedToday, longRest } = useProfile()
  const { user, isLoading: authLoading, signOut } = useAuth()
  const router = useRouter()

  // Character state
  const [character, setCharacter] = useState<Character | null>(null)
  const [characterSkills, setCharacterSkills] = useState<CharacterSkillData[]>([])
  const [characterArmor, setCharacterArmor] = useState<CharacterArmorData[]>([])
  const [allArmorSlots, setAllArmorSlots] = useState<ArmorSlot[]>([])
  const [loadingCharacter, setLoadingCharacter] = useState(true)
  const [characterError, setCharacterError] = useState<string | null>(null)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [authLoading, user, router])

  // Load character data
  useEffect(() => {
    async function loadCharacterData() {
      if (!user) return

      setLoadingCharacter(true)
      setCharacterError(null)

      // First fetch the character
      const charResult = await fetchCharacter(user.id)

      if (charResult.error) {
        setCharacterError(charResult.error)
        setLoadingCharacter(false)
        return
      }

      setCharacter(charResult.data)

      // If character exists, fetch their skills and armor
      if (charResult.data) {
        const [skillsResult, armorResult, slotsResult] = await Promise.all([
          fetchCharacterSkills(charResult.data.id),
          fetchCharacterArmor(charResult.data.id),
          fetchArmorSlots(),
        ])
        
        if (skillsResult.data) {
          setCharacterSkills(skillsResult.data)
        }
        if (armorResult.data) {
          setCharacterArmor(armorResult.data)
        }
        if (slotsResult.data) {
          setAllArmorSlots(slotsResult.data)
        }
      }

      setLoadingCharacter(false)
    }

    if (!authLoading && user) {
      loadCharacterData()
    }
  }, [authLoading, user])

  // Show loading while checking auth
  if (authLoading || !user) {
    return <LoadingState message="Loading..." />
  }

  if (loadingCharacter) {
    return <LoadingState message="Loading character..." />
  }

  // No character - show create CTA
  if (!character) {
    return (
      <PageLayout maxWidth="max-w-2xl">
        <NoCharacterView 
          user={user} 
          onSignOut={signOut} 
          error={characterError}
        />
      </PageLayout>
    )
  }

  // Has character - show character sheet
  return (
    <PageLayout maxWidth="max-w-4xl">
      <CharacterView 
        character={character}
        characterSkills={characterSkills}
        characterArmor={characterArmor}
        allArmorSlots={allArmorSlots}
        onArmorChange={setCharacterArmor}
        user={user}
        onSignOut={signOut}
        // Herbalism props (only relevant if character is an herbalist)
        profile={profile}
        updateProfile={updateProfile}
        isProfileLoaded={isLoaded}
        profileLoadError={loadError}
        sessionsUsedToday={sessionsUsedToday}
        longRest={longRest}
      />
    </PageLayout>
  )
}

// ============ No Character View ============

function NoCharacterView({ 
  user, 
  onSignOut,
  error,
}: { 
  user: { email?: string }
  onSignOut: () => void
  error: string | null
}) {
  return (
    <div className="text-center py-8">
      {/* Auth Status */}
      <div className="bg-zinc-800 rounded-lg p-4 mb-8 text-left">
        <div className="flex items-center justify-between">
          <p className="text-zinc-400 text-sm">
            Signed in as <strong className="text-zinc-200">{user.email}</strong>
          </p>
          <button
            onClick={onSignOut}
            className="text-sm text-zinc-400 hover:text-zinc-200 underline"
          >
            Sign out
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6">
          <ErrorDisplay message={error} />
        </div>
      )}

      {/* Create Character CTA */}
      <div className="bg-zinc-800 rounded-xl border-2 border-dashed border-zinc-600 p-8">
        <div className="text-6xl mb-4">⚔️</div>
        <h1 className="text-3xl font-bold mb-3">Create Your Knight</h1>
        <p className="text-zinc-400 max-w-md mx-auto mb-6">
          You haven&apos;t created a Knight of Belyar character yet. 
          Begin your journey as a monster hunter in the world of Iridia.
        </p>
        
        <Link
          href="/create-character"
          className="inline-block px-8 py-4 bg-emerald-700 hover:bg-emerald-600 rounded-lg font-semibold text-lg transition-colors"
        >
          Begin Character Creation →
        </Link>

        <div className="mt-8 pt-6 border-t border-zinc-700">
          <h3 className="text-sm font-medium text-zinc-400 mb-3">What you&apos;ll choose:</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm text-zinc-500">
            <div className="bg-zinc-900 rounded p-2">Name & Appearance</div>
            <div className="bg-zinc-900 rounded p-2">Race & Background</div>
            <div className="bg-zinc-900 rounded p-2">Class & Order</div>
            <div className="bg-zinc-900 rounded p-2">Statistics</div>
            <div className="bg-zinc-900 rounded p-2">Skill Proficiencies</div>
            <div className="bg-zinc-900 rounded p-2">Vocation or Feat</div>
          </div>
        </div>
      </div>

      {/* Still want to use herbalism features hint */}
      <p className="text-zinc-500 text-sm mt-6">
        Note: Foraging and herbalism features require a character profile.
      </p>
    </div>
  )
}

// ============ Character View ============

function CharacterView({
  character,
  characterSkills,
  characterArmor,
  allArmorSlots,
  onArmorChange,
  user,
  onSignOut,
  profile,
  updateProfile,
  isProfileLoaded,
  profileLoadError,
  sessionsUsedToday,
  longRest,
}: {
  character: Character
  characterSkills: CharacterSkillData[]
  characterArmor: CharacterArmorData[]
  allArmorSlots: ArmorSlot[]
  onArmorChange: (armor: CharacterArmorData[]) => void
  user: { email?: string }
  onSignOut: () => void
  profile: { 
    name: string
    isHerbalist: boolean
    maxForagingSessions: number
    foragingModifier: number
    brewingModifier: number 
  }
  updateProfile: (updates: Partial<typeof profile>) => void
  isProfileLoaded: boolean
  profileLoadError: string | null
  sessionsUsedToday: number
  longRest: () => void
}) {
  const [armorLocked, setArmorLocked] = useState(true)
  const [armorSaving, setArmorSaving] = useState<number | null>(null)

  const maxHP = calculateMaxHP(character.con)
  const isHerbalist = character.vocation === 'herbalist'

  // Get proficient skill names
  const proficientSkillNames = characterSkills
    .filter(cs => cs.is_proficient)
    .map(cs => cs.skill.name)

  // Calculate AC from armor
  const { totalAC, armorLevel } = calculateArmorClass(characterArmor, allArmorSlots, character.dex)

  // Armor management functions
  async function handleSetArmor(slotId: number, armorType: ArmorType | null) {
    if (armorLocked) return

    setArmorSaving(slotId)

    if (armorType === null) {
      const { error } = await removeCharacterArmor(character.id, slotId)
      if (!error) {
        onArmorChange(characterArmor.filter(a => a.slot_id !== slotId))
      }
    } else {
      const { error } = await setCharacterArmor(character.id, slotId, armorType)
      if (!error) {
        const { data } = await fetchCharacterArmor(character.id)
        if (data) {
          onArmorChange(data)
        }
      }
    }

    setArmorSaving(null)
  }

  function isArmorAvailable(slot: ArmorSlot, type: ArmorType): boolean {
    if (type === 'light') return slot.light_available
    if (type === 'medium') return slot.medium_available
    if (type === 'heavy') return slot.heavy_available
    return false
  }

  function meetsStrengthRequirement(type: ArmorType): boolean {
    if (type === 'light') return true
    if (type === 'medium') return character.str >= 13
    if (type === 'heavy') return character.str >= 15
    return true
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">{character.name}</h1>
          <p className="text-zinc-400">
            Level {character.level} {CLASSES[character.class as keyof typeof CLASSES]?.name} • {KNIGHT_ORDERS[character.knight_order as keyof typeof KNIGHT_ORDERS]?.name}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link
            href="/edit-character"
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm font-medium transition-colors"
          >
            ✏️ Edit
          </Link>
          <button
            onClick={onSignOut}
            className="text-sm text-zinc-400 hover:text-zinc-200"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Auth Info */}
      <div className="bg-emerald-900/20 border border-emerald-700/50 rounded-lg p-3 mb-6 text-sm">
        <p className="text-emerald-200">
          ✓ Signed in as <strong>{user.email}</strong>
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Identity Card */}
        <div className="bg-zinc-800 rounded-lg p-5 border border-zinc-700">
          <h2 className="text-sm font-medium text-zinc-400 mb-4 uppercase tracking-wide">Identity</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-400">Race</span>
              <span>
                {RACES[character.race as keyof typeof RACES]?.name}
                {character.subrace && ` (${HUMAN_CULTURES[character.subrace as keyof typeof HUMAN_CULTURES]?.name})`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Background</span>
              <span>{BACKGROUNDS[character.background as keyof typeof BACKGROUNDS]?.name}</span>
            </div>
            {character.previous_profession && (
              <div className="flex justify-between">
                <span className="text-zinc-400">Previous Profession</span>
                <span>{character.previous_profession}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-zinc-400">Vocation</span>
              <span className={isHerbalist ? 'text-green-400' : ''}>
                {character.vocation 
                  ? VOCATIONS[character.vocation as keyof typeof VOCATIONS]?.name 
                  : `Feat: ${character.feat}`}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-zinc-800 rounded-lg p-5 border border-zinc-700">
          <h2 className="text-sm font-medium text-zinc-400 mb-4 uppercase tracking-wide">Statistics</h2>
          <div className="grid grid-cols-4 gap-2 text-center">
            {(['str', 'dex', 'con', 'int', 'wis', 'cha', 'hon'] as const).map(stat => (
              <div key={stat} className={`rounded p-2 ${stat === 'hon' ? 'bg-amber-900/30' : 'bg-zinc-900'}`}>
                <div className="text-xs text-zinc-500 uppercase">{stat}</div>
                <div className="font-bold">{character[stat]}</div>
                <div className={`text-xs ${getAbilityModifier(character[stat]) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {getAbilityModifier(character[stat]) >= 0 ? '+' : ''}{getAbilityModifier(character[stat])}
                </div>
              </div>
            ))}
            <div className="bg-red-900/30 rounded p-2">
              <div className="text-xs text-red-400 uppercase">HP</div>
              <div className="font-bold text-red-400">{character.hp_current}/{maxHP}</div>
            </div>
          </div>
        </div>

        {/* Skills Card */}
        <div className="bg-zinc-800 rounded-lg p-5 border border-zinc-700">
          <h2 className="text-sm font-medium text-zinc-400 mb-4 uppercase tracking-wide">Skill Proficiencies</h2>
          <div className="flex flex-wrap gap-2">
            {proficientSkillNames.length > 0 ? (
              proficientSkillNames.map(name => (
                <span key={name} className="px-2 py-1 bg-emerald-900/30 border border-emerald-700 rounded text-sm">
                  {name}
                </span>
              ))
            ) : (
              <span className="text-zinc-500 text-sm">No skills recorded</span>
            )}
          </div>
        </div>

        {/* Money Card */}
        <div className="bg-zinc-800 rounded-lg p-5 border border-zinc-700">
          <h2 className="text-sm font-medium text-zinc-400 mb-4 uppercase tracking-wide">Coin Purse</h2>
          <div className="flex gap-4 text-center">
            <div className="flex-1">
              <div className="text-2xl font-bold text-amber-300">{character.platinum}</div>
              <div className="text-xs text-zinc-500">Platinum</div>
            </div>
            <div className="flex-1">
              <div className="text-2xl font-bold text-yellow-400">{character.gold}</div>
              <div className="text-xs text-zinc-500">Gold</div>
            </div>
            <div className="flex-1">
              <div className="text-2xl font-bold text-zinc-300">{character.silver}</div>
              <div className="text-xs text-zinc-500">Silver</div>
            </div>
            <div className="flex-1">
              <div className="text-2xl font-bold text-amber-600">{character.copper}</div>
              <div className="text-xs text-zinc-500">Copper</div>
            </div>
          </div>
        </div>
      </div>

      {/* Armor Section - Body Diagram Style */}
      <div className="mt-6 bg-zinc-800 rounded-lg p-5 border border-zinc-700">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">Armor</h2>
            <button
              onClick={() => setArmorLocked(!armorLocked)}
              className={`p-1.5 rounded transition-colors ${
                armorLocked 
                  ? 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600' 
                  : 'bg-amber-700/50 text-amber-300 hover:bg-amber-600/50'
              }`}
              title={armorLocked ? 'Click to unlock and edit armor' : 'Click to lock armor'}
            >
              {armorLocked ? '🔒' : '🔓'}
            </button>
            {!armorLocked && (
              <span className="text-xs text-amber-400">Editing enabled</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2 py-1 rounded ${
              armorLevel === 'heavy' ? 'bg-zinc-600 text-zinc-200' :
              armorLevel === 'medium' ? 'bg-blue-900/50 text-blue-300' :
              armorLevel === 'light' ? 'bg-emerald-900/50 text-emerald-300' :
              'bg-zinc-700 text-zinc-400'
            }`}>
              {armorLevel === 'none' ? 'Unarmored' : `${armorLevel.charAt(0).toUpperCase() + armorLevel.slice(1)} Armor`}
            </span>
            <div className="bg-blue-900/30 border border-blue-700 rounded px-3 py-1">
              <span className="text-blue-300 font-bold">AC {totalAC}</span>
            </div>
          </div>
        </div>

        {/* Body Diagram Layout */}
        <div className="grid grid-cols-12 gap-2">
          {/* Row 1: Head */}
          <div className="col-span-12 flex justify-center">
            <ArmorSlotCard 
              slot={allArmorSlots.find(s => s.slot_key === 'head')}
              armor={characterArmor}
              locked={armorLocked}
              saving={armorSaving}
              onSetArmor={handleSetArmor}
              isArmorAvailable={isArmorAvailable}
              meetsStrengthRequirement={meetsStrengthRequirement}
            />
          </div>

          {/* Row 2: Neck */}
          <div className="col-span-12 flex justify-center">
            <ArmorSlotCard 
              slot={allArmorSlots.find(s => s.slot_key === 'neck')}
              armor={characterArmor}
              locked={armorLocked}
              saving={armorSaving}
              onSetArmor={handleSetArmor}
              isArmorAvailable={isArmorAvailable}
              meetsStrengthRequirement={meetsStrengthRequirement}
            />
          </div>

          {/* Row 3: Shoulders + Chest */}
          <div className="col-span-4 flex justify-end">
            <ArmorSlotCard 
              slot={allArmorSlots.find(s => s.slot_key === 'left_shoulder')}
              armor={characterArmor}
              locked={armorLocked}
              saving={armorSaving}
              onSetArmor={handleSetArmor}
              isArmorAvailable={isArmorAvailable}
              meetsStrengthRequirement={meetsStrengthRequirement}
            />
          </div>
          <div className="col-span-4 flex justify-center">
            <ArmorSlotCard 
              slot={allArmorSlots.find(s => s.slot_key === 'chest')}
              armor={characterArmor}
              locked={armorLocked}
              saving={armorSaving}
              onSetArmor={handleSetArmor}
              isArmorAvailable={isArmorAvailable}
              meetsStrengthRequirement={meetsStrengthRequirement}
              large
            />
          </div>
          <div className="col-span-4 flex justify-start">
            <ArmorSlotCard 
              slot={allArmorSlots.find(s => s.slot_key === 'right_shoulder')}
              armor={characterArmor}
              locked={armorLocked}
              saving={armorSaving}
              onSetArmor={handleSetArmor}
              isArmorAvailable={isArmorAvailable}
              meetsStrengthRequirement={meetsStrengthRequirement}
            />
          </div>

          {/* Row 4: Hands */}
          <div className="col-span-6 flex justify-end pr-4">
            <ArmorSlotCard 
              slot={allArmorSlots.find(s => s.slot_key === 'left_hand')}
              armor={characterArmor}
              locked={armorLocked}
              saving={armorSaving}
              onSetArmor={handleSetArmor}
              isArmorAvailable={isArmorAvailable}
              meetsStrengthRequirement={meetsStrengthRequirement}
            />
          </div>
          <div className="col-span-6 flex justify-start pl-4">
            <ArmorSlotCard 
              slot={allArmorSlots.find(s => s.slot_key === 'right_hand')}
              armor={characterArmor}
              locked={armorLocked}
              saving={armorSaving}
              onSetArmor={handleSetArmor}
              isArmorAvailable={isArmorAvailable}
              meetsStrengthRequirement={meetsStrengthRequirement}
            />
          </div>

          {/* Row 5: Groin */}
          <div className="col-span-12 flex justify-center">
            <ArmorSlotCard 
              slot={allArmorSlots.find(s => s.slot_key === 'groin')}
              armor={characterArmor}
              locked={armorLocked}
              saving={armorSaving}
              onSetArmor={handleSetArmor}
              isArmorAvailable={isArmorAvailable}
              meetsStrengthRequirement={meetsStrengthRequirement}
            />
          </div>

          {/* Row 6: Knees */}
          <div className="col-span-6 flex justify-end pr-4">
            <ArmorSlotCard 
              slot={allArmorSlots.find(s => s.slot_key === 'left_knee')}
              armor={characterArmor}
              locked={armorLocked}
              saving={armorSaving}
              onSetArmor={handleSetArmor}
              isArmorAvailable={isArmorAvailable}
              meetsStrengthRequirement={meetsStrengthRequirement}
            />
          </div>
          <div className="col-span-6 flex justify-start pl-4">
            <ArmorSlotCard 
              slot={allArmorSlots.find(s => s.slot_key === 'right_knee')}
              armor={characterArmor}
              locked={armorLocked}
              saving={armorSaving}
              onSetArmor={handleSetArmor}
              isArmorAvailable={isArmorAvailable}
              meetsStrengthRequirement={meetsStrengthRequirement}
            />
          </div>

          {/* Row 7: Feet */}
          <div className="col-span-6 flex justify-end pr-4">
            <ArmorSlotCard 
              slot={allArmorSlots.find(s => s.slot_key === 'left_foot')}
              armor={characterArmor}
              locked={armorLocked}
              saving={armorSaving}
              onSetArmor={handleSetArmor}
              isArmorAvailable={isArmorAvailable}
              meetsStrengthRequirement={meetsStrengthRequirement}
            />
          </div>
          <div className="col-span-6 flex justify-start pl-4">
            <ArmorSlotCard 
              slot={allArmorSlots.find(s => s.slot_key === 'right_foot')}
              armor={characterArmor}
              locked={armorLocked}
              saving={armorSaving}
              onSetArmor={handleSetArmor}
              isArmorAvailable={isArmorAvailable}
              meetsStrengthRequirement={meetsStrengthRequirement}
            />
          </div>
        </div>

        {!armorLocked && (
          <p className="text-xs text-zinc-500 mt-4 text-center">
            Click on a slot to change armor. Changes save immediately.
          </p>
        )}
      </div>

      {/* Appearance */}
      {character.appearance && (
        <div className="mt-6 bg-zinc-800 rounded-lg p-5 border border-zinc-700">
          <h2 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wide">Appearance</h2>
          <p className="text-zinc-300">{character.appearance}</p>
        </div>
      )}

      {/* Herbalist Section - Only show for herbalists */}
      {isHerbalist && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4 text-green-400">🌿 Herbalism Settings</h2>
          
          {profileLoadError && (
            <div className="mb-4">
              <ErrorDisplay message={`${profileLoadError}. Using local defaults.`} />
            </div>
          )}

          <div className="bg-zinc-800 rounded-lg p-5 border border-zinc-700 space-y-4">
            {/* Max Foraging Sessions */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Max Foraging Sessions Per Day
              </label>
              <input
                type="number"
                min="1"
                value={profile.maxForagingSessions}
                onChange={(e) => updateProfile({ maxForagingSessions: Math.max(1, parseInt(e.target.value) || 1) })}
                className="w-24 px-4 py-2 bg-zinc-900 border border-zinc-600 rounded-lg text-zinc-100 focus:outline-none focus:border-emerald-600"
              />
              <p className="text-zinc-500 text-xs mt-1">
                Equal to INT modifier (minimum 1). Resets on long rest.
              </p>
            </div>

            {/* Foraging Modifier */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Foraging Modifier
              </label>
              <input
                type="number"
                value={profile.foragingModifier}
                onChange={(e) => updateProfile({ foragingModifier: parseInt(e.target.value) || 0 })}
                className="w-24 px-4 py-2 bg-zinc-900 border border-zinc-600 rounded-lg text-zinc-100 focus:outline-none focus:border-emerald-600"
              />
              <p className="text-zinc-500 text-xs mt-1">
                Nature or Survival bonus (whichever is higher)
              </p>
            </div>

            {/* Brewing Modifier */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Brewing Modifier
              </label>
              <input
                type="number"
                value={profile.brewingModifier}
                onChange={(e) => updateProfile({ brewingModifier: parseInt(e.target.value) || 0 })}
                className="w-24 px-4 py-2 bg-zinc-900 border border-zinc-600 rounded-lg text-zinc-100 focus:outline-none focus:border-emerald-600"
              />
              <p className="text-zinc-500 text-xs mt-1">
                Herbalism check bonus for brewing
              </p>
            </div>

            {/* Long Rest */}
            {sessionsUsedToday > 0 && (
              <div className="pt-4 border-t border-zinc-700">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">
                    Sessions used today: <strong>{sessionsUsedToday}</strong>
                  </span>
                  <button
                    onClick={longRest}
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded-lg text-sm font-medium transition-colors"
                  >
                    🌙 Long Rest
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Non-herbalist foraging note */}
      {!isHerbalist && (
        <div className="mt-8 bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
          <p className="text-zinc-400 text-sm">
            💡 <strong>Tip:</strong> While anyone can forage for herbs, only characters with the Herbalist vocation can brew elixirs and bombs.
            Your foraging settings can be configured in the Forage page.
          </p>
        </div>
      )}
    </div>
  )
}

// ============ Armor Slot Card Component ============

function ArmorSlotCard({
  slot,
  armor,
  locked,
  saving,
  onSetArmor,
  isArmorAvailable,
  meetsStrengthRequirement,
  large = false,
}: {
  slot: ArmorSlot | undefined
  armor: CharacterArmorData[]
  locked: boolean
  saving: number | null
  onSetArmor: (slotId: number, armorType: ArmorType | null) => void
  isArmorAvailable: (slot: ArmorSlot, type: ArmorType) => boolean
  meetsStrengthRequirement: (type: ArmorType) => boolean
  large?: boolean
}) {
  if (!slot) return null

  const piece = armor.find(a => a.slot_id === slot.id)
  const isSaving = saving === slot.id

  const pieceName = piece ? (
    piece.custom_name || (
      piece.armor_type === 'light' ? slot.light_piece_name :
      piece.armor_type === 'medium' ? slot.medium_piece_name :
      slot.heavy_piece_name
    ) || piece.armor_type
  ) : null

  const bonus = piece ? (
    piece.armor_type === 'light' ? slot.light_bonus :
    piece.armor_type === 'medium' ? slot.medium_bonus :
    slot.heavy_bonus
  ) : null

  const baseClasses = `rounded-lg border transition-all ${large ? 'p-3 min-w-[140px]' : 'p-2 min-w-[120px]'}`
  
  const stateClasses = piece 
    ? piece.armor_type === 'heavy' 
      ? 'bg-zinc-700/50 border-zinc-600' 
      : piece.armor_type === 'medium'
        ? 'bg-blue-900/20 border-blue-700/50'
        : 'bg-emerald-900/20 border-emerald-700/50'
    : 'bg-zinc-900/50 border-zinc-700 border-dashed'

  const magicalClasses = piece?.is_magical ? 'ring-1 ring-purple-500/50' : ''

  // If locked, show read-only view
  if (locked) {
    return (
      <div className={`${baseClasses} ${stateClasses} ${magicalClasses}`}>
        <div className="text-xs text-zinc-400 mb-1">{slot.display_name}</div>
        {piece ? (
          <>
            <div className={`text-sm font-medium flex items-center gap-1 ${large ? '' : 'text-xs'}`}>
              {piece.is_magical && <span className="text-purple-400">✦</span>}
              {pieceName}
            </div>
            {bonus && <div className="text-xs text-zinc-500">+{bonus} AC</div>}
          </>
        ) : (
          <div className="text-zinc-600 text-sm">Empty</div>
        )}
      </div>
    )
  }

  // Unlocked - show editable dropdown
  return (
    <div className={`${baseClasses} ${stateClasses} ${magicalClasses}`}>
      <div className="text-xs text-zinc-400 mb-1">{slot.display_name}</div>
      <select
        value={piece?.armor_type || ''}
        onChange={(e) => onSetArmor(slot.id, e.target.value ? e.target.value as ArmorType : null)}
        disabled={isSaving}
        className="w-full px-1.5 py-1 bg-zinc-800 border border-zinc-600 rounded text-xs focus:outline-none focus:border-amber-500 disabled:opacity-50"
      >
        <option value="">None</option>
        {isArmorAvailable(slot, 'light') && (
          <option value="light" disabled={!meetsStrengthRequirement('light')}>
            {slot.light_piece_name || 'Light'} (+{slot.light_bonus})
          </option>
        )}
        {isArmorAvailable(slot, 'medium') && (
          <option value="medium" disabled={!meetsStrengthRequirement('medium')}>
            {slot.medium_piece_name || 'Medium'} (+{slot.medium_bonus})
          </option>
        )}
        {isArmorAvailable(slot, 'heavy') && (
          <option value="heavy" disabled={!meetsStrengthRequirement('heavy')}>
            {slot.heavy_piece_name || 'Heavy'} (+{slot.heavy_bonus})
          </option>
        )}
      </select>
      {isSaving && <div className="text-xs text-amber-400 mt-1">Saving...</div>}
    </div>
  )
}

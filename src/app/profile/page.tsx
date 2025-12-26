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
import { 
  useCharacter, 
  useCharacterSkills, 
  useCharacterArmor, 
  useArmorSlots,
  useCharacterWeaponSlots,
  useCharacterQuickSlots,
  useCharacterWeapons,
  useCharacterItems,
  useCharacterBrewedItems,
  useInvalidateQueries,
  CharacterSkillData,
  CharacterArmorData,
} from '@/lib/hooks'
import { PageLayout, LoadingState, ErrorDisplay, ProfileSkeleton } from '@/components/ui'
import { 
  setCharacterArmor,
  removeCharacterArmor,
} from '@/lib/db/characters'
import { CoinPurse, WeaponSlots, QuickSlots } from '@/components/character'
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
import type { Character, ArmorSlot, ArmorType, BrewedItem } from '@/lib/types'
import { ArmorDiagram } from '@/components/ArmorDiagram'

// Types imported from @/lib/hooks:
// CharacterSkillData, CharacterArmorData

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
  const { invalidateCharacterArmor, invalidateCharacter, invalidateWeaponSlots, invalidateQuickSlots } = useInvalidateQueries()

  // React Query handles character data fetching and caching
  const { 
    data: character, 
    isLoading: characterLoading, 
    error: characterError 
  } = useCharacter(user?.id ?? null)
  
  const { 
    data: characterSkills = [], 
    isLoading: skillsLoading 
  } = useCharacterSkills(character?.id ?? null)
  
  const { 
    data: characterArmor = [], 
    isLoading: armorLoading 
  } = useCharacterArmor(character?.id ?? null)
  
  const { 
    data: allArmorSlots = [], 
    isLoading: slotsLoading 
  } = useArmorSlots()
  
  const { 
    data: weaponSlots = [], 
    isLoading: weaponSlotsLoading 
  } = useCharacterWeaponSlots(character?.id ?? null)
  
  const { 
    data: quickSlots = [], 
    isLoading: quickSlotsLoading 
  } = useCharacterQuickSlots(character?.id ?? null)
  
  const { 
    data: weapons = [], 
    isLoading: weaponsLoading 
  } = useCharacterWeapons(character?.id ?? null)
  
  const { 
    data: items = [], 
    isLoading: itemsLoading 
  } = useCharacterItems(character?.id ?? null)
  
  // Brewed items (elixirs, bombs) - for quick slots
  const { 
    data: brewedItems = [], 
    isLoading: brewedLoading 
  } = useCharacterBrewedItems(character?.id ?? null)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [authLoading, user, router])
  
  // Derived loading state
  const loadingCharacter = characterLoading || (character && (
    skillsLoading || armorLoading || slotsLoading || 
    weaponSlotsLoading || quickSlotsLoading || weaponsLoading || itemsLoading || brewedLoading
  ))

  // Show loading while checking auth
  if (authLoading || !user) {
    return <LoadingState message="Loading..." />
  }

  if (loadingCharacter) {
    return <ProfileSkeleton />
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
        weaponSlots={weaponSlots}
        quickSlots={quickSlots}
        weapons={weapons}
        items={items}
        brewedItems={brewedItems}
        onArmorChanged={() => character && invalidateCharacterArmor(character.id)}
        onMoneyChanged={() => user && invalidateCharacter(user.id)}
        onWeaponSlotsChanged={() => character && invalidateWeaponSlots(character.id)}
        onQuickSlotsChanged={() => character && invalidateQuickSlots(character.id)}
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
  weaponSlots,
  quickSlots,
  weapons,
  items,
  brewedItems,
  onArmorChanged,
  onMoneyChanged,
  onWeaponSlotsChanged,
  onQuickSlotsChanged,
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
  weaponSlots: import('@/lib/types').CharacterWeaponSlot[]
  quickSlots: import('@/lib/types').CharacterQuickSlot[]
  weapons: import('@/lib/types').CharacterWeapon[]
  items: import('@/lib/types').CharacterItem[]
  brewedItems: import('@/lib/types').CharacterBrewedItem[]
  onArmorChanged: () => void
  onMoneyChanged: () => void
  onWeaponSlotsChanged: () => void
  onQuickSlotsChanged: () => void
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

  const maxHP = calculateMaxHP(character.con)
  const isHerbalist = character.vocation === 'herbalist'

  // Get proficient skill names
  const proficientSkillNames = characterSkills
    .filter(cs => cs.is_proficient)
    .map(cs => cs.skill.name)

  // Calculate AC from armor
  const { totalAC, armorLevel } = calculateArmorClass(characterArmor, allArmorSlots, character.dex)

  // Armor management - called by ArmorDiagram
  async function handleSetArmor(slotId: number, armorType: ArmorType | null) {
    if (armorType === null) {
      const { error } = await removeCharacterArmor(character.id, slotId)
      if (!error) {
        onArmorChanged() // Invalidate cache to refetch armor
      }
    } else {
      const { error } = await setCharacterArmor(character.id, slotId, armorType)
      if (!error) {
        onArmorChanged() // Invalidate cache to refetch armor
      }
    }
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
          <CoinPurse
            characterId={character.id}
            coins={{
              platinum: character.platinum,
              gold: character.gold,
              silver: character.silver,
              copper: character.copper,
            }}
            onUpdate={onMoneyChanged}
          />
        </div>
      </div>

      {/* Armor Diagram */}
      <div className="mt-6">
        <ArmorDiagram
          armor={characterArmor}
          armorSlots={allArmorSlots}
          locked={armorLocked}
          onToggleLock={() => setArmorLocked(!armorLocked)}
          onSetArmor={handleSetArmor}
          totalAC={totalAC}
          armorLevel={armorLevel}
          strengthScore={character.str}
        />
      </div>

      {/* Weapon Slots */}
      <div className="mt-6">
        <WeaponSlots
          characterId={character.id}
          weaponSlots={weaponSlots}
          weapons={weapons}
          onUpdate={onWeaponSlotsChanged}
        />
      </div>

      {/* Quick Slots */}
      <div className="mt-6">
        <QuickSlots
          characterId={character.id}
          quickSlots={quickSlots}
          items={items}
          brewedItems={brewedItems}
          onUpdate={onQuickSlotsChanged}
        />
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

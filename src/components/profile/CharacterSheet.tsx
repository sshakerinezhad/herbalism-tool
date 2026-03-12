'use client'

/**
 * CharacterSheet - Full character sheet display
 *
 * Renders the complete character view: banner, equipment, skills,
 * coins, quick slots, appearance, and herbalism sections.
 *
 * Owns all sub-data fetching (skills, armor, weapons, items, etc.)
 * but receives the Character object as a prop from the parent.
 */

import { useState } from 'react'
import { useProfile } from '@/lib/profile'
import {
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
import { ProfileSkeleton, ErrorDisplay, GrimoireCard, SectionHeader } from '@/components/ui'
import {
  setCharacterArmor,
  removeCharacterArmor,
} from '@/lib/db/characters'
import {
  CoinPurse,
  QuickSlots,
  CharacterBanner,
  EquipmentWeaponsPanel,
} from '@/components/character'
import {
  getAbilityModifier,
  calculateMaxHP,
} from '@/lib/constants'
import { computeMaxForagingSessions, computeForagingModifier, computeBrewingModifier } from '@/lib/characterUtils'
import type { Character, ArmorSlot, ArmorType } from '@/lib/types'

// ============ Types ============

type CharacterSheetProps = {
  character: Character
  /** User email for display in the banner */
  userEmail?: string
}

// ============ Helpers ============

/** Calculate AC from equipped armor pieces */
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

// ============ Component ============

export function CharacterSheet({ character, userEmail }: CharacterSheetProps) {
  const { profile, isLoaded: isProfileLoaded, loadError: profileLoadError, sessionsUsedToday, longRest } = useProfile()
  const { invalidateCharacterArmor, invalidateCharacter, invalidateWeaponSlots, invalidateQuickSlots } = useInvalidateQueries()

  // Sub-data queries (character is guaranteed to exist by parent)
  const {
    data: characterSkills = [],
    isLoading: skillsLoading,
  } = useCharacterSkills(character.id)

  const {
    data: characterArmor = [],
    isLoading: armorLoading,
  } = useCharacterArmor(character.id)

  const {
    data: allArmorSlots = [],
    isLoading: slotsLoading,
  } = useArmorSlots()

  const {
    data: weaponSlots = [],
    isLoading: weaponSlotsLoading,
  } = useCharacterWeaponSlots(character.id)

  const {
    data: quickSlots = [],
    isLoading: quickSlotsLoading,
  } = useCharacterQuickSlots(character.id)

  const {
    data: weapons = [],
    isLoading: weaponsLoading,
  } = useCharacterWeapons(character.id)

  const {
    data: items = [],
    isLoading: itemsLoading,
  } = useCharacterItems(character.id)

  const {
    data: brewedItems = [],
    isLoading: brewedLoading,
  } = useCharacterBrewedItems(character.id)

  // Show skeleton while sub-data loads
  const subDataLoading = skillsLoading || armorLoading || slotsLoading ||
    weaponSlotsLoading || quickSlotsLoading || weaponsLoading || itemsLoading || brewedLoading

  if (subDataLoading) {
    return <ProfileSkeleton />
  }

  return (
    <CharacterSheetContent
      character={character}
      userEmail={userEmail}
      characterSkills={characterSkills}
      characterArmor={characterArmor}
      allArmorSlots={allArmorSlots}
      weaponSlots={weaponSlots}
      quickSlots={quickSlots}
      weapons={weapons}
      items={items}
      brewedItems={brewedItems}
      onArmorChanged={() => invalidateCharacterArmor(character.id)}
      onMoneyChanged={() => invalidateCharacter(character.user_id)}
      onWeaponSlotsChanged={() => invalidateWeaponSlots(character.id)}
      onQuickSlotsChanged={() => invalidateQuickSlots(character.id)}
      profile={profile}
      isProfileLoaded={isProfileLoaded}
      profileLoadError={profileLoadError}
      sessionsUsedToday={sessionsUsedToday}
      longRest={longRest}
    />
  )
}

// ============ Inner Content (no loading states) ============

function CharacterSheetContent({
  character,
  userEmail,
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
  profile,
  isProfileLoaded,
  profileLoadError,
  sessionsUsedToday,
  longRest,
}: {
  character: Character
  userEmail?: string
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
  profile: { name: string }
  isProfileLoaded: boolean
  profileLoadError: string | null
  sessionsUsedToday: number
  longRest: () => void
}) {
  const maxHP = calculateMaxHP(character.con)
  const isHerbalist = character.vocation === 'herbalist'
  const [armorError, setArmorError] = useState<string | null>(null)

  // Get proficient skill names
  const proficientSkillNames = characterSkills
    .filter(cs => cs.is_proficient)
    .map(cs => cs.skill.name)

  // Calculate AC from armor
  const { totalAC, armorLevel } = calculateArmorClass(characterArmor, allArmorSlots, character.dex)

  // Armor management - called by ArmorDiagram
  async function handleSetArmor(slotId: number, armorType: ArmorType | null) {
    setArmorError(null)
    if (armorType === null) {
      const { error } = await removeCharacterArmor(character.id, slotId)
      if (error) {
        setArmorError(`Failed to remove armor: ${error}`)
      } else {
        onArmorChanged()
      }
    } else {
      const { error } = await setCharacterArmor(character.id, slotId, armorType)
      if (error) {
        setArmorError(`Failed to set armor: ${error}`)
      } else {
        onArmorChanged()
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Character Banner (includes vitals and ability scores) */}
      <CharacterBanner
        character={character}
        userEmail={userEmail}
        currentHP={character.hp_current}
        maxHP={maxHP}
        armorClass={totalAC}
        armorLevel={armorLevel}
      />

      {/* Equipment Panel (Armor + Weapons) */}
      <EquipmentWeaponsPanel
        characterArmor={characterArmor}
        armorSlots={allArmorSlots}
        totalAC={totalAC}
        armorLevel={armorLevel}
        strengthScore={character.str}
        onSetArmor={handleSetArmor}
        characterId={character.id}
        weaponSlots={weaponSlots}
        weapons={weapons}
        onWeaponSlotsChanged={onWeaponSlotsChanged}
      />

      {/* Armor Error Display */}
      {armorError && (
        <ErrorDisplay message={armorError} />
      )}

      {/* Skills + Coin Purse row */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Skills Card */}
        <GrimoireCard>
          <SectionHeader>Skill Proficiencies</SectionHeader>
          <div className="flex flex-wrap gap-2">
            {proficientSkillNames.length > 0 ? (
              proficientSkillNames.map(name => (
                <span key={name} className="px-2 py-1 bg-emerald-900/30 border border-emerald-700/50 text-emerald-400 rounded text-sm">
                  {name}
                </span>
              ))
            ) : (
              <span className="text-vellum-300 text-sm">No skills recorded</span>
            )}
          </div>
        </GrimoireCard>

        {/* Money Card */}
        <GrimoireCard>
          <SectionHeader>Coin Purse</SectionHeader>
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
        </GrimoireCard>
      </div>

      {/* Quick Slots */}
      <QuickSlots
        characterId={character.id}
        quickSlots={quickSlots}
        items={items}
        brewedItems={brewedItems}
        onUpdate={onQuickSlotsChanged}
      />

      {/* Appearance */}
      {character.appearance && (
        <GrimoireCard>
          <SectionHeader>Appearance</SectionHeader>
          <p className="text-vellum-200 italic">{character.appearance}</p>
        </GrimoireCard>
      )}

      {/* Herbalist Section - Only show for herbalists */}
      {isHerbalist && (
        <div>
          <h2 className="text-lg font-semibold mb-4 text-emerald-400">🌿 Herbalism Settings</h2>

          {profileLoadError && (
            <div className="mb-4">
              <ErrorDisplay message={`${profileLoadError}. Using local defaults.`} />
            </div>
          )}

          <GrimoireCard className="space-y-4">
            {/* Max Foraging Sessions (computed) */}
            <div className="flex justify-between items-center">
              <span className="text-vellum-300">Max Foraging Sessions</span>
              <span className="text-vellum-100 font-medium">{computeMaxForagingSessions(character.int)}</span>
            </div>
            <p className="text-vellum-400 text-xs -mt-2">Based on INT modifier (minimum 1)</p>

            {/* Foraging Modifier (computed) */}
            <div className="flex justify-between items-center">
              <span className="text-vellum-300">Foraging Modifier</span>
              <span className="text-vellum-100 font-medium">
                {(() => {
                  const natureSkill = characterSkills.find(s => s.skill.name.toLowerCase() === 'nature') ?? null
                  const mod = computeForagingModifier(character.int, character.level, natureSkill)
                  return mod >= 0 ? `+${mod}` : mod
                })()}
              </span>
            </div>
            <p className="text-vellum-400 text-xs -mt-2">INT + Nature proficiency (if any)</p>

            {/* Brewing Modifier (computed) */}
            <div className="flex justify-between items-center">
              <span className="text-vellum-300">Brewing Modifier</span>
              <span className="text-vellum-100 font-medium">
                {(() => {
                  const mod = computeBrewingModifier(character.int, character.level, true)
                  return mod >= 0 ? `+${mod}` : mod
                })()}
              </span>
            </div>
            <p className="text-vellum-400 text-xs -mt-2">INT + proficiency bonus (Herbalist vocation)</p>

            {/* Long Rest */}
            {sessionsUsedToday > 0 && (
              <div className="pt-4 border-t border-sepia-700/30">
                <div className="flex items-center justify-between">
                  <span className="text-vellum-300">
                    Sessions used today: <strong className="text-vellum-100">{sessionsUsedToday}</strong>
                  </span>
                  <button
                    onClick={longRest}
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded-lg text-sm font-medium text-vellum-50 transition-colors"
                  >
                    Long Rest
                  </button>
                </div>
              </div>
            )}
          </GrimoireCard>
        </div>
      )}

      {/* Non-herbalist foraging note */}
      {!isHerbalist && (
        <GrimoireCard className="mt-8">
          <p className="text-vellum-300 text-sm">
            <strong className="text-vellum-100">Tip:</strong> While anyone can forage for herbs, only characters with the Herbalist vocation can brew elixirs and bombs.
            Your foraging settings can be configured in the Forage page.
          </p>
        </GrimoireCard>
      )}
    </div>
  )
}

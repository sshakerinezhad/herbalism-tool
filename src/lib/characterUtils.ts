import { getAbilityModifier, getProficiencyBonus } from './constants'

export function computeSkillModifier(
  abilityScore: number,
  level: number,
  isProficient: boolean,
  isExpertise: boolean
): number {
  let mod = getAbilityModifier(abilityScore)
  if (isProficient) mod += getProficiencyBonus(level)
  if (isExpertise) mod += getProficiencyBonus(level)
  return mod
}

export function computeForagingModifier(
  intScore: number,
  level: number,
  natureSkill: { is_proficient: boolean; is_expertise: boolean } | null
): number {
  if (!natureSkill) return getAbilityModifier(intScore)
  return computeSkillModifier(intScore, level, natureSkill.is_proficient, natureSkill.is_expertise)
}

export function computeBrewingModifier(
  intScore: number,
  level: number,
  isHerbalist: boolean
): number {
  const intMod = getAbilityModifier(intScore)
  return isHerbalist ? intMod + getProficiencyBonus(level) : intMod
}

export function computeMaxForagingSessions(intScore: number): number {
  return Math.max(1, getAbilityModifier(intScore))
}

/**
 * Weapon make-tier & material modifier helpers (Wave 2C).
 *
 * Pure, no DB. The app DISPLAYS what a weapon contributes (attack/damage bonuses,
 * effective damage die, make-tier flags) — it never resolves attack rolls. Dice are
 * live at the table for combat.
 */

import type { CharacterWeapon, Material } from './types'

// ============ Properties ============

/** Canonical weapon-property taxonomy (Elros guide). Drives checkboxes + cards. */
export const WEAPON_PROPERTIES = [
  'Light',
  'Finesse',
  'Heavy',
  'Reach',
  'Two-Handed',
  'Versatile',
  'Ammunition',
  'Loading',
  'Thrown',
  'Special',
] as const

export type WeaponProperty = (typeof WEAPON_PROPERTIES)[number]

/** Properties that carry extra data when checked. */
export const PROPERTY_HAS_ALT_DIE: WeaponProperty = 'Versatile'
export const PROPERTY_HAS_RANGE: WeaponProperty = 'Thrown'

// ============ Make tiers ============

export const MAKE_TIERS = [
  'master_forged',
  'artisan_forged',
  'standard_forged',
  'dusted',
  'busted',
  'broke',
] as const

export type MakeTier = (typeof MAKE_TIERS)[number]

type MakeTierInfo = { label: string; note: string }

export const MAKE_TIER_INFO: Record<MakeTier, MakeTierInfo> = {
  master_forged: { label: 'Master Forged', note: '+2 to attack & damage, upgraded damage die' },
  artisan_forged: { label: 'Artisan Forged', note: 'Upgraded damage die' },
  standard_forged: { label: 'Standard Forged', note: 'Normal use' },
  dusted: { label: 'Dusted', note: 'No proficiency bonus to attack rolls' },
  busted: { label: 'Busted', note: 'No positive bonuses to attack or damage' },
  broke: { label: 'Broke', note: 'No positive bonuses; disadvantage on attacks' },
}

export function makeTierLabel(tier: string): string {
  return (MAKE_TIER_INFO[tier as MakeTier] ?? MAKE_TIER_INFO.standard_forged).label
}

// ============ Damage-die stepping ============

/** Single-step damage-die progression (D&D-style). */
const DIE_STEPS: string[] = ['1d4', '1d6', '1d8', '1d10', '1d12', '2d6']

/** Step a damage die up one rung. Unknown/maxed dice are returned unchanged. */
export function stepDamageDie(dice: string | null): string | null {
  if (!dice) return dice
  const normalized = dice.trim().toLowerCase()
  const idx = DIE_STEPS.indexOf(normalized)
  if (idx === -1 || idx === DIE_STEPS.length - 1) return dice
  return DIE_STEPS[idx + 1]
}

// ============ Computed modifiers ============

export type WeaponModifiers = {
  attackBonus: number
  damageBonus: number
  effectiveDamageDice: string | null
  makeTier: MakeTier
  makeLabel: string
  makeNote: string
  noProficiency: boolean
  disadvantageOnAttack: boolean
}

/**
 * Compute the displayed attack/damage contribution of a weapon from its make-tier
 * and (optional) material. Character-level pieces (ability mod, proficiency bonus)
 * are layered on at display time — this covers only the weapon's intrinsic effects.
 */
export function computeWeaponModifiers(
  weapon: Pick<CharacterWeapon, 'make_tier' | 'damage_dice'>,
  material?: Material | null
): WeaponModifiers {
  const tier: MakeTier = (MAKE_TIERS as readonly string[]).includes(weapon.make_tier)
    ? (weapon.make_tier as MakeTier)
    : 'standard_forged'

  let attackBonus = material?.attack_bonus ?? 0
  let damageBonus = material?.damage_bonus ?? 0
  let effectiveDamageDice = weapon.damage_dice
  let noProficiency = false
  let disadvantageOnAttack = false

  switch (tier) {
    case 'master_forged':
      attackBonus += 2
      damageBonus += 2
      effectiveDamageDice = stepDamageDie(effectiveDamageDice)
      break
    case 'artisan_forged':
      effectiveDamageDice = stepDamageDie(effectiveDamageDice)
      break
    case 'standard_forged':
      break
    case 'dusted':
      noProficiency = true
      break
    case 'busted':
      attackBonus = Math.min(attackBonus, 0)
      damageBonus = Math.min(damageBonus, 0)
      break
    case 'broke':
      attackBonus = Math.min(attackBonus, 0)
      damageBonus = Math.min(damageBonus, 0)
      disadvantageOnAttack = true
      break
  }

  const info = MAKE_TIER_INFO[tier]
  return {
    attackBonus,
    damageBonus,
    effectiveDamageDice,
    makeTier: tier,
    makeLabel: info.label,
    makeNote: info.note,
    noProficiency,
    disadvantageOnAttack,
  }
}

/** Format a signed modifier for display, e.g. 0 → "+0", -1 → "-1". */
export function formatBonus(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`
}

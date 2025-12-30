'use client'

import { CharacterPortrait } from './CharacterPortrait'
import { StatBlock } from './StatBlock'
import { Divider } from '../ui'
import { CLASSES, KNIGHT_ORDERS, RACES, HUMAN_CULTURES, BACKGROUNDS, VOCATIONS, getAbilityModifier } from '@/lib/constants'
import type { Character, AbilityStat } from '@/lib/types'

type CharacterBannerProps = {
  character: Character
  userEmail?: string
  // Vitals
  currentHP: number
  maxHP: number
  armorClass: number
  armorLevel: 'none' | 'light' | 'medium' | 'heavy'
}

const armorLevelLabels: Record<string, string> = {
  none: 'Unarmored',
  light: 'Light',
  medium: 'Medium',
  heavy: 'Heavy',
}

/**
 * CharacterBanner - Hero banner with portrait, identity, and vitals
 *
 * Unified header featuring:
 * - Ornate portrait frame (left)
 * - Name, level, class, order (center)
 * - HP bar, AC, Initiative, ability scores (right)
 * - Edit and sign out actions
 */
export function CharacterBanner({
  character,
  userEmail,
  currentHP,
  maxHP,
  armorClass,
  armorLevel,
}: CharacterBannerProps) {
  const raceName = RACES[character.race as keyof typeof RACES]?.name ?? character.race
  const subraceName = character.subrace
    ? HUMAN_CULTURES[character.subrace as keyof typeof HUMAN_CULTURES]?.name
    : null
  const className = CLASSES[character.class as keyof typeof CLASSES]?.name ?? character.class
  const orderName = KNIGHT_ORDERS[character.knight_order as keyof typeof KNIGHT_ORDERS]?.name ?? character.knight_order
  const backgroundName = BACKGROUNDS[character.background as keyof typeof BACKGROUNDS]?.name ?? character.background
  const vocationName = character.vocation
    ? VOCATIONS[character.vocation as keyof typeof VOCATIONS]?.name
    : character.feat
      ? `Feat: ${character.feat}`
      : null

  // HP calculations
  const hpPercentage = Math.max(0, Math.min(100, (currentHP / maxHP) * 100))
  let hpBarColor = 'bg-emerald-600'
  if (hpPercentage <= 25) hpBarColor = 'bg-red-600'
  else if (hpPercentage <= 50) hpBarColor = 'bg-amber-600'

  // Initiative from DEX
  const initiative = getAbilityModifier(character.dex)

  // Ability stats array
  const stats: AbilityStat[] = ['str', 'dex', 'con', 'int', 'wis', 'cha', 'hon']

  return (
    <div className="relative bg-grimoire-900 border border-sepia-700/50 rounded-lg overflow-hidden">
      {/* Subtle top gradient accent */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-bronze-muted/40 to-transparent" />

      <div className="p-4 sm:p-5">
        <div className="flex flex-col md:flex-row gap-4 sm:gap-5">
          {/* Left section: Portrait + Identity */}
          <div className="flex gap-4 sm:gap-5 flex-1 min-w-0">
            {/* Portrait */}
            <CharacterPortrait
              artworkUrl={character.artwork_url}
              characterName={character.name}
              size="lg"
              className="shrink-0"
            />

            {/* Identity */}
            <div className="flex-1 min-w-0">
              {/* Name */}
              <h1 className="text-2xl sm:text-3xl font-bold text-vellum-50 text-embossed truncate">
                {character.name}
              </h1>

              {/* Level / Class / Order */}
              <p className="text-bronze-bright font-medium mt-0.5">
                Level {character.level} {className}
                <span className="text-vellum-300 mx-1.5">&#8226;</span>
                <span className="text-vellum-200">{orderName}</span>
              </p>

              {/* Race / Background / Vocation */}
              <p className="text-sm text-vellum-300 mt-1">
                {raceName}
                {subraceName && <span className="text-vellum-400"> ({subraceName})</span>}
                <span className="mx-1.5">&#8226;</span>
                {backgroundName}
                {vocationName && (
                  <>
                    <span className="mx-1.5">&#8226;</span>
                    <span className={character.vocation === 'herbalist' ? 'text-emerald-400' : 'text-vellum-300'}>
                      {vocationName}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Right section: Vitals column */}
          <div className="w-full md:w-64 lg:w-72 flex flex-col gap-2.5 shrink-0">
            {/* HP Bar */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs uppercase tracking-wide text-vellum-400 font-medium">
                  Hit Points
                </span>
                <span className="text-base font-bold text-vellum-100">
                  {currentHP} / {maxHP}
                </span>
              </div>
              <div className="h-4 bg-grimoire-950 rounded-sm border border-sepia-800/50 overflow-hidden">
                <div
                  className={`h-full ${hpBarColor} transition-all duration-300`}
                  style={{ width: `${hpPercentage}%` }}
                >
                  <div className="h-1/2 bg-white/10 rounded-t-sm" />
                </div>
              </div>
            </div>

            {/* AC + Initiative row */}
            <div className="flex gap-2">
              {/* Armor Class */}
              <div className="flex-1 bg-grimoire-850 rounded border border-sepia-700/40 p-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 flex items-center justify-center bg-grimoire-900 rounded border border-sepia-700/50">
                    <span className="text-base">&#x1F6E1;</span>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-vellum-100 leading-none">{armorClass}</div>
                    <div className="text-[10px] text-vellum-400 uppercase">{armorLevelLabels[armorLevel]}</div>
                  </div>
                </div>
              </div>

              {/* Initiative */}
              <div className="flex-1 bg-grimoire-850 rounded border border-sepia-700/40 p-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 flex items-center justify-center bg-grimoire-900 rounded border border-sepia-700/50">
                    <span className="text-base">&#x26A1;</span>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-vellum-100 leading-none">
                      {initiative >= 0 ? '+' : ''}{initiative}
                    </div>
                    <div className="text-[10px] text-vellum-400 uppercase">Initiative</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ability Scores row */}
            <div className="flex justify-between gap-1 bg-grimoire-850/50 rounded px-2.5 py-1.5 border border-sepia-700/30">
              {stats.map((stat) => (
                <StatBlock
                  key={stat}
                  stat={stat}
                  value={character[stat]}
                  variant="banner"
                />
              ))}
            </div>
          </div>
        </div>

        {/* User email indicator */}
        {userEmail && (
          <>
            <Divider variant="subtle" className="my-3" />
            <p className="text-xs text-vellum-400">
              Signed in as <span className="text-vellum-300">{userEmail}</span>
            </p>
          </>
        )}
      </div>

      {/* Bottom gradient accent */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-sepia-700/30 to-transparent" />
    </div>
  )
}

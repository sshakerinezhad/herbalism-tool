'use client'

import Link from 'next/link'
import { CharacterPortrait } from './CharacterPortrait'
import { Divider } from '../ui'
import { CLASSES, KNIGHT_ORDERS, RACES, HUMAN_CULTURES, BACKGROUNDS, VOCATIONS } from '@/lib/constants'
import type { Character } from '@/lib/types'

type CharacterBannerProps = {
  character: Character
  onSignOut: () => void
  userEmail?: string
}

/**
 * CharacterBanner - Hero banner with portrait, name, and identity info
 *
 * Top of the character sheet featuring:
 * - Ornate portrait frame (left)
 * - Name, level, class, order (right)
 * - Race, background, vocation subtitle
 * - Edit and sign out actions
 */
export function CharacterBanner({ character, onSignOut, userEmail }: CharacterBannerProps) {
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

  return (
    <div className="relative bg-grimoire-900 border border-sepia-700/50 rounded-lg overflow-hidden">
      {/* Subtle top gradient accent */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-bronze-muted/40 to-transparent" />

      <div className="p-4 sm:p-5">
        <div className="flex gap-4 sm:gap-5">
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

            {/* Actions - desktop */}
            <div className="hidden sm:flex items-center gap-3 mt-3">
              <Link
                href="/edit-character"
                className="px-3 py-1.5 bg-grimoire-700 hover:bg-grimoire-800 border border-sepia-700/40 rounded text-sm font-medium text-vellum-100 transition-colors"
              >
                Edit Character
              </Link>
              <button
                onClick={onSignOut}
                className="text-sm text-vellum-400 hover:text-vellum-200 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>

          {/* Actions - mobile */}
          <div className="sm:hidden flex flex-col items-end gap-2 shrink-0">
            <Link
              href="/edit-character"
              className="px-2.5 py-1 bg-grimoire-700 hover:bg-grimoire-800 border border-sepia-700/40 rounded text-xs font-medium text-vellum-100"
            >
              Edit
            </Link>
            <button
              onClick={onSignOut}
              className="text-xs text-vellum-400 hover:text-vellum-200"
            >
              Sign out
            </button>
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

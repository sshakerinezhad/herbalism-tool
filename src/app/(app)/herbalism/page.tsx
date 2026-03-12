'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { useProfile } from '@/lib/profile'
import { useCharacter, useCharacterBrewedItems } from '@/lib/hooks'
import { computeMaxForagingSessions, computeBrewingModifier } from '@/lib/characterUtils'
import {
  PageLayout,
  GrimoireCard,
  SectionHeader,
  Divider,
  SkeletonCard,
} from '@/components/ui'
import type { CharacterBrewedItem } from '@/lib/types'

export default function HerbalismHub() {
  const { user } = useAuth()
  const { sessionsUsedToday } = useProfile()
  const { data: character, isLoading: characterLoading } = useCharacter(user?.id ?? null)
  const { data: brewedItems = [], isLoading: brewsLoading } = useCharacterBrewedItems(character?.id ?? null)

  const isLoading = characterLoading || brewsLoading

  if (isLoading) {
    return (
      <PageLayout>
        <h1 className="font-heading text-2xl text-vellum-50 mb-6">Herbalism</h1>
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </PageLayout>
    )
  }

  if (!character) {
    return (
      <PageLayout>
        <GrimoireCard>
          <p className="text-vellum-300 text-center">
            You need a character to access herbalism features.
          </p>
          <div className="text-center mt-4">
            <Link
              href="/create-character"
              className="text-bronze-muted hover:text-bronze-light transition-colors"
            >
              Create a character
            </Link>
          </div>
        </GrimoireCard>
      </PageLayout>
    )
  }

  const isHerbalist = character.vocation === 'herbalist'
  const maxSessions = computeMaxForagingSessions(character.int)
  const remaining = Math.max(0, maxSessions - sessionsUsedToday)
  const brewingMod = computeBrewingModifier(character.int, character.level, isHerbalist)

  // Last 3 brewed items, most recent first
  const recentBrews = [...brewedItems]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3)

  return (
    <PageLayout>
      <h1 className="font-heading text-2xl text-vellum-50 mb-6">Herbalism</h1>

      <div className="space-y-4">
        {/* Overview */}
        <GrimoireCard>
          <SectionHeader>Overview</SectionHeader>
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-vellum-300 text-sm">Foraging sessions</span>
              <span className="font-heading text-vellum-50">
                <span className={remaining === 0 ? 'text-red-400' : 'text-emerald-400'}>
                  {remaining}
                </span>
                <span className="text-vellum-400"> / {maxSessions}</span>
              </span>
            </div>

            {isHerbalist && (
              <>
                <Divider variant="subtle" />
                <div className="flex justify-between items-baseline">
                  <span className="text-vellum-300 text-sm">Brewing modifier</span>
                  <span className="font-heading text-vellum-50">
                    {brewingMod >= 0 ? '+' : ''}{brewingMod}
                  </span>
                </div>
              </>
            )}
          </div>
        </GrimoireCard>

        {/* Recent Brews */}
        <GrimoireCard>
          <SectionHeader>Recent Brews</SectionHeader>
          {recentBrews.length > 0 ? (
            <ul className="space-y-2">
              {recentBrews.map((item: CharacterBrewedItem) => (
                <li
                  key={item.id}
                  className="flex justify-between items-center text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-vellum-400">
                      {item.type === 'elixir' ? '🧪' : item.type === 'bomb' ? '💣' : '🫗'}
                    </span>
                    <span className="text-vellum-100 capitalize">{item.type}</span>
                  </div>
                  <span className="text-vellum-400 text-xs">
                    x{item.quantity}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-vellum-400 text-sm italic">
              No brewed items yet. Head to the brew workshop to get started.
            </p>
          )}
        </GrimoireCard>

        {/* Quick Links */}
        <GrimoireCard>
          <SectionHeader>Quick Links</SectionHeader>
          <div className="space-y-2">
            <Link
              href="/forage"
              className="block rounded p-3 bg-grimoire-800 hover:bg-grimoire-700 transition-colors group"
            >
              <div className="font-heading text-sm text-vellum-100 group-hover:text-vellum-50 transition-colors">
                Forage
              </div>
              <div className="text-xs text-vellum-400">
                Search for herbs in the wild
              </div>
            </Link>

            {isHerbalist ? (
              <Link
                href="/brew"
                className="block rounded p-3 bg-grimoire-800 hover:bg-grimoire-700 transition-colors group"
              >
                <div className="font-heading text-sm text-vellum-100 group-hover:text-vellum-50 transition-colors">
                  Brew
                </div>
                <div className="text-xs text-vellum-400">
                  Combine herbs into elixirs and bombs
                </div>
              </Link>
            ) : (
              <div className="block rounded p-3 bg-grimoire-800/50 opacity-50 cursor-not-allowed">
                <div className="font-heading text-sm text-vellum-300">
                  Brew
                </div>
                <div className="text-xs text-vellum-400">
                  Requires herbalist vocation
                </div>
              </div>
            )}
          </div>
        </GrimoireCard>
      </div>
    </PageLayout>
  )
}

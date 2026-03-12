'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { useCharacter } from '@/lib/hooks'
import { Tabs, TabList, Tab, TabPanel, ProfileSkeleton } from '@/components/ui'
import { GrimoireCard, ErrorDisplay } from '@/components/ui'
import { CharacterSheet, InventoryPanel, JournalPanel } from '@/components/profile'

export default function ProfileHome() {
  const { user } = useAuth()
  const { data: character, isLoading, error } = useCharacter(user?.id ?? null)

  if (isLoading) return <ProfileSkeleton />
  if (!character) return <NoCharacterView error={error?.message ?? null} />

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <Tabs defaultTab="character">
          <TabList variant="sub" className="mb-6">
            <Tab value="character" variant="sub">Character</Tab>
            <Tab value="inventory" variant="sub">Inventory</Tab>
            <Tab value="journal" variant="sub">Journal</Tab>
          </TabList>
          <TabPanel value="character">
            <CharacterSheet character={character} />
          </TabPanel>
          <TabPanel value="inventory">
            <InventoryPanel character={character} />
          </TabPanel>
          <TabPanel value="journal">
            <JournalPanel character={character} />
          </TabPanel>
        </Tabs>
      </div>
    </div>
  )
}

function NoCharacterView({ error }: { error: string | null }) {
  return (
    <div className="text-center py-8 px-8">
      <div className="max-w-2xl mx-auto">
        {error && (
          <div className="mb-6">
            <ErrorDisplay message={error} />
          </div>
        )}

        <GrimoireCard className="border-2 border-dashed border-sepia-700/60">
          <div className="text-6xl mb-4">⚔️</div>
          <h1 className="text-3xl font-bold mb-3 text-vellum-100">Create Your Knight</h1>
          <p className="text-vellum-300 max-w-md mx-auto mb-6">
            You haven&apos;t created a Knight of Belyar character yet.
            Begin your journey as a monster hunter in the world of Iridia.
          </p>

          <Link
            href="/create-character"
            className="inline-block px-8 py-4 bg-emerald-700 hover:bg-emerald-600 rounded-lg font-semibold text-lg text-vellum-50 transition-colors"
          >
            Begin Character Creation →
          </Link>

          <div className="mt-8 pt-6 border-t border-sepia-700/30">
            <h3 className="text-sm font-medium text-vellum-300 mb-3">What you&apos;ll choose:</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm text-vellum-200">
              <div className="bg-grimoire-800 rounded p-2">Name & Appearance</div>
              <div className="bg-grimoire-800 rounded p-2">Race & Background</div>
              <div className="bg-grimoire-800 rounded p-2">Class & Order</div>
              <div className="bg-grimoire-800 rounded p-2">Statistics</div>
              <div className="bg-grimoire-800 rounded p-2">Skill Proficiencies</div>
              <div className="bg-grimoire-800 rounded p-2">Vocation or Feat</div>
            </div>
          </div>
        </GrimoireCard>

        <p className="text-vellum-300 text-sm mt-6">
          Note: Foraging and herbalism features require a character profile.
        </p>
      </div>
    </div>
  )
}

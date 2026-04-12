'use client'

/**
 * HerbsTabContent Component
 *
 * Grimoire-styled herb inventory with element color suffusion,
 * search, sorting, and HerbInfoModal integration.
 */

import { useState } from 'react'
import Link from 'next/link'
import type { CharacterHerb, Herb } from '@/lib/types'
import { getElementColors, getElementSymbol } from '@/lib/constants'
import { HerbRow } from '@/components/inventory'
import { HerbInfoModal } from './index'
import type { SortMode } from '@/components/inventory/types'

interface HerbsTabContentProps {
  characterHerbs: CharacterHerb[]
  filteredInventory: CharacterHerb[]
  groupedByRarity: { rarity: string; items: CharacterHerb[] }[]
  groupedByElement: { element: string; raritySections: { rarity: string; items: CharacterHerb[] }[] }[]
  sortMode: SortMode
  setSortMode: (mode: SortMode) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  totalHerbs: number
  uniqueHerbs: number
  deletingHerbId: number | null
  deleteConfirmId: number | null
  deleteAllConfirmId: number | null
  onDeleteHerb: (herbId: number) => void
  onDeleteAllOfHerb: (herbId: number, quantity: number) => void
  onCancelConfirm: () => void
  onShowDeleteAll: (id: number) => void
  onCancelDeleteAll: () => void
}

export function HerbsTabContent(props: HerbsTabContentProps) {
  const {
    characterHerbs,
    filteredInventory,
    groupedByRarity,
    groupedByElement,
    sortMode,
    setSortMode,
    searchQuery,
    setSearchQuery,
    totalHerbs,
    uniqueHerbs,
    deletingHerbId,
    deleteConfirmId,
    deleteAllConfirmId,
    onDeleteHerb,
    onDeleteAllOfHerb,
    onCancelConfirm,
    onShowDeleteAll,
    onCancelDeleteAll,
  } = props

  const [selectedHerb, setSelectedHerb] = useState<Herb | null>(null)

  if (characterHerbs.length === 0) {
    return (
      <div className="elevation-raised rounded-lg p-8 text-center">
        <p className="text-vellum-400 mb-4">Your herb inventory is empty</p>
        <Link
          href="/forage"
          className="btn btn-primary px-5 py-2 text-sm"
        >
          Start Foraging
        </Link>
      </div>
    )
  }

  return (
    <>
      {/* Search */}
      <div className="mb-3">
        <div className="relative">
          <span
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs"
            style={{ color: 'rgba(138,122,96,0.4)' }}
          >
            ⌕
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search herbs..."
            className="w-full pl-7 pr-4 py-[7px] rounded-md text-vellum-50 font-body text-sm outline-none transition-colors"
            style={{
              background: 'rgba(0,0,0,0.25)',
              border: '1px solid rgba(139,109,62,0.1)',
              caretColor: 'var(--bronze-bright)',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-vellum-400 hover:text-vellum-200 transition-colors text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Sort row */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-ui text-vellum-400/50" style={{ fontSize: 9, letterSpacing: '1.2px' }}>
          {searchQuery
            ? `${filteredInventory.length} result${filteredInventory.length !== 1 ? 's' : ''}`
            : `${totalHerbs} total · ${uniqueHerbs} unique`
          }
        </span>
        <div className="flex gap-px rounded-[5px] p-0.5" style={{ background: 'rgba(0,0,0,0.2)' }}>
          <SortButton active={sortMode === 'element'} onClick={() => setSortMode('element')}>Element</SortButton>
          <SortButton active={sortMode === 'rarity'} onClick={() => setSortMode('rarity')}>Rarity</SortButton>
        </div>
      </div>

      {/* Herb List — By Element */}
      {sortMode === 'element' && (
        <div className="space-y-2">
          {groupedByElement.map(({ element, raritySections }) => {
            const colors = getElementColors(element)
            const totalInElement = raritySections.flatMap(s => s.items).reduce((sum, i) => sum + i.quantity, 0)
            const elementSymbol = element === 'Mixed' ? '⚛️' : getElementSymbol(element)

            return (
              <div
                key={element}
                className={`rounded-lg overflow-hidden border ${colors.border}`}
              >
                {/* Element header */}
                <div className={`flex items-center gap-2 px-3 py-2 ${colors.header}`}>
                  <span className="text-base">{elementSymbol}</span>
                  <span className={`font-ui text-xs font-medium tracking-wide ${colors.text}`}>
                    {element}
                  </span>
                  <span className="font-ui text-[10px] ml-auto" style={{ color: 'rgba(232,220,200,0.25)' }}>
                    {totalInElement}
                  </span>
                </div>

                {/* Rarity sections with herb rows */}
                {raritySections.map(({ rarity, items }) => (
                  <div key={rarity}>
                    {/* Rarity sub-bar */}
                    <div
                      className="px-3 py-[3px]"
                      style={{
                        background: `color-mix(in srgb, ${colors.header.includes('red') ? 'rgb(153,27,27)' : colors.header.includes('sky') ? 'rgb(30,58,138)' : colors.header.includes('green') ? 'rgb(20,83,45)' : colors.header.includes('indigo') ? 'rgb(49,46,129)' : colors.header.includes('yellow') ? 'rgb(161,98,7)' : colors.header.includes('purple') ? 'rgb(88,28,135)' : 'rgb(61,52,42)'} 8%, transparent)`,
                        borderTop: '1px solid rgba(255,255,255,0.03)',
                      }}
                    >
                      <span className="font-ui uppercase text-vellum-200/30" style={{ fontSize: 9, letterSpacing: '1px' }}>
                        {rarity}
                      </span>
                    </div>

                    {/* Herb rows */}
                    {items.filter(item => item.herb).map((item) => (
                      <div
                        key={item.id}
                        className={`odd:${colors.row1} even:${colors.row2} hover:brightness-125`}
                      >
                        <HerbRow
                          item={item}
                          onNameClick={() => setSelectedHerb(item.herb!)}
                          isDeleting={deletingHerbId === item.herb_id}
                          isConfirming={deleteConfirmId === item.herb_id}
                          isConfirmingAll={deleteAllConfirmId === item.herb_id}
                          onDelete={() => onDeleteHerb(item.herb_id)}
                          onDeleteAll={() => onDeleteAllOfHerb(item.herb_id, item.quantity)}
                          onCancelConfirm={() => {
                            onCancelConfirm()
                            onCancelDeleteAll()
                          }}
                          onShowDeleteAll={() => onShowDeleteAll(item.herb_id)}
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {/* Herb List — By Rarity */}
      {sortMode === 'rarity' && (
        <div className="space-y-2">
          {groupedByRarity.map(({ rarity, items }) => {
            const colors = getElementColors('mixed')
            return (
              <div key={rarity} className={`rounded-lg border overflow-hidden ${colors.border}`}>
                <div className={`px-3 py-2 ${colors.header}`}>
                  <span className="font-ui text-xs font-medium uppercase tracking-wide text-vellum-200">
                    {rarity}
                    <span className="text-vellum-400/40 font-normal ml-2">
                      ({items.reduce((sum, i) => sum + i.quantity, 0)})
                    </span>
                  </span>
                </div>
                {items.filter(item => item.herb).map((item) => (
                  <div
                    key={item.id}
                    className={`odd:${colors.row1} even:${colors.row2}`}
                  >
                    <HerbRow
                      item={item}
                      onNameClick={() => setSelectedHerb(item.herb!)}
                      isDeleting={deletingHerbId === item.herb_id}
                      isConfirming={deleteConfirmId === item.herb_id}
                      isConfirmingAll={deleteAllConfirmId === item.herb_id}
                      onDelete={() => onDeleteHerb(item.herb_id)}
                      onDeleteAll={() => onDeleteAllOfHerb(item.herb_id, item.quantity)}
                      onCancelConfirm={() => {
                        onCancelConfirm()
                        onCancelDeleteAll()
                      }}
                      onShowDeleteAll={() => onShowDeleteAll(item.herb_id)}
                    />
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {/* HerbInfoModal */}
      <HerbInfoModal
        herb={selectedHerb}
        open={!!selectedHerb}
        onClose={() => setSelectedHerb(null)}
      />
    </>
  )
}

/** Sort toggle button */
function SortButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="font-ui rounded-[3px] border-none transition-colors"
      style={{
        fontSize: 9,
        padding: '3px 10px',
        cursor: 'pointer',
        color: active ? 'var(--vellum-50)' : 'rgba(138,122,96,0.5)',
        background: active ? 'rgba(139,109,62,0.12)' : 'none',
      }}
    >
      {children}
    </button>
  )
}

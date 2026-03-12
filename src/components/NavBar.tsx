'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Character } from '@/lib/types'
import { calculateMaxHP } from '@/lib/constants'
import { RACES, CLASSES, KNIGHT_ORDERS } from '@/lib/constants'

type NavBarProps = {
  character: Character | null
}

const LOCKED_TABS = [
  { name: 'Martial Mastery', flavor: 'Coming soon... The blade remembers.' },
  { name: 'Archemancy', flavor: 'Coming soon... The sigils wait.' },
  { name: 'Alchemy', flavor: 'Coming soon... The cauldron stirs.' },
]

function getCharacterSubtitle(character: Character): string {
  const raceName = RACES[character.race]?.name ?? character.race
  const className = CLASSES[character.class as keyof typeof CLASSES]?.name ?? character.class
  const orderName = KNIGHT_ORDERS[character.knight_order]?.name ?? character.knight_order
  // Shorten "Order of X" to just "X" for nav bar
  const shortOrder = orderName.replace('Order of ', '')
  return `Lv ${character.level} · ${className} · ${shortOrder}`
}

export function NavBar({ character }: NavBarProps) {
  const pathname = usePathname()
  const [hoveredLocked, setHoveredLocked] = useState<number | null>(null)

  const activeSection =
    pathname === '/herbalism' || pathname === '/forage' || pathname === '/brew'
      ? 'herbalism'
      : 'profile'

  const isHerbalism = activeSection === 'herbalism'
  const maxHP = character ? calculateMaxHP(character.con, character.hp_custom_modifier) : 0

  return (
    <nav className={`relative ${isHerbalism ? 'herb-context' : ''}`}>
      <div className="nav-bar">
        {/* Character Presence */}
        <Link href="/" className="presence">
          <div className="emblem">⚔</div>
          <div className="char-info">
            <div className="char-name">
              {character?.name ?? 'Unknown'}
            </div>
            <div className="char-subtitle">
              {character ? getCharacterSubtitle(character) : 'No character'}
            </div>
          </div>
        </Link>

        {/* System Tabs */}
        <div className="system-tabs">
          <Link
            href="/"
            className={`sys-tab ${activeSection === 'profile' ? 'active' : ''}`}
          >
            Profile
          </Link>
          <Link
            href="/herbalism"
            className={`sys-tab ${activeSection === 'herbalism' ? 'active' : ''}`}
          >
            Herbalism
          </Link>
          {LOCKED_TABS.map((tab, i) => (
            <span
              key={tab.name}
              className="sys-tab locked"
              onMouseEnter={() => setHoveredLocked(i)}
              onMouseLeave={() => setHoveredLocked(null)}
            >
              {tab.name}
              <span
                className="locked-tooltip"
                style={{
                  position: 'absolute',
                  bottom: 'calc(100% + 8px)',
                  left: '50%',
                  transform: `translateX(-50%) translateY(${hoveredLocked === i ? '0' : '4px'})`,
                  opacity: hoveredLocked === i ? 1 : 0,
                  pointerEvents: 'none',
                  whiteSpace: 'nowrap',
                  fontFamily: 'var(--font-almendra)',
                  fontSize: '12px',
                  fontStyle: 'italic',
                  color: 'var(--ash)',
                  background: 'var(--char)',
                  border: '1px solid var(--soot)',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                  transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
                  zIndex: 50,
                }}
              >
                {tab.flavor}
              </span>
            </span>
          ))}
        </div>

        {/* Right Side */}
        <div className="nav-end">
          {character && (
            <div className="vitals">
              <div className="hp-ember" />
              <div className="hp-text">
                {character.hp_current} / {maxHP}
              </div>
            </div>
          )}
          <Link href="/settings" className="gear-btn">
            ⚙
          </Link>
        </div>
      </div>
    </nav>
  )
}

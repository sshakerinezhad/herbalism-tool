'use client'

import type { ReactNode } from 'react'

/**
 * FilterButton Component
 *
 * Small utility button used for type filtering in the brewed items tab.
 */

interface FilterButtonProps {
  active: boolean
  onClick: () => void
  children: ReactNode
  activeClass?: string
}

export function FilterButton({
  active,
  onClick,
  children,
  activeClass = 'bg-zinc-700'
}: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
        active ? `${activeClass} text-zinc-100` : 'text-zinc-400 hover:text-zinc-200'
      }`}
    >
      {children}
    </button>
  )
}

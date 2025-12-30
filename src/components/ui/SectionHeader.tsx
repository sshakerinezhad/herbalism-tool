'use client'

import { ReactNode } from 'react'

type SectionHeaderProps = {
  children: ReactNode
  className?: string
}

/**
 * SectionHeader - Small uppercase section label
 *
 * Use within GrimoireCard or other containers to label content sections.
 */
export function SectionHeader({ children, className = '' }: SectionHeaderProps) {
  return (
    <h2 className={`text-xs font-semibold text-vellum-300 uppercase tracking-widest border-b border-sepia-700/40 pb-1 mb-3 ${className}`}>
      {children}
    </h2>
  )
}

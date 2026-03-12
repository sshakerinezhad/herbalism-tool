'use client'

import { ReactNode } from 'react'

type SelectionCardProps = {
  selected: boolean
  disabled?: boolean
  onClick: () => void
  children: ReactNode
  className?: string
}

export function SelectionCard({ selected, disabled, onClick, children, className = '' }: SelectionCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        p-4 rounded-lg border text-left transition-all duration-200
        ${selected
          ? 'elevation-raised border-bronze-muted/60 shadow-[0_0_8px_rgba(201,166,107,0.15)]'
          : disabled
            ? 'elevation-base border-sepia-800/30 text-vellum-500 cursor-not-allowed opacity-60'
            : 'elevation-base border-sepia-700/30 hover:border-sepia-600/50'
        }
        ${className}
      `}
    >
      {children}
    </button>
  )
}

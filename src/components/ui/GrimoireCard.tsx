'use client'

import { ReactNode } from 'react'

type GrimoireCardVariant = 'default' | 'raised' | 'inset' | 'bronze' | 'subtle'

type GrimoireCardProps = {
  children: ReactNode
  className?: string
  variant?: GrimoireCardVariant
  /** Padding preset */
  padding?: 'none' | 'sm' | 'md' | 'lg'
  /** Show corner decorations */
  corners?: boolean
}

const variantStyles: Record<GrimoireCardVariant, string> = {
  default: 'bg-grimoire-900 border-sepia-700/50 shadow-sm',
  raised: 'bg-grimoire-850 border-sepia-700/60 shadow-md glow-inner-bronze',
  inset: 'bg-grimoire-950 border-sepia-800/50 shadow-inner',
  bronze: 'bg-grimoire-900 border-bronze-muted/50 glow-bronze',
  subtle: 'bg-grimoire-900/80 border-sepia-800/40',
}

const paddingStyles = {
  none: '',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
}

/**
 * GrimoireCard - Themed card wrapper with dark grimoire background
 *
 * Use for content sections that need a dark, aged-book appearance.
 * Supports multiple variants for different visual emphasis.
 */
export function GrimoireCard({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  corners = false,
}: GrimoireCardProps) {
  return (
    <div
      className={`
        relative rounded border
        ${variantStyles[variant]}
        ${paddingStyles[padding]}
        ${className}
      `}
    >
      {corners && (
        <>
          <span className="absolute -top-px -left-px w-2.5 h-2.5 border-t border-l border-bronze-muted/70 rounded-tl-sm" />
          <span className="absolute -top-px -right-px w-2.5 h-2.5 border-t border-r border-bronze-muted/70 rounded-tr-sm" />
          <span className="absolute -bottom-px -left-px w-2.5 h-2.5 border-b border-l border-bronze-muted/70 rounded-bl-sm" />
          <span className="absolute -bottom-px -right-px w-2.5 h-2.5 border-b border-r border-bronze-muted/70 rounded-br-sm" />
        </>
      )}
      {children}
    </div>
  )
}

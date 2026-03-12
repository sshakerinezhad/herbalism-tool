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
  default: 'elevation-raised top-edge-highlight',
  raised: 'elevation-elevated top-edge-highlight',
  inset: 'elevation-base',
  bronze: 'elevation-elevated top-edge-highlight glow-bronze',
  subtle: 'elevation-base',
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
        relative rounded overflow-hidden
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

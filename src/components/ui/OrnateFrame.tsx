'use client'

import { ReactNode } from 'react'

type OrnateFrameVariant = 'default' | 'bronze' | 'gold' | 'subtle'

type OrnateFrameProps = {
  children: ReactNode
  className?: string
  variant?: OrnateFrameVariant
  /** Show corner decorations */
  corners?: boolean
  /** Padding preset */
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const variantStyles: Record<OrnateFrameVariant, string> = {
  default: 'border-sepia-700/60 shadow-[inset_0_1px_0_0_rgba(201,166,107,0.1)]',
  bronze: 'border-bronze-muted/70 shadow-[inset_0_1px_0_0_rgba(201,166,107,0.15),0_0_8px_rgba(139,115,85,0.2)]',
  gold: 'border-bronze-bright/60 shadow-[inset_0_1px_0_0_rgba(201,166,107,0.2),0_0_12px_rgba(201,166,107,0.15)]',
  subtle: 'border-sepia-800/50 shadow-none',
}

const paddingStyles = {
  none: '',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
}

/**
 * OrnateFrame - Decorative frame with fantasy-styled borders
 *
 * Use for wrapping content that needs an ornate, aged-grimoire appearance.
 * Supports corner decorations and multiple border variants.
 */
export function OrnateFrame({
  children,
  className = '',
  variant = 'default',
  corners = false,
  padding = 'md',
}: OrnateFrameProps) {
  return (
    <div
      className={`
        relative bg-grimoire-900 rounded-sm border
        ${variantStyles[variant]}
        ${paddingStyles[padding]}
        ${className}
      `}
    >
      {corners && (
        <>
          {/* Corner decorations - bronze flourishes */}
          <span className="absolute -top-px -left-px w-3 h-3 border-t-2 border-l-2 border-bronze-muted/80 rounded-tl-sm" />
          <span className="absolute -top-px -right-px w-3 h-3 border-t-2 border-r-2 border-bronze-muted/80 rounded-tr-sm" />
          <span className="absolute -bottom-px -left-px w-3 h-3 border-b-2 border-l-2 border-bronze-muted/80 rounded-bl-sm" />
          <span className="absolute -bottom-px -right-px w-3 h-3 border-b-2 border-r-2 border-bronze-muted/80 rounded-br-sm" />
        </>
      )}
      {children}
    </div>
  )
}

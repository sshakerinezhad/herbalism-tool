'use client'

import Image from 'next/image'

type CharacterPortraitProps = {
  artworkUrl: string | null
  characterName: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeStyles = {
  sm: 'w-16 h-20',
  md: 'w-24 h-32',
  lg: 'w-32 h-40',
}

const iconSizes = {
  sm: 'text-2xl',
  md: 'text-4xl',
  lg: 'text-5xl',
}

/**
 * CharacterPortrait - Ornate framed portrait with bronze styling
 *
 * Displays character artwork if available, or a silhouette placeholder.
 * Features decorative bronze frame with corner flourishes.
 */
export function CharacterPortrait({
  artworkUrl,
  characterName,
  size = 'md',
  className = '',
}: CharacterPortraitProps) {
  return (
    <div
      className={`
        relative ${sizeStyles[size]}
        bg-gradient-to-b from-grimoire-800 to-grimoire-950
        border-2 border-bronze-muted/60
        rounded
        shadow-[inset_0_2px_6px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.5)]
        ${className}
      `}
    >
      {/* Inner border effect */}
      <div className="absolute inset-0.5 border border-sepia-700/30 rounded-sm pointer-events-none" />

      {/* Corner flourishes */}
      <span className="absolute -top-0.5 -left-0.5 w-3 h-3 border-t-2 border-l-2 border-bronze-bright/70 rounded-tl" />
      <span className="absolute -top-0.5 -right-0.5 w-3 h-3 border-t-2 border-r-2 border-bronze-bright/70 rounded-tr" />
      <span className="absolute -bottom-0.5 -left-0.5 w-3 h-3 border-b-2 border-l-2 border-bronze-bright/70 rounded-bl" />
      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 border-b-2 border-r-2 border-bronze-bright/70 rounded-br" />

      {artworkUrl ? (
        <Image
          src={artworkUrl}
          alt={`${characterName} portrait`}
          fill
          className="object-cover rounded-sm"
          sizes="(max-width: 768px) 96px, 128px"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Silhouette placeholder */}
          <span className={`${iconSizes[size]} text-sepia-700/60`}>
            &#x1F464;
          </span>
        </div>
      )}

      {/* Subtle vignette overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 rounded-sm pointer-events-none" />
    </div>
  )
}

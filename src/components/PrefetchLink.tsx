'use client'

/**
 * PrefetchLink - Smart navigation link with data prefetching
 * 
 * Prefetches page data on hover/focus for instant navigation.
 * This is an industry-standard pattern used by companies like
 * Vercel, Airbnb, and Discord for snappy UX.
 * 
 * Usage:
 *   <PrefetchLink href="/forage" prefetch="forage">
 *     Forage Herbs
 *   </PrefetchLink>
 */

import Link from 'next/link'
import { useCallback, useRef, ReactNode } from 'react'
import { usePrefetch } from '@/lib/hooks'

type PrefetchType = 'forage' | 'profile' | 'none'

type PrefetchLinkProps = {
  href: string
  prefetch?: PrefetchType
  profileId?: string | null
  userId?: string | null
  children: ReactNode
  className?: string
  /** Delay in ms before prefetching (default: 100ms to avoid prefetch on quick mouse passes) */
  prefetchDelay?: number
}

export function PrefetchLink({
  href,
  prefetch = 'none',
  profileId,
  userId,
  children,
  className,
  prefetchDelay = 100,
}: PrefetchLinkProps) {
  const {
    prefetchForage,
    prefetchProfile
  } = usePrefetch()
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasPrefetchedRef = useRef(false)
  
  const doPrefetch = useCallback(() => {
    // Only prefetch once per link instance
    if (hasPrefetchedRef.current) return
    hasPrefetchedRef.current = true
    
    switch (prefetch) {
      case 'forage':
        prefetchForage()
        break
      case 'profile':
        prefetchProfile(userId ?? null)
        break
    }
  }, [prefetch, profileId, userId, prefetchForage, prefetchProfile])
  
  const handleMouseEnter = useCallback(() => {
    // Small delay to avoid prefetching on quick mouse passes
    timeoutRef.current = setTimeout(doPrefetch, prefetchDelay)
  }, [doPrefetch, prefetchDelay])
  
  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])
  
  const handleFocus = useCallback(() => {
    // Prefetch immediately on focus (keyboard navigation)
    doPrefetch()
  }, [doPrefetch])
  
  return (
    <Link
      href={href}
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
    >
      {children}
    </Link>
  )
}


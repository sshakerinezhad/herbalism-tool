'use client'

/**
 * PrefetchLink - Smart navigation link with data prefetching
 * 
 * Prefetches page data on hover/focus for instant navigation.
 * This is an industry-standard pattern used by companies like
 * Vercel, Airbnb, and Discord for snappy UX.
 * 
 * Usage:
 *   <PrefetchLink href="/inventory" prefetch="inventory" profileId={profileId}>
 *     View Inventory
 *   </PrefetchLink>
 */

import Link from 'next/link'
import { useCallback, useRef, ReactNode } from 'react'
import { usePrefetch } from '@/lib/hooks'

type PrefetchType = 'inventory' | 'forage' | 'brew' | 'recipes' | 'profile' | 'none'

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
    prefetchInventory, 
    prefetchForage, 
    prefetchBrew, 
    prefetchRecipes, 
    prefetchProfile 
  } = usePrefetch()
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasPrefetchedRef = useRef(false)
  
  const doPrefetch = useCallback(() => {
    // Only prefetch once per link instance
    if (hasPrefetchedRef.current) return
    hasPrefetchedRef.current = true
    
    switch (prefetch) {
      case 'inventory':
        prefetchInventory(profileId ?? null)
        break
      case 'forage':
        prefetchForage()
        break
      case 'brew':
        prefetchBrew(profileId ?? null)
        break
      case 'recipes':
        prefetchRecipes(profileId ?? null)
        break
      case 'profile':
        prefetchProfile(userId ?? null)
        break
    }
  }, [prefetch, profileId, userId, prefetchInventory, prefetchForage, prefetchBrew, prefetchRecipes, prefetchProfile])
  
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


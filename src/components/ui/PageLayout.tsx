/**
 * PageLayout - Consistent page wrapper with common elements
 * 
 * Provides consistent max-width, padding, and optional home link.
 */

import Link from 'next/link'
import { ReactNode } from 'react'

type PageLayoutProps = {
  /** Page content */
  children: ReactNode
  /** Whether to show the home link (default: true) */
  showHomeLink?: boolean
  /** Maximum width class (default: max-w-2xl) */
  maxWidth?: 'max-w-xl' | 'max-w-2xl' | 'max-w-3xl' | 'max-w-4xl'
}

export function PageLayout({ 
  children, 
  showHomeLink = true,
  maxWidth = 'max-w-2xl' 
}: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 p-8">
      <div className={`${maxWidth} mx-auto`}>
        {showHomeLink && <HomeLink />}
        {children}
      </div>
    </div>
  )
}

/**
 * HomeLink - Navigation back to home page
 */
export function HomeLink() {
  return (
    <Link 
      href="/" 
      className="text-zinc-400 hover:text-zinc-200 mb-4 inline-block"
    >
      ← Home
    </Link>
  )
}


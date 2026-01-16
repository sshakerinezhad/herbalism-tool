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
  /** Optional actions to display on the right side of the header */
  headerActions?: ReactNode
}

export function PageLayout({
  children,
  showHomeLink = true,
  maxWidth = 'max-w-2xl',
  headerActions,
}: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-vellum-50 p-8">
      <div className={`${maxWidth} mx-auto`}>
        {(showHomeLink || headerActions) && (
          <div className="flex items-center justify-between mb-4">
            {showHomeLink ? <HomeLink /> : <div />}
            {headerActions}
          </div>
        )}
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
      className="text-vellum-300 hover:text-vellum-50"
    >
      ← Home
    </Link>
  )
}


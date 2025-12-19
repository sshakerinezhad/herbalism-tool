'use client'

import { ProfileProvider } from '@/lib/profile'
import { ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ProfileProvider>
      {children}
    </ProfileProvider>
  )
}


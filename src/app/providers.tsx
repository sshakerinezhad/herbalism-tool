'use client'

import { AuthProvider } from '@/lib/auth'
import { ProfileProvider } from '@/lib/profile'
import { ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ProfileProvider>
        {children}
      </ProfileProvider>
    </AuthProvider>
  )
}

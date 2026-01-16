'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/lib/auth'
import { ProfileProvider } from '@/lib/profile'
import { ReactNode, useState } from 'react'

// Create QueryClient with sensible defaults for this app
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is considered fresh for 5 minutes - won't refetch during this time
        staleTime: 5 * 60 * 1000,
        // Keep unused data in cache for 30 minutes
        gcTime: 30 * 60 * 1000,
        // Don't refetch when window regains focus (prevents tab-switch reloads)
        refetchOnWindowFocus: false,
        // Don't refetch when reconnecting
        refetchOnReconnect: false,
        // Retry failed requests once
        retry: 1,
      },
    },
  })
}

export function Providers({ children }: { children: ReactNode }) {
  // Create QueryClient once per component instance (handles SSR correctly)
  const [queryClient] = useState(() => makeQueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ProfileProvider>
          {children}
        </ProfileProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

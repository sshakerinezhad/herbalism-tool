'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { useCharacter } from '@/lib/hooks'
import { NavBar } from '@/components/NavBar'
import { LoadingState } from '@/components/ui'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { data: character } = useCharacter(user?.id ?? null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [authLoading, user, router])

  if (authLoading || !user) {
    return <LoadingState message="Loading..." />
  }

  return (
    <>
      <NavBar character={character ?? null} />
      <main className="min-h-[calc(100vh-56px)]">{children}</main>
    </>
  )
}

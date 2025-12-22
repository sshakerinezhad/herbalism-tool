'use client'

/**
 * Login Page
 * 
 * Authentication page supporting:
 * - Email/password login
 * - Email/password signup
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { LoadingState, ErrorDisplay } from '@/components/ui'

type AuthMode = 'login' | 'signup'

const AUTH_MODES = [
  { mode: 'login' as const, label: 'Login' },
  { mode: 'signup' as const, label: 'Sign Up' },
]

export default function LoginPage() {
  const { signIn, signUp, user, isLoading } = useAuth()
  const router = useRouter()
  
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect if already logged in (must be in useEffect to avoid render-phase state updates)
  useEffect(() => {
    if (!isLoading && user) {
      router.push('/')
    }
  }, [isLoading, user, router])

  // Show loading while checking auth or while redirecting
  if (isLoading || user) {
    return <LoadingState />
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsSubmitting(true)

    try {
      if (mode === 'signup') {
        const { error } = await signUp(email, password)
        if (error) {
          setError(error)
        } else {
          setSuccess('Account created! Check your email to confirm, then log in.')
        }
      } else {
        const { error } = await signIn(email, password)
        if (error) {
          setError(error)
        } else {
          router.push('/')
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">🌿 Herbalism Tool</h1>
          <p className="text-zinc-400">
            {mode === 'login' && 'Sign in to access your profile'}
            {mode === 'signup' && 'Create an account to save your progress'}
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="flex gap-1 mb-6 bg-zinc-800 p-1 rounded-lg">
          {AUTH_MODES.map(({ mode: m, label }) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                mode === m
                  ? 'bg-zinc-700 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-600"
            />
            {mode === 'signup' && (
              <p className="text-zinc-500 text-sm mt-1">
                At least 6 characters
              </p>
            )}
          </div>

          {error && <ErrorDisplay message={error} />}

          {success && (
            <div className="bg-emerald-900/30 border border-emerald-700 rounded-lg p-3">
              <p className="text-emerald-300 text-sm">{success}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-emerald-700 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            {isSubmitting ? 'Please wait...' : (
              mode === 'login' ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

      </div>
    </div>
  )
}

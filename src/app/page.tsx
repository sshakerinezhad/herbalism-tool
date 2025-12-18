'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Herb = {
  id: number
  name: string
  rarity: string
  elements: string[]
  description: string | null
}

export default function Home() {
  const [herbs, setHerbs] = useState<Herb[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchHerbs() {
      const { data, error } = await supabase
        .from('herbs')
        .select('*')
        .order('name')

      if (error) {
        setError(error.message)
      } else {
        setHerbs(data || [])
      }
      setLoading(false)
    }

    fetchHerbs()
  }, [])

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 p-8">
      <h1 className="text-3xl font-bold mb-6">🌿 Herbalism Tool</h1>
      
      <h2 className="text-xl font-semibold mb-4">Connection Test - Your Herbs:</h2>

      {loading && <p className="text-zinc-400">Loading...</p>}
      
      {error && (
        <div className="bg-red-900/50 border border-red-500 rounded p-4 mb-4">
          <p className="text-red-300">Error: {error}</p>
          <p className="text-red-400 text-sm mt-2">
            Check that your .env.local file has the correct Supabase URL and key.
          </p>
        </div>
      )}

      {!loading && !error && herbs.length === 0 && (
        <p className="text-zinc-400">No herbs found. Add some in Supabase!</p>
      )}

      {herbs.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {herbs.map((herb) => (
            <div
              key={herb.id}
              className="bg-zinc-800 rounded-lg p-4 border border-zinc-700"
            >
              <h3 className="font-semibold text-lg">{herb.name}</h3>
              <p className="text-zinc-400 text-sm capitalize">{herb.rarity}</p>
              <div className="flex gap-2 mt-2">
                {herb.elements.map((element, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-zinc-700 rounded text-xs capitalize"
                  >
                    {element}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

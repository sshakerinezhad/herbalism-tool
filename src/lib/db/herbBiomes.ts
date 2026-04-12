import { supabase } from '../supabase'

export async function fetchHerbBiomes(herbId: number): Promise<{
  data: { id: number; name: string }[] | null
  error: string | null
}> {
  const { data, error } = await supabase
    .from('biome_herbs')
    .select('biome_id, biomes(id, name)')
    .eq('herb_id', herbId)

  if (error) return { data: null, error: error.message }

  const biomes = (data || [])
    .map(bh => bh.biomes as unknown as { id: number; name: string })
    .filter(Boolean)

  return { data: biomes, error: null }
}

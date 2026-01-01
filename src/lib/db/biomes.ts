import { supabase } from '../supabase'
import type { Herb, BiomeHerb } from '../types'  // Import existing type - DO NOT redefine

export async function fetchBiomeHerbs(biomeId: number): Promise<{
  data: BiomeHerb[] | null
  error: string | null
}> {
  const { data, error } = await supabase
    .from('biome_herbs')
    .select('id, biome_id, herb_id, weight, herbs(*)')
    .eq('biome_id', biomeId)

  if (error) return { data: null, error: error.message }

  const transformed = (data || []).map(bh => ({
    ...bh,
    herbs: bh.herbs as unknown as Herb
  })) as BiomeHerb[]

  return { data: transformed, error: null }
}

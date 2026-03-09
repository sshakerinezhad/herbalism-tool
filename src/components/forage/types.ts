import type { Herb } from '@/lib/types'

/** A herb instance found during foraging, with tracking for inventory removal */
export type ForagedHerb = {
  instanceId: string
  herb: Herb
  removed: boolean
}

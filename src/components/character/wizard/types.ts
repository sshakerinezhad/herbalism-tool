import type {
  Race,
  HumanCulture,
  StartingClass,
  Background,
  KnightOrder,
  Vocation,
  CharacterStats,
  ArmorPreset,
} from '@/lib/types'

export type WizardStep =
  | 'name'
  | 'race'
  | 'background'
  | 'class'
  | 'order'
  | 'stats'
  | 'skills'
  | 'vocation'
  | 'equipment'
  | 'review'

export type WizardData = {
  name: string
  appearance: string
  race: Race | null
  subrace: HumanCulture | null
  background: Background | null
  previousProfession: string
  class: StartingClass | null
  knightOrder: KnightOrder | null
  stats: CharacterStats
  skillProficiencies: Set<number>
  vocation: Vocation | null
  feat: string
  armorPreset: ArmorPreset | null
  // Starting money (rolled)
  gold: number
  silver: number
  copper: number
}

export type WizardChapter = {
  number: string  // Roman numeral
  title: string
  steps: WizardStep[]
}

export type StepProps = {
  data: WizardData
  setData: React.Dispatch<React.SetStateAction<WizardData>>
}

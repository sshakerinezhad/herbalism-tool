/**
 * UI Components barrel export
 * 
 * Import shared UI components from here:
 * import { ErrorDisplay, LoadingState, PageLayout } from '@/components/ui'
 */

export { ErrorDisplay } from './ErrorDisplay'
export { LoadingState, InlineLoading } from './LoadingState'
export { PageLayout, HomeLink } from './PageLayout'
export { 
  Skeleton,
  SkeletonText,
  SkeletonCard,
  InventorySkeleton,
  ForageSkeleton,
  BrewSkeleton,
  RecipesSkeleton,
  ProfileSkeleton,
} from './Skeleton'
export { PrefetchLink } from '../PrefetchLink'
export { ItemTooltip } from './ItemTooltip'
export type { ItemDetails, ItemTooltipProps } from './ItemTooltip'


'use client'

type DividerVariant = 'default' | 'ornate' | 'subtle' | 'bronze'
type DividerOrientation = 'horizontal' | 'vertical'

type DividerProps = {
  className?: string
  variant?: DividerVariant
  orientation?: DividerOrientation
  /** Show center ornament (diamond/flourish) */
  ornament?: boolean
}

const horizontalVariants: Record<DividerVariant, string> = {
  default: 'h-px bg-sepia-700/50',
  ornate: 'h-px bg-gradient-to-r from-transparent via-sepia-600/60 to-transparent',
  subtle: 'h-px bg-sepia-800/40',
  bronze: 'h-px bg-gradient-to-r from-transparent via-bronze-muted/50 to-transparent',
}

const verticalVariants: Record<DividerVariant, string> = {
  default: 'w-px bg-sepia-700/50',
  ornate: 'w-px bg-gradient-to-b from-transparent via-sepia-600/60 to-transparent',
  subtle: 'w-px bg-sepia-800/40',
  bronze: 'w-px bg-gradient-to-b from-transparent via-bronze-muted/50 to-transparent',
}

/**
 * Divider - Decorative line separator
 *
 * Use between sections to create visual separation with fantasy styling.
 * Supports horizontal/vertical orientation and optional center ornament.
 */
export function Divider({
  className = '',
  variant = 'default',
  orientation = 'horizontal',
  ornament = false,
}: DividerProps) {
  const isHorizontal = orientation === 'horizontal'
  const variantStyle = isHorizontal ? horizontalVariants[variant] : verticalVariants[variant]

  if (ornament && isHorizontal) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className={`flex-1 ${horizontalVariants[variant]}`} />
        <span className="text-bronze-muted/60 text-xs">&#9670;</span>
        <div className={`flex-1 ${horizontalVariants[variant]}`} />
      </div>
    )
  }

  return (
    <div
      className={`${variantStyle} ${isHorizontal ? 'w-full' : 'h-full'} ${className}`}
      role="separator"
      aria-orientation={orientation}
    />
  )
}

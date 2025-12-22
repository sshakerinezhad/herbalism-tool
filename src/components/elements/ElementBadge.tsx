/**
 * ElementBadge - Display element symbols with optional styling
 * 
 * Use this to consistently render element icons throughout the app.
 */

import { getElementSymbol, getElementColors } from '@/lib/constants'

type ElementBadgeProps = {
  /** Element name (fire, water, earth, air, positive, negative) */
  element: string
  /** Whether to show background styling */
  showBackground?: boolean
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Whether to show the element name as a tooltip */
  showTooltip?: boolean
  /** Optional additional classes */
  className?: string
}

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
}

export function ElementBadge({ 
  element, 
  showBackground = false, 
  size = 'md',
  showTooltip = true,
  className = '' 
}: ElementBadgeProps) {
  const symbol = getElementSymbol(element)
  const colors = getElementColors(element)
  
  const bgClasses = showBackground 
    ? `px-1.5 py-0.5 rounded ${colors.bg} ${colors.border}` 
    : ''
  
  return (
    <span 
      className={`${sizeClasses[size]} ${bgClasses} ${className}`}
      title={showTooltip ? element : undefined}
    >
      {symbol}
    </span>
  )
}

type ElementListProps = {
  /** Array of element names */
  elements: string[]
  /** Whether to show background styling on each */
  showBackground?: boolean
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Gap between elements */
  gap?: 'none' | 'sm' | 'md'
  /** Optional additional classes for container */
  className?: string
}

const gapClasses = {
  none: '',
  sm: 'gap-0.5',
  md: 'gap-1',
}

/**
 * ElementList - Render multiple element badges in a row
 */
export function ElementList({ 
  elements, 
  showBackground = false,
  size = 'md',
  gap = 'none',
  className = ''
}: ElementListProps) {
  return (
    <span className={`inline-flex items-center ${gapClasses[gap]} ${className}`}>
      {elements.map((el, i) => (
        <ElementBadge 
          key={i} 
          element={el} 
          showBackground={showBackground}
          size={size}
        />
      ))}
    </span>
  )
}


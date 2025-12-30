'use client'

type LockToggleProps = {
  locked: boolean
  onToggle: () => void
  label?: string
}

/**
 * LockToggle - Small lock/unlock button
 *
 * Use for toggling edit mode on interactive sections like CoinPurse or QuickSlots.
 */
export function LockToggle({ locked, onToggle, label }: LockToggleProps) {
  return (
    <button
      onClick={onToggle}
      aria-label={label || (locked ? 'Unlock' : 'Lock')}
      className={`text-xs px-2 py-0.5 rounded border transition-colors ${
        locked
          ? 'bg-grimoire-800 text-vellum-200 border-sepia-700/60 hover:bg-grimoire-700'
          : 'bg-bronze-muted text-grimoire-950 border-bronze-bright/50 hover:bg-bronze-glow'
      }`}
    >
      {locked ? '🔒' : '🔓'}
    </button>
  )
}

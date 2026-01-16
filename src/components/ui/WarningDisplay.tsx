type WarningDisplayProps = {
  message: string
  onDismiss?: () => void
  className?: string
}

export function WarningDisplay({ message, onDismiss, className = '' }: WarningDisplayProps) {
  return (
    <div className={`bg-amber-900/30 border border-amber-700 rounded-lg p-4 ${className}`}>
      <p className="text-amber-300">{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="text-amber-400 hover:text-amber-200 text-sm mt-2">
          Dismiss
        </button>
      )}
    </div>
  )
}

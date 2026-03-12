type WarningDisplayProps = {
  message: string
  onDismiss?: () => void
  className?: string
}

export function WarningDisplay({ message, onDismiss, className = '' }: WarningDisplayProps) {
  return (
    <div className={`bg-amber-950/20 border border-amber-900/50 rounded-lg p-4 elevation-raised ${className}`}>
      <p className="text-amber-300 font-body">{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="text-amber-400 hover:text-amber-200 text-sm mt-2 font-body">
          Dismiss
        </button>
      )}
    </div>
  )
}

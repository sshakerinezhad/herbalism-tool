/**
 * ErrorDisplay - Consistent error message display
 * 
 * Use this component to show error messages throughout the app.
 * Provides a consistent look and optional dismiss functionality.
 */

type ErrorDisplayProps = {
  /** The error message to display */
  message: string
  /** Optional callback when user dismisses the error */
  onDismiss?: () => void
  /** Optional additional CSS classes */
  className?: string
}

export function ErrorDisplay({ message, onDismiss, className = '' }: ErrorDisplayProps) {
  return (
    <div className={`bg-red-950/20 border border-red-900/50 rounded-lg p-4 elevation-raised ${className}`}>
      <p className="text-red-300 font-body">{message}</p>
      {onDismiss && (
        <button 
          onClick={onDismiss}
          className="text-red-400 hover:text-red-200 text-sm mt-2 font-body"
        >
          Dismiss
        </button>
      )}
    </div>
  )
}


/**
 * LoadingState - Full-page loading indicator
 * 
 * Use this for page-level loading states while data is being fetched.
 */

type LoadingStateProps = {
  /** Optional message to display */
  message?: string
}

export function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
  return (
    <div className="min-h-screen bg-background text-vellum-50 p-8 flex items-center justify-center">
      <p className="font-body text-vellum-300 animate-warm-pulse">{message}</p>
    </div>
  )
}

/**
 * InlineLoading - Smaller loading indicator for inline use
 */
export function InlineLoading({ message = 'Loading...' }: LoadingStateProps) {
  return (
    <div className="flex items-center gap-2 text-vellum-400">
      <span className="text-bronze-muted animate-warm-pulse">●</span>
      <span className="font-body">{message}</span>
    </div>
  )
}


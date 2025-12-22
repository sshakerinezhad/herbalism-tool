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
    <div className="min-h-screen bg-zinc-900 text-zinc-100 p-8">
      <p>{message}</p>
    </div>
  )
}

/**
 * InlineLoading - Smaller loading indicator for inline use
 */
export function InlineLoading({ message = 'Loading...' }: LoadingStateProps) {
  return (
    <div className="flex items-center gap-2 text-zinc-400">
      <span className="animate-pulse">●</span>
      <span>{message}</span>
    </div>
  )
}


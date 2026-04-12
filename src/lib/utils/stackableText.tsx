import { ReactNode } from 'react'

export function parseStackableText(text: string, colorClass?: string): ReactNode[] {
  const parts: ReactNode[] = []
  const regex = /\*([^*]+)\*/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    parts.push(
      <span key={match.index} className={`stackable-value ${colorClass || ''}`} title="Scales with potency">
        {match[1]}
      </span>
    )
    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts
}

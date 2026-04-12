/**
 * RecipeCard - Grimoire-styled recipe with stackable highlights and Brew This button
 *
 * Type communicated through color (gradient bg, left accent bar).
 * Stackable values parsed from *...* in recipe_text.
 */

import Link from 'next/link'
import { Recipe } from '@/lib/types'
import { getElementSymbol } from '@/lib/constants'
import { parseStackableText } from '@/lib/utils/stackableText'

type RecipeCardProps = {
  recipe: Recipe & { userRecipeId?: number }
}

const TYPE_STYLES = {
  elixir: {
    bg: 'linear-gradient(135deg, rgba(20,30,55,0.7) 0%, rgba(15,22,42,0.5) 100%)',
    border: 'rgba(59,130,246,0.12)',
    accent: 'linear-gradient(180deg, #60a5fa, #2563eb)',
    effectBorder: 'rgba(59,130,246,0.2)',
    effectLabel: '#60a5fa',
    valueClass: 'text-sky-300',
    brewBg: 'rgba(59,130,246,0.12)',
    brewBorder: 'rgba(59,130,246,0.3)',
    brewColor: '#93c5fd',
  },
  bomb: {
    bg: 'linear-gradient(135deg, rgba(55,20,20,0.7) 0%, rgba(42,15,15,0.5) 100%)',
    border: 'rgba(239,68,68,0.12)',
    accent: 'linear-gradient(180deg, #f87171, #dc2626)',
    effectBorder: 'rgba(239,68,68,0.2)',
    effectLabel: '#f87171',
    valueClass: 'text-red-300',
    brewBg: 'rgba(239,68,68,0.12)',
    brewBorder: 'rgba(239,68,68,0.3)',
    brewColor: '#fca5a5',
  },
  balm: {
    bg: 'linear-gradient(135deg, rgba(55,40,15,0.7) 0%, rgba(42,30,10,0.5) 100%)',
    border: 'rgba(245,158,11,0.12)',
    accent: 'linear-gradient(180deg, #fbbf24, #d97706)',
    effectBorder: 'rgba(245,158,11,0.2)',
    effectLabel: '#fbbf24',
    valueClass: 'text-amber-300',
    brewBg: 'rgba(245,158,11,0.12)',
    brewBorder: 'rgba(245,158,11,0.3)',
    brewColor: '#fcd34d',
  },
} as const

export function RecipeCard({ recipe }: RecipeCardProps) {
  const displayText = recipe.recipe_text || null
  const recipeType = recipe.type as keyof typeof TYPE_STYLES
  const styles = TYPE_STYLES[recipeType] || TYPE_STYLES.elixir

  return (
    <div
      className="relative rounded-lg overflow-hidden"
      style={{ background: styles.bg, border: `1px solid ${styles.border}` }}
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ background: styles.accent }}
      />

      <div className="pl-5 pr-4 py-4">
        {/* Header: name + elements + secret badge */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-vellum-50 text-lg leading-tight">
              {recipe.name}
            </h3>
            <div className="flex items-center gap-0.5 text-base">
              {recipe.elements.map((el, i) => (
                <span key={i} title={el}>{getElementSymbol(el)}</span>
              ))}
            </div>
          </div>

          {recipe.is_secret && (
            <span
              className="font-ui text-[10px] px-2.5 py-1 rounded-full font-medium"
              style={{
                background: 'rgba(201,169,110,0.12)',
                border: '1px solid rgba(201,169,110,0.3)',
                color: 'var(--bronze-bright)',
              }}
            >
              ✦ Secret
            </span>
          )}
        </div>

        {/* Effect box with stackable highlights */}
        {displayText && (
          <div
            className="rounded-md px-3 py-2.5 mb-3"
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: `1px solid ${styles.effectBorder}`,
            }}
          >
            <div className="text-vellum-50 text-sm leading-relaxed">
              <span
                className="font-ui uppercase text-[10px] tracking-widest mr-2 font-semibold"
                style={{ color: styles.effectLabel }}
              >
                Effect
              </span>
              {parseStackableText(displayText, styles.valueClass)}
            </div>
          </div>
        )}

        {/* Lore */}
        {recipe.lore && (
          <div
            className="mb-3 pl-3 py-2"
            style={{ borderLeft: '2px solid rgba(201,169,110,0.15)' }}
          >
            <p className="text-xs italic text-vellum-400/60 leading-relaxed">
              {recipe.lore}
            </p>
          </div>
        )}

        {/* Brew This button */}
        <Link
          href={`/brew?recipe=${recipe.id}`}
          className="inline-flex items-center gap-1.5 font-ui text-[11px] px-4 py-1.5 rounded-full transition-all duration-200 hover:brightness-125"
          style={{
            background: styles.brewBg,
            border: `1px solid ${styles.brewBorder}`,
            color: styles.brewColor,
            letterSpacing: '0.5px',
          }}
        >
          Brew This →
        </Link>
      </div>
    </div>
  )
}

'use client'

import { Modal } from '@/components/ui/Modal'
import { useHerbBiomes } from '@/lib/hooks/queries'
import { getElementSymbol } from '@/lib/constants'
import type { Herb } from '@/lib/types'

type HerbInfoModalProps = {
  herb: Herb | null
  open: boolean
  onClose: () => void
}

// Element colors adapted for parchment (dark-on-light)
const PARCHMENT_ELEMENT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  fire:  { bg: 'rgba(185,28,28,0.1)',  border: 'rgba(185,28,28,0.2)',  text: '#7f1d1d' },
  water: { bg: 'rgba(29,78,216,0.1)',  border: 'rgba(29,78,216,0.2)',  text: '#1e3a5f' },
  earth: { bg: 'rgba(22,101,52,0.1)',  border: 'rgba(22,101,52,0.2)',  text: '#14532d' },
  air:   { bg: 'rgba(67,56,202,0.1)',  border: 'rgba(67,56,202,0.2)',  text: '#312e81' },
  light: { bg: 'rgba(161,98,7,0.1)',   border: 'rgba(161,98,7,0.2)',   text: '#713f12' },
  dark:  { bg: 'rgba(88,28,135,0.1)',  border: 'rgba(88,28,135,0.2)',  text: '#4c1d95' },
}

const RARITY_COLORS: Record<string, string> = {
  common: '#5a4a34',
  uncommon: '#2d6a30',
  rare: '#2a5db0',
  'very rare': '#6b21a8',
  legendary: '#92400e',
  preternatural: '#991b1b',
}

export function HerbInfoModal({ herb, open, onClose }: HerbInfoModalProps) {
  const { data: biomes, isLoading: biomesLoading } = useHerbBiomes(herb?.id ?? null)

  if (!herb) return null

  const uniqueElements = [...new Set(herb.elements)]

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="!bg-transparent !border-none !shadow-none !p-0 max-w-sm"
    >
      <div className="scroll-container" style={{ filter: 'drop-shadow(0 6px 20px rgba(0,0,0,0.5))' }}>
        {/* === Top Dowel === */}
        <div
          style={{
            height: 28,
            position: 'relative',
            zIndex: 2,
            borderRadius: '14px 14px 0 0',
            background: 'linear-gradient(180deg, #3a3020 0%, #5a4a34 15%, #7a6648 35%, #8a7656 50%, #7a6648 65%, #5a4a34 85%, #3a3020 100%)',
            boxShadow: 'inset 0 3px 0 rgba(255,255,255,0.12), inset 0 -2px 4px rgba(0,0,0,0.4), 0 -2px 6px rgba(0,0,0,0.3)',
          }}
        >
          {/* Grain lines */}
          <div
            style={{
              position: 'absolute',
              inset: '4px 20px',
              background: 'repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(0,0,0,0.06) 8px, rgba(0,0,0,0.06) 9px)',
              borderRadius: 2,
            }}
          />
          {/* Shadow cast onto parchment */}
          <div
            style={{
              position: 'absolute',
              bottom: -6,
              left: '5%',
              right: '5%',
              height: 6,
              background: 'linear-gradient(180deg, rgba(0,0,0,0.18), transparent)',
              zIndex: 3,
            }}
          />
          {/* Knobs */}
          <Knob side="left" />
          <Knob side="right" />
        </div>

        {/* === Parchment Body === */}
        <div
          style={{
            background: 'linear-gradient(170deg, #ddd0b4 0%, #d4c4a0 20%, #ccba90 50%, #d0c096 80%, #d8c8a4 100%)',
            padding: '28px 30px',
            position: 'relative',
          }}
        >
          {/* Noise texture */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")`,
              pointerEvents: 'none',
            }}
          />
          {/* Aged inset shadow */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              boxShadow: 'inset 0 0 30px rgba(74,61,40,0.15)',
              pointerEvents: 'none',
            }}
          />

          {/* Content — relative to sit above overlays */}
          <div style={{ position: 'relative' }}>
            {/* Header: icon + name + rarity + close */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
              {/* Icon placeholder */}
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 6,
                  background: 'rgba(74,61,40,0.08)',
                  border: '1px dashed rgba(74,61,40,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  color: 'rgba(74,61,40,0.3)',
                  flexShrink: 0,
                }}
              >
                ✦
              </div>
              <div style={{ flex: 1 }}>
                <div
                  className="font-heading"
                  style={{ fontSize: 28, fontWeight: 600, color: '#2c2010', lineHeight: 1 }}
                >
                  {herb.name}
                </div>
                <div
                  className="font-ui"
                  style={{
                    fontSize: 10,
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    marginTop: 4,
                    color: RARITY_COLORS[herb.rarity.toLowerCase()] || '#5a4a34',
                  }}
                >
                  {herb.rarity}
                </div>
              </div>
              <button
                onClick={onClose}
                style={{
                  fontSize: 18,
                  color: 'rgba(74,61,40,0.3)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'color 0.2s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = 'rgba(74,61,40,0.6)')}
                onMouseOut={(e) => (e.currentTarget.style.color = 'rgba(74,61,40,0.3)')}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Element pills */}
            {uniqueElements.length > 0 && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
                {uniqueElements.map((el) => {
                  const colors = PARCHMENT_ELEMENT_COLORS[el.toLowerCase()] || PARCHMENT_ELEMENT_COLORS.earth
                  return (
                    <span
                      key={el}
                      className="font-ui"
                      style={{
                        fontSize: 11,
                        letterSpacing: '0.3px',
                        padding: '4px 11px',
                        borderRadius: 999,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        background: colors.bg,
                        border: `1px solid ${colors.border}`,
                        color: colors.text,
                      }}
                    >
                      {getElementSymbol(el)} {el.charAt(0).toUpperCase() + el.slice(1)}
                    </span>
                  )
                })}
              </div>
            )}

            <ParchmentDivider />

            {/* Description */}
            {herb.description && (
              <>
                <ScrollSection label="Description">
                  <p
                    style={{
                      fontSize: 15,
                      lineHeight: 1.6,
                      color: '#5a4a34',
                      fontStyle: 'italic',
                    }}
                  >
                    {herb.description}
                  </p>
                </ScrollSection>
                <ParchmentDivider />
              </>
            )}

            {/* Property (conditional) */}
            {herb.property && (
              <>
                <ScrollSection label="Property">
                  <p style={{ fontSize: 15, lineHeight: 1.6, color: '#3d2e1a' }}>
                    {herb.property}
                  </p>
                </ScrollSection>
                <ParchmentDivider />
              </>
            )}

            {/* Biomes */}
            <ScrollSection label="Found in">
              {biomesLoading ? (
                <div
                  className="font-ui"
                  style={{ fontSize: 11, color: 'rgba(74,61,40,0.4)', letterSpacing: '0.5px' }}
                >
                  Loading...
                </div>
              ) : biomes && biomes.length > 0 ? (
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 6 }}>
                  {biomes.map((biome) => (
                    <span
                      key={biome.id}
                      className="font-ui"
                      style={{
                        fontSize: 10,
                        letterSpacing: '0.3px',
                        padding: '3px 10px',
                        borderRadius: 999,
                        background: 'rgba(74,61,40,0.06)',
                        border: '1px solid rgba(74,61,40,0.12)',
                        color: '#5a4a34',
                      }}
                    >
                      {biome.name}
                    </span>
                  ))}
                </div>
              ) : (
                <div
                  className="font-ui"
                  style={{ fontSize: 11, color: 'rgba(74,61,40,0.35)', fontStyle: 'italic' }}
                >
                  Unknown origins
                </div>
              )}
            </ScrollSection>
          </div>
        </div>

        {/* === Bottom Dowel === */}
        <div
          style={{
            height: 28,
            position: 'relative',
            zIndex: 2,
            borderRadius: '0 0 14px 14px',
            background: 'linear-gradient(180deg, #3a3020 0%, #5a4a34 15%, #7a6648 35%, #8a7656 50%, #7a6648 65%, #5a4a34 85%, #3a3020 100%)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4), inset 0 -3px 0 rgba(255,255,255,0.08), 0 4px 8px rgba(0,0,0,0.3)',
          }}
        >
          {/* Grain lines */}
          <div
            style={{
              position: 'absolute',
              inset: '4px 20px',
              background: 'repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(0,0,0,0.06) 8px, rgba(0,0,0,0.06) 9px)',
              borderRadius: 2,
            }}
          />
          {/* Shadow cast from below onto parchment */}
          <div
            style={{
              position: 'absolute',
              top: -6,
              left: '5%',
              right: '5%',
              height: 6,
              background: 'linear-gradient(0deg, rgba(0,0,0,0.18), transparent)',
              zIndex: 3,
            }}
          />
          <Knob side="left" />
          <Knob side="right" />
        </div>
      </div>
    </Modal>
  )
}

/** Wooden knob on the dowel ends */
function Knob({ side }: { side: 'left' | 'right' }) {
  return (
    <div
      style={{
        position: 'absolute',
        width: 10,
        top: 3,
        bottom: 3,
        [side]: 6,
        borderRadius: 4,
        background: 'linear-gradient(180deg, #8a7656, #6a5640, #8a7656)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 0 3px rgba(0,0,0,0.3)',
      }}
    />
  )
}

/** Horizontal parchment divider */
function ParchmentDivider() {
  return (
    <div
      style={{
        height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(74,61,40,0.2) 20%, rgba(74,61,40,0.2) 80%, transparent)',
        margin: '16px 0',
      }}
    />
  )
}

/** Labeled section within the scroll */
function ScrollSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div
        className="font-ui"
        style={{
          fontSize: 10,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          color: 'rgba(74,61,40,0.4)',
          marginBottom: 5,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  )
}

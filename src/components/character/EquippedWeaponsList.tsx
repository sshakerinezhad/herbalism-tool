'use client'

import type { CharacterWeapon } from '@/lib/types'
import { computeWeaponModifiers, formatBonus } from '@/lib/weapons'

interface EquippedWeaponsListProps {
  weapons: CharacterWeapon[]
  onUnequip: (weaponId: string) => void
  // Shield toggle wired in Piece 5:
  onToggleShield?: (weaponId: string, active: boolean) => void
}

export function EquippedWeaponsList({ weapons, onUnequip, onToggleShield }: EquippedWeaponsListProps) {
  const equipped = weapons.filter((w) => w.is_equipped)

  if (equipped.length === 0) {
    return (
      <p className="text-sm text-vellum-400 italic py-4 text-center">
        Nothing on hand. Equip weapons from your inventory.
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-2">
      {equipped.map((w) => {
        const mods = computeWeaponModifiers(w, w.material_ref)
        return (
          <li
            key={w.id}
            className="flex items-center justify-between gap-2 bg-grimoire-900 rounded border border-sepia-700/50 px-3 py-2"
          >
            <div className="min-w-0">
              <div className="text-sm font-medium text-vellum-100 truncate">{w.name}</div>
              <div className="text-xs text-vellum-400 font-mono">
                {w.is_shield
                  ? `${formatBonus(w.ac_bonus ?? 0)} AC`
                  : `${mods.effectiveDamageDice ?? '—'} ${formatBonus(mods.damageBonus)}`}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {w.is_shield && onToggleShield && (
                <button
                  onClick={() => onToggleShield(w.id, !w.shield_active)}
                  className={`text-xs px-2 py-1 rounded border transition-colors ${
                    w.shield_active
                      ? 'bg-grimoire-800 text-bronze-bright border-bronze-muted/60 hover:border-bronze-bright'
                      : 'bg-grimoire-800 text-vellum-400 border-sepia-700 hover:text-vellum-200'
                  }`}
                  title={w.shield_active ? 'Stop wielding shield' : 'Wield shield'}
                >
                  {w.shield_active ? 'Wielding' : 'Wield'}
                </button>
              )}
              <button
                onClick={() => onUnequip(w.id)}
                className="text-xs px-2 py-1 rounded bg-grimoire-800 text-vellum-400 border border-sepia-700 hover:bg-grimoire-700 transition-colors"
              >
                Unequip
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

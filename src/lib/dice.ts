// Dice rolling utilities

export function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1
}

export function rollD4(): number {
  return Math.floor(Math.random() * 4) + 1
}

export function rollDice(sides: number): number {
  return Math.floor(Math.random() * sides) + 1
}

// Roll on the herb quantity table
// Returns total herbs found
export function rollHerbQuantity(): { total: number; rolls: string[] } {
  const rolls: string[] = []
  
  function rollOnTable(): number {
    const d20 = rollD20()
    
    if (d20 <= 10) {
      rolls.push(`d20: ${d20} → 1 herb`)
      return 1
    } else if (d20 <= 15) {
      const d4 = rollD4()
      rolls.push(`d20: ${d20} → 1d4 = ${d4} herbs`)
      return d4
    } else if (d20 <= 18) {
      const d4 = rollD4()
      rolls.push(`d20: ${d20} → 1d4+1 = ${d4}+1 = ${d4 + 1} herbs`)
      return d4 + 1
    } else if (d20 === 19) {
      const d4 = rollD4()
      rolls.push(`d20: ${d20} → 1d4+2 = ${d4}+2 = ${d4 + 2} herbs`)
      return d4 + 2
    } else {
      // Natural 20 - roll twice more!
      // Very low chance that this could stack recursively for a stack overflow but doubt it
      rolls.push(`d20: ${d20} → Roll twice more!`)
      return rollOnTable() + rollOnTable()
    }
  }
  
  const total = rollOnTable()
  return { total, rolls }
}

// Weighted random selection
export function weightedRandomSelect<T extends { weight: number }>(
  items: T[]
): T {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0)
  let random = Math.random() * totalWeight
  
  for (const item of items) {
    random -= item.weight
    if (random <= 0) {
      return item
    }
  }
  
  // Fallback (shouldn't happen)
  return items[items.length - 1]
}


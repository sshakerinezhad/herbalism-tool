const ROMAN_MAP: [number, string][] = [
  [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
]

export function toRoman(n: number): string {
  if (n <= 0) return String(n)
  let result = ''
  let remaining = n
  for (const [value, numeral] of ROMAN_MAP) {
    while (remaining >= value) { result += numeral; remaining -= value }
  }
  return result
}

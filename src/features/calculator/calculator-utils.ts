export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—"
  return value.toFixed(2)
}

export function parseGrade(input: string): number | null {
  const trimmed = input.trim()
  if (trimmed === "") return null
  const value = parseFloat(trimmed)
  if (Number.isNaN(value)) return null
  return value
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

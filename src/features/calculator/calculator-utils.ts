export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—"
  return value.toFixed(2)
}

export function parseGrade(input: string): number | null {
  const trimmed = input.trim()
  if (trimmed === "") return null
  if (!/^-?\d*\.?\d+$/.test(trimmed)) return null
  const value = parseFloat(trimmed)
  if (Number.isNaN(value)) return null
  if (value < 0 || value > 20) return null
  return value
}

export function isGradeInRange(input: string): boolean {
  const trimmed = input.trim()
  if (trimmed === "") return true
  if (!/^-?\d*\.?\d*$/.test(trimmed)) return false
  if (trimmed === "-" || trimmed === "." || trimmed === "-.") return true
  const value = parseFloat(trimmed)
  if (Number.isNaN(value)) return false
  return value >= 0 && value <= 20
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

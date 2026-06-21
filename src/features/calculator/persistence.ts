import {
  CALCULATION_SCHEMA_VERSION,
  calculationSnapshotSchema,
  savedPreferencesSchema,
  type CalculationSnapshot,
  type SavedPreferences,
} from "@/lib/schemas"
import type { Locale } from "@/i18n/routes"

const CALCULATION_KEY_PREFIX = "fsgf-calculator:calculation:v1"
const PREFERENCES_KEY = "fsgf-calculator:preferences:v1"
const THEME_KEY = "fsgf-calculator:theme"

export type ThemePreference = "light" | "dark" | "system"

export function calculationStorageKey(
  parcoursCode: string,
  academicYear: number
): string {
  return `${CALCULATION_KEY_PREFIX}:${parcoursCode}:${academicYear}`
}

export function saveCalculation(snapshot: CalculationSnapshot): void {
  if (typeof window === "undefined") return
  const key = calculationStorageKey(
    snapshot.parcoursCode,
    snapshot.academicYear
  )
  window.localStorage.setItem(key, JSON.stringify(snapshot))
}

export function loadCalculation(
  parcoursCode: string,
  academicYear: number
): CalculationSnapshot | null {
  if (typeof window === "undefined") return null
  const key = calculationStorageKey(parcoursCode, academicYear)
  const raw = window.localStorage.getItem(key)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)
    const result = calculationSnapshotSchema.safeParse(parsed)
    if (!result.success) {
      window.localStorage.removeItem(key)
      return null
    }
    return result.data
  } catch {
    window.localStorage.removeItem(key)
    return null
  }
}

export function removeCalculation(
  parcoursCode: string,
  academicYear: number
): void {
  if (typeof window === "undefined") return
  const key = calculationStorageKey(parcoursCode, academicYear)
  window.localStorage.removeItem(key)
}

export function removeAllCalculations(): void {
  if (typeof window === "undefined") return
  for (let i = window.localStorage.length - 1; i >= 0; i--) {
    const key = window.localStorage.key(i)
    if (key?.startsWith(CALCULATION_KEY_PREFIX)) {
      window.localStorage.removeItem(key)
    }
  }
}

export function savePreferences(preferences: SavedPreferences): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences))
}

export function loadPreferences(): SavedPreferences | null {
  if (typeof window === "undefined") return null
  const raw = window.localStorage.getItem(PREFERENCES_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)
    const result = savedPreferencesSchema.safeParse(parsed)
    if (!result.success) {
      window.localStorage.removeItem(PREFERENCES_KEY)
      return null
    }
    return result.data
  } catch {
    window.localStorage.removeItem(PREFERENCES_KEY)
    return null
  }
}

export function saveTheme(theme: ThemePreference): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(THEME_KEY, theme)
}

export function loadTheme(): ThemePreference | null {
  if (typeof window === "undefined") return null
  const raw = window.localStorage.getItem(THEME_KEY)
  if (raw === "light" || raw === "dark" || raw === "system") return raw
  return null
}

export function createDefaultSnapshot(
  parcoursCode: string,
  academicYear: number
): CalculationSnapshot {
  return {
    schemaVersion: CALCULATION_SCHEMA_VERSION,
    parcoursCode,
    academicYear,
    unitSelections: {},
    subjectGrades: {},
    directUeGrades: {},
  }
}

export function createDefaultPreferences(locale: Locale): SavedPreferences {
  return {
    schemaVersion: 1,
    locale,
  }
}

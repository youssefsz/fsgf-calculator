import { describe, expect, it } from "vitest"

import { CALCULATION_SCHEMA_VERSION } from "@/lib/schemas"
import type { CalculationSnapshot, SavedPreferences } from "@/lib/schemas"

import {
  calculationStorageKey,
  createDefaultSnapshot,
  loadCalculation,
  loadPreferences,
  loadTheme,
  removeAllCalculations,
  removeCalculation,
  saveCalculation,
  savePreferences,
  saveTheme,
  type ThemePreference,
} from "./persistence"

describe("saveCalculation / loadCalculation round-trip", () => {
  it("persists and restores a calculation snapshot", () => {
    const snapshot: CalculationSnapshot = {
      schemaVersion: CALCULATION_SCHEMA_VERSION,
      parcoursCode: "TEST01",
      academicYear: 2,
      unitSelections: { UE1: { included: true } },
      subjectGrades: {
        S1: { mode: "direct", direct: 14 },
      },
      directUeGrades: { UE2: 16 },
    }

    saveCalculation(snapshot)
    const loaded = loadCalculation("TEST01", 2)
    expect(loaded).toEqual(snapshot)
  })
})

describe("reset calculation", () => {
  it("removeCalculation removes saved data", () => {
    const snapshot = createDefaultSnapshot("TEST01", 1)
    saveCalculation(snapshot)
    expect(loadCalculation("TEST01", 1)).not.toBeNull()
    removeCalculation("TEST01", 1)
    expect(loadCalculation("TEST01", 1)).toBeNull()
  })

  it("removeAllCalculations removes every saved calculation", () => {
    saveCalculation(createDefaultSnapshot("A", 1))
    saveCalculation(createDefaultSnapshot("B", 2))
    saveCalculation(createDefaultSnapshot("C", 3))

    removeAllCalculations()

    expect(loadCalculation("A", 1)).toBeNull()
    expect(loadCalculation("B", 2)).toBeNull()
    expect(loadCalculation("C", 3)).toBeNull()
  })
})

describe("invalid saved data", () => {
  it("discards invalid JSON safely", () => {
    const key = calculationStorageKey("TEST01", 1)
    window.localStorage.setItem(key, "not-json")
    expect(loadCalculation("TEST01", 1)).toBeNull()
    expect(window.localStorage.getItem(key)).toBeNull()
  })

  it("discards obsolete schema version safely", () => {
    const key = calculationStorageKey("TEST01", 1)
    const obsolete = {
      schemaVersion: 99,
      parcoursCode: "TEST01",
      academicYear: 1,
      unitSelections: {},
      subjectGrades: {},
      directUeGrades: {},
    }
    window.localStorage.setItem(key, JSON.stringify(obsolete))
    expect(loadCalculation("TEST01", 1)).toBeNull()
    expect(window.localStorage.getItem(key)).toBeNull()
  })

  it("discards data with out-of-range grades safely", () => {
    const snapshot: CalculationSnapshot = {
      schemaVersion: CALCULATION_SCHEMA_VERSION,
      parcoursCode: "TEST01",
      academicYear: 1,
      unitSelections: {},
      subjectGrades: {
        INVALID: { mode: "direct", direct: 25 },
      },
      directUeGrades: {},
    }
    saveCalculation(snapshot)
    const loaded = loadCalculation("TEST01", 1)
    expect(loaded).toBeNull()
  })

  it("returns valid stale data safely instead of crashing", () => {
    const snapshot: CalculationSnapshot = {
      schemaVersion: CALCULATION_SCHEMA_VERSION,
      parcoursCode: "TEST01",
      academicYear: 1,
      unitSelections: { OLD_UE: { included: false } },
      subjectGrades: {
        OLD_SUBJECT: { mode: "direct", direct: 12 },
      },
      directUeGrades: { OLD_UE: 14 },
    }
    saveCalculation(snapshot)
    const loaded = loadCalculation("TEST01", 1)
    expect(loaded).toEqual(snapshot)
  })

  it("discards malformed preferences safely", () => {
    window.localStorage.setItem("fsgf-calculator:preferences:v1", "bad-json")
    expect(loadPreferences()).toBeNull()
  })
})

describe("preference persistence", () => {
  it("saves and loads locale preferences", () => {
    const preferences: SavedPreferences = { schemaVersion: 1, locale: "fr" }
    savePreferences(preferences)
    expect(loadPreferences()).toEqual(preferences)
  })

  it("discards preferences with wrong schema version", () => {
    window.localStorage.setItem(
      "fsgf-calculator:preferences:v1",
      JSON.stringify({ schemaVersion: 2, locale: "en" })
    )
    expect(loadPreferences()).toBeNull()
  })
})

describe("theme persistence", () => {
  it.each<ThemePreference>(["light", "dark", "system"])(
    "saves and loads %s theme preference",
    (theme) => {
      saveTheme(theme)
      expect(loadTheme()).toBe(theme)
    }
  )

  it("returns null for unknown stored theme values", () => {
    window.localStorage.setItem("fsgf-calculator:theme", "purple")
    expect(loadTheme()).toBeNull()
  })
})

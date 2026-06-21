import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import type {
  CalculationSnapshot,
  FormulaConfig,
  ParcoursIndexEntry,
  ParcoursPlanFile,
  Semester,
  SubjectGradeEntry,
  TeachingUnit,
} from "@/lib/schemas"
import {
  calculateSemesterResult,
  calculateSubjectGrade,
  calculateUeAverage,
  calculateYearResult,
  detectOptionalGroups,
  getDefaultFormula,
  getInitialSelections,
  normalizeRegime,
  shouldDefaultToDirectGrade,
  type DirectUeGradeMap,
  type GradeEntryMap,
  type SemesterResult,
  type UnitSelectionMap,
  type YearResult,
} from "./calculation"
import { fetchPlan } from "./data"
import {
  loadCalculation,
  removeCalculation,
  saveCalculation,
} from "./persistence"

export interface CalculatorState {
  parcours: ParcoursIndexEntry | null
  academicYear: number | null
  plan: Awaited<ReturnType<typeof fetchPlan>> | null
  planLoading: boolean
  planError: string | null
  selections: UnitSelectionMap
  grades: GradeEntryMap
  directUeGrades: DirectUeGradeMap
  invalidStateCleared: boolean
}

export interface CalculatorActions {
  selectParcours: (entry: ParcoursIndexEntry | null) => void
  selectYear: (year: number) => void
  setUeIncluded: (ueCode: string, included: boolean) => void
  chooseOptionalUe: (ueCode: string, groupCodes: string[]) => void
  setSubjectGrade: (subjectCode: string, entry: SubjectGradeEntry | null) => void
  setDirectUeGrade: (ueCode: string, grade: number | null) => void
  setFormulaOverride: (subjectCode: string, formula: FormulaConfig) => void
  resetCalculation: () => void
  retryLoadPlan: () => void
}

function buildSnapshotFromState(
  parcoursCode: string,
  academicYear: number,
  selections: UnitSelectionMap,
  grades: GradeEntryMap,
  directUeGrades: DirectUeGradeMap
): CalculationSnapshot {
  return {
    schemaVersion: 1,
    parcoursCode,
    academicYear,
    unitSelections: { ...selections },
    subjectGrades: { ...grades },
    directUeGrades: { ...directUeGrades },
  }
}

export function useCalculator(): CalculatorState & CalculatorActions {
  const [parcours, setParcours] = useState<ParcoursIndexEntry | null>(null)
  const [academicYear, setAcademicYear] = useState<number | null>(null)
  const [plan, setPlan] = useState<Awaited<ReturnType<typeof fetchPlan>> | null>(
    null
  )
  const [planLoading, setPlanLoading] = useState(false)
  const [planError, setPlanError] = useState<string | null>(null)
  const [selections, setSelections] = useState<UnitSelectionMap>({})
  const [grades, setGrades] = useState<GradeEntryMap>({})
  const [directUeGrades, setDirectUeGrades] = useState<DirectUeGradeMap>({})
  const [invalidStateCleared, setInvalidStateCleared] = useState(false)

  const selectParcours = useCallback((entry: ParcoursIndexEntry | null) => {
    setParcours(entry)
    setAcademicYear(null)
    setPlan(null)
    setPlanError(null)
    setPlanLoading(entry !== null && entry?.hasPlan !== false)
    setSelections({})
    setGrades({})
    setDirectUeGrades({})
    setInvalidStateCleared(false)
  }, [])

  const selectYear = useCallback(
    (year: number) => {
      if (!parcours) return
      setAcademicYear(year)
      setInvalidStateCleared(false)
      if (plan) {
        const saved = loadCalculation(parcours.code, year)
        if (saved) {
          setSelections(saved.unitSelections)
          setGrades(saved.subjectGrades)
          setDirectUeGrades(saved.directUeGrades)
        } else {
          setSelections(getInitialSelections(plan.parcours.semesters))
          setGrades({})
          setDirectUeGrades({})
        }
      }
    },
    [parcours, plan]
  )

  const latestYearRef = useRef<number | null>(null)

  useEffect(() => {
    latestYearRef.current = academicYear
  })

  useEffect(() => {
    if (!parcours || !parcours.hasPlan) return

    let cancelled = false

    fetchPlan(parcours.code)
      .then((loadedPlan) => {
        if (cancelled) return
        setPlan(loadedPlan)
        const year =
          latestYearRef.current ?? parcours.academicYears[0]?.year ?? 1
        if (latestYearRef.current === null) {
          setAcademicYear(year)
        }
        const saved = loadCalculation(parcours.code, year)
        if (saved) {
          setSelections(saved.unitSelections)
          setGrades(saved.subjectGrades)
          setDirectUeGrades(saved.directUeGrades)
        } else {
          setSelections(getInitialSelections(loadedPlan.parcours.semesters))
          setGrades({})
          setDirectUeGrades({})
        }
        setInvalidStateCleared(false)
      })
      .catch((err) => {
        if (cancelled) return
        setPlanError(err instanceof Error ? err.message : String(err))
      })
      .finally(() => {
        if (!cancelled) setPlanLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [parcours])

  useEffect(() => {
    if (!parcours || academicYear === null) return
    const snapshot = buildSnapshotFromState(
      parcours.code,
      academicYear,
      selections,
      grades,
      directUeGrades
    )
    saveCalculation(snapshot)
  }, [parcours, academicYear, selections, grades, directUeGrades])

  const setUeIncluded = useCallback((ueCode: string, included: boolean) => {
    setSelections((prev) => ({
      ...prev,
      [ueCode]: { ...prev[ueCode], included },
    }))
  }, [])

  const chooseOptionalUe = useCallback(
    (ueCode: string, groupCodes: string[]) => {
      setSelections((prev) => {
        const next = { ...prev }
        for (const code of groupCodes) {
          if (code === ueCode) {
            next[code] = { ...next[code], included: true, chosenOptionCode: ueCode }
          } else {
            next[code] = { ...next[code], included: false, chosenOptionCode: ueCode }
          }
        }
        return next
      })
    },
    []
  )

  const setSubjectGrade = useCallback(
    (subjectCode: string, entry: SubjectGradeEntry | null) => {
      setGrades((prev) => {
        const next = { ...prev }
        if (entry === null) {
          delete next[subjectCode]
        } else {
          next[subjectCode] = entry
        }
        return next
      })
    },
    []
  )

  const setDirectUeGrade = useCallback(
    (ueCode: string, grade: number | null) => {
      setDirectUeGrades((prev) => {
        const next = { ...prev }
        if (grade === null) {
          delete next[ueCode]
        } else {
          next[ueCode] = grade
        }
        return next
      })
    },
    []
  )

  const setFormulaOverride = useCallback(
    (subjectCode: string, formula: FormulaConfig) => {
      setGrades((prev) => {
        const existing = prev[subjectCode]
        if (existing && existing.mode === "components") {
          return {
            ...prev,
            [subjectCode]: { ...existing, formula },
          }
        }
        return {
          ...prev,
          [subjectCode]: { mode: "components", components: {}, formula },
        }
      })
    },
    []
  )

  const resetCalculation = useCallback(() => {
    if (!parcours || academicYear === null) return
    removeCalculation(parcours.code, academicYear)
    setGrades({})
    setDirectUeGrades({})
    setSelections(getInitialSelections(plan?.parcours.semesters ?? []))
  }, [parcours, academicYear, plan])

  const retryLoadPlan = useCallback(() => {
    if (!parcours || !parcours.hasPlan) return
    setPlanLoading(true)
    setPlanError(null)
    fetchPlan(parcours.code)
      .then((loadedPlan) => {
        setPlan(loadedPlan)
        if (academicYear === null) {
          setAcademicYear(parcours.academicYears[0]?.year ?? 1)
        }
      })
      .catch((err) => {
        setPlanError(err instanceof Error ? err.message : String(err))
      })
      .finally(() => {
        setPlanLoading(false)
      })
  }, [parcours, academicYear])

  return {
    parcours,
    academicYear,
    plan,
    planLoading,
    planError,
    selections,
    grades,
    directUeGrades,
    invalidStateCleared,
    selectParcours,
    selectYear,
    setUeIncluded,
    chooseOptionalUe,
    setSubjectGrade,
    setDirectUeGrade,
    setFormulaOverride,
    resetCalculation,
    retryLoadPlan,
  }
}

export function useYearResult(
  plan: ParcoursPlanFile | null,
  academicYear: number | null,
  selections: UnitSelectionMap,
  grades: GradeEntryMap,
  directUeGrades: DirectUeGradeMap
): YearResult | null {
  return useMemo(() => {
    if (!plan || academicYear === null) return null
    return calculateYearResult(
      plan.parcours,
      academicYear,
      selections,
      grades,
      directUeGrades
    )
  }, [plan, academicYear, selections, grades, directUeGrades])
}

export function useSemesterResult(
  plan: ParcoursPlanFile | null,
  semesterNumber: number,
  selections: UnitSelectionMap,
  grades: GradeEntryMap,
  directUeGrades: DirectUeGradeMap
): SemesterResult | null {
  return useMemo(() => {
    if (!plan) return null
    const semester = plan.parcours.semesters.find(
      (s: Semester) => s.number === semesterNumber
    )
    if (!semester) return null
    return calculateSemesterResult(
      semester,
      selections,
      grades,
      directUeGrades
    )
  }, [plan, semesterNumber, selections, grades, directUeGrades])
}

export function useOptionalGroups(
  plan: ParcoursPlanFile | null
): Map<string, TeachingUnit[]> {
  return useMemo(() => {
    if (!plan) return new Map()
    return detectOptionalGroups(plan.parcours.semesters)
  }, [plan])
}

export {
  calculateSubjectGrade,
  calculateUeAverage,
  getDefaultFormula,
  normalizeRegime,
  shouldDefaultToDirectGrade,
}

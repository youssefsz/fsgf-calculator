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
import {
  encodeShareSnapshot,
  readShareMetadataFromUrl,
  readShareSnapshotFromUrl,
  SHARE_QUERY_PARAM,
  type ShareSnapshotMetadata,
} from "./share-url"

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
  hydratedFromShare: boolean
  shareSnapshot: ShareSnapshotMetadata | null
}

export interface CalculatorActions {
  selectParcours: (entry: ParcoursIndexEntry | null) => void
  selectYear: (year: number) => void
  setUeIncluded: (ueCode: string, included: boolean) => void
  chooseOptionalUe: (ueCode: string, groupCodes: string[]) => void
  setSubjectGrade: (
    subjectCode: string,
    entry: SubjectGradeEntry | null
  ) => void
  setDirectUeGrade: (ueCode: string, grade: number | null) => void
  setFormulaOverride: (subjectCode: string, formula: FormulaConfig) => void
  resetCalculation: () => void
  retryLoadPlan: () => void
  copyShareLink: () => Promise<boolean>
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

function restoreSharedSelections(
  plan: ParcoursPlanFile,
  sharedSelections: UnitSelectionMap
): UnitSelectionMap {
  return {
    ...getInitialSelections(plan.parcours.semesters),
    ...sharedSelections,
  }
}

export function useCalculator(): CalculatorState & CalculatorActions {
  const [parcours, setParcours] = useState<ParcoursIndexEntry | null>(null)
  const [academicYear, setAcademicYear] = useState<number | null>(null)
  const [plan, setPlan] = useState<Awaited<
    ReturnType<typeof fetchPlan>
  > | null>(null)
  const [planLoading, setPlanLoading] = useState(false)
  const [planError, setPlanError] = useState<string | null>(null)
  const [selections, setSelections] = useState<UnitSelectionMap>({})
  const [grades, setGrades] = useState<GradeEntryMap>({})
  const [directUeGrades, setDirectUeGrades] = useState<DirectUeGradeMap>({})
  const [invalidStateCleared, setInvalidStateCleared] = useState(false)
  const [hydratedFromShare, setHydratedFromShare] = useState(false)

  const [shareSearch] = useState(() => {
    if (typeof window === "undefined") return null
    return window.location.search
  })

  const [shareSnapshot] = useState<ShareSnapshotMetadata | null>(() => {
    if (!shareSearch) return null
    return readShareMetadataFromUrl(shareSearch)
  })

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
        const shared = shareSearch
          ? readShareSnapshotFromUrl(shareSearch, { plan: loadedPlan })
          : null
        const isMatchingShare =
          shared !== null &&
          shared.parcoursCode === parcours.code &&
          parcours.academicYears.some((y) => y.year === shared.academicYear)
        if (isMatchingShare && shared) {
          const year = shared.academicYear
          if (latestYearRef.current === null) {
            setAcademicYear(year)
          }
          setSelections(
            restoreSharedSelections(loadedPlan, shared.unitSelections)
          )
          setGrades(shared.subjectGrades)
          setDirectUeGrades(shared.directUeGrades)
          setHydratedFromShare(true)
        } else {
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
          setHydratedFromShare(false)
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
    // shareSearch is intentionally excluded: it is a mount-time constant
    // read from window.location.search via useState lazy init, and adding
    // it to deps would re-fetch the plan on every state change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  useEffect(() => {
    if (typeof window === "undefined") return
    if (!parcours || academicYear === null) return
    if (planLoading) return
    const snapshot = buildSnapshotFromState(
      parcours.code,
      academicYear,
      selections,
      grades,
      directUeGrades
    )
    const token = encodeShareSnapshot(snapshot, {
      plan,
      defaultUnitSelections: plan
        ? getInitialSelections(plan.parcours.semesters)
        : undefined,
    })
    const url = new URL(window.location.href)
    if (url.searchParams.get(SHARE_QUERY_PARAM) === token) return
    url.searchParams.set(SHARE_QUERY_PARAM, token)
    const next = `${url.pathname}?${url.searchParams.toString()}${url.hash}`
    window.history.replaceState(window.history.state, "", next)
  }, [
    parcours,
    academicYear,
    selections,
    grades,
    directUeGrades,
    planLoading,
    plan,
  ])

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
            next[code] = {
              ...next[code],
              included: true,
              chosenOptionCode: ueCode,
            }
          } else {
            next[code] = {
              ...next[code],
              included: false,
              chosenOptionCode: ueCode,
            }
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

  const copyShareLink = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined") return false
    if (!parcours || academicYear === null) return false
    const url = window.location.href
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
        return true
      }
    } catch {
      return false
    }
    return false
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
    hydratedFromShare,
    shareSnapshot,
    selectParcours,
    selectYear,
    setUeIncluded,
    chooseOptionalUe,
    setSubjectGrade,
    setDirectUeGrade,
    setFormulaOverride,
    resetCalculation,
    retryLoadPlan,
    copyShareLink,
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
    return calculateSemesterResult(semester, selections, grades, directUeGrades)
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

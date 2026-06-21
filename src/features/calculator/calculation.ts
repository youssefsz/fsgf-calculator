import type {
  FormulaConfig,
  ParcoursPlan,
  Semester,
  Subject,
  SubjectGradeEntry,
  TeachingUnit,
  TeachingUnitSelection,
} from "@/lib/schemas"

export interface SubjectResult {
  subjectCode: string
  subjectName: string
  coefficient: number
  grade: number | null
  isComplete: boolean
  mode: SubjectGradeEntry["mode"]
}

export interface UeResult {
  ueCode: string
  ueName: string
  coefficient: number
  average: number | null
  partialAverage: number | null
  subjects: SubjectResult[]
  isComplete: boolean
  hasAnyGrade: boolean
  directGrade: number | null
}

export interface SemesterResult {
  semesterNumber: number
  average: number | null
  partialAverage: number | null
  includedUeResults: UeResult[]
  isComplete: boolean
  hasAnyGrade: boolean
  includedCoefficients: number
  totalCoefficients: number
}

export interface YearResult {
  average: number | null
  isComplete: boolean
  hasAnyGrade: boolean
  semesterResults: SemesterResult[]
}

export type GradeEntryMap = Record<string, SubjectGradeEntry>
export type UnitSelectionMap = Record<string, TeachingUnitSelection>
export type DirectUeGradeMap = Record<string, number>

export const DEFAULT_MX_WITH_TP: FormulaConfig = {
  exam: 0.7,
  ds: 0.2,
  tp: 0.1,
}

export const DEFAULT_MX_WITHOUT_TP: FormulaConfig = {
  exam: 0.7,
  ds: 0.3,
  tp: 0,
}

export const DEFAULT_CC: FormulaConfig = {
  exam: 0.8,
  ds: 0,
  tp: 0.2,
}

export function normalizeRegime(regime: string): string {
  return regime.trim().toUpperCase()
}

export function isPfeOrProjectLike(name: string): boolean {
  const lowered = name.toLowerCase()
  const markers = [
    "pfe",
    "projet de fin",
    "stage",
    "internship",
    "mémoire",
    "memoire",
    "thesis",
    "projet",
  ]
  return markers.some((m) => lowered.includes(m))
}

export function shouldDefaultToDirectGrade(subject: Subject): boolean {
  const regime = normalizeRegime(subject.exam_regime)
  if (regime !== "MX" && regime !== "CC") return true
  if (isPfeOrProjectLike(subject.name)) return true
  if (
    subject.hours.course === 0 &&
    subject.hours.tutorial === 0 &&
    subject.hours.practical === 0
  ) {
    return true
  }
  return false
}

export function getDefaultFormula(subject: Subject): FormulaConfig {
  const regime = normalizeRegime(subject.exam_regime)
  const hasTp = (subject.hours.practical ?? 0) > 0

  if (regime === "CC") {
    return DEFAULT_CC
  }

  if (regime === "MX") {
    return hasTp ? DEFAULT_MX_WITH_TP : DEFAULT_MX_WITHOUT_TP
  }

  return DEFAULT_MX_WITHOUT_TP
}

export function calculateSubjectGrade(
  subject: Subject,
  entry: SubjectGradeEntry | undefined
): { grade: number | null; isComplete: boolean } {
  if (!entry) {
    return { grade: null, isComplete: false }
  }

  if (entry.mode === "direct") {
    return { grade: entry.direct, isComplete: true }
  }

  const formula = entry.formula ?? getDefaultFormula(subject)
  const components = entry.components

  const exam = components.exam
  const ds = components.ds
  const tp = components.tp

  if (formula.exam > 0 && exam === undefined) {
    return { grade: null, isComplete: false }
  }
  if (formula.ds > 0 && ds === undefined) {
    return { grade: null, isComplete: false }
  }
  if (formula.tp > 0 && tp === undefined) {
    return { grade: null, isComplete: false }
  }

  const totalWeight = formula.exam + formula.ds + formula.tp
  if (Math.abs(totalWeight - 1) > 0.0001) {
    return { grade: null, isComplete: false }
  }

  let grade = 0
  if (exam !== undefined) grade += exam * formula.exam
  if (ds !== undefined) grade += ds * formula.ds
  if (tp !== undefined) grade += tp * formula.tp

  return { grade, isComplete: true }
}

export function calculateUeAverage(
  ue: TeachingUnit,
  grades: GradeEntryMap,
  directUeGrade: number | undefined
): UeResult {
  const subjects: SubjectResult[] = ue.subjects.map((subject) => {
    const entry = grades[subject.code]
    const { grade, isComplete } = calculateSubjectGrade(subject, entry)
    return {
      subjectCode: subject.code,
      subjectName: subject.name,
      coefficient: subject.coefficient,
      grade,
      isComplete,
      mode: entry?.mode ?? "components",
    }
  })

  const hasSubjectRows = ue.subjects.length > 0

  if (!hasSubjectRows) {
    const complete = directUeGrade !== undefined
    return {
      ueCode: ue.code,
      ueName: ue.name,
      coefficient: ue.coefficient,
      average: complete ? directUeGrade : null,
      partialAverage: complete ? directUeGrade : null,
      subjects: [],
      isComplete: complete,
      hasAnyGrade: complete,
      directGrade: directUeGrade ?? null,
    }
  }

  let weightedSum = 0
  let coefficientSum = 0
  let partialWeightedSum = 0
  let partialCoefficientSum = 0
  let isComplete = true
  let hasAnyGrade = false

  for (const subject of subjects) {
    if (subject.grade !== null) {
      hasAnyGrade = true
      partialWeightedSum += subject.grade * subject.coefficient
      partialCoefficientSum += subject.coefficient
      if (subject.isComplete) {
        weightedSum += subject.grade * subject.coefficient
        coefficientSum += subject.coefficient
      }
    }
    if (!subject.isComplete) {
      isComplete = false
    }
  }

  const average =
    coefficientSum > 0 && isComplete ? weightedSum / coefficientSum : null
  const partialAverage =
    partialCoefficientSum > 0 ? partialWeightedSum / partialCoefficientSum : null

  return {
    ueCode: ue.code,
    ueName: ue.name,
    coefficient: ue.coefficient,
    average,
    partialAverage,
    subjects,
    isComplete,
    hasAnyGrade,
    directGrade: null,
  }
}

export function calculateSemesterResult(
  semester: Semester,
  selections: UnitSelectionMap,
  grades: GradeEntryMap,
  directUeGrades: DirectUeGradeMap
): SemesterResult {
  const includedUeResults: UeResult[] = []
  let totalCoefficient = 0
  let includedCoefficient = 0
  let weightedSum = 0
  let partialWeightedSum = 0
  let isComplete = true
  let hasAnyGrade = false

  for (const ue of semester.teaching_units) {
    totalCoefficient += ue.coefficient
    const selection = selections[ue.code]
    if (selection?.included === false) continue

    const ueResult = calculateUeAverage(ue, grades, directUeGrades[ue.code])
    includedUeResults.push(ueResult)
    includedCoefficient += ue.coefficient

    if (ueResult.hasAnyGrade) {
      hasAnyGrade = true
    }

    if (ueResult.average !== null) {
      weightedSum += ueResult.average * ue.coefficient
      partialWeightedSum += ueResult.average * ue.coefficient
    } else if (ueResult.partialAverage !== null) {
      partialWeightedSum += ueResult.partialAverage * ue.coefficient
      isComplete = false
    } else {
      isComplete = false
    }

    if (!ueResult.isComplete) {
      isComplete = false
    }
  }

  const average =
    includedCoefficient > 0 && isComplete
      ? weightedSum / includedCoefficient
      : null
  const partialAverage =
    includedCoefficient > 0 ? partialWeightedSum / includedCoefficient : null

  return {
    semesterNumber: semester.number,
    average,
    partialAverage,
    includedUeResults,
    isComplete,
    hasAnyGrade,
    includedCoefficients: includedCoefficient,
    totalCoefficients: totalCoefficient,
  }
}

export function calculateYearResult(
  plan: ParcoursPlan,
  academicYear: number,
  selections: UnitSelectionMap,
  grades: GradeEntryMap,
  directUeGrades: DirectUeGradeMap
): YearResult {
  const expectedSemesters: number[] =
    academicYear === 1 ? [1, 2]
    : academicYear === 2 ? [3, 4]
    : [5, 6]

  const semesterResults: SemesterResult[] = []
  let completeCount = 0
  let partialSum = 0
  let hasAnyGrade = false
  let isComplete = true

  for (const semesterNumber of expectedSemesters) {
    const semester = plan.semesters.find((s) => s.number === semesterNumber)
    if (!semester) {
      isComplete = false
      continue
    }

    const result = calculateSemesterResult(
      semester,
      selections,
      grades,
      directUeGrades
    )
    semesterResults.push(result)

    if (result.hasAnyGrade) {
      hasAnyGrade = true
    }

    if (result.average !== null) {
      partialSum += result.average
      completeCount += 1
    } else if (result.partialAverage !== null) {
      partialSum += result.partialAverage
      isComplete = false
    } else {
      isComplete = false
    }

    if (!result.isComplete) {
      isComplete = false
    }
  }

  const average =
    completeCount === expectedSemesters.length && isComplete
      ? partialSum / expectedSemesters.length
      : null

  return {
    average,
    isComplete,
    hasAnyGrade,
    semesterResults,
  }
}

export function detectOptionalGroups(
  semesters: Semester[]
): Map<string, TeachingUnit[]> {
  const groups = new Map<string, TeachingUnit[]>()

  for (const semester of semesters) {
    const seen = new Map<string, TeachingUnit[]>()
    for (const ue of semester.teaching_units) {
      const key = `${ue.name}|${ue.coefficient}|${ue.credits}`
      const list = seen.get(key) ?? []
      list.push(ue)
      seen.set(key, list)
    }
    for (const list of seen.values()) {
      if (list.length > 1) {
        const groupKey = list.map((u) => u.code).sort().join(",")
        groups.set(groupKey, list)
      }
    }
  }

  return groups
}

export function getInitialSelections(semesters: Semester[]): UnitSelectionMap {
  const selections: UnitSelectionMap = {}
  const optionalGroups = detectOptionalGroups(semesters)
  const groupedCodes = new Set<string>()
  for (const group of optionalGroups.values()) {
    for (const ue of group) {
      groupedCodes.add(ue.code)
    }
  }

  for (const semester of semesters) {
    for (const ue of semester.teaching_units) {
      if (groupedCodes.has(ue.code)) {
        selections[ue.code] = { included: false }
      } else {
        selections[ue.code] = { included: true }
      }
    }
  }

  return selections
}

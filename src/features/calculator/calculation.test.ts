import { describe, expect, it } from "vitest"

import {
  subjectGradeEntrySchema,
  type FormulaConfig,
  type ParcoursPlan,
  type Semester,
  type Subject,
  type TeachingUnit,
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
  type UnitSelectionMap,
} from "./calculation"

function createSubject(
  code: string,
  name: string,
  regime: string,
  coefficient = 1,
  hours: Partial<Subject["hours"]> = {}
): Subject {
  return {
    code,
    name,
    coefficient,
    credits: null,
    exam_regime: regime,
    hours: {
      course: hours.course ?? 21,
      tutorial: hours.tutorial ?? 0,
      practical: hours.practical ?? 0,
      integrated_course: null,
      total: null,
    },
  }
}

function createUe(
  code: string,
  name: string,
  coefficient: number,
  subjects: Subject[] = []
): TeachingUnit {
  return {
    code,
    name,
    credits: 4,
    coefficient,
    nature: "Fond",
    exam_regime: "MX",
    subjects,
  }
}

function createSemester(number: number, teaching_units: TeachingUnit[]): Semester {
  return { number, teaching_units }
}

function createPlan(semesters: Semester[]): ParcoursPlan {
  return {
    code: "TEST01",
    listed_type: "Licence",
    listed_domain: "Sciences",
    listed_mention: "Test",
    listed_specialty: "Test Specialty",
    source_url: "http://example.com",
    semesters,
    warnings: [],
    scrape_status: "ok",
  }
}

describe("normalizeRegime", () => {
  it("normalizes mx to MX", () => {
    expect(normalizeRegime("mx")).toBe("MX")
  })

  it("normalizes cc to CC", () => {
    expect(normalizeRegime("cc")).toBe("CC")
  })

  it("trims whitespace", () => {
    expect(normalizeRegime("  CC  ")).toBe("CC")
  })
})

describe("getDefaultFormula", () => {
  it("returns MX 70/20/10 when practical hours are greater than 0", () => {
    const subject = createSubject("S1", "Math", "MX", 1, { practical: 10 })
    expect(getDefaultFormula(subject)).toEqual({ exam: 0.7, ds: 0.2, tp: 0.1 })
  })

  it("returns MX 70/30 when practical hours are 0", () => {
    const subject = createSubject("S1", "Math", "MX", 1, { practical: 0 })
    expect(getDefaultFormula(subject)).toEqual({ exam: 0.7, ds: 0.3, tp: 0 })
  })

  it("returns CC 80/20 for continuous assessment", () => {
    const subject = createSubject("S1", "English", "CC")
    expect(getDefaultFormula(subject)).toEqual({ exam: 0.8, ds: 0, tp: 0.2 })
  })

  it("falls back to MX 70/30 for unknown regime", () => {
    const subject = createSubject("S1", "Unknown", "EX")
    expect(getDefaultFormula(subject)).toEqual({ exam: 0.7, ds: 0.3, tp: 0 })
  })
})

describe("shouldDefaultToDirectGrade", () => {
  it("defaults unknown regime to direct", () => {
    const subject = createSubject("S1", "Math", "XX")
    expect(shouldDefaultToDirectGrade(subject)).toBe(true)
  })

  it("defaults PFE-like names to direct", () => {
    expect(shouldDefaultToDirectGrade(createSubject("S1", "PFE", "MX"))).toBe(true)
    expect(shouldDefaultToDirectGrade(createSubject("S1", "Projet", "MX"))).toBe(true)
    expect(
      shouldDefaultToDirectGrade(createSubject("S1", "Internship", "MX"))
    ).toBe(true)
  })

  it("defaults zero-hour subjects to direct", () => {
    const subject = createSubject("S1", "Empty", "MX", 1, {
      course: 0,
      tutorial: 0,
      practical: 0,
    })
    expect(shouldDefaultToDirectGrade(subject)).toBe(true)
  })

  it("does not default MX/CC subjects to direct", () => {
    const subject = createSubject("S1", "Math", "MX", 1, {
      course: 21,
      practical: 10,
    })
    expect(shouldDefaultToDirectGrade(subject)).toBe(false)
  })
})

describe("calculateSubjectGrade", () => {
  it("calculates MX 70/20/10 with practical hours", () => {
    const subject = createSubject("S1", "Math", "MX", 1, { practical: 10 })
    const entry = {
      mode: "components" as const,
      components: { exam: 10, ds: 12, tp: 14 },
    }
    const result = calculateSubjectGrade(subject, entry)
    expect(result.grade).toBeCloseTo(10 * 0.7 + 12 * 0.2 + 14 * 0.1, 10)
    expect(result.isComplete).toBe(true)
  })

  it("calculates MX 70/30 without practical hours", () => {
    const subject = createSubject("S1", "Math", "MX", 1, { practical: 0 })
    const entry = {
      mode: "components" as const,
      components: { exam: 10, ds: 12 },
    }
    const result = calculateSubjectGrade(subject, entry)
    expect(result.grade).toBeCloseTo(10 * 0.7 + 12 * 0.3, 10)
    expect(result.isComplete).toBe(true)
  })

  it("calculates CC 80/20", () => {
    const subject = createSubject("S1", "English", "CC")
    const entry = {
      mode: "components" as const,
      components: { exam: 14, tp: 16 },
    }
    const result = calculateSubjectGrade(subject, entry)
    expect(result.grade).toBeCloseTo(14 * 0.8 + 16 * 0.2, 10)
    expect(result.isComplete).toBe(true)
  })

  it("uses direct final-grade override", () => {
    const subject = createSubject("S1", "Math", "MX")
    const entry = { mode: "direct" as const, direct: 15.5 }
    const result = calculateSubjectGrade(subject, entry)
    expect(result.grade).toBe(15.5)
    expect(result.isComplete).toBe(true)
  })

  it("handles grade zero", () => {
    const subject = createSubject("S1", "Math", "MX", 1, { practical: 10 })
    const entry = {
      mode: "components" as const,
      components: { exam: 0, ds: 0, tp: 0 },
    }
    expect(calculateSubjectGrade(subject, entry).grade).toBe(0)
  })

  it("handles grade twenty", () => {
    const subject = createSubject("S1", "Math", "MX", 1, { practical: 10 })
    const entry = {
      mode: "components" as const,
      components: { exam: 20, ds: 20, tp: 20 },
    }
    expect(calculateSubjectGrade(subject, entry).grade).toBe(20)
  })

  it("calculates decimal inputs with full precision", () => {
    const subject = createSubject("S1", "Math", "MX", 1, { practical: 10 })
    const entry = {
      mode: "components" as const,
      components: { exam: 12.34, ds: 10.56, tp: 8.91 },
    }
    const result = calculateSubjectGrade(subject, entry)
    expect(result.grade).toBeCloseTo(
      12.34 * 0.7 + 10.56 * 0.2 + 8.91 * 0.1,
      10
    )
  })

  it("is incomplete when a required component is missing", () => {
    const subject = createSubject("S1", "Math", "MX", 1, { practical: 10 })
    const entry = {
      mode: "components" as const,
      components: { exam: 10, ds: 12 },
    }
    const result = calculateSubjectGrade(subject, entry)
    expect(result.grade).toBeNull()
    expect(result.isComplete).toBe(false)
  })

  it("is incomplete when formula total is not 100%", () => {
    const subject = createSubject("S1", "Math", "MX")
    const formula: FormulaConfig = { exam: 0.6, ds: 0.2, tp: 0.1 }
    const entry = {
      mode: "components" as const,
      components: { exam: 10, ds: 12, tp: 14 },
      formula,
    }
    const result = calculateSubjectGrade(subject, entry)
    expect(result.grade).toBeNull()
    expect(result.isComplete).toBe(false)
  })

  it("is incomplete when no entry exists", () => {
    const subject = createSubject("S1", "Math", "MX")
    expect(calculateSubjectGrade(subject, undefined).grade).toBeNull()
  })

  it("excludes empty components from averages", () => {
    const subject = createSubject("S1", "Math", "MX")
    const entry = {
      mode: "components" as const,
      components: { exam: 10 },
    }
    const result = calculateSubjectGrade(subject, entry)
    expect(result.grade).toBeNull()
    expect(result.isComplete).toBe(false)
  })

  it("uses custom weights totaling 100%", () => {
    const subject = createSubject("S1", "Math", "MX")
    const formula: FormulaConfig = { exam: 0.5, ds: 0.3, tp: 0.2 }
    const entry = {
      mode: "components" as const,
      components: { exam: 10, ds: 12, tp: 14 },
      formula,
    }
    const result = calculateSubjectGrade(subject, entry)
    expect(result.grade).toBeCloseTo(10 * 0.5 + 12 * 0.3 + 14 * 0.2, 10)
  })
})

describe("calculateUeAverage", () => {
  it("calculates a subject-weighted UE average", () => {
    const ue = createUe("UE1", "Math", 2, [
      createSubject("S1", "A", "MX", 1),
      createSubject("S2", "B", "MX", 2),
    ])
    const grades: GradeEntryMap = {
      S1: { mode: "direct", direct: 10 },
      S2: { mode: "direct", direct: 16 },
    }
    const result = calculateUeAverage(ue, grades, undefined)
    expect(result.average).toBeCloseTo((10 * 1 + 16 * 2) / 3, 10)
    expect(result.isComplete).toBe(true)
  })

  it("returns partial average when some subjects are empty", () => {
    const ue = createUe("UE1", "Math", 2, [
      createSubject("S1", "A", "MX", 1),
      createSubject("S2", "B", "MX", 2),
    ])
    const grades: GradeEntryMap = {
      S1: { mode: "direct", direct: 10 },
    }
    const result = calculateUeAverage(ue, grades, undefined)
    expect(result.average).toBeNull()
    expect(result.partialAverage).toBe(10)
    expect(result.isComplete).toBe(false)
    expect(result.hasAnyGrade).toBe(true)
  })

  it("falls back to direct UE grade for UEs with no subject rows", () => {
    const ue = createUe("UE1", "No Subjects", 3, [])
    const result = calculateUeAverage(ue, {}, 14)
    expect(result.average).toBe(14)
    expect(result.isComplete).toBe(true)
    expect(result.directGrade).toBe(14)
  })

  it("returns null when empty direct UE grade is missing", () => {
    const ue = createUe("UE1", "No Subjects", 3, [])
    const result = calculateUeAverage(ue, {}, undefined)
    expect(result.average).toBeNull()
    expect(result.isComplete).toBe(false)
  })
})

describe("calculateSemesterResult", () => {
  it("calculates a semester average using UE coefficients", () => {
    const semester = createSemester(1, [
      createUe("UE1", "A", 2, [
        createSubject("S1", "A1", "MX", 1),
      ]),
      createUe("UE2", "B", 3, [
        createSubject("S2", "B1", "MX", 1),
      ]),
    ])
    const grades: GradeEntryMap = {
      S1: { mode: "direct", direct: 10 },
      S2: { mode: "direct", direct: 20 },
    }
    const result = calculateSemesterResult(semester, {}, grades, {})
    expect(result.average).toBeCloseTo((10 * 2 + 20 * 3) / 5, 10)
    expect(result.isComplete).toBe(true)
  })

  it("produces a partial average for incomplete semesters", () => {
    const semester = createSemester(1, [
      createUe("UE1", "A", 2, [
        createSubject("S1", "A1", "MX", 1),
      ]),
      createUe("UE2", "B", 3, [
        createSubject("S2", "B1", "MX", 1),
      ]),
    ])
    const grades: GradeEntryMap = {
      S1: { mode: "direct", direct: 10 },
    }
    const result = calculateSemesterResult(semester, {}, grades, {})
    expect(result.average).toBeNull()
    expect(result.partialAverage).toBeCloseTo((10 * 2) / 5, 10)
    expect(result.isComplete).toBe(false)
  })

  it("excludes UEs marked as not included", () => {
    const semester = createSemester(1, [
      createUe("UE1", "A", 2, [
        createSubject("S1", "A1", "MX", 1),
      ]),
      createUe("UE2", "B", 3, [
        createSubject("S2", "B1", "MX", 1),
      ]),
    ])
    const selections: UnitSelectionMap = { UE2: { included: false } }
    const grades: GradeEntryMap = {
      S1: { mode: "direct", direct: 10 },
      S2: { mode: "direct", direct: 20 },
    }
    const result = calculateSemesterResult(semester, selections, grades, {})
    expect(result.average).toBe(10)
    expect(result.includedCoefficients).toBe(2)
    expect(result.totalCoefficients).toBe(5)
    expect(result.includedUeResults).toHaveLength(1)
  })
})

describe("calculateYearResult", () => {
  it("calculates an equal-semester yearly average", () => {
    const plan = createPlan([
      createSemester(1, [
        createUe("UE1", "A", 1, [createSubject("S1", "A1", "MX", 1)]),
      ]),
      createSemester(2, [
        createUe("UE2", "B", 1, [createSubject("S2", "B1", "MX", 1)]),
      ]),
    ])
    const grades: GradeEntryMap = {
      S1: { mode: "direct", direct: 10 },
      S2: { mode: "direct", direct: 20 },
    }
    const result = calculateYearResult(plan, 1, {}, grades, {})
    expect(result.average).toBe(15)
    expect(result.isComplete).toBe(true)
  })

  it("returns null yearly average for partial calculations", () => {
    const plan = createPlan([
      createSemester(1, [
        createUe("UE1", "A", 1, [createSubject("S1", "A1", "MX", 1)]),
      ]),
      createSemester(2, [
        createUe("UE2", "B", 1, [createSubject("S2", "B1", "MX", 1)]),
      ]),
    ])
    const grades: GradeEntryMap = {
      S1: { mode: "direct", direct: 10 },
    }
    const result = calculateYearResult(plan, 1, {}, grades, {})
    expect(result.average).toBeNull()
    expect(result.isComplete).toBe(false)
    expect(result.hasAnyGrade).toBe(true)
  })

  it("handles missing semesters gracefully", () => {
    const plan = createPlan([
      createSemester(1, [
        createUe("UE1", "A", 1, [createSubject("S1", "A1", "MX", 1)]),
      ]),
    ])
    const grades: GradeEntryMap = {
      S1: { mode: "direct", direct: 10 },
    }
    const result = calculateYearResult(plan, 1, {}, grades, {})
    expect(result.average).toBeNull()
    expect(result.isComplete).toBe(false)
  })
})

describe("detectOptionalGroups", () => {
  it("groups UEs with the same name, coefficient, and credits", () => {
    const semester = createSemester(1, [
      createUe("UE1", "Option", 2, [createSubject("S1", "A", "MX", 1)]),
      createUe("UE2", "Option", 2, [createSubject("S2", "B", "MX", 1)]),
      createUe("UE3", "Core", 3, [createSubject("S3", "C", "MX", 1)]),
    ])
    const groups = detectOptionalGroups([semester])
    expect(groups.size).toBe(1)
    const group = [...groups.values()][0]
    expect(group).toHaveLength(2)
    expect(group.map((u) => u.code).sort()).toEqual(["UE1", "UE2"])
  })
})

describe("getInitialSelections", () => {
  it("excludes optional group UEs by default", () => {
    const semester = createSemester(1, [
      createUe("UE1", "Option", 2, [createSubject("S1", "A", "MX", 1)]),
      createUe("UE2", "Option", 2, [createSubject("S2", "B", "MX", 1)]),
      createUe("UE3", "Core", 3, [createSubject("S3", "C", "MX", 1)]),
    ])
    const selections = getInitialSelections([semester])
    expect(selections.UE1).toEqual({ included: false })
    expect(selections.UE2).toEqual({ included: false })
    expect(selections.UE3).toEqual({ included: true })
  })
})

describe("unknown regime behavior", () => {
  it("defaults to direct grade behavior for unknown regime", () => {
    const subject = createSubject("S1", "Custom", "UNKNOWN")
    const entry = { mode: "direct" as const, direct: 13 }
    const result = calculateSubjectGrade(subject, entry)
    expect(result.grade).toBe(13)
  })
})

describe("invalid values", () => {
  it("schema rejects negative values", () => {
    const negative = { mode: "direct" as const, direct: -1 }
    const result = subjectGradeEntrySchema.safeParse(negative)
    expect(result.success).toBe(false)
  })

  it("schema rejects values above twenty", () => {
    const tooHigh = { mode: "direct" as const, direct: 21 }
    const result = subjectGradeEntrySchema.safeParse(tooHigh)
    expect(result.success).toBe(false)
  })

})

describe("direct UE grade fallback", () => {
  it("uses direct UE grade even when other UEs have subjects", () => {
    const semester = createSemester(1, [
      createUe("UE1", "No Subjects", 2, []),
      createUe("UE2", "With Subjects", 3, [
        createSubject("S1", "A", "MX", 1),
      ]),
    ])
    const grades: GradeEntryMap = {
      S1: { mode: "direct", direct: 12 },
    }
    const directUeGrades: DirectUeGradeMap = { UE1: 18 }
    const result = calculateSemesterResult(semester, {}, grades, directUeGrades)
    expect(result.average).toBeCloseTo((18 * 2 + 12 * 3) / 5, 10)
    expect(result.isComplete).toBe(true)
  })
})

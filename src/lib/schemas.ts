import { z } from "zod"

export const CALCULATION_SCHEMA_VERSION = 1

export const hoursSchema = z.object({
  course: z.number().nullable(),
  tutorial: z.number().nullable(),
  practical: z.number().nullable(),
  integrated_course: z.number().nullable(),
  total: z.number().nullable(),
})

export const subjectSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  coefficient: z.number().nonnegative(),
  credits: z.number().nonnegative().nullable(),
  exam_regime: z.string(),
  hours: hoursSchema,
})

export const teachingUnitSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  credits: z.number().nonnegative(),
  coefficient: z.number().nonnegative(),
  nature: z.string(),
  exam_regime: z.string(),
  subjects: z.array(subjectSchema),
})

export const semesterSchema = z.object({
  number: z.number().int().min(1).max(6),
  teaching_units: z.array(teachingUnitSchema),
})

export const parcoursPlanSchema = z.object({
  code: z.string().min(1),
  listed_type: z.string(),
  listed_domain: z.string(),
  listed_mention: z.string(),
  listed_specialty: z.string(),
  source_url: z.string(),
  institution: z.string().optional(),
  degree_type: z.string().optional(),
  domain: z.string().optional(),
  mention: z.string().optional(),
  specialty: z.string().optional(),
  semesters: z.array(semesterSchema),
  warnings: z.array(z.string()),
  scrape_status: z.string(),
})

export const parcoursPlanFileSchema = z.object({
  schemaVersion: z.literal(1),
  university: z.string(),
  institution: z.string(),
  parcours: parcoursPlanSchema,
})

export const academicYearSchema = z.object({
  year: z.number().int().min(1).max(3),
  expectedSemesters: z.array(z.number().int().min(1).max(6)),
  availableSemesters: z.array(z.number().int().min(1).max(6)),
  complete: z.boolean(),
})

export const parcoursIndexEntrySchema = z.object({
  code: z.string().min(1),
  degreeType: z.string(),
  domain: z.string(),
  mention: z.string(),
  specialty: z.string(),
  hasPlan: z.boolean(),
  scrapeStatus: z.string(),
  availableSemesters: z.array(z.number().int().min(1).max(6)),
  academicYears: z.array(academicYearSchema),
  counts: z.object({
    semesters: z.number().int().nonnegative(),
    teachingUnits: z.number().int().nonnegative(),
    subjects: z.number().int().nonnegative(),
  }),
  dataFile: z.string().min(1),
})

export const parcoursIndexSchema = z.object({
  schemaVersion: z.literal(1),
  generatedAt: z.iso.datetime({ offset: true }),
  university: z.string(),
  institution: z.string(),
  establishmentId: z.string(),
  gradeCalculatorNote: z.string(),
  summary: z.object({
    parcours: z.number().int().nonnegative(),
    withPlan: z.number().int().nonnegative(),
    withoutPlan: z.number().int().nonnegative(),
    teachingUnits: z.number().int().nonnegative(),
    subjects: z.number().int().nonnegative(),
  }),
  parcours: z.array(parcoursIndexEntrySchema),
})

export type Hours = z.infer<typeof hoursSchema>
export type Subject = z.infer<typeof subjectSchema>
export type TeachingUnit = z.infer<typeof teachingUnitSchema>
export type Semester = z.infer<typeof semesterSchema>
export type ParcoursPlan = z.infer<typeof parcoursPlanSchema>
export type ParcoursPlanFile = z.infer<typeof parcoursPlanFileSchema>
export type AcademicYear = z.infer<typeof academicYearSchema>
export type ParcoursIndexEntry = z.infer<typeof parcoursIndexEntrySchema>
export type ParcoursIndex = z.infer<typeof parcoursIndexSchema>

export const componentGradesSchema = z.object({
  exam: z.number().min(0).max(20).optional(),
  ds: z.number().min(0).max(20).optional(),
  tp: z.number().min(0).max(20).optional(),
})

export const formulaConfigSchema = z.object({
  exam: z.number().min(0).max(1).multipleOf(0.01),
  ds: z.number().min(0).max(1).multipleOf(0.01),
  tp: z.number().min(0).max(1).multipleOf(0.01),
})

export const subjectGradeEntrySchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("components"),
    components: componentGradesSchema,
    formula: formulaConfigSchema.optional(),
  }),
  z.object({
    mode: z.literal("direct"),
    direct: z.number().min(0).max(20),
  }),
])

export const teachingUnitSelectionSchema = z.object({
  included: z.boolean(),
  chosenOptionCode: z.string().nullable().optional(),
})

export const calculationSnapshotSchema = z.object({
  schemaVersion: z.literal(CALCULATION_SCHEMA_VERSION),
  parcoursCode: z.string().min(1),
  academicYear: z.number().int().min(1).max(3),
  unitSelections: z.record(z.string(), teachingUnitSelectionSchema),
  subjectGrades: z.record(z.string(), subjectGradeEntrySchema),
  directUeGrades: z.record(z.string(), z.number().min(0).max(20)),
})

export const savedPreferencesSchema = z.object({
  schemaVersion: z.literal(1),
  locale: z.enum(["en", "fr"]),
})

export type ComponentGrades = z.infer<typeof componentGradesSchema>
export type FormulaConfig = z.infer<typeof formulaConfigSchema>
export type SubjectGradeEntry = z.infer<typeof subjectGradeEntrySchema>
export type TeachingUnitSelection = z.infer<typeof teachingUnitSelectionSchema>
export type CalculationSnapshot = z.infer<typeof calculationSnapshotSchema>
export type SavedPreferences = z.infer<typeof savedPreferencesSchema>

export function assertFormulaTotalsOneHundred(formula: FormulaConfig): boolean {
  const total = formula.exam + formula.ds + formula.tp
  return Math.abs(total - 1) < 0.0001
}

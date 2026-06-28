import {
  CALCULATION_SCHEMA_VERSION,
  calculationSnapshotSchema,
  type CalculationSnapshot,
  type ComponentGrades,
  type FormulaConfig,
  type ParcoursPlanFile,
  type Semester,
  type SubjectGradeEntry,
  type TeachingUnitSelection,
} from "@/lib/schemas"

export const SHARE_QUERY_PARAM = "s"
const LEGACY_SHARE_PREFIX = `v${CALCULATION_SCHEMA_VERSION}.`
const SHARE_V2_PREFIX = "v2."
const SHARE_V3_PREFIX = "v3."

type CompactUnitSelection = [string, 0 | 1] | [string, 0 | 1, string | null]
type CompactComponentGrades = [number | null, number | null, number | null]
type CompactFormulaConfig = [number, number, number]
type CompactSubjectGrade =
  | [string, 0, number]
  | [string, 1, CompactComponentGrades]
  | [string, 1, CompactComponentGrades, CompactFormulaConfig]
type CompactDirectUeGrade = [string, number]

interface CompactShareSnapshot {
  c: number
  p: string
  y: number
  u?: CompactUnitSelection[]
  g?: CompactSubjectGrade[]
  d?: CompactDirectUeGrade[]
}

type RelativeUnitSelection = [number, 0 | 1] | [number, 0 | 1, number | null]
type RelativeDenseSubjectGrades = Array<number | null>
type RelativeSparseSubjectGrade = [number, number]
type RelativeComponentSubjectGrade =
  | [number, CompactComponentGrades]
  | [number, CompactComponentGrades, CompactFormulaConfig]
type RelativeDirectUeGrade = [number, number]

interface RelativeShareSnapshot {
  c: number
  p: string
  y: number
  u?: RelativeUnitSelection[]
  g?: RelativeDenseSubjectGrades
  s?: RelativeSparseSubjectGrade[]
  m?: RelativeComponentSubjectGrade[]
  d?: RelativeDirectUeGrade[]
}

export interface ShareSnapshotMetadata {
  schemaVersion: typeof CALCULATION_SCHEMA_VERSION
  parcoursCode: string
  academicYear: number
}

interface EncodeShareSnapshotOptions {
  defaultUnitSelections?: CalculationSnapshot["unitSelections"]
  plan?: ParcoursPlanFile | null
}

interface DecodeShareSnapshotOptions {
  plan?: ParcoursPlanFile | null
}

type ShareTokenVersion = 1 | 2 | 3

interface ParsedShareToken {
  version: ShareTokenVersion
  parsed: unknown
}

function toBase64Url(input: string): string {
  if (typeof btoa === "function") {
    const bytes = new TextEncoder().encode(input)
    let binary = ""
    for (const byte of bytes) {
      binary += String.fromCharCode(byte)
    }
    return btoa(binary)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "")
  }
  const buffer = Buffer.from(input, "utf-8")
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

function fromBase64Url(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/")
  const remainder = padded.length % 4
  const full = remainder === 0 ? padded : padded + "=".repeat(4 - remainder)
  if (typeof atob === "function") {
    const binary = atob(full)
    const bytes = Uint8Array.from(binary, (character) =>
      character.charCodeAt(0)
    )
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes)
  }
  return Buffer.from(full, "base64").toString("utf-8")
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function expectedSemesterNumbers(academicYear: number): number[] {
  return academicYear === 1 ? [1, 2] : academicYear === 2 ? [3, 4] : [5, 6]
}

function getYearSemesters(
  plan: ParcoursPlanFile,
  academicYear: number
): Semester[] {
  const expected = new Set(expectedSemesterNumbers(academicYear))
  return plan.parcours.semesters.filter((semester) =>
    expected.has(semester.number)
  )
}

function getYearSubjectCodes(
  plan: ParcoursPlanFile,
  academicYear: number
): string[] {
  return getYearSemesters(plan, academicYear).flatMap((semester) =>
    semester.teaching_units.flatMap((ue) =>
      ue.subjects.map((subject) => subject.code)
    )
  )
}

function getYearTeachingUnitCodes(
  plan: ParcoursPlanFile,
  academicYear: number
): string[] {
  return getYearSemesters(plan, academicYear).flatMap((semester) =>
    semester.teaching_units.map((ue) => ue.code)
  )
}

function createCodeIndex(codes: string[]): Map<string, number> {
  const index = new Map<string, number>()
  codes.forEach((code, position) => {
    index.set(code, position)
  })
  return index
}

function codeAt(codes: string[], index: unknown): string | null {
  if (!Number.isInteger(index) || typeof index !== "number") return null
  if (index < 0 || index >= codes.length) return null
  return codes[index] ?? null
}

function chosenOption(selection: TeachingUnitSelection): string | null {
  return selection.chosenOptionCode ?? null
}

function sameSelection(
  left: TeachingUnitSelection,
  right: TeachingUnitSelection | undefined
): boolean {
  return (
    right !== undefined &&
    left.included === right.included &&
    chosenOption(left) === chosenOption(right)
  )
}

function encodeUnitSelections(
  selections: CalculationSnapshot["unitSelections"],
  defaultSelections: CalculationSnapshot["unitSelections"] | undefined
): CompactUnitSelection[] | undefined {
  const encoded: CompactUnitSelection[] = []
  for (const [code, selection] of Object.entries(selections)) {
    if (
      defaultSelections &&
      sameSelection(selection, defaultSelections[code])
    ) {
      continue
    }

    const included = selection.included ? 1 : 0
    if (selection.chosenOptionCode !== undefined) {
      encoded.push([code, included, selection.chosenOptionCode])
    } else {
      encoded.push([code, included])
    }
  }
  return encoded.length > 0 ? encoded : undefined
}

function encodeSubjectGrades(
  grades: CalculationSnapshot["subjectGrades"]
): CompactSubjectGrade[] | undefined {
  const encoded: CompactSubjectGrade[] = []
  for (const [code, entry] of Object.entries(grades)) {
    if (entry.mode === "direct") {
      encoded.push([code, 0, entry.direct])
      continue
    }

    const components: CompactComponentGrades = [
      entry.components.exam ?? null,
      entry.components.ds ?? null,
      entry.components.tp ?? null,
    ]
    if (entry.formula) {
      encoded.push([
        code,
        1,
        components,
        [entry.formula.exam, entry.formula.ds, entry.formula.tp],
      ])
    } else {
      encoded.push([code, 1, components])
    }
  }
  return encoded.length > 0 ? encoded : undefined
}

function encodeDirectUeGrades(
  grades: CalculationSnapshot["directUeGrades"]
): CompactDirectUeGrade[] | undefined {
  const encoded = Object.entries(grades)
  return encoded.length > 0 ? encoded : undefined
}

function encodeCompactSnapshot(
  snapshot: CalculationSnapshot
): CompactShareSnapshot {
  const compact: CompactShareSnapshot = {
    c: snapshot.schemaVersion,
    p: snapshot.parcoursCode,
    y: snapshot.academicYear,
  }
  const unitSelections = encodeUnitSelections(
    snapshot.unitSelections,
    undefined
  )
  const subjectGrades = encodeSubjectGrades(snapshot.subjectGrades)
  const directUeGrades = encodeDirectUeGrades(snapshot.directUeGrades)

  if (unitSelections) compact.u = unitSelections
  if (subjectGrades) compact.g = subjectGrades
  if (directUeGrades) compact.d = directUeGrades
  return compact
}

function encodeRelativeUnitSelections(
  selections: CalculationSnapshot["unitSelections"],
  defaultSelections: CalculationSnapshot["unitSelections"] | undefined,
  ueIndex: Map<string, number>
): RelativeUnitSelection[] | null | undefined {
  const encoded: RelativeUnitSelection[] = []
  for (const [code, selection] of Object.entries(selections)) {
    if (
      defaultSelections &&
      sameSelection(selection, defaultSelections[code])
    ) {
      continue
    }

    const index = ueIndex.get(code)
    if (index === undefined) return null

    const included = selection.included ? 1 : 0
    if (selection.chosenOptionCode === undefined) {
      encoded.push([index, included])
      continue
    }

    if (selection.chosenOptionCode === null) {
      encoded.push([index, included, null])
      continue
    }

    const chosenIndex = ueIndex.get(selection.chosenOptionCode)
    if (chosenIndex === undefined) return null
    encoded.push([index, included, chosenIndex])
  }
  encoded.sort((a, b) => a[0] - b[0])
  return encoded.length > 0 ? encoded : undefined
}

function compactComponents(
  components: ComponentGrades
): CompactComponentGrades {
  return [components.exam ?? null, components.ds ?? null, components.tp ?? null]
}

function encodeRelativeSubjectGrades(
  grades: CalculationSnapshot["subjectGrades"],
  subjectIndex: Map<string, number>
): Pick<RelativeShareSnapshot, "g" | "s" | "m"> | null {
  const directGrades: RelativeSparseSubjectGrade[] = []
  const componentGrades: RelativeComponentSubjectGrade[] = []

  for (const [code, entry] of Object.entries(grades)) {
    const index = subjectIndex.get(code)
    if (index === undefined) return null

    if (entry.mode === "direct") {
      directGrades.push([index, entry.direct])
      continue
    }

    if (entry.formula) {
      componentGrades.push([
        index,
        compactComponents(entry.components),
        [entry.formula.exam, entry.formula.ds, entry.formula.tp],
      ])
    } else {
      componentGrades.push([index, compactComponents(entry.components)])
    }
  }

  directGrades.sort((a, b) => a[0] - b[0])
  componentGrades.sort((a, b) => a[0] - b[0])

  const encoded: Pick<RelativeShareSnapshot, "g" | "s" | "m"> = {}
  if (directGrades.length > 0) {
    const maxIndex = directGrades[directGrades.length - 1]?.[0] ?? 0
    const dense: RelativeDenseSubjectGrades = Array(maxIndex + 1).fill(null)
    for (const [index, grade] of directGrades) {
      dense[index] = grade
    }

    if (JSON.stringify(dense).length <= JSON.stringify(directGrades).length) {
      encoded.g = dense
    } else {
      encoded.s = directGrades
    }
  }
  if (componentGrades.length > 0) {
    encoded.m = componentGrades
  }
  return encoded
}

function encodeRelativeDirectUeGrades(
  grades: CalculationSnapshot["directUeGrades"],
  ueIndex: Map<string, number>
): RelativeDirectUeGrade[] | null | undefined {
  const encoded: RelativeDirectUeGrade[] = []
  for (const [code, grade] of Object.entries(grades)) {
    const index = ueIndex.get(code)
    if (index === undefined) return null
    encoded.push([index, grade])
  }
  encoded.sort((a, b) => a[0] - b[0])
  return encoded.length > 0 ? encoded : undefined
}

function encodeRelativeSnapshot(
  snapshot: CalculationSnapshot,
  options: EncodeShareSnapshotOptions
): RelativeShareSnapshot | null {
  if (!options.plan) return null
  if (options.plan.parcours.code !== snapshot.parcoursCode) return null

  const subjectIndex = createCodeIndex(
    getYearSubjectCodes(options.plan, snapshot.academicYear)
  )
  const ueIndex = createCodeIndex(
    getYearTeachingUnitCodes(options.plan, snapshot.academicYear)
  )
  const unitSelections = encodeRelativeUnitSelections(
    snapshot.unitSelections,
    options.defaultUnitSelections,
    ueIndex
  )
  const subjectGrades = encodeRelativeSubjectGrades(
    snapshot.subjectGrades,
    subjectIndex
  )
  const directUeGrades = encodeRelativeDirectUeGrades(
    snapshot.directUeGrades,
    ueIndex
  )

  if (
    unitSelections === null ||
    subjectGrades === null ||
    directUeGrades === null
  ) {
    return null
  }

  const relative: RelativeShareSnapshot = {
    c: snapshot.schemaVersion,
    p: snapshot.parcoursCode,
    y: snapshot.academicYear,
  }
  if (unitSelections) relative.u = unitSelections
  if (subjectGrades.g) relative.g = subjectGrades.g
  if (subjectGrades.s) relative.s = subjectGrades.s
  if (subjectGrades.m) relative.m = subjectGrades.m
  if (directUeGrades) relative.d = directUeGrades
  return relative
}

export function encodeShareSnapshot(
  snapshot: CalculationSnapshot,
  options: EncodeShareSnapshotOptions = {}
): string {
  const relative = encodeRelativeSnapshot(snapshot, options)
  if (relative) {
    return SHARE_V3_PREFIX + toBase64Url(JSON.stringify(relative))
  }

  const compact = encodeCompactSnapshot(snapshot)
  const unitSelections = encodeUnitSelections(
    snapshot.unitSelections,
    options.defaultUnitSelections
  )
  if (unitSelections) {
    compact.u = unitSelections
  } else {
    delete compact.u
  }
  return SHARE_V2_PREFIX + toBase64Url(JSON.stringify(compact))
}

function decodeUnitSelections(
  value: unknown
): CalculationSnapshot["unitSelections"] | null {
  if (value === undefined) return {}
  if (!Array.isArray(value)) return null

  const selections: CalculationSnapshot["unitSelections"] = {}
  for (const item of value) {
    if (!Array.isArray(item) || (item.length !== 2 && item.length !== 3)) {
      return null
    }
    const [code, included, chosen] = item
    if (typeof code !== "string" || code.length === 0) return null
    if (included !== 0 && included !== 1) return null
    if (item.length === 3 && chosen !== null && typeof chosen !== "string") {
      return null
    }

    const selection: TeachingUnitSelection = { included: included === 1 }
    if (item.length === 3) {
      selection.chosenOptionCode = chosen
    }
    selections[code] = selection
  }
  return selections
}

function decodeComponentGrades(value: unknown): ComponentGrades | null {
  if (!Array.isArray(value) || value.length !== 3) return null

  const [exam, ds, tp] = value
  if (exam !== null && typeof exam !== "number") return null
  if (ds !== null && typeof ds !== "number") return null
  if (tp !== null && typeof tp !== "number") return null

  const components: ComponentGrades = {}
  if (exam !== null) components.exam = exam
  if (ds !== null) components.ds = ds
  if (tp !== null) components.tp = tp
  return components
}

function decodeFormula(value: unknown): FormulaConfig | null {
  if (!Array.isArray(value) || value.length !== 3) return null
  const [exam, ds, tp] = value
  if (
    typeof exam !== "number" ||
    typeof ds !== "number" ||
    typeof tp !== "number"
  ) {
    return null
  }
  return { exam, ds, tp }
}

function decodeSubjectGrades(
  value: unknown
): CalculationSnapshot["subjectGrades"] | null {
  if (value === undefined) return {}
  if (!Array.isArray(value)) return null

  const grades: CalculationSnapshot["subjectGrades"] = {}
  for (const item of value) {
    if (!Array.isArray(item)) return null
    const [code, mode] = item
    if (typeof code !== "string" || code.length === 0) return null

    if (mode === 0) {
      if (item.length !== 3 || typeof item[2] !== "number") return null
      grades[code] = { mode: "direct", direct: item[2] }
      continue
    }

    if (mode === 1) {
      if (item.length !== 3 && item.length !== 4) return null
      const components = decodeComponentGrades(item[2])
      if (!components) return null

      const entry: SubjectGradeEntry = { mode: "components", components }
      if (item.length === 4) {
        const formula = decodeFormula(item[3])
        if (!formula) return null
        entry.formula = formula
      }
      grades[code] = entry
      continue
    }

    return null
  }
  return grades
}

function decodeDirectUeGrades(
  value: unknown
): CalculationSnapshot["directUeGrades"] | null {
  if (value === undefined) return {}
  if (!Array.isArray(value)) return null

  const grades: CalculationSnapshot["directUeGrades"] = {}
  for (const item of value) {
    if (!Array.isArray(item) || item.length !== 2) return null
    const [code, grade] = item
    if (typeof code !== "string" || code.length === 0) return null
    if (typeof grade !== "number") return null
    grades[code] = grade
  }
  return grades
}

function decodeCompactMetadata(parsed: unknown): ShareSnapshotMetadata | null {
  if (!isRecord(parsed)) return null
  if (parsed.c !== CALCULATION_SCHEMA_VERSION) return null
  if (typeof parsed.p !== "string") return null
  if (typeof parsed.y !== "number") return null

  const result = calculationSnapshotSchema.safeParse({
    schemaVersion: parsed.c,
    parcoursCode: parsed.p,
    academicYear: parsed.y,
    unitSelections: {},
    subjectGrades: {},
    directUeGrades: {},
  })
  if (!result.success) return null
  return {
    schemaVersion: result.data.schemaVersion,
    parcoursCode: result.data.parcoursCode,
    academicYear: result.data.academicYear,
  }
}

function decodeCompactSnapshot(parsed: unknown): CalculationSnapshot | null {
  const metadata = decodeCompactMetadata(parsed)
  if (!metadata || !isRecord(parsed)) return null

  const unitSelections = decodeUnitSelections(parsed.u)
  const subjectGrades = decodeSubjectGrades(parsed.g)
  const directUeGrades = decodeDirectUeGrades(parsed.d)
  if (!unitSelections || !subjectGrades || !directUeGrades) return null

  const snapshot = {
    schemaVersion: metadata.schemaVersion,
    parcoursCode: metadata.parcoursCode,
    academicYear: metadata.academicYear,
    unitSelections,
    subjectGrades,
    directUeGrades,
  }
  const result = calculationSnapshotSchema.safeParse(snapshot)
  if (!result.success) return null
  return result.data
}

function decodeRelativeUnitSelections(
  value: unknown,
  ueCodes: string[]
): CalculationSnapshot["unitSelections"] | null {
  if (value === undefined) return {}
  if (!Array.isArray(value)) return null

  const selections: CalculationSnapshot["unitSelections"] = {}
  for (const item of value) {
    if (!Array.isArray(item) || (item.length !== 2 && item.length !== 3)) {
      return null
    }
    const [index, included, chosen] = item
    const code = codeAt(ueCodes, index)
    if (!code) return null
    if (included !== 0 && included !== 1) return null

    const selection: TeachingUnitSelection = { included: included === 1 }
    if (item.length === 3) {
      if (chosen === null) {
        selection.chosenOptionCode = null
      } else {
        const chosenCode = codeAt(ueCodes, chosen)
        if (!chosenCode) return null
        selection.chosenOptionCode = chosenCode
      }
    }
    selections[code] = selection
  }
  return selections
}

function assignSubjectGrade(
  grades: CalculationSnapshot["subjectGrades"],
  code: string,
  entry: SubjectGradeEntry
): boolean {
  if (grades[code] !== undefined) return false
  grades[code] = entry
  return true
}

function decodeRelativeSubjectGrades(
  parsed: Record<string, unknown>,
  subjectCodes: string[]
): CalculationSnapshot["subjectGrades"] | null {
  const grades: CalculationSnapshot["subjectGrades"] = {}

  if (parsed.g !== undefined) {
    if (!Array.isArray(parsed.g)) return null
    for (let index = 0; index < parsed.g.length; index++) {
      const grade = parsed.g[index]
      if (grade === null) continue
      if (typeof grade !== "number") return null
      const code = codeAt(subjectCodes, index)
      if (!code) return null
      if (
        !assignSubjectGrade(grades, code, { mode: "direct", direct: grade })
      ) {
        return null
      }
    }
  }

  if (parsed.s !== undefined) {
    if (!Array.isArray(parsed.s)) return null
    for (const item of parsed.s) {
      if (!Array.isArray(item) || item.length !== 2) return null
      const [index, grade] = item
      const code = codeAt(subjectCodes, index)
      if (!code || typeof grade !== "number") return null
      if (
        !assignSubjectGrade(grades, code, { mode: "direct", direct: grade })
      ) {
        return null
      }
    }
  }

  if (parsed.m !== undefined) {
    if (!Array.isArray(parsed.m)) return null
    for (const item of parsed.m) {
      if (!Array.isArray(item) || (item.length !== 2 && item.length !== 3)) {
        return null
      }
      const [index, rawComponents, rawFormula] = item
      const code = codeAt(subjectCodes, index)
      const components = decodeComponentGrades(rawComponents)
      if (!code || !components) return null

      const entry: SubjectGradeEntry = { mode: "components", components }
      if (item.length === 3) {
        const formula = decodeFormula(rawFormula)
        if (!formula) return null
        entry.formula = formula
      }
      if (!assignSubjectGrade(grades, code, entry)) return null
    }
  }

  return grades
}

function decodeRelativeDirectUeGrades(
  value: unknown,
  ueCodes: string[]
): CalculationSnapshot["directUeGrades"] | null {
  if (value === undefined) return {}
  if (!Array.isArray(value)) return null

  const grades: CalculationSnapshot["directUeGrades"] = {}
  for (const item of value) {
    if (!Array.isArray(item) || item.length !== 2) return null
    const [index, grade] = item
    const code = codeAt(ueCodes, index)
    if (!code || typeof grade !== "number") return null
    grades[code] = grade
  }
  return grades
}

function decodeRelativeSnapshot(
  parsed: unknown,
  plan: ParcoursPlanFile
): CalculationSnapshot | null {
  const metadata = decodeCompactMetadata(parsed)
  if (!metadata || !isRecord(parsed)) return null
  if (plan.parcours.code !== metadata.parcoursCode) return null

  const subjectCodes = getYearSubjectCodes(plan, metadata.academicYear)
  const ueCodes = getYearTeachingUnitCodes(plan, metadata.academicYear)
  const unitSelections = decodeRelativeUnitSelections(parsed.u, ueCodes)
  const subjectGrades = decodeRelativeSubjectGrades(parsed, subjectCodes)
  const directUeGrades = decodeRelativeDirectUeGrades(parsed.d, ueCodes)
  if (!unitSelections || !subjectGrades || !directUeGrades) return null

  const snapshot = {
    schemaVersion: metadata.schemaVersion,
    parcoursCode: metadata.parcoursCode,
    academicYear: metadata.academicYear,
    unitSelections,
    subjectGrades,
    directUeGrades,
  }
  const result = calculationSnapshotSchema.safeParse(snapshot)
  if (!result.success) return null
  return result.data
}

function parseShareToken(
  value: string | null | undefined
): ParsedShareToken | null {
  if (!value) return null

  const version: ShareTokenVersion | null = value.startsWith(SHARE_V3_PREFIX)
    ? 3
    : value.startsWith(SHARE_V2_PREFIX)
      ? 2
      : value.startsWith(LEGACY_SHARE_PREFIX)
        ? 1
        : null
  if (!version) return null

  const prefix =
    version === 3
      ? SHARE_V3_PREFIX
      : version === 2
        ? SHARE_V2_PREFIX
        : LEGACY_SHARE_PREFIX
  const payload = value.slice(prefix.length)
  if (!payload) return null

  let json: string
  try {
    json = fromBase64Url(payload)
  } catch {
    return null
  }

  try {
    return { version, parsed: JSON.parse(json) }
  } catch {
    return null
  }
}

export function decodeShareSnapshot(
  value: string | null | undefined,
  options: DecodeShareSnapshotOptions = {}
): CalculationSnapshot | null {
  const token = parseShareToken(value)
  if (!token) return null

  if (token.version === 3) {
    return options.plan
      ? decodeRelativeSnapshot(token.parsed, options.plan)
      : null
  }

  if (token.version === 2) {
    return decodeCompactSnapshot(token.parsed)
  }

  const result = calculationSnapshotSchema.safeParse(token.parsed)
  if (!result.success) return null
  return result.data
}

export function decodeShareMetadata(
  value: string | null | undefined
): ShareSnapshotMetadata | null {
  const token = parseShareToken(value)
  if (!token) return null

  if (token.version === 2 || token.version === 3) {
    return decodeCompactMetadata(token.parsed)
  }

  const result = calculationSnapshotSchema.safeParse(token.parsed)
  if (!result.success) return null
  return {
    schemaVersion: result.data.schemaVersion,
    parcoursCode: result.data.parcoursCode,
    academicYear: result.data.academicYear,
  }
}

export function readShareSnapshotFromUrl(
  search: string | URLSearchParams,
  options: DecodeShareSnapshotOptions = {}
): CalculationSnapshot | null {
  const params =
    search instanceof URLSearchParams ? search : new URLSearchParams(search)
  return decodeShareSnapshot(params.get(SHARE_QUERY_PARAM), options)
}

export function readShareMetadataFromUrl(
  search: string | URLSearchParams
): ShareSnapshotMetadata | null {
  const params =
    search instanceof URLSearchParams ? search : new URLSearchParams(search)
  return decodeShareMetadata(params.get(SHARE_QUERY_PARAM))
}

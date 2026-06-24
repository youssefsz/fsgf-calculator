import {
  CALCULATION_SCHEMA_VERSION,
  calculationSnapshotSchema,
  type CalculationSnapshot,
  type ComponentGrades,
  type FormulaConfig,
  type SubjectGradeEntry,
  type TeachingUnitSelection,
} from "@/lib/schemas"

export const SHARE_QUERY_PARAM = "s"
const LEGACY_SHARE_PREFIX = `v${CALCULATION_SCHEMA_VERSION}.`
const SHARE_PREFIX = "v2."

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

interface EncodeShareSnapshotOptions {
  defaultUnitSelections?: CalculationSnapshot["unitSelections"]
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

export function encodeShareSnapshot(
  snapshot: CalculationSnapshot,
  options: EncodeShareSnapshotOptions = {}
): string {
  const compact: CompactShareSnapshot = {
    c: snapshot.schemaVersion,
    p: snapshot.parcoursCode,
    y: snapshot.academicYear,
  }
  const unitSelections = encodeUnitSelections(
    snapshot.unitSelections,
    options.defaultUnitSelections
  )
  const subjectGrades = encodeSubjectGrades(snapshot.subjectGrades)
  const directUeGrades = encodeDirectUeGrades(snapshot.directUeGrades)

  if (unitSelections) compact.u = unitSelections
  if (subjectGrades) compact.g = subjectGrades
  if (directUeGrades) compact.d = directUeGrades

  const json = JSON.stringify(compact)
  return SHARE_PREFIX + toBase64Url(json)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
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

function decodeCompactSnapshot(parsed: unknown): CalculationSnapshot | null {
  if (!isRecord(parsed)) return null
  if (parsed.c !== CALCULATION_SCHEMA_VERSION) return null
  if (typeof parsed.p !== "string") return null
  if (typeof parsed.y !== "number") return null

  const unitSelections = decodeUnitSelections(parsed.u)
  const subjectGrades = decodeSubjectGrades(parsed.g)
  const directUeGrades = decodeDirectUeGrades(parsed.d)
  if (!unitSelections || !subjectGrades || !directUeGrades) return null

  const snapshot = {
    schemaVersion: parsed.c,
    parcoursCode: parsed.p,
    academicYear: parsed.y,
    unitSelections,
    subjectGrades,
    directUeGrades,
  }
  const result = calculationSnapshotSchema.safeParse(snapshot)
  if (!result.success) return null
  return result.data
}

export function decodeShareSnapshot(
  value: string | null | undefined
): CalculationSnapshot | null {
  if (!value) return null
  const prefix = value.startsWith(SHARE_PREFIX)
    ? SHARE_PREFIX
    : value.startsWith(LEGACY_SHARE_PREFIX)
      ? LEGACY_SHARE_PREFIX
      : null
  if (!prefix) return null

  const payload = value.slice(prefix.length)
  if (!payload) return null

  let json: string
  try {
    json = fromBase64Url(payload)
  } catch {
    return null
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    return null
  }

  if (prefix === SHARE_PREFIX) {
    return decodeCompactSnapshot(parsed)
  }

  const result = calculationSnapshotSchema.safeParse(parsed)
  if (!result.success) return null
  return result.data
}

export function readShareSnapshotFromUrl(
  search: string | URLSearchParams
): CalculationSnapshot | null {
  const params =
    search instanceof URLSearchParams ? search : new URLSearchParams(search)
  return decodeShareSnapshot(params.get(SHARE_QUERY_PARAM))
}

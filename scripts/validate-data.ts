import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { z } from "zod"
import {
  parcoursIndexSchema,
  parcoursPlanFileSchema,
  type ParcoursIndex,
  type ParcoursPlanFile,
} from "../src/lib/schemas.ts"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.resolve(__dirname, "../public/data/fsgf")
const PARCOURS_DIR = path.join(DATA_DIR, "parcours")

const EXPECTED_TOTAL = 134
const EXPECTED_WITH_PLAN = 121
const EXPECTED_WITHOUT_PLAN = 13
const REQUIRED_CODES = ["LI573102", "LI573103", "LI573199"]

interface Issue {
  type: "error" | "warning"
  message: string
}

const issues: Issue[] = []

function error(message: string) {
  issues.push({ type: "error", message })
}

function warn(message: string) {
  issues.push({ type: "warning", message })
}

async function readJsonSafe(filePath: string): Promise<unknown> {
  const text = await readFile(filePath, "utf-8")
  return JSON.parse(text)
}

function resolveParcoursFile(dataFile: string): string {
  const normalized = path.normalize(dataFile)
  if (path.isAbsolute(normalized)) {
    throw new Error(`Absolute dataFile path is not allowed: ${dataFile}`)
  }
  const resolved = path.resolve(DATA_DIR, normalized)
  const relative = path.relative(DATA_DIR, resolved)
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`dataFile escapes data directory: ${dataFile}`)
  }
  return resolved
}

function countActualUnitsAndSubjects(plan: ParcoursPlanFile) {
  let teachingUnits = 0
  let subjects = 0
  for (const semester of plan.parcours.semesters) {
    for (const ue of semester.teaching_units) {
      teachingUnits += 1
      subjects += ue.subjects.length
    }
  }
  return { teachingUnits, subjects }
}

async function main() {
  console.log(`Validating data in ${DATA_DIR}`)

  const indexRaw = await readJsonSafe(path.join(DATA_DIR, "index.json"))
  const indexResult = parcoursIndexSchema.safeParse(indexRaw)
  if (!indexResult.success) {
    error(`index.json schema validation failed: ${indexResult.error.message}`)
    console.error(z.prettifyError(indexResult.error))
  }
  const index: ParcoursIndex | undefined = indexResult.success
    ? indexResult.data
    : undefined

  if (index) {
    if (index.summary.parcours !== EXPECTED_TOTAL) {
      error(
        `Expected ${EXPECTED_TOTAL} parcours in summary, found ${index.summary.parcours}`
      )
    }
    if (index.summary.withPlan !== EXPECTED_WITH_PLAN) {
      error(
        `Expected ${EXPECTED_WITH_PLAN} usable plans in summary, found ${index.summary.withPlan}`
      )
    }
    if (index.summary.withoutPlan !== EXPECTED_WITHOUT_PLAN) {
      error(
        `Expected ${EXPECTED_WITHOUT_PLAN} unavailable plans in summary, found ${index.summary.withoutPlan}`
      )
    }

    const codes = index.parcours.map((p) => p.code)
    const uniqueCodes = new Set(codes)
    if (uniqueCodes.size !== codes.length) {
      error("Duplicate parcours codes found in index")
    }
    if (codes.length !== EXPECTED_TOTAL) {
      error(
        `Expected ${EXPECTED_TOTAL} index entries, found ${codes.length}`
      )
    }

    for (const code of REQUIRED_CODES) {
      const entry = index.parcours.find((p) => p.code === code)
      if (!entry) {
        error(`Required parcours ${code} is missing from the index`)
      } else if (!entry.hasPlan) {
        error(`Required parcours ${code} must have a usable plan`)
      }
    }

    const withoutPlanCount = index.parcours.filter((p) => !p.hasPlan).length
    if (withoutPlanCount !== EXPECTED_WITHOUT_PLAN) {
      error(
        `Expected ${EXPECTED_WITHOUT_PLAN} plans marked hasPlan=false, found ${withoutPlanCount}`
      )
    }

    const indexFiles = new Set<string>()
    for (const entry of index.parcours) {
      indexFiles.add(entry.dataFile)
      let resolved: string
      try {
        resolved = resolveParcoursFile(entry.dataFile)
      } catch (e) {
        error(`Invalid dataFile for ${entry.code}: ${e}`)
        continue
      }

      try {
        const raw = await readJsonSafe(resolved)
        const fileResult = parcoursPlanFileSchema.safeParse(raw)
        if (!fileResult.success) {
          error(
            `Parcours file ${entry.dataFile} failed schema validation: ${fileResult.error.message}`
          )
          console.error(z.prettifyError(fileResult.error))
          continue
        }
        const plan = fileResult.data
        const baseName = path.basename(entry.dataFile, ".json")
        if (baseName !== entry.code) {
          error(
            `Filename ${baseName} does not match index code ${entry.code}`
          )
        }
        if (plan.parcours.code !== entry.code) {
          error(
            `Internal code ${plan.parcours.code} does not match index code ${entry.code}`
          )
        }

        if (entry.hasPlan && !plan.parcours.institution) {
          warn(`${entry.code}: parcours.institution is missing`)
        }
        if (entry.hasPlan && !plan.parcours.degree_type) {
          warn(`${entry.code}: parcours.degree_type is missing`)
        }
        if (entry.hasPlan && !plan.parcours.domain) {
          warn(`${entry.code}: parcours.domain is missing`)
        }
        if (entry.hasPlan && !plan.parcours.mention) {
          warn(`${entry.code}: parcours.mention is missing`)
        }
        if (entry.hasPlan && !plan.parcours.specialty) {
          warn(`${entry.code}: parcours.specialty is missing`)
        }

        const actual = countActualUnitsAndSubjects(plan)
        if (actual.teachingUnits !== entry.counts.teachingUnits) {
          warn(
            `${entry.code}: index counts.teachingUnits (${entry.counts.teachingUnits}) does not match actual (${actual.teachingUnits})`
          )
        }
        if (actual.subjects !== entry.counts.subjects) {
          warn(
            `${entry.code}: index counts.subjects (${entry.counts.subjects}) does not match actual (${actual.subjects})`
          )
        }

        const actualSemesters = plan.parcours.semesters.map((s) => s.number)
        if (actualSemesters.length !== entry.counts.semesters) {
          warn(
            `${entry.code}: index counts.semesters (${entry.counts.semesters}) does not match actual (${actualSemesters.length})`
          )
        }

        const availableFromPlan = new Set(actualSemesters)
        const indexAvailable = new Set(entry.availableSemesters)
        if (
          availableFromPlan.size !== indexAvailable.size ||
          [...availableFromPlan].some((s) => !indexAvailable.has(s))
        ) {
          warn(
            `${entry.code}: availableSemesters ${JSON.stringify(entry.availableSemesters)} do not match plan semesters ${JSON.stringify(actualSemesters)}`
          )
        }

        const detectedSourceWarnings: string[] = []
        if (!entry.hasPlan && plan.parcours.scrape_status === "no_plan") {
          detectedSourceWarnings.push("No study-plan table found")
        }

        for (const semester of plan.parcours.semesters) {
          for (const ue of semester.teaching_units) {
            if (ue.subjects.length === 0) {
              detectedSourceWarnings.push(
                `Semester ${semester.number} UE ${ue.code} has no subject rows`
              )
            }
            for (const subject of ue.subjects) {
              if (subject.coefficient <= 0) {
                error(
                  `${entry.code}: Subject ${subject.code} in UE ${ue.code} has non-positive coefficient`
                )
              }
            }
          }
        }

        const declaredSourceWarnings = new Set(plan.parcours.warnings)
        const detectedSourceWarningSet = new Set(detectedSourceWarnings)
        for (const warning of detectedSourceWarnings) {
          if (!declaredSourceWarnings.has(warning)) {
            error(`${entry.code}: undocumented source limitation: ${warning}`)
          }
        }
        for (const warning of plan.parcours.warnings) {
          if (!detectedSourceWarningSet.has(warning)) {
            error(`${entry.code}: stale source warning: ${warning}`)
          }
        }
      } catch (e) {
        error(`Failed to read or parse ${entry.dataFile}: ${e}`)
      }
    }

    const parcoursFiles = (await readdir(PARCOURS_DIR)).filter((f) =>
      f.endsWith(".json")
    )
    const expectedFiles = new Set(
      [...indexFiles].map((f) => path.basename(f))
    )
    for (const file of parcoursFiles) {
      if (!expectedFiles.has(file)) {
        warn(`Unreferenced parcours file found: parcours/${file}`)
      }
    }
    if (parcoursFiles.length !== expectedFiles.size) {
      error(
        `Expected ${expectedFiles.size} parcours files, found ${parcoursFiles.length}`
      )
    }

    let actualTotalUnits = 0
    let actualTotalSubjects = 0
    for (const entry of index.parcours) {
      actualTotalUnits += entry.counts.teachingUnits
      actualTotalSubjects += entry.counts.subjects
    }
    if (actualTotalUnits !== index.summary.teachingUnits) {
      warn(
        `summary.teachingUnits (${index.summary.teachingUnits}) does not equal sum of entry counts (${actualTotalUnits})`
      )
    }
    if (actualTotalSubjects !== index.summary.subjects) {
      warn(
        `summary.subjects (${index.summary.subjects}) does not equal sum of entry counts (${actualTotalSubjects})`
      )
    }
  }

  const errors = issues.filter((i) => i.type === "error")
  const warnings = issues.filter((i) => i.type === "warning")

  for (const w of warnings) {
    console.warn(`⚠ ${w.message}`)
  }
  for (const e of errors) {
    console.error(`✖ ${e.message}`)
  }

  console.log(
    `Validation complete: ${errors.length} errors, ${warnings.length} warnings`
  )

  if (errors.length > 0) {
    process.exit(1)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

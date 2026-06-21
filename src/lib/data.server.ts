import { readFile } from "node:fs/promises"
import { join } from "node:path"

import {
  parcoursIndexSchema,
  parcoursPlanFileSchema,
  type ParcoursIndex,
  type ParcoursPlanFile,
} from "@/lib/schemas"

const DATA_DIR = join(process.cwd(), "public/data/fsgf")

let indexCache: ParcoursIndex | null = null

export async function loadIndex(): Promise<ParcoursIndex> {
  if (indexCache) return indexCache

  const raw = await readFile(join(DATA_DIR, "index.json"), "utf-8")
  const parsed = JSON.parse(raw) as unknown
  const result = parcoursIndexSchema.safeParse(parsed)
  if (!result.success) {
    throw new Error(`Invalid program index: ${result.error.message}`)
  }
  indexCache = result.data
  return result.data
}

const planCache = new Map<string, ParcoursPlanFile>()

export async function loadPlan(code: string): Promise<ParcoursPlanFile> {
  if (planCache.has(code)) return planCache.get(code)!

  const raw = await readFile(join(DATA_DIR, "parcours", `${code}.json`), "utf-8")
  const parsed = JSON.parse(raw) as unknown
  const result = parcoursPlanFileSchema.safeParse(parsed)
  if (!result.success) {
    throw new Error(`Invalid program data for ${code}: ${result.error.message}`)
  }
  planCache.set(code, result.data)
  return result.data
}

import {
  parcoursIndexSchema,
  parcoursPlanFileSchema,
  type ParcoursIndex,
  type ParcoursPlanFile,
} from "@/lib/schemas"

const DATA_BASE = "/data/fsgf"

let indexCache: ParcoursIndex | null = null
let indexRequest: Promise<ParcoursIndex> | null = null
const indexListeners = new Set<() => void>()
const planCache = new Map<string, ParcoursPlanFile>()

export function getCachedIndex(): ParcoursIndex | null {
  return indexCache
}

export function subscribeToIndexCache(listener: () => void): () => void {
  indexListeners.add(listener)
  return () => indexListeners.delete(listener)
}

export async function fetchIndex(): Promise<ParcoursIndex> {
  if (indexCache) return indexCache
  if (indexRequest) return indexRequest

  indexRequest = fetch(`${DATA_BASE}/index.json`)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Failed to load program index: ${response.status}`)
      }
      const raw = await response.json()
      const result = parcoursIndexSchema.safeParse(raw)
      if (!result.success) {
        throw new Error(`Invalid program index: ${result.error.message}`)
      }
      indexCache = result.data
      indexListeners.forEach((listener) => listener())
      return result.data
    })
    .finally(() => {
      indexRequest = null
    })

  return indexRequest
}

export async function fetchPlan(
  code: string,
  generatedAt?: string
): Promise<ParcoursPlanFile> {
  if (planCache.has(code)) return planCache.get(code)!

  const query = generatedAt ? `?v=${encodeURIComponent(generatedAt)}` : ""
  const response = await fetch(`${DATA_BASE}/parcours/${code}.json${query}`)
  if (!response.ok) {
    throw new Error(`Failed to load program ${code}: ${response.status}`)
  }
  const raw = await response.json()
  const result = parcoursPlanFileSchema.safeParse(raw)
  if (!result.success) {
    throw new Error(`Invalid program data for ${code}: ${result.error.message}`)
  }
  planCache.set(code, result.data)
  return result.data
}

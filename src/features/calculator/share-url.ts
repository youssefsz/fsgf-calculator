import {
  CALCULATION_SCHEMA_VERSION,
  calculationSnapshotSchema,
  type CalculationSnapshot,
} from "@/lib/schemas"

export const SHARE_QUERY_PARAM = "s"
const SHARE_PREFIX = `v${CALCULATION_SCHEMA_VERSION}.`

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
  const full =
    remainder === 0 ? padded : padded + "=".repeat(4 - remainder)
  if (typeof atob === "function") {
    const binary = atob(full)
    const bytes = Uint8Array.from(binary, (character) =>
      character.charCodeAt(0)
    )
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes)
  }
  return Buffer.from(full, "base64").toString("utf-8")
}

export function encodeShareSnapshot(snapshot: CalculationSnapshot): string {
  const json = JSON.stringify(snapshot)
  return SHARE_PREFIX + toBase64Url(json)
}

export function decodeShareSnapshot(
  value: string | null | undefined
): CalculationSnapshot | null {
  if (!value) return null
  if (!value.startsWith(SHARE_PREFIX)) return null
  const payload = value.slice(SHARE_PREFIX.length)
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

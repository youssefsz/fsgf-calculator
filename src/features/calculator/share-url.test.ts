import { describe, expect, it } from "vitest"

import { CALCULATION_SCHEMA_VERSION } from "@/lib/schemas"
import type {
  CalculationSnapshot,
  ParcoursPlanFile,
  Subject,
  TeachingUnit,
} from "@/lib/schemas"

import {
  decodeShareMetadata,
  decodeShareSnapshot,
  encodeShareSnapshot,
  readShareMetadataFromUrl,
  readShareSnapshotFromUrl,
  SHARE_QUERY_PARAM,
} from "./share-url"

function makeSnapshot(): CalculationSnapshot {
  return {
    schemaVersion: CALCULATION_SCHEMA_VERSION,
    parcoursCode: "L1MATH",
    academicYear: 1,
    unitSelections: {
      UE11: { included: true },
      UE12: { included: false, chosenOptionCode: "UE12-B" },
    },
    subjectGrades: {
      MATH101: {
        mode: "components",
        components: { exam: 12, ds: 15 },
        formula: { exam: 0.6, ds: 0.4, tp: 0 },
      },
      INFO102: { mode: "direct", direct: 16 },
    },
    directUeGrades: { UE11: 14.5 },
  }
}

function makeSubject(code: string): Subject {
  return {
    code,
    name: code,
    coefficient: 1,
    credits: null,
    exam_regime: "MX",
    hours: {
      course: 21,
      tutorial: 0,
      practical: 0,
      integrated_course: null,
      total: null,
    },
  }
}

function makeUe(
  code: string,
  subjects: TeachingUnit["subjects"] = []
): TeachingUnit {
  return {
    code,
    name: code,
    credits: 4,
    coefficient: 1,
    nature: "Fond",
    exam_regime: "MX",
    subjects,
  }
}

function makePlan(): ParcoursPlanFile {
  return {
    schemaVersion: 1,
    university: "Test University",
    institution: "Test Institution",
    parcours: {
      code: "L1MATH",
      listed_type: "Licence",
      listed_domain: "Sciences",
      listed_mention: "Math",
      listed_specialty: "Math",
      source_url: "http://example.com",
      semesters: [
        {
          number: 1,
          teaching_units: [
            makeUe("UE11", [makeSubject("MATH101")]),
            makeUe("UE12", [makeSubject("INFO102")]),
            makeUe("UE12-B"),
          ],
        },
        {
          number: 2,
          teaching_units: [makeUe("UE21", [makeSubject("PHYS201")])],
        },
      ],
      warnings: [],
      scrape_status: "ok",
    },
  }
}

describe("share URL round-trip", () => {
  it("encodes and decodes a plan-relative v3 snapshot losslessly", () => {
    const snapshot = makeSnapshot()
    const plan = makePlan()
    const encoded = encodeShareSnapshot(snapshot, { plan })
    expect(encoded.startsWith("v3.")).toBe(true)
    expect(decodeShareSnapshot(encoded, { plan })).toEqual(snapshot)
  })

  it("falls back to v2 when no plan is available", () => {
    const snapshot = makeSnapshot()
    const encoded = encodeShareSnapshot(snapshot)
    expect(encoded.startsWith("v2.")).toBe(true)
    expect(decodeShareSnapshot(encoded)).toEqual(snapshot)
  })

  it("omits default unit selections from v3 tokens", () => {
    const snapshot = makeSnapshot()
    const plan = makePlan()
    const encoded = encodeShareSnapshot(snapshot, {
      plan,
      defaultUnitSelections: {
        UE11: { included: true },
        UE12: { included: false, chosenOptionCode: "UE12-B" },
      },
    })

    expect(decodeShareSnapshot(encoded, { plan })).toEqual({
      ...snapshot,
      unitSelections: {},
    })
    expect(encoded.length).toBeLessThan(
      encodeShareSnapshot(snapshot, { plan }).length
    )
  })

  it("reads v3 metadata without needing the plan", () => {
    const snapshot = makeSnapshot()
    const encoded = encodeShareSnapshot(snapshot, { plan: makePlan() })

    expect(decodeShareMetadata(encoded)).toEqual({
      schemaVersion: CALCULATION_SCHEMA_VERSION,
      parcoursCode: "L1MATH",
      academicYear: 1,
    })
    expect(decodeShareSnapshot(encoded)).toBeNull()
  })

  it("decodes legacy v1 JSON tokens", () => {
    const snapshot = makeSnapshot()
    const payload = btoa(JSON.stringify(snapshot))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "")
    const encoded = `v${CALCULATION_SCHEMA_VERSION}.${payload}`

    expect(decodeShareSnapshot(encoded)).toEqual(snapshot)
  })

  it("preserves Unicode text in snapshots", () => {
    const snapshot = makeSnapshot()
    snapshot.parcoursCode = "Mathématiques-رياضيات"
    const encoded = encodeShareSnapshot(snapshot)
    expect(decodeShareSnapshot(encoded)).toEqual(snapshot)
  })

  it("produces a URL-safe token (no padding, no +, /, =)", () => {
    const encoded = encodeShareSnapshot(makeSnapshot())
    const token = encoded.split(".")[1] ?? ""
    expect(token).not.toMatch(/[+/=]/)
  })

  it("reads a snapshot from a URLSearchParams instance", () => {
    const snapshot = makeSnapshot()
    const plan = makePlan()
    const encoded = encodeShareSnapshot(snapshot, { plan })
    const params = new URLSearchParams()
    params.set(SHARE_QUERY_PARAM, encoded)
    expect(readShareSnapshotFromUrl(params, { plan })).toEqual(snapshot)
  })

  it("reads a snapshot from a search string", () => {
    const snapshot = makeSnapshot()
    const encoded = encodeShareSnapshot(snapshot)
    expect(
      readShareSnapshotFromUrl(`?${SHARE_QUERY_PARAM}=${encoded}`)
    ).toEqual(snapshot)
  })

  it("reads metadata from a search string", () => {
    const encoded = encodeShareSnapshot(makeSnapshot(), { plan: makePlan() })
    expect(
      readShareMetadataFromUrl(`?${SHARE_QUERY_PARAM}=${encoded}`)
    ).toEqual({
      schemaVersion: CALCULATION_SCHEMA_VERSION,
      parcoursCode: "L1MATH",
      academicYear: 1,
    })
  })
})

describe("share URL validation", () => {
  it("returns null for missing input", () => {
    expect(decodeShareSnapshot(null)).toBeNull()
    expect(decodeShareSnapshot(undefined)).toBeNull()
    expect(decodeShareSnapshot("")).toBeNull()
  })

  it("returns null for unknown version prefix", () => {
    expect(decodeShareSnapshot("v99.something")).toBeNull()
  })

  it("returns null for empty payload after prefix", () => {
    expect(decodeShareSnapshot(`v${CALCULATION_SCHEMA_VERSION}.`)).toBeNull()
  })

  it("returns null for non-base64 payload", () => {
    expect(
      decodeShareSnapshot(`v${CALCULATION_SCHEMA_VERSION}.!!!not-base64!!!`)
    ).toBeNull()
  })

  it("returns null when the decoded JSON is not valid JSON", () => {
    const broken = `v${CALCULATION_SCHEMA_VERSION}.` + btoa("not json")
    expect(decodeShareSnapshot(broken)).toBeNull()
  })

  it("returns null when the JSON fails the snapshot schema", () => {
    const invalid = {
      schemaVersion: CALCULATION_SCHEMA_VERSION,
      parcoursCode: "L1MATH",
      academicYear: 99,
      unitSelections: {},
      subjectGrades: {},
      directUeGrades: {},
    }
    const encoded =
      `v${CALCULATION_SCHEMA_VERSION}.` + btoa(JSON.stringify(invalid))
    expect(decodeShareSnapshot(encoded)).toBeNull()
  })

  it("returns null for snapshots with out-of-range grades", () => {
    const invalid: CalculationSnapshot = {
      schemaVersion: CALCULATION_SCHEMA_VERSION,
      parcoursCode: "L1MATH",
      academicYear: 1,
      unitSelections: {},
      subjectGrades: { S1: { mode: "direct", direct: 25 } },
      directUeGrades: {},
    }
    const encoded = encodeShareSnapshot(invalid)
    expect(decodeShareSnapshot(encoded)).toBeNull()
  })

  it("returns null for obsolete schema versions", () => {
    const obsolete = {
      schemaVersion: 99,
      parcoursCode: "L1MATH",
      academicYear: 1,
      unitSelections: {},
      subjectGrades: {},
      directUeGrades: {},
    }
    const encoded =
      `v${CALCULATION_SCHEMA_VERSION}.` + btoa(JSON.stringify(obsolete))
    expect(decodeShareSnapshot(encoded)).toBeNull()
  })
})

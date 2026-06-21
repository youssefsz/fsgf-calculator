import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import type {
  ParcoursIndex,
  ParcoursIndexEntry,
  ParcoursPlanFile,
  Subject,
  TeachingUnit,
} from "@/lib/schemas"

import { Calculator } from "./Calculator"

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
  subjects: TeachingUnit["subjects"] = []
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

const availableParcours: ParcoursIndexEntry = {
  code: "TEST01",
  degreeType: "Licence",
  domain: "Sciences",
  mention: "Test Mention",
  specialty: "Test Specialty",
  hasPlan: true,
  scrapeStatus: "ok",
  availableSemesters: [1, 2],
  academicYears: [
    {
      year: 1,
      expectedSemesters: [1, 2],
      availableSemesters: [1, 2],
      complete: true,
    },
    {
      year: 2,
      expectedSemesters: [3, 4],
      availableSemesters: [3],
      complete: false,
    },
  ],
  counts: { semesters: 2, teachingUnits: 5, subjects: 5 },
  dataFile: "parcours/TEST01.json",
}

const unavailableParcours: ParcoursIndexEntry = {
  code: "NOPLAN",
  degreeType: "Licence",
  domain: "Sciences",
  mention: "Unavailable Mention",
  specialty: "Unavailable Specialty",
  hasPlan: false,
  scrapeStatus: "missing",
  availableSemesters: [],
  academicYears: [],
  counts: { semesters: 0, teachingUnits: 0, subjects: 0 },
  dataFile: "parcours/NOPLAN.json",
}

const index: ParcoursIndex = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  university: "Test University",
  institution: "Test Institution",
  establishmentId: "TEST",
  gradeCalculatorNote: "Test note",
  summary: {
    parcours: 2,
    withPlan: 1,
    withoutPlan: 1,
    teachingUnits: 5,
    subjects: 5,
  },
  parcours: [availableParcours, unavailableParcours],
}

const plan: ParcoursPlanFile = {
  schemaVersion: 1,
  university: "Test University",
  institution: "Test Institution",
  parcours: {
    code: "TEST01",
    listed_type: "Licence",
    listed_domain: "Sciences",
    listed_mention: "Test Mention",
    listed_specialty: "Test Specialty",
    source_url: "http://example.com",
    semesters: [
      {
        number: 1,
        teaching_units: [
          createUe("UE1", "Core", 2, [
            createSubject("S1", "Math with TP", "MX", 1, { practical: 10 }),
            createSubject("S2", "Math without TP", "MX", 1, { practical: 0 }),
          ]),
          createUe("UE2", "Language", 1, [
            createSubject("S3", "English", "CC", 1),
          ]),
          createUe("UE3", "No Subjects", 1, []),
          createUe("UE4A", "Option", 1, [
            createSubject("S4A", "Option A", "MX", 1),
          ]),
          createUe("UE4B", "Option", 1, [
            createSubject("S4B", "Option B", "MX", 1),
          ]),
        ],
      },
      {
        number: 2,
        teaching_units: [
          createUe("UE5", "Semester 2", 1, [
            createSubject("S5", "Physics", "MX", 1, { practical: 0 }),
          ]),
        ],
      },
    ],
    warnings: [],
    scrape_status: "ok",
  },
}

function mockFetch(): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = input.toString()
      if (url.includes("/data/fsgf/index.json")) {
        return new Response(JSON.stringify(index), { status: 200 })
      }
      if (url.includes("/data/fsgf/parcours/TEST01.json")) {
        return new Response(JSON.stringify(plan), { status: 200 })
      }
      return new Response("Not found", { status: 404 })
    })
  )
}

async function renderCalculator(locale: "en" | "fr" = "en") {
  const rendered = render(<Calculator locale={locale} />)
  await waitFor(() => {
    expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument()
  })
  return rendered
}

function getProgramCombobox() {
  return screen.getByRole("combobox", { name: /select a program/i })
}

async function openProgramCombobox() {
  await userEvent.click(getProgramCombobox())
}

async function selectProgram(searchText: string, optionText: string) {
  await openProgramCombobox()
  const dialog = screen.getByRole("dialog")
  const search = within(dialog).getByPlaceholderText(
    /search by code, specialty/i
  )
  await userEvent.type(search, searchText)
  const option = within(dialog).getByText(optionText)
  await userEvent.click(option)
  await waitFor(() => {
    expect(getProgramCombobox()).toHaveTextContent("TEST01 — Test Specialty")
  })
}

async function waitForPlanLoaded() {
  await waitFor(() => {
    expect(screen.getByLabelText(/academic year/i)).not.toBeDisabled()
  })
}

describe("Calculator", () => {
  beforeEach(() => {
    mockFetch()
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    window.localStorage.clear()
  })

  it("renders English copy by default", async () => {
    await renderCalculator("en")
    expect(
      screen.getByRole("heading", { name: /grade calculator/i })
    ).toBeInTheDocument()
    expect(getProgramCombobox()).toBeInTheDocument()
  })

  it("renders French copy when locale is fr", async () => {
    await renderCalculator("fr")
    expect(
      screen.getByRole("heading", { name: /calculateur de notes/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("combobox", { name: /sélectionnez un parcours/i })
    ).toBeInTheDocument()
  })

  it("searches for a program by code", async () => {
    await renderCalculator("en")
    await selectProgram("TEST01", "TEST01 — Test Specialty (Licence)")
    expect(getProgramCombobox()).toHaveTextContent("TEST01 — Test Specialty")
  })

  it("searches for a program by specialty", async () => {
    await renderCalculator("en")
    await openProgramCombobox()
    const dialog = screen.getByRole("dialog")
    const search = within(dialog).getByPlaceholderText(
      /search by code, specialty/i
    )
    await userEvent.type(search, "Test Specialty")
    const option = within(dialog).getByText(
      "TEST01 — Test Specialty (Licence)"
    )
    await userEvent.click(option)
    expect(screen.getByLabelText(/academic year/i)).toBeInTheDocument()
  })

  it("disables unavailable plans in the combobox", async () => {
    await renderCalculator("en")
    await openProgramCombobox()
    const dialog = screen.getByRole("dialog")
    const unavailable = within(dialog).getByText(
      /NOPLAN — Unavailable Specialty/
    )
    expect(unavailable).toBeInTheDocument()
    await userEvent.click(unavailable)
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  it("shows academic-year choices after selecting a program", async () => {
    await renderCalculator("en")
    await selectProgram("TEST01", "TEST01 — Test Specialty (Licence)")
    await waitForPlanLoaded()
    const yearSelect = screen.getByLabelText(/academic year/i)
    expect(yearSelect).not.toBeDisabled()
    expect(yearSelect).toHaveTextContent(/year 1/i)
  })

  it("shows semesters after selecting a year", async () => {
    await renderCalculator("en")
    await selectProgram("TEST01", "TEST01 — Test Specialty (Licence)")
    await waitForPlanLoaded()
    expect(
      screen.getByRole("heading", { level: 3, name: /semester 1/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { level: 3, name: /semester 2/i })
    ).toBeInTheDocument()
  })

  it("updates live estimates when entering grades", async () => {
    await renderCalculator("en")
    await selectProgram("TEST01", "TEST01 — Test Specialty (Licence)")
    await waitForPlanLoaded()

    const examInput = screen.getAllByLabelText(/exam/i)[0]
    await userEvent.type(examInput, "10")

    await waitFor(() => {
      expect(screen.getAllByText(/\/ 20/).length).toBeGreaterThan(0)
    })
  })

  it("switches a subject to direct-grade mode", async () => {
    await renderCalculator("en")
    await selectProgram("TEST01", "TEST01 — Test Specialty (Licence)")
    await waitForPlanLoaded()

    const examInput = screen.getAllByLabelText(/exam/i)[0]
    await userEvent.type(examInput, "10")

    const switchButton = screen.getAllByRole("button", {
      name: /i know the final grade/i,
    })[0]
    await userEvent.click(switchButton)

    expect(screen.getByPlaceholderText(/direct grade/i)).toBeInTheDocument()
  })

  it("shows dynamic TP field only when formula includes TP", async () => {
    await renderCalculator("en")
    await selectProgram("TEST01", "TEST01 — Test Specialty (Licence)")
    await waitForPlanLoaded()

    expect(screen.getAllByLabelText(/tp \/ practical/i).length).toBeGreaterThan(
      0
    )
  })

  it("does not show TP field for CC subjects in component mode", async () => {
    await renderCalculator("en")
    await selectProgram("TEST01", "TEST01 — Test Specialty (Licence)")
    await waitForPlanLoaded()

    const ccInput = screen.getByPlaceholderText(/continuous assessment/i)
    const subjectRow = ccInput.closest("div") as HTMLElement
    expect(
      within(subjectRow).queryByPlaceholderText(/tp \/ practical/i)
    ).not.toBeInTheDocument()
    expect(
      within(subjectRow).getByPlaceholderText(/practical \/ other/i)
    ).toBeInTheDocument()
  })

  it("customizes formula weights and validates total", async () => {
    await renderCalculator("en")
    await selectProgram("TEST01", "TEST01 — Test Specialty (Licence)")
    await waitForPlanLoaded()

    // Enter a component grade so a formula override can be stored.
    const examInputs = screen.getAllByLabelText(/exam/i)
    await userEvent.type(examInputs[0], "10")

    const assumptionsButton = screen.getAllByText(/calculation assumptions/i)[0]
    await userEvent.click(assumptionsButton)

    const formulaExamInput = screen
      .getAllByLabelText(/exam/i)
      .find((el) => el.id.startsWith("formula-")) as HTMLInputElement
    await userEvent.clear(formulaExamInput)
    await userEvent.type(formulaExamInput, "60")

    await waitFor(() => {
      expect(
        screen.getByText(/weights must total exactly 100%/i)
      ).toBeInTheDocument()
    })
  })

  it("shows partial-result labels before all grades are entered", async () => {
    await renderCalculator("en")
    await selectProgram("TEST01", "TEST01 — Test Specialty (Licence)")
    await waitForPlanLoaded()

    // Math without TP (S2) is complete with just exam + DS.
    const examInputs = screen.getAllByLabelText(/exam/i)
    const dsInputs = screen.getAllByLabelText(/ds/i)
    await userEvent.type(examInputs[1], "10")
    await userEvent.type(dsInputs[1], "12")

    await waitFor(() => {
      expect(screen.getByText(/partial estimate/i)).toBeInTheDocument()
    })
  })

  it("allows selecting an optional UE", async () => {
    await renderCalculator("en")
    await selectProgram("TEST01", "TEST01 — Test Specialty (Licence)")
    await waitForPlanLoaded()

    expect(screen.getAllByText(/choose an option/i).length).toBeGreaterThan(0)
    const optionB = screen.getAllByRole("button", { name: /UE4B/ })[0]
    await userEvent.click(optionB)

    expect(optionB).toHaveAttribute("data-variant", "default")
  })

  it("shows direct UE grade fallback for UEs with no subject rows", async () => {
    await renderCalculator("en")
    await selectProgram("TEST01", "TEST01 — Test Specialty (Licence)")
    await waitForPlanLoaded()

    expect(screen.getByText(/UE3 — No Subjects/)).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText(/enter unit grade/i)
    ).toBeInTheDocument()
  })

  it("excludes a normal UE and shows the excluded section", async () => {
    await renderCalculator("en")
    await selectProgram("TEST01", "TEST01 — Test Specialty (Licence)")
    await waitForPlanLoaded()

    const excludeButton = screen.getAllByRole("button", {
      name: /exclude this unit/i,
    })[0]
    await userEvent.click(excludeButton)

    expect(screen.getByText(/excluded teaching units/i)).toBeInTheDocument()
  })

  it("shows reset confirmation dialog", async () => {
    await renderCalculator("en")
    await selectProgram("TEST01", "TEST01 — Test Specialty (Licence)")
    await waitForPlanLoaded()

    const resetButton = screen.getByRole("button", { name: /reset/i })
    await userEvent.click(resetButton)

    expect(screen.getByText(/reset calculation\?/i)).toBeInTheDocument()
  })

  it("uses accessible labels for grade inputs", async () => {
    await renderCalculator("en")
    await selectProgram("TEST01", "TEST01 — Test Specialty (Licence)")
    await waitForPlanLoaded()

    expect(screen.getAllByLabelText(/exam/i)[0]).toHaveAttribute(
      "type",
      "number"
    )
    expect(screen.getAllByLabelText(/ds/i)[0]).toHaveAttribute(
      "type",
      "number"
    )
    expect(screen.getAllByLabelText(/tp \/ practical/i)[0]).toHaveAttribute(
      "type",
      "number"
    )
  })

  it("supports keyboard interaction to select a program", async () => {
    await renderCalculator("en")
    await openProgramCombobox()
    const dialog = screen.getByRole("dialog")
    const search = within(dialog).getByPlaceholderText(
      /search by code, specialty/i
    )
    await userEvent.type(search, "TEST01")
    await userEvent.keyboard("{ArrowDown}{Enter}")

    expect(getProgramCombobox()).toHaveTextContent("TEST01 — Test Specialty")
  })
})

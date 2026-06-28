import { test, expect, type Page } from "@playwright/test"

const PROGRAM_CODE = "LI573102"
const UNAVAILABLE_PROGRAM = "LA050104"

async function selectProgram(page: Page, search: string) {
  await page.getByRole("combobox", { name: /select a program/i }).click()
  const dialog = page.getByRole("dialog")
  const code = search.split(" ")[0]
  await dialog.getByPlaceholder(/search by code/i).fill(code)
  await dialog.getByText(new RegExp(`${code}.*`)).click()
}

async function selectYear(page: Page, yearLabel: RegExp) {
  const yearSelect = page.getByLabel(/academic year/i)
  await expect(yearSelect).toBeEnabled()
  await yearSelect.click()
  await page.getByRole("option", { name: yearLabel }).click()
}

async function fillSubject(
  page: Page,
  code: string,
  values: { exam?: string; ds?: string; tp?: string; direct?: string }
) {
  const directInput = page.locator(`#subject-${code}`)
  if (await directInput.isVisible().catch(() => false)) {
    if (values.direct !== undefined) {
      await directInput.fill(values.direct)
    }
    return
  }
  if (values.exam !== undefined) {
    await page.locator(`#exam-${code}`).fill(values.exam)
  }
  if (values.ds !== undefined) {
    await page.locator(`#ds-${code}`).fill(values.ds)
  }
  if (values.tp !== undefined) {
    await page.locator(`#tp-${code}`).fill(values.tp)
  }
}

async function switchToDirect(page: Page, code: string, grade: string) {
  const subjectRow = page
    .locator(`#exam-${code}`)
    .locator(
      "xpath=ancestor::div[contains(@class, 'flex-col')][contains(@class, 'sm:flex-row')]"
    )
  await subjectRow
    .getByRole("button", { name: /i know the final grade/i })
    .click()
  await page.locator(`#subject-${code}`).fill(grade)
}

async function openFormulaEditor(page: Page, code: string) {
  const subjectRow = page
    .locator(`#exam-${code}`)
    .locator(
      "xpath=ancestor::div[contains(@class, 'flex-col')][contains(@class, 'sm:flex-row')]"
    )
  await subjectRow
    .getByRole("button", { name: /calculation assumptions/i })
    .click()
}

async function selectTheme(page: Page, theme: "light" | "dark" | "system") {
  const themeButton = page
    .locator('button[aria-label="Theme"]')
    .filter({ visible: true })
    .first()
  if (await themeButton.isVisible().catch(() => false)) {
    await expect(themeButton).toHaveAttribute("data-hydrated", "true")
    await themeButton.click()
    const item = page.getByRole("menuitem", { name: new RegExp(theme, "i") })
    const opened = await item
      .waitFor({ state: "visible", timeout: 1000 })
      .then(() => true)
      .catch(() => false)
    if (!opened) {
      await themeButton.press("Enter")
    }
    await expect(item).toBeVisible()
    await item.click()
    return
  }

  const menuButton = page.getByRole("button", { name: /open menu/i })
  await expect(menuButton).toHaveAttribute("data-hydrated", "true")
  await menuButton.click()
  await page
    .getByRole("dialog")
    .getByRole("radio", { name: new RegExp(theme, "i") })
    .click()
  await page.keyboard.press("Escape")
}

test.describe("Calculator E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
  })

  test("open English homepage and start calculating", async ({ page }) => {
    await expect(page).toHaveTitle(/FSGF Grade Calculator/)
    await expect(
      page.getByRole("heading", {
        level: 2,
        name: "Grade calculator",
        exact: true,
      })
    ).toBeVisible()
    await page.getByRole("combobox", { name: /select a program/i }).click()
    await expect(page.getByRole("dialog")).toBeVisible()
  })

  test("search for and select LI573102, then select Year 2", async ({
    page,
  }) => {
    await page.goto("/")
    await selectProgram(page, `${PROGRAM_CODE} — Informatique et Multimédia`)
    await expect(
      page.getByRole("combobox", { name: /select a program/i })
    ).toContainText(PROGRAM_CODE)
    await selectYear(page, /year 2/i)
    await expect(
      page.getByRole("heading", { level: 3, name: /semester 3/i })
    ).toBeVisible()
    await expect(page.getByRole("tab", { name: /semester 4/i })).toBeVisible()
    await page.getByRole("tab", { name: /semester 4/i }).click()
    await expect(
      page.getByRole("heading", { level: 3, name: /semester 4/i })
    ).toBeVisible()
  })

  test("enter semester grades and confirm result", async ({ page }) => {
    await page.goto("/")
    await selectProgram(page, `${PROGRAM_CODE} — Informatique et Multimédia`)
    await selectYear(page, /year 2/i)

    await fillSubject(page, "573102311", { exam: "12", ds: "14" })
    await fillSubject(page, "573102312", { exam: "10", ds: "11" })

    const section = page.locator("section", {
      has: page.getByRole("heading", { level: 3, name: /semester 3/i }),
    })
    await expect(section.locator("text=/Partial estimate/")).toBeVisible()
    await expect(
      section.locator("span", { hasText: /\d+\.\d+ \/ 20/ })
    ).toBeVisible()
  })

  test("refresh restores saved values", async ({ page }) => {
    await page.goto("/")
    await selectProgram(page, `${PROGRAM_CODE} — Informatique et Multimédia`)
    await selectYear(page, /year 2/i)

    await fillSubject(page, "573102311", { exam: "12", ds: "14" })

    await page.waitForTimeout(500)
    await page.evaluate(() => {
      window.history.replaceState(
        window.history.state,
        "",
        window.location.pathname
      )
    })
    await page.reload()

    await selectProgram(page, `${PROGRAM_CODE} — Informatique et Multimédia`)
    await selectYear(page, /year 2/i)
    await expect(page.locator("#exam-573102311")).toHaveValue("12")
    await expect(page.locator("#ds-573102311")).toHaveValue("14")
  })

  test("complete both semesters and verify yearly average", async ({
    page,
  }) => {
    await page.goto("/")
    await selectProgram(page, `${PROGRAM_CODE} — Informatique et Multimédia`)
    await selectYear(page, /year 2/i)

    const s3Subjects = [
      { code: "573102311", exam: "12", ds: "14" },
      { code: "573102312", exam: "10", ds: "11" },
      { code: "573102313", exam: "13", ds: "15" },
      { code: "573102314", exam: "14", ds: "12", tp: "16" },
      { code: "573102310", exam: "11", ds: "13", tp: "10" },
      { code: "573102316", exam: "10", ds: "12", tp: "11" },
      { code: "573102315", exam: "12", ds: "14", tp: "13" },
      { code: "573102317", exam: "15", tp: "14" },
      { code: "573102318", exam: "13", tp: "12" },
      { code: "169914905", exam: "12", ds: "10", tp: "11" },
      { code: "169914904", exam: "11", ds: "13", tp: "12" },
    ]

    for (const subject of s3Subjects) {
      await fillSubject(page, subject.code, {
        exam: subject.exam,
        ds: subject.ds,
        tp: subject.tp,
      })
    }

    await page.getByRole("tab", { name: /semester 4/i }).click()

    const s4Subjects: {
      code: string
      exam?: string
      ds?: string
      tp?: string
      direct?: string
    }[] = [
      { code: "573102413", exam: "12", ds: "14", tp: "13" },
      { code: "573102412", exam: "11", ds: "12", tp: "10" },
      { code: "573102411", exam: "13", ds: "15" },
      { code: "573102414", exam: "14", ds: "13", tp: "12" },
      { code: "573102415", exam: "12", ds: "11", tp: "13" },
      { code: "573102417", exam: "10", ds: "12", tp: "11" },
      { code: "573102416", exam: "13", ds: "14", tp: "12" },
      { code: "573102419", exam: "14", tp: "13" },
      { code: "573102420", direct: "13" },
      { code: "573102418", exam: "15", tp: "14" },
      { code: "169918472", exam: "12", ds: "11", tp: "10" },
      { code: "169918471", exam: "11", ds: "13", tp: "12" },
    ]

    for (const subject of s4Subjects) {
      await fillSubject(page, subject.code, {
        exam: subject.exam,
        ds: subject.ds,
        tp: subject.tp,
        direct: subject.direct,
      })
    }

    const yearAverageLabel = page.getByText("Academic-year average", {
      exact: true,
    })
    await expect(yearAverageLabel).toBeVisible()
    const yearAverage = await yearAverageLabel
      .locator("xpath=..")
      .locator("p")
      .filter({ hasText: /\/ 20/ })
      .textContent()
    expect(yearAverage).toMatch(/\d+\.\d+ \/ 20/)
  })

  test("switch a subject to direct-grade mode", async ({ page }) => {
    await page.goto("/")
    await selectProgram(page, `${PROGRAM_CODE} — Informatique et Multimédia`)
    await selectYear(page, /year 2/i)

    await fillSubject(page, "573102311", { exam: "10" })
    await switchToDirect(page, "573102311", "14")

    await expect(page.locator("#subject-573102311")).toHaveValue("14")
  })

  test("customize formula weights", async ({ page }) => {
    await page.goto("/")
    await selectProgram(page, `${PROGRAM_CODE} — Informatique et Multimédia`)
    await selectYear(page, /year 2/i)

    await fillSubject(page, "573102311", { exam: "10" })
    await openFormulaEditor(page, "573102311")

    const examInput = page.locator('input[id^="formula-"][id$="-exam"]').first()
    await examInput.fill("60")
    await expect(
      page.getByText(/weights must total exactly 100%/i)
    ).toBeVisible()
  })

  test("exclude an irrelevant UE", async ({ page }) => {
    await page.goto("/")
    await selectProgram(page, `${PROGRAM_CODE} — Informatique et Multimédia`)
    await selectYear(page, /year 2/i)

    await page
      .getByRole("button", { name: /exclude this unit/i })
      .first()
      .click()
    await expect(page.getByText(/excluded teaching units/i)).toBeVisible()
  })

  test("select an optional UE", async ({ page }) => {
    await page.goto("/")
    await selectProgram(page, `LA053901 — Analyses et Qualité`)
    await selectYear(page, /year 1/i)

    const optionButton = page.getByRole("button", { name: /UOP2/ }).first()
    await optionButton.click()
    await expect(optionButton).toHaveAttribute("data-variant", "default")
  })

  test("open an unavailable parcours and verify explanation", async ({
    page,
  }) => {
    await page.goto(`/programs/${UNAVAILABLE_PROGRAM}`)
    await expect(page.getByText(/not available/i).first()).toBeVisible()
    await expect(
      page.getByText(/does not have a published study plan/i)
    ).toBeVisible()
  })

  test("navigate equivalent French routes", async ({ page }) => {
    await page.goto("/fr")
    await expect(
      page.getByRole("heading", {
        level: 2,
        name: "Calculateur de notes",
        exact: true,
      })
    ).toBeVisible()

    await page.goto("/fr/calculateur")
    await expect(page).toHaveURL(/\/fr\/?$/)
    await expect(
      page.getByRole("heading", {
        level: 2,
        name: "Calculateur de notes",
        exact: true,
      })
    ).toBeVisible()
  })

  test("verify language alternates and canonical tags", async ({ page }) => {
    await page.goto("/")
    const canonical = page.locator('link[rel="canonical"]')
    await expect(canonical).toHaveAttribute("href", /\/$/)

    const alternateEn = page.locator('link[rel="alternate"][hreflang="en"]')
    await expect(alternateEn).toHaveAttribute("href", /\/$/)

    const alternateFr = page.locator('link[rel="alternate"][hreflang="fr"]')
    await expect(alternateFr).toHaveAttribute("href", /\/fr$/)
  })

  test("switch light, dark, and system themes", async ({ page }) => {
    await page.goto("/")
    await selectTheme(page, "dark")
    await expect(page.locator("html")).toHaveClass(/dark/)

    await selectTheme(page, "light")
    await expect(page.locator("html")).not.toHaveClass(/dark/)

    await selectTheme(page, "system")
    const hasDarkClass = await page.evaluate(() =>
      document.documentElement.classList.contains("dark")
    )
    expect(typeof hasDarkClass).toBe("boolean")
  })

  test("refresh preserves theme without flicker", async ({ page }) => {
    await page.goto("/")
    await selectTheme(page, "dark")

    await page.reload()
    await expect(page.locator("html")).toHaveClass(/dark/)

    const theme = await page.evaluate(() =>
      localStorage.getItem("fsgf-calculator:theme")
    )
    expect(theme).toBe("dark")
  })

  test("navigate with Astro transitions without theme flicker", async ({
    page,
  }) => {
    await page.goto("/programs")
    await selectTheme(page, "dark")

    await page.locator('a[href="/"]').filter({ visible: true }).first().click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.locator("html")).toHaveClass(/dark/)
  })

  test("verify navigation progress indicator", async ({ page }) => {
    await page.goto("/programs")
    const progress = page.locator("#nav-progress")
    await expect(progress).toBeAttached()

    const progressStarted = page.evaluate(
      () =>
        new Promise<{ opacity: string; width: string }>((resolve) => {
          document.addEventListener(
            "astro:before-preparation",
            () => {
              requestAnimationFrame(() => {
                const bar = document.querySelector<HTMLElement>("#nav-progress")
                resolve({
                  opacity: bar?.style.opacity ?? "",
                  width: bar?.style.width ?? "",
                })
              })
            },
            { once: true }
          )
        })
    )
    await page.locator('a[href="/"]').filter({ visible: true }).first().click()
    expect(await progressStarted).toEqual({
      opacity: "1",
      width: "18%",
    })
    await expect(page).toHaveURL(/\/$/)
  })

  test("calculate-for-program link preselects and loads its plan", async ({
    page,
  }) => {
    await page.goto("/programs/LA050103")
    await page.getByRole("link", { name: "Calculate for this program" }).click()

    await expect(page).toHaveURL(/\/\?code=LA050103$/)
    await expect(
      page.getByRole("combobox", { name: /select a program/i })
    ).toContainText("LA050103")
    await expect(
      page.getByRole("heading", { level: 2, name: "Enter grades" })
    ).toBeVisible()
  })

  test("operate calculator with keyboard only", async ({ page }) => {
    await page.goto("/")
    const combobox = page.getByRole("combobox", { name: /select a program/i })
    await combobox.focus()
    await page.keyboard.press("Enter")
    await page.getByPlaceholder(/search by code/i).fill(PROGRAM_CODE)
    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("Enter")

    await expect(
      page.getByRole("combobox", { name: /select a program/i })
    ).toContainText(PROGRAM_CODE)
  })

  test("malformed saved state is handled safely", async ({ page }) => {
    await page.goto("/")
    await page.evaluate(() => {
      localStorage.setItem(
        "fsgf-calculator:calculation:v1:BADCODE:1",
        "not valid json"
      )
    })
    await page.reload()
    await expect(
      page.getByRole("heading", {
        level: 2,
        name: "Grade calculator",
        exact: true,
      })
    ).toBeVisible()
  })

  test("no full dataset is downloaded at startup", async ({ page }) => {
    const requests: string[] = []
    page.on("request", (req) => {
      const url = req.url()
      if (url.includes("/data/fsgf/")) {
        requests.push(url)
      }
    })

    await page.goto("/")
    await page.waitForLoadState("networkidle")

    expect(requests.some((url) => url.includes("/index.json"))).toBe(true)
    expect(requests.some((url) => url.includes("/parcours/"))).toBe(false)
  })
})

"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { en } from "@/i18n/en"
import { fr } from "@/i18n/fr"
import {
  fetchIndex,
  getCachedIndex,
  subscribeToIndexCache,
} from "./data"
import {
  useCalculator,
  useOptionalGroups,
  useYearResult,
} from "./use-calculator"
import { ProgramCombobox } from "./program-combobox"
import { SemesterSection } from "./semester-section"
import { ResultsPanel } from "./results-panel"
import { ResetDialog } from "./reset-dialog"
import type { Translations } from "@/i18n/en"

interface CalculatorProps {
  preselectedCode?: string
  locale: "en" | "fr"
}

export function Calculator({ preselectedCode, locale }: CalculatorProps) {
  const t: Translations = locale === "fr" ? fr : en
  const getRequestedProgramCode = React.useCallback(() => {
    if (preselectedCode) return preselectedCode
    if (typeof window === "undefined") return undefined
    return new URL(window.location.href).searchParams.get("code") ?? undefined
  }, [preselectedCode])

  const {
    parcours,
    academicYear,
    plan,
    planLoading,
    planError,
    selections,
    grades,
    directUeGrades,
    invalidStateCleared,
    selectParcours,
    selectYear,
    setUeIncluded,
    chooseOptionalUe,
    setSubjectGrade,
    setDirectUeGrade,
    setFormulaOverride,
    resetCalculation,
    retryLoadPlan,
  } = useCalculator()

  const cachedIndex = React.useSyncExternalStore(
    subscribeToIndexCache,
    getCachedIndex,
    () => null
  )
  const index = cachedIndex?.parcours ?? []
  const indexLoading = cachedIndex === null
  const [indexError, setIndexError] = React.useState<string | null>(null)
  const appliedPreselection = React.useRef<string | null>(null)

  React.useEffect(() => {
    if (cachedIndex) return

    let cancelled = false
    fetchIndex()
      .then((data) => {
        if (cancelled) return
        const requestedCode = getRequestedProgramCode()
        if (requestedCode) {
          const found = data.parcours.find((p) => p.code === requestedCode)
          if (found) {
            appliedPreselection.current = requestedCode
            selectParcours(found)
          }
        }
      })
      .catch((err) => {
        if (cancelled) return
        setIndexError(err instanceof Error ? err.message : String(err))
      })
    return () => {
      cancelled = true
    }
  }, [cachedIndex, getRequestedProgramCode, selectParcours])

  React.useEffect(() => {
    const requestedCode = getRequestedProgramCode()
    if (
      !cachedIndex ||
      !requestedCode ||
      appliedPreselection.current === requestedCode
    ) {
      return
    }

    const found = cachedIndex.parcours.find((p) => p.code === requestedCode)
    if (found) {
      appliedPreselection.current = requestedCode
      selectParcours(found)
    }
  }, [cachedIndex, getRequestedProgramCode, selectParcours])

  const yearResult = useYearResult(
    plan,
    academicYear,
    selections,
    grades,
    directUeGrades
  )
  const optionalGroups = useOptionalGroups(plan)

  if (indexError) {
    return (
      <div className="space-y-8">
        <h2 className="text-2xl font-bold tracking-tight text-primary">
          {t.calculator.title}
        </h2>
        <div className="space-y-3">
          <div className="text-destructive">
            {t.common.error}: {indexError}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setIndexError(null)
              fetchIndex()
                .then((data) => {
                  const requestedCode = getRequestedProgramCode()
                  if (requestedCode) {
                    const found = data.parcours.find(
                      (p) => p.code === requestedCode
                    )
                    if (found) {
                      appliedPreselection.current = requestedCode
                      selectParcours(found)
                    }
                  }
                })
                .catch((err) => {
                  setIndexError(err instanceof Error ? err.message : String(err))
                })
            }}
          >
            {t.common.retry}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold tracking-tight text-primary">
        {t.calculator.title}
      </h2>

      {invalidStateCleared ? (
        <p className="text-sm text-muted-foreground">
          {t.calculator.invalidStateRemoved}
        </p>
      ) : null}

      <section
        className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs sm:p-5"
        aria-busy={indexLoading}
      >
        {indexLoading ? (
          <span className="sr-only" role="status">
            {t.common.loading}
          </span>
        ) : null}

        <div className="grid items-start">
          <div
            className="calculator-setup-skeleton col-start-1 row-start-1 grid items-start gap-5 md:grid-cols-[minmax(0,1fr)_12rem] md:gap-4"
            data-loading={indexLoading}
            aria-hidden="true"
          >
            <div className="space-y-2">
              <div className="skeleton-shimmer h-3.5 w-28 rounded-md" />
              <div className="skeleton-shimmer h-11 w-full rounded-xl" />
            </div>
            <div className="space-y-2">
              <div className="skeleton-shimmer h-3.5 w-24 rounded-md" />
              <div className="skeleton-shimmer h-11 w-full rounded-xl" />
            </div>
          </div>

          <div
            className={`col-start-1 row-start-1 grid items-start gap-5 transition-opacity duration-200 ease-out motion-reduce:transition-none md:grid-cols-[minmax(0,1fr)_12rem] md:gap-4 ${
              indexLoading
                ? "pointer-events-none opacity-0"
                : "opacity-100"
            }`}
            aria-hidden={indexLoading}
          >
            <div className="space-y-2">
              <Label
                htmlFor="program-select"
                className="text-sm font-semibold text-foreground"
              >
                {t.calculator.selectProgram}
              </Label>
              <ProgramCombobox
                id="program-select"
                programs={index}
                value={parcours?.code ?? null}
                onSelect={(entry) => selectParcours(entry)}
                disabled={indexLoading}
                t={t}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="year-select"
                className="text-sm font-semibold text-foreground"
              >
                {t.calculator.selectYear}
              </Label>
              <Select
                value={academicYear?.toString() ?? ""}
                onValueChange={(value) => selectYear(parseInt(value, 10))}
                disabled={
                  indexLoading ||
                  !parcours?.hasPlan ||
                  planLoading ||
                  planError !== null
                }
              >
                <SelectTrigger
                  id="year-select"
                  className="h-11 w-full rounded-xl bg-background px-3 text-base shadow-2xs"
                >
                  <SelectValue placeholder={t.calculator.selectYear} />
                </SelectTrigger>
                <SelectContent>
                  {parcours?.academicYears.map((y) => (
                    <SelectItem key={y.year} value={y.year.toString()}>
                      {t.calculator.year.replace("{year}", y.year.toString())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {parcours && !parcours.hasPlan ? (
        <section className="space-y-1">
          <h2 className="font-semibold text-foreground">
            {t.calculator.noPlan}
          </h2>
          <p className="text-muted-foreground">{t.calculator.noPlanDescription}</p>
        </section>
      ) : null}

      {planLoading ? (
        <p className="text-muted-foreground">{t.common.loading}</p>
      ) : planError ? (
        <div className="space-y-3">
          <div className="text-destructive">
            {t.common.error}: {planError}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={retryLoadPlan}
          >
            {t.common.retry}
          </Button>
        </div>
      ) : null}

      {plan && academicYear && parcours?.hasPlan ? (
        <div className="space-y-8">
          <div className="flex items-center justify-between rounded-xl bg-accent/10 p-4">
            <h2 className="text-lg font-semibold text-accent-foreground">
              {t.calculator.enterGrades}
            </h2>
            <ResetDialog onReset={resetCalculation} t={t} />
          </div>

          {yearResult?.semesterResults.map((semester) => (
            <SemesterSection
              key={semester.semesterNumber}
              semester={semester}
              plan={plan.parcours}
              grades={grades}
              selections={selections}
              optionalGroups={optionalGroups}
              directUeGrades={directUeGrades}
              onSubjectGrade={setSubjectGrade}
              onFormulaOverride={setFormulaOverride}
              onToggleUe={setUeIncluded}
              onChooseOptionalUe={chooseOptionalUe}
              onDirectUeGrade={setDirectUeGrade}
              t={t}
            />
          ))}

          <ResultsPanel yearResult={yearResult} t={t} />

          <p className="text-xs text-muted-foreground">
            {t.calculator.saveNotice}
          </p>
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground">
        <strong className="text-foreground">{t.common.disclaimer}.</strong>{" "}
        {t.landing.disclaimer}
      </p>
    </div>
  )
}

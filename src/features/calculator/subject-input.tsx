"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { Subject, SubjectGradeEntry, FormulaConfig } from "@/lib/schemas"
import {
  calculateSubjectGrade,
  getDefaultFormula,
  normalizeRegime,
  shouldDefaultToDirectGrade,
} from "./calculation"
import { FormulaEditor } from "./formula-editor"
import { formatNumber } from "./calculator-utils"
import { GradeInput } from "./grade-input"
import type { Translations } from "@/i18n/en"

interface SubjectInputProps {
  subject: Subject
  entry: SubjectGradeEntry | undefined
  onChange: (entry: SubjectGradeEntry | null) => void
  onFormulaOverride: (formula: FormulaConfig) => void
  t: Translations
}

function getComponentLabels(subject: Subject, t: Translations) {
  const regime = normalizeRegime(subject.exam_regime)
  const isCC = regime === "CC"
  return {
    exam: isCC ? t.calculator.cc : t.calculator.exam,
    ds: t.calculator.ds,
    tp: isCC ? t.calculator.practicalOther : t.calculator.tp,
  }
}

export function SubjectInput({
  subject,
  entry,
  onChange,
  onFormulaOverride,
  t,
}: SubjectInputProps) {
  const defaultsToDirect = shouldDefaultToDirectGrade(subject)
  const [modePreference, setModePreference] = React.useState<"direct" | "components" | null>(
    null
  )
  const mode =
    entry?.mode ??
    modePreference ??
    (defaultsToDirect ? "direct" : "components")
  const components = React.useMemo(
    () => (entry?.mode === "components" ? entry.components : {}),
    [entry]
  )
  const direct = React.useMemo(
    () => (entry?.mode === "direct" ? entry.direct : undefined),
    [entry]
  )
  const formula = React.useMemo(
    () =>
      mode === "components"
        ? (entry?.mode === "components" ? entry.formula : undefined) ??
          getDefaultFormula(subject)
        : null,
    [mode, entry, subject]
  )

  const labels = getComponentLabels(subject, t)
  const result = calculateSubjectGrade(subject, entry)

  const switchToDirect = React.useCallback(() => {
    const current = calculateSubjectGrade(subject, entry).grade
    let preserved: number | undefined
    if (current !== null) {
      preserved = current
    } else {
      preserved =
        components.exam ?? components.ds ?? components.tp ?? undefined
    }
    setModePreference("direct")
    if (preserved === undefined) {
      onChange(null)
    } else {
      onChange({ mode: "direct", direct: preserved })
    }
  }, [subject, entry, components, onChange])

  const switchToComponents = React.useCallback(() => {
    const next: SubjectGradeEntry = {
      mode: "components",
      components: { exam: direct },
    }
    setModePreference("components")
    onChange(next)
  }, [direct, onChange])

  const updateComponent = React.useCallback(
    (field: "exam" | "ds" | "tp", value: number | null) => {
      const nextComponents = {
        ...components,
        [field]: value === null ? undefined : value,
      }
      const hasAny =
        nextComponents.exam !== undefined ||
        nextComponents.ds !== undefined ||
        nextComponents.tp !== undefined
      if (!hasAny) {
        onChange(null)
      } else {
        onChange({ mode: "components", components: nextComponents })
      }
    },
    [components, onChange]
  )

  const setDirect = React.useCallback(
    (value: number | null) => {
      if (value === null) {
        onChange(null)
      } else {
        onChange({ mode: "direct", direct: value })
      }
    },
    [onChange]
  )

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{subject.name}</p>
        <p className="text-xs text-primary">
          {t.calculator.finalGrade}: {formatNumber(result.grade)} / 20
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          {mode === "components" ? (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={switchToDirect}
            >
              {t.calculator.switchToDirect}
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={switchToComponents}
            >
              {t.calculator.switchToComponents}
            </Button>
          )}
        </div>

        {mode === "direct" ? (
          <div className="flex items-center gap-2">
            <GradeInput
              id={`subject-${subject.code}`}
              value={direct}
              placeholder={t.calculator.directGrade}
              ariaLabel={t.calculator.directGrade}
              onChange={setDirect}
              className="w-24"
            />
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {formula !== null && formula.exam > 0 && (
              <>
                <Label className="sr-only" htmlFor={`exam-${subject.code}`}>
                  {labels.exam}
                </Label>
                <GradeInput
                  id={`exam-${subject.code}`}
                  value={components.exam}
                  placeholder={labels.exam}
                  ariaLabel={labels.exam}
                  onChange={(v) => updateComponent("exam", v)}
                  className="w-20"
                />
              </>
            )}
            {formula !== null && formula.ds > 0 && (
              <>
                <Label className="sr-only" htmlFor={`ds-${subject.code}`}>
                  {labels.ds}
                </Label>
                <GradeInput
                  id={`ds-${subject.code}`}
                  value={components.ds}
                  placeholder={labels.ds}
                  ariaLabel={labels.ds}
                  onChange={(v) => updateComponent("ds", v)}
                  className="w-20"
                />
              </>
            )}
            {formula !== null && formula.tp > 0 && (
              <>
                <Label className="sr-only" htmlFor={`tp-${subject.code}`}>
                  {labels.tp}
                </Label>
                <GradeInput
                  id={`tp-${subject.code}`}
                  value={components.tp}
                  placeholder={labels.tp}
                  ariaLabel={labels.tp}
                  onChange={(v) => updateComponent("tp", v)}
                  className="w-20"
                />
              </>
            )}
          </div>
        )}

        {mode === "components" && formula !== null && (
          <FormulaEditor
            subject={subject}
            formula={formula}
            onChange={onFormulaOverride}
            t={t}
          />
        )}
      </div>
    </div>
  )
}

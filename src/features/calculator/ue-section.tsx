"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { SubjectGradeEntry, FormulaConfig, TeachingUnit } from "@/lib/schemas"
import { calculateUeAverage } from "./calculation"
import { SubjectInput } from "./subject-input"
import { formatNumber } from "./calculator-utils"
import { GradeInput } from "./grade-input"
import type { Translations } from "@/i18n/en"

interface UeSectionProps {
  ue: TeachingUnit
  grades: Record<string, SubjectGradeEntry>
  directUeGrade: number | undefined
  onSubjectGrade: (code: string, entry: SubjectGradeEntry | null) => void
  onFormulaOverride: (subjectCode: string, formula: FormulaConfig) => void
  onToggle: () => void
  onDirectUeGrade: (code: string, grade: number | null) => void
  t: Translations
}

export function UeSection({
  ue,
  grades,
  directUeGrade,
  onSubjectGrade,
  onFormulaOverride,
  onToggle,
  onDirectUeGrade,
  t,
}: UeSectionProps) {
  const hasSubjects = ue.subjects.length > 0
  const ueResult = calculateUeAverage(ue, grades, directUeGrade)

  return (
    <div className="rounded-lg bg-muted/40 py-3 px-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="font-medium text-foreground">
            {ue.code} — {ue.name}
          </h4>
          <p className="text-xs text-muted-foreground">
            {t.programs.coefficients} {ue.coefficient} · {t.programs.credits}{" "}
            {ue.credits}
            {ueResult.average !== null || ueResult.partialAverage !== null
              ? ` · ${t.calculator.ueGrade}: ${formatNumber(
                  ueResult.average ?? ueResult.partialAverage
                )} / 20`
              : null}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={onToggle}
        >
          {t.calculator.excludeUe}
        </Button>
      </div>

      {hasSubjects ? (
        <div className="mt-3 space-y-3">
          {ue.subjects.map((subject) => (
            <SubjectInput
              key={subject.code}
              subject={subject}
              entry={grades[subject.code]}
              onChange={(entry) => onSubjectGrade(subject.code, entry)}
              onFormulaOverride={(formula) =>
                onFormulaOverride(subject.code, formula)
              }
              t={t}
            />
          ))}
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-muted-foreground">
            {t.calculator.missingSubjectsDescription}
          </p>
          <div className="flex items-center gap-2">
            <Label className="sr-only" htmlFor={`ue-${ue.code}`}>
              {t.calculator.enterDirectUeGrade}
            </Label>
            <GradeInput
              id={`ue-${ue.code}`}
              value={directUeGrade}
              placeholder={t.calculator.enterDirectUeGrade}
              ariaLabel={t.calculator.enterDirectUeGrade}
              onChange={(v) => onDirectUeGrade(ue.code, v)}
              className="w-32"
            />
          </div>
        </div>
      )}
    </div>
  )
}

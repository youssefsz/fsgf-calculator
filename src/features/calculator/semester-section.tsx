"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import type {
  ParcoursPlan,
  SubjectGradeEntry,
  TeachingUnit,
  TeachingUnitSelection,
} from "@/lib/schemas"
import type { SemesterResult } from "./calculation"
import { UeSection } from "./ue-section"
import { OptionalGroupSelector } from "./optional-group-selector"
import { formatNumber } from "./calculator-utils"
import type { Translations } from "@/i18n/en"
import type { FormulaConfig } from "@/lib/schemas"

interface SemesterSectionProps {
  semester: SemesterResult
  plan: ParcoursPlan
  grades: Record<string, SubjectGradeEntry>
  selections: Record<string, TeachingUnitSelection>
  optionalGroups: Map<string, TeachingUnit[]>
  directUeGrades: Record<string, number>
  onSubjectGrade: (code: string, entry: SubjectGradeEntry | null) => void
  onFormulaOverride: (subjectCode: string, formula: FormulaConfig) => void
  onToggleUe: (code: string, included: boolean) => void
  onChooseOptionalUe: (ueCode: string, groupCodes: string[]) => void
  onDirectUeGrade: (code: string, grade: number | null) => void
  t: Translations
}

export function SemesterSection({
  semester,
  plan,
  grades,
  selections,
  optionalGroups,
  directUeGrades,
  onSubjectGrade,
  onFormulaOverride,
  onToggleUe,
  onChooseOptionalUe,
  onDirectUeGrade,
  t,
}: SemesterSectionProps) {
  const semesterData = plan.semesters.find(
    (s) => s.number === semester.semesterNumber
  )

  const { normalUes, groups } = React.useMemo(() => {
    if (!semesterData) return { normalUes: [], groups: [] as TeachingUnit[][] }
    const optionalCodes = new Set<string>()
    const groupList: TeachingUnit[][] = []
    for (const group of optionalGroups.values()) {
      groupList.push(group)
      for (const ue of group) optionalCodes.add(ue.code)
    }
    const normal = semesterData.teaching_units.filter(
      (ue) => !optionalCodes.has(ue.code)
    )
    return { normalUes: normal, groups: groupList }
  }, [semesterData, optionalGroups])

  const { includedNormalUes, excludedNormalUes } = React.useMemo(() => {
    const included = normalUes.filter(
      (ue) => selections[ue.code]?.included !== false
    )
    const excluded = normalUes.filter(
      (ue) => selections[ue.code]?.included === false
    )
    return { includedNormalUes: included, excludedNormalUes: excluded }
  }, [normalUes, selections])

  const enteredSubjectCount = React.useMemo(() => {
    if (!semesterData) return 0
    let entered = 0
    for (const ue of semesterData.teaching_units) {
      if (selections[ue.code]?.included === false) continue
      for (const subject of ue.subjects) {
        const entry = grades[subject.code]
        if (!entry) continue
        if (entry.mode === "direct" || Object.keys(entry.components).length > 0) {
          entered += 1
        }
      }
      if (ue.subjects.length === 0 && directUeGrades[ue.code] !== undefined) {
        entered += 1
      }
    }
    return entered
  }, [semesterData, selections, grades, directUeGrades])

  const totalSubjectCount = React.useMemo(() => {
    if (!semesterData) return 0
    return semesterData.teaching_units.reduce(
      (sum, ue) => sum + Math.max(ue.subjects.length, 1),
      0
    )
  }, [semesterData])

  if (!semesterData) {
    return (
      <section className="space-y-3">
        <h3 className="font-medium">
          {t.calculator.semester.replace(
            "{semester}",
            semester.semesterNumber.toString()
          )}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t.calculator.missingSemester.replace(
            "{semester}",
            semester.semesterNumber.toString()
          )}
        </p>
      </section>
    )
  }

  const averageLabel = semester.isComplete
    ? t.calculator.semesterAverage
    : t.calculator.partialEstimate

  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-3">
        <h3 className="font-semibold text-foreground">
          {t.calculator.semester.replace(
            "{semester}",
            semester.semesterNumber.toString()
          )}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t.calculator.basedOn
            .replace("{entered}", enteredSubjectCount.toString())
            .replace("{total}", totalSubjectCount.toString())}
          {semester.hasAnyGrade ? (
            <>
              {" "}
              ·{" "}
              <span className="font-semibold text-accent">
                {averageLabel}: {formatNumber(semester.average ?? semester.partialAverage)} / 20
              </span>
            </>
          ) : null}
        </p>
      </div>

      <div className="grid gap-3">
        {groups.map((group) => (
          <OptionalGroupSelector
            key={group.map((u) => u.code).sort().join(",")}
            group={group}
            selections={selections}
            onChoose={onChooseOptionalUe}
            t={t}
          />
        ))}

        {includedNormalUes.map((ue) => (
          <UeSection
            key={ue.code}
            ue={ue}
            grades={grades}
            directUeGrade={directUeGrades[ue.code]}
            onSubjectGrade={onSubjectGrade}
            onFormulaOverride={onFormulaOverride}
            onToggle={() => onToggleUe(ue.code, false)}
            onDirectUeGrade={onDirectUeGrade}
            t={t}
          />
        ))}
      </div>

      {excludedNormalUes.length > 0 && (
        <div className="rounded-lg border border-dashed border-border p-3">
          <h4 className="mb-2 text-sm font-medium">
            {t.calculator.excludedUes}
          </h4>
          <div className="flex flex-wrap gap-2">
            {excludedNormalUes.map((ue) => (
              <Button
                key={ue.code}
                type="button"
                variant="outline"
                size="xs"
                onClick={() => onToggleUe(ue.code, true)}
              >
                {ue.code} — {ue.name} ({t.calculator.includeUe})
              </Button>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

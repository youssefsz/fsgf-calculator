"use client"

import type { YearResult } from "./calculation"
import { formatNumber } from "./calculator-utils"
import type { Translations } from "@/i18n/en"

interface ResultsPanelProps {
  yearResult: YearResult | null
  t: Translations
}

export function ResultsPanel({ yearResult, t }: ResultsPanelProps) {
  if (!yearResult) return null

  const { isComplete, average, semesterResults, hasAnyGrade } = yearResult

  return (
    <div className="space-y-4 rounded-xl bg-primary/5 p-4">
      <h3 className="font-semibold text-primary">{t.calculator.results}</h3>

      {isComplete && average !== null ? (
        <div className="space-y-1">
          <p className="text-sm text-primary/80">
            {t.calculator.yearAverage}
          </p>
          <p className="text-3xl font-bold tracking-tight text-primary">
            {formatNumber(average)} <span className="text-xl text-primary/70">/ 20</span>
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {t.calculator.completeAllSubjects}
          </p>
          {hasAnyGrade && (
            <div className="space-y-2">
              {semesterResults.map((semester) => (
                <div
                  key={semester.semesterNumber}
                  className="flex items-center justify-between rounded-lg bg-background/60 px-3 py-2 text-sm"
                >
                  <span className="text-muted-foreground">
                    {t.calculator.semester.replace(
                      "{semester}",
                      semester.semesterNumber.toString()
                    )}
                  </span>
                  <span className="font-semibold text-primary">
                    {semester.hasAnyGrade
                      ? `${formatNumber(
                          semester.average ?? semester.partialAverage
                        )} / 20`
                      : t.calculator.notYetAvailable}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

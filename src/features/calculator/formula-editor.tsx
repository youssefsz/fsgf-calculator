"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { FormulaConfig, Subject } from "@/lib/schemas"
import { assertFormulaTotalsOneHundred } from "@/lib/schemas"
import { getDefaultFormula } from "./calculation"
import type { Translations } from "@/i18n/en"

interface FormulaEditorProps {
  subject: Subject
  formula: FormulaConfig
  onChange: (formula: FormulaConfig) => void
  t: Translations
}

function percentageValue(decimal: number): number {
  return Math.round(decimal * 100)
}

function decimalValue(percentage: number): number {
  return Math.round(percentage) / 100
}

export function FormulaEditor({
  subject,
  formula,
  onChange,
  t,
}: FormulaEditorProps) {
  const [open, setOpen] = React.useState(false)
  const isValid = assertFormulaTotalsOneHundred(formula)
  const total = percentageValue(formula.exam + formula.ds + formula.tp)

  const updateField = React.useCallback(
    (field: keyof FormulaConfig, raw: string) => {
      const value = raw === "" ? 0 : Math.max(0, Math.min(100, parseInt(raw, 10) || 0))
      onChange({ ...formula, [field]: decimalValue(value) })
    },
    [formula, onChange]
  )

  const reset = React.useCallback(() => {
    onChange(getDefaultFormula(subject))
  }, [subject, onChange])

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button type="button" variant="ghost" size="xs">
          {t.calculator.formulaAssumptions}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 pt-2">
        <p className="text-xs text-muted-foreground">
          {t.calculator.formulaDescription}
        </p>
        <div className="flex flex-wrap items-end gap-3">
          {(["exam", "ds", "tp"] as const).map((field) => (
            <div key={field} className="space-y-1">
              <Label className="text-xs" htmlFor={`formula-${subject.code}-${field}`}>
                {field === "exam" ? t.calculator.exam : field === "ds" ? t.calculator.ds : t.calculator.tp}
              </Label>
              <Input
                id={`formula-${subject.code}-${field}`}
                type="number"
                inputMode="numeric"
                min={0}
                max={100}
                step={1}
                value={percentageValue(formula[field])}
                onChange={(e) => updateField(field, e.target.value)}
                className="w-20"
                aria-invalid={!isValid}
              />
            </div>
          ))}
          <span
            className={`text-xs font-medium ${
              isValid ? "text-muted-foreground" : "text-destructive"
            }`}
          >
            {total}%
          </span>
        </div>
        {!isValid && (
          <p className="text-xs text-destructive">
            {t.calculator.formulaTotalError}
          </p>
        )}
        <Button type="button" variant="ghost" size="xs" onClick={reset}>
          {t.calculator.resetFormula}
        </Button>
      </CollapsibleContent>
    </Collapsible>
  )
}

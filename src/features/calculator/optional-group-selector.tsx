"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import type { TeachingUnit, TeachingUnitSelection } from "@/lib/schemas"
import type { Translations } from "@/i18n/en"

interface OptionalGroupSelectorProps {
  group: TeachingUnit[]
  selections: Record<string, TeachingUnitSelection>
  onChoose: (ueCode: string, groupCodes: string[]) => void
  t: Translations
}

export function OptionalGroupSelector({
  group,
  selections,
  onChoose,
  t,
}: OptionalGroupSelectorProps) {
  const codes = React.useMemo(
    () => group.map((ue) => ue.code),
    [group]
  )

  const selectedCode = React.useMemo(() => {
    for (const code of codes) {
      if (selections[code]?.included) return code
    }
    return null
  }, [codes, selections])

  const representative = group[0]
  if (!representative) return null

  return (
    <div className="rounded-lg border border-dashed border-secondary/40 bg-secondary/5 p-3">
      <div className="mb-2">
        <h4 className="text-sm font-medium text-foreground">{t.calculator.optionalUe}</h4>
        <p className="text-xs text-muted-foreground">
          {t.calculator.optionalUeDescription}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {group.map((ue) => {
          const isSelected = selectedCode === ue.code
          return (
            <Button
              key={ue.code}
              type="button"
              variant={isSelected ? "default" : "outline"}
              size="xs"
              onClick={() => onChoose(ue.code, codes)}
            >
              {ue.code} — {ue.name} ({t.programs.coefficients} {ue.coefficient})
            </Button>
          )
        })}
      </div>
    </div>
  )
}

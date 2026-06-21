"use client"

import * as React from "react"
import { ChevronsUpDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import type { ParcoursIndexEntry } from "@/lib/schemas"
import type { Translations } from "@/i18n/en"

interface ProgramComboboxProps {
  programs: ParcoursIndexEntry[]
  value: string | null
  onSelect: (entry: ParcoursIndexEntry | null) => void
  disabled?: boolean
  id?: string
  t: Translations
}

let mountCounter = 0

export function ProgramCombobox({
  programs,
  value,
  onSelect,
  disabled,
  id,
  t,
}: ProgramComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const dialogKey = React.useMemo(() => ++mountCounter, [])

  React.useEffect(() => {
    return () => {
      setOpen(false)
    }
  }, [])

  const selected = React.useMemo(
    () => programs.find((p) => p.code === value) ?? null,
    [programs, value]
  )

  const { available, unavailable } = React.useMemo(() => {
    const sorted = [...programs].sort((a, b) => a.code.localeCompare(b.code))
    return {
      available: sorted.filter((p) => p.hasPlan),
      unavailable: sorted.filter((p) => !p.hasPlan),
    }
  }, [programs])

  const handleSelect = React.useCallback(
    (entry: ParcoursIndexEntry) => {
      if (!entry.hasPlan) return
      onSelect(entry)
      setOpen(false)
    },
    [onSelect]
  )

  return (
    <>
      <Button
        type="button"
        variant="outline"
        id={id}
        role="combobox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="h-11 w-full justify-between rounded-xl px-3 text-left text-base shadow-2xs"
      >
        <span
          className={
            selected
              ? "truncate font-medium text-foreground"
              : "truncate font-normal text-muted-foreground"
          }
        >
          {selected
            ? `${selected.code} — ${selected.specialty}`
            : t.calculator.selectProgram}
        </span>
        <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
      </Button>
      <CommandDialog
        key={dialogKey}
        open={open}
        onOpenChange={setOpen}
        title={t.calculator.selectProgram}
        description={t.calculator.searchPlaceholder}
      >
        <Command>
          <CommandInput placeholder={t.calculator.searchPlaceholder} />
          <CommandList>
            <CommandEmpty>
              <p className="text-sm font-medium text-foreground">
                {t.calculator.noResultsTitle}
              </p>
              <p className="max-w-xs text-xs text-muted-foreground">
                {t.calculator.noResultsDescription}
              </p>
            </CommandEmpty>
            <CommandGroup heading={t.calculator.availablePrograms}>
              {available.map((p) => (
                <CommandItem
                  key={p.code}
                  value={`${p.code} ${p.specialty} ${p.mention} ${p.domain}`}
                  onSelect={() => handleSelect(p)}
                  data-checked={p.code === value}
                >
                  <span className="truncate">
                    {p.code} — {p.specialty} ({p.degreeType})
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
            {unavailable.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading={t.calculator.unavailablePrograms}>
                  {unavailable.map((p) => (
                    <CommandItem
                      key={p.code}
                      value={`${p.code} ${p.specialty} ${p.mention} ${p.domain}`}
                      disabled
                    >
                      <span className="truncate opacity-60">
                        {p.code} — {p.specialty} ({p.degreeType}) —{" "}
                        {t.common.unavailable}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}

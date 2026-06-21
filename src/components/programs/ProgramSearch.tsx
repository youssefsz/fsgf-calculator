"use client"

import * as React from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ParcoursIndexEntry } from "@/lib/schemas"
import type { Translations } from "@/i18n/en"

interface ProgramSearchProps {
  programs: ParcoursIndexEntry[]
  locale: "en" | "fr"
  t: Translations
  programRoute: string
}

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

export function ProgramSearch({
  programs,
  t,
  programRoute,
}: ProgramSearchProps) {
  const [query, setQuery] = React.useState("")

  const filtered = React.useMemo(() => {
    const terms = normalize(query)
      .split(/\s+/)
      .filter((s) => s.length > 0)
    if (terms.length === 0) return programs

    return programs.filter((p) => {
      const haystack = normalize(
        `${p.code} ${p.specialty} ${p.mention} ${p.domain} ${p.degreeType}`
      )
      return terms.every((term) => haystack.includes(term))
    })
  }, [programs, query])

  return (
    <div className="space-y-4">
      <div className="space-y-1.5 rounded-xl bg-secondary/5 p-4">
        <Label htmlFor="program-search" className="text-sm font-medium text-foreground">
          {t.calculator.searchPlaceholder}
        </Label>
        <Input
          id="program-search"
          type="search"
          placeholder={t.calculator.searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-md bg-background"
        />
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        <span className="font-semibold text-primary">{filtered.length}</span> / {programs.length} {t.dataStatus.totalPrograms.toLowerCase()}
      </p>

      <ul className="divide-y divide-border border-t border-border">
        {filtered.map((p) => (
          <li key={p.code}>
            <a
              href={programRoute.replace("{code}", p.code)}
              className="group flex items-start justify-between gap-4 py-3 transition-colors hover:bg-secondary/5"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-primary">
                    {p.code}
                  </span>
                  {!p.hasPlan ? (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                      {t.common.unavailable}
                    </span>
                  ) : null}
                </div>
                <p className="font-medium text-foreground group-hover:text-primary">{p.specialty}</p>
                <p className="text-sm text-muted-foreground">
                  {p.degreeType} · {p.mention} · {p.domain}
                </p>
              </div>
              <span
                className="shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
                aria-hidden="true"
              >
                →
              </span>
            </a>
          </li>
        ))}
      </ul>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          {t.common.noResults}
        </p>
      ) : null}
    </div>
  )
}

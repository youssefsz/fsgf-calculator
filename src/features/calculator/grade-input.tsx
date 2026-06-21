"use client"

import * as React from "react"

import { Input } from "@/components/ui/input"

interface GradeInputProps {
  id: string
  value: number | undefined
  placeholder: string
  ariaLabel: string
  onChange: (value: number | null) => void
  className?: string
  min?: number
  max?: number
  step?: number
}

function sanitize(raw: string, min: number, max: number): {
  value: string
  numeric: number | null
} {
  if (raw === "") return { value: "", numeric: null }

  let cleaned = raw.replace(/[^\d.]/g, "")
  const firstDot = cleaned.indexOf(".")
  if (firstDot !== -1) {
    cleaned =
      cleaned.slice(0, firstDot + 1) +
      cleaned.slice(firstDot + 1).replace(/\./g, "")
  }
  if (cleaned === "" || cleaned === ".") return { value: cleaned, numeric: null }

  const parsed = parseFloat(cleaned)
  if (Number.isNaN(parsed)) return { value: "", numeric: null }
  if (parsed < min) return { value: String(min), numeric: min }
  if (parsed > max) return { value: String(max), numeric: max }
  return { value: cleaned, numeric: parsed }
}

export function GradeInput({
  id,
  value,
  placeholder,
  ariaLabel,
  onChange,
  className,
  min = 0,
  max = 20,
  step = 0.01,
}: GradeInputProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const lastCommittedRef = React.useRef<string>(value?.toString() ?? "")

  React.useEffect(() => {
    const committed = value?.toString() ?? ""
    if (
      inputRef.current &&
      committed !== lastCommittedRef.current &&
      document.activeElement !== inputRef.current
    ) {
      lastCommittedRef.current = committed
      inputRef.current.value = committed
    }
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target
    const { value: sanitized, numeric } = sanitize(target.value, min, max)
    if (sanitized !== target.value) {
      target.value = sanitized
    }
    if (sanitized === "") {
      lastCommittedRef.current = ""
      onChange(null)
      return
    }
    if (numeric === null) return
    lastCommittedRef.current = sanitized
    onChange(numeric)
  }

  return (
    <Input
      id={id}
      ref={inputRef}
      type="number"
      inputMode="decimal"
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      defaultValue={value ?? ""}
      onChange={handleChange}
      className={className}
      aria-label={ariaLabel}
    />
  )
}

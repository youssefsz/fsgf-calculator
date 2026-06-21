"use client"

import * as React from "react"
import { Menu, Languages, Monitor, Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

type Theme = "light" | "dark" | "system"

const THEME_STORAGE_KEY = "fsgf-calculator:theme"
const THEME_CLASS = "dark"

function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return
  const root = document.documentElement
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
  root.classList.toggle(THEME_CLASS, isDark)
  root.style.colorScheme = isDark ? "dark" : "light"
}

function loadTheme(): Theme {
  if (typeof window === "undefined") return "system"
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored
  }
  return "system"
}

interface MobileNavProps {
  locale: "en" | "fr"
  currentPath: string
  otherLocalePath: string
  otherLocaleLabel: string
  labels: {
    openMenu: string
    closeMenu: string
    menu: string
    calculate: string
    programs: string
    methodology: string
    dataStatus: string
    language: string
    switchTo: string
    theme: string
    light: string
    dark: string
    system: string
  }
  navHrefs: {
    home: string
    programs: string
    methodology: string
    dataStatus: string
  }
}

const themeIcons: Record<Theme, React.ReactNode> = {
  light: <Sun className="size-4" />,
  dark: <Moon className="size-4" />,
  system: <Monitor className="size-4" />,
}

export function MobileNav({
  locale,
  currentPath,
  otherLocalePath,
  otherLocaleLabel,
  labels,
  navHrefs,
}: MobileNavProps) {
  const [open, setOpen] = React.useState(false)
  const [theme, setTheme] = React.useState<Theme>(loadTheme)
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    triggerRef.current?.setAttribute("data-hydrated", "true")
  }, [])

  React.useEffect(() => {
    applyTheme(theme)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme)
    }
  }, [theme])

  React.useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => {
      if (theme === "system") applyTheme("system")
    }
    media.addEventListener("change", handler)
    return () => media.removeEventListener("change", handler)
  }, [theme])

  const isActive = (href: string) => {
    if (href === navHrefs.home) return currentPath === href
    return currentPath === href || currentPath.startsWith(`${href}/`)
  }

  const links: { href: string; label: string }[] = [
    { href: navHrefs.home, label: labels.calculate },
    { href: navHrefs.programs, label: labels.programs },
    { href: navHrefs.methodology, label: labels.methodology },
    { href: navHrefs.dataStatus, label: labels.dataStatus },
  ]

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          ref={triggerRef}
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label={labels.openMenu}
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        showCloseButton
        className="flex w-full max-w-xs flex-col gap-0 p-0 sm:max-w-sm"
      >
        <SheetHeader className="border-b border-border">
          <SheetTitle>{labels.menu}</SheetTitle>
        </SheetHeader>

        <nav
          aria-label={labels.menu}
          className="flex flex-1 flex-col gap-1 overflow-y-auto p-4"
        >
          {links.map((item) => {
            const active = isActive(item.href)
            return (
              <SheetClose asChild key={item.href}>
                <a
                  href={item.href}
                  hrefLang={locale}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-md px-3 py-3 text-sm transition-colors",
                    active
                      ? "bg-primary font-medium text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  {item.label}
                </a>
              </SheetClose>
            )
          })}
        </nav>

        <div className="border-t border-border p-4">
          <p className="mb-2 px-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {labels.theme}
          </p>
          <div
            role="radiogroup"
            aria-label={labels.theme}
            className="grid grid-cols-3 gap-1 rounded-md bg-muted/50 p-1"
          >
            {(
              [
                { value: "light" as const, label: labels.light },
                { value: "dark" as const, label: labels.dark },
                { value: "system" as const, label: labels.system },
              ]
            ).map((option) => {
              const selected = theme === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setTheme(option.value)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-sm px-2 py-2 text-xs transition-colors",
                    selected
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {themeIcons[option.value]}
                  <span className="sr-only">{option.label}</span>
                </button>
              )
            })}
          </div>

          <a
            href={otherLocalePath}
            hrefLang={locale === "en" ? "fr" : "en"}
            aria-label={labels.switchTo}
            className="mt-3 flex items-center gap-2 rounded-md px-3 py-3 text-sm text-foreground transition-colors hover:bg-muted"
          >
            <Languages className="size-4" />
            {otherLocaleLabel}
          </a>
        </div>
      </SheetContent>
    </Sheet>
  )
}

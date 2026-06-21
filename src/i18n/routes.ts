export type Locale = "en" | "fr"

export const DEFAULT_LOCALE: Locale = "en"
export const LOCALES: Locale[] = ["en", "fr"]

export type RouteKey =
  | "home"
  | "programs"
  | "program"
  | "methodology"
  | "dataStatus"
  | "privacy"

export const ROUTES: Record<RouteKey, Record<Locale, string>> = {
  home: { en: "/", fr: "/fr" },
  programs: { en: "/programs", fr: "/fr/parcours" },
  program: { en: "/programs/{code}", fr: "/fr/parcours/{code}" },
  methodology: { en: "/methodology", fr: "/fr/methodologie" },
  dataStatus: { en: "/data-status", fr: "/fr/etat-des-donnees" },
  privacy: { en: "/privacy", fr: "/fr/confidentialite" },
}

export function localizeRoute(
  key: RouteKey,
  locale: Locale,
  params?: Record<string, string>
): string {
  let path = ROUTES[key][locale]
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      path = path.replace(`{${name}}`, value)
    }
  }
  return path
}

export function getAlternateRoutes(
  key: RouteKey,
  params?: Record<string, string>
): Record<Locale, string> {
  return {
    en: localizeRoute(key, "en", params),
    fr: localizeRoute(key, "fr", params),
  }
}

export function getLocaleFromPath(pathname: string): Locale {
  if (pathname.startsWith("/fr")) return "fr"
  return "en"
}

export function stripLocalePrefix(pathname: string): string {
  return pathname.replace(/^\/fr/, "") || "/"
}

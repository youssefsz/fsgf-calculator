// @ts-check

import sitemap from "@astrojs/sitemap"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "astro/config"
import react from "@astrojs/react"
import { loadEnv } from "vite"

const env = loadEnv(process.env.NODE_ENV || "production", process.cwd(), "")
const siteUrl = process.env.SITE_URL || env.SITE_URL || "http://localhost:4321"

// https://astro.build/config
export default defineConfig({
  site: siteUrl,
  output: "static",
  trailingSlash: "never",
  integrations: [
    react(),
    sitemap({
      i18n: {
        defaultLocale: "en",
        locales: {
          en: "en",
          fr: "fr",
        },
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
})

import type { APIRoute } from "astro"

export const GET: APIRoute = () => {
  const body = `User-agent: *\nAllow: /\nSitemap: /sitemap-index.xml\n`
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain",
    },
  })
}

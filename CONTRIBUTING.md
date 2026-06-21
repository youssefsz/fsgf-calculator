# Contributing to FSGF Grade Calculator

Thanks for your interest in improving the FSGF Grade Calculator, a free and
open-source web app that helps students of the Faculté des Sciences de Gafsa
estimate their LMD averages. Contributions of all sizes are welcome: bug
reports, fixes, documentation, translations, and programme data.

## Maintainer

- **Youssef Dhibi** — [youssef.tn](https://youssef.tn) · [@youssefsz](https://github.com/youssefsz)

## Prerequisites

- **Node.js** 22.12 or newer (see `engines` in `package.json`).

pnpm is pinned via the `packageManager` field in `package.json` and
managed by [Corepack](https://nodejs.org/api/corepack.html), which ships
with Node. You do not need to install pnpm manually — Corepack downloads
the exact pinned version on first use.

```bash
corepack enable      # one-time, per machine
pnpm install         # uses the pinned pnpm version automatically
```

If you already have a different pnpm installed globally, Corepack
overrides it only inside this repository, so your other projects are
unaffected.

## Project layout

This is a single-package Astro + React + TypeScript application. There is no
monorepo.

```text
src/
  assets/                 Images and static assets imported by Astro
  components/
    brand/                Logo, footer, attribution
    navigation/           Header, mobile menu
    programs/             Programme-listing views
    seo/                  Meta tags, JSON-LD, hreflang
    theme/                Theme provider and switcher
    ui/                   shadcn/ui primitives (button, tabs, ...)
  features/calculator/    The calculator island and its sub-components
  i18n/                   English and French translation dictionaries
  layouts/                BaseLayout, locale-aware shell
  lib/                    Data loaders, Zod schemas, utilities
  pages/                  Astro routes (en + fr mirrors)
  styles/                 Global CSS, theme variables
  test/                   Test setup and shared utilities
public/
  data/fsgf/              Programme index and per-code JSON plans
scripts/
  validate-data.ts        Standalone Zod validator for the data dir
e2e/                      Playwright end-to-end tests
```

## Development

```bash
pnpm run dev            # Astro dev server with hot reload
pnpm run build          # Validate data, type-check, produce dist/
pnpm run preview        # Serve the built bundle locally
```

Edits to `.astro` and `.tsx` files hot-reload. Changes to files in `src/i18n/`
require a full reload because translation keys are imported at build time.

## Quality gates

A pull request cannot be considered ready while the `Quality` check in
GitHub Actions is failing. The workflow runs, in order:

```bash
pnpm run data:validate  # Re-validate every programme JSON file
pnpm run lint           # ESLint
pnpm run check          # astro check (TypeScript and Astro)
pnpm test               # Vitest unit suite
pnpm run build          # Static build of the whole site
pnpm audit --prod --audit-level=high
```

Please run these locally before opening a pull request.

## Tests

- Add or update unit tests in `src/features/calculator/` whenever the
  calculation engine, share-URL codec, or persistence layer changes.
- Keep tests deterministic. Do not mock `Date.now` or `localStorage` in a way
  that depends on the host timezone.
- End-to-end tests live in `e2e/` and run with Playwright. They require a
  successful `pnpm run build` first.

## Code style

- ESLint handles linting. Run `pnpm run lint`.
- Prettier handles formatting, including `prettier-plugin-astro` and the
  Tailwind sort plugin. Run `pnpm run format` before committing.
- Match the conventions of the surrounding code. Prefer small, self-explanatory
  code over inline comments.
- Do not add a dependency for something the standard library or an existing
  dependency already provides.

## Translation

All user-facing strings live in `src/i18n/en.ts` and `src/i18n/fr.ts`. The two
files share a single TypeScript type, so a missing key in either language is a
compile-time error. When adding a string, add it to both files in the same
commit.

## Programme data

Adding or updating a programme:

1. Drop the new JSON file in `public/data/fsgf/parcours/`.
2. Add its code to `public/data/fsgf/index.json`.
3. Confirm `source_url` points to the original `parcours-lmd.salima.tn` page
   the data was scraped from.
4. Run `pnpm run data:validate` to confirm the schema accepts it.
5. Open a pull request. The data status page reflects the latest
   `validation.json` on the next deploy.

Do not invent or approximate coefficient values. If a programme is missing or
a coefficient disagrees with the official source, open an issue rather than
guessing.

## Pull requests

1. Fork the repository and create a branch from `main`
   (e.g. `fix/share-url-codec`, `feat/new-formula-weight`).
2. Make your change with the quality gates passing locally.
3. Write a clear description: what changed, why, and how you verified it.
4. Link any related issue using `Closes #123`.
5. Confirm every checkbox in the pull request template.

GitHub automatically fills new pull requests with the repository template.
Complete the applicable verification and checklist items; remove sections that
do not apply.

## Reporting issues

Open an issue with:

- What you expected to happen and what actually happened.
- Steps to reproduce, including the programme code and the grades you entered.
- Your browser, OS, and any console errors.
- A link to the relevant study plan on `parcours-lmd.salima.tn` if the issue is
  about a coefficient or programme structure.

## Security

If you have found a security issue, please do not open a public issue. Contact
the maintainer through [youssef.tn](https://youssef.tn) instead.

## License

By contributing, you agree that your contributions will be licensed under the
[MIT License](./LICENSE) that covers this project.

<div align="center">

# FSGF Grade Calculator

**A static, privacy-respecting web app for estimating LMD averages at the Faculté des Sciences de Gafsa.**

Pick a programme, enter your grades, get subject, UE, semester, and year-level estimates computed from the official study-plan coefficients. Runs entirely in the browser. No accounts, no tracking, no server-side state.

</div>

<div align="center">

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Astro](https://img.shields.io/badge/Astro-6-FF5D01?style=for-the-badge&logo=astro&logoColor=white)](https://astro.build)
[![React](https://img.shields.io/badge/React-19-149ECA?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Node](https://img.shields.io/badge/Node-%E2%89%A522.12-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-workspace-F69220?style=for-the-badge&logo=pnpm&logoColor=white)](https://pnpm.io)

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen?style=flat-square)](https://github.com/youssefsz/fsgf-calculator/actions)
[![Lint](https://img.shields.io/badge/lint-eslint-4B32C3?style=flat-square&logo=eslint&logoColor=white)](https://eslint.org)
[![Tests](https://img.shields.io/badge/tests-vitest%20%2B%20playwright-729B1B?style=flat-square)](https://vitest.dev)
[![Code style](https://img.shields.io/badge/code%20style-prettier-F7B93E?style=flat-square&logo=prettier&logoColor=white)](https://prettier.io)
[![Zod](https://img.shields.io/badge/validation-Zod-3068B7?style=flat-square)](https://zod.dev)
[![i18n](https://img.shields.io/badge/i18n-en%20%7C%20fr-blue?style=flat-square)](src/i18n)

[![GitHub stars](https://img.shields.io/github/stars/youssefsz/fsgf-calculator?style=social)](https://github.com/youssefsz/fsgf-calculator/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/youssefsz/fsgf-calculator?style=social)](https://github.com/youssefsz/fsgf-calculator/network/members)
[![GitHub watchers](https://img.shields.io/github/watchers/youssefsz/fsgf-calculator?style=social)](https://github.com/youssefsz/fsgf-calculator/watchers)

</div>

---

## Table of Contents

- [About](#about)
- [Features](#features)
- [Demo](#demo)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [How Calculations Work](#how-calculations-work)
- [Data Pipeline](#data-pipeline)
- [Internationalization](#internationalization)
- [Testing](#testing)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Security](#security)
- [Author](#author)
- [License](#license)
- [Acknowledgements](#acknowledgements)

---

## About

The **FSGF Grade Calculator** is a free, open-source web application for students of the [Faculté des Sciences de Gafsa](https://fsgf.rnu.tn/). It reads each programme's published study plan from [parcours-lmd.salima.tn](http://www.parcours-lmd.salima.tn), applies the official subject and UE coefficients, and produces running estimates of a student's average at every level of the LMD system: subject, UE, semester, and academic year.

The application is built around four non-negotiable principles:

- **Honesty about uncertainty.** A missing grade is reported as a partial average, not rounded up to a complete result. Users can see at every level which inputs are still missing.
- **Transparency about source data.** Every programme JSON file ships with the `source_url` it was scraped from, and a build-time validator (`pnpm data:validate`) fails the project on any schema mismatch. The data status page exposes the latest validation report.
- **Privacy by default.** The build is a static bundle. Grades live in `localStorage`, shareable state is encoded into a URL query string, and no request leaves the browser. There is no backend, no account, no telemetry.
- **Bilingual from day one.** Every user-facing string has a counterpart in French, and missing keys in either locale are a compile-time error.

The project is an independent, student-built tool. It is not affiliated with, endorsed by, or connected to the Faculté des Sciences de Gafsa. The data it processes is sourced from the publicly accessible `parcours-lmd.salima.tn` catalogue; if you are a representative of the university and would like a programme removed, please open an issue.

---

## Features

- **Programme picker.** Combobox-driven selection over every available parcours, sourced from `public/data/fsgf/index.json`.
- **Per-subject grade entry.** Supports exam, continuous assessment (DS), and practical work (TP) modes with configurable weights. The default formula is the standard 70% exam / 20% DS / 10% TP split used by FSGF.
- **Direct UE override.** For UEs where the university provides a single aggregated grade, the calculator accepts a direct input and bypasses the per-subject formula.
- **Optional-group handling.** UEs flagged as optional in the study plan can be toggled in or out, and the semester average is recomputed live.
- **Hierarchical results.** Subject, UE, semester, and full academic-year averages update on every keystroke.
- **Shareable state.** The current selection and grades are encoded into a URL query string, so a link to `/calculator?code=...` reconstructs the full state on load.
- **Persistent progress.** Grades are mirrored to `localStorage` so a refresh does not lose work.
- **Theming.** Light, dark, and system-follow themes via `next-themes`-style CSS variables.
- **SEO and accessibility.** Per-route `<head>` metadata, a generated sitemap, bilingual `hreflang` alternates, and a mobile navigation menu with proper ARIA labelling.
- **Data validation.** Zod schemas guard every load of programme data, and a dedicated `pnpm data:validate` script fails the build on corrupt input.

---

## Demo

A live build is generated from the `dist/` directory by the static host. To run a local preview:

```bash
pnpm install
pnpm build
pnpm preview
```

The preview server prints its address in the terminal (default: `http://localhost:4321`).

---

## Tech Stack

| Layer            | Choice                              | Reason                                                  |
| ---------------- | ----------------------------------- | ------------------------------------------------------- |
| Framework        | [Astro 6](https://astro.build)      | Static output, islands of React, fast cold builds.      |
| UI runtime       | [React 19](https://react.dev)       | Component model for the interactive calculator island.  |
| Language         | [TypeScript](https://www.typescriptlang.org) (strict) | Catch data-shape mismatches at compile time.            |
| Styling          | [Tailwind CSS 4](https://tailwindcss.com) + CSS variables | Theme tokens, no runtime CSS-in-JS cost.                |
| Components       | [shadcn/ui](https://ui.shadcn.com) (Radix primitives) | Accessible, unstyled primitives, owned by the project.  |
| Validation       | [Zod](https://zod.dev)              | Runtime guards for every programme JSON file.           |
| Icons            | [lucide-react](https://lucide.dev)  | Tree-shakable, consistent stroke.                       |
| Unit tests       | [Vitest](https://vitest.dev) + Testing Library | Fast, ESM-native, Jest-compatible API.                  |
| End-to-end tests | [Playwright](https://playwright.dev) | Cross-browser smoke coverage.                           |
| Lint / format    | ESLint 10 + Prettier 3 + prettier-plugin-astro | Single source of truth for code style.                  |
| Package manager  | [pnpm](https://pnpm.io) with workspaces | Deterministic installs, content-addressed store.        |

---

## Quick Start

### Prerequisites

- **Node.js** 22.12 or newer (see `engines` in `package.json`). Node ships with [Corepack](https://nodejs.org/api/corepack.html), which manages pnpm automatically — you do **not** need to install pnpm yourself.

### Installation

```bash
# Clone the repository
git clone https://github.com/youssefsz/fsgf-calculator.git
cd fsgf-calculator

# Enable Corepack (one-time, per machine)
corepack enable

# Install dependencies — Corepack pins pnpm to the version
# declared in the "packageManager" field of package.json
pnpm install

# Start the dev server
pnpm dev
```

The dev server is served at `http://localhost:4321` by default. Edits to `.astro` and `.tsx` files hot-reload; changes to translation files in `src/i18n/` require a full reload.

### First-time setup

There is no database to seed. Copy `.env.example` to `.env` if you need to override the public site URL used for canonical URLs and sitemap generation:

```sh
cp .env.example .env
```

Set `SITE_URL` to the deployed origin for production builds. Local development defaults to `http://localhost:4321`. The programme data ships in `public/data/fsgf/` and is validated on load.

---

## Available Scripts

| Script              | Purpose                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------- |
| `pnpm dev`          | Start the Astro dev server with hot reload.                                                 |
| `pnpm build`        | Run data validation, run `astro check`, and produce the static `dist/` bundle.              |
| `pnpm preview`      | Serve the built `dist/` bundle locally for a final smoke test.                              |
| `pnpm check`        | Type-check every `.astro` and `.ts`/`.tsx` file.                                            |
| `pnpm lint`         | Run ESLint over the entire repository.                                                      |
| `pnpm format`       | Format with Prettier, including the `prettier-plugin-astro` and Tailwind sort plugins.       |
| `pnpm test`         | Run the Vitest unit suite once.                                                             |
| `pnpm test:unit:watch` | Watch mode for unit tests.                                                              |
| `pnpm test:e2e`     | Run the Playwright suite. Requires a successful `pnpm build` first.                         |
| `pnpm data:validate` | Re-validate every programme JSON file in `public/data/fsgf/` against the Zod schemas.    |

---

## Project Structure

```
fsgf-calculator/
├── astro.config.mjs          # Astro config, sitemap, Tailwind plugin
├── components.json           # shadcn/ui registry config
├── eslint.config.js          # Flat-config ESLint setup
├── playwright.config.ts      # Playwright browsers and projects
├── vitest.config.ts          # Vitest setup, jsdom environment
├── public/
│   ├── data/fsgf/            # Programme index and per-code JSON plans
│   ├── favicons/             # Favicon set
│   └── favicon.ico
├── scripts/
│   └── validate-data.ts      # Standalone Zod validator for the data dir
└── src/
    ├── assets/               # Images and static assets imported by Astro
    ├── components/
    │   ├── brand/            # Logo, footer, attribution
    │   ├── navigation/       # Header, mobile menu
    │   ├── programs/         # Programme-listing views
    │   ├── seo/              # Meta tags, JSON-LD, hreflang
    │   ├── theme/            # Theme provider and switcher
    │   └── ui/               # shadcn/ui primitives (button, tabs, ...)
    ├── features/
    │   └── calculator/       # The calculator island and its sub-components
    │       ├── Calculator.tsx
    │       ├── calculation.ts        # Pure averaging functions
    │       ├── use-calculator.ts     # Hook wiring state to results
    │       ├── persistence.ts        # localStorage sync
    │       ├── share-url.ts          # Query-string state encoding
    │       └── *.test.{ts,tsx}       # Unit tests
    ├── i18n/                 # Translation dictionaries and route maps
    ├── layouts/              # BaseLayout, locale-aware shell
    ├── lib/
    │   ├── data.server.ts    # Build-time data loaders (parcours, plans)
    │   ├── schemas.ts        # Zod schemas for programme data
    │   └── utils.ts          # cn(), formatters, type guards
    ├── pages/                # Astro routes (en + fr)
    │   ├── index.astro
    │   ├── calculator.astro
    │   ├── methodology.astro
    │   ├── data-status.astro
    │   ├── privacy.astro
    │   ├── terms.astro
    │   ├── 404.astro
    │   ├── programs/
    │   └── fr/               # French locale mirror
    ├── styles/               # Global CSS, theme variables
    └── test/                 # Test setup and shared utilities
```

---

## How Calculations Work

All averaging logic lives in [`src/features/calculator/calculation.ts`](src/features/calculator/calculation.ts) as pure functions. The pipeline is:

1. **Subject grade.** Given a subject, the selected mode (exam + DS + TP, exam only, or direct), and the optional formula weights, the subject score is reduced to a single number in `[0, 20]`. A subject with no entered grade is reported as `null`, not as zero.
2. **UE average.** A UE is the coefficient-weighted mean of its included subjects. If a direct UE grade has been entered, it overrides the computed average. UEs marked optional can be excluded; the calculator reports both the raw and the adjusted semester mean.
3. **Semester average.** Coefficient-weighted mean over the included UEs of the semester, respecting the study plan's `nature` field (fondamentale, transversale, méthodologique, découverte).
4. **Year average.** Coefficient-weighted mean of the two semester means, where each semester's weight is the sum of its UE coefficients.

The default subject formula is configurable per subject via the `exam_regime` field. The shipped defaults are:

| Regime                | Exam | DS  | TP  |
| --------------------- | ---- | --- | --- |
| `mx_with_tp`          | 0.7  | 0.2 | 0.1 |
| `mx_without_tp`       | 0.7  | 0.3 | 0.0 |
| `cc_with_tp`          | 0.0  | 0.5 | 0.5 |
| `cc_without_tp`       | 0.0  | 1.0 | 0.0 |
| `exam_only`           | 1.0  | 0.0 | 0.0 |

Custom weights per subject are exposed in the formula editor.

---

## Data Pipeline

The programme catalogue lives in `public/data/fsgf/`:

```
public/data/fsgf/
├── index.json              # List of every available parcours code
├── validation.json         # Latest validation report
└── parcours/
    ├── LICENSE-INFO.json
    └── <code>.json         # One file per parcours
```

Each `parcours/<code>.json` file carries the full 6-semester study plan, every UE, every subject, the official coefficient, the exam regime, and the source URL it was scraped from. The `source_url` field is shown on the programme detail page so the data can be audited.

Adding or updating a programme:

1. Drop the new JSON file in `public/data/fsgf/parcours/`.
2. Add its code to `public/data/fsgf/index.json`.
3. Run `pnpm data:validate` to confirm the schema accepts it.
4. Open a pull request. The data status page reflects the latest `validation.json` on the next deploy.

---

## Internationalization

All user-facing strings live in `src/i18n/en.ts` and `src/i18n/fr.ts`. The two files share a single TypeScript type, so a missing key in either language is a compile-time error.

To add a new locale:

1. Create `src/i18n/<locale>.ts` typed against the `Translations` export from `src/i18n/en.ts`.
2. Register the locale in `astro.config.mjs` under the sitemap `i18n.locales` map.
3. Mirror the English pages under `src/pages/<locale>/`.
4. Add the new language option to the `language` block in both translation files.

---

## Testing

```bash
pnpm test          # Vitest unit suite
pnpm test:e2e      # Playwright (requires a build first)
```

The unit suite covers the calculation engine, the share-URL codec, the localStorage persistence layer, and component snapshots. The Playwright suite exercises the calculator end-to-end across Chromium, Firefox, and WebKit.

Coverage is reported by Vitest's built-in V8 provider; configuration lives in `vitest.config.ts`.

---

## Roadmap

- [ ] Importing grades from a CSV paste
- [ ] Exporting results to PDF
- [ ] More programmes (the data dir is currently Gafsa-only; the pipeline generalises)
- [ ] Optional semester-by-semester progress charts
- [ ] Server-side rate limiting for the data fetch (when the static bundle is no longer enough)

See the [open issues](https://github.com/youssefsz/fsgf-calculator/issues) for the current backlog.

---

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. It documents the quality gates, the translation workflow, and the rules around adding programme data.

For substantive changes (new calculation rule, new programme shape, new dependency), please open an issue first to discuss the approach. Bug reports and small fixes do not need prior discussion.

Pull requests are validated by the [CI workflow](.github/workflows/ci.yml), which runs `data:validate`, `lint`, `check`, `test`, and `build` on every push and pull request. A PR cannot be merged while that workflow is failing.

---

## Security

If you have found a security issue, please do not open a public issue. Contact the maintainer through [youssef.tn](https://youssef.tn) instead.

---

## Author

Created by [**Youssef Dhibi**](https://youssef.tn) · GitHub: [@youssefsz](https://github.com/youssefsz)

The project is not affiliated with the Faculté des Sciences de Gafsa. The Faculté's name and the `fsgf` identifier are used solely to describe the source of the academic data the calculator processes. For any inquiry, the creator can be reached through [youssef.tn](https://youssef.tn).

---

## License

This project is released under the **MIT License**. See [LICENSE](LICENSE) for the full text.

Programme data files in `public/data/fsgf/` are sourced from publicly accessible study-plan publications. Each file carries the URL it was scraped from in its `parcours.source_url` field. If you are a representative of FSGF and would like a programme removed, please open an issue.

---

## Acknowledgements

- The [Astro](https://astro.build) team, for a framework that makes static-first the default rather than the exception.
- The [shadcn](https://ui.shadcn.com) project, for a sane ownership model of the component primitives.
- The maintainers of [Zod](https://zod.dev), [Vitest](https://vitest.dev), and [Playwright](https://playwright.dev), for tooling that does not get in the way.
- The maintainers of [parcours-lmd.salima.tn](http://www.parcours-lmd.salima.tn), whose public catalogue of FSGF study plans is the only reason this project is possible.
- The students of the Faculté des Sciences de Gafsa who test the calculator against real transcripts and report the bugs.

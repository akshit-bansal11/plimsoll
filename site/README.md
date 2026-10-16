# Plimsoll website

Two routes: a landing page at `/`, and the whole documentation on one page at `/docs`.
Live at [plimsoll.vercel.app](https://plimsoll.vercel.app), deployed to Vercel from the
repository root.

The stack is the Edgepad site's, copied on purpose: Next.js as a static export,
Tailwind 4, shadcn and Magic UI components, Biome, ESLint and tsc, with the same
dependency versions and the same lockfile.

## Running it

```bash
cd site
npm ci
npm run dev        # http://localhost:3000
```

Node 24 or later.

## The quality gate

```bash
npm run check      # Biome (format + import order + lint) -> ESLint -> tsc
npm run check:ci   # the same, non-mutating: fails on unformatted code
npm run build      # static export to out/
```

`.github/workflows/site.yml` runs `check:ci` and `build` on every push and pull request
that touches the site or a file it reads.

| Tool | Owns |
| --- | --- |
| **Biome** | Formatting, import order, general JS/TS lint (`noExplicitAny` and `noConsole` are errors) |
| **ESLint** | React hooks, JSX, accessibility, Next.js rules |
| **tsc** | Type checking |

**Versions are pinned exactly.** Two are deliberately behind `latest`: `eslint` stays on
9.x because the `eslint-plugin-react` that `eslint-config-next` bundles breaks on ESLint
10, and `typescript` stays on 5.9.3, which is what the stack was verified against.
Dependabot holds both back from major updates.

## It must be built from inside the repository

`lib/repo.ts` reads three of the plugin's own files at build time:

- `../.claude-plugin/plugin.json` for the version,
- `../scripts/prices.mjs` for the price table and its date,
- `../README.md` for the band mock-up in the hero.

A copy typed into a page would be one more place to forget when the code changes. If a
source cannot be parsed, the build fails rather than shipping a page with an empty
table. That is why the deploy runs from the repository root: the root `vercel.json`
installs and builds inside `site/` and serves `site/out`, and `.vercelignore` keeps the
rest of the plugin out of the upload.

## Content sources

Everything on both pages traces to the repository:

| Section | Source |
| --- | --- |
| What it shows, install, use, limits, uninstall | `README.md` |
| How each number is computed | `hooks/register.tsx`, `scripts/scan.mjs`, `scripts/prices.mjs`, `scripts/git.mjs` |
| Privacy and security | `SECURITY.md`, `scripts/git.mjs` |
| Develop and releases | `CONTRIBUTING.md`, `.github/workflows/` |

No screenshot exists yet, so the hero shows the README's text mock-up, labelled as an
illustration. Nothing is invented to fill a section: no usage figures, no users, no
testimonials.

## Hosting

The site is a static export (`output: "export"`), so it ships as plain files with no
Next.js runtime. `cleanUrls` in `vercel.json` makes `/docs` serve `docs.html`.

Response headers come from `vercel.json` too: a Content-Security-Policy, `nosniff`, a
referrer policy and a Permissions-Policy that switches off device APIs the site never
uses. `script-src` and `style-src` allow `'unsafe-inline'` because the export carries
inline scripts (next-themes' no-flash script and the React Server Components payload)
and React writes `style` attributes. A new external resource has to be added to the
policy or the browser will block it.

# CHEATSHEET — a specification gaming catalogue

An Astro site. Content pages (about, methods, glossary, project files) are Markdown
rendered through Astro; the **home** (landing) and **incidents** pages are the
redesigned React apps, served as static assets and mounted in the browser.

## Run it

```bash
npm install
npm run dev      # local dev server
npm run build    # production build → ./dist
npm run preview  # preview the production build
```

Requires Node ≥ 22.12 (see `package.json`).

## Routes

| Route | Source | What it is |
|---|---|---|
| `/` | `src/pages/index.astro` | Redesigned landing page (React app) |
| `/incidents` | `src/pages/incidents.astro` | Redesigned catalogue — tree + dashboard (React app) |
| `/about` | `src/pages/about.astro` + `src/content/about.md` | About / team / funding / license |
| `/methods` | `src/pages/methods.astro` + `src/content/methods.md` | Methodology writeup |
| `/glossary` | `src/pages/glossary.astro` + `src/content/glossary.md` | Glossary |
| `/e/CS-0457` (one per incident) | `src/pages/e/[id].astro` | Permanent, shareable page for a single incident |
| `/project-files/rubric` | `+ src/content/rubric.md` | Classification rubric |
| `/project-files/keyword-list` | `+ src/content/keyword-list.md` | Keyword search list |
| `/project-files/reproduction` | `+ src/content/reproduction.md` | Reproduction bundle + prompt downloads |

There is no `/results` route — it was dropped (was placeholder-only).

## Navigation

One canonical nav is used across the whole site:

`CHEATSHEET(→/)` · `INCIDENTS` · `METHODS` · `PROJECT FILES ▾` (Rubric · Keyword List · Reproduction Bundle · Decision Tree PDF) · `GLOSSARY` · `ABOUT`

- Prose pages use `src/components/Nav.astro`.
- The two React pages render a matching nav inside their own components
  (`LPNav` in `landing-shared.jsx`, `TopNav` in `shared.jsx`). If you change the
  nav, update all three so they stay in sync.

## The React apps (`public/app/`)

The landing and incidents pages are browser-compiled React (via Babel standalone),
kept exactly as designed. Their sources live in `public/app/`:

- `tokens.css` — design tokens + fonts
- `shared.jsx`, `v4-dashboard.jsx`, `v6-tree.jsx` — the incidents app
- `landing-shared.jsx`, `landing-e-hybrid.jsx` — the landing page

Both read the dataset from **`/incidents.json`** (i.e. `public/incidents.json`)
at load. All numbers — the landing at-a-glance panel, the hero counts, the
category charts — and the landing's featured specimens are **computed from that
file**, so replacing `public/incidents.json` updates the whole site. The expected
shape is `{ "lm": [...], "non_lm": [...] }` with each row carrying
`year, models, category, task, intended, actual, source_title, source_link`
(and, if present, a stable `incident_id`). `category` must be one of
`ASG`, `USG`, `OOS-NSE`, `OOS-BC`, `OOS-BI`, or `OOS`.

> Note: the apps are compiled in-browser (fine for this scale). For a fully
> optimized production build you could later port them to native Astro/React
> islands, but it is not required — they build and serve as-is.

## Data

`public/incidents.json` is the live dataset (currently 718 incidents / 250 papers).

## Incident permalinks (`/e/<incident_id>`)

Every incident gets a permanent, shareable URL, e.g. `/e/CS-0457` — keyed on the
`incident_id` field ONLY (never the title), so links survive renames and data
updates. Pages are generated at build time by `src/pages/e/[id].astro` from
`public/incidents.json`; incidents added to the JSON automatically get pages on
the next `npm run build`. The build **fails loudly** if any row is missing an
`incident_id` or two rows share one — that's the permanence guarantee, don't
remove it. Each page reuses the explorer's `IncidentDetail` component
(`public/app/incident-page.jsx` wraps it with a back link + copy-link button and
the embedded source PDF with a fallback for sources that refuse embedding). In
the explorer, incident rows show a `#` permalink on hover and the detail pane
header shows the id as a chip linking to the page.

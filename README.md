# Infinite Horror Rulebook

A static rulebook site built with [Astro](https://astro.build). The rules live
as plain Markdown files; the sidebar tree, pages, and navigation are all
generated from the folder structure at build time — no database, no manifests.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server at `http://localhost:4321` (live-reloads on edits) |
| `npm run build` | Build the static site into `dist/` |
| `npm run preview` | Serve the built `dist/` locally to check it |

## Languages

The site is bilingual: every URL is prefixed with a language (`/en/...`,
`/zh/...`), and the header has a toggle that jumps to the same page in the
other language. Each language has its **own copy** of the content, in a
top-level `en/` or `zh/` folder inside each section — the two trees should
mirror each other (same folders and file names), only the text and titles
differ. The site root redirects to the default language, set by
`DEFAULT_LANG` in `src/lib/tree.ts`.

## Adding / editing rules content

All content lives under `src/content/rules/<lang>/`. The folder structure
there **is** the sidebar tree:

```
src/content/rules/
├── en/
│   ├── index.md          ← page shown at /en/rules/ (the root "Rules" node)
│   ├── battle/
│   │   ├── index.md      ← names the "Battles" folder + its landing page
│   │   └── example-page.md
│   └── glossary/
│       └── ...
└── zh/                   ← same structure, Chinese content
    └── ...
```

Every `.md` file starts with frontmatter:

```markdown
---
title: How a Battle Goes    # shown in the sidebar
order: 3                    # optional; lower = higher in the list
---

# How a Battle Goes

Normal Markdown content here — tables, lists, code blocks all work.
```

- **To add a page**: drop a new `.md` file into the right folder.
- **To add a chapter (folder)**: create a folder with an `index.md` in it; the
  `index.md`'s `title` names the folder and its body is the page shown when
  the folder name is clicked.
- Items without `order` sort after ordered ones, folders before files,
  alphabetically.

## Adding community resources

Resources work exactly like rules but live under
`src/content/resources/<lang>/`, and each resource can carry extra
frontmatter:

```markdown
---
title: Fireball Mastery
tags: ["Magic related", "Feat"]   # searchable on the /resources/ page
author: SomeCommunityMember       # optional
order: 2                          # optional sidebar position
---

# Fireball Mastery

The resource content, in Markdown.
```

The `/resources/` landing page has a search box that filters all resources by
name or tag (tags are also clickable filters), plus the same folder-tree
sidebar as the rules section. To publish a new community resource: drop the
`.md` file into the right category folder and push.

## Deploying

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the
site and publishes it to GitHub Pages (set Pages → Source to "GitHub Actions"
in the repo settings once).

If the site is served from a subpath (a *project* site like
`username.github.io/repo-name` rather than a root user site), set `site` and
`base` in `astro.config.mjs` — see the comments there.

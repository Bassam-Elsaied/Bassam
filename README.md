# Bassam Elsayed — Portfolio

An editorial portfolio that will become a walkable 3D studio. This is the
foundation layer: a complete, indexable, accessible site that works with no
WebGL and no JavaScript.

**Art direction:** sunlit concrete gallery — warm bone paper, charcoal ink,
a single vermilion accent, oversized Archivo display type against Geist Mono
technical metadata.

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
```

| Script                     | What it does                                             |
| -------------------------- | -------------------------------------------------------- |
| `npm run dev`              | Development server                                        |
| `npm run build`            | Production build (all routes prerender statically)        |
| `npm start`                | Serve the production build                                |
| `npm run typecheck`        | `tsc --noEmit`                                            |
| `npm run lint`             | ESLint                                                    |
| `npm run verify`           | 6 routes x 8 viewports: console errors, overflow, headings |
| `npm run verify:interact`  | Mobile menu, focus management, form validation             |

The two `verify` scripts need a server running and take a base URL:

```bash
npm run build && npm start -- -p 3002
npm run verify -- http://localhost:3002
npm run verify:interact -- http://localhost:3002
```

Screenshots land in `.verify/` (gitignored).

> Do not run `next dev` and `next build` at the same time — they share
> `.next/` and will corrupt each other's chunks.

## Structure

```
src/
  app/              routes, metadata, sitemap, robots
  components/
    layout/         Container, Section, PageHero, header, footer, skip link
    navigation/     DesktopNav, MobileNav
    sections/       homepage blocks
    projects/       ProjectFeature, ProjectIndexList, ProjectPlate, TechList
    contact/        ContactForm
    ui/             Reveal, TextReveal, ImageReveal, ArrowLink, MetaLabel
  data/             all content — the only place copy lives
  hooks/            (reserved for M2)
  lib/              utils, SEO helpers
  styles/           design tokens + typographic scale
```

Content never appears inside a page component. Everything resolves from
`src/data`, so copy changes never touch layout code.

## Editing content

| File                    | Holds                                              |
| ----------------------- | -------------------------------------------------- |
| `data/profile.ts`       | Name, role, email, socials, stats, headline copy    |
| `data/projects.ts`      | The seven projects                                  |
| `data/services.ts`      | The six services                                    |
| `data/skills.ts`        | Skill groups and experience                         |
| `data/boards.ts`        | The 3D floor plan **and** the site navigation       |

`data/boards.ts` is the single source of truth for both the 3D world and the
DOM menu — `data/navigation.ts` derives the menu from it, so the two can
never drift.

### Things waiting on you

- **WhatsApp** — set `WHATSAPP_NUMBER` in `data/profile.ts`. Until it holds a
  real number the channel stays hidden rather than broken.
- **CV** — drop `Bassam_Elsayed_CV.pdf` into `public/`; the links already exist.
- **Screenshots** for ENSmenu, Lapip Store and Morsh-D. Add an `image` to the
  project and it swaps automatically from the typographic plate to a photo.
- **Site URL** — set `NEXT_PUBLIC_SITE_URL` for correct canonical and OG tags.

## Design tokens

Defined once in `src/styles/globals.css`; no component hardcodes a colour.

| Token                  | Value     | Use                        |
| ---------------------- | --------- | -------------------------- |
| `--color-background`   | `#EDE8E0` | Bone paper                 |
| `--color-foreground`   | `#14110F` | Ink                        |
| `--color-muted`        | `#8A8378` | Secondary text             |
| `--color-accent`       | `#FF4A1C` | Vermilion — used sparingly |

Type is a three-tier hierarchy: `display-*` for statements, `lead` / `body-text`
for reading, `meta` / `meta-sm` for technical labels.

## How this survives M2

The 3D world will mount as a sibling layer above the homepage rather than
replacing it:

- `app/page.tsx` renders `<main id="content" data-home-document>` — the
  canvas layer will sit in front of it and "skip exploration" dismisses the
  canvas to reveal exactly this markup. There is never a second copy of the
  homepage to keep in sync.
- `SkipLink` already targets `#content` and is the first tab stop.
- Board geometry already exists in `data/boards.ts`.

## Accessibility

- One `h1` per page, no skipped heading levels (asserted by `npm run verify`).
- Skip link is the first tab stop; focus rings are never removed.
- The mobile menu is a real dialog: focus trap, Escape to close, focus
  restored to its trigger, background scroll locked.
- Entrance animations start from `opacity: 0`. A `<noscript>` stylesheet in
  the root layout forces every `[data-reveal]` element back to its resting
  state, so the site is fully readable with JavaScript disabled.
- `prefers-reduced-motion` disables reveals and the cursor-following preview.

# thatcode.dev — System Architecture

_Last updated: 2026-07-01_

## Stack

- **Frontend/Backend:** Next.js (App Router), deployed on Vercel
- **Database:** Neon Postgres, accessed via Prisma ORM
- **Auth:** NextAuth
- **AI:** Anthropic Claude (Sonnet 4.6 for builds, Haiku 4.5 for cheap/fast tasks like Q&A and naming)
- **Payments:** Stripe
- **Preview sandbox:** Sandpack (CodeSandbox's in-browser bundler)

## Core user flow

1. User types a prompt (e.g. "build a coffee shop site") on the dashboard or in a project.
2. `POST /api/projects/[id]/generate` calls `generateProject()` in `src/lib/generate.ts`.
3. A large system prompt (in the same file) instructs Claude how to structure the output: an `App.tsx` + `index.css`, built primarily by importing from a shared library of pre-built section components rather than writing custom layout/CSS from scratch.
4. Claude streams back code via SSE; the client renders it live in a Sandpack iframe.
5. On save, the generated files are stored as JSON in the `Version` table (one row per generation, so history/rollback works).
6. On publish, `buildStandaloneHtml()` (`src/lib/buildHtml.ts`) turns the project's files into one self-contained HTML page (inlined React from CDN, no build step) served at `/p/[slug]`.

## The component library

Location: `src/lib/section-components.ts`, `ui-components.ts`, `extra-components.ts`

This is a single large object (`SECTION_COMPONENTS`, `UI_COMPONENTS`, `EXTRA_COMPONENTS`) mapping a fake file path (e.g. `/components/sections/Hero.tsx`) to a string of that component's full TSX source code. ~130+ components total (Hero, Pricing, Testimonials, Booking, Dashboard widgets, etc.).

The AI is instructed to `import Hero from '/components/sections/Hero'` rather than writing a hero section by hand — this is what makes generated sites look polished quickly (pre-styled, responsive, with hover states etc. already built in) instead of relying on the AI to write good CSS from scratch every time.

## ⚠️ The architectural risk: two different rendering paths, one is fragile

There are **two separate places** that turn the stored component-library strings into runnable code, and they behave very differently:

### 1. Editor preview — Sandpack (safe)
Client-side. Each component file is treated as its own real ES module with its own scope. Two components can both declare `const colors = {...}` at the top level with zero conflict, because they're in separate module scopes.

### 2. Publish / standalone preview — `buildAppCode()` in `buildHtml.ts` (fragile)
This is used for `/p/[slug]` (published sites) and the "preview" API route.

It does this:
```
allFiles = { ...UI_COMPONENTS, ...SECTION_COMPONENTS, ...EXTRA_COMPONENTS, ...projectFiles }
jsFiles  = every file with a .tsx/.jsx/.ts/.js extension  (ALL ~130+, regardless of whether this project actually imports them)
strippedCode = jsFiles.map(stripModuleSyntax).join("\n\n")   // removes import/export keywords
code = transpileTSX(strippedCode)                             // ONE single TypeScript compile pass
```

**Every single component in the entire library gets concatenated into one flat, non-modular script and compiled together — every time, for every project, whether or not that project uses those components.**

Because `import`/`export` are stripped before concatenation, there is no real module boundary left. All top-level `const`/`let`/`var`/`class` declarations in every component now live in **the same global scope**. If any two of the ~130 components happen to use the same generic variable name at the top level — `colors`, `isMobile`, `DEFAULT`, `DC` — that's an `Identifier 'x' has already been declared` SyntaxError, and it crashes **every single published site on the platform**, not just ones using those two components, because the whole bundle fails to parse.

We found and fixed several of these collisions today (see commit history — `isMobile` dupe, `DC` dupe, `colors` dupe, a stray corrupted `+` character where `return (` should have been, a stale-image-URL bug, and a React `SyntheticEvent.currentTarget` footgun). Each one, once introduced by any single component edit, broke the entire site for every user until found and fixed.

### Why this matters going forward

This isn't a one-time bug — it's a structural landmine. Every time a new component gets added to the library (by hand or by an automated/AI agent), there's a real chance it silently reuses a common variable name (`items`, `data`, `colors`, `config`, `DEFAULT`) already used somewhere else in the ~130-file library, and the platform-wide crash won't be caught until someone happens to publish a site and notices.

### Recommended fix

Wrap each component's code in its own function scope (an IIFE, or namespace each component under its own object) before concatenation in `buildAppCode()`, so top-level `const`/`let` in one component can never collide with another's. This preserves the "one big script" execution model (needed since there's no real bundler at publish time) while restoring real per-file scoping — closing off this entire category of bug permanently instead of fixing collisions one at a time as they're discovered.

## Image generation

Generated sites need real photos. The correct/working mechanism is a token system:

- The AI is instructed to write `{{unsplash:specific descriptive query|WIDTHxHEIGHT}}` inline wherever an image is needed.
- Server-side, `generate.ts` resolves each token through a fallback chain: **Pexels API → Unsplash API → LoremFlickr → picsum.photos**, and substitutes in a real working URL.
- **Do not** let the AI write raw `https://source.unsplash.com/...` URLs directly — that domain was fully decommissioned by Unsplash and now returns a dead Heroku error page. (This was happening in ~100+ places in the system prompt / knowledge base until fixed today — cleaned up, but worth a periodic grep for `source.unsplash.com` to make sure it doesn't creep back in.)

## Suggested next steps for a developer picking this up

1. Implement per-component scoping (IIFE wrap) in `buildAppCode()` — highest priority, prevents an entire class of platform-wide outages.
2. Add a CI check / pre-commit script that scans `section-components.ts` + `ui-components.ts` + `extra-components.ts` for duplicate top-level identifier names across files, so this is caught before merge instead of after a user hits a broken published site.
3. Consider deleting or consolidating the always-bundle-everything approach — most published sites use maybe 10–15 of the 130 components; bundling all of them into every page is also a real performance cost (400KB+ of dead code shipped to every visitor).

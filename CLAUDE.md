# CLAUDE.md

Working rules for this repository. Read this before changing anything, and read `HANDOFF.md` for the current state and open items.

## What this is

A single-page personal portfolio, published as a static site on GitHub Pages under the `/profile/` path. No backend.

- Vite + TypeScript, no UI framework
- Page markup is rendered at build time from typed content modules (`src/content`) by a Vite plugin in `vite.config.ts`
- Motion: GSAP (ScrollTrigger, SplitText, DrawSVG, MotionPath) and Lenis smooth scrolling
- A Three.js "core" in `src/gl`, lazy-loaded after first paint, with an SVG poster as fallback
- Node version pinned in `.nvmrc` (CI reads the same file)

## Commands

```bash
npm install
npm run dev        # http://localhost:5173/profile/  (the /profile/ path matters)
npm run typecheck
npm run lint
npm run build      # type-check + build into dist/
npm run preview
```

## Hard rules

1. **Content lives in `src/content`.** If a request is "change the text", only edit files there. Touch `src/render`, `src/styles` or `src/motion` only when the change genuinely needs new markup, and say so to the owner before doing it.
2. **Never invent facts.** No metrics, dates, awards, employers, co-authors or results that are not in the owner's CV or a public source (for the paper, the Crossref record for its DOI). If a claim cannot be backed up, qualify it ("reported", "from internal reporting") or leave it out, and list it as an open question.
3. **The owner's current postgraduate research topic is confidential.** Do not name it, describe it, or hint at its field anywhere: page text, meta tags, structured data, image text, commit messages, docs. The "under embargo" tile in the Lab stays topic-free. Reviews or feedback that suggest featuring it must be declined, and the owner told why.
4. **Personal data:** the site shows one email address and public profile links only. No phone numbers, home address, visa or immigration status, or work email.
5. **Writing style:** plain, human, first person where natural. No em dashes anywhere (site text, labels, comments, docs, commit messages); use commas, colons, full stops or parentheses. Avoid promotional words ("amazing", "exceptional", "innovative", "superior") and self-evaluation. State contribution accurately: "led", "designed and implemented", "contributed to", "helped build".
6. **Commits and pushes:** commit only when the owner asks. Commit with the repository's configured git identity. Never add AI co-author lines, tool signatures or "generated with" text to commit messages. Push to `main` only when asked; every push to `main` deploys.
7. **Do not break reduced motion or no-JS.** The page must stay fully readable with JavaScript off and with `prefers-reduced-motion: reduce` (the motion engine then builds nothing).

## How the code fits together

| Area | Files | Notes |
| --- | --- | --- |
| Content | `src/content/*.ts`, types in `types.ts` | The only place copy should live |
| Build-time render | `src/render/page.ts` (page), `seo.ts` (head, JSON-LD, sitemap), `visuals.ts` (project and lab SVGs), `architecture.ts` (systems diagram), `core-svg.ts` (hero poster), `html.ts` (escaping `html` tag, `raw`) | Called from `vite.config.ts` via `<!--ssg:head-->` and `<!--ssg:page-->` placeholders in `index.html` |
| Styles | `src/styles/tokens.css` (all colours, type scale, spacing), `base.css`, `chrome.css` (nav), `hero.css`, `scenes.css`, `visuals.css`, `motion.css` (hooks only used when motion runs) | Use tokens, never hard-code new colours |
| Motion | `src/motion/engine.ts` (setup, Lenis, matchMedia), `primitives.ts` (shared helpers), `scenes/*.ts` (one per section) | Scenes registered in `src/main.ts` |
| WebGL | `src/gl/stage.ts`, driven by `src/motion/scenes/core.ts` | Geometry shared with the SVG poster via `src/core/geometry.ts` |
| Small UI | `src/ui/nav.ts`, `architecture.ts`, `arsenal.ts`, `copy.ts` | Independent of motion; must work with reduced motion |
| Static files | `public/` (favicons, `og-image.jpg`) | Copied as-is to `dist/` |
| Deploy | `.github/workflows/deploy.yml` | Lint, build, publish `dist/` to Pages on push to `main` |

## Change recipes

Follow the matching recipe, then run the verification checklist below.

### Edit any text
1. Change the string in `src/content`.
2. Keep the meaning backed by the CV (hard rule 2). No em dashes.
3. If the text is the page title or description, also check lengths in `site.ts` (title about 60 characters max, description 155 max).

### Change the hero (name, tagline, intro, roles)
- Fields: `heroLines` (title lines, one entry per line), `heroTagline` (line under the title; its last word gets the cyan accent), `heroIntro`, `roles`, `availability`, `location` in `profile.ts`.
- Every hero element with `data-boot` is hidden by CSS until the boot timeline in `src/motion/scenes/boot.ts` reveals it. **If you add a new hero element with `data-boot`, you must also add it to the boot timeline**, or it stays invisible for everyone with motion on (the CSS failsafe is switched off once motion starts).
- After changing hero text, measure that the hero still fits: the bottom of `.hero__foot` should be inside the viewport at 1280x800 and 375x812.

### Add, remove or rename a project (`projects.ts`)
1. Required fields: `id` (unique, used in element ids), `title`, `tagline`, `role`, `problem`, `patterns`, `decisions`, optional `result`, `visual`.
2. `visual` must be a value of `ProjectVisual` in `types.ts`, implemented in `VISUALS` and captioned in `visualCaption` (both in `src/render/visuals.ts`). A new visual kind needs all three.
3. Layout is automatic: a project with `result.value` gets the number-led layout; others alternate. No CSS change needed.
4. Project titles are referenced by name elsewhere. Update them when renaming or removing:
   - `usedIn` arrays and the note text in `systems.ts`
   - `skillEvidence` strings in `skills.ts` (skill links are also derived from `patterns` through `patternAliases`)
   - the Selected Work intro line in `src/render/page.ts` (it states how many projects there are)
5. On wide screens the theatre is a pinned horizontal scroll. Each panel must fit its viewport: run the panel clearance check below at 1440x900 and 1280x800. Keep decisions to two or three short bullets.

### Add or change skills (`skills.ts`)
- Groups render in order; names must be exact product names (Thymeleaf, Elasticsearch, scikit-learn, pandas, macOS, PostgreSQL).
- A skill becomes a cyan, clickable link only if it matches a project pattern through `patternAliases` or has an entry in `skillEvidence`. Keys must match the item text exactly; renaming an item means renaming its key.
- Long group names wrap in a narrow column on desktop; check nothing is clipped.

### Change research (`research.ts`)
- The featured paper's `reference`, `status`, `venue` and `doi` should match the publisher record. `facts` values are animated counters: keep them as plain numbers with an optional suffix (`99.04%`, `10`).
- `pipeline` has one label per figure stage, paired by index with the glyphs in `pipelineGlyphs` (`visuals.ts`). Changing the count means changing both.
- Every non-published item needs an explicit status label ("Research project · not yet published", "Undergraduate thesis · 2020").

### Change the systems diagram (`systems.ts`)
- Node `id`s are referenced by `architectureEdges`, by the node positions in `src/render/architecture.ts` (both the `wide` and `tall` layouts) and by `ROUTE` and `BUILD_ORDER` in `src/motion/scenes/systems.ts`. Adding or renaming a node means updating all of them.
- UI events: `arch:select` (any selection, with `source`), `arch:goto` (packet reached a node), `arch:follow` (motion layer turns narration on or off).

### Add a new section
1. Markup in `src/render/page.ts`: a `<section>` with an `id` and `data-chapter="Name"` (feeds the progress rail label). Add it to `NAV` if it should be in the menu.
2. Styles in `src/styles/scenes.css` using tokens. If anything slides in from the side, give the section `overflow-x: clip` (in `motion.css`) or phones will widen the page.
3. A motion scene in `src/motion/scenes/`, registered in `src/main.ts` **in document order, before `chrome` and `core`** (they must stay last so their triggers include every pin's spacing).
4. Content must be visible with no JavaScript; only hide things from inside a scene (GSAP `from`/`fromTo`), never with static CSS (the `data-boot` hero pattern is the one exception).

### Animation rules (things that have already caused bugs here)
- Build animations inside the scene function so the GSAP context reverts them. Anything created later (callbacks, async) must go through `env.later(...)`.
- Never animate an element that has a CSS `transform` used for layout; use the individual `translate` property in CSS instead (see `.nav`, `.hero__core`, `.project__index`).
- Do not scale or translate an element that is itself a scroll trigger or contains triggers; it skews every measurement inside it. Use `clip-path` (see the Lab sheet).
- Two scrubbed timelines must never animate the same property of the same object. For the WebGL core, each scroll range owns its own channel in `stage.channels`.
- Triggers nested in the horizontal theatre's `containerAnimation` do not settle after a jump (reload, deep link). Derive panel state from the theatre's own progress, as `sync()` in `work.ts` does.
- Do not reintroduce CSS `scroll-behavior: smooth`; it animates browser scroll restoration through the whole page. In-page links are smoothed in `engine.ts`.

### WebGL core
- Tier (`high` or `low`) and resolution come from `pickTier` in `stage.ts`; a slow first second lowers resolution once. Save-Data and reduced motion skip WebGL entirely and keep the SVG poster.
- The core sits on the SVG poster's position while `heroOut` is near zero, so changing the hero layout moves the 3D core with it.

### SEO and sharing
- Everything comes from `src/content/site.ts` plus the profile and research content; `src/render/seo.ts` writes the head tags, JSON-LD and `sitemap.xml`.
- `public/og-image.jpg` is a 1200x630 image with text baked in. If the name, role wording or tagline changes, regenerate it so it matches, and keep `site.image.alt` describing what the image actually says.
- Files referenced from `index.html` with a leading `/` get the `/profile/` base added by Vite. URLs written by the render plugin do not; use absolute URLs built from `site.url`.

## Verification checklist (run before saying "done")

```bash
npx tsc --noEmit && npx eslint . && npm run build
grep -rn $'\xe2\x80\x94' src index.html README.md CLAUDE.md HANDOFF.md   # em dash check: must print nothing
```

Then, in a browser at 1440x900, 1280x800 and 375x812:

```js
// No sideways scroll
document.documentElement.scrollWidth <= innerWidth
// Theatre panels clear the nav and the progress counter (wide screens)
[...document.querySelectorAll('.project')].map(p => {
  const r = p.getBoundingClientRect();
  const parts = [...p.querySelectorAll('.project__head,.project__stage,.project__spec,.project__outcome')].map(e => e.getBoundingClientRect());
  return [p.id, Math.round(Math.min(...parts.map(b => b.top)) - r.top), Math.round(r.bottom - Math.max(...parts.map(b => b.bottom)))];
}) // both numbers should stay above about 90
```

Also confirm in `dist/index.html` that changed text appears and that the confidential topic does not.

### Testing gotchas
- The in-app browser pane suspends animation frames when hidden or covered; scroll-revealed content can look blank in screenshots. Measure the DOM instead of trusting a single screenshot.
- Screenshots do not capture the WebGL canvas. To see it, render a frame and copy it onto a 2D canvas overlay.
- If the dev server serves raw `<!--ssg:...-->` placeholders, it is running a stale config; restart it. Editing `vite.config.ts` or anything it imports (all of `src/content` and `src/render`) restarts the server.
- Reduced motion cannot be simulated in the pane; check that logic by reading the code.

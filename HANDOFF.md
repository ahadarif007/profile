# HANDOFF.md

Where the project stands, what was decided and why, and what is still open. Read `CLAUDE.md` first for the working rules and change recipes.

## Current state

- The site is live on GitHub Pages under `/profile/` and deploys automatically on every push to `main` (`.github/workflows/deploy.yml`). Pages is set to use GitHub Actions as its source.
- `main` is the only branch in use. All work so far is committed and pushed.
- Lint, type-check and build pass. The build prints two known, harmless warnings (see "Known limitations").

## How it was built (in order)

1. **Rebuild:** replaced an old HTML template with Vite + TypeScript. Content moved into typed modules and is rendered to static HTML at build time.
2. **Motion system:** central engine with GSAP, ScrollTrigger and Lenis; one scene per section; pinned manifesto, horizontal project theatre on wide screens, progress rail, context-aware nav.
3. **WebGL core:** Three.js object that takes over from the SVG poster after load, driven by scroll channels; quality tiers and fallbacks.
4. **Narrative polish:** content-driven project layouts, journal-style Lab with a copyable reference, narrated systems tour, evidence-linked skills, copy buttons.
5. **Critique pass:** fixed hero overlay clutter, theatre fit on laptop-height screens, the Arsenal layout, the manifesto start state and section spacing.
6. **Deploy:** GitHub Actions workflow to Pages; README rewritten.
7. **SEO:** generated title, description, Open Graph and Twitter tags, JSON-LD (Person, ProfilePage, WebSite, ScholarlyArticle), sitemap, social preview image and icons.
8. **Content revisions:** two rounds of written feedback applied only where they held up against the owner's latest CV and the paper's publisher record.
9. **Corner avatar:** two versions of the owner, one picked at random on each page load (both kept on the owner's request). A 3D toon (Three.js) whose eyes, eyebrows and mouth are the drawn ones from the character sheets, and a 2D drawn version that crossfades between ten drawn expressions and moves on springs. Both look at the pointer, blink, react to fast scrolls, wave and talk when clicked, say hello at the contact section and doze off after 25 seconds idle. They only appear once nothing readable is behind them, duck while text passes under them, and can be hidden for the session. Reduced motion and Save-Data get a still crop of the portrait; without WebGL the 2D version is used. Artwork comes from Gemini-generated sheets in `design/avatar-refs/`, cut out by `design/build-avatar-assets.py`.

## Decisions to keep (do not undo without asking the owner)

- **Design and layout are approved as they are.** Content changes should not alter structure or styling.
- **The hero title is the owner's name**, with "I build systems that think." as the line underneath.
- **The current research topic stays confidential** (see `CLAUDE.md`, hard rule 3). Several reviews suggested featuring it; that was declined on purpose.
- **Claims were deliberately softened** to match the latest CV: roles say what was actually done, figures carry their source ("from internal reporting", "reported"), and unverifiable items were removed. Do not restore stronger wording unless the owner confirms it is accurate.
- **The skills list was trimmed** to what the latest CV supports. Items removed on purpose include several older languages, front-end libraries and data formats. Re-add only on request.
- **Contact shows one email plus public profiles.** No phone numbers.
- **No em dashes, plain human tone**, everywhere.

## Open items

Questions for the owner:
1. **Employee Happiness "85%":** the latest CV dropped this number. Keep it (with how it was measured in mind) or remove `result.value`, which also switches that panel to a non-numeric layout automatically.
2. **Recognition items need years and issuers** so they can be checked. Links to online-judge profiles would support the problem-solving line.
3. **Fin-Pulse** is not in the latest CV. Confirm it should stay.
4. **Selected Work intro line** (in `src/render/page.ts`) says the projects were "designed and shipped", while one project is now described as a contribution. Suggested: "Six projects from my time at the company, and the decisions behind them."
5. **Principles section** text was drafted for the owner and should be rewritten in their own words.

Tasks waiting on something:
6. **Social preview image** (`public/og-image.jpg`) still says "AI researcher" while the site says "machine learning researcher". Regenerate it (method below) and update `site.image.alt` to match.
7. **Google Search Console:** once the owner has the HTML-tag verification code, add `<meta name="google-site-verification" content="...">` to `index.html` (static head section, not the generated part), then submit `sitemap.xml` and request indexing.

Optional clean-up:
8. `.idea/` (IDE settings) is tracked in git. It can be removed from tracking and added to `.gitignore`.
9. Old contact details from the original template still exist in early git history. Removing them needs a history rewrite and a force push to `main`; only do this if the owner explicitly asks, and explain the consequences first.

Not yet verified:
10. Safari, real phones and tablets, `prefers-reduced-motion` in a real browser, Lighthouse or performance profiling on real hardware.
11. The avatar's motion in a visible browser window: it was checked from rendered frames and DOM measurements, since the in-app pane was hidden during testing.

## Known limitations

- The Three.js chunk is about 540 KB (about 135 KB gzipped). Vite warns that it is over 500 KB; it is lazy-loaded after first paint and never loads for reduced motion or Save-Data, so the warning is expected.
- Vite prints a note that the config imports files without extensions. It does not affect the build.
- The in-app browser pane cannot capture WebGL in screenshots and throttles animation when hidden; see the testing gotchas in `CLAUDE.md`.

## Regenerating the social preview image

The image was rendered with headless Chrome from a throwaway HTML page, not from the site itself:

1. Write a small script (run with `npx tsx`) that imports `coreSvg()` from `src/render/core-svg.ts` and writes an HTML file: 1200x630 body, the site's dark background and grid floor, the core SVG on the right, and on the left the brand mark, the name, the role line, the tagline and the site URL. Load the Space Grotesk, Geist and Geist Mono `.woff2` files from `node_modules/@fontsource-variable/*/files/` with `file://` URLs.
2. Screenshot it:
   ```bash
   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --allow-file-access-from-files --virtual-time-budget=3000 --window-size=1200,630 --screenshot=og-image.png file:///path/to/og.html
   ```
3. Convert to JPEG to keep it small, then replace the file in `public/`:
   ```bash
   sips -s format jpeg -s formatOptions 86 og-image.png --out public/og-image.jpg
   ```
4. Update `site.image.alt` in `src/content/site.ts`, rebuild, and check the card with LinkedIn's Post Inspector after deploying.

Keep scratch files (scripts, HTML, PNGs) outside the repository.

## Resuming work

1. Read `CLAUDE.md`, then this file.
2. `npm install`, `npm run dev`, open `http://localhost:5173/profile/`.
3. Pick the matching change recipe in `CLAUDE.md`, make the change, run the verification checklist.
4. Update the "Open items" list here when something is resolved or added.
5. Commit and push only when the owner asks.

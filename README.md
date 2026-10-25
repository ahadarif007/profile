# AHAD.SYS

My personal portfolio, live at <https://ahadarif007.github.io/profile/>.

It's a static site with no backend. The page is built from plain content files, rendered to HTML at build time, and then animated with GSAP and a small Three.js scene. It still reads fine with JavaScript turned off, and it drops the motion entirely for anyone who has "reduce motion" switched on.

## Requirements

- Node.js 24 (the exact version is in `.nvmrc`, so `nvm use` picks it up)
- npm (comes with Node)

## Getting started

```bash
npm install
npm run dev
```

Then open <http://localhost:5173/profile/>. The `/profile/` part matters, because that's where GitHub Pages serves the site.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the dev server with hot reload |
| `npm run lint` | Runs ESLint over the project |
| `npm run typecheck` | Type-checks without building |
| `npm run build` | Type-checks, then builds the site into `dist/` |
| `npm run preview` | Serves the built `dist/` folder locally |

## Updating the content

All the text on the site lives in `src/content/`. You shouldn't need to touch any other folder to change what the page says.

| File | What's in it |
| --- | --- |
| `profile.ts` | Name, hero text, manifesto, contact links, career timeline, education, recognition |
| `projects.ts` | The six projects in the project theatre |
| `research.ts` | The featured paper, its reference line, and the other research notes |
| `skills.ts` | Skill groups, plus which skills link to evidence elsewhere on the page |
| `systems.ts` | The architecture diagram's components and their descriptions |
| `principles.ts` | The four engineering principles |
| `site.ts` | Search and sharing: page title, description, social preview image and topics for Google |

A few things happen automatically:

- A project with a `result.value` (for example `46%`) gets the layout that leads with that number. Other projects alternate between two layouts.
- A skill is shown in cyan and becomes clickable when it matches a pattern on a project, or when it has an entry in `skillEvidence` in `skills.ts`. Anything else is listed as plain text.
- The meta tags, the structured data Google reads, and `sitemap.xml` are all generated from these files at build time, so they stay in step with the page.
- The social preview image is `public/og-image.jpg` (1200×630). If you replace it, keep that size.
- After any edit, run `npm run build` to make sure everything still type-checks.

## Project structure

```
src/
  content/   what the site says (edit these)
  render/    turns the content into HTML at build time, plus the generated SVG diagrams
  styles/    design tokens and the CSS for each section
  motion/    the animation engine and one file per scene
  gl/        the Three.js core, loaded only after the page has painted
  ui/        small interactive pieces: nav, diagram inspector, skill links, copy buttons
public/      files copied as-is (favicon)
```

## Deploying

Every push to `main` runs `.github/workflows/deploy.yml`. It installs dependencies, lints, type-checks, builds, and publishes `dist/` to GitHub Pages.

One-time setup in the GitHub repository:

1. Open **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.

You can follow each deploy in the **Actions** tab. To redeploy without a new commit, open the "Deploy to GitHub Pages" workflow there and click **Run workflow**.

If the deploy step complains that the `github-pages` environment doesn't allow the branch, go to **Settings → Environments → github-pages** and allow `main`.

import { education, profile, recognition, timeline } from '../content/profile';
import { principles } from '../content/principles';
import { projects } from '../content/projects';
import { featuredPaper, publications } from '../content/research';
import { patternAliases, skillEvidence, skillGroups } from '../content/skills';
import { architectureNode, architectureNote } from '../content/systems';
import { architectureSvg } from './architecture';
import { coreSvg } from './core-svg';
import { html, pad, raw, words, type Raw } from './html';
import type { Project } from '../content/types';
import { pipelineGlyphs, projectVisual, visualCaption } from './visuals';

const NAV = [
  { href: '#work', label: 'Work' },
  { href: '#lab', label: 'Lab' },
  { href: '#systems', label: 'Systems' },
  { href: '#arsenal', label: 'Arsenal' },
];

const external = (href: string, label: string, className = '') =>
  html`<a class="${className}" href="${href}" target="_blank" rel="noopener noreferrer">${label}<span class="sr-only"> (opens in a new tab)</span></a>`;

/** Wraps the final word of a line so it can carry the cyan accent. */
const accentLast = (line: string) => {
  const cut = line.lastIndexOf(' ');
  return html`${line.slice(0, cut + 1)}<em class="accent">${line.slice(cut + 1)}</em>`;
};

/** A copy-to-clipboard control; hidden unless the browser can actually copy (see ui/copy.ts). */
const copyButton = (text: string, label: string) =>
  html`<button class="copy" type="button" data-copy="${text}">${label}</button>`;

const chapter = (n: number, name: string) => html`<p class="chapter"><span class="chapter__n">${pad(n)}</span><span class="chapter__name">${name}</span></p>`;

function nav(): Raw {
  return html`
<header class="nav" data-nav data-boot>
  <a class="nav__brand" href="#boot" aria-label="${profile.brand}, back to top">
    <span class="nav__mark" aria-hidden="true"></span>${profile.brand}
  </a>
  <nav class="nav__links" id="nav-links" aria-label="Primary">
    ${NAV.map((item) => html`<a href="${item.href}">${item.label}</a>`)}
    <a class="nav__cta" href="#contact">Contact</a>
  </nav>
  <button class="nav__toggle" type="button" aria-expanded="false" aria-controls="nav-links" data-nav-toggle>
    <span class="sr-only">Menu</span><span class="nav__burger" aria-hidden="true"></span>
  </button>
</header>`;
}

function hero(): Raw {
  return html`
<section class="hero" id="boot" data-chapter="System boot" aria-labelledby="hero-title">
  <div class="hero__grid" data-boot aria-hidden="true"></div>
  <div class="hero__horizon" data-boot aria-hidden="true"></div>
  <div class="hero__core" data-core data-boot aria-hidden="true">${raw(coreSvg())}</div>
  <div class="hero__inner wrap">
    <p class="hero__meta label" data-boot>
      <span>${profile.roles.join(' / ')}</span>
      <span class="hero__meta-loc">${profile.location}</span>
    </p>
    <h1 class="hero__title" id="hero-title" data-boot>
      ${profile.heroLines.map((line, i, all) => html`<span class="hero__line hero__line--${i + 1}"><span class="hero__line-i">${i === all.length - 1 ? accentLast(line) : line}</span></span>`)}
    </h1>
    <div class="hero__foot" data-boot>
      <p class="hero__intro">${profile.heroIntro}</p>
      <div class="hero__actions">
        <p class="status"><span class="status__dot" aria-hidden="true"></span>${profile.availability}</p>
        <a class="btn btn--primary" href="#manifesto">Enter the system <span aria-hidden="true">↓</span></a>
      </div>
    </div>
  </div>
</section>`;
}

function manifesto(): Raw {
  const [first, second] = profile.manifesto;
  return html`
<section class="manifesto" id="manifesto" data-chapter="Manifesto" aria-labelledby="manifesto-title">
  <div class="wrap">
    ${chapter(2, 'Manifesto')}
    <h2 class="manifesto__title" id="manifesto-title">
      <span class="manifesto__line manifesto__line--solid">${words(first)}</span>
      <span class="manifesto__line manifesto__line--outline">${words(second)}</span>
    </h2>
    <p class="manifesto__body">${profile.manifestoBody}</p>
  </div>
  <div class="uptime wrap" aria-labelledby="uptime-title">
    <h3 class="uptime__title label" id="uptime-title">Uptime · 2020 → 2027</h3>
    <ol class="uptime__list">
      ${timeline.map(
        (entry) => html`
      <li class="uptime__item uptime__item--${entry.kind}">
        <span class="uptime__when">${entry.start} – ${entry.end}</span>
        <span class="uptime__role">${entry.title}</span>
        <span class="uptime__org">${entry.org}</span>
      </li>`,
      )}
    </ol>
  </div>
</section>`;
}

/**
 * Composition follows content: a project with a headline number leads with it,
 * the others alternate between a launch layout and a large-title billboard.
 */
function projectPanel(p: Project, i: number, total: number): Raw {
  const layout = p.result?.value ? 'stat' : i % 2 ? 'billboard' : 'launch';
  const flip = i % 2 === 1 ? ' project--flip' : '';
  return html`
    <article class="project project--${layout}${flip}" id="project-${p.id}" aria-labelledby="project-${p.id}-title">
      <div class="project__index" aria-hidden="true">${pad(i + 1)}</div>
      <header class="project__head">
        <p class="project__eyebrow label"><span class="project__n">${pad(i + 1)} / ${pad(total)}</span><span>${p.role}</span></p>
        <h3 class="project__title" id="project-${p.id}-title">${p.title}</h3>
        <p class="project__tagline">${p.tagline}</p>
      </header>
      <figure class="project__stage">
        <div class="project__visual">${raw(projectVisual(p.visual))}</div>
        <figcaption>${visualCaption[p.visual]}</figcaption>
      </figure>
      <div class="project__spec">
        <section class="spec">
          <h4 class="label">Problem</h4>
          <p>${p.problem}</p>
        </section>
        <section class="spec">
          <h4 class="label">Decisions</h4>
          <ul>${p.decisions.map((d) => html`<li>${d}</li>`)}</ul>
        </section>
      </div>
      <div class="project__outcome">
        ${p.result
          ? html`<p class="project__result">${p.result.value ? html`<strong>${p.result.value}</strong>` : ''}<span>${p.result.label}</span></p>`
          : ''}
        <ul class="project__tags" aria-label="Patterns">${p.patterns.map((t) => html`<li>${t}</li>`)}</ul>
      </div>
    </article>`;
}

function work(): Raw {
  return html`
<section class="work" id="work" data-chapter="Project theatre" aria-labelledby="work-title">
  <header class="work__head wrap">
    ${chapter(3, 'Project theatre')}
    <h2 class="work__title" id="work-title"><span>Selected</span> <span>work</span></h2>
    <p class="work__lede">Six things I designed and shipped at BRAC IT, and the decisions behind them.</p>
  </header>
  <div class="work__viewport" data-work-viewport>
  <div class="work__track" data-work-track>
    ${projects.map((p, i) => projectPanel(p, i, projects.length))}
  </div>
  <div class="work__hud" aria-hidden="true" data-work-hud>
    <span class="work__hud-count"><span data-work-hud-n>01</span> / ${pad(projects.length)}</span>
    <span class="work__hud-title" data-work-hud-title>${projects[0]?.title ?? ''}</span>
    <span class="work__hud-bar"><span data-work-hud-bar></span></span>
  </div>
  </div>
</section>`;
}

function lab(): Raw {
  const paper = featuredPaper;
  return html`
<section class="lab" id="lab" data-chapter="AI laboratory" aria-labelledby="lab-title">
  <div class="wrap">
    <p class="lab__running label" aria-hidden="true">
      <span>${profile.brand} · Lab notes</span><span>${publications.length + 2} entries, one under embargo</span>
    </p>
    <header class="lab__head">
      ${chapter(4, 'AI laboratory')}
      <h2 class="lab__title" id="lab-title">The Lab</h2>
      <p class="lab__lede">Published work, a thesis, and one project I can’t talk about yet.</p>
    </header>

    <article class="paper" aria-labelledby="paper-title">
      <div class="paper__row paper__row--head">
        <p class="paper__margin label">[01]</p>
        <div class="paper__main">
          <p class="paper__status label">${paper.status}</p>
          <h3 class="paper__title" id="paper-title">${paper.title}</h3>
          <p class="paper__venue">${paper.venue}</p>
        </div>
      </div>
      <div class="paper__row">
        <p class="paper__margin label">Summary</p>
        <div class="paper__body">${paper.summary.map((s) => html`<p>${s}</p>`)}</div>
        <dl class="paper__facts">
          ${paper.facts.map((fact) => html`<div><dt>${fact.label}</dt><dd>${fact.value}</dd></div>`)}
        </dl>
      </div>
      <div class="paper__row">
        <p class="paper__margin label">Fig. 1<br />Method</p>
        <figure class="paper__main paper__figure">
          <ol class="pipeline">
            ${paper.pipeline.map(
              (stage, i) =>
                html`<li class="pipeline__stage"><span class="pipeline__k label">(${String.fromCharCode(97 + i)})</span>${raw(pipelineGlyphs[i] ?? '')}<span>${stage}</span></li>`,
            )}
          </ol>
          <figcaption>The method as described in the paper, from (a) the input leaf to (e) the classifier. VGG16 is drawn as its five convolutional blocks.</figcaption>
        </figure>
      </div>
      <div class="paper__row">
        <p class="paper__margin label">Reference</p>
        <div class="paper__main paper__ref">
          <p class="paper__cite">${paper.reference}</p>
          <p class="paper__links">
            ${paper.links.map((l) => external(l.href, l.label, 'link'))}
            ${copyButton(paper.reference, 'Copy reference')}
          </p>
        </div>
      </div>
    </article>

    <div class="notes">
      ${publications.map(
        (pub, i) => html`
      <article class="note" aria-labelledby="note-${i}">
        <p class="label">[${pad(i + 2)}] ${pub.status}</p>
        <h3 class="note__title" id="note-${i}">${pub.title}</h3>
        ${pub.summary.map((s) => html`<p>${s}</p>`)}
        <p>${pub.links.map((l) => external(l.href, l.label, 'link'))}</p>
      </article>`,
      )}
      <article class="note note--sealed" aria-labelledby="note-sealed">
        <p class="label">[${pad(publications.length + 2)}] In progress</p>
        <h3 class="note__title" id="note-sealed">Ongoing research · under embargo</h3>
        <div class="redacted" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
        <p>I can’t share this one yet. It will go up here once it’s published.</p>
      </article>
    </div>
  </div>
</section>`;
}

function systems(): Raw {
  const first = architectureNode('gate');
  return html`
<section class="systems" id="systems" data-chapter="Systems architecture" aria-labelledby="systems-title">
  <div class="wrap">
    <header class="systems__head">
      ${chapter(5, 'Systems architecture')}
      <h2 class="systems__title" id="systems-title">How one request<br/>moves through it.</h2>
      <p class="systems__lede">Watch one request travel through, or select any component to read about it. ${architectureNote}</p>
    </header>
    <div class="systems__board" data-arch>
      <div class="systems__diagram">
        ${raw(architectureSvg('wide'))}
        ${raw(architectureSvg('tall'))}
      </div>
      <aside class="inspector" aria-live="polite" data-arch-panel>
        <div class="inspector__top">
          <p class="label">Inspecting</p>
          <button class="inspector__follow" type="button" aria-pressed="false" aria-label="Follow the request through the system" data-arch-follow>Follow along</button>
        </div>
        <h3 class="inspector__title" data-arch-title>${first.label}</h3>
        <p class="inspector__body" data-arch-body>${first.detail}</p>
        <p class="label">Used in</p>
        <ul class="inspector__tags" data-arch-tags>${first.usedIn.map((t) => html`<li>${t}</li>`)}</ul>
      </aside>
    </div>
  </div>
</section>`;
}

/** Projects and CV entries that back up a listed tool. */
function evidenceFor(skill: string): string[] {
  const aliases = patternAliases[skill] ?? [];
  const fromProjects = projects.filter((p) => p.patterns.some((t) => aliases.includes(t))).map((p) => p.title);
  return [...fromProjects, ...(skillEvidence[skill] ?? [])];
}

function kitItem(skill: string): Raw {
  const uses = evidenceFor(skill);
  return uses.length
    ? html`<li><button class="kit__item kit__item--linked" type="button" aria-pressed="false" aria-describedby="arsenal-readout" data-uses="${uses.join('|')}">${skill}</button></li>`
    : html`<li><span class="kit__item">${skill}</span></li>`;
}

function arsenal(): Raw {
  return html`
<section class="arsenal" id="arsenal" data-chapter="Technical arsenal" aria-labelledby="arsenal-title">
  <div class="wrap arsenal__layout">
    <div class="arsenal__side">
      <header class="arsenal__head">
        ${chapter(6, 'Technical arsenal')}
        <h2 class="arsenal__title" id="arsenal-title">What I<br/>work with.</h2>
      </header>
      <p class="arsenal__readout" id="arsenal-readout" aria-live="polite" data-arsenal-readout>Tools in cyan show up in the work on this page. Select one to see where.</p>
    </div>
    <div class="arsenal__groups">
      ${skillGroups.map(
        (group, i) => html`
      <section class="kit" aria-labelledby="kit-${group.id}">
        <h3 class="kit__name" id="kit-${group.id}"><span class="kit__n">${pad(i + 1)}</span>${group.name}</h3>
        <ul class="kit__items">${group.items.map(kitItem)}</ul>
        <p class="kit__readout" aria-hidden="true" data-kit-readout></p>
      </section>`,
      )}
    </div>
  </div>
</section>`;
}

function principlesSection(): Raw {
  return html`
<section class="principles" id="principles" data-chapter="Principles" aria-labelledby="principles-title">
  <div class="wrap">
    ${chapter(7, 'Principles')}
    <h2 class="sr-only" id="principles-title">Engineering principles</h2>
    <ol class="principles__list">
      ${principles.map(
        (p, i) => html`
      <li class="principle">
        <span class="principle__n" aria-hidden="true">${pad(i + 1)}</span>
        <h3 class="principle__title">${p.title}</h3>
        <p class="principle__body">${p.body}</p>
      </li>`,
      )}
    </ol>
  </div>
</section>`;
}

function contact(): Raw {
  return html`
<section class="contact" id="contact" data-chapter="Final transmission" aria-labelledby="contact-title">
  <div class="contact__beam" aria-hidden="true"></div>
  <div class="wrap">
    ${chapter(8, 'Final transmission')}
    <h2 class="contact__title" id="contact-title">
      <span>Let’s build</span> <span>something</span> <span>that ${html`<em class="accent">matters.</em>`}</span>
    </h2>
    <div class="contact__channels">
      <a class="contact__email" href="mailto:${profile.email}">${profile.email}</a>
      <div class="contact__row">
        ${copyButton(profile.email, 'Copy email')}
        <ul class="contact__links">
          ${profile.links.map((l) => html`<li>${external(l.href, l.label, 'link link--big')}</li>`)}
        </ul>
      </div>
      <p class="status contact__status"><span class="status__dot" aria-hidden="true"></span>${profile.availability} · ${profile.location}</p>
    </div>
    <div class="ledger">
      <section aria-labelledby="ledger-edu">
        <h3 class="label" id="ledger-edu">Education</h3>
        ${education.map(
          (e) => html`
        <div class="ledger__entry">
          <p class="ledger__main">${e.degree}</p>
          <p>${e.institution} · ${e.place}</p>
          <p class="ledger__meta">${e.period} · ${e.result}</p>
        </div>`,
        )}
      </section>
      <section aria-labelledby="ledger-rec">
        <h3 class="label" id="ledger-rec">Recognition</h3>
        <ul class="ledger__list">${recognition.map((r) => html`<li>${r}</li>`)}</ul>
      </section>
    </div>
  </div>
  <footer class="footer wrap">
    <p>© ${new Date().getFullYear()} ${profile.name}</p>
    <p>${profile.brand} · Built with Vite, GSAP and Three.js</p>
    <a href="#boot">Back to top <span aria-hidden="true">↑</span></a>
  </footer>
</section>`;
}

export function renderPage(): string {
  return html`
<a class="skip" href="#main">Skip to content</a>
<p class="sr-only" aria-live="polite" data-copy-status></p>
<div class="atmos" aria-hidden="true"><div class="atmos__glow"></div><div class="atmos__grain"></div></div>
${nav()}
<div class="rail" aria-hidden="true" data-rail><span class="rail__fill" data-rail-fill></span><span class="rail__label" data-rail-label></span></div>
<main id="main">
  ${hero()}
  ${manifesto()}
  ${work()}
  ${lab()}
  ${systems()}
  ${arsenal()}
  ${principlesSection()}
  ${contact()}
</main>`.value;
}

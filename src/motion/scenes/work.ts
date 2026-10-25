import { gsap } from 'gsap';
import { pad } from '../../render/html';
import type { Scene } from '../engine';
import { drift, EASE, onEnter, q, qa, revealLines } from '../primitives';

/** Draws a project's diagram in reading order: structure, then data, then annotation. */
function visualIntro(panel: Element): gsap.core.Timeline {
  const svg = q('.vx', panel);
  const tl = gsap.timeline({ paused: true, defaults: { ease: EASE.arrive } });
  if (!svg) return tl;
  return tl
    .from(qa('.vx-line:not(.vx-line--flow)', svg), { drawSVG: '0%', duration: 1.4, stagger: 0.08, ease: EASE.wipe }, 0)
    .from(qa('.vx-node, .vx-plate, .vx-gate, .vx-row', svg), { opacity: 0, scale: 0.6, transformOrigin: '50% 50%', duration: 0.9, stagger: 0.05 }, 0.2)
    .from(qa('.vx-event, .vx-record, .vx-payload', svg), { opacity: 0, scaleY: 0, transformOrigin: '50% 100%', duration: 0.6, stagger: 0.04 }, 0.4)
    .from(qa('.vx-label, .vx-dot, .vx-recon, .vx-line--flow, .vx-swatch', svg), { opacity: 0, duration: 0.8, stagger: 0.02 }, 0.6);
}

/** Text arrives in reading order: headline block, then the spec, then the outcome. */
function copyIntro(panel: Element, horizontal: boolean): gsap.core.Timeline {
  return gsap.timeline({ paused: true }).from(qa('.project__head > *, .project__spec > *, .project__outcome > *', panel), {
    opacity: 0,
    ...(horizontal ? { x: 70 } : { y: 30 }),
    duration: 1.1,
    stagger: 0.07,
    ease: EASE.arrive,
  });
}

/**
 * Scene 03: Project theatre. Wide screens pin the theatre and scroll it
 * sideways, one product reveal per viewport, with the diagram and the ghost
 * numeral travelling at different speeds to the copy. Smaller screens keep a
 * vertical flow with masked reveals, so touch scrolling is never hijacked.
 */
export const work: Scene = (env) => {
  const section = q('.work');
  const viewport = q('[data-work-viewport]', section ?? document);
  const track = q('[data-work-track]', section ?? document);
  if (!section || !viewport || !track) return;

  const panels = qa('.project', section);
  const [selected, word] = qa('.work__title span', section);
  const head = q('.work__head', section);
  const lede = q('.work__lede', section);

  // The two title words converge from opposite edges as the chapter arrives.
  const converge = { trigger: head, start: 'top bottom', end: 'center 45%', scrub: true };
  gsap.fromTo(selected ?? [], { xPercent: -16 }, { xPercent: 0, ease: 'none', scrollTrigger: converge });
  gsap.fromTo(word ?? [], { xPercent: 24 }, { xPercent: 0, ease: 'none', scrollTrigger: converge });
  if (lede) revealLines(lede, { start: 'top 88%' });

  if (!env.wide) {
    panels.forEach((panel) => {
      const visual = q('.project__visual', panel);
      const svg = q('.vx', panel);
      const index = q('.project__index', panel);
      const unmask = { trigger: visual, start: 'top 95%', end: 'top 45%', scrub: 0.4 };
      gsap.fromTo(visual, { clipPath: 'inset(14% 10% 14% 10% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 28px)', ease: 'none', scrollTrigger: unmask });
      gsap.fromTo(svg, { scale: 1.15 }, { scale: 1, ease: 'none', scrollTrigger: unmask });
      if (index) drift(index, 60, panel);
      if (visual) onEnter(visual, visualIntro(panel), 'top 70%');
      onEnter(q('.project__head', panel) ?? panel, copyIntro(panel, false), 'top 85%');
    });
    return;
  }

  /* ---- Horizontal theatre ---- */

  section.classList.add('work--h');
  const hud = q('[data-work-hud]', section);
  const hudN = q('[data-work-hud-n]', section);
  const hudTitle = q('[data-work-hud-title]', section);
  const hudBar = q('[data-work-hud-bar]', section);
  const distance = () => track.scrollWidth - window.innerWidth;

  let current = -1;
  const setHud = (i: number) => {
    if (i === current) return;
    current = i;
    if (hudN) hudN.textContent = pad(i + 1);
    if (hudTitle) {
      hudTitle.textContent = q('.project__title', panels[i])?.textContent ?? '';
      gsap.fromTo(hudTitle, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: EASE.arrive });
    }
  };

  // Each panel's reveal is keyed to the track's own offset rather than to nested
  // triggers, so landing mid-theatre (reload, deep link, fast jump) is always in sync.
  const intros = panels.map((panel) => ({ panel, visual: visualIntro(panel), copy: copyIntro(panel, true), on: false }));
  const sync = (progress: number) => {
    const offset = progress * distance();
    const width = window.innerWidth;
    intros.forEach((intro, i) => {
      if (i === 0) return;
      const entered = intro.panel.offsetLeft - offset <= width * 0.7;
      if (entered !== intro.on) {
        intro.on = entered;
        intro.visual[entered ? 'play' : 'reverse']();
        intro.copy[entered ? 'play' : 'reverse']();
      }
    });
    setHud(Math.min(panels.length - 1, Math.max(0, Math.round(offset / width))));
  };

  const scroller = gsap.to(track, {
    x: () => -distance(),
    ease: 'none',
    scrollTrigger: {
      trigger: viewport,
      start: 'top top',
      end: () => `+=${distance()}`,
      pin: true,
      scrub: env.finePointer ? true : 0.5,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onToggle: (self) => hud?.classList.toggle('is-on', self.isActive),
      onUpdate: (self) => {
        gsap.set(hudBar, { scaleX: self.progress });
        sync(self.progress);
      },
      onRefresh: (self) => sync(self.progress),
    },
  });

  const [opening] = intros;
  if (opening) {
    onEnter(viewport, opening.visual, 'top 65%');
    onEnter(viewport, opening.copy, 'top 55%');
  }

  panels.forEach((panel, i) => {
    // The first panel starts at rest; later panels travel the full depth range across the viewport.
    const first = i === 0;
    const across = { trigger: panel, containerAnimation: scroller, start: first ? 'left left' : 'left right', end: 'right left', scrub: true };
    // Depth: the diagram lags the panel; the ghost numeral races past it.
    gsap.fromTo(q('.project__visual', panel), { xPercent: first ? 0 : 10 }, { xPercent: -10, ease: 'none', scrollTrigger: across });
    gsap.fromTo(q('.project__index', panel), { xPercent: first ? 0 : 45 }, { xPercent: -45, ease: 'none', scrollTrigger: across });
  });

  return () => section.classList.remove('work--h');
};

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import type { Scene } from '../engine';
import { countUp, EASE, onEnter, q, qa, revealLines } from '../primitives';

/**
 * Scene 04: The Lab. The paper sheet slides up over the dark page like a
 * new document being placed on the desk; motion inside is calmer and more
 * literal: counters, a method figure that assembles stage by stage.
 */
export const lab: Scene = (env) => {
  const section = q('.lab');
  if (!section) return;

  // Clip-path (not transforms) so the sheet grows without moving any trigger measured inside it.
  const radius = getComputedStyle(section).borderTopLeftRadius;
  gsap.fromTo(
    section,
    { clipPath: env.compact ? 'inset(48px 4% 0% 4% round 40px)' : 'inset(160px 7% 0% 7% round 96px)' },
    {
      clipPath: `inset(0px 0% 0% 0% round ${radius})`,
      ease: 'none',
      scrollTrigger: { trigger: section, start: 'top bottom', end: 'top 15%', scrub: true },
    },
  );

  const title = q('.lab__title', section);
  if (title) {
    SplitText.create(title, {
      type: 'chars',
      mask: 'chars',
      autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.chars, {
          yPercent: 100,
          duration: 1.3,
          stagger: 0.05,
          ease: EASE.arrive,
          scrollTrigger: { trigger: title, start: 'top 85%', toggleActions: 'play none none reverse' },
        }),
    });
  }
  const lede = q('.lab__lede', section);
  if (lede) revealLines(lede, { start: 'top 90%' });

  /* ---- Featured paper ---- */

  const paper = q('.paper', section);
  if (paper) {
    const paperTitle = q('.paper__title', paper);
    if (paperTitle) revealLines(paperTitle, { start: 'top 85%', duration: 1.3 });
    onEnter(
      paper,
      gsap
        .timeline({ paused: true, defaults: { ease: EASE.arrive } })
        .from(q('.paper__status', paper), { opacity: 0, x: -20, duration: 1 }, 0)
        .from(q('.paper__venue', paper), { opacity: 0, duration: 1.2 }, 0.4)
        .from(qa('.paper__body > *', paper), { opacity: 0, y: 24, duration: 1.1, stagger: 0.1 }, 0.5)
        .from(qa('.paper__facts > div', paper), { opacity: 0, y: 30, duration: 1.1, stagger: 0.12 }, 0.6),
      'top 75%',
    );
  }

  const restores = qa('.paper__facts dd', section).map((dd) => countUp(dd, { start: 'top 88%' }));

  // The method figure assembles left to right (top to bottom on phones) as it is read.
  const pipeline = q('.pipeline', section);
  if (pipeline) {
    const build = gsap.timeline({
      defaults: { ease: 'power2.out' },
      scrollTrigger: { trigger: pipeline, start: 'top 85%', end: env.compact ? 'bottom 60%' : 'bottom 55%', scrub: 0.5 },
    });
    qa('.pipeline__stage', pipeline).forEach((stage, i) => {
      const at = i * 0.6;
      build
        .from(stage, { opacity: 0.15, duration: 0.5 }, at)
        .from(qa('.g-line', stage), { drawSVG: '0%', duration: 0.6 }, at)
        .from(qa('.g-tile, .g-block, .g-cell, .g-bar', stage), { scale: 0, transformOrigin: '50% 100%', duration: 0.4, stagger: 0.04 }, at + 0.1)
        .from(q('span', stage), { opacity: 0, y: 10, duration: 0.4 }, at + 0.2);
    });
  }

  /* ---- Research notes ---- */

  const notes = qa('.note', section);
  gsap.set(notes, { opacity: 0, y: 40 });
  ScrollTrigger.batch(notes, {
    start: 'top 88%',
    onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 1.1, stagger: 0.12, ease: EASE.arrive, overwrite: true }),
    onLeaveBack: (batch) => gsap.to(batch, { opacity: 0, y: 40, duration: 0.4, overwrite: true }),
  });

  const sealed = q('.note--sealed', section);
  if (sealed) {
    onEnter(
      sealed,
      gsap.timeline({ paused: true }).from(qa('.redacted span', sealed), {
        scaleX: 0,
        transformOrigin: '0% 50%',
        duration: 0.9,
        stagger: 0.1,
        ease: EASE.wipe,
        delay: 0.3,
      }),
      'top 85%',
    );
  }

  return () => restores.forEach((restore) => restore());
};

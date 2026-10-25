import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import type { Scene } from '../engine';
import { EASE, q, qa } from '../primitives';

let booted = false;

/**
 * Scene 01: System boot. Layers arrive in depth order (floor, horizon, core,
 * chrome, type) rather than all at once, then the hero hands over to scroll:
 * each layer leaves at its own rate so the page reads as one space with depth.
 */
export const boot: Scene = (env) => {
  const hero = q('.hero');
  if (!hero) return;

  const nav = q('.nav');
  const grid = q('.hero__grid', hero);
  const horizon = q('.hero__horizon', hero);
  const coreWrap = q('.hero__core', hero);
  const core = q('.core-svg', hero);
  const meta = q('.hero__meta', hero);
  const title = q('.hero__title', hero);
  const lines = qa('.hero__line', hero);
  const lineInners = qa('.hero__line-i', hero);
  const tagline = q('.hero__tagline', hero);
  const accent = q('.hero__tagline .accent', hero);
  const foot = q('.hero__foot', hero);
  const intro = q('.hero__intro', hero);
  const actions = q('.hero__actions', hero);
  const boots = qa('[data-boot]');

  /* ---- Ambient life: only while the hero is on screen ---- */

  const ambient = gsap.timeline({ repeat: -1, paused: true });
  ambient
    .to('.core__scan', { strokeDashoffset: -2220, duration: 9, ease: 'none' }, 0)
    .to('.core__ticks', { rotation: 360, svgOrigin: '0 0', duration: 120, ease: 'none' }, 0);

  /*
   * Scroll-out: every layer leaves at its own rate. Built once the boot has
   * settled so it records the resting state, not a half-revealed one.
   */
  const buildScrollOut = () =>
    gsap
      .timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: hero,
          start: 'top top',
          end: 'bottom top',
          scrub: env.finePointer ? true : 0.4,
          onToggle: (self) => (self.isActive ? ambient.play() : ambient.pause()),
        },
      })
      .to(coreWrap, { y: () => -window.innerHeight * 0.18, scale: 0.7, opacity: 0.25 }, 0)
      .to(lines[0] ?? [], { y: -120 }, 0)
      .to(lines[1] ?? [], { y: -60, x: 40 }, 0)
      .to(lines[2] ?? [], { y: -190 }, 0)
      .to(title, { opacity: 0, duration: 0.65 }, 0.35)
      .to(grid, { backgroundPositionY: '+=216px', opacity: 0.4 }, 0)
      .to(horizon, { opacity: 0, scaleX: 1.4 }, 0)
      .to([meta, tagline, foot], { y: -80, opacity: 0 }, 0);

  /* ---- Opening sequence (plays once per page load) ---- */

  if (booted) {
    gsap.set(boots, { opacity: 1 });
    buildScrollOut();
  } else {
    booted = true;
    const introSplit = intro ? SplitText.create(intro, { type: 'lines', mask: 'lines' }) : null;
    const cyan = getComputedStyle(document.documentElement).getPropertyValue('--cyan').trim();

    gsap
      .timeline({
        defaults: { ease: EASE.arrive },
        onComplete: () => {
          introSplit?.revert();
          env.later(buildScrollOut);
        },
      })
      .fromTo(grid, { opacity: 0, clipPath: 'inset(0% 0% 100% 0%)' }, { opacity: 1, clipPath: 'inset(0% 0% 0% 0%)', duration: 1.8 }, 0)
      .fromTo(horizon, { opacity: 0, scaleX: 0.2 }, { opacity: 1, scaleX: 1, duration: 1.6 }, 0.1)
      .set(coreWrap, { opacity: 1 }, 0)
      .fromTo(core, { opacity: 0, scale: 0.82, rotation: -14 }, { opacity: 1, scale: 1, rotation: 0, duration: 2.4, transformOrigin: '50% 50%' }, 0.15)
      .fromTo(nav, { opacity: 0, y: -24 }, { opacity: 1, y: 0, duration: 1.2 }, 0.45)
      .set(title, { opacity: 1 }, 0.4)
      .fromTo(lineInners, { yPercent: 120 }, { yPercent: 0, duration: 1.3, stagger: 0.1 }, 0.4)
      .fromTo(meta, { opacity: 0, letterSpacing: '0.4em' }, { opacity: 1, letterSpacing: '0.14em', duration: 1.4, clearProps: 'letterSpacing' }, 0.6)
      .fromTo(tagline, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 1.2 }, 0.85)
      .fromTo(accent, { color: '#eef3f8', textShadow: '0 0 0em rgb(57 230 255 / 0)' }, { color: cyan, textShadow: '0 0 0.6em rgb(57 230 255 / 0.35)', duration: 1.1, ease: EASE.wipe, clearProps: 'color,textShadow' }, 1.05)
      .fromTo(foot, { opacity: 1, clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: EASE.wipe, clearProps: 'clipPath' }, 0.95)
      .from(introSplit?.lines ?? [], { yPercent: 110, duration: 1.1, stagger: 0.08 }, 1.15)
      .from(actions, { opacity: 0, y: 16, duration: 1 }, 1.35);
  }

  if (hero.getBoundingClientRect().bottom > 0) ambient.play();

  /* ---- Pointer depth (mouse/trackpad on desktop only) ---- */

  if (!env.finePointer || !env.desktop || !core || !title) return () => ambient.kill();

  const coreX = gsap.quickTo(core, 'x', { duration: 1.2, ease: 'power3.out' });
  const coreY = gsap.quickTo(core, 'y', { duration: 1.2, ease: 'power3.out' });
  const titleX = gsap.quickTo(title, 'x', { duration: 1.6, ease: 'power3.out' });

  const onMove = (event: PointerEvent) => {
    const nx = event.clientX / window.innerWidth - 0.5;
    const ny = event.clientY / window.innerHeight - 0.5;
    coreX(nx * 48);
    coreY(ny * 36);
    titleX(nx * -14);
  };
  window.addEventListener('pointermove', onMove, { passive: true });

  return () => {
    window.removeEventListener('pointermove', onMove);
    ambient.kill();
  };
};

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { pad } from '../../render/html';
import type { Scene } from '../engine';
import { q, qa } from '../primitives';

/**
 * Persistent interface: the scroll-progress rail with its chapter readout, a
 * navigation bar that adapts to the paper chapter and steps aside while
 * reading, and magnetic primary controls. Built last so every trigger is
 * measured after the pinned scenes have added their spacing.
 */
export const chrome: Scene = (env) => {
  const nav = q('.nav');
  const rail = q('[data-rail]');
  const fill = q('[data-rail-fill]');
  const label = q('[data-rail-label]');
  const cleanups: (() => void)[] = [];

  /* ---- Progress rail ---- */

  const axis = env.compact ? 'scaleX' : 'scaleY';
  gsap.fromTo(fill, { [axis]: 0 }, { [axis]: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: true } });

  qa('[data-chapter]').forEach((section, i) => {
    ScrollTrigger.create({
      trigger: section,
      start: 'top center',
      end: 'bottom center',
      onToggle: (self) => {
        if (self.isActive && label) label.textContent = `${pad(i + 1)} · ${section.dataset.chapter ?? ''}`;
      },
    });
  });

  /* ---- Context: light chrome over the paper chapter ---- */

  const lab = q('.lab');
  // Measured from layout (offsetTop) so scroll-linked effects on the sheet never skew the switch point.
  const overLab = (line: () => number, target: Element, className: string) =>
    lab &&
    ScrollTrigger.create({
      start: () => lab.offsetTop - line(),
      end: () => lab.offsetTop + lab.offsetHeight - line(),
      toggleClass: { targets: target, className },
    });
  if (nav) overLab(() => 44, nav, 'nav--light');
  if (rail) overLab(() => (env.compact ? 0 : window.innerHeight / 2), rail, 'rail--light');

  /* ---- Navigation steps aside while reading, returns on any upward intent ---- */

  if (nav) {
    const shift = gsap.quickTo(nav, 'yPercent', { duration: 0.6, ease: 'power3.out' });
    ScrollTrigger.create({
      start: () => window.innerHeight * 0.8,
      end: 'max',
      onUpdate: (self) => {
        if (!nav.classList.contains('is-open')) shift(self.direction === 1 ? -180 : 0);
      },
      onLeaveBack: () => shift(0),
    });
    const reveal = () => shift(0);
    nav.addEventListener('focusin', reveal);
    cleanups.push(() => nav.removeEventListener('focusin', reveal));
  }

  /* ---- Magnetic primary controls (mouse/trackpad only) ---- */

  if (env.finePointer) {
    qa('.btn, .nav__cta').forEach((el) => {
      const toX = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
      const toY = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
      const onMove = (event: PointerEvent) => {
        const r = el.getBoundingClientRect();
        toX((event.clientX - (r.left + r.width / 2)) * 0.25);
        toY((event.clientY - (r.top + r.height / 2)) * 0.35);
      };
      const onLeave = () => {
        toX(0);
        toY(0);
      };
      el.addEventListener('pointermove', onMove);
      el.addEventListener('pointerleave', onLeave);
      cleanups.push(() => {
        el.removeEventListener('pointermove', onMove);
        el.removeEventListener('pointerleave', onLeave);
      });
    });
  }

  return () => cleanups.forEach((fn) => fn());
};

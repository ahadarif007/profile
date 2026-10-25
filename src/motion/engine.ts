import { gsap } from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin, MotionPathPlugin);
// Shared intro timelines target part types that some diagrams don't have; empty selections are expected.
gsap.config({ nullTargetWarn: false });

export interface MotionEnv {
  /** Viewport ≥ 961px. */
  desktop: boolean;
  /** Wide and tall enough for the horizontal project theatre. */
  wide: boolean;
  /** Phone layout (≤ 760px). */
  compact: boolean;
  /** Mouse or trackpad: enables smooth wheel scrolling and pointer-reactive depth. */
  finePointer: boolean;
  lenis: Lenis | null;
  /** Records animations created later (in callbacks) so they are reverted with the scene. */
  later: (fn: () => void) => void;
}

/** A scene builds its animations inside the active GSAP context and returns cleanup for anything else. */
export type Scene = (env: MotionEnv) => void | (() => void);

const QUERIES = {
  reduce: '(prefers-reduced-motion: reduce)',
  desktop: '(min-width: 961px)',
  wide: '(min-width: 1100px) and (min-height: 700px)',
  compact: '(max-width: 760px)',
  finePointer: '(hover: hover) and (pointer: fine)',
};

const NAV_OFFSET = 72;

function createLenis(): { lenis: Lenis; destroy: () => void } {
  const lenis = new Lenis({ autoRaf: false, lerp: 0.11, wheelMultiplier: 0.95 });
  const raf = (time: number) => lenis.raf(time * 1000);

  // One loop, one scroll controller: Lenis is driven by GSAP's ticker and feeds ScrollTrigger.
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);

  return {
    lenis,
    destroy: () => {
      gsap.ticker.remove(raf);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
    },
  };
}

/**
 * In-page links glide (through Lenis when it is running, natively otherwise),
 * then hand focus to the target for keyboard and screen-reader users. Done in
 * script rather than CSS scroll-behavior so reload scroll restoration stays instant.
 */
function smoothAnchors(lenis: Lenis | null): () => void {
  const onClick = (event: MouseEvent) => {
    const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
    if (!link || link.classList.contains('skip')) return;
    const id = link.hash.slice(1);
    const target = id ? document.getElementById(id) : null;
    if (!target) return;
    event.preventDefault();
    const focus = () => {
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    };
    const top = id === 'boot' ? 0 : target.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;
    if (lenis) lenis.scrollTo(top, { duration: 1.4, onComplete: focus });
    else {
      window.scrollTo({ top, behavior: 'smooth' });
      focus();
    }
    history.replaceState(null, '', `#${id}`);
  };
  document.addEventListener('click', onClick);
  return () => document.removeEventListener('click', onClick);
}

/**
 * Central motion setup. Scenes are (re)built whenever a media condition flips
 * and fully reverted before that, so resize and preference changes never leak
 * tweens, triggers, pins or listeners. Reduced motion gets the static page.
 */
export function startMotion(scenes: Scene[]): () => void {
  const root = document.documentElement;
  const mm = gsap.matchMedia();

  ScrollTrigger.config({ ignoreMobileResize: true });

  mm.add(QUERIES, (context) => {
    const c = context.conditions as Record<keyof typeof QUERIES, boolean>;
    if (c.reduce) return;

    root.classList.add('motion-on');
    const smooth = c.finePointer ? createLenis() : null;
    const anchors = smoothAnchors(smooth?.lenis ?? null);
    const env: MotionEnv = {
      desktop: c.desktop,
      wide: c.wide,
      compact: c.compact,
      finePointer: c.finePointer,
      lenis: smooth?.lenis ?? null,
      later: (fn) => context.add(fn),
    };

    // Scenes are built top to bottom so pin spacing is measured in document order.
    const cleanups = scenes.map((scene) => scene(env)).filter((fn): fn is () => void => typeof fn === 'function');

    return () => {
      cleanups.forEach((fn) => fn());
      anchors();
      smooth?.destroy();
      root.classList.remove('motion-on');
    };
  });

  // Webfonts change line lengths and section heights; measure again once they are in.
  document.fonts.ready.then(() => ScrollTrigger.refresh());

  return () => mm.revert();
}

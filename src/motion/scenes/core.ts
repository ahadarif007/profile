import { gsap } from 'gsap';
import type { CoreStage } from '../../gl/stage';
import type { Scene } from '../engine';
import { q } from '../primitives';

let loading: Promise<CoreStage | null> | null = null;

/** Loads Three.js on demand and builds the stage once; later scene runs reuse it. */
function loadStage(compact: boolean): Promise<CoreStage | null> {
  loading ??= import('../../gl/stage')
    .then(({ CoreStage, pickTier }) => {
      const canvas = document.createElement('canvas');
      canvas.className = 'gl-stage';
      canvas.setAttribute('aria-hidden', 'true');
      document.querySelector('.atmos')?.after(canvas);
      try {
        return new CoreStage(canvas, pickTier(compact));
      } catch {
        // No WebGL: the SVG poster simply stays.
        canvas.remove();
        return null;
      }
    })
    .catch(() => null);
  return loading;
}

const saveData = () => (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;

/** Waits for a quiet moment after first paint (Safari has no requestIdleCallback). */
const whenIdle = (fn: () => void): void => {
  if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(fn, { timeout: 1200 });
  else setTimeout(fn, 200);
};

/**
 * The WebGL core. It takes over from the SVG poster once Three.js has loaded,
 * sits inside the hero's instrument ring, comes forward and breaks apart
 * through the manifesto, disappears for the content-heavy chapters, then
 * reassembles at the end of the contact beam and shrinks to a point of light.
 */
export const core: Scene = (env) => {
  if (saveData()) return;

  const root = document.documentElement;
  const hero = q('.hero');
  const manifesto = q('.manifesto');
  const contact = q('.contact');
  const poster = q('.core-svg');
  const beam = q('.contact__beam');
  let alive = true;
  let stage: CoreStage | null = null;

  const onMove = (event: PointerEvent) =>
    stage?.setPointer(event.clientX / window.innerWidth - 0.5, event.clientY / window.innerHeight - 0.5);

  const stop = () => {
    if (stage) gsap.ticker.remove(stage.frame);
    window.removeEventListener('pointermove', onMove);
    root.classList.remove('has-gl');
  };

  const begin = (s: CoreStage) => {
    stage = s;
    const channels = s.channels;

    // While in the hero, the core sits exactly where the poster's shell is drawn.
    s.anchor('hero', () => {
      if (!poster) return null;
      const r = poster.getBoundingClientRect();
      return {
        x: (r.left + r.width / 2) / window.innerWidth,
        y: (r.top + r.height / 2) / window.innerHeight,
        size: (r.width * 0.6) / window.innerHeight,
        // On phones the core sits behind the headline, so it stays dimmer (matches the poster's CSS).
        alpha: env.compact ? 0.55 : 1,
      };
    });
    // At the end, it hangs from the bottom of the contact beam.
    s.anchor('contact', () => {
      if (!beam) return null;
      const r = beam.getBoundingClientRect();
      return { x: (r.left + r.width / 2) / window.innerWidth, y: r.bottom / window.innerHeight, size: env.compact ? 0.2 : 0.28 };
    });
    s.onContextLost(stop);

    root.classList.add('has-gl');
    gsap.ticker.add(s.frame);
    if (env.finePointer) window.addEventListener('pointermove', onMove, { passive: true });

    gsap.fromTo(channels, { assemble: 0 }, { assemble: 1, duration: 2.4, ease: 'expo.out' });

    const scrub = env.finePointer ? true : 0.4;
    const drive = (key: keyof typeof channels, trigger: Element | null, start: string, end: string) =>
      gsap.fromTo(channels, { [key]: 0 }, { [key]: 1, ease: 'none', scrollTrigger: { trigger, start, end, scrub } });

    drive('heroOut', hero, 'top top', 'bottom top');
    drive('dive', manifesto, 'top top', 'bottom top');
    drive('land', contact, 'top bottom', 'top 25%');
    drive('collapse', contact, 'top 25%', 'top -40%');
  };

  whenIdle(() => {
    loadStage(env.compact).then((s) => {
      if (alive && s) env.later(() => begin(s));
    });
  });

  return () => {
    alive = false;
    stop();
  };
};

import { gsap } from 'gsap';
import { buddy as copy } from '../content/buddy';
import type { AvatarStage } from './avatar-stage';

const HIDDEN_KEY = 'buddy-hidden';
const SLEEP_AFTER_MS = 25000;
/** Anything readable; when one of these is behind the avatar, it ducks down. */
const TEXT = 'p, a, li, h1, h2, h3, h4, figcaption, button, dt, dd, blockquote, .label';

type Variant = 'model' | 'sprite';

/** Each page load picks one of the two avatars at random. In development, ?avatar=2d or ?avatar=3d forces one. */
const pickVariant = (): Variant => {
  const forced = import.meta.env.DEV ? new URLSearchParams(window.location.search).get('avatar') : null;
  if (forced === '2d') return 'sprite';
  if (forced === '3d') return 'model';
  return Math.random() < 0.5 ? 'sprite' : 'model';
};

const saveData = () => (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;

const readHidden = (): boolean => {
  try {
    return sessionStorage.getItem(HIDDEN_KEY) === '1';
  } catch {
    return false;
  }
};

const writeHidden = () => {
  try {
    sessionStorage.setItem(HIDDEN_KEY, '1');
  } catch {
    // Private mode or blocked storage: it just comes back on the next load.
  }
};

/**
 * The avatar in the corner. With motion it is, picked at random per page load,
 * either a small 3D toon character (Three.js, loaded after first paint) or
 * the drawn 2D one (buddy-sprite.ts). Either looks at the pointer, blinks,
 * leans when you scroll, waves when clicked and dozes off when left alone.
 * Without WebGL the 3D pick falls back to the 2D one. With reduced motion
 * or Save-Data it is a still portrait that
 * still answers clicks. Without JavaScript it is not shown at all.
 */
export function initBuddy(): void {
  const el = document.querySelector<HTMLElement>('[data-buddy]');
  const hit = el?.querySelector<HTMLButtonElement>('[data-buddy-hit]');
  const say = el?.querySelector<HTMLElement>('[data-buddy-say]');
  const close = el?.querySelector<HTMLButtonElement>('[data-buddy-close]');
  const still = el?.querySelector<HTMLImageElement>('[data-buddy-still]');
  if (!el || !hit || !say || !close || !still || readHidden()) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  let stage: AvatarStage | null = null;
  let canvas: HTMLCanvasElement | null = null;
  let loading = false;
  let line = 0;
  let sayTimer = 0;
  let lastInput = performance.now();
  let asleep = false;
  let lastScroll = { y: window.scrollY, t: performance.now() };
  let glanceTimer = 0;
  let closed = false;

  still.src = `${import.meta.env.BASE_URL}avatar.webp`;

  /** `rise` brings it fully up while it talks, even if it is ducking. */
  const speak = (text: string, rise = false) => {
    say.textContent = text;
    el.classList.add('is-saying');
    el.classList.toggle('is-up', rise);
    stage?.talk(Math.min(2.4, 0.4 + text.length * 0.045));
    window.clearTimeout(sayTimer);
    sayTimer = window.setTimeout(() => el.classList.remove('is-saying', 'is-up'), 2600 + text.length * 45);
  };

  // Ducks down (only the top of the head peeks out) while visible text sits behind it.
  const main = document.querySelector('main');
  const range = document.createRange();
  const covering = (): boolean => {
    const r = el.getBoundingClientRect();
    const box = { left: r.left + r.width * 0.12, right: r.right - r.width * 0.12, top: r.top + r.height * 0.05, bottom: r.bottom };
    const meets = (b: DOMRect) => b.width > 0 && b.right > box.left && b.left < box.right && b.bottom > box.top && b.top < box.bottom;
    for (const node of main?.querySelectorAll(TEXT) ?? []) {
      if (!meets(node.getBoundingClientRect())) continue;
      if (node.checkVisibility?.({ opacityProperty: true, visibilityProperty: true }) === false) continue;
      const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
      for (let t = walker.nextNode(); t; t = walker.nextNode()) {
        if (!t.textContent?.trim()) continue;
        range.selectNodeContents(t);
        for (const b of range.getClientRects()) if (meets(b)) return true;
      }
    }
    return false;
  };
  /*
   * It only pops in once nothing readable is behind it (or after a screen of
   * scrolling), so on load it never sits on the hero's buttons. After that it
   * ducks and rises as the page moves under it.
   */
  let entered = false;
  let greeted = false;
  const enter = () => {
    if (el.hidden || closed) return;
    const covered = covering();
    if (!entered) {
      if (covered && window.scrollY < window.innerHeight) return;
      entered = true;
      el.classList.add('is-in');
      if (!greeted) {
        greeted = true;
        window.setTimeout(() => {
          stage?.wave();
          speak(copy.hello);
        }, 900);
      }
    }
    el.classList.toggle('is-peeking', covered);
  };
  let checkTimer = 0;
  const check = () => {
    if (checkTimer) return;
    checkTimer = window.setTimeout(() => {
      checkTimer = 0;
      enter();
    }, 150);
  };

  const show = () => {
    el.hidden = false;
    check();
  };

  const startStill = () => {
    if (closed) return;
    el.classList.add('buddy--still');
    show();
  };

  const chosen = pickVariant();

  const startLive = (kind: Variant = chosen) => {
    if (stage || loading) return;
    loading = true;
    const sprite = kind === 'sprite';
    const build: Promise<() => AvatarStage> = sprite
      ? import('./buddy-sprite').then(({ SpriteStage }) => () => new SpriteStage(hit))
      : import('../gl/buddy').then(({ BuddyStage }) => () => {
          canvas = document.createElement('canvas');
          canvas.className = 'buddy__canvas';
          canvas.setAttribute('aria-hidden', 'true');
          hit.prepend(canvas);
          canvas.addEventListener('webglcontextlost', stopLive);
          return new BuddyStage(canvas);
        });
    build
      .then(async (create) => {
        if (reduce.matches || closed) return;
        el.classList.remove('buddy--still');
        el.classList.toggle('buddy--sprite', sprite);
        // Unhidden (still invisible) first, so the stage can measure itself.
        el.hidden = false;
        let next: AvatarStage;
        try {
          next = create();
        } catch {
          // No WebGL: the drawn avatar needs none.
          canvas?.remove();
          canvas = null;
          if (sprite) startStill();
          else window.setTimeout(() => startLive('sprite'));
          return;
        }
        await next.ready;
        if (reduce.matches || closed) {
          next.dispose();
          return;
        }
        stage = next;
        gsap.ticker.add(next.frame);
        show();
      })
      .catch(() => startStill())
      .finally(() => {
        loading = false;
      });
  };

  function stopLive() {
    if (stage) {
      gsap.ticker.remove(stage.frame);
      stage.dispose();
      stage = null;
    }
    canvas?.remove();
    canvas = null;
  }

  const wake = () => {
    lastInput = performance.now();
    if (!asleep) return;
    asleep = false;
    el.classList.remove('is-asleep');
    stage?.setSleep(false);
    stage?.hop();
    speak(copy.wake);
  };

  const onPointer = (event: PointerEvent) => {
    wake();
    if (!stage) return;
    const r = hit.getBoundingClientRect();
    stage.setLook((event.clientX - (r.left + r.width / 2)) / 500, (event.clientY - (r.top + r.height * 0.35)) / 400);
  };

  const onScroll = () => {
    wake();
    check();
    const now = performance.now();
    const dt = Math.max(16, now - lastScroll.t);
    stage?.setLean(((window.scrollY - lastScroll.y) / dt) * 0.35);
    lastScroll = { y: window.scrollY, t: now };
  };

  const onClick = () => {
    wake();
    stage?.wave();
    stage?.hop();
    speak(copy.lines[line % copy.lines.length] ?? copy.hello, true);
    line++;
  };

  const tick = window.setInterval(() => {
    // Scroll-scrubbed reveals keep moving after scrolling stops.
    check();
    if (!stage || asleep || document.hidden) return;
    if (performance.now() - lastInput > SLEEP_AFTER_MS) {
      asleep = true;
      el.classList.add('is-asleep');
      el.classList.remove('is-saying');
      stage.setSleep(true);
    }
  }, 1000);

  // Touch screens have no pointer to follow, so it glances around now and then.
  const glance = () => {
    if (!fine.matches && stage && !asleep) stage.setLook(Math.random() * 1.4 - 0.7, Math.random() * 0.6 - 0.4);
    glanceTimer = window.setTimeout(glance, 2500 + Math.random() * 3000);
  };

  const contact = document.getElementById('contact');
  const seen = contact
    ? new IntersectionObserver(
        (entries) => {
          if (!entries.some((e) => e.isIntersecting)) return;
          seen?.disconnect();
          wake();
          stage?.wave();
          speak(copy.contact);
        },
        { threshold: 0.35 },
      )
    : null;

  const onReduce = () => {
    if (reduce.matches) {
      stopLive();
      startStill();
    } else if (!saveData()) startLive();
  };

  const onResize = () => {
    stage?.resize();
    check();
  };

  close.addEventListener('click', () => {
    closed = true;
    writeHidden();
    el.hidden = true;
    stopLive();
    window.clearInterval(tick);
    window.clearTimeout(glanceTimer);
    window.clearTimeout(sayTimer);
    window.clearTimeout(checkTimer);
    seen?.disconnect();
    window.removeEventListener('pointermove', onPointer);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('keydown', wake);
    window.removeEventListener('resize', onResize);
    reduce.removeEventListener('change', onReduce);
  });
  hit.addEventListener('click', onClick);
  hit.addEventListener('pointerenter', () => stage?.setHover(true));
  hit.addEventListener('pointerleave', () => stage?.setHover(false));
  window.addEventListener('pointermove', onPointer, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('keydown', wake);
  window.addEventListener('resize', onResize);
  reduce.addEventListener('change', onReduce);
  if (contact) seen?.observe(contact);
  glance();

  if (reduce.matches || saveData()) {
    startStill();
    return;
  }
  // After the boot sequence and the first paint, so it never competes with the hero.
  const later = () => window.setTimeout(() => startLive(), 1800);
  if (document.readyState === 'complete') later();
  else window.addEventListener('load', later, { once: true });
}

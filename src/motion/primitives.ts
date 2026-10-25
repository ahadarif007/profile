import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

/** Shared easing vocabulary so every scene moves with the same physics. */
export const EASE = {
  /** Fast attack, long settle: arrivals. */
  arrive: 'expo.out',
  /** Heavier, slower settle: editorial passages. */
  settle: 'power4.out',
  /** Symmetric: wipes and transitions between states. */
  wipe: 'power3.inOut',
};

export const q = <T extends Element = HTMLElement>(selector: string, root: ParentNode = document) =>
  root.querySelector<T>(selector);

export const qa = <T extends Element = HTMLElement>(selector: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(selector));

/** Plays forward on entry and rewinds when scrolled back above the start, so reverse scrolling stays coherent. */
export function onEnter(trigger: Element, animation: gsap.core.Animation, start = 'top 80%'): ScrollTrigger {
  return ScrollTrigger.create({ trigger, start, animation, toggleActions: 'play none none reverse' });
}

/**
 * Masked line reveal. SplitText re-splits on resize/font load and rebuilds the
 * tween, so lines never break differently from what is animated.
 */
export function revealLines(
  el: Element,
  { start = 'top 82%', duration = 1.2, stagger = 0.1, ease = EASE.arrive, delay = 0 } = {},
): SplitText {
  return SplitText.create(el, {
    type: 'lines',
    mask: 'lines',
    autoSplit: true,
    onSplit: (self) =>
      gsap.from(self.lines, {
        yPercent: 110,
        duration,
        stagger,
        ease,
        delay,
        scrollTrigger: { trigger: el, start, toggleActions: 'play none none reverse' },
      }),
  });
}

/**
 * Counts a number up from zero, preserving prefix, suffix and decimal places
 * ("99.04%", "10"). Returns a restore function that puts the real text back.
 */
export function countUp(el: HTMLElement, { duration = 1.6, start = 'top 85%' } = {}): () => void {
  const text = el.textContent ?? '';
  const match = /^(\D*)([\d.]+)(.*)$/.exec(text.trim());
  if (!match) return () => {};
  const [, prefix = '', digits = '0', suffix = ''] = match;
  const decimals = digits.split('.')[1]?.length ?? 0;
  const counter = { value: 0 };
  const render = () => {
    el.textContent = `${prefix}${counter.value.toFixed(decimals)}${suffix}`;
  };

  render();
  gsap.to(counter, {
    value: Number.parseFloat(digits),
    duration,
    ease: EASE.arrive,
    scrollTrigger: { trigger: el, start, toggleActions: 'play none none reverse' },
    onUpdate: render,
  });

  return () => {
    el.textContent = text;
  };
}

/** Scroll-linked drift: moves an element against the scroll to read as a separate depth layer. */
export function drift(el: Element, distance: number, trigger: Element = el, axis: 'x' | 'y' = 'y'): void {
  gsap.fromTo(
    el,
    { [axis]: distance },
    {
      [axis]: -distance,
      ease: 'none',
      scrollTrigger: { trigger, start: 'top bottom', end: 'bottom top', scrub: true },
    },
  );
}

/** Animates a CSS custom property hairline (see `--draw` in motion.css). */
export function drawLine(el: Element, vars: gsap.TweenVars = {}): gsap.core.Tween {
  return gsap.fromTo(el, { '--draw': 0 }, { '--draw': 1, ease: EASE.wipe, duration: 1.2, ...vars });
}

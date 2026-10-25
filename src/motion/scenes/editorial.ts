import { gsap } from 'gsap';
import type { Scene } from '../engine';
import { drawLine, EASE, onEnter, q, qa, revealLines } from '../primitives';

/** Scene 06: Technical arsenal. A quick, staccato rhythm, like a spec sheet being printed. */
export const arsenal: Scene = () => {
  const section = q('.arsenal');
  if (!section) return;

  const title = q('.arsenal__title', section);
  if (title) revealLines(title, { start: 'top 85%' });

  qa('.kit', section).forEach((kit) => {
    onEnter(
      kit,
      gsap
        .timeline({ paused: true })
        .fromTo(q('.kit__name', kit), { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: EASE.wipe })
        .from(qa('.kit__items li', kit), { opacity: 0, yPercent: 60, duration: 0.5, stagger: 0.035, ease: 'back.out(1.6)' }, 0.15),
      'top 88%',
    );
  });
};

/**
 * Scene 07: Principles. The slowest movement on the page. Long settles, a
 * hairline that takes its time, and titles that drift a little against the
 * scroll so each statement gets a moment of its own.
 */
export const principles: Scene = () => {
  qa('.principle').forEach((item) => {
    const title = q('.principle__title', item);
    if (title) {
      revealLines(title, { start: 'top 80%', duration: 1.6, stagger: 0.14, ease: EASE.settle });
      gsap.fromTo(title, { x: '3vw' }, { x: '-1vw', ease: 'none', scrollTrigger: { trigger: item, start: 'top bottom', end: 'bottom top', scrub: true } });
    }
    onEnter(
      item,
      gsap
        .timeline({ paused: true, defaults: { ease: EASE.settle } })
        .add(drawLine(item, { duration: 1.8 }), 0)
        .from(q('.principle__n', item), { opacity: 0, duration: 1 }, 0.2)
        .from(q('.principle__body', item), { opacity: 0, y: 16, duration: 1.4 }, 0.6),
      'top 80%',
    );
  });
};

/**
 * Scene 08: Final transmission. A beam descends from the previous chapter,
 * the headline rises into it, and the contact details resolve out of a blur
 * as if the signal is locking on.
 */
export const contact: Scene = () => {
  const section = q('.contact');
  if (!section) return;

  gsap.fromTo(
    q('.contact__beam', section),
    { scaleY: 0, transformOrigin: '50% 0%' },
    { scaleY: 1, ease: 'none', scrollTrigger: { trigger: section, start: 'top bottom', end: 'top 10%', scrub: true } },
  );

  const title = q('.contact__title', section);
  if (title) {
    onEnter(
      title,
      gsap
        .timeline({ paused: true })
        .from(Array.from(title.children), { opacity: 0, yPercent: 60, duration: 1.4, stagger: 0.12, ease: EASE.settle }),
      'top 78%',
    );
  }

  const channels = q('.contact__channels', section);
  if (channels) {
    onEnter(
      channels,
      gsap
        .timeline({ paused: true })
        .fromTo(
          q('.contact__email', channels),
          { opacity: 0, letterSpacing: '0.35em', filter: 'blur(8px)' },
          { opacity: 1, letterSpacing: '-0.03em', filter: 'blur(0px)', duration: 1.6, ease: EASE.arrive, clearProps: 'letterSpacing,filter' },
        )
        .from(qa('.contact__row .copy, .contact__links li, .contact__status', channels), { opacity: 0, y: 12, duration: 0.8, stagger: 0.08, ease: EASE.arrive }, 0.6),
      'top 88%',
    );
  }

  const ledger = q('.ledger', section);
  if (ledger) {
    onEnter(
      ledger,
      gsap
        .timeline({ paused: true, defaults: { ease: EASE.arrive } })
        .from(qa(':scope > section', ledger), { opacity: 0, y: 30, duration: 1.1, stagger: 0.15 })
        .from(qa('.ledger__list li', ledger), { opacity: 0, x: -12, duration: 0.6, stagger: 0.04 }, 0.3),
      'top 85%',
    );
  }
};

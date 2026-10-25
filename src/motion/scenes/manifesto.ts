import { gsap } from 'gsap';
import type { Scene } from '../engine';
import { drawLine, EASE, q, qa } from '../primitives';

/**
 * Scene 02: Manifesto. On desktop the statement holds the viewport while the
 * first line lights up word by word and the second rises out of its mask; the
 * pause gives the claim weight before the work arrives. Then the career line
 * draws itself and each role lands as the line reaches it.
 */
export const manifesto: Scene = (env) => {
  const section = q('.manifesto');
  if (!section) return;

  const block = q(':scope > .wrap', section);
  const title = q('.manifesto__title', section);
  const solid = qa('.manifesto__line--solid .w__i', section);
  const rising = qa('.manifesto__line--outline .w__i', section);
  const body = q('.manifesto__body', section);

  gsap
    .timeline({
      defaults: { ease: 'none' },
      scrollTrigger: env.desktop
        ? { trigger: block, start: 'center center', end: '+=130%', pin: true, scrub: true, anticipatePin: 1 }
        : { trigger: title, start: 'top 80%', end: 'bottom 35%', scrub: 0.4 },
    })
    .fromTo(solid, { opacity: 0.22 }, { opacity: 1, duration: 0.3, stagger: 0.12 })
    .fromTo(rising, { yPercent: 115 }, { yPercent: 0, duration: 0.5, stagger: 0.08, ease: EASE.arrive }, '>-0.1')
    .fromTo(body, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5 }, '>-0.15')
    .to({}, { duration: 0.35 });

  const list = q('.uptime__list', section);
  const items = qa('.uptime__item', section);
  const label = q('.uptime__title', section);
  if (!list) return;

  gsap
    .timeline({
      scrollTrigger: {
        trigger: list,
        start: 'top 88%',
        end: env.compact ? 'bottom 65%' : 'top 40%',
        scrub: 0.5,
      },
    })
    .fromTo(label, { opacity: 0 }, { opacity: 1, duration: 0.2 }, 0)
    .add(drawLine(list, { duration: 1, ease: 'none' }), 0)
    .fromTo(
      items,
      env.compact ? { opacity: 0, x: 24 } : { opacity: 0, y: 24 },
      { opacity: 1, x: 0, y: 0, duration: 0.25, stagger: 0.75 / Math.max(items.length, 1), ease: 'power2.out' },
      0.08,
    );
};

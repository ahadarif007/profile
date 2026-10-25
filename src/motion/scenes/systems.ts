import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Scene } from '../engine';
import { EASE, q, qa, revealLines } from '../primitives';

/** The path one write takes through the system and back out as a read. */
const ROUTE = ['client', 'gate', 'command', 'aggregate', 'events', 'projector', 'sql', 'query', 'client'];
/** How long the packet rests at each component, long enough to read the inspector. */
const HOLD = 2.6;
const BUILD_ORDER = ['client', 'gate', 'command', 'aggregate', 'events', 'projector', 'sql', 'nosql', 'query', 'observe'];

/**
 * Scene 05: Systems architecture. The graph assembles in data-flow order as
 * it scrolls in, then a single packet travels the write→read loop so the
 * diagram demonstrates the mechanism instead of just decorating it.
 */
export const systems: Scene = () => {
  const section = q('.systems');
  if (!section) return;

  const title = q('.systems__title', section);
  if (title) revealLines(title, { start: 'top 85%' });
  gsap.from(q('.systems__lede', section), {
    opacity: 0,
    y: 20,
    duration: 1.2,
    ease: EASE.arrive,
    scrollTrigger: { trigger: section, start: 'top 60%', toggleActions: 'play none none reverse' },
  });

  // Only the layout currently displayed (wide or tall) is animated.
  const svg = qa<SVGSVGElement>('.arch-svg', section).find((el) => el.getBoundingClientRect().width > 0);
  if (!svg) return;
  const edges = qa<SVGPathElement>('.arch-edge', svg);
  const nodes = qa<SVGGElement>('.arch-node', svg);
  const node = (id: string) => nodes.find((n) => n.dataset.node === id);

  const build = gsap.timeline({ scrollTrigger: { trigger: svg, start: 'top 85%', end: 'center 55%', scrub: 0.5 } });
  BUILD_ORDER.forEach((id, i) => {
    build.from(node(id) ?? [], { opacity: 0, scale: 0.6, transformOrigin: '50% 50%', duration: 0.4, ease: 'back.out(1.7)' }, i * 0.25);
    edges
      .filter((edge) => edge.dataset.from === id)
      .forEach((edge) => build.from(edge, { drawSVG: '0%', duration: 0.45, ease: 'none' }, i * 0.25 + 0.15));
  });

  /* ---- Data packet ---- */

  const packet = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  packet.setAttribute('class', 'arch-packet');
  packet.setAttribute('r', svg.classList.contains('arch-svg--tall') ? '6' : '5');
  svg.insertBefore(packet, q('.arch-nodes', svg));

  const pulse = (id: string) => {
    const rect = q('rect', node(id) ?? svg);
    if (rect) gsap.fromTo(rect, { strokeWidth: 3.5 }, { strokeWidth: 1.2, duration: 0.8, ease: 'power2.out', clearProps: 'strokeWidth' });
  };

  const loop = gsap.timeline({ repeat: -1, repeatDelay: 0.6, paused: true });
  loop.set(packet, { opacity: 1 });
  for (let i = 0; i < ROUTE.length - 1; i++) {
    const from = ROUTE[i];
    const to = ROUTE[i + 1] ?? '';
    const edge = edges.find((e) => e.dataset.from === from && e.dataset.to === to);
    if (!edge) continue;
    loop
      .to(packet, {
        motionPath: { path: edge, align: edge, alignOrigin: [0.5, 0.5] },
        duration: Math.max(0.35, edge.getTotalLength() / 320),
        ease: 'none',
      })
      .call(() => {
        pulse(to);
        // Lets the inspector narrate the trip while "follow the request" is on.
        svg.dispatchEvent(new CustomEvent('arch:goto', { bubbles: true, detail: to }));
      })
      .to(packet, { scale: 1.6, transformOrigin: '50% 50%', duration: HOLD / 2, yoyo: true, repeat: 1, ease: 'sine.inOut' });
  }
  loop.to(packet, { opacity: 0, duration: 0.3 });

  const board = q('[data-arch]', section);
  board?.dispatchEvent(new CustomEvent('arch:follow', { detail: true }));

  ScrollTrigger.create({
    trigger: svg,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => (self.isActive ? loop.play() : loop.pause()),
  });

  // Inspector content settles in when a component is selected.
  const inspector = q('[data-arch-panel]', section);
  // Only a reader's own pick gets the settle-in; tour steps swap quietly so the panel isn't always moving.
  const onSelect = (event: Event) => {
    if ((event as CustomEvent<{ source: string }>).detail?.source !== 'user') return;
    if (inspector) gsap.fromTo(Array.from(inspector.children), { opacity: 0.2, y: 8 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.04, ease: EASE.arrive, overwrite: true });
  };
  section.addEventListener('arch:select', onSelect);

  return () => {
    section.removeEventListener('arch:select', onSelect);
    loop.kill();
    packet.remove();
    board?.dispatchEvent(new CustomEvent('arch:follow', { detail: false }));
  };
};

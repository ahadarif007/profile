import { architectureEdges, architectureNodes } from '../content/systems';
import { escape } from './html';

type Point = [number, number];
type Layout = { width: number; height: number; font: number; nodes: Record<string, Point> };

/** Same graph, two compositions: a wide loop for desktop and a vertical spine for phones. */
const LAYOUTS: Record<'wide' | 'tall', Layout> = {
  wide: {
    width: 1000,
    height: 520,
    font: 15,
    nodes: {
      client: [90, 260],
      gate: [260, 100],
      command: [470, 100],
      aggregate: [680, 100],
      events: [880, 220],
      projector: [700, 330],
      sql: [480, 270],
      nosql: [480, 400],
      query: [270, 400],
      observe: [880, 450],
    },
  },
  tall: {
    width: 360,
    height: 900,
    font: 14,
    nodes: {
      client: [180, 40],
      gate: [180, 120],
      command: [180, 200],
      aggregate: [180, 280],
      events: [180, 370],
      projector: [180, 460],
      sql: [96, 550],
      nosql: [264, 550],
      query: [180, 640],
      observe: [180, 740],
    },
  },
};

function edgePath(a: Point, b: Point, layout: 'wide' | 'tall', from: string, to: string): string {
  const [x1, y1] = a;
  const [x2, y2] = b;
  if (layout === 'tall' && from === 'query' && to === 'client') {
    // Return path runs up the left margin so it doesn't cut through the spine.
    return `M${x1 - 70} ${y1}C12 ${y1} 12 ${y1} 12 ${(y1 + y2) / 2}S12 ${y2} ${x2 - 70} ${y2}`;
  }
  if (layout === 'tall' && to === 'observe') {
    const side = from === 'events' ? 352 : 340;
    return `M${x1 + 74} ${y1}C${side} ${y1} ${side} ${y2} ${x2 + 70} ${y2}`;
  }
  const dx = (x2 - x1) * 0.5;
  const dy = (y2 - y1) * 0.5;
  return Math.abs(x2 - x1) > Math.abs(y2 - y1)
    ? `M${x1} ${y1}C${x1 + dx} ${y1} ${x2 - dx} ${y2} ${x2} ${y2}`
    : `M${x1} ${y1}C${x1} ${y1 + dy} ${x2} ${y2 - dy} ${x2} ${y2}`;
}

export function architectureSvg(layout: 'wide' | 'tall'): string {
  const L = LAYOUTS[layout];
  const pos = (id: string): Point => L.nodes[id] ?? [0, 0];

  const edges = architectureEdges
    .map(([a, b]) => `<path class="arch-edge" data-from="${a}" data-to="${b}" d="${edgePath(pos(a), pos(b), layout, a, b)}"/>`)
    .join('');

  const nodes = architectureNodes
    .map((node) => {
      const [x, y] = pos(node.id);
      const w = Math.round(node.label.length * L.font * 0.56 + 30);
      const h = L.font * 2.6;
      return `<g class="arch-node arch-node--${node.kind}" data-node="${node.id}" role="button" tabindex="0" aria-label="${escape(node.label)}" aria-pressed="false" transform="translate(${x} ${y})">
        <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${h / 2}"/>
        <text y="${L.font * 0.35}" text-anchor="middle" style="font-size:${L.font}px">${escape(node.label)}</text>
      </g>`;
    })
    .join('');

  return `<svg class="arch-svg arch-svg--${layout}" viewBox="0 0 ${L.width} ${L.height}" role="group" aria-label="Interactive architecture diagram">
  <g class="arch-edges" aria-hidden="true">${edges}</g>
  <g class="arch-nodes">${nodes}</g>
</svg>`;
}

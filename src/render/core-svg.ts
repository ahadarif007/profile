import { icosphere, neuralCloud, rotate, type Lattice, type Vec3 } from '../core/geometry';

/**
 * Build-time SVG rendering of the signature core. It is the hero visual until
 * WebGL takes over, and the permanent fallback for reduced motion / no WebGL.
 */

const CAMERA = 1400;
const BANDS = 5;

const project = ([x, y, z]: Vec3): [number, number, number] => {
  const s = CAMERA / (CAMERA - z);
  return [x * s, y * s, z];
};

const f = (n: number) => n.toFixed(1);

/** Edges bucketed by depth into a few paths, so the poster stays light. */
function bandedEdges(lattice: Lattice, radius: number, rx: number, ry: number, className: string): string {
  const pts = lattice.vertices.map((v) => project(rotate(v, rx, ry)));
  const bands: string[][] = Array.from({ length: BANDS }, () => []);
  for (const [a, b] of lattice.edges) {
    const pa = pts[a]!;
    const pb = pts[b]!;
    const depth = ((pa[2] + pb[2]) / 2 / radius + 1) / 2; // 0 = back, 1 = front
    const band = Math.min(BANDS - 1, Math.floor(depth * BANDS));
    bands[band]!.push(`M${f(pa[0])} ${f(pa[1])}L${f(pb[0])} ${f(pb[1])}`);
  }
  return bands
    .map((d, i) => `<path class="${className} ${className}--d${i}" d="${d.join('')}"/>`)
    .join('');
}

function frontNodes(lattice: Lattice, radius: number, rx: number, ry: number, className: string, minDepth: number): string {
  return lattice.vertices
    .map((v) => project(rotate(v, rx, ry)))
    .filter(([, , z]) => z / radius > minDepth)
    .map(([x, y, z]) => `<circle class="${className}" cx="${f(x)}" cy="${f(y)}" r="${f(1.2 + 1.6 * ((z / radius + 1) / 2))}"/>`)
    .join('');
}

function instrumentRing(r: number): string {
  const ticks: string[] = [];
  for (let i = 0; i < 180; i++) {
    const a = (i / 180) * Math.PI * 2;
    const len = i % 15 === 0 ? 14 : i % 5 === 0 ? 7 : 3;
    const c = Math.cos(a);
    const s = Math.sin(a);
    ticks.push(`M${f(c * r)} ${f(s * r)}L${f(c * (r + len))} ${f(s * (r + len))}`);
  }
  return `<path class="core__ticks" d="${ticks.join('')}"/>`;
}

export function coreSvg(): string {
  const R = 300;
  const rx = -0.42;
  const ry = 0.62;
  const shell = icosphere(2, R);
  const cloud = neuralCloud(120, R * 0.62, 2, 11);

  return `<svg class="core-svg" viewBox="-500 -500 1000 1000" aria-hidden="true" focusable="false">
  <defs>
    <radialGradient id="core-halo">
      <stop offset="0" stop-color="var(--cyan)" stop-opacity=".22"/>
      <stop offset=".45" stop-color="var(--cyan)" stop-opacity=".06"/>
      <stop offset="1" stop-color="var(--cyan)" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="core-nucleus">
      <stop offset="0" stop-color="#fff" stop-opacity=".95"/>
      <stop offset=".25" stop-color="var(--cyan)" stop-opacity=".55"/>
      <stop offset="1" stop-color="var(--cyan)" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle r="480" fill="url(#core-halo)"/>
  ${instrumentRing(410)}
  <circle class="core__orbit" r="440"/>
  <g class="core__shell">${bandedEdges(shell, R, rx, ry, 'core__edge')}${frontNodes(shell, R, rx, ry, 'core__node', 0.15)}</g>
  <g class="core__mind">${bandedEdges(cloud, R * 0.62, rx + 0.3, ry - 0.5, 'core__synapse')}</g>
  <circle class="core__nucleus" r="150" fill="url(#core-nucleus)"/>
  <ellipse class="core__scan" rx="372" ry="96" transform="rotate(-18)"/>
  <ellipse class="core__ring" rx="356" ry="356" transform="rotate(64) scale(1 .22)"/>
</svg>`;
}

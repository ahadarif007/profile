/**
 * Geometry for the signature "neural core". Pure math, shared by the
 * build-time SVG poster and the WebGL scene so both describe the same object.
 */
export type Vec3 = [number, number, number];

export interface Lattice {
  vertices: Vec3[];
  edges: [number, number][];
}

const normalise = ([x, y, z]: Vec3, r = 1): Vec3 => {
  const len = Math.hypot(x, y, z) || 1;
  return [(x / len) * r, (y / len) * r, (z / len) * r];
};

/** Geodesic sphere: an icosahedron subdivided `levels` times, projected onto a sphere. */
export function icosphere(levels: number, radius = 1): Lattice {
  const t = (1 + Math.sqrt(5)) / 2;
  const vertices: Vec3[] = (
    [
      [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
      [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
      [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1],
    ] as Vec3[]
  ).map((v) => normalise(v));

  let faces: [number, number, number][] = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
  ];

  for (let level = 0; level < levels; level++) {
    const cache = new Map<string, number>();
    const midpoint = (a: number, b: number): number => {
      const key = a < b ? `${a}:${b}` : `${b}:${a}`;
      const hit = cache.get(key);
      if (hit !== undefined) return hit;
      const va = vertices[a]!;
      const vb = vertices[b]!;
      vertices.push(normalise([(va[0] + vb[0]) / 2, (va[1] + vb[1]) / 2, (va[2] + vb[2]) / 2]));
      cache.set(key, vertices.length - 1);
      return vertices.length - 1;
    };
    faces = faces.flatMap(([a, b, c]) => {
      const ab = midpoint(a, b);
      const bc = midpoint(b, c);
      const ca = midpoint(c, a);
      return [
        [a, ab, ca],
        [b, bc, ab],
        [c, ca, bc],
        [ab, bc, ca],
      ] as [number, number, number][];
    });
  }

  const seen = new Set<string>();
  const edges: [number, number][] = [];
  for (const [a, b, c] of faces) {
    for (const [p, q] of [[a, b], [b, c], [c, a]] as [number, number][]) {
      const key = p < q ? `${p}:${q}` : `${q}:${p}`;
      if (!seen.has(key)) {
        seen.add(key);
        edges.push([p, q]);
      }
    }
  }

  return { vertices: vertices.map((v) => normalise(v, radius)), edges };
}

/** Deterministic PRNG so the build-time poster and the live scene match exactly. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Inner "neural" cloud: points on a jittered Fibonacci sphere, each linked to
 * its nearest neighbours. The thinking part inside the geodesic shell.
 */
export function neuralCloud(count: number, radius: number, links = 2, seed = 7): Lattice {
  const rand = mulberry32(seed);
  const golden = Math.PI * (3 - Math.sqrt(5));
  const vertices: Vec3[] = [];
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    const depth = radius * (0.35 + 0.65 * Math.cbrt(rand()));
    vertices.push([Math.cos(theta) * r * depth, y * depth, Math.sin(theta) * r * depth]);
  }

  const seen = new Set<string>();
  const edges: [number, number][] = [];
  vertices.forEach((v, i) => {
    const nearest = vertices
      .map((u, j) => ({ j, d: Math.hypot(u[0] - v[0], u[1] - v[1], u[2] - v[2]) }))
      .filter(({ j }) => j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, links);
    for (const { j } of nearest) {
      const key = i < j ? `${i}:${j}` : `${j}:${i}`;
      if (!seen.has(key)) {
        seen.add(key);
        edges.push([i, j]);
      }
    }
  });
  return { vertices, edges };
}

export function rotate([x, y, z]: Vec3, rx: number, ry: number): Vec3 {
  const cy = Math.cos(ry);
  const sy = Math.sin(ry);
  const x1 = x * cy + z * sy;
  const z1 = -x * sy + z * cy;
  const cx = Math.cos(rx);
  const sx = Math.sin(rx);
  return [x1, y * cx - z1 * sx, y * sx + z1 * cx];
}

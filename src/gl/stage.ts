import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  LineSegments,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  Scene,
  ShaderMaterial,
  Vector3,
  WebGLRenderer,
  type Material,
} from 'three';
import { icosphere, mulberry32, neuralCloud, type Lattice, type Vec3 } from '../core/geometry';

export type Tier = 'high' | 'low';

/**
 * Scroll channels written by the choreography (each 0..1). The stage turns
 * them into position, size and look, so no two tweens ever fight over the
 * same property.
 */
export interface Channels {
  /** Opening assembly after the stage loads. */
  assemble: number;
  /** Hero scrolling away: the core leaves its frame and comes forward. */
  heroOut: number;
  /** Manifesto: the camera moves into the core while it comes apart. */
  dive: number;
  /** Contact: the core reassembles at the end of the beam. */
  land: number;
  /** Contact: the core collapses into a point of light. */
  collapse: number;
}

/** Viewport fractions; `alpha` lets an anchor dim the core while it holds it. */
type ScreenBox = { x: number; y: number; size: number; alpha?: number };
type AnchorReader = () => ScreenBox | null;

const FOV = 35;
const CAMERA_Z = 10;
const VIEW_HEIGHT = 2 * Math.tan((FOV * Math.PI) / 360) * CAMERA_Z;

const CYAN = new Color('#39e6ff');
const MAGENTA = new Color('#ff3dae');
const ICE = new Color('#d8fbff');

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/* ---------- Shaders ---------- */

const DISPLACE = /* glsl */ `
  uniform float uTime;
  uniform float uExplode;
  attribute vec3 aDir;
  attribute float aRand;
  varying float vDepth;
  varying float vScan;
  uniform vec3 uScanAxis;
  uniform float uScanPos;

  vec4 placeVertex(vec3 p) {
    // Each piece flies out along its own direction and swirls a little as it goes.
    float spread = uExplode * (0.45 + aRand * 2.6);
    vec3 q = p + aDir * spread;
    float ang = uExplode * (aRand - 0.5) * 1.8;
    float c = cos(ang);
    float s = sin(ang);
    q.xz = mat2(c, -s, s, c) * q.xz;
    q += aDir * sin(uTime * 0.9 + aRand * 6.2831) * 0.012;

    vec4 mv = modelViewMatrix * vec4(q, 1.0);
    vec4 centre = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    float scale = length(modelMatrix[0].xyz);
    vDepth = clamp(0.5 - (mv.z - centre.z) / (2.0 * scale), 0.0, 1.0);
    vScan = smoothstep(0.16, 0.0, abs(dot(normalize(p + 1e-5), uScanAxis) - uScanPos));
    return mv;
  }
`;

const LINE_VERT = /* glsl */ `
  ${DISPLACE}
  void main() {
    gl_Position = projectionMatrix * placeVertex(position);
  }
`;

const POINT_VERT = /* glsl */ `
  ${DISPLACE}
  uniform float uSize;
  uniform float uPixelRatio;
  void main() {
    vec4 mv = placeVertex(position);
    float scale = length(modelMatrix[0].xyz);
    gl_PointSize = uSize * uPixelRatio * (1.0 - 0.55 * vDepth) * clamp(scale, 0.35, 2.5);
    gl_Position = projectionMatrix * mv;
  }
`;

const LIGHT_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uScanColor;
  uniform float uFront;
  uniform float uBack;
  uniform float uOpacity;
  uniform float uRound;
  uniform float uLift;
  varying float vDepth;
  varying float vScan;
  void main() {
    float shape = 1.0;
    if (uRound > 0.5) {
      float d = length(gl_PointCoord - 0.5);
      shape = smoothstep(0.5, 0.05, d);
    }
    // uLift brightens the far side once the camera is close enough to be looking at it.
    float back = mix(uBack, uFront * 0.7, uLift);
    float a = (mix(uFront, back, vDepth) + vScan * 0.55) * shape * uOpacity;
    gl_FragColor = vec4(mix(uColor, uScanColor, vScan), a);
  }
`;

const NUCLEUS_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const NUCLEUS_FRAG = /* glsl */ `
  uniform float uGlow;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float halo = pow(max(0.0, 1.0 - d), 3.0) * 0.55;
    float core = pow(max(0.0, 1.0 - d), 14.0);
    vec3 colour = mix(vec3(0.22, 0.9, 1.0), vec3(1.0), core);
    gl_FragColor = vec4(colour, (halo + core) * uGlow * uOpacity);
  }
`;

const DUST_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uScroll;
  uniform float uPixelRatio;
  attribute float aRand;
  varying float vFade;
  void main() {
    vec3 p = position;
    p.x += sin(uTime * 0.05 + aRand * 6.2831) * 0.4;
    // Nearer particles move further with scroll, which is what sells the depth.
    float near = (p.z + 6.0) / 10.0;
    p.y += uTime * 0.03 * (0.4 + aRand) + uScroll * (0.6 + near * 2.2);
    p.y = mod(p.y + 8.0, 16.0) - 8.0;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vFade = smoothstep(8.0, 4.0, abs(p.y)) * (0.35 + near * 0.65);
    gl_PointSize = uPixelRatio * (1.0 + near * 2.6);
    gl_Position = projectionMatrix * mv;
  }
`;

const DUST_FRAG = /* glsl */ `
  uniform float uOpacity;
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d) * vFade * uOpacity;
    gl_FragColor = vec4(0.75, 0.95, 1.0, a);
  }
`;

/* ---------- Geometry ---------- */

const unit = ([x, y, z]: Vec3): Vec3 => {
  const len = Math.hypot(x, y, z) || 1;
  return [x / len, y / len, z / len];
};

/** Edges as segments; both ends share a direction and random value so pieces fly apart intact. */
function edgeGeometry(lattice: Lattice, seed: number): BufferGeometry {
  const rand = mulberry32(seed);
  const position: number[] = [];
  const dir: number[] = [];
  const rnd: number[] = [];
  for (const [a, b] of lattice.edges) {
    const va = lattice.vertices[a]!;
    const vb = lattice.vertices[b]!;
    const d = unit([va[0] + vb[0], va[1] + vb[1], va[2] + vb[2]]);
    const r = rand();
    position.push(...va, ...vb);
    dir.push(...d, ...d);
    rnd.push(r, r);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(position, 3));
  geometry.setAttribute('aDir', new Float32BufferAttribute(dir, 3));
  geometry.setAttribute('aRand', new Float32BufferAttribute(rnd, 1));
  return geometry;
}

function nodeGeometry(lattice: Lattice, seed: number): BufferGeometry {
  const rand = mulberry32(seed);
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(lattice.vertices.flat(), 3));
  geometry.setAttribute('aDir', new Float32BufferAttribute(lattice.vertices.flatMap((v) => unit(v)), 3));
  geometry.setAttribute('aRand', new Float32BufferAttribute(lattice.vertices.map(() => rand()), 1));
  return geometry;
}

function dustGeometry(count: number): BufferGeometry {
  const rand = mulberry32(29);
  const position: number[] = [];
  const rnd: number[] = [];
  for (let i = 0; i < count; i++) {
    position.push((rand() - 0.5) * 24, (rand() - 0.5) * 16, -6 + rand() * 10);
    rnd.push(rand());
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(position, 3));
  geometry.setAttribute('aRand', new Float32BufferAttribute(rnd, 1));
  return geometry;
}

function lightMaterial(opts: { color: Color; front: number; back: number; round?: boolean; size?: number }): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uExplode: { value: 0 },
      uOpacity: { value: 1 },
      uColor: { value: opts.color },
      uScanColor: { value: MAGENTA },
      uScanAxis: { value: new Vector3(0, 1, 0) },
      uScanPos: { value: 0 },
      uFront: { value: opts.front },
      uBack: { value: opts.back },
      uRound: { value: opts.round ? 1 : 0 },
      uLift: { value: 0 },
      uSize: { value: opts.size ?? 3 },
      uPixelRatio: { value: 1 },
    },
    vertexShader: opts.round ? POINT_VERT : LINE_VERT,
    fragmentShader: LIGHT_FRAG,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
}

/* ---------- Stage ---------- */

/**
 * The signature core in WebGL: geodesic shell, outer lattice, the neural
 * cloud inside, a light nucleus and a field of dust. One fixed canvas behind
 * the page, rendered from GSAP's ticker and skipped entirely while invisible.
 */
export class CoreStage {
  readonly channels: Channels = { assemble: 0, heroOut: 0, dive: 0, land: 0, collapse: 0 };

  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(FOV, 1, 0.1, 100);
  private readonly root = new Group();
  private readonly spin = new Group();
  private readonly outer = new Group();
  private readonly materials: ShaderMaterial[] = [];
  private readonly geometries: BufferGeometry[] = [];
  private readonly nucleus: ShaderMaterial;
  private readonly dust: ShaderMaterial;
  private readonly dustPoints: Points;
  private readonly anchors = new Map<string, AnchorReader>();
  private readonly scanAxis = new Vector3();
  private pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  private time = 0;
  private dpr = 1;
  private blank = false;
  private samples: number[] = [];
  private onResize = () => this.resize();
  private onLost = (event: Event) => {
    event.preventDefault();
    this.lostHandler?.();
  };
  private lostHandler: (() => void) | null = null;

  constructor(
    readonly canvas: HTMLCanvasElement,
    private readonly tier: Tier,
  ) {
    this.renderer = new WebGLRenderer({ canvas, antialias: tier === 'high', alpha: true, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0x000000, 0);
    this.camera.position.z = CAMERA_Z;

    const shell = icosphere(2, 1);
    const lattice = icosphere(1, 1.42);
    const cloud = neuralCloud(tier === 'high' ? 160 : 110, 0.62, 2, 11);

    this.add(this.spin, new LineSegments(edgeGeometry(shell, 3), lightMaterial({ color: CYAN, front: 0.6, back: 0.06 })));
    this.add(this.spin, new Points(nodeGeometry(shell, 5), lightMaterial({ color: ICE, front: 0.8, back: 0.15, round: true, size: 4.5 })));
    this.add(this.spin, new LineSegments(edgeGeometry(cloud, 7), lightMaterial({ color: ICE, front: 0.6, back: 0.08 })));
    this.add(this.spin, new Points(nodeGeometry(cloud, 9), lightMaterial({ color: ICE, front: 0.9, back: 0.2, round: true, size: 3 })));
    this.add(this.outer, new LineSegments(edgeGeometry(lattice, 13), lightMaterial({ color: CYAN, front: 0.16, back: 0.02 })));

    this.nucleus = new ShaderMaterial({
      uniforms: { uGlow: { value: 1 }, uOpacity: { value: 1 } },
      vertexShader: NUCLEUS_VERT,
      fragmentShader: NUCLEUS_FRAG,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    const nucleusGeometry = new PlaneGeometry(1.3, 1.3);
    this.geometries.push(nucleusGeometry);
    this.root.add(new Mesh(nucleusGeometry, this.nucleus));

    this.dust = new ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uScroll: { value: 0 }, uOpacity: { value: 0.5 }, uPixelRatio: { value: 1 } },
      vertexShader: DUST_VERT,
      fragmentShader: DUST_FRAG,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    const dustGeo = dustGeometry(tier === 'high' ? 900 : 320);
    this.geometries.push(dustGeo);
    this.dustPoints = new Points(dustGeo, this.dust);

    // Start in the same orientation as the SVG poster so the handover is seamless.
    this.spin.rotation.set(0.42, 0.62, 0);
    this.root.add(this.spin, this.outer);
    this.scene.add(this.root, this.dustPoints);

    canvas.addEventListener('webglcontextlost', this.onLost);
    window.addEventListener('resize', this.onResize);
    this.resize();
  }

  private add(parent: Group, object: LineSegments | Points) {
    this.materials.push(object.material as ShaderMaterial);
    this.geometries.push(object.geometry);
    parent.add(object);
  }

  /** Screen-space element the core should sit in while that anchor's channel is active. */
  anchor(name: 'hero' | 'contact', read: AnchorReader): void {
    this.anchors.set(name, read);
  }

  setPointer(nx: number, ny: number): void {
    this.pointer.tx = nx;
    this.pointer.ty = ny;
  }

  onContextLost(handler: () => void): void {
    this.lostHandler = handler;
  }

  resize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, this.tier === 'high' ? 1.75 : 1.25);
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    for (const m of this.materials) m.uniforms.uPixelRatio!.value = this.dpr;
    this.dust.uniforms.uPixelRatio!.value = this.dpr;
  }

  /** Where the choreography wants the core this frame, in viewport fractions. */
  private target(): { box: ScreenBox; explode: number; opacity: number; spin: number; glow: number; lift: number } {
    const { assemble, heroOut, dive, land, collapse } = this.channels;

    // Free-floating centre stage: it grows as the camera moves in during the manifesto.
    let box: ScreenBox = { x: 0.5, y: 0.5 - dive * 0.04, size: mix(mix(0.7, 1.05, heroOut), 1.9, dive) };
    let explode = heroOut * 0.3 + dive * 0.85;
    let opacity = (1 - heroOut * 0.4) * (1 - smooth(0.62, 0.95, dive));
    const spin = 1 + dive * 1.6;
    let glow = 1 - dive * 0.6;
    let lift = smooth(0, 0.6, dive);

    const heroWeight = 1 - smooth(0.12, 0.9, heroOut);
    const hero = heroWeight > 0.001 ? this.anchors.get('hero')?.() : null;
    if (hero) {
      box = { x: mix(box.x, hero.x, heroWeight), y: mix(box.y, hero.y, heroWeight), size: mix(box.size, hero.size, heroWeight) };
      opacity *= mix(1, hero.alpha ?? 1, heroWeight);
    }

    if (land > 0.001) {
      const beam = this.anchors.get('contact')?.();
      if (beam) {
        const size = mix(beam.size, 0.035, smooth(0, 1, collapse));
        box = { x: mix(box.x, beam.x, land), y: mix(box.y, beam.y, land), size: mix(box.size, size, land) };
      }
      explode = mix(explode, 0, land);
      opacity = Math.max(opacity, land);
      glow = mix(glow, 1 + collapse * 1.6, land);
      lift = mix(lift, 0, land);
    }

    explode += (1 - assemble) * 1.6;
    opacity *= Math.sqrt(assemble);
    return { box, explode, opacity, spin, glow, lift };
  }

  /** One frame, driven by GSAP's ticker so the page has a single animation loop. */
  readonly frame = (_time: number, deltaMs: number): void => {
    const dt = Math.min(deltaMs / 1000, 0.05);
    this.time += dt;
    const t = this.target();

    if (t.opacity < 0.004) {
      // Nothing visible: clear once, then skip rendering until the core returns.
      if (!this.blank) {
        this.renderer.clear();
        this.blank = true;
      }
      return;
    }
    this.blank = false;
    this.adapt(deltaMs);

    const aspect = this.camera.aspect;
    this.root.position.set((t.box.x - 0.5) * VIEW_HEIGHT * aspect, -(t.box.y - 0.5) * VIEW_HEIGHT, 0);
    this.root.scale.setScalar(Math.max(0.0001, (t.box.size * VIEW_HEIGHT) / 2));

    this.pointer.x += (this.pointer.tx - this.pointer.x) * Math.min(1, dt * 3);
    this.pointer.y += (this.pointer.ty - this.pointer.y) * Math.min(1, dt * 3);
    this.spin.rotation.y += dt * 0.12 * t.spin;
    this.spin.rotation.x = 0.42 + this.pointer.y * 0.35;
    this.root.rotation.y = this.pointer.x * 0.45;
    this.outer.rotation.y -= dt * 0.05 * t.spin;
    this.outer.rotation.z += dt * 0.02;

    const scanAxis = this.scanAxis.set(Math.sin(this.time * 0.25), 0.45, Math.cos(this.time * 0.25)).normalize();
    const scanPos = Math.sin(this.time * 0.55) * 0.95;
    for (const m of this.materials) {
      const u = m.uniforms;
      u.uTime!.value = this.time;
      u.uExplode!.value = t.explode;
      u.uOpacity!.value = t.opacity;
      u.uLift!.value = t.lift;
      (u.uScanAxis!.value as Vector3).copy(scanAxis);
      u.uScanPos!.value = scanPos;
    }
    this.nucleus.uniforms.uGlow!.value = t.glow;
    // The light at the centre goes out as the core breaks apart, so it never sits on top of the manifesto.
    this.nucleus.uniforms.uOpacity!.value = t.opacity * (1 - Math.min(1, t.explode * 1.1));
    this.dust.uniforms.uTime!.value = this.time;
    this.dust.uniforms.uScroll!.value = window.scrollY * 0.0012;
    this.dust.uniforms.uOpacity!.value = 0.45 * Math.min(1, t.opacity * 1.5);

    this.renderer.render(this.scene, this.camera);
  };

  /** If the first second of rendering is slow, drop resolution and dust density once. */
  private adapt(deltaMs: number) {
    if (this.samples.length >= 60 || deltaMs > 250) return;
    this.samples.push(deltaMs);
    if (this.samples.length < 60) return;
    const average = this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
    if (average > 24 && this.dpr > 1) {
      this.dpr = 1;
      this.renderer.setPixelRatio(1);
      for (const m of this.materials) m.uniforms.uPixelRatio!.value = 1;
      this.dust.uniforms.uPixelRatio!.value = 1;
      const count = this.dustPoints.geometry.getAttribute('position').count;
      this.dustPoints.geometry.setDrawRange(0, Math.floor(count / 2));
    }
  }

  dispose(): void {
    window.removeEventListener('resize', this.onResize);
    this.canvas.removeEventListener('webglcontextlost', this.onLost);
    this.geometries.forEach((g) => g.dispose());
    [...this.materials, this.nucleus, this.dust].forEach((m: Material) => m.dispose());
    this.renderer.dispose();
    this.canvas.remove();
  }
}

/** Phones and low-core / low-memory devices get the lighter tier. */
export function pickTier(compact: boolean): Tier {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const lowPower = (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4;
  return compact || lowPower ? 'low' : 'high';
}

import {
  AmbientLight,
  BackSide,
  CanvasTexture,
  CapsuleGeometry,
  CircleGeometry,
  ConeGeometry,
  CylinderGeometry,
  DataTexture,
  DirectionalLight,
  ExtrudeGeometry,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshToonMaterial,
  NearestFilter,
  Path,
  PerspectiveCamera,
  PlaneGeometry,
  Quaternion,
  RedFormat,
  RepeatWrapping,
  Scene,
  Shape,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
  WebGLRenderer,
  type BufferGeometry,
  type Material,
  type Texture,
} from 'three';
import faceUrl from '../assets/avatar/face.webp';
import { FACE, type FacePart } from '../assets/avatar/atlas';
import { mulberry32 } from '../core/geometry';
import type { AvatarStage } from '../ui/avatar-stage';

/**
 * A small toon version of the owner, modelled on their illustrated portrait
 * and character sheet: curly dark hair, amber glasses, a blue checked shirt
 * with rolled sleeves, brown trousers. Built from simple shapes with stepped
 * shading and back-face outlines; the eyes, eyebrows and mouth are the drawn
 * ones from the sheet (src/assets/avatar/face.webp), swapped per expression.
 */

const COLORS = {
  hair: '#253040',
  skin: '#f7cfa8',
  skinShade: '#e8b590',
  blush: '#f09a8a',
  frame: '#b97f45',
  shirt: '#5c7f99',
  shirtDark: '#3d5a72',
  cuff: '#6f91aa',
  trousers: '#bb9066',
  shoes: '#604a39',
  ink: '#0b1018',
};

const OUTLINE = 1.045;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (current: number, target: number, rate: number, dt: number) => current + (target - current) * Math.min(1, dt * rate);
const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

/** Front surface of the (slightly squashed) head, so face parts sit on it. */
const HEAD = { x: 1, y: 0.94, z: 0.9 };
const faceZ = (x: number, y: number) => HEAD.z * Math.sqrt(Math.max(0, 1 - x * x - (y / HEAD.y) ** 2));

/** Front of the shirt at height y (the torso is a capsule squashed front to back). */
const TORSO = { y: -1.45, radius: 0.58, half: 0.15, depth: 0.8 };
const chestZ = (y: number) => {
  const dy = Math.max(0, Math.abs(y - TORSO.y) - TORSO.half);
  return Math.sqrt(Math.max(0, TORSO.radius ** 2 - dy ** 2)) * TORSO.depth;
};

function toonRamp(): DataTexture {
  const ramp = new DataTexture(new Uint8Array([120, 190, 255]), 3, 1, RedFormat);
  ramp.minFilter = NearestFilter;
  ramp.magFilter = NearestFilter;
  ramp.needsUpdate = true;
  return ramp;
}

/** The shirt's check: thin darker lines on mid blue, as in the character sheet. */
function plaid(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const g = canvas.getContext('2d');
  if (g) {
    g.fillStyle = COLORS.shirt;
    g.fillRect(0, 0, 64, 64);
    g.fillStyle = 'rgb(30 52 76 / 0.55)';
    for (const i of [0, 16, 32, 48]) {
      g.fillRect(i, 0, 2, 64);
      g.fillRect(0, i, 64, 2);
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(3, 2);
  return texture;
}

function roundedRect(w: number, h: number, r: number, target: Shape | Path): Shape | Path {
  const x = -w / 2;
  const y = -h / 2;
  target.moveTo(x + r, y);
  target.lineTo(x + w - r, y);
  target.quadraticCurveTo(x + w, y, x + w, y + r);
  target.lineTo(x + w, y + h - r);
  target.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  target.lineTo(x + r, y + h);
  target.quadraticCurveTo(x, y + h, x, y + h - r);
  target.lineTo(x, y + r);
  target.quadraticCurveTo(x, y, x + r, y);
  return target;
}

/** A thin bar from `a` to `b` (glasses arms). */
function bar(a: Vector3, b: Vector3, thickness: number, material: Material, geometries: BufferGeometry[]): Mesh {
  const geometry = new CapsuleGeometry(thickness, a.distanceTo(b), 2, 6);
  geometries.push(geometry);
  const mesh = new Mesh(geometry, material);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return mesh;
}

type Mouth = 'smile' | 'ah' | 'oh';

export class BuddyStage implements AvatarStage {
  readonly ready: Promise<void>;
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(26, 0.8, 0.1, 50);
  private readonly geometries: BufferGeometry[] = [];
  private readonly materials: Material[] = [];
  private readonly textures: Texture[] = [];
  private readonly ramp: DataTexture;
  private readonly ink: MeshBasicMaterial;
  private readonly decal: MeshBasicMaterial;

  private readonly root = new Group();
  private readonly torso: Group;
  private readonly headPivot = new Group();
  private readonly armWave = new Group();
  private readonly armRest = new Group();
  private readonly eyesOpen: Mesh[] = [];
  private readonly eyesShut: Mesh[] = [];
  private readonly brows: Mesh[] = [];
  private readonly mouths = new Map<Mouth, Mesh>();
  private readonly shadow: Mesh;

  private time = 0;
  private readonly look = { x: 0, y: 0, tx: 0, ty: 0 };
  private lean = 0;
  private leanTarget = 0;
  private happy = 0;
  private hovering = false;
  private sleep = 0;
  private sleeping = false;
  private blink = 0;
  private nextBlink = 2;
  private waveLeft = 0;
  private hopLeft = 0;
  private talkLeft = 0;
  private surpriseLeft = 0;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    this.renderer.setClearColor(0x000000, 0);
    this.ramp = toonRamp();
    this.textures.push(this.ramp);
    this.ink = this.basic(COLORS.ink, { side: BackSide });

    let loaded: () => void = () => {};
    this.ready = new Promise((resolve) => (loaded = resolve));
    const face = new TextureLoader().load(faceUrl, loaded, undefined, loaded);
    face.colorSpace = SRGBColorSpace;
    face.anisotropy = 4;
    this.textures.push(face);
    this.decal = this.basic('#ffffff', { map: face, transparent: true, depthWrite: false });

    this.camera.position.set(0, -0.55, 10.6);
    this.camera.lookAt(0, -0.62, 0);

    const key = new DirectionalLight('#ffffff', 2.6);
    key.position.set(-2.5, 3.5, 5);
    this.scene.add(new AmbientLight('#ffffff', 1.25), key, this.root);

    this.torso = this.buildBody();
    this.root.add(this.torso);
    this.headPivot.position.set(0, -0.82, 0);
    this.root.add(this.headPivot);
    const head = this.buildHead();
    head.position.y = 0.82;
    this.headPivot.add(head);

    this.shadow = new Mesh(this.track(new CircleGeometry(0.8, 32)), this.basic('#000000', { transparent: true, opacity: 0.32, depthWrite: false }));
    this.shadow.scale.set(1, 0.2, 1);
    this.shadow.position.set(0, -2.84, -0.6);
    this.scene.add(this.shadow);

    this.resize();
  }

  /* ---------- Building ---------- */

  private track<T extends BufferGeometry>(geometry: T): T {
    this.geometries.push(geometry);
    return geometry;
  }

  private toon(color: string, map?: Texture): MeshToonMaterial {
    const material = new MeshToonMaterial({ color: map ? '#ffffff' : color, gradientMap: this.ramp, map: map ?? null });
    this.materials.push(material);
    return material;
  }

  private basic(color: string, extra: Partial<ConstructorParameters<typeof MeshBasicMaterial>[0]> = {}): MeshBasicMaterial {
    const material = new MeshBasicMaterial({ color, ...extra });
    this.materials.push(material);
    return material;
  }

  /** A shaded part with an ink outline (an inflated copy showing only its back faces). */
  private part(geometry: BufferGeometry, material: Material, outline = OUTLINE): Mesh {
    const mesh = new Mesh(geometry, material);
    if (outline > 1) {
      const hull = new Mesh(geometry, this.ink);
      hull.scale.setScalar(outline);
      mesh.add(hull);
    }
    return mesh;
  }

  /** A flat piece of the drawn face, `width` wide, cut from the face atlas. */
  private drawn(name: FacePart, width: number): Mesh {
    const [x, y, w, h] = FACE.parts[name];
    const geometry = this.track(new PlaneGeometry(width, (width * h) / w));
    const uv = geometry.getAttribute('uv');
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(i, (x + uv.getX(i) * w) / FACE.sheetWidth, 1 - (y + (1 - uv.getY(i)) * h) / FACE.sheetHeight);
    }
    return new Mesh(geometry, this.decal);
  }

  /** Sits a flat face piece on the head surface, turned to follow its curve. */
  private onFace(mesh: Mesh, x: number, y: number, lift = 0.02): Mesh {
    mesh.position.set(x, y, faceZ(x, y) + lift);
    mesh.rotation.set(-Math.asin(clamp(y / HEAD.y, -1, 1)) * 0.7, Math.asin(clamp(x, -1, 1)) * 0.8, 0);
    return mesh;
  }

  private buildBody(): Group {
    const body = new Group();
    const shirt = this.toon(COLORS.shirt, plaid());
    const shirtPlain = this.toon(COLORS.shirt);
    const skin = this.toon(COLORS.skin);
    this.textures.push(shirt.map as Texture);

    const trunk = this.part(this.track(new CapsuleGeometry(TORSO.radius, TORSO.half * 2, 6, 20)), shirt);
    trunk.position.y = TORSO.y;
    trunk.scale.set(1, 1, TORSO.depth);
    body.add(trunk);

    const neck = this.part(this.track(new CapsuleGeometry(0.2, 0.2, 4, 12)), skin);
    neck.position.y = -0.9;
    body.add(neck);

    // Collar: a ring round the neck and two points falling onto the chest.
    const ring = this.part(this.track(new CylinderGeometry(0.34, 0.4, 0.14, 20, 1, true)), shirtPlain);
    ring.position.set(0, -0.98, 0.02);
    ring.rotation.x = -0.18;
    body.add(ring);
    const point = this.track(new ConeGeometry(0.14, 0.3, 3));
    for (const side of [-1, 1]) {
      const tip = this.part(point, shirtPlain);
      tip.position.set(side * 0.13, -1.1, chestZ(-1.1) - 0.06);
      tip.rotation.set(-0.45, 0, Math.PI + side * 0.45);
      tip.scale.set(1, 1, 0.35);
      body.add(tip);
    }

    const buttonGeo = this.track(new SphereGeometry(0.032, 8, 6));
    const buttonMat = this.toon(COLORS.shirtDark);
    for (const y of [-1.2, -1.45, -1.7, -1.95]) {
      const b = new Mesh(buttonGeo, buttonMat);
      b.position.set(0, y, chestZ(y) + 0.01);
      body.add(b);
    }
    // Chest pocket on his left (the viewer's right): just its top seam, as in the drawing.
    const pocket = new Mesh(this.track(new CapsuleGeometry(0.012, 0.16, 2, 6)), buttonMat);
    pocket.rotation.z = Math.PI / 2;
    pocket.position.set(0.27, -1.28, chestZ(-1.28) - 0.03);
    pocket.rotation.y = 0.45;
    body.add(pocket);

    // Rolled sleeves: shirt to the elbow, a lighter cuff, then forearm and hand.
    const sleeve = this.track(new CapsuleGeometry(0.16, 0.16, 4, 12));
    const cuff = this.track(new CylinderGeometry(0.175, 0.17, 0.1, 16));
    const forearm = this.track(new CapsuleGeometry(0.115, 0.16, 4, 12));
    const hand = this.track(new SphereGeometry(0.14, 14, 10));
    const cuffMat = this.toon(COLORS.cuff);
    for (const [pivot, side] of [[this.armWave, 1], [this.armRest, -1]] as const) {
      pivot.position.set(side * 0.55, -1.05, 0);
      const upper = this.part(sleeve, shirt);
      upper.position.y = -0.2;
      const band = this.part(cuff, cuffMat);
      band.position.y = -0.43;
      const lower = this.part(forearm, skin);
      lower.position.y = -0.58;
      const palm = this.part(hand, skin);
      palm.position.y = -0.76;
      pivot.add(upper, lower, band, palm);
      body.add(pivot);
    }

    // Brown trousers and dark shoes peeking out under the shirt.
    const trousers = this.toon(COLORS.trousers);
    const shoes = this.toon(COLORS.shoes);
    const leg = this.track(new CapsuleGeometry(0.19, 0.3, 4, 12));
    const shoe = this.track(new SphereGeometry(0.2, 16, 10));
    for (const side of [-1, 1]) {
      const l = this.part(leg, trousers);
      l.position.set(side * 0.24, -2.28, 0);
      const s = this.part(shoe, shoes);
      s.position.set(side * 0.25, -2.66, 0.07);
      s.scale.set(1, 0.6, 1.35);
      body.add(l, s);
    }
    return body;
  }

  private buildHead(): Group {
    const head = new Group();
    const skin = this.toon(COLORS.skin);
    const hairMat = this.toon(COLORS.hair);

    const skull = this.part(this.track(new SphereGeometry(1, 40, 28)), skin, 1.03);
    skull.scale.set(HEAD.x, HEAD.y, HEAD.z);
    head.add(skull);

    const earGeo = this.track(new SphereGeometry(0.17, 14, 10));
    for (const side of [-1, 1]) {
      const ear = this.part(earGeo, skin);
      ear.position.set(side * 0.96, -0.08, 0.02);
      ear.scale.set(0.6, 1, 0.8);
      head.add(ear);
    }

    head.add(this.buildHair(hairMat));
    this.buildFace(head);
    return head;
  }

  /** Curly hair: overlapping balls over the top, back and sides, with a fringe over the forehead. */
  private buildHair(material: Material): Group {
    const random = mulberry32(42);
    const curls: { p: Vector3; r: number }[] = [];
    const count = 150;
    for (let i = 0; i < count; i++) {
      // Even spread over a sphere (golden-angle spiral).
      const y = 1 - (2 * (i + 0.5)) / count;
      const ring = Math.sqrt(1 - y * y);
      const a = i * 2.399963;
      const d = new Vector3(Math.cos(a) * ring, y, Math.sin(a) * ring);
      // The front of the top is left to the fringe, so the forehead and eyebrows stay visible.
      const top = d.y > 0.45 && !(d.z > 0.5 && d.y < 0.8);
      const back = d.z < 0.05 && d.y > -0.5;
      const side = Math.abs(d.x) > 0.8 && d.y > 0.12 && d.z < 0.45;
      // One half is generated and mirrored (with a little variation) so the head doesn't look turned.
      if (d.x < -0.04 || !(top || back || side)) continue;
      const r = 0.24 + random() * 0.13;
      const p = new Vector3(d.x * HEAD.x, d.y * HEAD.y, d.z * HEAD.z).multiplyScalar(0.93 + random() * 0.1);
      curls.push({ p, r });
      if (d.x > 0.08) curls.push({ p: new Vector3(-p.x, p.y + (random() - 0.5) * 0.06, p.z), r: r * (0.92 + random() * 0.16) });
    }
    for (let x = -0.6; x <= 0.61; x += 0.15) {
      const y = 0.7 + random() * 0.05 - Math.abs(x) * 0.14;
      curls.push({ p: new Vector3(x, y, faceZ(x, y) - 0.03), r: 0.16 + random() * 0.05 });
    }
    // Loose curls sticking out of the top and sides, like the tufts in the drawing.
    for (let i = 0; i < 10; i++) {
      const a = random() * Math.PI * 2;
      const up = random() < 0.6;
      const p = up
        ? new Vector3(Math.cos(a) * 0.6, 0.96 + random() * 0.14, Math.sin(a) * 0.45)
        : new Vector3((random() < 0.5 ? -1 : 1) * (1.0 + random() * 0.1), 0.25 + random() * 0.4, -0.1 + random() * 0.3);
      curls.push({ p, r: 0.13 + random() * 0.06 });
    }

    const ball = this.track(new SphereGeometry(1, 16, 12));
    const fill = new InstancedMesh(ball, material, curls.length);
    const hull = new InstancedMesh(ball, this.ink, curls.length);
    const m = new Matrix4();
    const q = new Quaternion();
    curls.forEach(({ p, r }, i) => {
      fill.setMatrixAt(i, m.compose(p, q, new Vector3(r, r, r)));
      hull.setMatrixAt(i, m.compose(p, q, new Vector3(r, r, r).multiplyScalar(1.07)));
    });
    const group = new Group();
    group.add(hull, fill);
    return group;
  }

  private buildFace(head: Group) {
    const frame = this.toon(COLORS.frame);

    // Drawn parts. The sheet's "L" pieces are on the viewer's left (his right).
    for (const side of [-1, 1] as const) {
      const x = side * 0.33;
      const open = this.onFace(this.drawn(side < 0 ? 'eyeL' : 'eyeR', 0.38), x, -0.03);
      const shut = this.onFace(this.drawn(side < 0 ? 'shutL' : 'shutR', 0.38), x, -0.05);
      const brow = this.onFace(this.drawn(side < 0 ? 'browL' : 'browR', 0.36), side * 0.34, 0.29);
      shut.visible = false;
      head.add(open, shut, brow);
      this.eyesOpen.push(open);
      this.eyesShut.push(shut);
      this.brows.push(brow);

      const cheek = new Mesh(this.track(new CircleGeometry(0.1, 20)), this.basic(COLORS.blush, { transparent: true, opacity: 0.38, depthWrite: false }));
      cheek.position.set(side * 0.52, -0.3, faceZ(side * 0.52, -0.3) + 0.012);
      cheek.rotation.y = side * 0.55;
      cheek.scale.set(1.2, 0.75, 1);
      head.add(cheek);
    }
    const mouths: [Mouth, number][] = [
      ['smile', 0.36],
      ['ah', 0.28],
      ['oh', 0.15],
    ];
    for (const [name, width] of mouths) {
      const mouth = this.onFace(this.drawn(name, width), 0, -0.42);
      mouth.visible = name === 'smile';
      head.add(mouth);
      this.mouths.set(name, mouth);
    }

    // Rectangular glasses with rounded corners, a bridge and arms back to the ears.
    const outer = roundedRect(0.5, 0.39, 0.11, new Shape()) as Shape;
    outer.holes.push(roundedRect(0.41, 0.3, 0.08, new Path()) as Path);
    const rim = this.track(new ExtrudeGeometry(outer, { depth: 0.035, bevelEnabled: false, curveSegments: 6 }));
    const glassZ = 0.95;
    const shine = this.basic('#ffffff', { transparent: true, opacity: 0.35, depthWrite: false });
    const streak = this.track(new PlaneGeometry(0.03, 0.18));
    for (const side of [-1, 1]) {
      const lens = new Mesh(rim, frame);
      lens.position.set(side * 0.335, -0.02, glassZ);
      lens.rotation.y = side * 0.12;
      head.add(lens);
      const s = new Mesh(streak, shine);
      s.position.set(side * 0.335 + 0.12, 0.03, glassZ + 0.01);
      s.rotation.z = -0.6;
      head.add(s);
      head.add(bar(new Vector3(side * 0.58, 0.07, glassZ - 0.03), new Vector3(side * 0.93, 0.04, 0.1), 0.018, frame, this.geometries));
    }
    head.add(bar(new Vector3(-0.09, 0.05, glassZ + 0.02), new Vector3(0.09, 0.05, glassZ + 0.02), 0.02, frame, this.geometries));

    const nose = new Mesh(this.track(new SphereGeometry(0.035, 10, 8)), this.toon(COLORS.skinShade));
    nose.position.set(0, -0.2, faceZ(0, -0.2) + 0.01);
    nose.scale.set(1, 0.8, 0.6);
    head.add(nose);
  }

  /* ---------- Behaviour ---------- */

  setLook(x: number, y: number): void {
    this.look.tx = clamp(x, -1, 1);
    this.look.ty = clamp(y, -1, 1);
  }

  setLean(v: number): void {
    this.leanTarget = clamp(v, -1, 1);
  }

  setHover(on: boolean): void {
    this.hovering = on;
  }

  setSleep(on: boolean): void {
    if (this.sleeping && !on) this.surpriseLeft = 0.9;
    this.sleeping = on;
  }

  wave(seconds = 1.8): void {
    this.waveLeft = seconds;
  }

  hop(): void {
    this.hopLeft = 0.55;
  }

  talk(seconds: number): void {
    this.talkLeft = seconds;
  }

  resize(): void {
    const w = this.canvas.clientWidth || 1;
    const h = this.canvas.clientHeight || 1;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  private showMouth(name: Mouth) {
    for (const [key, mesh] of this.mouths) mesh.visible = key === name;
  }

  /** One frame, driven by GSAP's ticker like the rest of the page. */
  readonly frame = (_time: number, deltaMs: number): void => {
    const dt = Math.min(deltaMs / 1000, 0.05);
    const t = (this.time += dt);

    this.look.x = ease(this.look.x, this.sleeping ? 0 : this.look.tx, 5, dt);
    this.look.y = ease(this.look.y, this.sleeping ? 0 : this.look.ty, 5, dt);
    this.lean = ease(this.lean, this.leanTarget, 4, dt);
    this.leanTarget = ease(this.leanTarget, 0, 3, dt);
    this.sleep = ease(this.sleep, this.sleeping ? 1 : 0, 2.5, dt);
    this.happy = ease(this.happy, this.hovering || this.waveLeft > 0 ? 1 : 0, 6, dt);
    this.waveLeft = Math.max(0, this.waveLeft - dt);
    this.hopLeft = Math.max(0, this.hopLeft - dt);
    this.talkLeft = Math.max(0, this.talkLeft - dt);
    this.surpriseLeft = Math.max(0, this.surpriseLeft - dt);

    // Float, breathe and sway; slower and lower while dozing.
    const hop = this.hopLeft > 0 ? Math.sin((1 - this.hopLeft / 0.55) * Math.PI) : 0;
    const bob = Math.sin(t * mix(1.7, 0.8, this.sleep)) * mix(0.07, 0.03, this.sleep);
    this.root.position.y = bob + hop * 0.42 - this.sleep * 0.08;
    const squash = 1 + Math.sin(t * 2.1) * 0.012 + (this.hopLeft > 0.45 ? -0.06 : 0) + hop * 0.04;
    this.root.scale.set(1 / Math.sqrt(squash), squash, 1 / Math.sqrt(squash));
    this.root.rotation.z = Math.sin(t * 0.9) * 0.035 * (1 - this.sleep) - this.lean * 0.06;
    this.root.rotation.x = -this.lean * 0.18;
    this.torso.scale.y = 1 + Math.sin(t * mix(2.1, 1, this.sleep)) * 0.012;
    this.shadow.scale.set(1 - hop * 0.3 - bob * 0.5, 0.2 * (1 - hop * 0.3), 1);

    // Head follows the pointer, or droops while asleep.
    const waving = this.waveLeft > 0;
    const nod = waving ? Math.sin(t * 7) * 0.04 : 0;
    this.headPivot.rotation.y = this.look.x * 0.5;
    this.headPivot.rotation.x = this.look.y * 0.28 + this.sleep * 0.32 + nod + this.lean * 0.1;
    this.headPivot.rotation.z = -this.look.x * 0.06 + this.sleep * 0.18 + (waving ? 0.08 : 0) * this.happy;

    // Face: drawn pieces swapped per expression.
    this.nextBlink -= dt;
    if (this.nextBlink <= 0) {
      this.blink = 0.14;
      this.nextBlink = 2.2 + Math.random() * 3.8;
    }
    this.blink = Math.max(0, this.blink - dt);
    const beaming = waving && !this.sleeping;
    const shut = this.sleep > 0.5 || this.blink > 0 || beaming;
    const surprised = this.surpriseLeft > 0;
    for (const [i, open] of this.eyesOpen.entries()) {
      open.visible = !shut;
      open.scale.setScalar(surprised ? 1.12 : 1);
      open.position.x = (i === 0 ? -0.33 : 0.33) + this.look.x * 0.02;
      const closed = this.eyesShut[i];
      if (closed) {
        closed.visible = shut;
        // Upside-down closed eyes read as a happy squint.
        closed.scale.y = beaming ? -1 : 1;
      }
    }
    for (const brow of this.brows) brow.position.y = 0.29 + this.happy * 0.04 + (surprised ? 0.06 : 0) - this.sleep * 0.03;

    let mouth: Mouth = 'smile';
    if (surprised) mouth = 'oh';
    else if (this.talkLeft > 0) mouth = (['ah', 'oh', 'smile'] as const)[Math.floor(t * 9) % 3] ?? 'smile';
    else if (beaming) mouth = 'ah';
    this.showMouth(mouth);
    const smile = this.mouths.get('smile');
    if (smile) smile.scale.setScalar(mix(1, 0.8, this.sleep) + this.happy * 0.1);

    // Waving: raise the arm, swing it, lower it.
    const raise = waving ? smoothstep(0, 0.25, this.waveLeft) : 0;
    this.armWave.rotation.z = mix(0.2, 1.95 + Math.sin(t * 13) * 0.3, raise);
    this.armRest.rotation.z = -0.2 + Math.sin(t * 1.7) * 0.03 - hop * 0.3;

    this.renderer.render(this.scene, this.camera);
  };

  dispose(): void {
    this.scene.traverse((o) => {
      if (o instanceof InstancedMesh) o.dispose();
    });
    this.geometries.forEach((g) => g.dispose());
    this.materials.forEach((m) => m.dispose());
    this.textures.forEach((t) => t.dispose());
    this.renderer.dispose();
  }
}

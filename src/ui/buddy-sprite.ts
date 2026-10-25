import spriteUrl from '../assets/avatar/sprite.webp';
import { SPRITE, type SpriteFrame } from '../assets/avatar/atlas';
import type { AvatarStage } from './avatar-stage';

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const ease = (current: number, target: number, rate: number, dt: number) => current + (target - current) * Math.min(1, dt * rate);
const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

/** A damped spring: follows its target with a little overshoot, so motion settles instead of stopping dead. */
class Spring {
  value: number;
  velocity = 0;
  constructor(
    initial: number,
    private readonly stiffness: number,
    private readonly damping: number,
  ) {
    this.value = initial;
  }
  step(target: number, dt: number): number {
    // Small fixed sub-steps keep it stable on slow frames.
    for (let left = dt; left > 0; left -= 1 / 120) {
      const h = Math.min(left, 1 / 120);
      this.velocity += ((target - this.value) * this.stiffness - this.velocity * this.damping) * h;
      this.value += this.velocity * h;
    }
    return this.value;
  }
}

/** How long a swap between two drawings takes (ms): quick for blinks and talking, softer otherwise. */
const fadeFor = (from: SpriteFrame | null, to: SpriteFrame): number => {
  if (from === 'blink' || to === 'blink') return 60;
  if (['ah', 'oh'].includes(to) || ['ah', 'oh'].includes(from ?? '')) return 70;
  return 180;
};

interface Layer {
  el: HTMLDivElement;
  frame: SpriteFrame | null;
  mirror: boolean;
}

/**
 * The drawn 2D avatar: head and shoulders from the owner's expression sheet,
 * rising from the bottom edge of the screen. It crossfades between drawn
 * frames (blink, talk, happy, shy, sleepy, surprised, glance, wave) and
 * moves on springs (tilt, sway, bob, bounce). No WebGL needed.
 */
export class SpriteStage implements AvatarStage {
  readonly ready: Promise<void>;
  private readonly el: HTMLDivElement;
  private readonly layers: [Layer, Layer];
  private front: 0 | 1 = 0;
  private fadeElapsed = 0;
  private fadeDuration = 0;

  private time = 0;
  private readonly look = { x: 0, y: 0, tx: 0, ty: 0 };
  private glanceSide = 0;
  private leanTarget = 0;
  private hovering = false;
  private hoverTime = 0;
  private sleeping = false;
  private sleepTime = 0;
  private blink = 0;
  private nextBlink = 2;
  private waveLeft = 0;
  private talkLeft = 0;
  private talkShape: SpriteFrame = 'neutral';
  private nextShape = 0;
  private surpriseLeft = 0;

  private readonly tilt = new Spring(0, 90, 11);
  private readonly sway = new Spring(0, 70, 12);
  private readonly lift = new Spring(0, 60, 11);
  private readonly stretch = new Spring(1, 260, 9);

  constructor(host: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'buddy__sprite';
    this.el.setAttribute('aria-hidden', 'true');
    const layer = (): Layer => {
      const el = document.createElement('div');
      el.className = 'buddy__layer';
      el.style.backgroundImage = `url("${spriteUrl}")`;
      el.style.backgroundSize = `${SPRITE.columns * 100}% ${SPRITE.rows * 100}%`;
      this.el.append(el);
      return { el, frame: null, mirror: false };
    };
    this.layers = [layer(), layer()];
    host.prepend(this.el);

    const image = new Image();
    image.src = spriteUrl;
    this.ready = image.decode().catch(() => undefined);
    this.paint(this.layers[0], 'neutral', false);
    this.layers[1].el.style.opacity = '0';
  }

  setLook(x: number, y: number): void {
    this.look.tx = clamp(x, -1, 1);
    this.look.ty = clamp(y, -1, 1);
  }

  setLean(v: number): void {
    this.leanTarget = clamp(v, -1, 1);
    if (Math.abs(v) > 0.8) this.surpriseLeft = Math.max(this.surpriseLeft, 0.5);
  }

  setHover(on: boolean): void {
    this.hovering = on;
    this.hoverTime = 0;
    if (on) this.stretch.velocity += 0.6;
  }

  setSleep(on: boolean): void {
    if (this.sleeping && !on) {
      this.surpriseLeft = 0.9;
      this.stretch.velocity += 1.4;
    }
    this.sleeping = on;
    this.sleepTime = 0;
  }

  wave(seconds = 1.8): void {
    this.waveLeft = seconds;
  }

  /** A bust can't jump off the screen edge, so it dips, squashes and springs back with a wobble instead. */
  hop(): void {
    this.stretch.velocity -= 1.6;
    this.lift.velocity += 45;
  }

  talk(seconds: number): void {
    this.talkLeft = seconds;
    this.nextShape = 0;
  }

  resize(): void {}

  private get back(): 0 | 1 {
    return this.front === 0 ? 1 : 0;
  }

  private paint(layer: Layer, frame: SpriteFrame, mirror: boolean) {
    const i = SPRITE.frames.indexOf(frame);
    const col = i % SPRITE.columns;
    const row = Math.floor(i / SPRITE.columns);
    layer.el.style.backgroundPosition = `${(col / (SPRITE.columns - 1)) * 100}% ${(row / Math.max(1, SPRITE.rows - 1)) * 100}%`;
    layer.el.style.transform = mirror ? 'scaleX(-1)' : '';
    layer.frame = frame;
    layer.mirror = mirror;
  }

  /** Brings a new drawing in on the back layer and fades it over the current one. */
  private show(frame: SpriteFrame, mirror: boolean) {
    const current = this.layers[this.front];
    if (current.frame === frame && current.mirror === mirror) return;
    const next = this.layers[this.back];
    this.paint(next, frame, mirror);
    next.el.style.zIndex = '1';
    current.el.style.zIndex = '0';
    this.fadeDuration = fadeFor(current.frame, frame);
    this.fadeElapsed = 0;
    this.front = this.back;
  }

  /** Which drawing fits the moment, most important first. */
  private pick(t: number): [SpriteFrame, boolean] {
    if (this.waveLeft > 0) return ['wave', false];
    if (this.sleeping) return [this.sleepTime < 1.6 ? 'sleepy' : 'blink', false];
    if (this.surpriseLeft > 0) return ['surprised', false];
    if (this.talkLeft > 0) {
      // Mouth shapes at a speech-like, slightly uneven pace.
      if (t >= this.nextShape) {
        const shapes: SpriteFrame[] = ['ah', 'oh', 'neutral', 'ah'];
        this.talkShape = shapes.filter((s) => s !== this.talkShape)[Math.floor(Math.random() * 3)] ?? 'ah';
        this.nextShape = t + 0.1 + Math.random() * 0.08;
      }
      return [this.talkShape, false];
    }
    if (this.hovering) return [this.hoverTime < 1.4 ? 'happy' : 'shy', false];
    if (this.blink > 0) return ['blink', false];
    // The glance drawing looks to the viewer's right; mirrored for the left.
    if (this.glanceSide !== 0) return ['glance', this.glanceSide < 0];
    return ['neutral', false];
  }

  readonly frame = (_time: number, deltaMs: number): void => {
    const dt = Math.min(deltaMs / 1000, 0.05);
    const t = (this.time += dt);

    this.look.x = ease(this.look.x, this.sleeping ? 0 : this.look.tx, 6, dt);
    this.look.y = ease(this.look.y, this.sleeping ? 0 : this.look.ty, 6, dt);
    this.leanTarget = ease(this.leanTarget, 0, 3, dt);
    this.waveLeft = Math.max(0, this.waveLeft - dt);
    this.talkLeft = Math.max(0, this.talkLeft - dt);
    this.surpriseLeft = Math.max(0, this.surpriseLeft - dt);
    if (this.hovering) this.hoverTime += dt;
    if (this.sleeping) this.sleepTime += dt;

    // Glancing switches on further out than it switches off, so it never flickers at the edge.
    if (Math.abs(this.look.x) > 0.5) this.glanceSide = Math.sign(this.look.x);
    else if (Math.abs(this.look.x) < 0.3) this.glanceSide = 0;

    this.nextBlink -= dt;
    if (this.nextBlink <= 0) {
      this.blink = 0.13;
      this.nextBlink = 2.2 + Math.random() * 3.8;
    }
    this.blink = Math.max(0, this.blink - dt);

    const [frame, mirror] = this.pick(t);
    this.show(frame, mirror);

    // Crossfade: the new drawing fades in on top, the old one fades out behind it near the end.
    this.fadeElapsed += deltaMs;
    const p = this.fadeDuration > 0 ? clamp(this.fadeElapsed / this.fadeDuration, 0, 1) : 1;
    this.layers[this.front].el.style.opacity = p.toFixed(3);
    this.layers[this.back].el.style.opacity = (1 - smoothstep(0.45, 1, p)).toFixed(3);

    // Motion on springs. It bobs downwards only, so the cut at the shoulders stays below the screen edge.
    const waving = frame === 'wave';
    const tilt = this.tilt.step(
      this.look.x * 4 - this.leanTarget * 7 + (this.sleeping ? 7 : 0) + (waving ? Math.sin(t * 7) * 2.5 : 0) + Math.sin(t * 0.9) * 0.8,
      dt,
    );
    const sway = this.sway.step(this.look.x * 5, dt);
    const breath = (1 - Math.cos(t * (this.sleeping ? 0.9 : 1.8))) * (this.sleeping ? 2.2 : 2.8);
    const lift = this.lift.step(breath + this.look.y * 2, dt);
    const stretch = this.stretch.step(1 + Math.sin(t * 2.1) * 0.006, dt);
    this.el.style.transform =
      `translate(${sway.toFixed(2)}px, ${Math.max(-2, lift).toFixed(2)}px) rotate(${tilt.toFixed(2)}deg) ` +
      `scale(${(1 / Math.sqrt(stretch)).toFixed(4)}, ${stretch.toFixed(4)})`;
  };

  dispose(): void {
    this.el.remove();
  }
}

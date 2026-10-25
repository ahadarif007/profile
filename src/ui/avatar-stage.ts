/**
 * What the corner avatar controller (buddy.ts) needs from an avatar,
 * whether it is the 3D toon model or the drawn 2D one.
 */
export interface AvatarStage {
  /** Resolves once its artwork has loaded, so it never pops in half drawn. */
  readonly ready: Promise<void>;
  /** Where the pointer is relative to the avatar, roughly -1..1 on each axis. */
  setLook(x: number, y: number): void;
  /** Scroll speed, -1..1: it leans against the direction of travel. */
  setLean(v: number): void;
  setHover(on: boolean): void;
  setSleep(on: boolean): void;
  wave(seconds?: number): void;
  hop(): void;
  talk(seconds: number): void;
  resize(): void;
  /** One frame; signature matches GSAP's ticker. */
  readonly frame: (time: number, deltaMs: number) => void;
  dispose(): void;
}

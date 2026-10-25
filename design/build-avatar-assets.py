"""
Cuts the avatar artwork out of the reference sheets in design/avatar-refs
and packs it into the small atlases the site loads (src/assets/avatar).

Run from the repository root:  python3 design/build-avatar-assets.py
Needs Pillow (with WebP), numpy and scipy. The sheets themselves are never published.

Writes:
  src/assets/avatar/sprite.webp  drawn 2D avatar: one frame per expression plus a wave
  src/assets/avatar/face.webp    drawn eyes, eyebrows and mouths for the 3D head
  src/assets/avatar/atlas.ts     where each piece sits in those images
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
REFS = ROOT / 'design' / 'avatar-refs'
OUT = ROOT / 'src' / 'assets' / 'avatar'

# Expression sheet: 3 x 3 cells between 4px grey grid lines.
CELL_X = [(4, 334), (346, 678), (690, 1020)]
CELL_Y = [(4, 336), (346, 680), (690, 1020)]
CELL_W, CELL_H = 330, 330
EXPRESSIONS = ['neutral', 'happy', 'ah', 'oh', 'blink', 'sleepy', 'surprised', 'glance', 'shy']

# 2D frames are wider than the cells so the raised hand of the wave fits.
FRAME_W, FRAME_H = 440, 330
FRAME_SCALE = 0.75
SPRITE_COLUMNS = 5

# Face parts sheet (green background): name -> (x0, y0, x1, y1).
FACE_PARTS = {
    'eyeL': (104, 146, 214, 245),
    'eyeR': (322, 146, 430, 244),
    'shutL': (578, 160, 702, 234),
    'shutR': (800, 160, 924, 234),
    'browL': (70, 90, 229, 146),
    'browR': (306, 88, 465, 144),
    'smile': (94, 652, 272, 724),
    'ah': (98, 808, 266, 928),
    'oh': (398, 834, 482, 916),
}
FACE_SCALE = 0.75
# Thin line drawings that would fade once shrunk onto the small 3D head get thickened.
FACE_THICKEN = {'shutL', 'shutR', 'smile'}


def load(name: str) -> np.ndarray:
    return np.asarray(Image.open(REFS / name).convert('RGB')).astype(np.float32)


def unblend(rgb: np.ndarray, alpha: np.ndarray, bg: np.ndarray) -> np.ndarray:
    """Removes the background colour mixed into soft edge pixels."""
    a = np.maximum(alpha, 1e-3)[..., None]
    return np.clip((rgb - (1 - a) * bg) / a, 0, 255)


def cut_white(rgb: np.ndarray) -> np.ndarray:
    """RGBA from a drawing on white: background is the near-white region touching the border."""
    lo = rgb.min(-1)
    spread = rgb.max(-1) - lo
    white = (lo > 226) & (spread < 28)
    labels, _ = ndimage.label(white)
    edge = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    bg = np.isin(labels, edge[edge > 0])
    alpha = np.where(bg, 0.0, 1.0)
    # Soft edge: unsaturated light pixels next to the background are partly transparent ink.
    band = ndimage.binary_dilation(bg, iterations=2) & ~bg & (spread < 40)
    estimate = np.clip((255 - rgb.mean(-1)) / (255 - 50), 0, 1)
    alpha[band] = estimate[band]
    color = unblend(rgb, alpha, np.array([255.0, 255.0, 255.0]))
    return np.dstack([color, alpha * 255]).astype(np.uint8)


def cut_green(rgb: np.ndarray) -> np.ndarray:
    """RGBA from parts drawn on flat green."""
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    excess = g - np.maximum(r, b)
    alpha = np.clip(1 - (excess - 40) / 150, 0, 1)
    alpha[excess < 40] = 1
    color = unblend(rgb, alpha, np.array([0.0, 255.0, 0.0]))
    color[..., 1] = np.minimum(color[..., 1], np.maximum(color[..., 0], color[..., 2]) + 4)
    return np.dstack([color, alpha * 255]).astype(np.uint8)


def hair_box(rgba: np.ndarray, rows: int, cols: int | None = None) -> tuple[int, int, int, int]:
    """Bounds of the dark hair in the top `rows` (and left `cols`) of a cut-out."""
    c = rgba[:rows, :cols, :3].astype(int)
    mask = (rgba[:rows, :cols, 3] > 200) & (c.mean(-1) < 80) & (c[..., 2] >= c[..., 0])
    ys, xs = np.nonzero(mask)
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def best_shift(ref: np.ndarray, img: np.ndarray, rows: slice) -> tuple[int, int]:
    """Small (dx, dy) that lines the shirt and shoulders of `img` up with `ref`."""
    a = ref[rows, :, 3] > 128
    best, score = (0, 0), -1
    for dy in range(-8, 9):
        for dx in range(-8, 9):
            b = np.roll(np.roll(img[:, :, 3] > 128, dy, 0), dx, 1)[rows]
            s = (a & b).sum() - (a ^ b).sum()
            if s > score:
                best, score = (dx, dy), s
    return best


def place(canvas: Image.Image, rgba: np.ndarray, x: int, y: int) -> None:
    img = Image.fromarray(rgba, 'RGBA')
    canvas.paste(img, (x, y), img)


def sprite_frames() -> dict[str, Image.Image]:
    sheet = load('expressions.jpeg')
    cells = {}
    for i, name in enumerate(EXPRESSIONS):
        (x0, _), (y0, _) = CELL_X[i % 3], CELL_Y[i // 3]
        cells[name] = cut_white(sheet[y0 : y0 + CELL_H, x0 : x0 + CELL_W])

    ox = (FRAME_W - CELL_W) // 2
    frames = {}
    neutral = cells['neutral']
    for name, cell in cells.items():
        dx, dy = best_shift(neutral, cell, slice(250, 325))
        frame = Image.new('RGBA', (FRAME_W, FRAME_H))
        place(frame, cell, ox + dx, dy)
        frames[name] = frame

    # Wave: the first figure of the poses sheet, scaled and placed so its hair matches the neutral face.
    figure = cut_white(load('poses.jpeg')[60:740, 0:430])
    hx0, hy0, hx1, _ = hair_box(neutral, 180)
    px0, py0, px1, _ = hair_box(figure, 260, 300)
    scale = (hx1 - hx0) / (px1 - px0)
    img = Image.fromarray(figure, 'RGBA')
    img = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
    frame = Image.new('RGBA', (FRAME_W, FRAME_H))
    x = round(ox + (hx0 + hx1) / 2 - (px0 + px1) / 2 * scale)
    y = round(hy0 - py0 * scale)
    frame.paste(img, (x, y), img)
    frames['wave'] = frame
    return frames


def write_sprite(frames: dict[str, Image.Image]) -> tuple[list[str], int, int]:
    w, h = round(FRAME_W * FRAME_SCALE), round(FRAME_H * FRAME_SCALE)
    names = list(frames)
    rows = -(-len(names) // SPRITE_COLUMNS)
    atlas = Image.new('RGBA', (w * SPRITE_COLUMNS, h * rows))
    for i, name in enumerate(names):
        atlas.paste(frames[name].resize((w, h), Image.LANCZOS), ((i % SPRITE_COLUMNS) * w, (i // SPRITE_COLUMNS) * h))
    atlas.save(OUT / 'sprite.webp', 'WEBP', quality=86, method=6, exact=False)
    return names, w, h


def write_face() -> dict[str, tuple[int, int, int, int]]:
    sheet = cut_green(load('face-parts.jpeg'))
    pieces = {}
    for name, (x0, y0, x1, y1) in FACE_PARTS.items():
        img = Image.fromarray(sheet[y0:y1, x0:x1], 'RGBA')
        if name in FACE_THICKEN:
            alpha = img.getchannel('A').filter(ImageFilter.MaxFilter(5))
            img = Image.merge('RGBA', (*Image.new('RGB', img.size, (38, 26, 24)).split(), alpha))
        pieces[name] = img.resize((round(img.width * FACE_SCALE), round(img.height * FACE_SCALE)), Image.LANCZOS)
    # Shelf packing, 4px apart so mipmaps don't bleed between pieces.
    width, pad = 512, 4
    rects, x, y, shelf = {}, pad, pad, 0
    for name, img in pieces.items():
        if x + img.width + pad > width:
            x, y, shelf = pad, y + shelf + pad, 0
        rects[name] = (x, y, img.width, img.height)
        x += img.width + pad
        shelf = max(shelf, img.height)
    height = 1 << (y + shelf + pad - 1).bit_length()
    atlas = Image.new('RGBA', (width, height))
    for name, img in pieces.items():
        atlas.paste(img, rects[name][:2])
    atlas.save(OUT / 'face.webp', 'WEBP', quality=90, method=6, exact=False)
    return {name: (*r, width, height) for name, r in rects.items()}


def write_atlas(names: list[str], w: int, h: int, face: dict[str, tuple[int, ...]]) -> None:
    lines = [
        '// Generated by design/build-avatar-assets.py. Do not edit by hand.',
        '',
        '/** Drawn 2D avatar: frames in reading order, SPRITE.columns per row. */',
        'export const SPRITE = {',
        f'  frameWidth: {w},',
        f'  frameHeight: {h},',
        f'  columns: {SPRITE_COLUMNS},',
        f'  rows: {-(-len(names) // SPRITE_COLUMNS)},',
        f'  frames: [{", ".join(repr(n) for n in names)}] as const,',
        '};',
        '',
        'export type SpriteFrame = (typeof SPRITE.frames)[number];',
        '',
        '/** Drawn face parts for the 3D head: x, y, width, height in a sheet of sheetWidth x sheetHeight. */',
        'export const FACE = {',
        f'  sheetWidth: {next(iter(face.values()))[4]},',
        f'  sheetHeight: {next(iter(face.values()))[5]},',
        '  parts: {',
        *[f'    {n}: [{r[0]}, {r[1]}, {r[2]}, {r[3]}],' for n, r in face.items()],
        '  },',
        '} as const;',
        '',
        'export type FacePart = keyof typeof FACE.parts;',
        '',
    ]
    (OUT / 'atlas.ts').write_text('\n'.join(lines))


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    names, w, h = write_sprite(sprite_frames())
    face = write_face()
    write_atlas(names, w, h, face)
    for f in ('sprite.webp', 'face.webp'):
        print(f, (OUT / f).stat().st_size // 1024, 'KB')

"""
Cuts the avatar artwork out of the reference sheets in design/avatar-refs
and packs it into the small atlases the site loads (src/assets/avatar).

Run from the repository root:  python3 design/build-avatar-assets.py
Needs Pillow (with WebP), numpy and scipy. The sheets themselves are never published.

Writes:
  src/assets/avatar/sprite.webp  drawn 2D avatar: standing figure, one frame per expression plus poses
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

# Full-body 2D frames: the standing body from the turnaround sheet with each expression's
# head swapped on, plus whole poses from the poses sheet. All drawn at one scale.
STANDING_HEIGHT = 380
SPRITE_COLUMNS = 6
# Figures in the source sheets: (x0, y0, x1, y1).
FRONT = ('turnaround.jpeg', (15, 60, 262, 545))
POSES = {
    'wave': (28, 80, 395, 730),
    'jump': (365, 83, 706, 672),
    'point': (695, 80, 1030, 730),
}

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
    # Large pure-white gaps enclosed by the drawing (between legs, under an arm) are background too.
    holes, _ = ndimage.label(white & ~bg & (lo > 240) & (spread < 14))
    sizes = np.bincount(holes.ravel())
    bg |= np.isin(holes, np.nonzero(sizes > 500)[0][1:])
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


def bbox(rgba: np.ndarray, threshold: int = 24) -> tuple[int, int, int, int]:
    ys, xs = np.nonzero(rgba[..., 3] > threshold)
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def face_box(rgba: np.ndarray, top: float) -> dict[str, int]:
    """Lower face (cheeks to chin) of a figure: the widest skin region lowest in its top part."""
    c = rgba[..., :3].astype(int)
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    skin = (rgba[..., 3] > 200) & (r > 205) & (g > 150) & (g < 232) & (b > 110) & (b < 215) & (r - b > 25)
    skin[int(rgba.shape[0] * top) :] = False
    labels, count = ndimage.label(skin)
    best, best_bottom = None, -1
    for i, sl in enumerate(ndimage.find_objects(labels), start=1):
        if sl is None:
            continue
        width = sl[1].stop - sl[1].start
        if width > rgba.shape[1] * 0.3 and (labels[sl] == i).sum() > 1500 and sl[0].stop > best_bottom:
            best, best_bottom = i, sl[0].stop
    ys, xs = np.nonzero(labels == best)
    cx = int(np.median(xs))
    return {'x0': int(xs.min()), 'x1': int(xs.max()), 'cx': cx, 'chin': int(ys[xs == cx].max())}


def scaled(rgba: np.ndarray, factor: float) -> np.ndarray:
    img = Image.fromarray(rgba, 'RGBA')
    return np.asarray(img.resize((round(img.width * factor), round(img.height * factor)), Image.LANCZOS))


def swap_head(body: np.ndarray, cell: np.ndarray, width: int) -> np.ndarray:
    """The body with its head replaced by the cell's (lower face `width` px wide), joined at the chin."""
    bf = face_box(body, 0.5)
    cf = face_box(cell, 0.9)
    head = cell.copy()
    # Drop the shirt collar, which only sits around the neck. The navy hair is bluish too,
    # so the colour test must never reach above the chin.
    rows = np.arange(head.shape[0])[:, None]
    blue = head[..., 2].astype(int) > head[..., 0].astype(int) + 15
    head[(blue & (rows > cf['chin'] - 8)) | (rows > cf['chin'] + 10), 3] = 0
    factor = width / (cf['x1'] - cf['x0'])
    head = scaled(head, factor)
    x, y = round(bf['cx'] - cf['cx'] * factor), round(bf['chin'] - cf['chin'] * factor)
    # Room above for a head bigger than the one it replaces.
    pad = max(0, -y)
    out = np.zeros((body.shape[0] + pad, body.shape[1], 4), np.uint8)
    out[pad:] = body
    out[: pad + bf['chin'] - 1, :, 3] = 0
    layer = Image.new('RGBA', (out.shape[1], out.shape[0]))
    img = Image.fromarray(head, 'RGBA')
    layer.paste(img, (x, y + pad), img)
    return np.asarray(Image.alpha_composite(Image.fromarray(out, 'RGBA'), layer))


def main_figure(rgba: np.ndarray) -> np.ndarray:
    """Keeps only the biggest figure in a crop, dropping slivers of its neighbours."""
    mask = rgba[..., 3] > 24
    labels, count = ndimage.label(ndimage.binary_dilation(mask, iterations=3))
    keep = labels == np.argmax(np.bincount(labels.ravel())[1:]) + 1
    out = rgba.copy()
    out[~keep, 3] = 0
    # White gaps enclosed below the head (between legs, under an arm) are background; eyes are never this low.
    c = out[..., :3].astype(int)
    gap = (out[..., 3] > 0) & (c.min(-1) > 225) & (c.max(-1) - c.min(-1) < 24)
    gap[: int(out.shape[0] * 0.45)] = False
    holes, _ = ndimage.label(gap)
    sizes = np.bincount(holes.ravel())
    hole = np.isin(holes, np.nonzero(sizes > 80)[0][1:])
    out[ndimage.binary_dilation(hole, iterations=1), 3] = 0
    return out


def sprite_frames() -> dict[str, Image.Image]:
    sheet = load('expressions.jpeg')
    cells = {}
    for i, name in enumerate(EXPRESSIONS):
        (x0, _), (y0, _) = CELL_X[i % 3], CELL_Y[i // 3]
        cells[name] = cut_white(sheet[y0 : y0 + CELL_H, x0 : x0 + CELL_W])

    def figure(file: str, box: tuple[int, int, int, int]) -> np.ndarray:
        x0, y0, x1, y1 = box
        cut = main_figure(cut_white(load(file)[y0:y1, x0:x1]))
        left, top, right, bottom = bbox(cut)
        return cut[top:bottom, left:right]

    # Everything is scaled to the poses sheet, whose standing wave sets the size.
    poses = {name: figure('poses.jpeg', box) for name, box in POSES.items()}
    k = STANDING_HEIGHT / poses['wave'].shape[0]
    poses = {name: scaled(f, k) for name, f in poses.items()}
    wf = face_box(poses['wave'], 0.45)
    head_width = wf['x1'] - wf['x0']
    leg = poses['wave'].shape[0] - wf['chin']

    # The turnaround body, scaled so chin to shoes matches the wave, then each expression's head.
    body = figure(*FRONT)
    bf = face_box(body, 0.5)
    body = scaled(body, leg / (body.shape[0] - bf['chin']))
    placed: dict[str, tuple[np.ndarray, tuple[int, int]]] = {}
    for name, cell in cells.items():
        f = swap_head(body, cell, head_width)
        placed[name] = (f, (face_box(f, 0.5)['cx'], f.shape[0]))
    # The pointing pose keeps its arm but gets the calm face instead of the nervous one.
    point = swap_head(poses['point'], cells['neutral'], head_width)
    placed['point'] = (point, (face_box(point, 0.5)['cx'], point.shape[0]))
    placed['wave'] = (poses['wave'], (wf['cx'], poses['wave'].shape[0]))
    # The jump keeps its face where the standing face is; the stage lifts it.
    jf = face_box(poses['jump'], 0.5)
    placed['jump'] = (poses['jump'], (jf['cx'], jf['chin'] + leg))

    # Frame size: everything placed around one shared point (face centre, shoe line), plus a margin.
    boxes = [(-ax, -ay, f.shape[1] - ax, f.shape[0] - ay) for f, (ax, ay) in placed.values()]
    left = min(b[0] for b in boxes) - 4
    top = min(b[1] for b in boxes) - 4
    width = max(b[2] for b in boxes) + 4 - left
    height = max(b[3] for b in boxes) + 2 - top
    frames = {}
    for name in [*EXPRESSIONS, 'wave', 'point', 'jump']:
        f, (ax, ay) = placed[name]
        frame = Image.new('RGBA', (width, height))
        img = Image.fromarray(f, 'RGBA')
        frame.paste(img, (-left - ax, -top - ay), img)
        frames[name] = frame
    return frames


def write_sprite(frames: dict[str, Image.Image]) -> tuple[list[str], int, int]:
    first = next(iter(frames.values()))
    w, h = first.size
    names = list(frames)
    rows = -(-len(names) // SPRITE_COLUMNS)
    atlas = Image.new('RGBA', (w * SPRITE_COLUMNS, h * rows))
    for i, name in enumerate(names):
        atlas.paste(frames[name], ((i % SPRITE_COLUMNS) * w, (i // SPRITE_COLUMNS) * h))
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

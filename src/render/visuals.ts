import { mulberry32 } from '../core/geometry';
import type { ProjectVisual } from '../content/types';

/**
 * Art-directed, generated SVG visuals. Each one diagrams the engineering idea
 * behind a project. None of them is a screenshot or represents real data.
 */

const W = 600;
const H = 440;
const f = (n: number) => n.toFixed(1);

const frame = (id: string, body: string) =>
  `<svg class="vx vx--${id}" viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false">
  <defs>
    <pattern id="vx-grid-${id}" width="24" height="24" patternUnits="userSpaceOnUse">
      <path d="M24 0H0V24" class="vx-grid"/>
    </pattern>
    <marker id="vx-arrow-${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0L10 5L0 10z" class="vx-arrowhead"/>
    </marker>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#vx-grid-${id})"/>
  ${body}
</svg>`;

const label = (x: number, y: number, text: string, anchor: 'start' | 'middle' | 'end' = 'start', extra = '') =>
  `<text class="vx-label ${extra}" x="${x}" y="${y}" text-anchor="${anchor}">${text}</text>`;

function eventFork(): string {
  const id = 'event-fork';
  const hex = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i + Math.PI / 6;
    return `${f(250 + Math.cos(a) * 48)},${f(180 + Math.sin(a) * 48)}`;
  }).join(' ');
  const events = Array.from({ length: 8 }, (_, i) => {
    const x = 340 + i * 28;
    return `<rect class="vx-event" x="${x}" y="164" width="14" height="32" rx="2" style="--i:${i}" opacity="${f(0.25 + i * 0.1)}"/>`;
  }).join('');
  return frame(
    id,
    `${label(40, 100, 'COMMANDS')}
  <path class="vx-line" d="M40 120H160C180 120 190 140 202 160" marker-end="url(#vx-arrow-${id})"/>
  <polygon class="vx-node vx-node--hot" points="${hex}"/>
  ${label(250, 186, 'AGG', 'middle', 'vx-label--strong')}
  <path class="vx-line" d="M298 180H330"/>
  ${events}
  ${label(340, 146, 'EVENT LOG · APPEND-ONLY')}
  <path class="vx-line vx-line--flow" d="M566 200C566 300 520 322 452 322"/>
  <circle class="vx-node" cx="430" cy="322" r="20"/>
  <circle class="vx-node" cx="340" cy="322" r="20"/>
  <path class="vx-line vx-line--dim" d="M410 322H360M320 322H60" marker-end="url(#vx-arrow-${id})"/>
  ${label(385, 370, 'READ MODELS', 'middle')}
  ${label(40, 360, 'QUERIES')}`,
  );
}

function ledger(): string {
  const id = 'ledger';
  const rand = mulberry32(3);
  const phase = [rand() * 6, rand() * 6, rand() * 6];
  const curve = (offset: number, amp: number, k: number) =>
    Array.from({ length: 49 }, (_, i) => {
      const x = 40 + i * 11;
      const y = offset + Math.sin(i * 0.22 + phase[k]!) * amp + Math.sin(i * 0.61 + phase[(k + 1) % 3]!) * amp * 0.4;
      return { x, y };
    });
  const income = curve(180, 34, 0);
  const expense = curve(260, 30, 1);
  const toPath = (pts: { x: number; y: number }[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${f(p.x)} ${f(p.y)}`).join('');
  const recon = income
    .filter((_, i) => i % 4 === 0)
    .map((p, i) => `M${f(p.x)} ${f(p.y)}L${f(p.x)} ${f(expense[i * 4]!.y)}`)
    .join('');
  return frame(
    id,
    `${label(560, 60, 'ILLUSTRATIVE', 'end', 'vx-label--dim')}
  <path class="vx-recon" d="${recon}"/>
  <path class="vx-line vx-line--bold" d="${toPath(income)}"/>
  <path class="vx-line vx-line--hot vx-line--bold" d="${toPath(expense)}"/>
  <circle class="vx-dot" cx="${f(income.at(-1)!.x)}" cy="${f(income.at(-1)!.y)}" r="5"/>
  <circle class="vx-dot vx-dot--hot" cx="${f(expense.at(-1)!.x)}" cy="${f(expense.at(-1)!.y)}" r="5"/>
  ${label(40, 380, 'INCOME')}
  <rect class="vx-swatch" x="40" y="390" width="22" height="3"/>
  ${label(140, 380, 'EXPENSE')}
  <rect class="vx-swatch vx-swatch--hot" x="140" y="390" width="22" height="3"/>
  ${label(260, 380, 'RECONCILED')}
  <rect class="vx-swatch vx-swatch--dim" x="260" y="390" width="22" height="3"/>`,
  );
}

function converge(): string {
  const id = 'converge';
  const sources = [110, 220, 330];
  const rand = mulberry32(19);
  const flows = sources
    .map((y) => `<path class="vx-line vx-line--dim" d="M120 ${y}C220 ${y} 240 220 318 220"/>`)
    .join('');
  const dots = sources
    .flatMap((y, s) =>
      [0.2, 0.42, 0.64].map((t, k) => {
        // Point on the cubic flow curve, so dots sit exactly on their path.
        const u = 1 - t;
        const x = u ** 3 * 120 + 3 * u * u * t * 220 + 3 * u * t * t * 240 + t ** 3 * 318;
        const py = u ** 3 * y + 3 * u * u * t * y + 3 * u * t * t * 220 + t ** 3 * 220;
        const dup = (s + k) % 3 === 1;
        return `<rect class="vx-record ${dup ? 'vx-record--dup' : ''}" x="${f(x - 6)}" y="${f(py - 6)}" width="12" height="12" rx="2" transform="rotate(${f(rand() * 20 - 10)} ${f(x)} ${f(py)})"/>`;
      }),
    )
    .join('');
  const out = Array.from({ length: 6 }, (_, i) => {
    const y = 132 + i * 30;
    return `<rect class="vx-row" x="400" y="${y}" width="${150 - (i % 3) * 22}" height="16" rx="3"/>`;
  }).join('');
  return frame(
    id,
    `${sources.map((y, i) => `<rect class="vx-node" x="40" y="${y - 18}" width="80" height="36" rx="6"/>${label(80, y + 5, `SRC ${String.fromCharCode(65 + i)}`, 'middle')}`).join('')}
  ${flows}
  ${dots}
  <rect class="vx-gate" x="318" y="120" width="10" height="200" rx="5"/>
  ${label(323, 100, 'IDEMPOTENT MERGE', 'middle')}
  <path class="vx-line" d="M330 220H384" marker-end="url(#vx-arrow-${id})"/>
  ${out}
  ${label(400, 330, 'ONE RECORD EACH')}`,
  );
}

function gates(): string {
  const id = 'gates';
  const tracks = [
    { y: 160, name: 'REACTIVE' },
    { y: 300, name: 'BLOCKING' },
  ];
  const gateX = [230, 330, 430];
  return frame(
    id,
    `${tracks.map(({ y, name }) => `${label(40, y - 22, name)}<path class="vx-line vx-line--dim" d="M40 ${y}H560" marker-end="url(#vx-arrow-${id})"/>`).join('')}
  ${gateX.map((x, i) => `<rect class="vx-gate" x="${x - 4}" y="110" width="8" height="240" rx="4"/>${label(x, 92, `RULE ${String(i + 1).padStart(2, '0')}`, 'middle')}`).join('')}
  ${[70, 150, 280, 380, 500].map((x) => `<rect class="vx-payload" x="${x}" y="150" width="20" height="20" rx="3"/>`).join('')}
  ${[90, 190, 300].map((x) => `<rect class="vx-payload" x="${x}" y="290" width="20" height="20" rx="3"/>`).join('')}
  <rect class="vx-payload vx-payload--hot" x="404" y="290" width="20" height="20" rx="3"/>
  ${label(414, 340, 'REJECTED', 'middle', 'vx-label--hot')}
  ${label(560, 386, 'ONE DEFINITION · TWO EXECUTION MODELS', 'end', 'vx-label--dim')}`,
  );
}

function layers(): string {
  const names = ['INTERFACES', 'APPLICATION', 'DOMAIN', 'INFRASTRUCTURE'];
  const plates = names
    .map((name, i) => {
      const y = 112 + i * 72;
      const hot = name === 'DOMAIN';
      return `<polygon class="vx-plate ${hot ? 'vx-plate--hot' : ''}" points="110,${y} 270,${y - 56} 430,${y} 270,${y + 56}"/>
      <path class="vx-line vx-line--dim" d="M430 ${y}H470"/>${label(478, y + 5, name, 'start', hot ? 'vx-label--strong' : '')}`;
    })
    .join('');
  return frame('layers', `${plates}${label(40, 410, 'DDD · CQRS · EVENT SOURCING · IDEMPOTENCY', 'start', 'vx-label--dim')}`);
}

function segregation(): string {
  const id = 'segregation';
  const writes = [130, 250, 370].map((x) => `<circle class="vx-node" cx="${x}" cy="120" r="22"/><path class="vx-line vx-line--dim" d="M${x} 142V206" marker-end="url(#vx-arrow-${id})"/>`).join('');
  const reads = [130, 250, 370].map((x) => `<circle class="vx-node" cx="${x}" cy="320" r="22"/><path class="vx-line vx-line--dim" d="M${x} 232V296" marker-end="url(#vx-arrow-${id})"/>`).join('');
  const bus = Array.from({ length: 14 }, (_, i) => `<rect class="vx-event" x="${44 + i * 30}" y="212" width="12" height="16" rx="2" style="--i:${i}"/>`).join('');
  const cyl = (y: number, name: string) =>
    `<path class="vx-node" d="M480 ${y - 24}v48c0 9 22 16 46 16s46-7 46-16v-48"/><ellipse class="vx-node" cx="526" cy="${y - 24}" rx="46" ry="14"/>${label(526, y + 12, name, 'middle')}`;
  return frame(
    id,
    `${label(40, 72, 'WRITE SIDE')}
  ${writes}
  <path class="vx-line vx-line--hot" d="M40 220H460"/>
  ${bus}
  ${reads}
  ${label(40, 384, 'READ SIDE')}
  ${cyl(150, 'SQL')}
  ${cyl(310, 'NoSQL')}`,
  );
}

const VISUALS: Record<ProjectVisual, () => string> = {
  'event-fork': eventFork,
  ledger,
  converge,
  gates,
  layers,
  segregation,
};

export const projectVisual = (kind: ProjectVisual): string => VISUALS[kind]();

/** Plain-language captions, so each diagram says what it shows (and, for the ledger, what it isn't). */
export const visualCaption: Record<ProjectVisual, string> = {
  'event-fork': 'Commands pass through the aggregate and land in an append-only log. Read models are built from that log.',
  ledger: 'Illustrative curves, not real figures: income, expense and the reconciliation between them.',
  converge: 'Records from three sources go through one idempotent merge. Duplicates (outlined) end up as a single record.',
  gates: 'The same three rules run on the reactive path and the blocking path. One payload fails the third rule.',
  layers: 'The four layers of the template, with the domain layer in the middle where it belongs.',
  segregation: 'Writes and reads are split by an event stream, with SQL and NoSQL stores serving both sides.',
};

/* ---------- Lab figure glyphs (one per pipeline stage) ---------- */

const glyph = (body: string) => `<svg class="glyph" viewBox="0 0 120 80" aria-hidden="true" focusable="false">${body}</svg>`;

export const pipelineGlyphs: string[] = [
  // Leaf image
  glyph(
    `<path class="g-line" d="M20 64C24 30 56 12 100 14C96 52 66 70 20 64Z"/><path class="g-line g-line--thin" d="M20 64C44 48 70 30 100 14M48 52L44 34M64 42L62 24M78 32L84 20M40 56L58 58M58 46L76 50"/>`,
  ),
  // 9 augmentations
  glyph(
    Array.from({ length: 9 }, (_, i) => {
      const x = 30 + (i % 3) * 22;
      const y = 8 + Math.floor(i / 3) * 22;
      return `<rect class="g-tile" x="${x}" y="${y}" width="18" height="18" rx="2" transform="rotate(${(i % 4) * 7 - 10} ${x + 9} ${y + 9})" style="opacity:${f(0.35 + (i % 5) * 0.15)}"/>`;
    }).join(''),
  ),
  // VGG16: five convolutional blocks of shrinking spatial size
  glyph(
    [56, 48, 38, 28, 20]
      .map((h, i) => `<rect class="g-block" x="${10 + i * 21}" y="${40 - h / 2}" width="${14 - i}" height="${h}" rx="1.5"/>`)
      .join(''),
  ),
  // Spatial + channel attention
  glyph(
    `${Array.from({ length: 16 }, (_, i) => {
      const on = [5, 6, 9, 10, 11].includes(i);
      return `<rect class="g-cell ${on ? 'g-cell--on' : ''}" x="${10 + (i % 4) * 13}" y="${12 + Math.floor(i / 4) * 13}" width="11" height="11" rx="1"/>`;
    }).join('')}${[30, 18, 44, 24, 36, 12].map((h, i) => `<rect class="g-bar ${i === 2 ? 'g-bar--on' : ''}" x="${72 + i * 7}" y="${64 - h}" width="5" height="${h}" rx="1"/>`).join('')}`,
  ),
  // Classifier: 10 classes, one activated
  glyph(
    Array.from({ length: 10 }, (_, i) => {
      const h = i === 6 ? 56 : 6 + ((i * 7) % 11);
      return `<rect class="g-bar ${i === 6 ? 'g-bar--on' : ''}" x="${12 + i * 10}" y="${68 - h}" width="7" height="${h}" rx="1"/>`;
    }).join(''),
  ),
];

/** Markup that has already been escaped or is trusted (generated SVG, nested templates). */
export class Raw {
  constructor(readonly value: string) {}
  toString(): string {
    return this.value;
  }
}

export const raw = (value: string): Raw => new Raw(value);

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export const escape = (value: string): string => value.replace(/[&<>"']/g, (c) => ESCAPES[c] ?? c);

function serialise(value: unknown): string {
  if (value instanceof Raw) return value.value;
  if (Array.isArray(value)) return value.map(serialise).join('');
  if (value === null || value === undefined || value === false) return '';
  return escape(String(value));
}

/** Tagged template that escapes every interpolation unless it is `Raw`. */
export function html(strings: TemplateStringsArray, ...values: unknown[]): Raw {
  let out = strings[0] ?? '';
  values.forEach((value, i) => {
    out += serialise(value) + (strings[i + 1] ?? '');
  });
  return new Raw(out);
}

/** Splits text into words wrapped for masked line/word reveals. Text stays readable without JS. */
export function words(text: string, className = 'w'): Raw {
  return raw(
    text
      .split(' ')
      .map((word) => `<span class="${className}"><span class="${className}__i">${escape(word)}</span></span>`)
      .join(' '),
  );
}

export const pad = (n: number, width = 2): string => String(n).padStart(width, '0');

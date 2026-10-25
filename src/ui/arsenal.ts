/** Shows where a linked tool was used, on hover, focus or tap. */
export function initArsenal(): () => void {
  const readout = document.querySelector<HTMLElement>('[data-arsenal-readout]');
  const root = document.querySelector<HTMLElement>('.arsenal');
  if (!readout || !root) return () => {};

  const show = (event: Event) => {
    const item = (event.target as Element).closest<HTMLButtonElement>('button[data-uses]');
    if (!item) return;
    root.querySelectorAll('button[data-uses]').forEach((el) => el.setAttribute('aria-pressed', String(el === item)));
    const uses = (item.dataset.uses ?? '').split('|');
    readout.replaceChildren(
      Object.assign(document.createElement('strong'), { textContent: item.textContent ?? '' }),
      document.createTextNode(`: ${uses.join(', ')}.`),
    );
    // On narrow screens the main readout is far away, so the answer also appears under the group.
    const local = item.closest('.kit')?.querySelector<HTMLElement>('[data-kit-readout]');
    root.querySelectorAll<HTMLElement>('[data-kit-readout]').forEach((el) => {
      el.textContent = el === local ? `${item.textContent}: ${uses.join(', ')}.` : '';
    });
  };

  root.addEventListener('pointerover', show);
  root.addEventListener('focusin', show);
  root.addEventListener('click', show);
  return () => {
    root.removeEventListener('pointerover', show);
    root.removeEventListener('focusin', show);
    root.removeEventListener('click', show);
  };
}

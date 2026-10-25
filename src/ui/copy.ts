/**
 * Copy-to-clipboard buttons ([data-copy]). They only appear when the browser
 * can really copy (secure context with the Clipboard API), so nothing on the
 * page offers an action that silently fails.
 */
export function initCopy(): () => void {
  if (!window.isSecureContext || !navigator.clipboard) return () => {};
  document.documentElement.classList.add('can-copy');
  const status = document.querySelector('[data-copy-status]');
  const timers = new WeakMap<HTMLButtonElement, number>();

  const onClick = async (event: Event) => {
    const button = (event.target as Element).closest<HTMLButtonElement>('button[data-copy]');
    if (!button) return;
    const label = button.dataset.label ?? button.textContent ?? '';
    button.dataset.label = label;
    let message = 'Copied';
    try {
      await navigator.clipboard.writeText(button.dataset.copy ?? '');
      button.classList.add('is-done');
    } catch {
      message = 'Couldn’t copy';
    }
    button.textContent = message;
    if (status) status.textContent = message === 'Copied' ? 'Copied to clipboard' : 'Copy failed';
    window.clearTimeout(timers.get(button));
    timers.set(
      button,
      window.setTimeout(() => {
        button.textContent = label;
        button.classList.remove('is-done');
      }, 2000),
    );
  };

  document.addEventListener('click', onClick);
  return () => document.removeEventListener('click', onClick);
}

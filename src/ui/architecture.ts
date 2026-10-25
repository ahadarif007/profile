import { architectureNode } from '../content/systems';

export type ArchSource = 'user' | 'tour' | 'init';

/**
 * Node inspection for the systems diagram: select a component, light its data
 * paths. While "follow the request" is on, the motion layer sends `arch:goto`
 * as the packet reaches each component and the inspector narrates the trip.
 * Any manual selection hands control back to the reader.
 */
export function initArchitecture(initial = 'gate'): () => void {
  const root = document.querySelector<HTMLElement>('[data-arch]');
  if (!root) return () => {};

  const panel = root.querySelector<HTMLElement>('[data-arch-panel]');
  const title = root.querySelector<HTMLElement>('[data-arch-title]');
  const body = root.querySelector<HTMLElement>('[data-arch-body]');
  const tags = root.querySelector<HTMLElement>('[data-arch-tags]');
  const follow = root.querySelector<HTMLButtonElement>('[data-arch-follow]');
  let following = false;

  const setFollowing = (on: boolean) => {
    following = on;
    follow?.setAttribute('aria-pressed', String(on));
    if (follow) follow.textContent = on ? 'Following' : 'Follow along';
    // Narration would flood a screen reader every second, so only manual picks are announced.
    panel?.setAttribute('aria-live', on ? 'off' : 'polite');
  };

  const select = (id: string, source: ArchSource) => {
    const node = architectureNode(id);
    root.querySelectorAll<SVGGElement>('.arch-node').forEach((el) => {
      el.setAttribute('aria-pressed', String(el.dataset.node === id));
    });
    root.querySelectorAll<SVGPathElement>('.arch-edge').forEach((edge) => {
      edge.classList.toggle('is-live', edge.dataset.from === id || edge.dataset.to === id);
    });
    if (title) title.textContent = node.label;
    if (body) body.textContent = node.detail;
    if (tags) tags.replaceChildren(...node.usedIn.map((t) => Object.assign(document.createElement('li'), { textContent: t })));
    if (source !== 'init') root.dispatchEvent(new CustomEvent('arch:select', { bubbles: true, detail: { id, source } }));
  };

  const nodeFrom = (event: Event) => (event.target as Element).closest<SVGGElement>('.arch-node')?.dataset.node;

  const pick = (id: string) => {
    setFollowing(false);
    select(id, 'user');
  };
  const onClick = (event: Event) => {
    const id = nodeFrom(event);
    if (id) pick(id);
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const id = nodeFrom(event);
    if (!id) return;
    event.preventDefault();
    pick(id);
  };
  const onGoto = (event: Event) => {
    const id = (event as CustomEvent<string>).detail;
    if (following && id) select(id, 'tour');
  };
  const onFollow = () => setFollowing(!following);
  // The motion layer turns narration on when the packet animation exists, and off when it goes away.
  const onMotion = (event: Event) => setFollowing((event as CustomEvent<boolean>).detail);

  root.addEventListener('click', onClick);
  root.addEventListener('keydown', onKey);
  root.addEventListener('arch:goto', onGoto);
  follow?.addEventListener('click', onFollow);
  root.addEventListener('arch:follow', onMotion);
  setFollowing(false);
  select(initial, 'init');

  return () => {
    root.removeEventListener('click', onClick);
    root.removeEventListener('keydown', onKey);
    root.removeEventListener('arch:goto', onGoto);
    follow?.removeEventListener('click', onFollow);
    root.removeEventListener('arch:follow', onMotion);
  };
}

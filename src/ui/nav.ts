/** Mobile menu toggle for the floating navigation. */
export function initNav(): () => void {
  const nav = document.querySelector<HTMLElement>('[data-nav]');
  const toggle = nav?.querySelector<HTMLButtonElement>('[data-nav-toggle]');
  if (!nav || !toggle) return () => {};

  const setOpen = (open: boolean) => {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };

  const onToggle = () => setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  const onLink = (event: Event) => {
    if ((event.target as Element).closest('a')) setOpen(false);
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) {
      setOpen(false);
      toggle.focus();
    }
  };

  toggle.addEventListener('click', onToggle);
  nav.addEventListener('click', onLink);
  document.addEventListener('keydown', onKey);

  return () => {
    toggle.removeEventListener('click', onToggle);
    nav.removeEventListener('click', onLink);
    document.removeEventListener('keydown', onKey);
  };
}

/** Marks the nav link of the section currently in view (independent of motion preferences). */
export function initActiveSection(): () => void {
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('.nav__links a[href^="#"]'));
  // The hero is observed too, so no link is marked while the opening scene is in view.
  const targets = ['#boot', ...links.map((link) => link.hash)]
    .map((hash) => document.getElementById(hash.slice(1)))
    .filter((el): el is HTMLElement => el !== null);
  if (!targets.length) return () => {};

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        links.forEach((link) => link.setAttribute('aria-current', String(link.hash === `#${entry.target.id}`)));
      }
    },
    // A thin band across the middle of the viewport decides which chapter is "current".
    { rootMargin: '-45% 0px -54% 0px' },
  );
  targets.forEach((el) => observer.observe(el));
  return () => observer.disconnect();
}

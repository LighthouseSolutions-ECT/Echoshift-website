const header = document.querySelector('[data-site-header]');
const menuButton = document.querySelector('[data-menu-button]');
const navigation = document.querySelector('[data-navigation]');
const year = document.querySelector('[data-current-year]');

if (year) year.textContent = String(new Date().getFullYear());

const setHeaderState = () => {
  if (header) header.classList.toggle('is-scrolled', window.scrollY > 16);
};

setHeaderState();
window.addEventListener('scroll', setHeaderState, { passive: true });

const closeMenu = ({ restoreFocus = false } = {}) => {
  if (!menuButton || !navigation) return;
  const wasOpen = menuButton.getAttribute('aria-expanded') === 'true';
  if (restoreFocus && wasOpen) menuButton.focus();
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.querySelector('.sr-only').textContent = 'Open navigation';
  navigation.classList.remove('is-open');
  document.body.style.removeProperty('overflow');
};

if (menuButton && navigation) {
  menuButton.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!isOpen));
    menuButton.querySelector('.sr-only').textContent = isOpen ? 'Open navigation' : 'Close navigation';
    navigation.classList.toggle('is-open', !isOpen);
    document.body.style.overflow = isOpen ? '' : 'hidden';
  });

  navigation.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (menuButton.getAttribute('aria-expanded') !== 'true') {
        const group = document.activeElement?.closest('[data-nav-group]');
        if (group?.classList.contains('is-open')) group.querySelector('[data-nav-trigger]')?.focus();
      }
      closeMenu({ restoreFocus: true });
    }
  }, { capture: true });

  // A disclosure menu closes when keyboard focus moves back to page content.
  header.addEventListener('focusout', (event) => {
    if (event.relatedTarget && !header.contains(event.relatedTarget)) closeMenu();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 980) closeMenu();
  });
}

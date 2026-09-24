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

const closeMenu = () => {
  if (!menuButton || !navigation) return;
  menuButton.setAttribute('aria-expanded', 'false');
  navigation.classList.remove('is-open');
  document.body.style.removeProperty('overflow');
};

if (menuButton && navigation) {
  menuButton.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!isOpen));
    navigation.classList.toggle('is-open', !isOpen);
    document.body.style.overflow = isOpen ? '' : 'hidden';
  });

  navigation.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 980) closeMenu();
  });
}

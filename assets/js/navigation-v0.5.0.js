const groups = [...document.querySelectorAll('[data-nav-group]')];

function setGroupOpen(group, open) {
  group.classList.toggle('is-open', open);
  const trigger = group.querySelector('[data-nav-trigger]');
  if (trigger) trigger.setAttribute('aria-expanded', String(open));
}

function closeGroups(except = null) {
  groups.forEach(group => {
    if (group === except) return;
    setGroupOpen(group, false);
  });
}

groups.forEach(group => {
  const trigger = group.querySelector('[data-nav-trigger]');
  if (!trigger) return;

  trigger.addEventListener('click', event => {
    event.stopPropagation();
    const willOpen = !group.classList.contains('is-open');
    closeGroups(group);
    setGroupOpen(group, willOpen);
  });

  group.addEventListener('focusout', event => {
    if (!group.contains(event.relatedTarget)) setGroupOpen(group, false);
  });
});

document.addEventListener('click', () => closeGroups());
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeGroups();
});

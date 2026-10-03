// Versioned navigation disclosure behaviour. The existing site script continues
// to own the hamburger, Escape focus restoration and page-scroll locking.
const groups = [...document.querySelectorAll('[data-nav-group]')];
let pointerTrigger = null;

function setGroupOpen(group, open) {
  group.classList.toggle('is-open', open);
  group.querySelector('[data-nav-trigger]')?.setAttribute('aria-expanded', String(open));
}

function closeGroups(except = null) {
  groups.forEach(group => { if (group !== except) setGroupOpen(group, false); });
}

// On mobile, collapsing one inline disclosure during pointer focus can move
// the next trigger before the click lands. Defer that closure to its click.
document.addEventListener('pointerdown', event => {
  pointerTrigger = event.target.closest?.('[data-nav-trigger]') || null;
}, { capture: true });

function endPointer() { setTimeout(() => { pointerTrigger = null; }, 0); }
document.addEventListener('pointerup', endPointer, { capture: true });
document.addEventListener('pointercancel', endPointer, { capture: true });

groups.forEach(group => {
  const trigger = group.querySelector('[data-nav-trigger]');
  if (!trigger) return;
  trigger.addEventListener('click', event => {
    event.stopPropagation();
    const open = !group.classList.contains('is-open');
    closeGroups(group);
    setGroupOpen(group, open);
    pointerTrigger = null;
  });
  group.addEventListener('focusout', event => {
    if (event.relatedTarget === pointerTrigger && pointerTrigger) return;
    if (!group.contains(event.relatedTarget)) setGroupOpen(group, false);
  });
});

document.addEventListener('click', () => closeGroups());
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeGroups();
});

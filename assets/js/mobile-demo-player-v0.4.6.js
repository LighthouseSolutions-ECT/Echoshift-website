const demo = document.querySelector('[data-hero-demo]');
const demoColumn = demo?.closest('.hero__demo-column');
const heroCopy = document.querySelector('.hero__copy');
const heroActions = heroCopy?.querySelector('.hero__actions');
const minimise = demo?.querySelector('[data-demo-minimise]');
const replay = demo?.querySelector('[data-demo-replay]');
const toggle = demo?.querySelector('[data-demo-toggle]');
const inlineReopen = document.querySelector('[data-demo-inline-reopen]');
const mini = document.querySelector('[data-demo-mini]');
const miniStage = mini?.querySelector('[data-demo-mini-stage]');
const miniState = mini?.querySelector('[data-demo-mini-state]');
const miniResume = mini?.querySelector('[data-demo-mini-resume]');
const miniRestart = mini?.querySelector('[data-demo-mini-restart]');
const miniClose = mini?.querySelector('[data-demo-mini-close]');
const announcer = document.querySelector('[data-demo-player-announcer]');
const finalCta = document.querySelector('#pilot');
const mobile = window.matchMedia('(max-width: 820px)');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (demo && demoColumn && heroCopy && heroActions && mini) {
  const originalParent = demoColumn.parentNode;
  const originalNextSibling = demoColumn.nextSibling;
  const phaseTitles = [
    'What EchoShift is',
    'Where we listen',
    'The world is noisy',
    'We keep what matters',
    'We find developing conditions',
    'Actionable clarity',
  ];

  let isMinimised = false;
  let isClosed = false;
  let finalCtaVisible = false;

  const heroApi = () => window.echoShiftHeroDemo;
  const state = () => heroApi()?.getState?.() ?? ({ phase: Number(demo.dataset.phase || 1), isPaused: true, hasCompleted: false, isJourneyHeld: true });

  const announce = (message) => {
    if (announcer) announcer.textContent = message;
  };

  const updateMini = () => {
    const current = state();
    const phase = Math.min(Math.max(Number(current.phase || demo.dataset.phase || 1), 1), 6);
    if (miniStage) miniStage.textContent = `${String(phase).padStart(2, '0')} · ${phaseTitles[phase - 1]}`;
    if (miniState) miniState.textContent = current.hasCompleted ? 'Demonstration complete' : 'Demonstration paused';
    mini.classList.toggle('is-complete', Boolean(current.hasCompleted));
    mini.classList.toggle('is-suppressed', finalCtaVisible);
  };

  const pauseForMinimise = () => {
    const current = state();
    if (!current.hasCompleted && !current.isPaused && !current.isJourneyHeld) toggle?.click();
  };

  const placeForBreakpoint = () => {
    if (mobile.matches) {
      if (demoColumn.parentNode !== heroCopy) heroCopy.insertBefore(demoColumn, heroActions);
      demoColumn.dataset.mobilePlayer = '';
    } else {
      mini.hidden = true;
      if (inlineReopen) inlineReopen.hidden = true;
      document.body.classList.remove('has-mobile-demo-mini');
      demoColumn.classList.remove('is-minimised', 'is-closed');
      isMinimised = false;
      isClosed = false;
      if (demoColumn.parentNode !== originalParent) {
        if (originalNextSibling && originalNextSibling.parentNode === originalParent) originalParent.insertBefore(demoColumn, originalNextSibling);
        else originalParent.appendChild(demoColumn);
      }
      delete demoColumn.dataset.mobilePlayer;
    }
  };

  const minimisePlayer = () => {
    if (!mobile.matches || isClosed) return;
    pauseForMinimise();
    isMinimised = true;
    demoColumn.classList.add('is-minimised');
    demoColumn.classList.remove('is-closed');
    if (inlineReopen) inlineReopen.hidden = false;
    mini.hidden = false;
    document.body.classList.add('has-mobile-demo-mini');
    window.requestAnimationFrame(() => {
      document.body.style.setProperty('--mobile-demo-mini-height', `${Math.ceil(mini.getBoundingClientRect().height)}px`);
      updateMini();
    });
    announce('EchoShift demonstration minimised and paused.');
  };

  const scrollPlayerIntoView = async () => {
    demo.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
    await new Promise((resolve) => window.setTimeout(resolve, reduceMotion.matches ? 30 : 520));
    demo.focus({ preventScroll: true });
  };

  const expandPlayer = async ({ restart = false } = {}) => {
    if (!mobile.matches) return;
    isClosed = false;
    isMinimised = false;
    demoColumn.classList.remove('is-minimised', 'is-closed');
    if (inlineReopen) inlineReopen.hidden = true;
    mini.hidden = true;
    document.body.classList.remove('has-mobile-demo-mini');
    await scrollPlayerIntoView();
    const current = state();
    if (restart) replay?.click();
    else if (current.isJourneyHeld || (current.isPaused && !current.hasCompleted)) toggle?.click();
    announce(restart ? 'EchoShift demonstration restarted.' : 'EchoShift demonstration resumed.');
  };

  const closePlayer = () => {
    pauseForMinimise();
    isClosed = true;
    isMinimised = false;
    demoColumn.classList.remove('is-minimised');
    demoColumn.classList.add('is-closed');
    if (inlineReopen) inlineReopen.hidden = true;
    mini.hidden = true;
    document.body.classList.remove('has-mobile-demo-mini');
    announce('EchoShift demonstration closed for this visit.');
  };

  minimise?.addEventListener('click', minimisePlayer);
  inlineReopen?.addEventListener('click', () => expandPlayer());
  miniResume?.addEventListener('click', () => expandPlayer());
  miniRestart?.addEventListener('click', () => expandPlayer({ restart: true }));
  miniClose?.addEventListener('click', closePlayer);

  demo.addEventListener('echoshift:phasechange', updateMini);
  toggle?.addEventListener('click', () => window.setTimeout(updateMini, 0));
  replay?.addEventListener('click', () => window.setTimeout(updateMini, 0));

  const finalObserver = finalCta && 'IntersectionObserver' in window
    ? new IntersectionObserver(([entry]) => {
        finalCtaVisible = entry.isIntersecting;
        updateMini();
      }, { threshold: .08 })
    : null;
  if (finalCta) finalObserver?.observe(finalCta);

  const handleBreakpoint = () => {
    placeForBreakpoint();
    if (mobile.matches && isMinimised && !isClosed) {
      mini.hidden = false;
      document.body.classList.add('has-mobile-demo-mini');
      updateMini();
    }
  };

  mobile.addEventListener?.('change', handleBreakpoint);
  window.addEventListener('resize', () => {
    if (!mini.hidden) document.body.style.setProperty('--mobile-demo-mini-height', `${Math.ceil(mini.getBoundingClientRect().height)}px`);
  }, { passive: true });

  placeForBreakpoint();
  updateMini();
}

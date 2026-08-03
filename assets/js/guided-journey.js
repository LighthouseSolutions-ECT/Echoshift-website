const demo = document.querySelector('[data-hero-demo]');
const demoEntry = document.querySelector('[data-demo-entry]');
const demoHandoff = document.querySelector('.section-handoff--demo');
const handoffs = [...document.querySelectorAll('[data-section-handoff]')];
const mobileJourney = window.matchMedia('(max-width: 820px)');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const requestedStage = Number(new URLSearchParams(window.location.search).get('demoStage'));
const isQaStage = Number.isInteger(requestedStage) && requestedStage >= 1 && requestedStage <= 6;

let heroApi = window.echoShiftHeroDemo ?? null;
let demoHasStarted = false;
let demoObserver = null;

const targetFromHash = (hash) => {
  if (!hash || hash === '#') return null;
  try {
    return document.querySelector(hash);
  } catch {
    return null;
  }
};

const focusTarget = (target) => {
  if (!target) return;
  const focusTargetElement = target.matches('#demonstration')
    ? target
    : target.querySelector('h1, h2, h3') ?? target;

  if (!focusTargetElement.hasAttribute('tabindex') && !focusTargetElement.matches('a, button, input, select, textarea')) {
    focusTargetElement.setAttribute('tabindex', '-1');
    focusTargetElement.dataset.guidedFocus = 'temporary';
  }

  focusTargetElement.focus({ preventScroll: true });

  if (focusTargetElement.dataset.guidedFocus === 'temporary') {
    focusTargetElement.addEventListener('blur', () => {
      focusTargetElement.removeAttribute('tabindex');
      delete focusTargetElement.dataset.guidedFocus;
    }, { once: true });
  }
};

const waitForScrollToSettle = (timeout = 1400) => new Promise((resolve) => {
  if (reduceMotion.matches) {
    window.setTimeout(resolve, 40);
    return;
  }

  let settleTimer = null;
  let maxTimer = null;

  const finish = () => {
    window.removeEventListener('scroll', onScroll);
    if (settleTimer) window.clearTimeout(settleTimer);
    if (maxTimer) window.clearTimeout(maxTimer);
    resolve();
  };

  const onScroll = () => {
    if (settleTimer) window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(finish, 150);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  settleTimer = window.setTimeout(finish, 180);
  maxTimer = window.setTimeout(finish, timeout);
});

const scrollToTarget = async (target, { updateHistory = true } = {}) => {
  if (!target) return;

  const hash = target.id ? `#${target.id}` : null;
  if (updateHistory && hash && window.location.hash !== hash) {
    try {
      window.history.pushState({ echoshiftGuidedJourney: true }, '', hash);
    } catch {
      window.location.hash = hash;
    }
  }

  target.scrollIntoView({
    behavior: reduceMotion.matches ? 'auto' : 'smooth',
    block: 'start',
  });

  await waitForScrollToSettle();
  focusTarget(target);
};

const startDemoFromEntry = async (event) => {
  event?.preventDefault();
  if (!demo) return;

  await scrollToTarget(demo);

  if (!reduceMotion.matches) {
    heroApi?.startFromBeginning();
    demoHasStarted = true;
  }
};

const handleHandoff = async (event) => {
  const link = event.currentTarget;
  const target = targetFromHash(link.getAttribute('href'));
  if (!target) return;

  event.preventDefault();
  await scrollToTarget(target);
};

const updateDemoHandoff = (phase) => {
  demoHandoff?.classList.toggle('is-ready', Number(phase) === 6);
};

const configureDemoObserver = () => {
  demoObserver?.disconnect();
  demoObserver = null;

  if (!demo || !heroApi || !mobileJourney.matches || reduceMotion.matches || isQaStage) return;

  demoObserver = new IntersectionObserver((entries) => {
    const entry = entries[0];
    const isMeaningfullyVisible = entry.isIntersecting && entry.intersectionRatio >= 0.35;

    if (isMeaningfullyVisible) {
      if (!demoHasStarted) {
        const currentState = heroApi.getState();
        if (currentState.isJourneyHeld) {
          heroApi.startFromBeginning();
        }
        demoHasStarted = true;
      } else {
        heroApi.resumeFromViewport();
      }
    } else if (demoHasStarted) {
      heroApi.pauseForViewport();
    }
  }, {
    threshold: [0, 0.35, 0.7],
  });

  demoObserver.observe(demo);
};

const bindHeroApi = (api) => {
  if (!api) return;
  heroApi = api;
  configureDemoObserver();
};


// Any direct interaction with the demonstration is intentional. Mark it as
// started so the mobile intersection observer never resets a selected stage.
demo?.querySelectorAll('[data-phase-target], [data-demo-toggle], [data-demo-replay]').forEach((control) => {
  control.addEventListener('click', () => {
    window.setTimeout(() => {
      if (!heroApi?.getState().isJourneyHeld) demoHasStarted = true;
    }, 0);
  });
});

demoEntry?.addEventListener('click', startDemoFromEntry);
handoffs.forEach((handoff) => handoff.addEventListener('click', handleHandoff));

demo?.addEventListener('echoshift:phasechange', (event) => {
  updateDemoHandoff(event.detail?.phase);
});

window.addEventListener('echoshift:hero-ready', (event) => {
  bindHeroApi(event.detail);
});

mobileJourney.addEventListener?.('change', () => {
  if (!mobileJourney.matches) demoHasStarted = true;
  else demoHasStarted = false;
  configureDemoObserver();
});

reduceMotion.addEventListener?.('change', configureDemoObserver);

window.addEventListener('popstate', async () => {
  const target = targetFromHash(window.location.hash);
  if (target) await scrollToTarget(target, { updateHistory: false });
});

bindHeroApi(heroApi);
updateDemoHandoff(demo?.dataset.phase);

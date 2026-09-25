const demo = document.querySelector('[data-hero-demo]');

if (demo) {
  const phaseNumber = demo.querySelector('[data-phase-number]');
  const phaseTitle = demo.querySelector('[data-phase-title]');
  const phaseCaption = demo.querySelector('[data-phase-caption]');
  const phaseSubcaption = demo.querySelector('[data-phase-subcaption]');
  const chapterNumber = demo.querySelector('[data-chapter-number]');
  const chapterTitle = demo.querySelector('[data-chapter-title]');
  const state = demo.querySelector('[data-demo-state]');
  const toggle = demo.querySelector('[data-demo-toggle]');
  const replay = demo.querySelector('[data-demo-replay]');
  const phaseButtons = [...demo.querySelectorAll('[data-phase-target]')];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobileJourney = window.matchMedia('(max-width: 820px)');
  const viewport = demo.querySelector('.hero-demo__viewport');
  const machine = demo.querySelector('.hero-demo__machine');

  // One coordinate map, measured against the intrinsic 1320 × 750 motor image.
  // The observation markers and shaft pulse therefore share the same geometry.
  const motorLandmarks = Object.freeze({
    shaft: { x: 0.194, y: 0.621 },
    driveEndBearing: { x: 0.224, y: 0.604 },
    frameCentre: { x: 0.515, y: 0.438 },
  });

  const updateLandmarkGeometry = () => {
    if (!viewport || !machine) return;
    const viewportRect = viewport.getBoundingClientRect();
    const machineRect = machine.getBoundingClientRect();
    if (!viewportRect.width || !viewportRect.height || !machineRect.width || !machineRect.height) return;

    const placeInViewport = (name, point) => {
      const x = machineRect.left - viewportRect.left + machineRect.width * point.x;
      const y = machineRect.top - viewportRect.top + machineRect.height * point.y;
      demo.style.setProperty(`--${name}-x`, `${x.toFixed(2)}px`);
      demo.style.setProperty(`--${name}-y`, `${y.toFixed(2)}px`);
    };

    placeInViewport('primary', motorLandmarks.driveEndBearing);
    placeInViewport('secondary', motorLandmarks.frameCentre);
    machine.style.setProperty('--shaft-x', `${motorLandmarks.shaft.x * 100}%`);
    machine.style.setProperty('--shaft-y', `${motorLandmarks.shaft.y * 100}%`);
  };

  const landmarkObserver = 'ResizeObserver' in window
    ? new ResizeObserver(() => updateLandmarkGeometry())
    : null;
  landmarkObserver?.observe(viewport);
  landmarkObserver?.observe(machine);
  window.addEventListener('resize', updateLandmarkGeometry, { passive: true });

  // V0.4.3 preserves the approved V0.4 sequence and the V0.4.2 geometry.
  // This pass changes only approved customer-facing copy and text hierarchy.
  const phases = [
    {
      number: '01',
      title: 'What EchoShift is',
      caption: 'Machine vibration, environmental reference and operating context — interpreted together.',
      subcaption: 'Illustrative 18.5 kW squirrel-cage induction motor',
      duration: 4800,
    },
    {
      number: '02',
      title: 'Where we listen',
      caption: 'Two machine measurement nodes observe structural behaviour, with a separate environmental reference.',
      subcaption: 'DE bearing node · frame-centre node · environmental reference',
      duration: 5300,
    },
    {
      number: '03',
      title: 'The world is noisy',
      caption: 'Real-world vibration and surrounding activity reach the machine together.',
      subcaption: 'Adjacent equipment · structural transfer · changing loads',
      duration: 7200,
    },
    {
      number: '04',
      title: 'We keep what matters',
      caption: 'EchoShift separates surrounding disturbance from retained machine evidence.',
      subcaption: 'Filtered disturbance · retained machine evidence',
      duration: 6400,
    },
    {
      number: '05',
      title: 'We find developing conditions',
      caption: 'Sustained 1× evidence, cross-location agreement and confidence build together.',
      subcaption: 'Sustained evidence builds before a clear advisory is issued.',
      duration: 7600,
    },
    {
      number: '06',
      title: 'Actionable clarity',
      caption: 'Clear condition insight. Action with confidence.',
      subcaption: 'Trend · evidence · confidence',
      duration: null,
    },
  ];

  const titleLeadMs = 320;
  let currentPhase = 1;
  let phaseTimer = null;
  let announcementTimer = null;
  let contentTimer = null;
  let visualTimer = null;
  let phaseStartedAt = 0;
  let phaseRemaining = phases[0].duration;
  let isPaused = false;
  let hasCompleted = false;
  let visibilitySuspended = false;
  let isJourneyHeld = false;
  let isViewportSuspended = false;

  const clearPhaseTimer = () => {
    if (phaseTimer) window.clearTimeout(phaseTimer);
    phaseTimer = null;
  };

  const clearTransientTimers = () => {
    if (announcementTimer) window.clearTimeout(announcementTimer);
    if (contentTimer) window.clearTimeout(contentTimer);
    if (visualTimer) window.clearTimeout(visualTimer);
    announcementTimer = null;
    contentTimer = null;
    visualTimer = null;
  };

  const updateToggle = () => {
    if (!toggle) return;
    const label = hasCompleted ? 'Replay' : isJourneyHeld || isPaused ? 'Play' : 'Pause';
    toggle.textContent = label;
    toggle.setAttribute(
      'aria-label',
      hasCompleted
        ? 'Replay machine demonstration'
        : isJourneyHeld
          ? 'Start machine demonstration'
          : isPaused
            ? 'Resume machine demonstration'
            : 'Pause machine demonstration',
    );
  };

  const updateStepButtons = (phase) => {
    phaseButtons.forEach((button) => {
      const active = Number(button.dataset.phaseTarget) === phase;
      button.parentElement?.classList.toggle('is-active', active);
      if (active) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
  };

  const setTextContent = (item) => {
    if (phaseNumber) phaseNumber.textContent = item.number;
    if (phaseTitle) phaseTitle.textContent = item.title;
    if (phaseCaption) phaseCaption.textContent = item.caption;
    if (phaseSubcaption) phaseSubcaption.textContent = item.subcaption;
    if (chapterNumber) chapterNumber.textContent = item.number;
    if (chapterTitle) chapterTitle.textContent = item.title;
  };

  const announcePhase = (item) => {
    demo.classList.remove('is-announcing');
    void demo.offsetWidth;

    // Stay visible until near the end of the stage. The final chapter receives
    // a calm five-second introduction before settling to the advisory.
    const chapterDuration = item.duration
      ? Math.max(3600, item.duration - 620)
      : 5200;
    demo.style.setProperty('--chapter-duration', `${chapterDuration}ms`);
    demo.classList.add('is-announcing');

    announcementTimer = window.setTimeout(() => {
      demo.classList.remove('is-announcing');
    }, chapterDuration + 40);
  };

  const applyVisualPhase = (phase) => {
    const item = phases[phase - 1];
    demo.dataset.phase = String(phase);
    demo.style.setProperty('--phase-duration', item.duration ? `${item.duration}ms` : '0ms');
    demo.classList.toggle('is-complete', phase === phases.length);
    demo.dispatchEvent(new CustomEvent('echoshift:phasechange', { detail: { phase } }));
    window.requestAnimationFrame(updateLandmarkGeometry);
  };

  const scheduleNext = (remaining = phases[currentPhase - 1].duration) => {
    clearPhaseTimer();
    if (isPaused || hasCompleted || reduceMotion.matches || visibilitySuspended || !remaining) return;

    phaseRemaining = remaining;
    phaseStartedAt = performance.now();

    phaseTimer = window.setTimeout(() => {
      if (currentPhase >= phases.length) return;

      currentPhase += 1;
      hasCompleted = currentPhase === phases.length;
      phaseRemaining = phases[currentPhase - 1].duration;
      startPhase(currentPhase);
    }, remaining);
  };

  const startPhase = (phase, { immediate = false, announce = true } = {}) => {
    clearPhaseTimer();
    clearTransientTimers();
    currentPhase = Math.min(Math.max(phase, 1), phases.length);
    hasCompleted = currentPhase === phases.length;
    phaseRemaining = phases[currentPhase - 1].duration;
    const item = phases[currentPhase - 1];

    demo.classList.add('is-content-refreshing');
    setTextContent(item);
    updateStepButtons(currentPhase);
    if (announce && !reduceMotion.matches) announcePhase(item);

    const commit = () => {
      applyVisualPhase(currentPhase);
      window.requestAnimationFrame(() => demo.classList.remove('is-content-refreshing'));

      if (hasCompleted) {
        if (state) state.textContent = 'Demonstration complete';
        updateToggle();
      } else if (!isPaused) {
        if (state) state.textContent = 'Demonstration running';
        scheduleNext();
      }
    };

    if (immediate) commit();
    else visualTimer = window.setTimeout(commit, titleLeadMs);
  };

  const pauseTimeline = () => {
    if (!phaseTimer || hasCompleted) {
      clearPhaseTimer();
      return;
    }
    const elapsed = performance.now() - phaseStartedAt;
    phaseRemaining = Math.max(350, phaseRemaining - elapsed);
    clearPhaseTimer();
  };

  const setPhase = (phase, { manual = false, immediate = false } = {}) => {
    clearPhaseTimer();
    clearTransientTimers();
    currentPhase = Math.min(Math.max(phase, 1), phases.length);
    hasCompleted = currentPhase === phases.length;
    phaseRemaining = phases[currentPhase - 1].duration;

    if (manual) {
      isJourneyHeld = false;
      isViewportSuspended = false;
      visibilitySuspended = false;
      demo.classList.remove('is-journey-held', 'is-viewport-suspended');
      isPaused = true;
      demo.classList.add('is-paused');
      if (state) state.textContent = hasCompleted ? 'Final state selected' : 'Stage selected';
    } else {
      isPaused = false;
      demo.classList.remove('is-paused');
    }

    startPhase(currentPhase, { immediate, announce: true });
    updateToggle();
  };

  const restart = () => {
    clearPhaseTimer();
    clearTransientTimers();
    isPaused = false;
    hasCompleted = false;
    visibilitySuspended = false;
    isJourneyHeld = false;
    isViewportSuspended = false;
    demo.classList.remove('is-paused', 'is-journey-held', 'is-viewport-suspended', 'is-complete', 'is-announcing', 'is-content-refreshing');
    demo.dataset.phase = '0';
    if (state) state.textContent = 'Demonstration running';
    updateToggle();

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => startPhase(1));
    });
  };

  const prepareForMobileJourney = () => {
    if (reduceMotion.matches || !mobileJourney.matches) return;
    clearPhaseTimer();
    clearTransientTimers();
    isPaused = false;
    hasCompleted = false;
    isJourneyHeld = true;
    isViewportSuspended = false;
    visibilitySuspended = true;
    phaseRemaining = phases[0].duration;
    demo.classList.remove('is-complete', 'is-announcing', 'is-content-refreshing');
    demo.classList.add('is-paused', 'is-journey-held');
    startPhase(1, { immediate: true, announce: false });
    if (state) state.textContent = 'Ready to begin';
    updateToggle();
  };

  const pauseForViewport = () => {
    if (reduceMotion.matches || isJourneyHeld || isPaused || hasCompleted || visibilitySuspended) return;
    isViewportSuspended = true;
    visibilitySuspended = true;
    pauseTimeline();
    demo.classList.add('is-paused', 'is-viewport-suspended');
  };

  const resumeFromViewport = () => {
    if (reduceMotion.matches || isJourneyHeld || isPaused || hasCompleted || !isViewportSuspended) return;
    isViewportSuspended = false;
    visibilitySuspended = false;
    demo.classList.remove('is-viewport-suspended', 'is-paused');
    if (state) state.textContent = 'Demonstration running';
    scheduleNext(phaseRemaining);
  };

  const heroApi = Object.freeze({
    startFromBeginning: restart,
    prepareForMobileJourney,
    pauseForViewport,
    resumeFromViewport,
    getState: () => ({
      phase: currentPhase,
      isPaused,
      hasCompleted,
      isJourneyHeld,
      isViewportSuspended,
    }),
  });

  window.echoShiftHeroDemo = heroApi;

  toggle?.addEventListener('click', () => {
    if (isJourneyHeld) {
      restart();
      return;
    }

    if (hasCompleted) {
      restart();
      return;
    }

    isPaused = !isPaused;
    demo.classList.toggle('is-paused', isPaused);
    if (state) state.textContent = isPaused ? 'Demonstration paused' : 'Demonstration running';
    updateToggle();

    if (isPaused) pauseTimeline();
    else scheduleNext(phaseRemaining);
  });

  replay?.addEventListener('click', restart);

  phaseButtons.forEach((button) => {
    button.addEventListener('click', () => {
      setPhase(Number(button.dataset.phaseTarget), { manual: true, immediate: true });
    });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && !hasCompleted && !isPaused && !isJourneyHeld) {
      visibilitySuspended = true;
      pauseTimeline();
    } else if (!document.hidden && visibilitySuspended && !isPaused && !hasCompleted && !isJourneyHeld && !isViewportSuspended) {
      visibilitySuspended = false;
      scheduleNext(phaseRemaining);
    }
  });

  const applyMotionPreference = () => {
    if (reduceMotion.matches) {
      clearPhaseTimer();
      clearTransientTimers();
      isPaused = true;
      hasCompleted = true;
      demo.classList.add('is-paused', 'is-complete');
      currentPhase = 6;
      setTextContent(phases[5]);
      applyVisualPhase(6);
      updateStepButtons(6);
      if (state) state.textContent = 'Static final state';
      updateToggle();
      return;
    }

    // A direct-stage query is used only for deterministic visual QA and does
    // not alter the normal visitor experience.
    const requestedStage = Number(new URLSearchParams(window.location.search).get('demoStage'));
    if (Number.isInteger(requestedStage) && requestedStage >= 1 && requestedStage <= phases.length) {
      setPhase(requestedStage, { manual: true, immediate: true });
    } else if (mobileJourney.matches && demo.hasAttribute('data-mobile-guided')) {
      prepareForMobileJourney();
    } else {
      restart();
    }
  };

  const handleJourneyBreakpoint = () => {
    if (reduceMotion.matches) return;
    const requestedStage = Number(new URLSearchParams(window.location.search).get('demoStage'));
    if (Number.isInteger(requestedStage) && requestedStage >= 1 && requestedStage <= phases.length) return;

    if (mobileJourney.matches && demo.hasAttribute('data-mobile-guided')) {
      prepareForMobileJourney();
    } else if (isJourneyHeld) {
      restart();
    }
  };

  reduceMotion.addEventListener?.('change', applyMotionPreference);
  mobileJourney.addEventListener?.('change', handleJourneyBreakpoint);
  updateLandmarkGeometry();
  applyMotionPreference();
  window.dispatchEvent(new CustomEvent('echoshift:hero-ready', { detail: heroApi }));
}

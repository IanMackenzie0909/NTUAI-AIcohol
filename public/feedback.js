// Count the feedback percentages once, when the statistics enter the viewport.
(() => {
    const stats = document.querySelector('.feedback-stats');
    if (!stats) return;

    const counters = Array.from(stats.querySelectorAll('[data-count-to]'));
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!counters.length || motionPreference.matches || !('IntersectionObserver' in window)) return;

    let frame = null;
    let observer = null;
    let celebrationTimer = null;
    let celebrations = [];
    let preparedBursts = [];
    const clearCelebration = () => {
        if (celebrationTimer !== null) window.clearTimeout(celebrationTimer);
        celebrationTimer = null;
        celebrations.forEach(effect => effect.remove());
        celebrations = [];
        counters.forEach(counter => counter.classList.remove('is-celebrating'));
    };
    const prepareBurst = () => {
        const burst = document.createElement('span');
        burst.className = 'feedback-celebration';
        burst.setAttribute('aria-hidden', 'true');
        for (let i = 0; i < 16; i++) {
            const particle = document.createElement('span');
            const angle = (i / 16) * Math.PI * 2;
            const radius = 3.2 + (i % 3) * 0.6;
            particle.className = 'feedback-confetti';
            particle.style.setProperty('--burst-x', `${(Math.cos(angle) * radius).toFixed(2)}rem`);
            particle.style.setProperty('--burst-y', `${(Math.sin(angle) * radius * 0.7 - 1).toFixed(2)}rem`);
            particle.style.setProperty('--burst-spin', `${120 + i * 47}deg`);
            burst.appendChild(particle);
        }
        return burst;
    };
    const celebrate = (counter, index) => {
        counter.classList.add('is-celebrating');
        const burst = preparedBursts[index];
        counter.parentElement.appendChild(burst);
        celebrations.push(burst);
    };
    const showFinalValues = (withCelebration = false) => {
        if (frame !== null) cancelAnimationFrame(frame);
        frame = null;
        counters.forEach(counter => {
            counter.textContent = `${counter.dataset.countTo}+%`;
            counter.style.setProperty('--feedback-count-scale', '1');
            counter.classList.remove('is-counting');
        });
        observer?.disconnect();
        clearCelebration();
        if (withCelebration && !motionPreference.matches) {
            counters.forEach(celebrate);
            preparedBursts = [];
            celebrationTimer = window.setTimeout(() => {
                clearCelebration();
                motionPreference.removeEventListener('change', onMotionChange);
            }, 1400);
        } else {
            preparedBursts = [];
            motionPreference.removeEventListener('change', onMotionChange);
        }
    };
    const onMotionChange = event => {
        if (event.matches) showFinalValues();
    };
    motionPreference.addEventListener('change', onMotionChange);

    counters.forEach(counter => {
        counter.textContent = '0+%';
        counter.style.setProperty('--feedback-count-scale', '0.82');
        counter.classList.add('is-counting');
    });
    observer = new IntersectionObserver(entries => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        observer.disconnect();
        // Build particles off the page before counting, keeping the final frame light.
        preparedBursts = counters.map(prepareBurst);

        let start = null;
        const tick = timestamp => {
            if (start === null) start = timestamp;
            const progress = Math.min((timestamp - start) / 2200, 1);
            counters.forEach(counter => {
                const target = Number(counter.dataset.countTo);
                // Keep moving through the last numbers, then burst in the final frame.
                const value = progress < 1 ? Math.min(target - 1, Math.floor(target * progress)) : target;
                counter.textContent = `${value}+%`;
                counter.style.setProperty('--feedback-count-scale', String(0.82 + 0.18 * progress));
            });
            if (progress < 1) frame = requestAnimationFrame(tick);
            else showFinalValues(true);
        };
        frame = requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    observer.observe(stats);
})();

// Continuously move one original quote group and one inaccessible visual copy.
(() => {
    const carousel = document.querySelector('[data-feedback-carousel]');
    if (!carousel) return;

    const viewport = carousel.querySelector('.feedback-marquee-viewport');
    const track = carousel.querySelector('.feedback-marquee-track');
    const original = carousel.querySelector('.feedback-quotes');
    if (!viewport || !track || !original) return;

    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pixelsPerSecond = 16;
    let copy = null;
    let loopDistance = 0;
    let hasFocus = false;
    let hovered = false;
    let inViewport = false;
    let resizeFrame = null;

    function syncPlayback() {
        const running = copy && !motionPreference.matches &&
            !hasFocus && !hovered && inViewport && !document.hidden;
        track.style.animationPlayState = running ? 'running' : 'paused';
    }

    function measureLoop() {
        if (!copy) return;
        const animation = track.getAnimations?.()[0];
        const oldDuration = loopDistance / pixelsPerSecond * 1000;
        const phase = animation && oldDuration > 0
            ? ((Number(animation.currentTime) || 0) % oldDuration) / oldDuration : 0;
        // Two groups must still fill the viewport at the very end of a cycle.
        // Let the three cards share extra width on larger desktop containers.
        track.style.setProperty('--feedback-marquee-min-width', viewport.getBoundingClientRect().width + 'px');
        // Both groups receive the same transform, so subtracting their positions
        // gives the precise loop distance, including the gap at the seam.
        const distance = copy.getBoundingClientRect().left - original.getBoundingClientRect().left;
        if (distance <= 0) return;
        loopDistance = distance;
        const duration = distance / pixelsPerSecond;
        track.style.setProperty('--feedback-marquee-distance', distance + 'px');
        track.style.setProperty('--feedback-marquee-duration', duration + 's');
        // Keep the same position within the sequence after responsive card widths
        // change instead of restarting from the first quote.
        const resizedAnimation = track.getAnimations?.()[0];
        if (resizedAnimation) resizedAnimation.currentTime = phase * duration * 1000;
    }

    function enableMotion() {
        if (copy || motionPreference.matches) return;
        copy = original.cloneNode(true);
        copy.classList.add('feedback-copy');
        copy.removeAttribute('id');
        copy.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
        copy.setAttribute('aria-hidden', 'true');
        copy.setAttribute('inert', '');
        copy.inert = true;
        track.appendChild(copy);
        carousel.classList.add('is-enhanced');
        measureLoop();
        syncPlayback();
    }

    function showStaticQuotes() {
        copy?.remove();
        copy = null;
        loopDistance = 0;
        carousel.classList.remove('is-enhanced');
        track.style.removeProperty('--feedback-marquee-distance');
        track.style.removeProperty('--feedback-marquee-duration');
        track.style.removeProperty('--feedback-marquee-min-width');
        syncPlayback();
    }

    carousel.addEventListener('pointerenter', event => {
        if (event.pointerType === 'touch') return;
        hovered = true;
        syncPlayback();
    });
    carousel.addEventListener('pointerleave', () => {
        hovered = false;
        syncPlayback();
    });
    carousel.addEventListener('focusin', () => {
        hasFocus = true;
        syncPlayback();
    });
    carousel.addEventListener('focusout', event => {
        if (carousel.contains(event.relatedTarget)) return;
        hasFocus = false;
        syncPlayback();
    });
    document.addEventListener('visibilitychange', syncPlayback);

    motionPreference.addEventListener('change', () => {
        if (motionPreference.matches) showStaticQuotes();
        else enableMotion();
    });

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => {
            inViewport = entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= 0.15);
            syncPlayback();
        }, { threshold: 0.15 });
        observer.observe(carousel);
    } else {
        const checkVisibility = () => {
            const bounds = carousel.getBoundingClientRect();
            inViewport = bounds.bottom > 0 && bounds.top < window.innerHeight;
            syncPlayback();
        };
        window.addEventListener('scroll', checkVisibility, { passive: true });
        window.addEventListener('resize', checkVisibility);
        checkVisibility();
    }

    const scheduleMeasure = () => {
        if (!copy) return;
        if (resizeFrame !== null) window.cancelAnimationFrame(resizeFrame);
        resizeFrame = window.requestAnimationFrame(() => {
            resizeFrame = null;
            measureLoop();
        });
    };
    window.addEventListener('resize', scheduleMeasure);
    if ('ResizeObserver' in window) {
        const observer = new ResizeObserver(scheduleMeasure);
        observer.observe(viewport);
    }
    if (document.fonts) document.fonts.ready.then(scheduleMeasure);
    enableMotion();
})();

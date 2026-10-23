// A single warm entrance; only a successfully armed headline waits transparently.
(() => {
    const title = document.querySelector('#about .about-headline-return');
    if (!title) return;

    const preference = typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    if (preference?.matches) {
        title.dataset.comebackState = 'reduced';
        return;
    }
    if (!preference || typeof window.IntersectionObserver !== 'function' || typeof title.animate !== 'function') {
        title.dataset.comebackState = 'static';
        return;
    }

    let observer = null;
    let effect = null;
    let played = false;
    let finished = false;
    const animations = [];
    const easeOut = 'cubic-bezier(0.215, 0.61, 0.355, 1)';

    function finish(state) {
        if (finished) return;
        finished = true;
        observer?.disconnect();
        animations.forEach(animation => animation.cancel());
        effect?.remove();
        title.classList.remove('comeback-playing');
        title.dataset.comebackState = state;
        if (preference.removeEventListener) preference.removeEventListener('change', onPreferenceChange);
        else preference.removeListener?.(onPreferenceChange);
    }

    function onPreferenceChange(event) {
        if (event.matches) finish('reduced');
    }

    function animate(element, frames, options) {
        const animation = element.animate(frames, options);
        animations.push(animation);
        return animation;
    }

    function play() {
        if (played || finished) return;
        played = true;
        observer.disconnect();
        if (preference.matches) {
            finish('reduced');
            return;
        }

        try {
            title.dataset.comebackState = 'playing';
            title.classList.add('comeback-playing');
            effect = document.createElement('span');
            effect.className = 'comeback-effect';
            effect.setAttribute('aria-hidden', 'true');
            const halo = document.createElement('span');
            halo.className = 'comeback-halo';
            const sweep = document.createElement('span');
            sweep.className = 'comeback-sweep';
            effect.append(halo, sweep);
            title.appendChild(effect);

            const originalShadow = getComputedStyle(title).textShadow;
            animate(title, [
                { transform: 'translateY(14px) scale(0.84)', filter: 'blur(2px)', opacity: 0, textShadow: originalShadow, offset: 0, easing: easeOut },
                { transform: 'translateY(2px) scale(1.015)', filter: 'blur(0px)', opacity: 1, textShadow: '0 0 12px rgba(255, 220, 153, 0.5)', offset: 0.23, easing: easeOut },
                { transform: 'translateY(-1px) scale(1.055)', filter: 'blur(0px)', opacity: 1, textShadow: '0 0 15px rgba(255, 220, 153, 0.75), 0 0 32px rgba(245, 99, 0, 0.35)', offset: 0.56, easing: easeOut },
                { transform: 'translateY(0px) scale(0.995)', filter: 'blur(0px)', opacity: 1, textShadow: '0 0 10px rgba(255, 220, 153, 0.25)', offset: 0.8, easing: easeOut },
                { transform: 'translateY(0px) scale(1)', filter: 'blur(0px)', opacity: 1, textShadow: originalShadow, offset: 1 },
            ], { duration: 1100, easing: 'linear' });

            animate(halo, [
                { transform: 'scale(0.65)', opacity: 0, offset: 0 },
                { transform: 'scale(1)', opacity: 0.9, offset: 0.34 },
                { transform: 'scale(1.16)', opacity: 0.42, offset: 0.65 },
                { transform: 'scale(1.22)', opacity: 0, offset: 1 },
            ], { duration: 1600, easing: easeOut });

            animate(sweep, [
                { transform: 'translateX(0%) skewX(-16deg)', opacity: 0, offset: 0 },
                { transform: 'translateX(100%) skewX(-16deg)', opacity: 0.65, offset: 0.23 },
                { transform: 'translateX(350%) skewX(-16deg)', opacity: 0.45, offset: 0.72 },
                { transform: 'translateX(480%) skewX(-16deg)', opacity: 0, offset: 1 },
            ], { duration: 1200, delay: 180, easing: 'cubic-bezier(0.42, 0, 0.58, 1)' });

            const points = [
                [5, 20, -0.35, -0.5], [17, 88, -0.25, 0.4],
                [31, 3, -0.1, -0.55], [45, 95, 0.1, 0.4],
                [62, 0, 0.15, -0.6], [78, 90, 0.3, 0.35],
                [94, 16, 0.35, -0.5], [99, 68, 0.35, 0.15],
            ];
            points.forEach(([left, top, x, y], index) => {
                const particle = document.createElement('span');
                particle.className = 'comeback-particle';
                particle.style.left = left + '%';
                particle.style.top = top + '%';
                effect.appendChild(particle);
                animate(particle, [
                    { transform: 'translate(0, 0) scale(0.3)', opacity: 0, offset: 0 },
                    { transform: `translate(${x * 0.25}em, ${y * 0.25}em) scale(1.15)`, opacity: 0.85, offset: 0.25 },
                    { transform: `translate(${x}em, ${y}em) scale(0.45)`, opacity: 0, offset: 1 },
                ], { duration: 900, delay: 250 + index * 35, easing: easeOut });
            });

            Promise.allSettled(animations.map(animation => animation.finished)).then(() => finish('complete'));
        } catch {
            // Unsupported animation details must never affect the readable title.
            finish('static');
        }
    }

    try {
        title.dataset.comebackState = 'armed';
        if (preference.addEventListener) preference.addEventListener('change', onPreferenceChange);
        else preference.addListener?.(onPreferenceChange);
        observer = new window.IntersectionObserver(entries => {
            if (entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= 0.6)) play();
        }, { threshold: 0.6, rootMargin: '0px 0px -8% 0px' });
        observer.observe(title);
    } catch {
        finish('static');
    }
})();
